<?php
require 'session_check.php';
if ($_SESSION['nivel'] != 'admin') exit("Acesso negado");

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    require 'config.php';
    $nome = $_POST["nome"];
    $email = $_POST["email"];
    $senha = password_hash($_POST["senha"], PASSWORD_BCRYPT);
    $nivel = $_POST["nivel"];

    $stmt = $conn->prepare("INSERT INTO usuarios (nome, email, senha_hash, nivel) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $nome, $email, $senha, $nivel);
    $stmt->execute();
    echo "Usuário cadastrado com sucesso.";
}
?>

<form method="post">
  Nome: <input name="nome"><br>
  Email: <input name="email"><br>
  Senha: <input type="password" name="senha"><br>
  Nível: 
  <select name="nivel">
    <option value="operador">Operador</option>
    <option value="admin">Administrador</option>
  </select><br>
  <button type="submit">Cadastrar</button>
</form>
