<?php
require 'config.php';
$token = $_GET['token'];
$res = $conn->query("SELECT * FROM usuarios WHERE reset_token='$token' AND token_expira > NOW()");
if ($res->num_rows == 1) {
    if ($_POST) {
        $senha = password_hash($_POST['nova_senha'], PASSWORD_BCRYPT);
        $conn->query("UPDATE usuarios SET senha_hash='$senha', reset_token=NULL, token_expira=NULL WHERE reset_token='$token'");
        echo "Senha atualizada com sucesso.";
    } else {
        echo "<form method='post'><input name='nova_senha'><button>Redefinir</button></form>";
    }
} else {
    echo "Token inválido ou expirado.";
}
?>
