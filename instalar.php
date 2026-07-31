<?php
$passo = 1;
require 'config.php';

try {
    $conn->query("SELECT 1 FROM usuarios LIMIT 1");
    echo "✅ Tabelas já existem.<br>";
    $passo++;
} catch (Exception $e) {
    echo "⚙️ Criando tabelas...<br>";
    $sql = file_get_contents('banco.sql');
    $conn->multi_query($sql);
    echo "✅ Tabelas criadas!<br>";
}

if ($passo == 2) echo "<a href='index.php'>Ir para login</a>";
?>
