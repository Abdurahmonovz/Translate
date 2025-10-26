<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $text = $input['text'] ?? '';
    $sourceLang = $input['sourceLang'] ?? 'uz';
    $targetLang = $input['targetLang'] ?? 'en';
    
    if (empty($text)) {
        echo json_encode(['error' => 'Matn kiritilmagan']);
        exit;
    }
    
    // Google Translate API
    $url = "https://translate.googleapis.com/translate_a/single";
    $params = [
        'client' => 'gtx',
        'sl' => $sourceLang,
        'tl' => $targetLang,
        'dt' => 't',
        'q' => $text
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url . '?' . http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        if ($data && isset($data[0])) {
            $translatedText = '';
            foreach ($data[0] as $translation) {
                $translatedText .= $translation[0];
            }
            
            echo json_encode([
                'success' => true,
                'translatedText' => $translatedText,
                'sourceLang' => $sourceLang,
                'targetLang' => $targetLang
            ]);
        } else {
            echo json_encode(['error' => 'Tarjima muvaffaqiyatsiz']);
        }
    } else {
        echo json_encode(['error' => 'API xatosi']);
    }
} else {
    echo json_encode(['error' => 'Faqat POST so\'rovi qabul qilinadi']);
}
?>