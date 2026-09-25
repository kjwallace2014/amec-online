<?php

require_once __DIR__ . '/../core/config.php';
require_once __DIR__ . '/../core/api.php';
require_once __DIR__ . '/../core/auth.php';

header('Content-Type: application/json; charset=utf-8');

requireAdmin();

try {

    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        listResults($pdo);
        exit;
    }

	if ($action === 'get') {
		getResult($pdo);
		exit;
	}

	if ($action === 'delete') {
		deleteResult($pdo);
		exit;
	}
	
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid action.'
    ]);

} catch (Throwable $e) {

    error_log(
        'Level test admin results error: ' .
        $e->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Server error.'
    ]);
}

function listResults(PDO $pdo): void{
    $stmt = $pdo->query("
        SELECT
            id,
            name,
            email,
            level,
            score,
            max_score,
            passed,
            created_at
        FROM level_test_attempts
        ORDER BY created_at DESC, id DESC
    ");

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($results as &$result) {
        $result['id'] = (int) $result['id'];
        $result['level'] = (int) $result['level'];
        $result['score'] = (int) $result['score'];
        $result['max_score'] = (int) $result['max_score'];
        $result['passed'] = (bool) $result['passed'];
    }

    unset($result);

    echo json_encode([
        'success' => true,
        'results' => $results
    ]);
}

function getResult(PDO $pdo): void{
    $id = filter_input(
        INPUT_GET,
        'id',
        FILTER_VALIDATE_INT
    );

    if (!$id) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid attempt ID.'
        ]);

        return;
    }


    /*
    |--------------------------------------------------------------------------
    | ATTEMPT
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT
            id,
            name,
            email,
            level,
            score,
            max_score,
            passed,
            answers,
            created_at
        FROM level_test_attempts
        WHERE id = :id
        LIMIT 1
    ");

    $stmt->execute([
        ':id' => $id
    ]);

    $attempt = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$attempt) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Attempt not found.'
        ]);

        return;
    }


    $attempt['id'] = (int) $attempt['id'];
    $attempt['level'] = (int) $attempt['level'];
    $attempt['score'] = (int) $attempt['score'];
    $attempt['max_score'] = (int) $attempt['max_score'];
    $attempt['passed'] = (bool) $attempt['passed'];


    /*
    |--------------------------------------------------------------------------
    | STUDENT ANSWERS
    |--------------------------------------------------------------------------
    */

    $answers = [];

    if (!empty($attempt['answers'])) {

        $decoded = json_decode(
            $attempt['answers'],
            true
        );

        if (is_array($decoded)) {
            $answers = $decoded;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | PROGRESSION
    |--------------------------------------------------------------------------
    |
    | The adaptive test stores each level as a separate row.
    | We therefore retrieve all attempts for this student's
    | name/email combination.
    |
    */

    $progressStmt = $pdo->prepare("
        SELECT
            id,
            name,
            email,
            level,
            score,
            max_score,
            passed,
            created_at
        FROM level_test_attempts
        WHERE LOWER(email) = LOWER(:email)
        ORDER BY created_at ASC, id ASC
    ");

    $progressStmt->execute([
        ':email' => $attempt['email']
    ]);

    $progression = $progressStmt->fetchAll(
        PDO::FETCH_ASSOC
    );

    foreach ($progression as &$item) {
        $item['id'] = (int) $item['id'];
        $item['level'] = (int) $item['level'];
        $item['score'] = (int) $item['score'];
        $item['max_score'] = (int) $item['max_score'];
        $item['passed'] = (bool) $item['passed'];
    }

    unset($item);


    /*
    |--------------------------------------------------------------------------
    | QUESTIONS
    |--------------------------------------------------------------------------
    */

    $questionStmt = $pdo->prepare("
        SELECT
            id,
            level,
            sort_order,
            question_type,
            prompt,
            correct_answer,
            points
        FROM level_test_questions
        WHERE level = :level
        ORDER BY sort_order ASC
    ");

    $questionStmt->execute([
        ':level' => $attempt['level']
    ]);

    $questions = $questionStmt->fetchAll(
        PDO::FETCH_ASSOC
    );


    /*
    |--------------------------------------------------------------------------
    | QUESTION BREAKDOWN
    |--------------------------------------------------------------------------
    */

    $details = [];

    foreach ($questions as $question) {

        $questionId = (int) $question['id'];

        $yourAnswer =
            array_key_exists(
                $questionId,
                $answers
            )
                ? $answers[$questionId]
                : null;

        /*
        |--------------------------------------------------------------------------
        | Reproduce the same grading rules used by level_test.php.
        |--------------------------------------------------------------------------
        |
        | The admin result page needs the points earned. Rather than
        | trusting the stored result JSON, we calculate the displayed
        | question score from the stored answer and current question.
        |
        */

        $pointsPossible =
            (int) $question['points'];

        $pointsEarned =
            calculateAdminPoints(
                $question['question_type'],
                $yourAnswer,
                json_decode(
                    $question['correct_answer'],
                    true
                ),
                $pointsPossible
            );

        $details[] = [
            'question_id' => $questionId,
            'sort_order' => (int) $question['sort_order'],
            'type' => $question['question_type'],
            'prompt' => $question['prompt'],
            'points_earned' => $pointsEarned,
            'points_possible' => $pointsPossible,
            'your_answer' => $yourAnswer,
            'correct_answer' => json_decode(
                $question['correct_answer'],
                true
            )
        ];
    }


    echo json_encode([
        'success' => true,
        'attempt' => $attempt,
        'progression' => $progression,
        'details' => $details
    ]);
}

function deleteResult(PDO $pdo): void{
    $id = filter_input(
        INPUT_GET,
        'id',
        FILTER_VALIDATE_INT
    );

    if (!$id) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid attempt ID.'
        ]);

        return;
    }

    $stmt = $pdo->prepare("
        DELETE FROM level_test_attempts
        WHERE id = :id
    ");

    $stmt->execute([
        ':id' => $id
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Attempt not found.'
        ]);

        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Result deleted successfully.'
    ]);
}

function calculateAdminPoints(string $type, mixed $answer, mixed $correct, int $points): int {

    if ($points <= 0) {
        return 0;
    }


    /*
    |--------------------------------------------------------------------------
    | SINGLE CHOICE
    |--------------------------------------------------------------------------
    */

    if ($type === 'single_choice') {

        return (
            (string) $answer ===
            (string) $correct
        )
            ? $points
            : 0;
    }


    /*
    |--------------------------------------------------------------------------
    | MULTIPLE CHOICE
    |--------------------------------------------------------------------------
    */

    if ($type === 'multiple_choice') {

        if (!is_array($answer) || !is_array($correct)) {
            return 0;
        }

        $answer = array_map(
            'strval',
            $answer
        );

        $correct = array_map(
            'strval',
            $correct
        );

        sort($answer);
        sort($correct);

        return $answer === $correct
            ? $points
            : 0;
    }


    /*
    |--------------------------------------------------------------------------
    | FILL BLANK ALTERNATIVES
    |--------------------------------------------------------------------------
    */

    if ($type === 'fill_blank_alternatives') {

        if (
            !is_array($answer) ||
            !is_array($correct)
        ) {
            return 0;
        }

        foreach ($correct as $alternative) {

            if (!is_array($alternative)) {
                continue;
            }

            if (
                count($answer) !==
                count($alternative)
            ) {
                continue;
            }

            $matched = true;

            foreach ($answer as $index => $value) {

                if (
                    !is_string($value) ||
                    !is_string(
                        $alternative[$index] ?? null
                    )
                ) {
                    $matched = false;
                    break;
                }

                if (
                    normalizeAdminText($value) !==
                    normalizeAdminText(
                        $alternative[$index]
                    )
                ) {
                    $matched = false;
                    break;
                }
            }

            if ($matched) {
                return $points;
            }
        }

        return 0;
    }


    /*
    |--------------------------------------------------------------------------
    | ORDERED / UNORDERED FILL BLANKS
    |--------------------------------------------------------------------------
    */

    if (
        $type === 'fill_blank_ordered' ||
        $type === 'fill_blank_unordered'
    ) {

        if (
            !is_array($answer) ||
            !is_array($correct) ||
            !$correct
        ) {
            return 0;
        }

        $total = count($correct);
        $earned = 0;

        if ($type === 'fill_blank_ordered') {

            foreach ($correct as $index => $expected) {

                if (
                    isset($answer[$index]) &&
                    normalizeAdminText(
                        $answer[$index]
                    ) ===
                    normalizeAdminText(
                        $expected
                    )
                ) {
                    $earned++;
                }
            }

        } else {

            $remaining = array_map(
                'normalizeAdminText',
                $correct
            );

            foreach ($answer as $value) {

                $value =
                    normalizeAdminText($value);

                $found = array_search(
                    $value,
                    $remaining,
                    true
                );

                if ($found !== false) {
                    $earned++;
                    unset($remaining[$found]);
                }
            }
        }

        return (int) round(
            $points *
            ($earned / $total)
        );
    }


    /*
    |--------------------------------------------------------------------------
    | DRAG AND DROP
    |--------------------------------------------------------------------------
    */

    if ($type === 'drag_drop') {

        if (
            !is_array($answer) ||
            !is_array($correct)
        ) {
            return 0;
        }

        $possible = 0;
        $earned = 0;

        foreach ($correct as $zone => $items) {

            if (!is_array($items)) {
                continue;
            }

            foreach ($items as $item) {

                $possible++;

                $studentItems =
                    $answer[$zone] ?? [];

                if (
                    is_array($studentItems) &&
                    in_array(
                        $item,
                        $studentItems,
                        true
                    )
                ) {
                    $earned++;
                }
            }
        }

        if ($possible === 0) {
            return 0;
        }

        return (int) round(
            $points *
            ($earned / $possible)
        );
    }


    /*
    |--------------------------------------------------------------------------
    | HOTSPOT
    |--------------------------------------------------------------------------
    */

    if ($type === 'hotspot') {

        if (
            !is_array($answer) ||
            !is_array($correct)
        ) {
            return 0;
        }

        if (
            isset(
                $answer['x'],
                $answer['y']
            )
        ) {
            return isClickInsideAdminRegion(
                $answer,
                $correct
            )
                ? $points
                : 0;
        }

        return 0;
    }


    /*
    |--------------------------------------------------------------------------
    | HOTSPOT MULTI
    |--------------------------------------------------------------------------
    */

    if ($type === 'hotspot_multi') {

        if (
            !is_array($answer) ||
            !is_array($correct) ||
            !$correct
        ) {
            return 0;
        }

        $earned = 0;

        foreach ($answer as $click) {

            if (!is_array($click)) {
                continue;
            }

            foreach ($correct as $region) {

                if (
                    isClickInsideAdminRegion(
                        $click,
                        $region
                    )
                ) {
                    $earned++;
                    break;
                }
            }
        }

        $earned = min(
            $earned,
            count($correct)
        );

        return (int) round(
            $points *
            ($earned / count($correct))
        );
    }


    return 0;
}

function normalizeAdminText(mixed $value): string{$value = trim(mb_strtolower((string) $value, 'UTF-8')
    );

    return preg_replace(
        '/\s+/',
        ' ',
        $value
    );
}

function isClickInsideAdminRegion(array $click, array $region): bool {

    if (
        !isset(
            $click['x'],
            $click['y'],
            $region['x'],
            $region['y'],
            $region['width'],
            $region['height']
        )
    ) {
        return false;
    }

    $x = (float) $click['x'];
    $y = (float) $click['y'];

    $left = (float) $region['x'];
    $top = (float) $region['y'];

    $right =
        $left +
        (float) $region['width'];

    $bottom =
        $top +
        (float) $region['height'];

    return (
        $x >= $left &&
        $x <= $right &&
        $y >= $top &&
        $y <= $bottom
    );
}