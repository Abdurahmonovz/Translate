<?php
$botToken = '8329218024:AAGckU09hFZR2oJ0N9SJd2gGBxV2NmMhFeY';
$webhookUrl = 'https://SIZNING_DOMAININGIZ.com/tarjima_bot/telegram_webhook.php';

$url = "https://api.telegram.org/bot{$botToken}/setWebhook?url={$webhookUrl}";

$response = file_get_contents($url);
echo $response;
?>