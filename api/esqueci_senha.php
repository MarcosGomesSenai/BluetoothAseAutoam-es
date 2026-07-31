<?php
require 'config.php';
$email = $_POST['email'];
$token = bin2hex(random_bytes(32));
$expira = date('Y-m-d H:i:s', strtotime('+1 hour'));

$conn->query("UPDATE usuarios SET reset_token='$token', token_expira='$expira' WHERE email='$email'");

// Simples (troque pelo PHPMailer em produção)
mail($email, "Recuperar senha", "Clique aqui: http://seusite.com/resetar.php?token=$token");
echo "Email de recuperação enviado!";
?>
