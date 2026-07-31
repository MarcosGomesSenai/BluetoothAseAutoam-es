<?php
require 'session_check.php';
if ($_SESSION['nivel'] != 'admin') exit("Acesso negado");

require 'config.php';
$res = $conn->query("SELECT id, nome, email, nivel FROM usuarios");
while ($user = $res->fetch_assoc()) {
    echo "<p>{$user['nome']} ({$user['email']}) - {$user['nivel']} 
        <a href='editar_usuario.php?id={$user['id']}'>Editar</a> | 
        <a href='excluir_usuario.php?id={$user['id']}'>Excluir</a></p>";
}
