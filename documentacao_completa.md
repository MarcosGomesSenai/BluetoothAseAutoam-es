# Documentação do Projeto SmartGate

## Visão Geral

O SmartGate é um sistema completo de controle de portão automatizado que integra hardware Arduino com uma interface web responsiva via comunicação Bluetooth. O sistema permite controlar o portão remotamente, monitorar logs de acesso, configurar parâmetros de segurança e gerenciar usuários.

## Componentes do Sistema

### 1. Hardware (Arduino)
- Arduino Uno/Nano/Mega
- Módulo Bluetooth HC-05
- Sensor ultrassônico HC-SR04
- Servo motor ou relé para controle do portão
- LEDs indicadores (opcional)
- Buzzer (opcional)

### 2. Interface Web
- Frontend responsivo (HTML5, CSS3, JavaScript)
- Comunicação Bluetooth via Web Bluetooth API
- Sistema de logs e monitoramento
- Painel administrativo
- Configurações avançadas

## Funcionalidades Principais

### Controle de Acesso
- Detecção automática de veículos via sensor ultrassônico
- Autenticação por senha numérica
- Abertura e fechamento remoto via Bluetooth
- Fechamento automático temporizado

### Segurança
- Limite configurável de tentativas incorretas (padrão: 5)
- Bloqueio automático após exceder tentativas
- Modo férias para maior segurança
- Bloqueio/desbloqueio manual pelo administrador

### Monitoramento
- Registro detalhado de todas as operações
- Visualização de logs com filtros
- Exportação de logs em CSV e PDF
- Estatísticas de uso no painel administrativo

### Configurações
- Ajuste do número de tentativas permitidas
- Configuração do tempo de fechamento automático
- Alteração de senha de acesso
- Ativação/desativação do modo férias

## Requisitos do Sistema

### Para o Arduino
- Arduino IDE 1.8.0 ou superior
- Bibliotecas: SoftwareSerial, Servo, EEPROM

### Para a Interface Web
- Navegador com suporte à Web Bluetooth API:
  - Chrome 56+ (Windows, macOS, Android)
  - Edge 79+ (Windows)
  - Opera 43+
  - Samsung Internet 6.4+
- JavaScript habilitado
- Dispositivo com Bluetooth 4.0+ (para comunicação com HC-05)

## Instalação e Configuração

### Configuração do Arduino
1. Conecte os componentes conforme o diagrama de conexão
2. Carregue o código SmartGate.ino no Arduino usando a Arduino IDE
3. Configure o módulo HC-05 (padrão: 9600 baud)

### Configuração da Interface Web
1. Hospede os arquivos em um servidor web ou abra localmente
2. Acesse a interface através de um navegador compatível
3. Conecte-se ao módulo HC-05 via botão "Conectar Bluetooth"
4. Faça login como administrador (padrão: admin/admin)

## Uso do Sistema

### Conexão Bluetooth
1. Acesse a página inicial do SmartGate
2. Clique no botão "Conectar Bluetooth"
3. Selecione o dispositivo HC-05 na lista de dispositivos
4. Aguarde a confirmação de conexão

### Controle do Portão
1. Na página inicial, use os botões "Abrir Portão" e "Fechar Portão"
2. Confirme a ação quando solicitado
3. Observe o status atual do portão no indicador visual

### Visualização de Logs
1. Acesse a seção "Logs" no menu principal
2. Use os filtros para refinar a visualização (data, tipo, status)
3. Clique em "Detalhes" para ver informações completas de cada evento
4. Use os botões "Exportar CSV" ou "Exportar PDF" para salvar os logs

### Configurações (Administrador)
1. Faça login como administrador
2. Acesse a seção "Configurações" no menu principal
3. Ajuste os parâmetros desejados:
   - Número de tentativas
   - Tempo de fechamento
   - Modo férias
   - Senha de acesso
4. Clique em "Salvar" para cada configuração alterada

## Solução de Problemas

### Problemas de Conexão Bluetooth
- Verifique se o navegador suporta Web Bluetooth API
- Certifique-se de que o Bluetooth do dispositivo está ativado
- Verifique se o HC-05 está energizado e funcionando corretamente
- Tente reiniciar o módulo HC-05 e atualizar a página

### Problemas de Comunicação
- Verifique se a taxa de transmissão (baud rate) está configurada corretamente (9600)
- Certifique-se de que o Arduino está recebendo energia suficiente
- Verifique as conexões físicas entre o Arduino e o HC-05
- Teste o HC-05 com um terminal Bluetooth para verificar a comunicação básica

### Problemas de Funcionamento
- Verifique os logs para identificar possíveis erros
- Reinicie o sistema Arduino usando o botão "Reiniciar Sistema" no painel administrativo
- Verifique se o servo/relé está funcionando corretamente
- Teste o sensor ultrassônico para garantir que está detectando corretamente

## Limitações Conhecidas

- A Web Bluetooth API não é suportada em todos os navegadores (notavelmente ausente no Safari e Firefox)
- A comunicação Bluetooth tem alcance limitado (tipicamente 10 metros)
- O HC-05 não suporta Bluetooth Low Energy (BLE), apenas Bluetooth clássico
- A interface web requer JavaScript habilitado para funcionar corretamente

## Personalização e Expansão

### Personalização da Interface
- Modifique os arquivos CSS para alterar cores, fontes e layout
- Ajuste o arquivo index.html para adicionar ou remover elementos
- Personalize os textos e mensagens conforme necessário

### Expansão de Funcionalidades
- Adicione suporte para múltiplos usuários com diferentes níveis de acesso
- Implemente notificações por e-mail ou SMS para eventos importantes
- Integre com sistemas de câmera para visualização do portão
- Adicione suporte para controle por voz ou reconhecimento facial

## Segurança e Boas Práticas

- Altere as senhas padrão imediatamente após a instalação
- Ative o modo férias quando estiver ausente por períodos prolongados
- Faça backup regular dos logs para referência futura
- Mantenha o firmware do Arduino e a interface web atualizados
- Considere adicionar criptografia à comunicação Bluetooth para maior segurança

## Suporte e Contato

Para suporte técnico ou dúvidas sobre o sistema SmartGate, entre em contato:

- Email: suporte@smartgate.com.br
- Telefone: (XX) XXXX-XXXX
- Site: www.smartgate.com.br

---

© 2025 SmartGate - Todos os direitos reservados
