<?php
require 'session_check.php';
require 'config.php';

// Aqui você pode futuramente mandar o comando via serial ou API Python

$stmt = $pdo->prepare("INSERT INTO logs_acesso (usuario_id, acao, origem) VALUES (?, 'Portão Aberto', 'web')");
$stmt->execute([$_SESSION['usuario_id']]);

echo "Portão aberto!";
?>
