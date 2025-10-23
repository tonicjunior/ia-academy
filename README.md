# 🎓 IA.Academy

> Um sistema de aprendizado dinâmico e totalmente front-end que transforma qualquer tema em uma trilha de estudos interativa — gerada por Inteligência Artificial.

---

## 🧠 Visão Geral

O **IA.Academy** é uma **Single Page Application (SPA)** que atua como um orquestrador de **Atores de IA** — agentes especializados que colaboram para gerar uma experiência educacional completa a partir de um único tema.  

Por exemplo, ao inserir o tema **"JavaScript para iniciantes"**, o sistema cria automaticamente:

- Um **currículo completo** (módulos e subtópicos);
- **Aulas interativas** divididas por etapas;
- **Avaliações inteligentes**;
- E **feedbacks personalizados** com base no desempenho do aluno.

---

## ⚙️ Como Funciona — A Orquestra de IAs

O sistema é composto por quatro Atores principais, cada um com uma função específica dentro da jornada de aprendizado:

### 🎯 1. Coordenador (COORDENADOR)
- **Entrada:** Um tema (ex: `"História da Arte Renascentista"`)
- **Saída:** Um **plano de estudos JSON** com 3–5 módulos e 4–6 subtópicos por módulo.  
  Cada subtópico contém um `learningObjective` (objetivo de aprendizado) mensurável e atômico.

---

### 👨‍🏫 2. Professor (PROFESSOR)
- **Entrada:** Um `learningObjective` (ex: `"Explicar a técnica do sfumato usada por Da Vinci"`)
- **Saída:** A aula dividida em 3 etapas:
  1. **Fundamento:** Explicação do conceito central.  
  2. **Aplicação:** Exemplo prático contextualizado.  
  3. **Síntese:** Conclusão com reforço de aprendizado.  

O Professor também responde perguntas do aluno (`userQuestion`) relacionadas ao tópico atual.

---

### 🧩 3. Avaliador (AVALIADOR)
- **Entrada:** O `learningObjective` e o conteúdo ensinado (`consolidatedContent`).
- **Saída:** Um array JSON com **8 perguntas de múltipla escolha**, contendo:
  - Distratores “quase certos”;
  - Tipos de questões variados (compreensão, aplicação, análise causal);
  - Baseadas **exclusivamente** no conteúdo ensinado.

---

### 🧙 4. Tutor (TUTOR)
- **Entrada:** Perguntas erradas, respostas do aluno e o `learningObjective`.
- **Saída:** Uma explicação detalhada e encorajadora:
  - Por que a resposta correta está certa;
  - Por que a resposta do aluno estava errada.

---

## 🚀 Principais Funcionalidades

- **🎓 Geração Dinâmica de Cursos:** Crie trilhas completas a partir de qualquer tema.
- **🔁 Dois Modos de Operação:**
  - **Modo API:** Conecta-se a um endpoint backend (webhook n8n) e processa tudo automaticamente.
  - **Modo Manual:** Exibe o prompt ao usuário, permitindo usar a IA de sua preferência e colar o resultado JSON de volta.
- **💬 Aulas Interativas:** Estrutura de aprendizado em etapas, com respostas dinâmicas.
- **🧠 Avaliações Inteligentes:** Quizzes automáticos com pontuação e feedback tutorado.
- **🔀 Embaralhamento de Respostas:** Ordem aleatória a cada tentativa (`shuffleArray`).
- **📈 Gerenciamento de Progresso:** Todo o progresso é salvo no `localStorage`.
- **📜 Certificado de Conclusão:** Geração de certificado em PNG (via `html2canvas`) com nome e título da trilha.
- **🌙 Tema Escuro (Dark Mode).**
- **🔍 Controles de Zoom.**
- **📱 Design Responsivo.**
- **🤖 Integração com IA Externa:** Chat via iframe com [chat.deepseek.com](https://chat.deepseek.com).
- **🎮 Tutorial de Onboarding:** Ajuda para novos usuários.

---

## 🧩 Tecnologias Utilizadas

| Área | Tecnologia |
|------|-------------|
| **Front-End** | HTML5, CSS3 (variáveis CSS), JavaScript (ES6+) |
| **Estado Global** | JavaScript puro (`appState`) |
| **Persistência** | `localStorage` |
| **Geração de Certificado** | `html2canvas` |
| **IA - Backend (Modo API)** | Integração com endpoint configurável (atualmente: [Webhook n8n](https://academy01.app.n8n.cloud/webhook/academy)) |
| **IA - Modo Manual** | `iframe` com [chat.deepseek.com](https://chat.deepseek.com) |

---

## 💻 Como Executar Localmente

Este projeto é **100% front-end** e **não requer build ou dependências** externas.

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seuusuario/IA.Academy.git
   ```

2. **Abra o arquivo principal:**
   ```bash
   cd IA.Academy
   ```

3. **Execute localmente:**
   - Basta abrir o arquivo `index.html` em qualquer navegador moderno.

4. **(Opcional) Ativar o Modo API:**
   - Vá até o menu **Configurações** e ative o modo **API**.
   - Certifique-se de que o endpoint configurado em `API_BACK_END` dentro de `script.js` está ativo e pronto para processar os prompts definidos em `PROMPTS`.

---

## 🧭 Estrutura do Projeto

```
IA.Academy/
├── index.html
├── script.js
├── style.css
├── assets/
│   ├── icons/
│   ├── certificates/
│   └── onboarding/
└── README.md
```

---

## 🏆 Contribuições

Contribuições são bem-vindas!  
Sinta-se à vontade para abrir **issues**, propor **melhorias**, ou enviar **pull requests**.  

---

## 📜 Licença

Este projeto é distribuído sob a licença **MIT**.  
Você pode usá-lo, modificá-lo e distribuí-lo livremente, desde que mantenha a atribuição ao autor original.

> “A IA não substitui o aprendizado — ela o potencializa.” 🚀

---