<?php
require 'session_check.php';
require 'config.php';
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>Painel de Controle – Portão</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">

<div class="container mt-5">
  <div class="card shadow p-4">
    <h2>Bem-vindo, <?= $_SESSION['nome'] ?> 👋</h2>
    <hr>
    <div class="mb-3">
      <button id="abrirBtn" class="btn btn-success">🔓 Abrir Portão</button>
      <a href="logout.php" class="btn btn-outline-secondary">Sair</a>
    </div>

    <div id="mensagem" class="alert d-none"></div>

    <h4 class="mt-4">📜 Logs Recentes</h4>
    <table class="table table-striped mt-2" id="logsTable">
      <thead>
        <tr>
          <th>Data/Hora</th>
          <th>Ação</th>
          <th>Origem</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<script>
  const usuario_id = <?= $_SESSION['usuario_id'] ?>;

  async function carregarLogs() {
    const res = await fetch("http://localhost:5000/api/logs");
    const dados = await res.json();
    const tabela = document.querySelector("#logsTable tbody");
    tabela.innerHTML = "";
    dados.forEach(log => {
      tabela.innerHTML += `
        <tr>
          <td>${log.data_hora}</td>
          <td>${log.acao}</td>
          <td>${log.origem}</td>
        </tr>`;
    });
  }

  async function abrirPortao() {
    const msg = document.getElementById("mensagem");
    msg.classList.remove("d-none", "alert-success", "alert-danger");
    msg.textContent = "Enviando comando...";
    try {
      const res = await fetch("http://localhost:5000/api/abrir", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({usuario_id})
      });
      const json = await res.json();
      msg.classList.add("alert-success");
      msg.textContent = json.status;
      carregarLogs();
    } catch (e) {
      msg.classList.add("alert-danger");
      msg.textContent = "Erro ao abrir o portão.";
    }
  }

  document.getElementById("abrirBtn").addEventListener("click", abrirPortao);
  window.onload = carregarLogs;
</script>

</body>
</html>
