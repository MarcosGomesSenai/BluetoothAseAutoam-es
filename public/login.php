<?php
require 'config.php';
$erro = '';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email = $_POST["email"];
    $senha = $_POST["senha"];

    $stmt = $conn->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 1) {
        $usuario = $res->fetch_assoc();
        if (password_verify($senha, $usuario["senha_hash"])) {
            $_SESSION["usuario_id"] = $usuario["id"];
            $_SESSION["nome"] = $usuario["nome"];
            $_SESSION["nivel"] = $usuario["nivel"];
            header("Location: painel.php");
            exit;
        }
    }
    $erro = "Usuário ou senha inválidos!";
}
?>

<!DOCTYPE html>
<html>
<head><title>Login</title></head>
<body>
<h2>Login</h2>
<form method="post">
  Email: <input type="email" name="email"><br>
  Senha: <input type="password" name="senha"><br>
  <button type="submit">Entrar</button>
</form>
<?php if ($erro) echo "<p>$erro</p>"; ?>
</body>
</html>
