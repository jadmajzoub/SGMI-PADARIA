# SGMI-PADARIA - Módulo de Gerenciamento de Produção da Padaria

Aplicação React + TypeScript + Vite com Material-UI para gerenciamento específico da produção da padaria industrial.

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ (recomendado: versão LTS mais recente)
- npm (incluído com Node.js)
- Backend SGMI rodando na porta 4000 (ver `../sgmi-backend/`)

### Instalação

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   
   Acesse: http://localhost:5173

### Scripts Disponíveis

- `npm run dev` - Iniciar servidor de desenvolvimento Vite
- `npm run build` - Construir para produção (TypeScript + Vite)
- `npm run lint` - Executar ESLint
- `npm run preview` - Visualizar build de produção localmente

### Sobre o Sistema

Este é um módulo especializado do sistema SGMI focado em:

- **Entrada de Produção**: Formulário para registrar dados de produção (produto, turno, data)
- **Gerenciamento de Sessões**: Interface para controle de sessões de produção
- **Comunicação em Tempo Real**: Integração WebSocket para atualizações ao vivo
- **Tema Claro/Escuro**: Suporte a temas com alternância dinâmica

### Arquitetura

- **App Shell** (`AppShell.tsx`): Layout principal com navegação e controle de tema
- **Rotas Principais**:
  - `/` - Formulário de entrada de produção
  - `/production/session` - Gerenciamento de sessões de produção
- **WebSocket**: Conexão com `ws://localhost:4000/ws` para atualizações em tempo real
- **Tema Personalizado**: Material-UI com suporte a modo claro/escuro

### Tecnologias Utilizadas

- React 19 + TypeScript
- Material-UI v7 (interface)
- Vite (build tool)  
- React Router v7 (roteamento)
- Axios (requisições HTTP)
- Day.js (manipulação de datas)
- WebSocket para comunicação em tempo real

### Como Executar o Sistema Completo

Para usar este módulo junto com o sistema principal:

1. **Iniciar o backend:**
   ```bash
   # No diretório ../sgmi-backend/
   npm run dev
   ```

2. **Iniciar o frontend principal (opcional):**
   ```bash
   # No diretório ../SGMI/
   npm run dev
   ```

3. **Iniciar este módulo da padaria:**
   ```bash
   # Neste diretório (SGMI-PADARIA/)
   npm run dev
   ```

### Configuração WebSocket

- Servidor WebSocket: `ws://localhost:4000/ws`
- Auto-reconexão: máximo 5 tentativas a cada 3 segundos
- Requer token de autenticação JWT
