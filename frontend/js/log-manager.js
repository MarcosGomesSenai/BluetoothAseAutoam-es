/**
 * LogManager - Gerenciador de logs do sistema
 * 
 * Responsável por armazenar, filtrar e exportar logs de atividades
 */
class LogManager {
    constructor() {
        this.logs = [];
        this.filteredLogs = [];
        this.currentPage = 1;
        this.logsPerPage = 10;
        this.totalPages = 1;
        
        // Inicializa armazenamento local
        this.initStorage();
        
        // Configura elementos da UI
        this.setupUI();
        
        // Carrega logs iniciais
        this.loadLogs();
    }
    
    /**
     * Inicializa o armazenamento local para logs
     */
    initStorage() {
        // Verifica se já existe armazenamento de logs
        if (!localStorage.getItem('smartgate_logs')) {
            localStorage.setItem('smartgate_logs', JSON.stringify([]));
        }
    }
    
    /**
     * Configura elementos da UI relacionados a logs
     */
    setupUI() {
        // Botões de filtro
        const btnApplyFilters = document.getElementById('btn-apply-filters');
        if (btnApplyFilters) {
            btnApplyFilters.addEventListener('click', () => this.applyFilters());
        }
        
        // Botões de exportação
        const btnExportCSV = document.getElementById('btn-export-csv');
        if (btnExportCSV) {
            btnExportCSV.addEventListener('click', () => this.exportToCSV());
        }
        
        const btnExportPDF = document.getElementById('btn-export-pdf');
        if (btnExportPDF) {
            btnExportPDF.addEventListener('click', () => this.exportToPDF());
        }
        
        // Paginação
        const pagination = document.getElementById('logs-pagination');
        if (pagination) {
            pagination.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' && e.target.getAttribute('data-page')) {
                    e.preventDefault();
                    const page = parseInt(e.target.getAttribute('data-page'));
                    this.goToPage(page);
                }
            });
        }
    }
    
    /**
     * Carrega logs do armazenamento local
     */
    loadLogs() {
        try {
            const storedLogs = localStorage.getItem('smartgate_logs');
            if (storedLogs) {
                this.logs = JSON.parse(storedLogs);
                this.filteredLogs = [...this.logs];
                this.updateTotalPages();
                this.renderLogs();
                this.updateRecentLogs();
            }
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        }
    }
    
    /**
     * Adiciona um novo log
     * @param {Object} logData - Dados do log
     */
    addLog(logData) {
        // Cria objeto de log com dados padrão
        const log = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: logData.type || 'INFO',
            event: logData.event || 'Evento não especificado',
            status: logData.status || 'UNKNOWN',
            details: logData.details || {}
        };
        
        // Adiciona ao início da lista (mais recente primeiro)
        this.logs.unshift(log);
        
        // Limita o número de logs armazenados localmente (máximo 1000)
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(0, 1000);
        }
        
        // Salva no armazenamento local
        this.saveLogsToStorage();
        
        // Atualiza a visualização
        this.filteredLogs = [...this.logs];
        this.updateTotalPages();
        this.renderLogs();
        this.updateRecentLogs();
        
        return log;
    }
    
    /**
     * Salva logs no armazenamento local
     */
    saveLogsToStorage() {
        try {
            localStorage.setItem('smartgate_logs', JSON.stringify(this.logs));
        } catch (error) {
            console.error('Erro ao salvar logs:', error);
        }
    }
    
    /**
     * Aplica filtros aos logs
     */
    applyFilters() {
        const dateFilter = document.getElementById('filter-date').value;
        const typeFilter = document.getElementById('filter-type').value;
        const statusFilter = document.getElementById('filter-status').value;
        
        this.filteredLogs = this.logs.filter(log => {
            // Filtro de data
            if (dateFilter) {
                const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                if (logDate !== dateFilter) {
                    return false;
                }
            }
            
            // Filtro de tipo
            if (typeFilter && log.type !== typeFilter) {
                return false;
            }
            
            // Filtro de status
            if (statusFilter && log.status !== statusFilter) {
                return false;
            }
            
            return true;
        });
        
        // Reseta para a primeira página e atualiza a visualização
        this.currentPage = 1;
        this.updateTotalPages();
        this.renderLogs();
    }
    
    /**
     * Atualiza o número total de páginas
     */
    updateTotalPages() {
        this.totalPages = Math.ceil(this.filteredLogs.length / this.logsPerPage);
        if (this.totalPages === 0) this.totalPages = 1;
    }
    
    /**
     * Navega para uma página específica
     * @param {number} page - Número da página
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        
        this.currentPage = page;
        this.renderLogs();
        this.renderPagination();
    }
    
    /**
     * Renderiza os logs na tabela
     */
    renderLogs() {
        const logsTable = document.getElementById('logs-table');
        if (!logsTable) return;
        
        // Calcula índices para paginação
        const startIndex = (this.currentPage - 1) * this.logsPerPage;
        const endIndex = startIndex + this.logsPerPage;
        const logsToShow = this.filteredLogs.slice(startIndex, endIndex);
        
        // Limpa a tabela
        logsTable.innerHTML = '';
        
        // Se não houver logs, mostra mensagem
        if (logsToShow.length === 0) {
            logsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">Nenhum registro encontrado</td>
                </tr>
            `;
            return;
        }
        
        // Renderiza cada log
        logsToShow.forEach(log => {
            const row = document.createElement('tr');
            
            // Formata a data/hora
            const date = new Date(log.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            // Define classe de status
            let statusClass = '';
            switch (log.status) {
                case 'SUCCESS':
                    statusClass = 'bg-success';
                    break;
                case 'FAILURE':
                    statusClass = 'bg-danger';
                    break;
                case 'WARNING':
                    statusClass = 'bg-warning text-dark';
                    break;
                default:
                    statusClass = 'bg-secondary';
            }
            
            // Cria células da linha
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${log.type}</td>
                <td>${log.event}</td>
                <td><span class="badge ${statusClass}">${log.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-info" data-log-id="${log.id}" onclick="logManager.showLogDetails('${log.id}')">
                        <i class="fas fa-info-circle"></i> Detalhes
                    </button>
                </td>
            `;
            
            logsTable.appendChild(row);
        });
        
        // Atualiza a paginação
        this.renderPagination();
    }
    
    /**
     * Renderiza a paginação
     */
    renderPagination() {
        const pagination = document.getElementById('logs-pagination');
        if (!pagination) return;
        
        // Limpa a paginação
        pagination.innerHTML = '';
        
        // Botão "Anterior"
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
        prevItem.innerHTML = `
            <a class="page-link" href="#" ${this.currentPage > 1 ? 'data-page="' + (this.currentPage - 1) + '"' : ''} tabindex="-1">Anterior</a>
        `;
        pagination.appendChild(prevItem);
        
        // Páginas
        const maxPages = 5; // Máximo de páginas a mostrar
        let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
        
        // Ajusta startPage se necessário
        if (endPage - startPage + 1 < maxPages) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
            pageItem.innerHTML = `
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            `;
            pagination.appendChild(pageItem);
        }
        
        // Botão "Próximo"
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}`;
        nextItem.innerHTML = `
            <a class="page-link" href="#" ${this.currentPage < this.totalPages ? 'data-page="' + (this.currentPage + 1) + '"' : ''}>Próximo</a>
        `;
        pagination.appendChild(nextItem);
    }
    
    /**
     * Atualiza a seção de logs recentes na página inicial
     */
    updateRecentLogs() {
        const recentLogsContainer = document.getElementById('recent-logs');
        if (!recentLogsContainer) return;
        
        // Limpa o container
        recentLogsContainer.innerHTML = '';
        
        // Se não houver logs, mostra mensagem
        if (this.logs.length === 0) {
            recentLogsContainer.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center">Nenhum registro encontrado</td>
                </tr>
            `;
            return;
        }
        
        // Mostra os 5 logs mais recentes
        const recentLogs = this.logs.slice(0, 5);
        
        recentLogs.forEach(log => {
            const row = document.createElement('tr');
            
            // Formata a data/hora
            const date = new Date(log.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            // Define classe de status
            let statusClass = '';
            switch (log.status) {
                case 'SUCCESS':
                    statusClass = 'bg-success';
                    break;
                case 'FAILURE':
                    statusClass = 'bg-danger';
                    break;
                case 'WARNING':
                    statusClass = 'bg-warning text-dark';
                    break;
                default:
                    statusClass = 'bg-secondary';
            }
            
            // Cria células da linha
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${log.event}</td>
                <td><span class="badge ${statusClass}">${log.status}</span></td>
            `;
            
            recentLogsContainer.appendChild(row);
        });
    }
    
    /**
     * Mostra detalhes de um log específico
     * @param {string} logId - ID do log
     */
    showLogDetails(logId) {
        const log = this.logs.find(log => log.id === logId);
        if (!log) return;
        
        // Preenche o modal com os detalhes do log
        document.getElementById('log-detail-id').textContent = log.id;
        
        const date = new Date(log.timestamp);
        document.getElementById('log-detail-datetime').textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        document.getElementById('log-detail-type').textContent = log.type;
        document.getElementById('log-detail-event').textContent = log.event;
        document.getElementById('log-detail-status').textContent = log.status;
        
        // Formata os detalhes como JSON
        const detailsJson = JSON.stringify(log.details, null, 2);
        document.getElementById('log-detail-data').textContent = detailsJson;
        
        // Abre o modal
        const modal = new bootstrap.Modal(document.getElementById('logDetailsModal'));
        modal.show();
    }
    
    /**
     * Exporta logs para CSV
     */
    exportToCSV() {
        // Cria cabeçalhos
        const headers = ['ID', 'Data/Hora', 'Tipo', 'Evento', 'Status', 'Detalhes'];
        
        // Prepara dados
        const data = this.filteredLogs.map(log => {
            const date = new Date(log.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            return [
                log.id,
                formattedDate,
                log.type,
                log.event,
                log.status,
                JSON.stringify(log.details)
            ];
        });
        
        // Adiciona cabeçalhos ao início
        data.unshift(headers);
        
        // Converte para formato CSV
        let csvContent = '';
        data.forEach(row => {
            const csvRow = row.map(cell => {
                // Escapa aspas duplas e envolve em aspas se contiver vírgula
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',');
            csvContent += csvRow + '\n';
        });
        
        // Cria blob e link para download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `smartgate_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    /**
     * Exporta logs para PDF
     */
    exportToPDF() {
        // Verifica se a biblioteca jsPDF está disponível
        if (typeof jspdf === 'undefined') {
            console.error('Biblioteca jsPDF não encontrada');
            return;
        }
        
        // Cria novo documento PDF
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        
        // Adiciona título
        doc.setFontSize(18);
        doc.text('SmartGate - Relatório de Logs', 14, 22);
        
        // Adiciona data de geração
        doc.setFontSize(11);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);
        
        // Prepara dados para tabela
        const tableData = this.filteredLogs.map(log => {
            const date = new Date(log.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            return [
                formattedDate,
                log.type,
                log.event,
                log.status
            ];
        });
        
        // Adiciona cabeçalhos
        tableData.unshift(['Data/Hora', 'Tipo', 'Evento', 'Status']);
        
        // Adiciona tabela
        doc.autoTable({
            startY: 40,
            head: [tableData[0]],
            body: tableData.slice(1),
            theme: 'striped',
            headStyles: {
                fillColor: [41, 121, 255],
                textColor: 255
            },
            styles: {
                overflow: 'linebreak',
                cellWidth: 'auto'
            },
            columnStyles: {
                0: { cellWidth: 50 }, // Data/Hora
                1: { cellWidth: 30 }, // Tipo
                2: { cellWidth: 70 }, // Evento
                3: { cellWidth: 30 }  // Status
            }
        });
        
        // Salva o PDF
        doc.save(`smartgate_logs_${new Date().toISOString().split('T')[0]}.pdf`);
    }
    
    /**
     * Limpa todos os logs
     * Requer confirmação do usuário
     */
    clearAllLogs() {
        // Configura o modal de confirmação
        document.getElementById('confirmation-message').textContent = 
            'Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.';
        
        const confirmButton = document.getElementById('confirm-action');
        
        // Remove listeners anteriores
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        
        // Adiciona novo listener
        newConfirmButton.addEventListener('click', () => {
            // Limpa os logs
            this.logs = [];
            this.filteredLogs = [];
            this.saveLogsToStorage();
            
            // Atualiza a visualização
            this.updateTotalPages();
            this.renderLogs();
            this.updateRecentLogs();
            
            // Fecha o modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
            modal.hide();
        });
        
        // Abre o modal
        const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        modal.show();
    }
    
    /**
     * Gera logs de exemplo para testes
     */
    generateSampleLogs() {
        const types = ['ACCESS', 'OPERATION', 'CONFIG', 'ERROR'];
        const events = [
            'Portão aberto', 'Portão fechado', 'Tentativa de acesso', 
            'Configuração alterada', 'Erro de comunicação', 'Sistema reiniciado'
        ];
        const statuses = ['SUCCESS', 'FAILURE', 'WARNING'];
        
        // Gera 50 logs de exemplo
        for (let i = 0; i < 50; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const event = events[Math.floor(Math.random() * events.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            // Cria data aleatória nos últimos 30 dias
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            
            // Adiciona log
            this.logs.unshift({
                id: Date.now().toString() + i,
                timestamp: date.toISOString(),
                type,
                event,
                status,
                details: {
                    user: 'Sistema',
                    source: 'Gerador de Exemplo',
                    additionalInfo: `Exemplo #${i+1}`
                }
            });
        }
        
        // Salva e atualiza visualização
        this.saveLogsToStorage();
        this.filteredLogs = [...this.logs];
        this.updateTotalPages();
        this.renderLogs();
        this.updateRecentLogs();
    }
}

// Exporta para uso global
window.LogManager = LogManager;
