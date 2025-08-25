# IA Dev Academy

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Tech](https://img.shields.io/badge/tech-JavaScript%20%7C%20HTML5%20%7C%20CSS3-yellow)

> **IA Dev Academy** é uma plataforma web inovadora que gera trilhas de estudo personalizadas sobre qualquer tema de tecnologia utilizando **Google Gemini AI**.

A plataforma guia o usuário através de módulos e subtópicos com aulas interativas, avaliações, feedback detalhado e certificados de conclusão — **tudo gerado dinamicamente**.

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

- **Geração Dinâmica de Currículo**  
  Digite um tema e a IA _"Coordenador"_ cria um plano de estudos completo com módulos e subtópicos.

- **Aulas Interativas**  
  Cada subtópico é ensinado por uma IA _"Professor"_, que explica conceitos e permite aprofundamento ou perguntas abertas.

- **Avaliações Geradas por IA**  
  Ao final de cada tópico, uma IA _"Avaliador"_ gera quizzes de múltipla escolha.

- **Feedback Personalizado**  
  Se o aluno errar uma questão, a IA _"Tutor"_ fornece explicações detalhadas e encorajadoras.

- **Certificado de Conclusão**  
  Gere e baixe um certificado personalizado ao concluir a trilha.

- **Onboarding Interativo**  
  Tutorial passo a passo para novos usuários.

- **Assistente IA Integrado**  
  Botão flutuante que abre um assistente externo em um _iframe_:  
  [chat.deepseek.com](https://chat.deepseek.com)

- **Configurações Personalizadas**

  - Alternar modo escuro/claro
  - Habilitar/desabilitar o assistente
  - Alterar o nome do certificado

- **Modo API vs. Modo Manual**

  - **API:** conteúdo gerado automaticamente
  - **Manual:** prompts e respostas colados manualmente
  - _Modo padrão: Manual_

- **Acompanhamento de Progresso**  
  Uso de `localStorage` para salvar o progresso localmente.

---

## 🚀 Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS)
- **API de IA:** Google Gemini 1.5 Flash
- **Certificados:** `html2canvas` para exportar em PNG
- **Armazenamento:** `localStorage`
- **Backend:** `n8n.cloud` como intermediário para proteger a chave do Gemini

---

## ⚙️ Como Funciona o Fluxo de IAs

A aplicação utiliza diferentes _personas_ de IA, cada uma com um papel específico:

- **Coordenador IA:** Recebe o tema e retorna um currículo estruturado em JSON.
- **Professor IA:** Cria a aula e opções de interação para cada subtópico.
- **Avaliador IA:** Gera um quiz com 8 questões de múltipla escolha baseado no conteúdo.
- **Tutor IA:** Explica detalhadamente os erros cometidos pelo aluno.

---

## 🛠️ Configuração e Instalação Local

### Pré-requisitos

- Navegador web moderno (Chrome, Firefox, etc.)
- **Visual Studio Code** com a extensão _Live Server_ (recomendado)
- Chave de API do **Google Gemini**

### Passos

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/ia-dev-academy.git
   Acesse o diretório do projeto:
   ```

bash
Copiar
Editar
cd ia-dev-academy
Configure a chave da API (opcional para Modo API):

Por padrão, a aplicação usa um webhook n8n para proteger a chave do Gemini.

Para desenvolvimento local, edite script.js:

javascript
Copiar
Editar
if (useApi) {
// Substitua a chamada ao API_BACK_END pela sua chave local
}
Inicie a aplicação:

Clique com o botão direito em index.html

Selecione "Open with Live Server"

O navegador abrirá automaticamente

👨‍💻 Como Usar
Abra a página e siga o tutorial inicial.

Digite o tema da trilha que deseja criar.

Escolha Modo Manual ou Modo API.

Clique em "Gerar Trilha".

Acompanhe seu progresso em "Minhas Trilhas".

Estude, interaja com a IA e faça as avaliações.

Ao concluir, gere seu certificado personalizado.

📄 Licença
Este projeto está licenciado sob a Licença MIT.
