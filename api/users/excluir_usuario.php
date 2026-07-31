<?php
require 'session_check.php';
if ($_SESSION['nivel'] != 'admin') exit("Acesso negado");

require 'config.php';

if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $conn->query("DELETE FROM usuarios WHERE id = $id");
    echo "Usuário excluído.";
    echo "<br><a href='lista_usuarios.php'>Voltar</a>";
}
