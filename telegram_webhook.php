<?php
header('Content-Type: application/json');

// Bot tokeni
$botToken = '8329218024:AAGckU09hFZR2oJ0N9SJd2gGBxV2NmMhFeY';
$apiUrl = "https://api.telegram.org/bot{$botToken}";

// Foydalanuvchi ma'lumotlarini saqlash
$usersFile = 'users.json';

function loadUsers() {
    global $usersFile;
    if (!file_exists($usersFile)) {
        return [];
    }
    $data = file_get_contents($usersFile);
    return json_decode($data, true) ?: [];
}

function saveUsers($users) {
    global $usersFile;
    file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));
}

function sendMessage($chatId, $text, $replyMarkup = null) {
    global $apiUrl;
    
    $data = [
        'chat_id' => $chatId,
        'text' => $text,
        'parse_mode' => 'HTML'
    ];
    
    if ($replyMarkup) {
        $data['reply_markup'] = $replyMarkup;
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl . '/sendMessage');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    
    return $response;
}

// Webhook ma'lumotlarini olish
$update = json_decode(file_get_contents('php://input'), true);

if (isset($update['callback_query'])) {
    $callback = $update['callback_query'];
    $message = $callback['message'];
    $data = $callback['data'];
    $chatId = $callback['from']['id'];
    
    // Foydalanuvchi ID sini message textidan olish
    $messageText = $message['text'];
    preg_match('/👤 Foydalanuvchi ID: <code>(\w+)<\/code>/', $messageText, $matches);
    $userId = $matches[1] ?? 'default_user';
    
    $users = loadUsers();
    
    switch ($data) {
        case 'open_50_limit':
            if (!isset($users[$userId])) {
                $users[$userId] = [
                    'remainingLimit' => 50,
                    'totalTranslations' => 0,
                    'lastUpdated' => date('Y-m-d H:i:s')
                ];
            } else {
                $users[$userId]['remainingLimit'] = 50;
                $users[$userId]['lastUpdated'] = date('Y-m-d H:i:s');
            }
            
            saveUsers($users);
            
            // Adminga javob
            sendMessage($chatId, "✅ Foydalanuvchi limiti 50 taga yangilandi!\n\n👤 Foydalanuvchi ID: <code>{$userId}</code>\n📊 Yangi limit: 50 ta\n⏰ Vaqt: " . date('Y-m-d H:i:s'));
            
            break;
            
        case 'open_100_limit':
            if (!isset($users[$userId])) {
                $users[$userId] = [
                    'remainingLimit' => 100,
                    'totalTranslations' => 0,
                    'lastUpdated' => date('Y-m-d H:i:s')
                ];
            } else {
                $users[$userId]['remainingLimit'] = 100;
                $users[$userId]['lastUpdated'] = date('Y-m-d H:i:s');
            }
            
            saveUsers($users);
            
            // Adminga javob
            sendMessage($chatId, "✅ Foydalanuvchi limiti 100 taga yangilandi!\n\n👤 Foydalanuvchi ID: <code>{$userId}</code>\n📊 Yangi limit: 100 ta\n⏰ Vaqt: " . date('Y-m-d H:i:s'));
            break;
            
        case 'reject_limit':
            sendMessage($chatId, "❌ Limit ochish rad etildi.\n\n👤 Foydalanuvchi ID: <code>{$userId}</code>");
            break;
    }
    
    // Callback query javobi
    $response = [
        'callback_query_id' => $callback['id'],
        'text' => 'Amal bajarildi'
    ];
    
    echo json_encode($response);
}
?>