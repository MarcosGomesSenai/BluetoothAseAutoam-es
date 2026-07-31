<?php
require 'session_check.php';
if ($_SESSION['nivel'] != 'admin') exit("Acesso negado");

require 'config.php';

if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $res = $conn->query("SELECT * FROM usuarios WHERE id = $id");
    $user = $res->fetch_assoc();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = $_POST['nome'];
    $email = $_POST['email'];
    $nivel = $_POST['nivel'];
    $id = intval($_POST['id']);

    $conn->query("UPDATE usuarios SET nome='$nome', email='$email', nivel='$nivel' WHERE id=$id");
    echo "Usuário atualizado com sucesso.";
    exit;
}
?>

<form method="post">
  <input type="hidden" name="id" value="<?= $user['id'] ?>">
  Nome: <input name="nome" value="<?= $user['nome'] ?>"><br>
  Email: <input name="email" value="<?= $user['email'] ?>"><br>
  Nível:
  <select name="nivel">
    <option value="operador" <?= $user['nivel'] == 'operador' ? 'selected' : '' ?>>Operador</option>
    <option value="admin" <?= $user['nivel'] == 'admin' ? 'selected' : '' ?>>Administrador</option>
  </select><br>
  <button type="submit">Salvar</button>
</form>
