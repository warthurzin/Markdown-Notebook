# 📝 Markdown Notebook

<div align="center">

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)

</div>

Um editor de Markdown moderno com **pré-visualização em tempo real**, **autenticação via Google** e **armazenamento em nuvem** com Firebase. Ideal para estudantes e escritores que querem organizar suas anotações técnicas ou pessoais com praticidade e estilo.


---

## ✨ Funcionalidades

- ✅ Editor com suporte a **Markdown + GFM** (checklists, tabelas, código)
- 🔍 Pré-visualização ao vivo com **React Markdown**
- ☁️ Salve suas anotações diretamente no **Firebase Firestore**
- 🔐 Login seguro com conta Google (Firebase Auth)
- 🧠 Interface limpa e responsiva com **Tailwind CSS**
- ⚡ Build rápido com **Vite + React + TypeScript**

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 16 ou superior) - [Download aqui](https://nodejs.org/)
- **npm** ou **yarn** (vem com o Node.js)
- **Conta Google** (para autenticação)
- **Projeto Firebase** (gratuito) - [Criar projeto](https://console.firebase.google.com/)

---

## 🚀 Instalação e Uso

### 1. Clone o repositório
```bash
git clone https://github.com/<seu-usuario>/markdown-notebook.git
cd markdown-notebook
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
```

### 3. Configure o Firebase

#### 3.1 Crie um projeto no Firebase
1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Criar projeto"
3. Siga os passos de configuração

#### 3.2 Ative os serviços necessários
- **Authentication**: Vá em Authentication → Sign-in method → Google → Ativar
- **Firestore**: Vá em Firestore Database → Criar banco de dados → Modo teste

#### 3.3 Obtenha as credenciais
1. Vá em Configurações do projeto (ícone de engrenagem)
2. Role até "Seus apps" → "Configuração do SDK"
3. Copie as credenciais

#### 3.4 Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_KEY=sua_api_key_aqui
VITE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_PROJECT_ID=seu-projeto-id
VITE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_MESSAGING_SENDER_ID=123456789
VITE_APP_ID=1:123456789:web:abcdef123456
```

> 💡 **Dica**: Use o arquivo `.env.example` como referência

### 4. Rode o projeto localmente
```bash
npm run dev
# ou
yarn dev
```

O app estará disponível em `http://localhost:5173` 🎉

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera build para produção |
| `npm run preview` | Preview do build de produção |


---

## 📁 Estrutura do Projeto

```
markdown-notebook/
├── public/                  # Arquivos estáticos
├── src/
│   ├── components/         # Componentes React
│   │   ├── Editor/        # Componentes do editor
│   │   ├── Auth/          # Componentes de autenticação
│   │   └── UI/            # Componentes de interface
│   ├── hooks/             # Custom hooks
│   ├── services/          # Serviços (Firebase, etc.)
│   ├── types/             # Definições TypeScript
│   ├── utils/             # Funções utilitárias
│   ├── styles/            # Estilos globais
│   ├── App.tsx            # Componente principal
│   └── main.tsx           # Ponto de entrada
├── docs/                  # Documentação e imagens
├── .env.example           # Exemplo de variáveis de ambiente
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 📸 Capturas de Tela

### 🖥️ Desktop
![Editor Desktop](https://i.imgur.com/0PHExsz.png)
*Interface principal - Editor e preview lado a lado*

### 📱 Mobile
![Mobile View](https://i.imgur.com/svy8Bf4_d.jpeg?maxwidth=520&shape=thumb&fidelity=high)

*Versão responsiva para dispositivos móveis*

### 🔐 Autenticação
![Login](https://i.imgur.com/budRpi5.png)

*Tela de login com Google*

---

## 🔧 Problemas Comuns

### ❌ Erro de autenticação
**Problema**: "Firebase: Error (auth/unauthorized-domain)"
**Solução**: 
1. Vá no Firebase Console → Authentication → Settings → Authorized domains
2. Adicione `localhost` e seu domínio de produção

### ❌ Build falha
**Problema**: Variáveis de ambiente não encontradas
**Solução**: Certifique-se que o arquivo `.env` existe e todas as variáveis estão preenchidas

### ❌ Firestore permission denied
**Problema**: Não consegue salvar anotações
**Solução**: Verifique se as regras do Firestore estão configuradas corretamente:

```javascript
// Regras do Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 🛠 Tecnologias Utilizadas

<div align="center">

### Frontend
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Markdown](https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white)](https://github.com/remarkjs/react-markdown)

### Backend & Infraestrutura
[![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)](https://firebase.google.com/)
[![Firestore](https://img.shields.io/badge/Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/products/firestore)

### Ferramentas de Desenvolvimento
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](https://github.com/warthurzin/Markdown-Notebook?tab=MIT-1-ov-file) para detalhes.

---

<div align="center">

**⭐ Se este projeto te ajudou, considere dar uma estrela! ⭐**

**Feito por [Arthur Silveira](https://github.com/warthurzin)**

</div>