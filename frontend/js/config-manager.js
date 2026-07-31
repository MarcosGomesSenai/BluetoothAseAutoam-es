/**
 * ConfigManager - Gerenciador de configurações do sistema
 * 
 * Responsável por gerenciar as configurações do portão e comunicação com o Arduino
 */
class ConfigManager {
    constructor() {
        this.config = {
            attempts: 5,
            closeTime: 30,
            vacationMode: false,
            password: null, // A senha real não é armazenada no frontend por segurança
            blocked: false
        };
        
        // Inicializa armazenamento local
        this.initStorage();
        
        // Configura elementos da UI
        this.setupUI();
        
        // Carrega configurações iniciais
        this.loadConfig();
    }
    
    /**
     * Inicializa o armazenamento local para configurações
     */
    initStorage() {
        // Verifica se já existe armazenamento de configurações
        if (!localStorage.getItem('smartgate_config')) {
            localStorage.setItem('smartgate_config', JSON.stringify(this.config));
        }
    }
    
    /**
     * Configura elementos da UI relacionados a configurações
     */
    setupUI() {
        // Botões de salvamento de configurações básicas
        const btnSaveAttempts = document.getElementById('btn-save-attempts');
        if (btnSaveAttempts) {
            btnSaveAttempts.addEventListener('click', () => this.saveAttempts());
        }
        
        const btnSaveCloseTime = document.getElementById('btn-save-close-time');
        if (btnSaveCloseTime) {
            btnSaveCloseTime.addEventListener('click', () => this.saveCloseTime());
        }
        
        // Botões de configurações avançadas (requer admin)
        const btnSavePassword = document.getElementById('btn-save-password');
        if (btnSavePassword) {
            btnSavePassword.addEventListener('click', () => this.savePassword());
        }
        
        const btnSaveVacationMode = document.getElementById('btn-save-vacation-mode');
        if (btnSaveVacationMode) {
            btnSaveVacationMode.addEventListener('click', () => this.saveVacationMode());
        }
        
        // Botões de controle de acesso
        const btnBlockAccess = document.getElementById('btn-block-access');
        if (btnBlockAccess) {
            btnBlockAccess.addEventListener('click', () => this.blockAccess());
        }
        
        const btnUnblockAccess = document.getElementById('btn-unblock-access');
        if (btnUnblockAccess) {
            btnUnblockAccess.addEventListener('click', () => this.unblockAccess());
        }
        
        // Botões de manutenção
        const btnSystemStatus = document.getElementById('btn-system-status');
        if (btnSystemStatus) {
            btnSystemStatus.addEventListener('click', () => this.checkSystemStatus());
        }
        
        const btnSystemReset = document.getElementById('btn-system-reset');
        if (btnSystemReset) {
            btnSystemReset.addEventListener('click', () => this.resetSystem());
        }
    }
    
    /**
     * Carrega configurações do armazenamento local
     */
    loadConfig() {
        try {
            const storedConfig = localStorage.getItem('smartgate_config');
            if (storedConfig) {
                this.config = { ...this.config, ...JSON.parse(storedConfig) };
                this.updateConfigUI();
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }
    
    /**
     * Atualiza a UI com as configurações atuais
     */
    updateConfigUI() {
        // Atualiza campos de configurações básicas
        const attemptsInput = document.getElementById('setting-attempts');
        if (attemptsInput) {
            attemptsInput.value = this.config.attempts;
        }
        
        const closeTimeInput = document.getElementById('setting-close-time');
        if (closeTimeInput) {
            closeTimeInput.value = this.config.closeTime;
        }
        
        // Atualiza campos de configurações avançadas
        const vacationModeSwitch = document.getElementById('setting-vacation-mode');
        if (vacationModeSwitch) {
            vacationModeSwitch.checked = this.config.vacationMode;
        }
        
        // Atualiza estado dos botões de controle de acesso
        const btnBlockAccess = document.getElementById('btn-block-access');
        const btnUnblockAccess = document.getElementById('btn-unblock-access');
        
        if (btnBlockAccess && btnUnblockAccess) {
            if (this.config.blocked) {
                btnBlockAccess.disabled = true;
                btnUnblockAccess.disabled = false;
                btnBlockAccess.innerHTML = '<i class="fas fa-ban"></i> Acesso Bloqueado';
            } else {
                btnBlockAccess.disabled = false;
                btnUnblockAccess.disabled = true;
                btnUnblockAccess.innerHTML = '<i class="fas fa-check-circle"></i> Acesso Desbloqueado';
            }
        }
    }
    
    /**
     * Salva configurações no armazenamento local
     */
    saveConfigToStorage() {
        try {
            localStorage.setItem('smartgate_config', JSON.stringify(this.config));
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
        }
    }
    
    /**
     * Salva número de tentativas
     */
    saveAttempts() {
        const attemptsInput = document.getElementById('setting-attempts');
        if (!attemptsInput) return;
        
        const attempts = parseInt(attemptsInput.value);
        if (isNaN(attempts) || attempts < 1 || attempts > 10) {
            this.showToast('Número de tentativas deve estar entre 1 e 10', 'warning');
            return;
        }
        
        this.config.attempts = attempts;
        this.saveConfigToStorage();
        
        // Envia comando para o Arduino
        if (window.bluetoothManager && window.bluetoothManager.connected) {
            window.bluetoothManager.sendCommand('SET_ATTEMPTS', attempts.toString())
                .then(() => {
                    this.showToast('Número de tentativas atualizado com sucesso', 'success');
                    
                    // Adiciona log
                    if (window.logManager) {
                        window.logManager.addLog({
                            type: 'CONFIG',
                            event: 'Número de tentativas alterado',
                            status: 'SUCCESS',
                            details: {
                                oldValue: this.config.attempts,
                                newValue: attempts,
                                user: 'Usuário atual' // Idealmente, usar nome do usuário logado
                            }
                        });
                    }
                })
                .catch(error => {
                    this.showToast(`Erro ao atualizar Arduino: ${error.message}`, 'error');
                });
        } else {
            this.showToast('Configuração salva localmente. Conecte-se ao Arduino para aplicar.', 'info');
        }
    }
    
    /**
     * Salva tempo de fechamento
     */
    saveCloseTime() {
        const closeTimeInput = document.getElementById('setting-close-time');
        if (!closeTimeInput) return;
        
        const closeTime = parseInt(closeTimeInput.value);
        if (isNaN(closeTime) || closeTime < 5 || closeTime > 120) {
            this.showToast('Tempo de fechamento deve estar entre 5 e 120 segundos', 'warning');
            return;
        }
        
        this.config.closeTime = closeTime;
        this.saveConfigToStorage();
        
        // Envia comando para o Arduino
        if (window.bluetoothManager && window.bluetoothManager.connected) {
            window.bluetoothManager.sendCommand('SET_CLOSE_TIME', closeTime.toString())
                .then(() => {
                    this.showToast('Tempo de fechamento atualizado com sucesso', 'success');
                    
                    // Adiciona log
                    if (window.logManager) {
                        window.logManager.addLog({
                            type: 'CONFIG',
                            event: 'Tempo de fechamento alterado',
                            status: 'SUCCESS',
                            details: {
                                oldValue: this.config.closeTime,
                                newValue: closeTime,
                                user: 'Usuário atual' // Idealmente, usar nome do usuário logado
                            }
                        });
                    }
                })
                .catch(error => {
                    this.showToast(`Erro ao atualizar Arduino: ${error.message}`, 'error');
                });
        } else {
            this.showToast('Configuração salva localmente. Conecte-se ao Arduino para aplicar.', 'info');
        }
    }
    
    /**
     * Salva senha de acesso
     * Requer autenticação de administrador
     */
    savePassword() {
        // Verifica se o usuário está autenticado como admin
        if (!window.authManager || !window.authManager.isAdmin()) {
            this.showToast('Acesso negado. Faça login como administrador.', 'error');
            return;
        }
        
        const passwordInput = document.getElementById('setting-password');
        if (!passwordInput) return;
        
        const password = passwordInput.value.trim();
        if (!password) {
            this.showToast('Senha não pode estar vazia', 'warning');
            return;
        }
        
        // Envia comando para o Arduino
        if (window.bluetoothManager && window.bluetoothManager.connected) {
            window.bluetoothManager.sendCommand('SET_PASSWORD', password)
                .then(() => {
                    this.showToast('Senha atualizada com sucesso', 'success');
                    passwordInput.value = ''; // Limpa o campo por segurança
                    
                    // Adiciona log
                    if (window.logManager) {
                        window.logManager.addLog({
                            type: 'CONFIG',
                            event: 'Senha de acesso alterada',
                            status: 'SUCCESS',
                            details: {
                                user: 'Administrador' // Idealmente, usar nome do admin logado
                            }
                        });
                    }
                })
                .catch(error => {
                    this.showToast(`Erro ao atualizar senha: ${error.message}`, 'error');
                });
        } else {
            this.showToast('Conecte-se ao Arduino para alterar a senha.', 'warning');
        }
    }
    
    /**
     * Salva modo férias
     * Requer autenticação de administrador
     */
    saveVacationMode() {
        // Verifica se o usuário está autenticado como admin
        if (!window.authManager || !window.authManager.isAdmin()) {
            this.showToast('Acesso negado. Faça login como administrador.', 'error');
            return;
        }
        
        const vacationModeSwitch = document.getElementById('setting-vacation-mode');
        if (!vacationModeSwitch) return;
        
        const vacationMode = vacationModeSwitch.checked;
        this.config.vacationMode = vacationMode;
        this.saveConfigToStorage();
        
        // Envia comando para o Arduino
        if (window.bluetoothManager && window.bluetoothManager.connected) {
            window.bluetoothManager.sendCommand('SET_VACATION', vacationMode ? 'ON' : 'OFF')
                .then(() => {
                    this.showToast(`Modo férias ${vacationMode ? 'ativado' : 'desativado'} com sucesso`, 'success');
                    
                    // Adiciona log
                    if (window.logManager) {
                        window.logManager.addLog({
                            type: 'CONFIG',
                            event: `Modo férias ${vacationMode ? 'ativado' : 'desativado'}`,
                            status: 'SUCCESS',
                            details: {
                                user: 'Administrador' // Idealmente, usar nome do admin logado
                            }
                        });
                    }
                })
                .catch(error => {
                    this.showToast(`Erro ao atualizar modo férias: ${error.message}`, 'error');
                });
        } else {
            this.showToast('Configuração salva localmente. Conecte-se ao Arduino para aplicar.', 'info');
        }
    }
    
    /**
     * Bloqueia acesso ao portão
     * Requer autenticação de administrador
     */
    blockAccess() {
        // Verifica se o usuário está autenticado como admin
        if (!window.authManager || !window.authManager.isAdmin()) {
            this.showToast('Acesso negado. Faça login como administrador.', 'error');
            return;
        }
        
        // Configura o modal de confirmação
        document.getElementById('confirmation-message').textContent = 
            'Tem certeza que deseja bloquear o acesso ao portão? Isso impedirá qualquer operação até que seja desbloqueado.';
        
        const confirmButton = document.getElementById('confirm-action');
        
        // Remove listeners anteriores
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        
        // Adiciona novo listener
        newConfirmButton.addEventListener('click', () => {
            // Atualiza configuração local
            this.config.blocked = true;
            this.saveConfigToStorage();
            this.updateConfigUI();
            
            // Envia comando para o Arduino
            if (window.bluetoothManager && window.bluetoothManager.connected) {
                window.bluetoothManager.sendCommand('BLOCK_ACCESS')
                    .then(() => {
                        this.showToast('Acesso ao portão bloqueado com sucesso', 'success');
                        
                        // Adiciona log
                        if (window.logManager) {
                            window.logManager.addLog({
                                type: 'CONFIG',
                                event: 'Acesso ao portão bloqueado',
                                status: 'SUCCESS',
                                details: {
                                    user: 'Administrador' // Idealmente, usar nome do admin logado
                                }
                            });
                        }
                    })
                    .catch(error => {
                        this.showToast(`Erro ao bloquear acesso: ${error.message}`, 'error');
                    });
            } else {
                this.showToast('Configuração salva localmente. Conecte-se ao Arduino para aplicar.', 'info');
            }
            
            // Fecha o modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
            modal.hide();
        });
        
        // Abre o modal
        const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        modal.show();
    }
    
    /**
     * Desbloqueia acesso ao portão
     * Requer autenticação de administrador
     */
    unblockAccess() {
        // Verifica se o usuário está autenticado como admin
        if (!window.authManager || !window.authManager.isAdmin()) {
            this.showToast('Acesso negado. Faça login como administrador.', 'error');
            return;
        }
        
        // Atualiza configuração local
        this.config.blocked = false;
        this.saveConfigToStorage();
        this.updateConfigUI();
        
        // Envia comando para o Arduino
        if (window.bluetoothManager && window.bluetoothManager.connected) {
            window.bluetoothManager.sendCommand('UNBLOCK_ACCESS')
                .then(() => {
                    this.showToast('Acesso ao portão desbloqueado com sucesso', 'success');
                    
                    // Adiciona log
                    if (window.logManager) {
                        window.logManager.addLog({
                            type: 'CONFIG',
                            event: 'Acesso ao portão desbloqueado',
                            status: 'SUCCESS',
                            details: {
                                user: 'Administrador' // Idealmente, usar nome do admin logado
                            }
                        });
                    }
                })
                .catch(error => {
                    this.showToast(`Erro ao desbloquear acesso: ${error.message}`, 'error');
                });
        } else {
            this.showToast('Configuração salva localmente. Conecte-se ao Arduino para aplicar.', 'info');
        }
    }
    
    /**
     * Verifica status do sistema
     */
    checkSystemStatus() {
        if (!window.bluetoothManager || !window.bluetoothManager.connected) {
            this.showToast('Conecte-se ao Arduino para verificar o status do sistema.', 'warning');
            return;
        }
        
        window.bluetoothManager.sendCommand('STATUS')
            .then(() => {
                this.showToast('Solicitação de status enviada com sucesso', 'success');
            })
            .catch(error => {
                this.showToast(`Erro ao solicitar status: ${error.message}`, 'error');
            });
    }
    
    /**
     * Reinicia o sistema Arduino
     * Requer autenticação de administrador
     */
    resetSystem() {
        // Verifica se o usuário está autenticado como admin
        if (!window.authManager || !window.authManager.isAdmin()) {
            this.showToast('Acesso negado. Faça login como administrador.', 'error');
            return;
        }
        
        // Configura o modal de confirmação
        document.getElementById('confirmation-message').textContent = 
            'Tem certeza que deseja reiniciar o sistema? Isso interromperá temporariamente todas as operações.';
        
        const confirmButton = document.getElementById('confirm-action');
        
        // Remove listeners anteriores
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        
        // Adiciona novo listener
        newConfirmButton.addEventListener('click', () => {
            // Envia comando para o Arduino
            if (window.bluetoothManager && window.bluetoothManager.connected) {
                window.bluetoothManager.sendCommand('RESET')
                    .then(() => {
                        this.showToast('Comando de reinicialização enviado com sucesso', 'success');
                        
                        // Adiciona log
                        if (window.logManager) {
                            window.logManager.addLog({
                                type: 'CONFIG',
                                event: 'Sistema reiniciado',
                                status: 'SUCCESS',
                                details: {
                                    user: 'Administrador' // Idealmente, usar nome do admin logado
                                }
                            });
                        }
                        
                        // Desconecta Bluetooth após um breve delay
                        setTimeout(() => {
                            if (window.bluetoothManager) {
                                window.bluetoothManager.disconnect();
                            }
                        }, 1000);
                    })
                    .catch(error => {
                        this.showToast(`Erro ao reiniciar sistema: ${error.message}`, 'error');
                    });
            } else {
                this.showToast('Conecte-se ao Arduino para reiniciar o sistema.', 'warning');
            }
            
            // Fecha o modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
            modal.hide();
        });
        
        // Abre o modal
        const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        modal.show();
    }
    
    /**
     * Exibe uma mensagem toast
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo de mensagem (success, error, warning, info)
     */
    showToast(message, type = 'info') {
        // Se existir um gerenciador de UI, usa ele
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast(message, type);
            return;
        }
        
        // Implementação básica de fallback
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Exporta para uso global
window.ConfigManager = ConfigManager;
