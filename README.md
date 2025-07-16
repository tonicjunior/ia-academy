# IA Dev Academy: Plataforma de Aprendizagem Dinâmica

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)
![API](https://img.shields.io/badge/API-Gemini_1.5_Flash-purple.svg)

IA Dev Academy é uma aplicação web inovadora que gera trilhas de estudo personalizadas sobre qualquer tema de tecnologia, utilizando o poder da Inteligência Artificial do Google Gemini. A plataforma guia o usuário através de módulos e subtópicos com aulas interativas, avaliações e feedback detalhado, tudo gerado dinamicamente.

## ✨ Funcionalidades Principais

-   **Geração Dinâmica de Currículo**: Insira um tema (ex: "JavaScript Assíncrono") e a IA "Coordenador" criará um plano de estudos completo, com módulos e subtópicos.
-   **Aulas Interativas**: Cada subtópico é ensinado por uma IA "Professor", que explica os conceitos e oferece opções de aprofundamento, exemplos práticos e analogias.
-   **Perguntas Abertas**: O aluno pode fazer suas próprias perguntas a qualquer momento, saindo do fluxo pré-definido.
-   **Avaliações Geradas por IA**: Ao final de cada tópico, uma IA "Avaliador" cria um quiz de múltipla escolha para testar o conhecimento adquirido.
-   **Feedback Personalizado**: Se o aluno errar alguma questão, uma IA "Tutor" explica detalhadamente o erro e a resposta correta de forma didática e encorajadora.
-   **Acompanhamento de Progresso**: A plataforma salva seu progresso na trilha, mostrando quais tópicos já foram concluídos.
-   **Modo Manual**: Permite que desenvolvedores testem a interface colando respostas JSON manualmente, sem a necessidade de uma chave de API.

## 🚀 Tecnologias Utilizadas

-   **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS)
-   **API de IA**: [Google Gemini 1.5 Flash](https://ai.google.dev/)
-   **Armazenamento Local**: `localStorage` do navegador para salvar o estado da aplicação e o progresso do usuário.
-   **Backend (Gerenciamento de Chave)**: O código está configurado para buscar a chave da API de um endpoint externo (ex: Railway), protegendo a chave de ser exposta no lado do cliente.

## ⚙️ Como Funciona o Fluxo de IAs

A aplicação orquestra diferentes "personas" de IA, cada uma com um prompt e uma responsabilidade específica, para criar uma experiência de aprendizado coesa:

1.  **Coordenador IA**: Recebe o tema do usuário e retorna um JSON estruturado com o currículo completo (`módulos` e `subtópicos`).
2.  **Professor IA**: Recebe o histórico da conversa e o subtópico atual. Retorna um JSON com a `narrativa` da aula e as `opções` de interação para o aluno.
3.  **Avaliador IA**: Recebe o histórico da aula e o título do subtópico. Retorna um JSON com um array de 10 questões de múltipla escolha.
4.  **Tutor IA**: Recebe as questões que o aluno errou. Retorna um JSON com um array de `explicações` detalhadas para cada erro.

## 🛠️ Configuração e Instalação Local

Para rodar este projeto em sua máquina local, siga os passos abaixo.

### Pré-requisitos

-   Um navegador web moderno (Chrome, Firefox, etc.).
-   [Visual Studio Code](https://code.visualstudio.com/) com a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (recomendado para evitar problemas de CORS).
-   Uma chave de API do **Google Gemini**. Você pode obter uma no [Google AI Studio](https://aistudio.google.com/app/apikey).

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/ia-dev-academy.git](https://github.com/seu-usuario/ia-dev-academy.git)
    ```

2.  **Navegue até a pasta do projeto:**
    ```bash
    cd ia-dev-academy
    ```

3.  **Configure a Chave da API:**
    O projeto está configurado para buscar a chave de um backend. Para desenvolvimento local, a maneira mais fácil é modificar o código para usar sua chave diretamente.

    -   Abra o arquivo de código principal (ex: `script.js`).
    -   Encontre a função `loadApiKeys()` e comente ou remova seu conteúdo.
    -   Defina a variável `GEMINI_API_KEY` com a sua chave.

    **Exemplo de modificação:**
    ```javascript
    // Em seu arquivo JS principal

    let GEMINI_API_KEY = "SUA_CHAVE_API_DO_GEMINI_VAI_AQUI";

    // async function loadApiKeys() {
    //   try {
    //     const response = await fetch(`${BACKEND_API_URL}/get-chat-key`);
    //     if (!response.ok) throw new Error(`Status: ${response.status}`);
    //     const data = await response.json();
    //     GEMINI_API_KEY = data.key;
    //   } catch (error) {
    //     // ... resto do código de erro
    //   }
    // }
    ```
    **Atenção**: Nunca submeta sua chave de API para um repositório Git público. Use esta abordagem apenas para testes locais.

4.  **Inicie a aplicação:**
    -   Clique com o botão direito no arquivo `index.html`.
    -   Selecione "Open with Live Server".
    -   Seu navegador abrirá a aplicação.

## 👨‍💻 Como Usar

1.  Abra a aplicação no seu navegador.
2.  Na tela inicial, digite o tema que você deseja aprender na caixa de texto.
3.  Clique em "Criar Trilha".
4.  Aguarde a IA gerar o currículo e navegue para a tela de aprendizado.
5.  Siga as aulas, interaja com o Professor IA e faça as avaliações.
6.  Seu progresso será salvo automaticamente!

## 📄 Licença

Este projeto está licenciado sob a Licença MIT.
