<?php
require 'config.php';
$query = $conn->query("
    SELECT DATE(data_hora) as dia, COUNT(*) as total
    FROM logs_acesso
    GROUP BY DATE(data_hora)
    ORDER BY dia DESC LIMIT 10
");

$data = [];
while ($row = $query->fetch_assoc()) {
    $data[] = $row;
}
echo json_encode($data);
