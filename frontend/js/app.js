/**
 * UIManager - Gerenciador de interface do usuário
 * 
 * Responsável por gerenciar a navegação, autenticação e elementos visuais da interface
 */
class UIManager {
    constructor() {
        this.currentPage = 'home';
        this.isAdminMode = false;
        this.toastTimeout = null;
        
        // Inicializa componentes da UI
        this.setupNavigation();
        this.setupLoginModal();
        this.setupToasts();
        
        // Verifica autenticação existente
        this.checkExistingAuth();
    }
    
    /**
     * Configura navegação entre páginas
     */
    setupNavigation() {
        // Links de navegação
        const navLinks = document.querySelectorAll('[data-page]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = link.getAttribute('data-page');
                this.navigateTo(targetPage);
            });
        });
        
        // Link de login
        const loginLink = document.getElementById('login-link');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        }
        
        // Links para login de admin em áreas restritas
        const adminLoginLinks = document.querySelectorAll('#admin-login-link');
        adminLoginLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        });
        
        // Botões de controle do portão
        const btnOpenGate = document.getElementById('btn-open-gate');
        if (btnOpenGate) {
            btnOpenGate.addEventListener('click', () => this.handleGateControl('OPEN'));
        }
        
        const btnCloseGate = document.getElementById('btn-close-gate');
        if (btnCloseGate) {
            btnCloseGate.addEventListener('click', () => this.handleGateControl('CLOSE'));
        }
    }
    
    /**
     * Configura modal de login
     */
    setupLoginModal() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }
    
    /**
     * Configura sistema de toasts (notificações)
     */
    setupToasts() {
        // Cria container de toasts se não existir
        if (!document.getElementById('toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
    }
    
    /**
     * Verifica se há autenticação existente
     */
    checkExistingAuth() {
        // Se existir um gerenciador de autenticação, usa ele
        if (window.authManager && window.authManager.checkAuth()) {
            this.updateAuthUI(window.authManager.isAdmin());
        }
    }
    
    /**
     * Navega para uma página específica
     * @param {string} page - Nome da página
     */
    navigateTo(page) {
        // Verifica se a página existe
        const targetPage = document.getElementById(`page-${page}`);
        if (!targetPage) return;
        
        // Verifica restrições de acesso
        if (page === 'admin' && !this.isAdminMode) {
            this.showToast('Acesso restrito. Faça login como administrador.', 'warning');
            return;
        }
        
        // Oculta todas as páginas
        const pages = document.querySelectorAll('.page-section');
        pages.forEach(p => p.classList.remove('active'));
        
        // Mostra a página selecionada
        targetPage.classList.add('active');
        
        // Atualiza links de navegação
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
        
        // Atualiza página atual
        this.currentPage = page;
        
        // Fecha menu mobile se estiver aberto
        const navbarCollapse = document.getElementById('navbarMain');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = new bootstrap.Collapse(navbarCollapse);
            bsCollapse.hide();
        }
    }
    
    /**
     * Manipula login de usuário
     */
    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Se existir um gerenciador de autenticação, usa ele
        if (window.authManager) {
            window.authManager.login(username, password)
                .then(result => {
                    if (result.success) {
                        // Fecha o modal
                        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                        modal.hide();
                        
                        // Atualiza UI
                        this.updateAuthUI(result.isAdmin);
                        
                        // Mostra mensagem de sucesso
                        this.showToast(`Login realizado com sucesso. Bem-vindo, ${username}!`, 'success');
                        
                        // Se estava tentando acessar área admin, redireciona
                        if (result.isAdmin && this.currentPage === 'home') {
                            this.navigateTo('admin');
                        }
                    } else {
                        this.showToast('Credenciais inválidas. Tente novamente.', 'error');
                    }
                })
                .catch(error => {
                    this.showToast(`Erro no login: ${error.message}`, 'error');
                });
        } else {
            // Implementação simplificada para demonstração
            if (username === 'admin' && password === 'admin') {
                // Fecha o modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                modal.hide();
                
                // Atualiza UI para modo admin
                this.updateAuthUI(true);
                
                // Mostra mensagem de sucesso
                this.showToast('Login de administrador realizado com sucesso!', 'success');
                
                // Redireciona para dashboard admin
                this.navigateTo('admin');
            } else if (username === 'user' && password === 'user') {
                // Fecha o modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                modal.hide();
                
                // Atualiza UI para modo usuário
                this.updateAuthUI(false);
                
                // Mostra mensagem de sucesso
                this.showToast('Login realizado com sucesso!', 'success');
            } else {
                this.showToast('Credenciais inválidas. Tente novamente.', 'error');
            }
        }
    }
    
    /**
     * Atualiza UI após autenticação
     * @param {boolean} isAdmin - Se o usuário é administrador
     */
    updateAuthUI(isAdmin) {
        // Atualiza estado
        this.isAdminMode = isAdmin;
        
        // Atualiza classes no body
        if (isAdmin) {
            document.body.classList.add('admin-mode');
        } else {
            document.body.classList.remove('admin-mode');
        }
        
        // Atualiza link de login/logout
        const loginLink = document.getElementById('login-link');
        if (loginLink) {
            loginLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            loginLink.onclick = (e) => {
                e.preventDefault();
                this.handleLogout();
            };
        }
        
        // Atualiza visibilidade de elementos admin-only
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        adminOnlyElements.forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });
        
        // Atualiza mensagens de acesso restrito
        const adminRequiredMessages = document.querySelectorAll('#admin-required-message, #admin-login-alert');
        adminRequiredMessages.forEach(el => {
            el.style.display = isAdmin ? 'none' : 'block';
        });
    }
    
    /**
     * Manipula logout de usuário
     */
    handleLogout() {
        // Se existir um gerenciador de autenticação, usa ele
        if (window.authManager) {
            window.authManager.logout();
        }
        
        // Atualiza UI
        this.isAdminMode = false;
        document.body.classList.remove('admin-mode');
        
        // Atualiza link de login
        const loginLink = document.getElementById('login-link');
        if (loginLink) {
            loginLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            loginLink.onclick = (e) => {
                e.preventDefault();
                this.showLoginModal();
            };
        }
        
        // Redireciona para home
        this.navigateTo('home');
        
        // Mostra mensagem
        this.showToast('Logout realizado com sucesso!', 'info');
    }
    
    /**
     * Mostra modal de login
     */
    showLoginModal() {
        // Limpa campos
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
        // Abre modal
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    }
    
    /**
     * Manipula controle do portão
     * @param {string} command - Comando (OPEN/CLOSE)
     */
    handleGateControl(command) {
        // Verifica se está conectado ao Bluetooth
        if (window.bluetoothManager && window.bluetoothManager.connected) {
            // Confirmação para abrir o portão
            if (command === 'OPEN') {
                // Configura o modal de confirmação
                document.getElementById('confirmation-message').textContent = 
                    'Tem certeza que deseja abrir o portão?';
                
                const confirmButton = document.getElementById('confirm-action');
                
                // Remove listeners anteriores
                const newConfirmButton = confirmButton.cloneNode(true);
                confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
                
                // Adiciona novo listener
                newConfirmButton.addEventListener('click', () => {
                    // Envia comando
                    window.bluetoothManager.sendCommand(command)
                        .then(() => {
                            this.showToast('Comando enviado com sucesso!', 'success');
                        })
                        .catch(error => {
                            this.showToast(`Erro ao enviar comando: ${error.message}`, 'error');
                        });
                    
                    // Fecha o modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
                    modal.hide();
                });
                
                // Abre o modal
                const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
                modal.show();
            } else {
                // Para fechar, não precisa de confirmação
                window.bluetoothManager.sendCommand(command)
                    .then(() => {
                        this.showToast('Comando enviado com sucesso!', 'success');
                    })
                    .catch(error => {
                        this.showToast(`Erro ao enviar comando: ${error.message}`, 'error');
                    });
            }
        } else {
            this.showToast('Conecte-se ao dispositivo Bluetooth primeiro!', 'warning');
        }
    }
    
    /**
     * Mostra uma notificação toast
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo de mensagem (success, error, warning, info)
     */
    showToast(message, type = 'info') {
        // Mapeia tipo para classe Bootstrap
        const typeClass = {
            'success': 'bg-success',
            'error': 'bg-danger',
            'warning': 'bg-warning text-dark',
            'info': 'bg-info text-dark'
        }[type] || 'bg-info text-dark';
        
        // Mapeia tipo para ícone
        const typeIcon = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle'
        }[type] || 'fas fa-info-circle';
        
        // Cria elemento toast
        const toastId = `toast-${Date.now()}`;
        const toastHtml = `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header ${typeClass} text-white">
                    <i class="${typeIcon} me-2"></i>
                    <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                    <small>Agora</small>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        // Adiciona toast ao container
        const toastContainer = document.getElementById('toast-container');
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Inicializa e mostra o toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        toast.show();
        
        // Remove o toast após fechado
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
        
        // Adiciona ao log se disponível
        if (window.logManager) {
            window.logManager.addLog({
                type: type.toUpperCase(),
                event: message,
                status: type === 'error' ? 'FAILURE' : 'SUCCESS',
                details: {
                    source: 'UI',
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
}

/**
 * AuthManager - Gerenciador de autenticação
 * 
 * Responsável por gerenciar autenticação e autorização de usuários
 */
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAdminUser = false;
        
        // Inicializa armazenamento local
        this.initStorage();
        
        // Carrega usuários de exemplo
        this.loadSampleUsers();
        
        // Verifica autenticação existente
        this.checkAuth();
    }
    
    /**
     * Inicializa o armazenamento local para usuários
     */
    initStorage() {
        // Verifica se já existe armazenamento de usuários
        if (!localStorage.getItem('smartgate_users')) {
            localStorage.setItem('smartgate_users', JSON.stringify([]));
        }
        
        // Verifica se já existe armazenamento de sessão
        if (!localStorage.getItem('smartgate_session')) {
            localStorage.setItem('smartgate_session', JSON.stringify(null));
        }
    }
    
    /**
     * Carrega usuários de exemplo
     */
    loadSampleUsers() {
        const users = JSON.parse(localStorage.getItem('smartgate_users'));
        
        // Se não houver usuários, cria exemplos
        if (!users || users.length === 0) {
            const sampleUsers = [
                {
                    username: 'admin',
                    password: 'admin', // Em produção, usar hash
                    role: 'admin',
                    name: 'Administrador',
                    active: true
                },
                {
                    username: 'user',
                    password: 'user', // Em produção, usar hash
                    role: 'user',
                    name: 'Usuário Padrão',
                    active: true
                }
            ];
            
            localStorage.setItem('smartgate_users', JSON.stringify(sampleUsers));
        }
    }
    
    /**
     * Verifica se há autenticação existente
     * @returns {boolean} - true se autenticado, false caso contrário
     */
    checkAuth() {
        const session = JSON.parse(localStorage.getItem('smartgate_session'));
        
        if (session && session.username && session.expiry > Date.now()) {
            // Sessão válida
            this.currentUser = session.username;
            this.isAdminUser = session.isAdmin;
            return true;
        } else {
            // Sessão inválida ou expirada
            this.currentUser = null;
            this.isAdminUser = false;
            localStorage.setItem('smartgate_session', JSON.stringify(null));
            return false;
        }
    }
    
    /**
     * Realiza login de usuário
     * @param {string} username - Nome de usuário
     * @param {string} password - Senha
     * @returns {Promise} - Promessa que resolve com resultado do login
     */
    login(username, password) {
        return new Promise((resolve, reject) => {
            try {
                const users = JSON.parse(localStorage.getItem('smartgate_users'));
                
                // Busca usuário
                const user = users.find(u => u.username === username && u.password === password);
                
                if (user && user.active) {
                    // Cria sessão
                    const session = {
                        username: user.username,
                        name: user.name,
                        isAdmin: user.role === 'admin',
                        expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
                    };
                    
                    // Salva sessão
                    localStorage.setItem('smartgate_session', JSON.stringify(session));
                    
                    // Atualiza estado
                    this.currentUser = user.username;
                    this.isAdminUser = user.role === 'admin';
                    
                    resolve({
                        success: true,
                        isAdmin: user.role === 'admin',
                        name: user.name
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'Credenciais inválidas ou usuário inativo'
                    });
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Realiza logout de usuário
     */
    logout() {
        this.currentUser = null;
        this.isAdminUser = false;
        localStorage.setItem('smartgate_session', JSON.stringify(null));
    }
    
    /**
     * Verifica se o usuário atual é administrador
     * @returns {boolean} - true se for admin, false caso contrário
     */
    isAdmin() {
        return this.isAdminUser;
    }
    
    /**
     * Obtém nome de usuário atual
     * @returns {string|null} - Nome de usuário ou null se não autenticado
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Adiciona novo usuário
     * @param {Object} userData - Dados do usuário
     * @returns {Promise} - Promessa que resolve com resultado da operação
     */
    addUser(userData) {
        return new Promise((resolve, reject) => {
            try {
                // Verifica se é admin
                if (!this.isAdminUser) {
                    reject(new Error('Permissão negada. Apenas administradores podem adicionar usuários.'));
                    return;
                }
                
                const users = JSON.parse(localStorage.getItem('smartgate_users'));
                
                // Verifica se usuário já existe
                if (users.some(u => u.username === userData.username)) {
                    reject(new Error('Nome de usuário já existe.'));
                    return;
                }
                
                // Adiciona novo usuário
                users.push({
                    username: userData.username,
                    password: userData.password, // Em produção, usar hash
                    role: userData.role || 'user',
                    name: userData.name || userData.username,
                    active: true
                });
                
                // Salva usuários
                localStorage.setItem('smartgate_users', JSON.stringify(users));
                
                resolve({
                    success: true,
                    message: 'Usuário adicionado com sucesso'
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Obtém lista de usuários
     * @returns {Promise} - Promessa que resolve com lista de usuários
     */
    getUsers() {
        return new Promise((resolve, reject) => {
            try {
                // Verifica se é admin
                if (!this.isAdminUser) {
                    reject(new Error('Permissão negada. Apenas administradores podem listar usuários.'));
                    return;
                }
                
                const users = JSON.parse(localStorage.getItem('smartgate_users'));
                
                // Remove senhas por segurança
                const safeUsers = users.map(u => ({
                    username: u.username,
                    role: u.role,
                    name: u.name,
                    active: u.active
                }));
                
                resolve(safeUsers);
            } catch (error) {
                reject(error);
            }
        });
    }
}

/**
 * AppManager - Gerenciador principal da aplicação
 * 
 * Responsável por inicializar e coordenar todos os componentes
 */
class AppManager {
    constructor() {
        // Inicializa gerenciadores
        this.initManagers();
        
        // Configura listeners de eventos
        this.setupEventListeners();
        
        // Gera dados de exemplo para demonstração
        this.generateSampleData();
    }
    
    /**
     * Inicializa todos os gerenciadores
     */
    initManagers() {
        // Inicializa gerenciador de autenticação
        window.authManager = new AuthManager();
        
        // Inicializa gerenciador de logs
        window.logManager = new LogManager();
        
        // Inicializa gerenciador de configurações
        window.configManager = new ConfigManager();
        
        // Inicializa gerenciador de Bluetooth
        window.bluetoothManager = new BluetoothManager();
        
        // Inicializa gerenciador de UI (por último para acessar os outros)
        window.uiManager = new UIManager();
    }
    
    /**
     * Configura listeners de eventos entre componentes
     */
    setupEventListeners() {
        // Configura listeners do Bluetooth
        if (window.bluetoothManager) {
            // Status do portão
            window.bluetoothManager.addListener('status_update', (data) => {
                console.log('Status do portão atualizado:', data);
                
                // Adiciona ao log
                if (window.logManager) {
                    window.logManager.addLog({
                        type: 'INFO',
                        event: `Status do portão: ${data.status}`,
                        status: 'SUCCESS',
                        details: {
                            status: data.status,
                            source: 'ARDUINO',
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            });
            
            // Mensagens de log do Arduino
            window.bluetoothManager.addListener('log_entry', (data) => {
                console.log('Log do Arduino:', data);
                
                // Adiciona ao log
                if (window.logManager) {
                    window.logManager.addLog({
                        type: 'INFO',
                        event: data.message,
                        status: 'SUCCESS',
                        details: {
                            source: 'ARDUINO',
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            });
            
            // Erros
            window.bluetoothManager.addListener('error', (data) => {
                console.error('Erro Bluetooth:', data);
                
                // Mostra toast
                if (window.uiManager) {
                    window.uiManager.showToast(data.message, 'error');
                }
            });
        }
    }
    
    /**
     * Gera dados de exemplo para demonstração
     */
    generateSampleData() {
        // Gera logs de exemplo
        if (window.logManager) {
            // Verifica se já existem logs
            const existingLogs = JSON.parse(localStorage.getItem('smartgate_logs') || '[]');
            
            if (existingLogs.length === 0) {
                window.logManager.generateSampleLogs();
            }
        }
        
        // Inicializa gráfico de atividade se estiver na página admin
        this.initActivityChart();
    }
    
    /**
     * Inicializa gráfico de atividade
     */
    initActivityChart() {
        const chartCanvas = document.getElementById('activity-chart');
        if (!chartCanvas) return;
        
        // Dados de exemplo para o gráfico
        const labels = [];
        const accessData = [];
        const openData = [];
        const closeData = [];
        
        // Gera dados para os últimos 7 dias
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            labels.push(date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }));
            
            // Dados aleatórios
            accessData.push(Math.floor(Math.random() * 10) + 1);
            openData.push(Math.floor(Math.random() * 8) + 1);
            closeData.push(Math.floor(Math.random() * 8) + 1);
        }
        
        // Cria o gráfico
        new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Acessos',
                        data: accessData,
                        borderColor: '#2979ff',
                        backgroundColor: 'rgba(41, 121, 255, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Aberturas',
                        data: openData,
                        borderColor: '#00c853',
                        backgroundColor: 'rgba(0, 200, 83, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Fechamentos',
                        data: closeData,
                        borderColor: '#f44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
        
        // Atualiza estatísticas do dashboard
        document.getElementById('stat-total-access').textContent = accessData.reduce((a, b) => a + b, 0);
        document.getElementById('stat-successful-access').textContent = Math.floor(accessData.reduce((a, b) => a + b, 0) * 0.8);
        document.getElementById('stat-failed-access').textContent = Math.floor(accessData.reduce((a, b) => a + b, 0) * 0.2);
        document.getElementById('stat-attempts-exceeded').textContent = Math.floor(accessData.reduce((a, b) => a + b, 0) * 0.1);
    }
}

// Inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppManager();
});
