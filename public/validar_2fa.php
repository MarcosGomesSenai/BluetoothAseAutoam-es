<?php
session_start();
if ($_POST['codigo'] == $_SESSION['2fa']) {
    $_SESSION['autenticado'] = true;
    echo "Autenticado!";
} else {
    echo "Código incorreto!";
}
?>
<form method="post">
  <input name="codigo">
  <button>Validar</button>
</form>
