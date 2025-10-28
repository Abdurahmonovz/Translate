<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Foydalanuvchi ma'lumotlarini saqlash joyi
$usersFile = 'users.json';

// Foydalanuvchilarni yuklash
function loadUsers() {
    global $usersFile;
    if (!file_exists($usersFile)) {
        return [];
    }
    $data = file_get_contents($usersFile);
    return json_decode($data, true) ?: [];
}

// Foydalanuvchilarni saqlash
function saveUsers($users) {
    global $usersFile;
    file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));
}

// Foydalanuvchi ID sini olish
function getUserId() {
    return $_POST['user_id'] ?? $_GET['user_id'] ?? 'default_user';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $userId = $input['user_id'] ?? getUserId();
    
    $users = loadUsers();
    
    switch ($action) {
        case 'get_limit':
            // Foydalanuvchi limitini olish
            if (!isset($users[$userId])) {
                $users[$userId] = [
                    'remainingLimit' => 25,
                    'totalTranslations' => 0,
                    'lastUpdated' => date('Y-m-d H:i:s')
                ];
            }
            
            echo json_encode([
                'success' => true,
                'remainingLimit' => $users[$userId]['remainingLimit'],
                'totalTranslations' => $users[$userId]['totalTranslations']
            ]);
            break;
            
        case 'update_limit':
            // Limitni yangilash
            $newLimit = $input['new_limit'] ?? 25;
            
            if (!isset($users[$userId])) {
                $users[$userId] = [
                    'remainingLimit' => 25,
                    'totalTranslations' => 0,
                    'lastUpdated' => date('Y-m-d H:i:s')
                ];
            }
            
            $users[$userId]['remainingLimit'] = $newLimit;
            $users[$userId]['lastUpdated'] = date('Y-m-d H:i:s');
            
            saveUsers($users);
            
            echo json_encode([
                'success' => true,
                'message' => "Limit $newLimit ga yangilandi",
                'remainingLimit' => $newLimit
            ]);
            break;
            
        case 'use_translation':
            // Tarjima ishlatilganda
            if (!isset($users[$userId])) {
                $users[$userId] = [
                    'remainingLimit' => 25,
                    'totalTranslations' => 0,
                    'lastUpdated' => date('Y-m-d H:i:s')
                ];
            }
            
            if ($users[$userId]['remainingLimit'] > 0) {
                $users[$userId]['remainingLimit']--;
                $users[$userId]['totalTranslations']++;
                $users[$userId]['lastUpdated'] = date('Y-m-d H:i:s');
                
                saveUsers($users);
                
                echo json_encode([
                    'success' => true,
                    'remainingLimit' => $users[$userId]['remainingLimit'],
                    'totalTranslations' => $users[$userId]['totalTranslations']
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Limit tugadi'
                ]);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Noto‘g‘ri amal']);
    }
} else {
    echo json_encode(['error' => 'Faqat POST so\'rovi qabul qilinadi']);
}
?>