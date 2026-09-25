<?php

require_once __DIR__ . '/../core/config.php';
require_once __DIR__ . '/../core/api.php';

header('Content-Type: application/json');

const PASS_RATIO = 0.6;
const MAX_LEVEL = 5;

const FUZZY_TOLERANCE = 1;

$method = $_SERVER['REQUEST_METHOD'];
$data = [];

if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
} else {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $data['action'] ?? '';
}

switch ($action) {

    case 'get_questions':
        getQuestions($pdo, (int) ($_GET['level'] ?? 1));
        break;

    case 'submit_level':
        submitLevel($pdo, $data);
        break;

    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}

function getQuestions(PDO $pdo, int $level): void {
    if ($level < 1 || $level > MAX_LEVEL) {
        jsonResponse(['success' => false, 'message' => 'Invalid level'], 400);
    }

    $stmt = $pdo->prepare("
        SELECT id, level, sort_order, question_type, prompt, image_path, options, correct_answer, points
        FROM level_test_questions
        WHERE level = :level
        ORDER BY sort_order
    ");
    $stmt->execute([':level' => $level]);
    $questions = $stmt->fetchAll();

    foreach ($questions as &$q) {
        $q['options'] = $q['options'] !== null && $q['options'] !== ''
            ? json_decode($q['options'], true)
            : null;

        if (in_array($q['question_type'], ['fill_blank_ordered', 'fill_blank_unordered', 'fill_blank_alternatives'], true)) {
            $q['blank_count'] = substr_count($q['prompt'], '___');
        }

        if ($q['question_type'] === 'hotspot' && isset($q['options']['hotspot'])) {
            unset($q['options']['hotspot']);
        }

        unset($q['correct_answer']);
    }

    jsonResponse([
        'success'        => true,
        'level'          => $level,
        'is_final_level' => $level >= MAX_LEVEL,
        'questions'      => $questions
    ]);
}

function submitLevel(PDO $pdo, array $data): void {
    $name    = trim($data['name'] ?? '');
    $email   = trim($data['email'] ?? '');
    $level   = (int) ($data['level'] ?? 0);
    $answers = $data['answers'] ?? [];

    if (empty($name) || empty($email) || $level < 1 || $level > MAX_LEVEL) {
        jsonResponse([
            'success' => false,
            'message' => 'Missing name, email, or invalid level'
        ], 400);
    }

    $stmt = $pdo->prepare("
        SELECT id, sort_order, question_type, prompt, correct_answer, points
        FROM level_test_questions
        WHERE level = :level
        ORDER BY sort_order
    ");
    $stmt->execute([':level' => $level]);
    $questions = $stmt->fetchAll();

    if (!$questions) {
        jsonResponse([
            'success' => false,
            'message' => 'No questions found for this level'
        ], 404);
    }

    $score = 0;
    $maxScore = 0;
    $scoringDetails = [];

    error_log('');
    error_log('============================================================');
    error_log('LEVEL TEST SCORING START');
    error_log('Level: ' . $level);
    error_log('Name: ' . $name);
    error_log('Email: ' . $email);
    error_log('============================================================');

    foreach ($questions as $index => $q) {

        $questionNumber = $index + 1;
        $points = (int) $q['points'];
        $maxScore += $points;

        $correctAnswer = json_decode($q['correct_answer'], true);
        $userAnswer = $answers[$q['id']] ?? null;
        $blankCount = substr_count($q['prompt'], '___');

        $earnedPoints = gradeQuestion(
            $q['question_type'],
            $correctAnswer,
            $userAnswer,
            $points,
            $blankCount
        );

        $score += $earnedPoints;

        $percentage = $points > 0
            ? ($earnedPoints / $points) * 100
            : 0;

        $scoringDetails[] = [
            'question_number' => $questionNumber,
            'question_id'     => (int) $q['id'],
            'type'            => $q['question_type'],
            'prompt'          => $q['prompt'],
            'user_answer'     => $userAnswer,
            'correct_answer'  => $correctAnswer,
            'points_available'=> $points,
            'points_awarded'  => round($earnedPoints, 4),
            'percentage'      => round($percentage, 2)
        ];

        error_log(
            '[Q' . $questionNumber . '] ' .
            'ID=' . $q['id'] .
            ' | TYPE=' . $q['question_type'] .
            ' | POINTS=' . $points .
            ' | AWARDED=' . round($earnedPoints, 4) .
            ' | PERCENT=' . round($percentage, 2) . '%'
        );

        error_log(
            '[Q' . $questionNumber . '] PROMPT: ' .
            $q['prompt']
        );

        error_log(
            '[Q' . $questionNumber . '] USER: ' .
            json_encode(
                $userAnswer,
                JSON_UNESCAPED_UNICODE |
                JSON_UNESCAPED_SLASHES
            )
        );

        error_log(
            '[Q' . $questionNumber . '] CORRECT: ' .
            json_encode(
                $correctAnswer,
                JSON_UNESCAPED_UNICODE |
                JSON_UNESCAPED_SLASHES
            )
        );

        error_log('------------------------------------------------------------');
    }

    $score = (int) round($score);

    $passed = $maxScore > 0 &&
        ($score / $maxScore) >= PASS_RATIO;

    $percentage = $maxScore > 0
        ? ($score / $maxScore) * 100
        : 0;

    error_log('============================================================');
    error_log('LEVEL TEST FINAL RESULT');
    error_log('Level: ' . $level);
    error_log('Score: ' . $score);
    error_log('Max Score: ' . $maxScore);
    error_log('Percentage: ' . round($percentage, 2) . '%');
    error_log('Pass Ratio Required: ' . (PASS_RATIO * 100) . '%');
    error_log('Passed: ' . ($passed ? 'YES' : 'NO'));
    error_log('============================================================');
    error_log('');

    $insert = $pdo->prepare("
        INSERT INTO level_test_attempts
            (name, email, level, score, max_score, passed, answers)
        VALUES
            (:name, :email, :level, :score, :max_score, :passed, :answers)
    ");

    $insert->execute([
        ':name'      => $name,
        ':email'     => $email,
        ':level'     => $level,
        ':score'     => $score,
        ':max_score' => $maxScore,
        ':passed'    => $passed ? 'true' : 'false',
        ':answers'   => json_encode($answers),
    ]);

    $nextLevel = ($passed && $level < MAX_LEVEL)
        ? $level + 1
        : null;

    jsonResponse([
        'success'         => true,
        'level'           => $level,
        'score'           => $score,
        'max_score'       => $maxScore,
        'percentage'      => round($percentage, 2),
        'passed'          => $passed,
        'next_level'      => $nextLevel,
        'is_final'        => $nextLevel === null,
        'scoring_details' => $scoringDetails
    ]);
}

function gradeQuestion(string $type, $correct, $user, int $points, int $blankCount): float {

    if ($user === null) {
        return 0;
    }

    switch ($type) {

        case 'single_choice': {
            return (string) $user === (string) $correct ? $points : 0;
        }

        case 'multiple_choice': {
            $correctSet = array_map('strval', (array) $correct);
            $userSet    = array_map('strval', (array) $user);
            sort($correctSet);
            sort($userSet);
            return $correctSet === $userSet ? $points : 0;
        }

        case 'hotspot': {
            return isClickInRegion($user[0] ?? $user, $correct) ? $points : 0;
        }

        case 'hotspot_multi': {
            $regions = (array) $correct;
            $clicks  = (array) $user;
            $total = count($regions);
            if ($total === 0) return 0;

            $matched = [];
            foreach ($clicks as $click) {
                foreach ($regions as $i => $region) {
                    if (in_array($i, $matched, true)) continue;
                    if (isClickInRegion($click, $region)) {
                        $matched[] = $i;
                        break;
                    }
                }
            }
            return $points * (count($matched) / $total);
        }

        case 'fill_blank_ordered': {
            $correctList = array_values((array) $correct);
            $userList    = array_values((array) $user);
            $total = count($correctList);
            if ($total === 0) return 0;

            $matched = 0;
            foreach ($correctList as $i => $word) {
                if (isFuzzyMatch($userList[$i] ?? '', $word)) {
                    $matched++;
                }
            }
            return $points * ($matched / $total);
        }

        case 'fill_blank_unordered': {
            $pool = array_values((array) $correct);
            $userList = array_values((array) $user);
            if ($blankCount === 0) return 0;

            $matchedKeys = [];
            foreach ($userList as $u) {
                foreach ($pool as $key => $word) {
                    if (in_array($key, $matchedKeys, true)) continue;
                    if (isFuzzyMatch($u, $word)) {
                        $matchedKeys[] = $key;
                        break;
                    }
                }
            }
            return $points * (min(count($matchedKeys), $blankCount) / $blankCount);
        }

        case 'fill_blank_alternatives': {
            $userList = array_values((array) $user);

            foreach ((array) $correct as $alternative) {
                $pool = array_values((array) $alternative);
                $matchedKeys = [];

                foreach ($userList as $u) {
                    foreach ($pool as $key => $word) {
                        if (in_array($key, $matchedKeys, true)) continue;
                        if (isFuzzyMatch($u, $word)) {
                            $matchedKeys[] = $key;
                            break;
                        }
                    }
                }

                if (count($matchedKeys) === count($pool)) {
                    return $points;
                }
            }
            return 0;
        }

        case 'drag_drop': {
            $totalItems = 0;
            $correctItems = 0;

            foreach ((array) $correct as $zoneId => $items) {
                $correctSet = array_map('normalizeText', (array) $items);
                $userSet    = array_map('normalizeText', (array) ($user[$zoneId] ?? []));
                $totalItems += count($correctSet);
                foreach ($correctSet as $item) {
                    $idx = array_search($item, $userSet, true);
                    if ($idx !== false) {
                        $correctItems++;
                        unset($userSet[$idx]);
                    }
                }
            }

            if ($totalItems === 0) return 0;
            return $points * ($correctItems / $totalItems);
        }

        default:
            return 0;
    }
}

function isClickInRegion($click, $region): bool {
    if (!is_array($click) || !is_array($region)) return false;
    $x = (float) ($click['x'] ?? -1);
    $y = (float) ($click['y'] ?? -1);
    return $x >= $region['x'] && $x <= ($region['x'] + $region['width'])
        && $y >= $region['y'] && $y <= ($region['y'] + $region['height']);
}

function isFuzzyMatch($userWord, string $correctWord): bool {
    $userWord = normalizeText($userWord);
    $correctWord = normalizeText($correctWord);
    if ($userWord === '') return false;
    return levenshtein($userWord, $correctWord) <= FUZZY_TOLERANCE;
}

function normalizeText($value): string {
    return strtolower(trim((string) $value));
}