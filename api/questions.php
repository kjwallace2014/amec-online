<?php

require_once __DIR__ . '/../core/config.php';
require_once __DIR__ . '/../core/api.php';
require_once __DIR__ . '/../core/auth.php';

header('Content-Type: application/json');

requireAdmin();

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $data['action'] ?? ($_GET['action'] ?? '');

switch ($action) {

    case 'list':
        listQuestions($pdo);
        break;

    case 'get':
        getQuestion($pdo, $data ?: $_GET);
        break;

    case 'create':
        saveQuestion($pdo, $data, null);
        break;

    case 'update':
        saveQuestion($pdo, $data, (int) ($data['id'] ?? 0));
        break;

    case 'delete':
        deleteQuestion($pdo, $data);
        break;

    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}

function listQuestions(PDO $pdo): void {
    $stmt = $pdo->query("
        SELECT id, level, sort_order, question_type, prompt, points
        FROM level_test_questions
        ORDER BY level, sort_order
    ");
    jsonResponse(['success' => true, 'questions' => $stmt->fetchAll()]);
}

function getQuestion(PDO $pdo, array $params): void {
    if (empty($params['id'])) {
        jsonResponse(['success' => false, 'message' => 'Missing question ID'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM level_test_questions WHERE id = :id");
    $stmt->execute([':id' => (int) $params['id']]);
    $q = $stmt->fetch();

    if (!$q) {
        jsonResponse(['success' => false, 'message' => 'Question not found'], 404);
    }

    $q['options'] = $q['options'] !== null && $q['options'] !== '' ? json_decode($q['options'], true) : null;
    $q['correct_answer'] = json_decode($q['correct_answer'], true);

    jsonResponse(['success' => true, 'question' => $q]);
}

function saveQuestion(PDO $pdo, array $data, ?int $id): void {
    $required = ['level', 'sort_order', 'question_type', 'prompt', 'points', 'correct_answer'];
    foreach ($required as $field) {
        if (!array_key_exists($field, $data) || $data[$field] === '' || $data[$field] === null) {
            jsonResponse(['success' => false, 'message' => "Missing field: $field"], 400);
        }
    }

    $level = (int) $data['level'];
    $sortOrder = (int) $data['sort_order'];
    $type = trim($data['question_type']);
    $prompt = trim($data['prompt']);
    $points = (int) $data['points'];
    $imagePath = !empty($data['image_path']) ? trim($data['image_path']) : null;
    $options = array_key_exists('options', $data) && $data['options'] !== null
        ? json_encode($data['options'])
        : null;
    $correctAnswer = json_encode($data['correct_answer']);

    if ($id) {
        $stmt = $pdo->prepare("
            UPDATE level_test_questions SET
                level = :level, sort_order = :sort_order, question_type = :type,
                prompt = :prompt, image_path = :image_path, options = :options,
                correct_answer = :correct_answer, points = :points
            WHERE id = :id
        ");
        $stmt->execute([
            ':id' => $id, ':level' => $level, ':sort_order' => $sortOrder, ':type' => $type,
            ':prompt' => $prompt, ':image_path' => $imagePath, ':options' => $options,
            ':correct_answer' => $correctAnswer, ':points' => $points
        ]);
        jsonResponse(['success' => true, 'id' => $id, 'message' => 'Question updated']);
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO level_test_questions (level, sort_order, question_type, prompt, image_path, options, correct_answer, points)
            VALUES (:level, :sort_order, :type, :prompt, :image_path, :options, :correct_answer, :points)
            RETURNING id
        ");
        $stmt->execute([
            ':level' => $level, ':sort_order' => $sortOrder, ':type' => $type,
            ':prompt' => $prompt, ':image_path' => $imagePath, ':options' => $options,
            ':correct_answer' => $correctAnswer, ':points' => $points
        ]);
        jsonResponse(['success' => true, 'id' => $stmt->fetchColumn(), 'message' => 'Question created']);
    }
}

function deleteQuestion(PDO $pdo, array $data): void {
    if (empty($data['id'])) {
        jsonResponse(['success' => false, 'message' => 'Missing question ID'], 400);
    }
    $stmt = $pdo->prepare("DELETE FROM level_test_questions WHERE id = :id");
    $stmt->execute([':id' => (int) $data['id']]);
    jsonResponse(['success' => true, 'message' => 'Question deleted']);
}