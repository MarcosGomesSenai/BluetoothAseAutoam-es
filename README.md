# SmartGate — Portão Bluetooth 🚪📶

Sistema completo de controle de portão automatizado, integrando **Arduino** (hardware + Bluetooth HC-05) com uma **interface web** (Web Bluetooth API), painel administrativo, logs de acesso e configurações de segurança.

---

## 🧩 Componentes do sistema

| Camada | Tecnologia |
|---|---|
| Hardware | Arduino Uno/Nano/Mega + módulo Bluetooth HC-05 + sensor ultrassônico HC-SR04 + servo/relé |
| Firmware | `SmartGate.ino` (Arduino IDE) |
| Frontend | HTML5, CSS3, JavaScript + Web Bluetooth API |
| Backend web | PHP (login, painel, admin, API) |
| Backend auxiliar | Python (Flask + pyserial), para ponte serial ↔ banco de dados |
| Banco de dados | MySQL (`portao_bluetooth`) |
| PWA | Manifest + Service Worker (app instalável) |

---

## 📁 Estrutura de arquivos

```
projeto_portao_bluetooth/
│
├── arduino_code/
│   └── SmartGate.ino              ← Firmware do portão (sensor, servo, HC-05)
│
├── frontend/
│   ├── index.html                  ← Interface principal (conexão Bluetooth, controle)
│   ├── css/main.css
│   └── js/
│       ├── app.js                  ← Orquestração geral
│       ├── bluetooth.js            ← Conexão e comunicação via Web Bluetooth API
│       ├── chart-handler.js        ← Gráficos/estatísticas de uso
│       ├── config-manager.js       ← Configurações (tentativas, tempo, modo férias)
│       └── log-manager.js          ← Exibição e filtro de logs
│
├── public/                         ← Páginas públicas (PHP)
│   ├── login.php
│   ├── registrar.php
│   ├── esqueci_senha.php
│   ├── resetar.php
│   ├── validar_2fa.php
│   └── painel.php                  ← Painel principal pós-login
│
├── admin/                          ← Área administrativa (PHP)
│   ├── index.php
│   ├── usuarios.php                ← Gestão de usuários
│   ├── logs.php                    ← Visualização/exportação de logs
│   └── config.php                  ← Conexão com o MySQL (mysqli)
│
├── api/                            ← Endpoints PHP (auth, 2FA, gráficos)
│   ├── login.php / logout.php / registrar.php
│   ├── esqueci_senha.php / resetar.php / validar_2fa.php
│   ├── grafico_dados.php
│   └── users/                      ← CRUD de usuários
│       ├── cadastro_usuario.php
│       ├── editar_usuario.php
│       ├── excluir_usuario.php
│       └── lista_usuarios.php
│
├── backend/
│   ├── php/
│   │   ├── abrir_portao.php
│   │   └── session_check.php
│   ├── python/
│   │   ├── api.py                  ← API Flask: recebe comando, envia ao Arduino via serial, grava log
│   │   ├── db.py                   ← Conexão MySQL (mysql-connector)
│   │   └── serial_listener.py      ← Escuta a porta serial e registra logs automaticamente
│   └── db/
│       └── init.sql                ← Schema: usuarios, logs_acesso, dispositivos
│
├── serial/
│   └── server.py                   ← Servidor Flask-SocketIO, ponte em tempo real com a porta serial
│
├── pwa/
│   ├── manifest.json               ← App instalável ("Portão Inteligente")
│   └── service-worker.js
│
├── instalar.php                    ← Instalador: cria tabelas via banco.sql se ainda não existirem
└── documentacao_completa.md        ← Documentação detalhada original do projeto
```

---

## ⚙️ Funcionalidades principais

### Controle de acesso
- Detecção automática de veículos via sensor ultrassônico
- Autenticação por senha numérica
- Abertura/fechamento remoto via Bluetooth
- Fechamento automático temporizado

### Segurança
- Limite configurável de tentativas incorretas (padrão: 5)
- Bloqueio automático após exceder tentativas
- Modo férias para maior segurança
- Bloqueio/desbloqueio manual pelo administrador
- Login com 2FA (`validar_2fa.php`)

### Monitoramento
- Registro detalhado de todas as operações (`logs_acesso`)
- Visualização de logs com filtros
- Exportação de logs em CSV e PDF
- Estatísticas de uso no painel administrativo

### Configurações
- Número de tentativas permitidas
- Tempo de fechamento automático
- Senha de acesso
- Ativação/desativação do modo férias

---

## 📦 Requisitos

**Arduino**
- Arduino IDE 1.8.0+
- Bibliotecas: `SoftwareSerial`, `Servo`, `EEPROM`

**Interface Web**
- Navegador com suporte à **Web Bluetooth API**: Chrome 56+, Edge 79+, Opera 43+, Samsung Internet 6.4+
  (⚠️ não suportado em Safari e Firefox)
- JavaScript habilitado
- Dispositivo com Bluetooth 4.0+ (para comunicação com o HC-05)

**Backend**
- PHP 7+ com extensão `mysqli`
- MySQL/MariaDB
- Python 3 com `flask`, `flask-socketio`, `pyserial`, `mysql-connector-python` (sem `requirements.txt` no projeto — instalar manualmente)

---

## 🚀 Instalação e configuração

### 1. Arduino
1. Conecte os componentes conforme o diagrama de conexão.
2. Carregue `arduino_code/SmartGate.ino` no Arduino pela IDE.
3. Configure o módulo HC-05 (padrão: 9600 baud).

### 2. Banco de dados
- Execute `backend/db/init.sql` no MySQL, **ou**
- Acesse `instalar.php`, que cria as tabelas automaticamente a partir de `banco.sql` caso ainda não existam.
- Ajuste as credenciais em `admin/config.php` (host, usuário, senha, banco `portao_bluetooth`).

### 3. Interface Web
1. Hospede os arquivos em um servidor web (Apache/PHP) ou abra `frontend/index.html` localmente.
2. Acesse pelo navegador e clique em **"Conectar Bluetooth"**.
3. Selecione o dispositivo HC-05 na lista.
4. Faça login como administrador (padrão: `admin` / `admin` — **troque após a instalação**).

### 4. Backend Python (ponte serial ↔ banco, opcional)
```bash
pip install flask flask-socketio pyserial mysql-connector-python
python backend/python/api.py          # API REST que envia comandos ao Arduino
python backend/python/serial_listener.py   # escuta a serial e grava logs automaticamente
python serial/server.py                # ponte em tempo real via WebSocket (Flask-SocketIO)
```
> Ajuste `porta_serial` (`COM3` no Windows, `/dev/ttyUSB0` no Linux) nos três scripts conforme sua porta.

---

## 🧭 Uso do sistema

**Conexão Bluetooth**
1. Acesse a página inicial do SmartGate.
2. Clique em "Conectar Bluetooth" e selecione o HC-05.
3. Aguarde a confirmação de conexão.

**Controle do portão**
- Use os botões "Abrir Portão" / "Fechar Portão" e confirme a ação.
- Acompanhe o status no indicador visual.

**Logs**
- Acesse "Logs" no menu, filtre por data/tipo/status e exporte em CSV ou PDF.

**Configurações (administrador)**
- Ajuste tentativas, tempo de fechamento, modo férias e senha de acesso.

---

## 🛠️ Solução de problemas

| Sintoma | Verificar |
|---|---|
| Bluetooth não conecta | Navegador suporta Web Bluetooth API? Bluetooth do dispositivo ativado? HC-05 energizado? |
| Sem comunicação | Baud rate = 9600? Alimentação do Arduino? Conexões físicas com o HC-05? |
| Portão não responde | Conferir logs, reiniciar via painel admin, testar servo/relé e sensor ultrassônico |

---

## ⚠️ Limitações conhecidas

- Web Bluetooth API não é suportada em todos os navegadores (Safari e Firefox ficam de fora).
- Alcance do Bluetooth clássico é limitado (~10 metros); HC-05 não suporta BLE.
- Interface web requer JavaScript habilitado.

---

## 🔐 Boas práticas de segurança

- Troque as senhas padrão (`admin`/`admin`) imediatamente após a instalação.
- Ative o modo férias em períodos de ausência prolongada.
- Preencha senha e credenciais reais em `admin/config.php` e `backend/python/db.py` antes de colocar em produção — nunca versione essas credenciais.

---

## 📚 Documentação completa

Veja [`documentacao_completa.md`](./documentacao_completa.md) para o guia detalhado original, incluindo personalização de interface e ideias de expansão (múltiplos níveis de acesso, notificações, câmeras, controle por voz).
