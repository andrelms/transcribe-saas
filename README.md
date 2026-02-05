# 🎙️ Tradutor de Entrevistas em Tempo Real

Aplicativo web de tradução e assistência em tempo real para entrevistas e reuniões, especialmente projetado para ajudar iniciantes em idiomas.

## 🌟 Características Principais

### 1. **Transcrição em Tempo Real**
- Utiliza a Web Speech API do navegador (Chrome recomendado)
- Transcrição instantânea de áudio em múltiplos idiomas
- Suporte para transcrições intermediárias e finais

### 2. **Tradução Automática**
- Tradução instantânea de cada frase dita
- Suporte para 10+ idiomas (Inglês, Português, Espanhol, Francês, etc.)
- Tradução bidirecional entre qualquer par de idiomas

### 3. **Geração de Respostas Inteligentes**
- Sugestões de respostas apropriadas baseadas no contexto
- Frases simplificadas para iniciantes (A1-A2)
- Três níveis de dificuldade: Iniciante, Intermediário, Avançado
- Respostas em ambos os idiomas com tradução

### 4. **Contexto de Múltiplas Fontes**
- Upload de arquivos PDF
- Extração de conteúdo de links (Canva, LinkedIn, sites)
- Resumo automático e extração de pontos-chave
- Uso do contexto para gerar respostas mais relevantes

### 5. **Síntese de Voz**
- Pronúncia de textos em qualquer idioma
- Ajuda na prática de pronúncia
- Text-to-Speech integrado no navegador

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Estilização**: Tailwind CSS
- **IA**: OpenAI GPT-4 Turbo
- **Transcrição**: Web Speech API (nativa do navegador)
- **Text-to-Speech**: Web Speech Synthesis API
- **Extração de Dados**:
  - PDF: pdf-parse
  - Web: Cheerio + Axios

## 📋 Pré-requisitos

- Node.js 18+ e npm/yarn
- Navegador compatível com Web Speech API (Chrome recomendado)
- Chave API da OpenAI

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd transcribe-saas
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute o servidor de desenvolvimento**
```bash
npm run dev
```

4. **Acesse a aplicação**
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

5. **Configure a API (Duas opções)**

   **Opção A: Interface do Usuário (Recomendado para testes)**
   - Clique no botão "Configurar API" no canto superior direito
   - Escolha o provedor (OpenAI, Anthropic, Google)
   - Selecione o modelo
   - Cole sua chave da API
   - Clique em "Salvar Configurações"

   **Opção B: Variável de Ambiente (Recomendado para produção)**
   - Copie o arquivo `.env.example` para `.env`
   - Adicione sua chave: `OPENAI_API_KEY=sk-...`
   - Reinicie o servidor

## 📱 Como Usar

### Configuração Inicial

1. **Configure a API** (primeira vez):
   - Clique em "Configurar API" no canto superior direito
   - Escolha o provedor de IA (OpenAI, Anthropic ou Google)
   - Selecione o modelo desejado
   - Cole sua chave da API
   - Suas configurações são salvas localmente no navegador

2. **Selecione os idiomas**:
   - Idioma do Interlocutor: O idioma que a outra pessoa está falando
   - Seu Idioma: O idioma no qual você quer receber as traduções

3. **Escolha o nível de aprendizado**:
   - **Iniciante (A1-A2)**: Frases muito simples e curtas
   - **Intermediário (B1-B2)**: Vocabulário moderado e frases claras
   - **Avançado (C1-C2)**: Linguagem natural e fluente

### Durante a Entrevista

1. **Adicione contexto** (opcional):
   - Faça upload de PDFs relacionados à entrevista
   - Cole links de apresentações do Canva ou perfis do LinkedIn
   - O sistema extrairá informações relevantes automaticamente

2. **Inicie a gravação**:
   - Clique em "Iniciar Gravação"
   - Permita o acesso ao microfone quando solicitado
   - O Chrome funciona melhor para esta funcionalidade

3. **Acompanhe em tempo real**:
   - **Painel Central**: Veja a transcrição e tradução de cada frase
   - **Painel Direito**: Receba sugestões de respostas apropriadas

4. **Use as sugestões de resposta**:
   - Clique no ícone de som 🔊 para ouvir a pronúncia
   - Clique no ícone de cópia 📋 para copiar o texto
   - As respostas são geradas baseadas no contexto da conversa

## 🎯 Casos de Uso

### 1. Entrevistas de Emprego
- Adicione o PDF da descrição da vaga
- Cole o link do perfil da empresa no LinkedIn
- Receba sugestões de respostas contextualizadas

### 2. Reuniões de Negócios
- Upload de apresentações ou propostas em PDF
- Links de apresentações do Canva
- Sugestões de respostas profissionais

### 3. Prática de Idiomas
- Conversas casuais com falantes nativos
- Sugestões simples para iniciantes
- Prática de pronúncia com text-to-speech

### 4. Entrevistas Acadêmicas
- PDFs de artigos ou trabalhos relevantes
- Sugestões de respostas técnicas baseadas no contexto

## 🔧 Estrutura do Projeto

```
transcribe-saas/
├── app/
│   ├── api/              # API Routes
│   │   ├── translate/    # Tradução
│   │   ├── generate-response/  # Geração de respostas
│   │   ├── extract-pdf/  # Extração de PDFs
│   │   └── extract-url/  # Extração de URLs
│   ├── globals.css       # Estilos globais
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Página inicial
├── components/           # Componentes React
│   ├── InterviewTranslator.tsx  # Componente principal
│   ├── TranscriptPanel.tsx      # Painel de transcrição
│   ├── ResponsePanel.tsx        # Painel de sugestões
│   ├── ContextPanel.tsx         # Painel de contexto
│   └── LanguageSelector.tsx     # Seletor de idiomas
├── lib/                  # Bibliotecas e serviços
│   ├── speechRecognition.ts     # Web Speech API
│   ├── translationService.ts    # Serviço de tradução
│   ├── responseGenerator.ts     # Gerador de respostas
│   └── contextExtractor.ts      # Extrator de contexto
└── package.json
```

## 🌐 Suporte de Navegadores

| Navegador | Transcrição | Text-to-Speech | Recomendado |
|-----------|-------------|----------------|-------------|
| Chrome    | ✅          | ✅             | ✅          |
| Edge      | ✅          | ✅             | ✅          |
| Safari    | ⚠️          | ✅             | ⚠️          |
| Firefox   | ❌          | ✅             | ❌          |

**Nota**: Para melhor experiência, use Google Chrome ou Microsoft Edge.

## 🔑 Funcionalidades da API

### Tradução
- Endpoint: `/api/translate`
- Utiliza GPT-4 Turbo para traduções precisas
- Suporta detecção automática de idioma

### Geração de Respostas
- Endpoint: `/api/generate-response`
- Gera 3 sugestões de resposta por pergunta
- Adapta o nível de dificuldade (A1-C2)
- Considera o contexto fornecido

### Extração de Contexto
- PDFs: `/api/extract-pdf`
- URLs: `/api/extract-url`
- Texto: `/api/extract-text`
- Resumo automático e pontos-chave

## 🔐 Sobre Segurança da API

### Modo Frontend (Configuração via Interface)
- ✅ **Vantagens**: Fácil de configurar, ideal para desenvolvimento local
- ⚠️ **Atenção**: A chave fica visível no navegador (localStorage)
- 📝 **Uso recomendado**: Testes locais e desenvolvimento
- 🔒 **Segurança**: Não compartilhe sua chave, use apenas localmente

### Modo Backend (Variável de Ambiente)
- ✅ **Vantagens**: Mais seguro, chave não exposta no frontend
- ✅ **Uso recomendado**: Produção e ambientes compartilhados
- 🔒 **Segurança**: A chave permanece no servidor

## 💡 Dicas de Uso

1. **Configure sua API Key**: Obtenha gratuitamente em platform.openai.com
2. **Microfone de Qualidade**: Use um bom microfone para melhor precisão
3. **Ambiente Silencioso**: Reduza ruído de fundo para melhor transcrição
4. **Fale Claramente**: Pause entre frases para melhor detecção
5. **Adicione Contexto**: Mais contexto = respostas mais relevantes
6. **Pratique a Pronúncia**: Use o text-to-speech para aprender
7. **Escolha o Modelo Certo**: GPT-4 para melhor qualidade, GPT-3.5 para rapidez

## 🚧 Desenvolvimento Futuro

- [ ] Suporte offline com modelos locais
- [ ] Gravação e exportação de sessões
- [ ] Integração com mais fontes de contexto (Google Docs, Notion)
- [ ] Modo de prática com feedback de pronúncia
- [ ] Suporte para múltiplos participantes
- [ ] Analytics de aprendizado de idiomas

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests

## 🆘 Suporte

Se encontrar problemas:
1. Verifique se está usando Chrome/Edge
2. Confirme que a chave da OpenAI está configurada
3. Verifique as permissões do microfone
4. Consulte os logs do console do navegador

## 🎓 Créditos

Desenvolvido com ❤️ usando Next.js, OpenAI, e Web APIs modernas.
