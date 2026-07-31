/**
 * SmartGate - Controle de Portão com Bluetooth
 * 
 * Este código implementa um sistema de controle de portão automatizado
 * com detecção de proximidade, senha de acesso e comunicação Bluetooth.
 * 
 * Hardware necessário:
 * - Arduino Uno/Nano/Mega
 * - Módulo Bluetooth HC-05
 * - Sensor ultrassônico HC-SR04
 * - Servo motor ou relé para controle do portão
 * - LEDs indicadores (opcional)
 * - Buzzer (opcional)
 * 
 * Conexões:
 * - HC-05: TX -> RX Arduino, RX -> TX Arduino
 * - HC-SR04: Trig -> D7, Echo -> D8
 * - Servo/Relé: D9
 * - LED Verde: D4
 * - LED Vermelho: D5
 * - Buzzer: D6
 * 
 * Autor: ASE Automações
 * Versão: 2.0
 */

#include <SoftwareSerial.h>
#include <Servo.h>
#include <EEPROM.h>

// Pinos
#define TRIG_PIN 7
#define ECHO_PIN 8
#define SERVO_PIN 9
#define LED_GREEN 4
#define LED_RED 5
#define BUZZER_PIN 6
#define BT_RX 2
#define BT_TX 3

// Constantes
#define MAX_PASSWORD_LENGTH 6
#define DEFAULT_ATTEMPTS 3
#define DEFAULT_CLOSE_TIME 30
#define DISTANCE_THRESHOLD 50 // cm
#define EEPROM_PASSWORD_ADDR 0
#define EEPROM_ATTEMPTS_ADDR 10
#define EEPROM_CLOSE_TIME_ADDR 12
#define EEPROM_VACATION_MODE_ADDR 14

// Estados do portão
enum GateState {
  GATE_CLOSED,
  GATE_OPEN,
  GATE_OPENING,
  GATE_CLOSING,
  GATE_ERROR
};

// Estados do sistema
enum SystemState {
  IDLE,
  WAITING_PASSWORD,
  BLOCKED,
  MAINTENANCE
};

// Configuração do Bluetooth
SoftwareSerial bluetooth(BT_RX, BT_TX);

// Configuração do servo
Servo gateServo;

// Variáveis globais
GateState gateState = GATE_CLOSED;
SystemState systemState = IDLE;
char password[MAX_PASSWORD_LENGTH + 1] = "123456"; // Senha padrão
char inputPassword[MAX_PASSWORD_LENGTH + 1];
int passwordIndex = 0;
int failedAttempts = 0;
int maxAttempts = DEFAULT_ATTEMPTS;
int closeTime = DEFAULT_CLOSE_TIME;
bool vacationMode = false;
bool systemBlocked = false;
unsigned long lastActionTime = 0;
unsigned long blockStartTime = 0;
unsigned long blockDuration = 60000; // 1 minuto de bloqueio após exceder tentativas

// Buffer para comandos Bluetooth
String btBuffer = "";

void setup() {
  // Inicializa comunicação serial
  Serial.begin(9600);
  bluetooth.begin(9600);
  
  // Configura pinos
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Inicializa servo
  gateServo.attach(SERVO_PIN);
  closeGate(); // Inicia com o portão fechado
  
  // Carrega configurações da EEPROM
  loadConfigFromEEPROM();
  
  // Inicializa estado
  updateLEDs();
  
  // Mensagem de inicialização
  sendBluetoothLog("Sistema inicializado");
  sendBluetoothStatus(gateState);
}

void loop() {
  // Verifica comandos Bluetooth
  checkBluetoothCommands();
  
  // Verifica estado do sistema
  switch (systemState) {
    case IDLE:
      checkProximity();
      checkAutoClose();
      break;
      
    case WAITING_PASSWORD:
      // Timeout para entrada de senha (30 segundos)
      if (millis() - lastActionTime > 30000) {
        systemState = IDLE;
        passwordIndex = 0;
        sendBluetoothLog("Timeout na entrada de senha");
        updateLEDs();
      }
      break;
      
    case BLOCKED:
      // Verifica se o tempo de bloqueio passou
      if (millis() - blockStartTime > blockDuration) {
        systemState = IDLE;
        failedAttempts = 0;
        sendBluetoothLog("Sistema desbloqueado após timeout");
        updateLEDs();
      }
      break;
      
    case MAINTENANCE:
      // Modo de manutenção - apenas responde a comandos Bluetooth
      break;
  }
}

/**
 * Verifica se há comandos recebidos via Bluetooth
 */
void checkBluetoothCommands() {
  while (bluetooth.available()) {
    char c = bluetooth.read();
    
    // Processa o caractere recebido
    if (c == '\n' || c == '\r') {
      if (btBuffer.length() > 0) {
        processBluetoothCommand(btBuffer);
        btBuffer = "";
      }
    } else {
      btBuffer += c;
    }
  }
}

/**
 * Processa comandos recebidos via Bluetooth
 */
void processBluetoothCommand(String command) {
  Serial.print("Comando recebido: ");
  Serial.println(command);
  
  // Divide o comando e parâmetro
  int separatorIndex = command.indexOf(':');
  String cmd = separatorIndex > 0 ? command.substring(0, separatorIndex) : command;
  String param = separatorIndex > 0 ? command.substring(separatorIndex + 1) : "";
  
  cmd.trim();
  param.trim();
  
  // Converte para maiúsculas para facilitar comparação
  cmd.toUpperCase();
  
  // Processa o comando
  if (cmd == "OPEN") {
    if (systemState == BLOCKED || (vacationMode && systemState != MAINTENANCE)) {
      sendBluetoothLog("Comando negado: sistema bloqueado");
    } else {
      openGate();
      sendBluetoothLog("Comando de abertura recebido via Bluetooth");
    }
  }
  else if (cmd == "CLOSE") {
    closeGate();
    sendBluetoothLog("Comando de fechamento recebido via Bluetooth");
  }
  else if (cmd == "STATUS" || cmd == "STATUS?") {
    sendBluetoothStatus(gateState);
    sendSystemStatus();
  }
  else if (cmd == "SET_ATTEMPTS") {
    if (param.length() > 0) {
      int newAttempts = param.toInt();
      if (newAttempts >= 1 && newAttempts <= 10) {
        maxAttempts = newAttempts;
        saveAttemptsToEEPROM();
        sendBluetoothLog("Número de tentativas atualizado para " + String(maxAttempts));
        sendBluetoothMessage("CONFIG:UPDATED");
      } else {
        sendBluetoothMessage("ERROR:INVALID_VALUE");
      }
    } else {
      sendBluetoothMessage("ERROR:MISSING_PARAMETER");
    }
  }
  else if (cmd == "SET_CLOSE_TIME") {
    if (param.length() > 0) {
      int newCloseTime = param.toInt();
      if (newCloseTime >= 5 && newCloseTime <= 120) {
        closeTime = newCloseTime;
        saveCloseTimeToEEPROM();
        sendBluetoothLog("Tempo de fechamento atualizado para " + String(closeTime) + " segundos");
        sendBluetoothMessage("CONFIG:UPDATED");
      } else {
        sendBluetoothMessage("ERROR:INVALID_VALUE");
      }
    } else {
      sendBluetoothMessage("ERROR:MISSING_PARAMETER");
    }
  }
  else if (cmd == "SET_VACATION") {
    if (param == "ON") {
      vacationMode = true;
      saveVacationModeToEEPROM();
      sendBluetoothLog("Modo férias ativado");
      sendBluetoothMessage("CONFIG:UPDATED");
    } else if (param == "OFF") {
      vacationMode = false;
      saveVacationModeToEEPROM();
      sendBluetoothLog("Modo férias desativado");
      sendBluetoothMessage("CONFIG:UPDATED");
    } else {
      sendBluetoothMessage("ERROR:INVALID_PARAMETER");
    }
  }
  else if (cmd == "SET_PASSWORD") {
    if (param.length() >= 4 && param.length() <= MAX_PASSWORD_LENGTH) {
      strncpy(password, param.c_str(), MAX_PASSWORD_LENGTH);
      password[MAX_PASSWORD_LENGTH] = '\0'; // Garante terminação
      savePasswordToEEPROM();
      sendBluetoothLog("Senha atualizada com sucesso");
      sendBluetoothMessage("CONFIG:PASSWORD_UPDATED");
    } else {
      sendBluetoothMessage("ERROR:INVALID_PASSWORD");
    }
  }
  else if (cmd == "BLOCK_ACCESS") {
    systemBlocked = true;
    sendBluetoothLog("Sistema bloqueado manualmente");
    sendBluetoothMessage("CONFIG:SYSTEM_BLOCKED");
    updateLEDs();
  }
  else if (cmd == "UNBLOCK_ACCESS") {
    systemBlocked = false;
    failedAttempts = 0;
    systemState = IDLE;
    sendBluetoothLog("Sistema desbloqueado manualmente");
    sendBluetoothMessage("CONFIG:SYSTEM_UNBLOCKED");
    updateLEDs();
  }
  else if (cmd == "RESET") {
    sendBluetoothLog("Reiniciando sistema...");
    delay(500);
    // Aqui você pode implementar um reset via watchdog ou simplesmente reiniciar variáveis
    resetSystem();
  }
  else if (cmd == "MAINTENANCE_MODE") {
    if (param == "ON") {
      systemState = MAINTENANCE;
      sendBluetoothLog("Modo de manutenção ativado");
      sendBluetoothMessage("CONFIG:MAINTENANCE_ON");
    } else if (param == "OFF") {
      systemState = IDLE;
      sendBluetoothLog("Modo de manutenção desativado");
      sendBluetoothMessage("CONFIG:MAINTENANCE_OFF");
    }
  }
  else {
    sendBluetoothMessage("ERROR:UNKNOWN_COMMAND");
  }
}

/**
 * Verifica proximidade de veículos
 */
void checkProximity() {
  // Se o sistema estiver bloqueado ou em modo férias, não verifica proximidade
  if (systemBlocked || vacationMode) return;
  
  // Mede distância com o sensor ultrassônico
  long duration, distance;
  
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  duration = pulseIn(ECHO_PIN, HIGH);
  distance = (duration / 2) / 29.1; // Converte para centímetros
  
  // Se detectar objeto próximo e o portão estiver fechado
  if (distance < DISTANCE_THRESHOLD && gateState == GATE_CLOSED && systemState == IDLE) {
    // Ativa modo de espera por senha
    systemState = WAITING_PASSWORD;
    passwordIndex = 0;
    lastActionTime = millis();
    sendBluetoothLog("Veículo detectado. Aguardando senha.");
    
    // Sinal sonoro de detecção
    tone(BUZZER_PIN, 1000, 200);
    updateLEDs();
  }
}

/**
 * Verifica se é hora de fechar o portão automaticamente
 */
void checkAutoClose() {
  if (gateState == GATE_OPEN && (millis() - lastActionTime > closeTime * 1000)) {
    closeGate();
    sendBluetoothLog("Fechamento automático do portão");
  }
}

/**
 * Abre o portão
 */
void openGate() {
  if (gateState != GATE_OPEN && gateState != GATE_OPENING) {
    gateState = GATE_OPENING;
    sendBluetoothStatus(gateState);
    updateLEDs();
    
    // Animação de abertura
    for (int pos = 0; pos <= 90; pos += 5) {
      gateServo.write(pos);
      delay(50);
    }
    
    gateState = GATE_OPEN;
    lastActionTime = millis();
    sendBluetoothStatus(gateState);
    updateLEDs();
    
    // Sinal sonoro de confirmação
    tone(BUZZER_PIN, 2000, 200);
  }
}

/**
 * Fecha o portão
 */
void closeGate() {
  if (gateState != GATE_CLOSED && gateState != GATE_CLOSING) {
    gateState = GATE_CLOSING;
    sendBluetoothStatus(gateState);
    updateLEDs();
    
    // Animação de fechamento
    for (int pos = 90; pos >= 0; pos -= 5) {
      gateServo.write(pos);
      delay(50);
    }
    
    gateState = GATE_CLOSED;
    sendBluetoothStatus(gateState);
    updateLEDs();
    
    // Sinal sonoro de confirmação
    tone(BUZZER_PIN, 1500, 200);
  }
}

/**
 * Processa entrada de senha
 */
void processPasswordInput(char key) {
  if (systemState != WAITING_PASSWORD) return;
  
  // Atualiza timestamp da última ação
  lastActionTime = millis();
  
  // Verifica se é um dígito válido
  if (key >= '0' && key <= '9' && passwordIndex < MAX_PASSWORD_LENGTH) {
    inputPassword[passwordIndex++] = key;
    inputPassword[passwordIndex] = '\0';
    
    // Feedback sonoro
    tone(BUZZER_PIN, 1200, 100);
  }
  // Verifica se é comando de confirmação
  else if (key == '#') {
    // Verifica se a senha está correta
    if (strcmp(inputPassword, password) == 0) {
      // Senha correta
      failedAttempts = 0;
      systemState = IDLE;
      passwordIndex = 0;
      
      // Abre o portão
      openGate();
      sendBluetoothLog("Acesso permitido: senha correta");
      sendBluetoothMessage("LOG:ACCESS_GRANTED");
      
      // Feedback sonoro de sucesso
      tone(BUZZER_PIN, 2000, 200);
      delay(200);
      tone(BUZZER_PIN, 2500, 200);
    } else {
      // Senha incorreta
      failedAttempts++;
      passwordIndex = 0;
      
      if (failedAttempts >= maxAttempts) {
        // Bloqueia o sistema
        systemState = BLOCKED;
        blockStartTime = millis();
        sendBluetoothLog("Sistema bloqueado: número máximo de tentativas excedido");
        sendBluetoothMessage("LOG:ATTEMPTS_EXCEEDED");
        
        // Feedback sonoro de bloqueio
        for (int i = 0; i < 3; i++) {
          tone(BUZZER_PIN, 500, 200);
          delay(300);
        }
      } else {
        sendBluetoothLog("Acesso negado: senha incorreta (" + String(failedAttempts) + "/" + String(maxAttempts) + ")");
        sendBluetoothMessage("LOG:ACCESS_DENIED");
        
        // Feedback sonoro de erro
        tone(BUZZER_PIN, 300, 500);
      }
    }
    
    updateLEDs();
  }
  // Verifica se é comando de cancelamento
  else if (key == '*') {
    // Cancela entrada de senha
    systemState = IDLE;
    passwordIndex = 0;
    sendBluetoothLog("Entrada de senha cancelada");
    
    // Feedback sonoro de cancelamento
    tone(BUZZER_PIN, 800, 300);
    updateLEDs();
  }
}

/**
 * Atualiza os LEDs de acordo com o estado do sistema
 */
void updateLEDs() {
  switch (systemState) {
    case IDLE:
      if (gateState == GATE_OPEN) {
        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_RED, LOW);
      } else {
        digitalWrite(LED_GREEN, LOW);
        digitalWrite(LED_RED, HIGH);
      }
      break;
      
    case WAITING_PASSWORD:
      // Pisca LED verde
      digitalWrite(LED_GREEN, (millis() / 500) % 2);
      digitalWrite(LED_RED, LOW);
      break;
      
    case BLOCKED:
      // Pisca LED vermelho
      digitalWrite(LED_GREEN, LOW);
      digitalWrite(LED_RED, (millis() / 250) % 2);
      break;
      
    case MAINTENANCE:
      // Ambos LEDs piscando alternadamente
      digitalWrite(LED_GREEN, (millis() / 500) % 2);
      digitalWrite(LED_RED, !((millis() / 500) % 2));
      break;
  }
}

/**
 * Envia status do portão via Bluetooth
 */
void sendBluetoothStatus(GateState state) {
  String status;
  
  switch (state) {
    case GATE_CLOSED:
      status = "STATUS:FECHADO";
      break;
    case GATE_OPEN:
      status = "STATUS:ABERTO";
      break;
    case GATE_OPENING:
      status = "STATUS:ABRINDO";
      break;
    case GATE_CLOSING:
      status = "STATUS:FECHANDO";
      break;
    case GATE_ERROR:
      status = "STATUS:ERRO";
      break;
    default:
      status = "STATUS:DESCONHECIDO";
  }
  
  bluetooth.println(status);
  Serial.println(status);
}

/**
 * Envia status do sistema via Bluetooth
 */
void sendSystemStatus() {
  String systemStatus = "SYSTEM_STATUS:";
  
  // Adiciona estado do sistema
  switch (systemState) {
    case IDLE:
      systemStatus += "IDLE,";
      break;
    case WAITING_PASSWORD:
      systemStatus += "WAITING_PASSWORD,";
      break;
    case BLOCKED:
      systemStatus += "BLOCKED,";
      break;
    case MAINTENANCE:
      systemStatus += "MAINTENANCE,";
      break;
  }
  
  // Adiciona configurações
  systemStatus += "ATTEMPTS:" + String(maxAttempts) + ",";
  systemStatus += "CLOSE_TIME:" + String(closeTime) + ",";
  systemStatus += "VACATION_MODE:" + String(vacationMode ? "ON" : "OFF") + ",";
  systemStatus += "BLOCKED:" + String(systemBlocked ? "YES" : "NO");
  
  bluetooth.println(systemStatus);
  Serial.println(systemStatus);
}

/**
 * Envia mensagem de log via Bluetooth
 */
void sendBluetoothLog(String message) {
  String logMessage = "LOG:" + message;
  bluetooth.println(logMessage);
  Serial.println(logMessage);
}

/**
 * Envia mensagem genérica via Bluetooth
 */
void sendBluetoothMessage(String message) {
  bluetooth.println(message);
  Serial.println(message);
}

/**
 * Carrega configurações da EEPROM
 */
void loadConfigFromEEPROM() {
  // Carrega senha
  for (int i = 0; i < MAX_PASSWORD_LENGTH; i++) {
    password[i] = EEPROM.read(EEPROM_PASSWORD_ADDR + i);
  }
  password[MAX_PASSWORD_LENGTH] = '\0';
  
  // Verifica se a senha é válida (apenas dígitos)
  bool validPassword = true;
  for (int i = 0; i < MAX_PASSWORD_LENGTH && password[i] != '\0'; i++) {
    if (password[i] < '0' || password[i] > '9') {
      validPassword = false;
      break;
    }
  }
  
  // Se a senha não for válida, restaura a senha padrão
  if (!validPassword) {
    strcpy(password, "123456");
    savePasswordToEEPROM();
  }
  
  // Carrega número de tentativas
  maxAttempts = EEPROM.read(EEPROM_ATTEMPTS_ADDR);
  if (maxAttempts < 1 || maxAttempts > 10) {
    maxAttempts = DEFAULT_ATTEMPTS;
    saveAttemptsToEEPROM();
  }
  
  // Carrega tempo de fechamento
  closeTime = EEPROM.read(EEPROM_CLOSE_TIME_ADDR);
  if (closeTime < 5 || closeTime > 120) {
    closeTime = DEFAULT_CLOSE_TIME;
    saveCloseTimeToEEPROM();
  }
  
  // Carrega modo férias
  vacationMode = EEPROM.read(EEPROM_VACATION_MODE_ADDR) == 1;
}

/**
 * Salva senha na EEPROM
 */
void savePasswordToEEPROM() {
  for (int i = 0; i < MAX_PASSWORD_LENGTH; i++) {
    EEPROM.write(EEPROM_PASSWORD_ADDR + i, password[i]);
  }
}

/**
 * Salva número de tentativas na EEPROM
 */
void saveAttemptsToEEPROM() {
  EEPROM.write(EEPROM_ATTEMPTS_ADDR, maxAttempts);
}

/**
 * Salva tempo de fechamento na EEPROM
 */
void saveCloseTimeToEEPROM() {
  EEPROM.write(EEPROM_CLOSE_TIME_ADDR, closeTime);
}

/**
 * Salva modo férias na EEPROM
 */
void saveVacationModeToEEPROM() {
  EEPROM.write(EEPROM_VACATION_MODE_ADDR, vacationMode ? 1 : 0);
}

/**
 * Reinicia o sistema
 */
void resetSystem() {
  // Reinicia variáveis
  gateState = GATE_CLOSED;
  systemState = IDLE;
  failedAttempts = 0;
  systemBlocked = false;
  
  // Fecha o portão
  closeGate();
  
  // Atualiza LEDs
  updateLEDs();
  
  // Notifica reinicialização
  sendBluetoothLog("Sistema reiniciado");
  sendBluetoothStatus(gateState);
}
