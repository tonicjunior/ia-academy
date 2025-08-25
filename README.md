# IA Dev Academy

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Tech](https://img.shields.io/badge/tech-JavaScript%20%7C%20HTML5%20%7C%20CSS3-yellow)

> **IA Dev Academy** é uma plataforma web que cria trilhas de estudo personalizadas sobre temas de tecnologia utilizando **IA**.

A plataforma conduz o usuário por módulos e subtópicos com aulas interativas, avaliações, feedback detalhado e certificados de conclusão tudo gerado dinamicamente.

---

## 📚 Sumário

- [✨ Funcionalidades Principais](#-funcionalidades-principais)
- [🚀 Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [⚙️ Como Funciona o Fluxo de IAs](#️-como-funciona-o-fluxo-de-ias)
- [🛠️ Configuração e Instalação Local](#️-configuração-e-instalação-local)
- [👨‍💻 Como Usar](#-como-usar)
- [📄 Licença](#-licença)

---

## ✨ Funcionalidades Principais

- **Geração de Currículo Personalizado**  
  Digite um tema e a IA _Coordenador_ cria um plano de estudos estruturado.

- **Aulas Interativas**  
  Cada subtópico é ensinado por uma IA _Professor_, com explicações dinâmicas e interações.

- **Avaliações Inteligentes**  
  Ao final de cada tópico, a IA _Avaliador_ gera quizzes de múltipla escolha.

- **Feedback Detalhado**  
  Em caso de erro, a IA _Tutor_ explica de forma clara os conceitos e aponta melhorias.

- **Certificado de Conclusão**  
  Gere e baixe um certificado personalizado ao finalizar sua trilha.

- **Assistente IA Integrado**  
  Um botão flutuante abre um assistente via [chat.deepseek.com](https://chat.deepseek.com).

- **Modos Flexíveis (API e Manual)**  
  - **API:** conteúdo gerado automaticamente via n8n
  - **Manual:** prompts inseridos manualmente

- **Progresso Salvo Localmente**  
  Utiliza `localStorage` para armazenar seu progresso.

---

## 🚀 Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **API de IA:** webhook n8n
- **Certificados:** `html2canvas` (exportação em PNG)
- **Armazenamento:** `localStorage`
- **Backend:** n8n.cloud (proteção da chave do Gemini, DEEPSEAK, OPENAI etc)

---

## ⚙️ Como Funciona o Fluxo de IAs

- **Coordenador IA:** Recebe o tema e gera um currículo estruturado em JSON.
- **Professor IA:** Cria o conteúdo de cada subtópico.
- **Avaliador IA:** Gera quizzes de 8 perguntas por módulo.
- **Tutor IA:** Fornece explicações detalhadas para respostas incorretas.

---

## 🛠️ Configuração e Instalação Local

### Pré-requisitos

- Navegador web atualizado
- **Visual Studio Code** com extensão *Live Server* (recomendado)
- Chave de API do **Google Gemini** (opcional)

### Passos

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/ia-dev-academy.git
   ```

2. **Acesse o diretório do projeto:**
   ```bash
   cd ia-dev-academy
   ```

3. **Configure a chave da API (opcional):**
   - Por padrão, a aplicação usa um **webhook n8n** para proteger a chave.
   - Para desenvolvimento local, edite `script.js`:
     ```javascript
     if (useApi) {
         // Substitua a chamada ao API_BACK_END pela sua chave local
     }
     ```

4. **Inicie a aplicação:**
   - Clique com o botão direito em `index.html`
   - Selecione **"Open with Live Server"**
   - O navegador abrirá automaticamente

---

## 👨‍💻 Como Usar

1. Abra a página inicial e siga o tutorial.
2. Digite o tema da trilha que deseja criar.
3. Escolha entre **Modo Manual** ou **Modo API**.
4. Clique em **"Gerar Trilha"**.
5. Acompanhe seu progresso em **"Minhas Trilhas"**.
6. Estude, interaja com a IA e faça as avaliações.
7. Gere seu certificado personalizado ao concluir.

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT**.
