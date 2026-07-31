/**
 * BluetoothManager - Gerenciador de comunicação Bluetooth
 * 
 * Responsável por estabelecer e gerenciar a conexão Bluetooth com o HC-05
 */
class BluetoothManager {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.txCharacteristic = null;
        this.rxCharacteristic = null;
        this.connected = false;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Identificadores Bluetooth para HC-05
        this.UART_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
        this.UART_TX_CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
        this.UART_RX_CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
        
        // Configura elementos da UI
        this.setupUI();
    }
    
    /**
     * Verifica se o navegador suporta Web Bluetooth API
     * @returns {boolean} - true se suportado, false caso contrário
     */
    isSupported() {
        return navigator && navigator.bluetooth;
    }
    
    /**
     * Configura elementos da UI relacionados ao Bluetooth
     */
    setupUI() {
        const connectButton = document.getElementById('btn-connect-bluetooth');
        if (connectButton) {
            connectButton.addEventListener('click', () => this.connect());
        }
        
        // Verifica suporte inicial
        if (!this.isSupported()) {
            this.updateUIStatus('unsupported');
            
            if (connectButton) {
                connectButton.disabled = true;
                connectButton.innerHTML = '<i class="fas fa-times-circle"></i> Bluetooth não suportado';
            }
        }
    }
    
    /**
     * Inicia processo de conexão Bluetooth
     * @returns {Promise} - Promessa que resolve quando conectado
     */
    async connect() {
        if (!this.isSupported()) {
            this.notifyListeners('error', { message: 'Web Bluetooth API não suportada neste navegador' });
            return false;
        }
        
        try {
            this.updateUIStatus('connecting');
            this.notifyListeners('connecting');
            
            // Solicita ao usuário selecionar o dispositivo
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { namePrefix: 'HC-05' },
                    { services: [this.UART_SERVICE_UUID] }
                ],
                optionalServices: [this.UART_SERVICE_UUID]
            });
            
            // Configura listener para desconexão
            this.device.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this));
            
            // Conecta ao servidor GATT
            this.server = await this.device.gatt.connect();
            
            // Obtém o serviço UART
            this.service = await this.server.getPrimaryService(this.UART_SERVICE_UUID);
            
            // Obtém características TX/RX
            this.txCharacteristic = await this.service.getCharacteristic(this.UART_TX_CHARACTERISTIC_UUID);
            
            // No HC-05, geralmente TX e RX usam a mesma característica
            this.rxCharacteristic = this.txCharacteristic;
            
            // Configura notificações para receber dados
            await this.rxCharacteristic.startNotifications();
            this.rxCharacteristic.addEventListener('characteristicvaluechanged', 
                this.handleIncomingData.bind(this));
            
            // Atualiza estado
            this.connected = true;
            this.reconnectAttempts = 0;
            
            // Atualiza UI
            this.updateUIStatus('connected', this.device.name);
            
            // Notifica listeners
            this.notifyListeners('connected', { device: this.device.name });
            
            // Solicita status inicial
            await this.sendCommand('STATUS');
            
            return true;
        } catch (error) {
            console.error('Erro na conexão Bluetooth:', error);
            this.updateUIStatus('error', error.message);
            this.notifyListeners('error', { message: error.message });
            return false;
        }
    }
    
    /**
     * Desconecta do dispositivo Bluetooth
     */
    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
        
        this.connected = false;
        this.updateUIStatus('disconnected');
        this.notifyListeners('disconnected', {});
    }
    
    /**
     * Manipula desconexão inesperada
     */
    async handleDisconnection() {
        this.connected = false;
        this.updateUIStatus('disconnected');
        this.notifyListeners('disconnected', {});
        
        // Tenta reconectar automaticamente
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.notifyListeners('reconnecting', { attempt: this.reconnectAttempts });
            
            try {
                // Espera antes de tentar reconectar
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Tenta reconectar
                if (this.device) {
                    this.updateUIStatus('connecting');
                    this.server = await this.device.gatt.connect();
                    
                    // Obtém o serviço UART
                    this.service = await this.server.getPrimaryService(this.UART_SERVICE_UUID);
                    
                    // Obtém características TX/RX
                    this.txCharacteristic = await this.service.getCharacteristic(this.UART_TX_CHARACTERISTIC_UUID);
                    this.rxCharacteristic = this.txCharacteristic;
                    
                    // Configura notificações para receber dados
                    await this.rxCharacteristic.startNotifications();
                    this.rxCharacteristic.addEventListener('characteristicvaluechanged', 
                        this.handleIncomingData.bind(this));
                    
                    // Atualiza estado
                    this.connected = true;
                    this.updateUIStatus('connected', this.device.name);
                    this.notifyListeners('connected', { device: this.device.name });
                    
                    // Solicita status inicial
                    await this.sendCommand('STATUS');
                }
            } catch (error) {
                console.error('Erro na reconexão Bluetooth:', error);
                this.updateUIStatus('error', error.message);
                this.notifyListeners('error', { message: `Falha na reconexão: ${error.message}` });
                
                // Agenda nova tentativa
                setTimeout(() => {
                    this.handleDisconnection();
                }, 5000);
            }
        } else {
            this.updateUIStatus('max_reconnect_attempts');
            this.notifyListeners('max_reconnect_attempts', {});
        }
    }
    
    /**
     * Envia comando para o Arduino
     * @param {string} command - Comando a ser enviado
     * @param {string} parameter - Parâmetro opcional
     * @returns {Promise} - Promessa que resolve quando o comando é enviado
     */
    async sendCommand(command, parameter = null) {
        if (!this.connected || !this.txCharacteristic) {
            const error = new Error('Não conectado ao dispositivo Bluetooth');
            this.notifyListeners('error', { message: error.message });
            throw error;
        }
        
        try {
            // Formata o comando
            let fullCommand = command;
            if (parameter !== null) {
                fullCommand = `${command}:${parameter}`;
            }
            
            // Adiciona quebra de linha se necessário
            if (!fullCommand.endsWith('\n')) {
                fullCommand += '\n';
            }
            
            // Converte string para ArrayBuffer
            const encoder = new TextEncoder();
            const data = encoder.encode(fullCommand);
            
            // Envia dados
            await this.txCharacteristic.writeValue(data);
            
            // Adiciona log
            if (window.logManager) {
                window.logManager.addLog({
                    type: 'OPERATION',
                    event: `Comando enviado: ${fullCommand.trim()}`,
                    status: 'SUCCESS',
                    details: {
                        command: fullCommand.trim(),
                        timestamp: new Date().toISOString()
                    }
                });
            }
            
            this.notifyListeners('command_sent', { command: fullCommand.trim() });
            return true;
        } catch (error) {
            console.error('Erro ao enviar comando:', error);
            
            // Adiciona log de erro
            if (window.logManager) {
                window.logManager.addLog({
                    type: 'ERROR',
                    event: `Erro ao enviar comando: ${command}`,
                    status: 'FAILURE',
                    details: {
                        command: command,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            
            this.notifyListeners('error', { message: `Erro ao enviar comando: ${error.message}` });
            throw error;
        }
    }
    
    /**
     * Manipula dados recebidos do Arduino
     * @param {Event} event - Evento de característica alterada
     */
    handleIncomingData(event) {
        // Converte ArrayBuffer para string
        const decoder = new TextDecoder();
        const data = decoder.decode(event.target.value);
        
        // Processa cada linha recebida
        const lines = data.split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            
            console.log(`Dados recebidos do Arduino: ${line}`);
            this.notifyListeners('data_received', { data: line });
            
            // Adiciona ao log
            if (window.logManager) {
                window.logManager.addLog({
                    type: 'INFO',
                    event: `Dados recebidos: ${line}`,
                    status: 'SUCCESS',
                    details: {
                        data: line,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            
            // Processa comandos específicos
            if (line.includes(':')) {
                const [type, value] = line.split(':', 2);
                
                switch (type.trim().toUpperCase()) {
                    case 'STATUS':
                        this.updateGateStatus(value.trim());
                        this.notifyListeners('status_update', { status: value.trim() });
                        break;
                    case 'LOG':
                        this.notifyListeners('log_entry', { message: value.trim() });
                        break;
                    case 'CONFIG':
                        this.notifyListeners('config_update', { status: value.trim() });
                        break;
                    case 'ERROR':
                        this.notifyListeners('error', { message: value.trim() });
                        break;
                }
            }
        }
    }
    
    /**
     * Atualiza o status do portão na UI
     * @param {string} status - Status do portão
     */
    updateGateStatus(status) {
        const statusIcon = document.getElementById('gate-status-icon');
        const statusText = document.getElementById('gate-status-text');
        
        if (!statusIcon || !statusText) return;
        
        // Remove classes anteriores
        statusIcon.className = 'gate-icon';
        
        // Adiciona classe apropriada
        switch (status.toUpperCase()) {
            case 'OPEN':
            case 'ABERTO':
                statusIcon.classList.add('gate-open');
                statusIcon.innerHTML = '<i class="fas fa-door-open"></i>';
                statusText.textContent = 'Aberto';
                break;
            case 'CLOSED':
            case 'FECHADO':
                statusIcon.classList.add('gate-closed');
                statusIcon.innerHTML = '<i class="fas fa-door-closed"></i>';
                statusText.textContent = 'Fechado';
                break;
            case 'OPENING':
            case 'ABRINDO':
                statusIcon.classList.add('gate-moving');
                statusIcon.innerHTML = '<i class="fas fa-cog"></i>';
                statusText.textContent = 'Abrindo';
                break;
            case 'CLOSING':
            case 'FECHANDO':
                statusIcon.classList.add('gate-moving');
                statusIcon.innerHTML = '<i class="fas fa-cog"></i>';
                statusText.textContent = 'Fechando';
                break;
            default:
                statusIcon.classList.add('gate-unknown');
                statusIcon.innerHTML = '<i class="fas fa-question"></i>';
                statusText.textContent = status || 'Desconhecido';
        }
    }
    
    /**
     * Atualiza o status da conexão Bluetooth na UI
     * @param {string} status - Status da conexão
     * @param {string} info - Informação adicional
     */
    updateUIStatus(status, info = '') {
        // Atualiza ícone no cabeçalho
        const bluetoothIcon = document.getElementById('bluetooth-icon');
        const bluetoothStatusText = document.getElementById('bluetooth-status-text');
        
        if (bluetoothIcon) {
            bluetoothIcon.className = 'bluetooth-icon';
            
            switch (status) {
                case 'connected':
                    bluetoothIcon.classList.add('connected');
                    if (bluetoothStatusText) bluetoothStatusText.textContent = 'Conectado';
                    break;
                case 'connecting':
                    bluetoothIcon.classList.add('connecting');
                    if (bluetoothStatusText) bluetoothStatusText.textContent = 'Conectando...';
                    break;
                case 'disconnected':
                    bluetoothIcon.classList.add('disconnected');
                    if (bluetoothStatusText) bluetoothStatusText.textContent = 'Desconectado';
                    break;
                case 'unsupported':
                    bluetoothIcon.classList.add('disconnected');
                    if (bluetoothStatusText) bluetoothStatusText.textContent = 'Não suportado';
                    break;
                case 'error':
                    bluetoothIcon.classList.add('disconnected');
                    if (bluetoothStatusText) bluetoothStatusText.textContent = 'Erro';
                    break;
                case 'max_reconnect_attempts':
                    bluetoothIcon.classList.add('disconnected');
                    if (bluetoothStatusText) bluetoothStatusText.textContent = 'Reconexão falhou';
                    break;
            }
        }
        
        // Atualiza card de conexão
        const connectionStatus = document.getElementById('bluetooth-connection-status');
        const connectionStatusText = document.getElementById('connection-status-text');
        const deviceName = document.getElementById('device-name');
        const connectionDetails = document.getElementById('connection-details');
        const connectButton = document.getElementById('btn-connect-bluetooth');
        
        if (connectionStatus) {
            connectionStatus.className = 'connection-status';
            
            switch (status) {
                case 'connected':
                    connectionStatus.classList.add('connected');
                    if (connectionStatusText) connectionStatusText.textContent = 'Conectado';
                    if (deviceName) deviceName.textContent = info || 'HC-05';
                    if (connectionDetails) connectionDetails.textContent = 'Conexão ativa';
                    if (connectButton) {
                        connectButton.textContent = 'Desconectar';
                        connectButton.classList.remove('btn-primary');
                        connectButton.classList.add('btn-danger');
                        // Muda o comportamento do botão para desconectar
                        connectButton.onclick = () => this.disconnect();
                    }
                    break;
                case 'connecting':
                    connectionStatus.classList.add('connecting');
                    if (connectionStatusText) connectionStatusText.textContent = 'Conectando...';
                    if (deviceName) deviceName.textContent = 'Procurando...';
                    if (connectionDetails) connectionDetails.textContent = 'Aguarde a conexão';
                    if (connectButton) {
                        connectButton.disabled = true;
                        connectButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
                    }
                    break;
                case 'disconnected':
                    connectionStatus.classList.add('disconnected');
                    if (connectionStatusText) connectionStatusText.textContent = 'Desconectado';
                    if (deviceName) deviceName.textContent = 'Nenhum';
                    if (connectionDetails) connectionDetails.textContent = 'Não conectado';
                    if (connectButton) {
                        connectButton.textContent = 'Conectar Bluetooth';
                        connectButton.classList.remove('btn-danger');
                        connectButton.classList.add('btn-primary');
                        connectButton.disabled = false;
                        // Restaura o comportamento do botão para conectar
                        connectButton.onclick = () => this.connect();
                    }
                    break;
                case 'unsupported':
                    connectionStatus.classList.add('disconnected');
                    if (connectionStatusText) connectionStatusText.textContent = 'Não suportado';
                    if (deviceName) deviceName.textContent = 'N/A';
                    if (connectionDetails) connectionDetails.textContent = 'Este navegador não suporta Web Bluetooth API';
                    break;
                case 'error':
                    connectionStatus.classList.add('disconnected');
                    if (connectionStatusText) connectionStatusText.textContent = 'Erro';
                    if (deviceName) deviceName.textContent = 'Erro';
                    if (connectionDetails) connectionDetails.textContent = info || 'Erro na conexão';
                    if (connectButton) {
                        connectButton.textContent = 'Tentar Novamente';
                        connectButton.classList.remove('btn-danger');
                        connectButton.classList.add('btn-primary');
                        connectButton.disabled = false;
                    }
                    break;
                case 'max_reconnect_attempts':
                    connectionStatus.classList.add('disconnected');
                    if (connectionStatusText) connectionStatusText.textContent = 'Reconexão falhou';
                    if (deviceName) deviceName.textContent = 'Desconectado';
                    if (connectionDetails) connectionDetails.textContent = 'Número máximo de tentativas excedido';
                    if (connectButton) {
                        connectButton.textContent = 'Tentar Novamente';
                        connectButton.disabled = false;
                    }
                    break;
            }
        }
    }
    
    /**
     * Gerenciamento de listeners de eventos
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função de callback
     */
    addListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    /**
     * Remove listener de evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função de callback a remover
     */
    removeListener(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    }
    
    /**
     * Notifica todos os listeners de um evento
     * @param {string} event - Nome do evento
     * @param {Object} data - Dados do evento
     */
    notifyListeners(event, data) {
        if (!this.listeners.has(event)) return;
        
        for (const callback of this.listeners.get(event)) {
            try {
                callback(data);
            } catch (error) {
                console.error(`Erro em listener de ${event}:`, error);
            }
        }
    }
}

// Exporta para uso global
window.BluetoothManager = BluetoothManager;
