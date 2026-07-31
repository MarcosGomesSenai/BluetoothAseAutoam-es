<?php
require 'config.php';
if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}
