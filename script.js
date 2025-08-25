const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const STORAGE_KEY = "iaDevAcademy_v9_state";
const CERTIFICATE_KEY = "iaAcademy_v9_certificate_info";
const TUTORIAL_KEY = "iaAcademy_v1_tutorial_shown";
const SHOW_SUPPORT_PROMPT = true;
const API_BACK_END = "https://academy01.app.n8n.cloud/webhook/academy";
let appState = {};
let onManualResponseSubmit = null;
const THEME_KEY = "iaAcademy_theme_setting";
let generatedCertificateUrl = null;
let generatedCertificateName = null;
const ZOOM_KEY = "iaAcademy_zoom_level"; // Nova constante
let currentZoomLevel = 1; // Nova variável

const API_MODE_KEY = "iaAcademy_api_mode";
const ASSISTANT_ENABLED_KEY = "iaAcademy_assistant_enabled";
const tutorialSteps = [
  {
    title: "Bem-vindo(a) ao IA.Academy!",
    content: `Este é o seu assistente pessoal de aprendizado. Vamos ver como você pode transformar qualquer assunto em uma trilha de estudos completa em segundos.`,
  },
  {
    title: "1. Crie sua Trilha de Estudos",
    content: `Tudo começa aqui! No campo <strong>"Qual trilha você quer criar hoje?"</strong>, digite o tema que você deseja aprender. Pode ser qualquer coisa, como "JavaScript para iniciantes" ou "História da Arte Renascentista".`,
  },
  {
    title: "2. Escolha o Modo de Geração",
    content: `Você pode escolher entre dois modos:<br><br>
              <strong>Modo Manual:</strong> Nós te damos o prompt e você mesmo(a) cola no seu assistente de IA preferido para gerar o conteúdo.<br>
              <strong>Modo API:</strong> Deixa que a nossa IA cuida de tudo automaticamente para você!`,
  },
  {
    title: "3. Acesse e Estude",
    content: `Após gerar, sua nova trilha aparecerá na seção <strong>"Minhas Trilhas"</strong>. Basta clicar em "Continuar" para mergulhar no aprendizado, com aulas, exemplos e avaliações.`,
  },
  {
    title: "4. Ajuste as Configurações",
    content: `No canto superior direito, você encontrará o ícone de engrenagem. Clique nele para personalizar sua experiência: ativar o <strong>Modo Escuro</strong>, gerenciar seu nome para os certificados e ajustar outras preferências.`,
  },
  {
    title: "5. Use o Assistente Externo (Modo Manual)",
    content: `No canto inferior direito, você verá um ícone de chat. Ele abre uma janela com uma IA externa. Se estiver no <strong>Modo Manual</strong>, pode usar essa janela para colar os prompts que fornecemos e gerar o conteúdo da sua trilha, tudo sem precisar sair da nossa plataforma.`,
  },
  {
    title: "6. Dica de Login no Assistente",
    content: `Para sua segurança, serviços como o Google bloqueiam o login dentro de janelas integradas. Por isso, a autenticação com um clique pode falhar. <strong>Prefira sempre o login com e-mail e senha.</strong> Fique tranquilo: nosso site não tem acesso a nenhuma informação digitada lá. Se preferir, crie uma conta nova no serviço de IA para usar aqui.`,
  },
  {
    title: "7. Ou Use Sua IA Preferida",
    content: `Não quer usar a janela do assistente? Sem problemas! No Modo Manual, você sempre pode usar o botão <strong>'Copiar Prompt'</strong>. Com o prompt copiado, basta colar na sua ferramenta de IA favorita, como o ChatGPT, Claude, Copilot ou qualquer outra.`,
  },
  {
    title: "Tudo Pronto!",
    content: `É simples assim. Agora você está pronto(a) para começar a aprender. Clique no botão abaixo para criar sua primeira trilha. Bom estudo!`,
  },
];

let currentTutorialStep = 0;

function showTutorial() {
  $("#tutorial-modal").classList.remove("hidden");
  renderTutorialStep(currentTutorialStep);
}

function applyZoom() {
  document.body.style.zoom = currentZoomLevel;
  $("#zoom-level-display").textContent = `${Math.round(
    currentZoomLevel * 100
  )}%`;
  localStorage.setItem(ZOOM_KEY, currentZoomLevel);
}

function initializeZoom() {
  const savedZoom = localStorage.getItem(ZOOM_KEY);
  if (savedZoom) {
    currentZoomLevel = parseFloat(savedZoom);
  }
  applyZoom();
}

function renderTutorialStep(stepIndex) {
  const step = tutorialSteps[stepIndex];
  $("#tutorial-title").textContent = step.title;
  $("#tutorial-step-content").innerHTML = step.content;

  $("#tutorial-prev-btn").classList.toggle("hidden", stepIndex === 0);
  $("#tutorial-next-btn").classList.toggle(
    "hidden",
    stepIndex === tutorialSteps.length - 1
  );
  $("#tutorial-finish-btn").classList.toggle(
    "hidden",
    stepIndex !== tutorialSteps.length - 1
  );

  const progressContainer = $("#tutorial-progress");
  progressContainer.innerHTML = "";
  for (let i = 0; i < tutorialSteps.length; i++) {
    const dot = document.createElement("div");
    dot.className = "progress-dot";
    if (i === stepIndex) {
      dot.classList.add("active");
    }
    progressContainer.appendChild(dot);
  }
}

function closeTutorial() {
  $("#tutorial-modal").classList.add("hidden");
  localStorage.setItem(TUTORIAL_KEY, "true");
  checkCertificateInfo();
}

const ICONS = {
  LOCKED: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  UNLOCKED: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`,
  COMPLETED: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
};

const PROMPTS = {
  COORDENADOR: `Você é um Coordenador Acadêmico de IA. Sua tarefa é criar um plano de estudos detalhado e granular para um tema. A resposta deve ser ESTRITAMENTE um objeto JSON puro.

REGRAS:
1. **Estrutura Fixa**: A resposta DEVE seguir a estrutura: { "title": "...", "description": "...", "modules": [ { "title": "...", "subtopics": [ { "title": "...", "learningObjective": "..." } ] } ] }.
2. **Conteúdo**: Crie de 3 a 5 módulos. Cada módulo deve ter de 4 a 6 subtópicos, ordenados de forma lógica (básico ao avançado).
3. **Objetivo de Aprendizagem (CRÍTICO!)**: O 'learningObjective' é a regra mais importante. Ele deve ser **atômico e mensurável**. Cada subtópico deve focar em UMA ÚNICA habilidade ou conhecimento.
   * **Exemplo RUIM**: "Aprender sobre Chambari". (Muito amplo)
   * **Exemplo BOM**: "Definir o que é o prato Chambari, listando seus ingredientes essenciais." (Focado e mensurável)
   * **Exemplo BOM**: "Explicar o método de cozimento lento tradicional do Chambari." (Focado em um processo específico)
4. **Formato**: Não inclua nenhum texto ou formatação fora do objeto JSON.`,
  PROFESSOR: `Você é o 'Professor IA', um especialista didático e envolvente. Sua missão é criar aulas didáticas, ricas e **altamente focadas**, evitando explorar temas que serão tratados em outros momentos. Sua resposta DEVE SEMPRE seguir a estrutura JSON especificada.

REGRAS GERAIS:
1. **FOCO ABSOLUTO NO OBJETIVO**: O conteúdo deve servir **exclusivamente para que o aluno atinja o 'learningObjective' recebido**. Ensine apenas o que é estritamente necessário para cumprir esse objetivo, ignorando temas tangenciais que pertençam a outros subtópicos.
2. **NARRATIVA DIDÁTICA**: A 'narrative' deve ser clara, organizada e de fácil assimilação, usando analogias simples, exemplos concretos e explicações estruturadas. Use Markdown para dar destaque a termos, listas e conceitos importantes.
3. **LIMITE DE EXPLICAÇÃO**:
   * Cada chamada ('callNumber') deve entregar um conteúdo completo, mas **sem extrapolar** o escopo daquela etapa.
   * Não antecipe conteúdos de chamadas futuras. A aplicação só pode ser ensinada depois do fundamento.
4. **FORMATO DE SAÍDA FIXO**: A resposta DEVE SEMPRE usar este formato JSON, sem exceções:
   {
     "narrative": "Seu texto aqui.",
     "options": [
       { "text": "Texto da opção 1", "action": "..." },
       { "text": "Texto da opção 2", "action": "..." }
     ],
     "isTopicEnd": false
   }

---
### MODO ENSINO (Input contém 'callNumber')
Input de exemplo: \`{ "subtopicTitle": "...", "learningObjective": "...", "callNumber": X }\`

**Etapas obrigatórias:**
- **callNumber = 1** → *Fundamento* — Explique o conceito central necessário para o 'learningObjective'. Use analogias e seja direto.
- **callNumber = 2** → *Aplicação* — Mostre como o conceito é usado ou aplicado na prática, com um exemplo que ilustre diretamente o 'learningObjective'.
- **callNumber = 3** → *Síntese e Relevância* — Reforce a importância do que foi ensinado, conecte todo o conteúdo apresentado diretamente ao 'learningObjective' e encerre o subtópico. O \`isTopicEnd\` deve ser \`true\`.

5. **CONSTRUÇÃO DAS OPTIONS**:
   * Para 'callNumber' 1 e 2: Ofereça opções para prosseguir, aprofundar um termo e ou conceito  Ex: [{ "text": "Continuar", "action": "prosseguir" }, { "text": "O que significa [termo]?", "action": "aprofundar_especifico" }, { "text": "O que significa [conceito]?", "action": "aprofundar_especifico" }]
   * Para 'callNumber' 3: Ofereça opções para iniciar a avaliação ou revisar.

---
### MODO RESPOSTA (Input contém 'userQuestion')
Input de exemplo: \`{ "subtopicTitle": "...", "learningObjective": "...", "userQuestion": "..." }\`

**Procedimento:**
1. Avalie se a pergunta é relevante para o **'learningObjective' atual**.
2. Responda com clareza e simplicidade.
3. Se for irrelevante, indique com educação que a pergunta será abordada em outro momento e traga o aluno de volta ao foco do objetivo atual.

As 'options' devem sempre guiar o aluno de volta à trilha. Exemplo:
\`[ { "text": "Entendi, podemos continuar.", "action": "prosseguir" } ]\`

**'isTopicEnd'**: Sempre \`false\` neste cenário.`,
  AVALIADOR: `Você é um 'Avaliador de IA' preciso e rigoroso. Sua tarefa é criar uma avaliação que meça EXCLUSIVAMENTE se o objetivo de aprendizado foi alcançado, com base no conteúdo ensinado.

REGRAS OBRIGATÓRIAS:
1. **Input do Sistema**: Você receberá: \`{ "learningObjective": "...", "consolidatedContent": "Todo o texto das narrativas do professor para este subtópico." }\`.
2. **Fonte Única da Verdade**: Crie perguntas e alternativas usando APENAS as informações contidas em 'consolidatedContent'. Não adicione conhecimento externo.
3. **Foco no Objetivo**: As perguntas devem AVALIAR DIRETAMENTE a habilidade descrita no 'learningObjective'. Se o objetivo era "comparar X e Y", a pergunta deve exigir essa comparação.
4. **Formato de Resposta**: A resposta DEVE ser um array JSON contendo exatamente 8 objetos de questão.
5. **Estrutura do Objeto de Questão**:
   {
     "question": "Texto da pergunta?",
     "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
     "correctAnswer": "Opção C"
   }
6. **Qualidade dos Distratores**: Crie alternativas incorretas ('distratores') que sejam plausíveis, mas comprovadamente erradas segundo o 'consolidatedContent'. Evite opções absurdas.`,
  TUTOR: `Você é um 'Tutor de IA' paciente e eficaz. O aluno cometeu erros no quiz. Sua missão é fornecer um feedback claro e construtivo para cada erro, reforçando o aprendizado.

REGRAS OBRIGATÓRIAS:
1. **Input do Sistema**: Você receberá as questões erradas, a resposta do aluno e o 'learningObjective' do subtópico.
2. **Formato de Resposta**: A resposta DEVE ser um objeto JSON com a estrutura: \`{ "explanations": ["explicação para o erro 1", "explicação para o erro 2", ...] }\`. Apenas o JSON puro.
3. **Conteúdo da Explicação**: Para cada erro, siga estes passos:
   a. Indique a resposta correta de forma clara.
   b. Explique POR QUE a resposta está correta, citando ou parafraseando a parte relevante do material que o aluno estudou.
   c. Explique POR QUE a alternativa que o aluno marcou estava incorreta, mostrando a fonte da confusão.
   d. Reafirme como a resposta correta está diretamente ligada ao 'learningObjective' do subtópico.
   e. Use um tom encorajador, como "Ótima tentativa! Esse é um ponto que confunde mesmo. Vamos esclarecer:"`,
};
const PROMPT_TITLES = {
  COORDENADOR: "Gerando Currículo da Trilha...",
  PROFESSOR: "Gerando Aula do Professor IA...",
  AVALIADOR: "Gerando Avaliação do Tópico...",
  TUTOR: "Tutor IA Preparando Feedback...",
};

const formatNarrative = (narrative) =>
  (narrative || "")
    .replace(/```(\w+)?\n([\s\S]+?)\n```/g, "<pre>$2</pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\\n|\n/g, "<br>");

function applyTheme(theme) {
  const themeSwitch = $("#theme-switch");
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    if (themeSwitch) themeSwitch.checked = true;
  } else {
    document.documentElement.classList.remove("dark");
    if (themeSwitch) themeSwitch.checked = false;
  }
}

function initializeSettings() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);

  const savedApiMode = localStorage.getItem(API_MODE_KEY) === "true";
  $("#api-mode-toggle").checked = savedApiMode;
  $("#api-mode-switch-settings").checked = savedApiMode;
  document.dispatchEvent(new Event("apiModeChange"));

  const assistant = localStorage.getItem(ASSISTANT_ENABLED_KEY);
  const savedAssistantState = assistant ?? "true";
  $("#assistant-switch").checked = savedAssistantState;
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);
}

function cycleTheme() {
  const currentTheme = localStorage.getItem(THEME_KEY) || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";

  localStorage.setItem(THEME_KEY, newTheme);
  applyTheme(newTheme);
}

function generateHistoryHtml(chatHistory) {
  let historyHtml = '<div class="chat-history-container">';
  chatHistory.forEach((message) => {
    if (message.role === "model") {
      try {
        const scene = JSON.parse(message.parts[0].text);
        historyHtml += `<div class="chat-message model-message"><div class="narrative-content">${formatNarrative(
          scene.narrative
        )}</div></div>`;
      } catch (e) {}
    } else if (message.role === "user") {
      try {
        const userPayload = JSON.parse(message.parts[0].text);

        let userText;
        if (userPayload.userQuestion) {
          userText = `<strong>Sua pergunta:</strong> ${userPayload.userQuestion}`;
        } else if (userPayload.text) {
          userText = `<strong>Sua escolha:</strong> ${userPayload.text}`;
        } else {
          userText = `<strong>Sua escolha:</strong> Continuar.`;
        }

        historyHtml += `<div class="chat-message user-message"><p>${userText}</p></div>`;
      } catch (e) {}
    }
  });
  historyHtml += "</div>";
  return historyHtml;
}

function loadState() {
  const s = localStorage.getItem(STORAGE_KEY);
  appState = s
    ? JSON.parse(s)
    : {
        activeTrilhaId: null,
        activeModuleIndex: -1,
        activeSubtopicIndex: -1,
        trilhas: {},
      };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function getActiveTrilha() {
  return appState.trilhas[appState.activeTrilhaId] || null;
}

function getActiveTopic() {
  if (appState.activeTrilhaId === null || appState.activeModuleIndex === -1)
    return null;
  const tr = getActiveTrilha();
  if (!tr || !tr.modules[appState.activeModuleIndex]) return null;
  return tr.modules[appState.activeModuleIndex].subtopics[
    appState.activeSubtopicIndex
  ];
}

async function processRequest(requestType, context) {
  if (SHOW_SUPPORT_PROMPT && localStorage.getItem(API_MODE_KEY) === "true") {
    showSupportModal();
    return;
  }

  const useApi = localStorage.getItem(API_MODE_KEY) === "true";
  const sysPrompt = PROMPTS[requestType];
  const requestBody = {
    contents: context.history,
    systemInstruction: { parts: [{ text: sysPrompt }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      response_mime_type: "application/json",
    },
  };

  showLoadingModal(PROMPT_TITLES[requestType]);
  if (useApi) {
    try {
      const response = await fetch(API_BACK_END, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const responseData = await response.json();
      if (
        !responseData ||
        !responseData[0] ||
        typeof responseData[0].output !== "string"
      ) {
        throw new Error("Formato de resposta da API inesperado.");
      }
      const jsonOutput = JSON.parse(responseData[0].output);
      context.onSuccess(jsonOutput);
    } catch (error) {
      console.error("Erro na chamada da API:", error);
      await showConfirmationModal(
        "Erro na API",
        `Ocorreu um erro: ${error.message}`,
        { confirmText: "OK", showCancel: false }
      );
    } finally {
      hideLoadingModal();
    }
  } else {
    hideLoadingModal();
    showPromptModal(PROMPT_TITLES[requestType], requestBody, context.onSuccess);
  }
}
function showScreen(screenName) {
  $$(".screen").forEach((s) => s.classList.add("hidden"));
  $(`#${screenName}`).classList.remove("hidden");
}

function renderDashboard() {
  const container = $("#trilhas-container");
  const wrapper = $("#trilhas-container-wrapper");
  container.innerHTML = "";

  const trilhas = Object.values(appState.trilhas).sort(
    (a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0)
  );

  if (trilhas.length > 0) {
    wrapper.classList.remove("hidden");
    trilhas.forEach((trilha) => {
      const card = document.createElement("div");
      card.className = "trilha-card";
      card.dataset.trilhaId = trilha.id;

      let total = 0,
        done = 0;
      if (trilha.modules?.length) {
        trilha.modules.forEach((m) => {
          total += m.subtopics.length;
          done += m.subtopics.filter((st) => st.completed).length;
        });
      }
      const pct = total > 0 ? (done / total) * 100 : 0;
      card.innerHTML = `
    <div class="trilha-header">
        <div class="trilha-info">
        <h3 class="trilha-title">${trilha.title}</h3>
        <button class="delete-trilha-btn" data-trilha-id="${
          trilha.id
        }" title="Apagar trilha">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
        </div>
        <p class="trilha-description">${
          trilha.description || "Continue seus estudos."
        }</p>
        
        <div class="trilha-card-footer">
            <div class="trilha-content">
                <div class="progress-section">
                    <div class="progress-header">
                    <span>Progresso</span>
                    <span class="progress-percent">${Math.round(pct)}%</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                </div>
            </div>
            <div class="trilha-footer">
                <button class="continue-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                    Continuar
                </button>
            </div>
        </div>
        </div>`;
      container.appendChild(card);
    });
  } else {
    wrapper.classList.add("hidden");
  }
  showScreen("dashboard-section");
}

function renderLearningScreen() {
  const tr = getActiveTrilha();
  if (!tr) return renderDashboard();

  $("#sidebar-title").textContent = tr.title;
  let totalTopics = 0,
    completedTopics = 0;
  tr.modules.forEach((m) => {
    totalTopics += m.subtopics.length;
    completedTopics += m.subtopics.filter((st) => st.completed).length;
  });
  const overallPct =
    totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
  $("#overall-progress-percent").textContent = `${Math.round(overallPct)}%`;
  $(".overall-progress .progress-fill").style.width = `${overallPct}%`;

  const modulesList = $("#modules-list");
  modulesList.innerHTML = "";

  const activeTopic = getActiveTopic();
  const isTopicInProgress =
    activeTopic && activeTopic.chatHistory.length > 0 && !activeTopic.completed;
  let subtopicUnlocked = true;

  tr.modules.forEach((mod, mIdx) => {
    const moduleSection = document.createElement("div");
    moduleSection.className = "module-section";
    moduleSection.innerHTML = `<h3 class="module-title">${mod.title}</h3>`;
    const subtopicsUl = document.createElement("ul");
    subtopicsUl.className = "subtopics-list";

    mod.subtopics.forEach((sub, sIdx) => {
      const li = document.createElement("li");
      li.className = "subtopic-item";
      let icon = ICONS.UNLOCKED;
      const isActive =
        mIdx === appState.activeModuleIndex &&
        sIdx === appState.activeSubtopicIndex;
      if (sub.completed) {
        li.classList.add("completed");
        icon = ICONS.COMPLETED;
      }
      if (isActive) li.classList.add("active");

      const isClickable =
        (isTopicInProgress && isActive) ||
        (!isTopicInProgress && subtopicUnlocked) ||
        sub.completed;

      if (isClickable) {
        li.onclick = () => selectTopic(mIdx, sIdx);
      } else if (!sub.completed) {
        li.classList.add("locked");
        icon = ICONS.LOCKED;
      }

      if (subtopicUnlocked && !sub.completed) subtopicUnlocked = false;

      li.innerHTML = `<div class="subtopic-icon">${icon}</div><div class="subtopic-content"><div class="subtopic-title">${sub.title}</div></div>`;
      subtopicsUl.appendChild(li);
    });
    moduleSection.appendChild(subtopicsUl);
    modulesList.appendChild(moduleSection);
  });

  if (tr.completed) {
    renderCurrentStateView();
    renderTrilhaCompletedView();
  } else {
    renderCurrentStateView();
  }
  showScreen("learning-section");
}

function renderCurrentStateView() {
  const topic = getActiveTopic();
  const trilha = getActiveTrilha();
  const contentHeader = $("#content-header");

  $("#content-navigation-review").innerHTML = "";

  if (!topic) {
    $(
      "#learning-content"
    ).innerHTML = `<p>Selecione um tópico na barra lateral para começar.</p>`;
    contentHeader.innerHTML = "";
    $("#content-navigation").innerHTML = "";
    return;
  }

  const topicModule = trilha.modules[appState.activeModuleIndex];
  contentHeader.innerHTML = `
    <div class="breadcrumb">
      <span>${topicModule.title}</span>
    </div>
    <div class="content-title-section">
      <div class="title-info"><h1>${topic.title}</h1></div>
    </div>`;

  if (topic.quiz && typeof topic.quiz.score === "number") {
    renderQuizResultView(topic);
  } else if (topic.quiz) {
    renderQuizView(topic);
  } else if (topic.chatHistory.length > 0) {
    renderSceneView(topic);
  } else {
    $("#learning-content").innerHTML = `
          <div class="loading-indicator" style="display:block; padding: 2rem; text-align:center;">
              <div class="spinner"></div>
              <p>Gerando o conteúdo do tópico...</p>
          </div>`;
    $("#content-navigation").innerHTML = "";
    startOrContinueTopic();
  }
}

function renderSceneView(topic) {
  const container = $("#learning-content");
  const navContainer = $("#content-navigation");

  let effectiveHistory = [...topic.chatHistory];
  let lastMessage =
    effectiveHistory.length > 0
      ? effectiveHistory[effectiveHistory.length - 1]
      : null;

  if (lastMessage && lastMessage.role === "user") {
    effectiveHistory.pop();
    lastMessage =
      effectiveHistory.length > 0
        ? effectiveHistory[effectiveHistory.length - 1]
        : null;
  }

  if (!lastMessage || lastMessage.role !== "model") {
    container.innerHTML =
      "<p>Ainda não há conteúdo para este tópico. Iniciando...</p>";
    navContainer.innerHTML = "";
    topic.chatHistory = [];
    saveState();
    startOrContinueTopic();
    return;
  }

  const lastScene = JSON.parse(lastMessage.parts[0].text);
  const modelHistory = effectiveHistory.filter((m) => m.role === "model");
  const historyCount = modelHistory.length - 1;

  let historyToggleHtml = "";
  if (historyCount > 0) {
    historyToggleHtml = `<button id="history-toggle-btn">Ver Histórico de Interação (${historyCount})</button>`;
  }

  let historyHtml = `<div id="history-content" class="hidden">${generateHistoryHtml(
    effectiveHistory.slice(0, -1)
  )}</div>`;
  let narrativeHtml = `<div class="narrative-content">${formatNarrative(
    lastScene.narrative
  )}</div>`;

  let optionsHtml = '<div class="options-container">';
  if (lastScene.isTopicEnd) {
    optionsHtml += `<button id="start-quiz-btn" class="option-btn btn-primary-action">Tudo certo! Iniciar Avaliação →</button>`;
  } else {
    lastScene.options.forEach((opt) => {
      optionsHtml += `<button class="option-btn" data-option='${JSON.stringify(
        opt
      )}'>${opt.text}</button>`;
    });
    const freeFormOption = {
      text: "Tenho outra dúvida",
      action: "escrever_pergunta",
    };
    optionsHtml += `<button class="option-btn" data-option='${JSON.stringify(
      freeFormOption
    )}'>${freeFormOption.text}</button>`;
  }
  optionsHtml += "</div>";

  container.innerHTML =
    historyToggleHtml + historyHtml + narrativeHtml + optionsHtml;
  navContainer.innerHTML = "";

  if ($("#history-toggle-btn")) {
    $("#history-toggle-btn").onclick = () => {
      const historyContent = $("#history-content");
      const isVisible = historyContent.classList.toggle("visible");
      historyContent.classList.toggle("hidden", !isVisible);
      $("#history-toggle-btn").textContent = isVisible
        ? `Ocultar Histórico (${historyCount})`
        : `Ver Histórico de Interação (${historyCount})`;
    };
  }

  if ($("#start-quiz-btn")) {
    $("#start-quiz-btn").onclick = generateQuiz;
  }
  $$(".option-btn[data-option]").forEach((btn) => {
    btn.onclick = () => {
      let optionData;

      try {
        optionData = JSON.parse(btn.dataset.option);
      } catch (e) {
        optionData = btn.dataset.option;
      }

      handleUserInteraction(optionData);
    };
  });
}

function renderFreeFormQuestionView(originalOption) {
  $(".options-container").innerHTML = `
    <textarea id="user-text-input"  placeholder="${
      originalOption.placeholder || "Faça sua pergunta..."
    }"></textarea>
    <div class="text-input-options" style="display:flex; gap:1rem;">
      <button id="cancel-user-text" class="option-btn" style="flex:1;">Cancelar</button>
      <button id="submit-user-text" class="option-btn btn-primary-action" style="flex:1;">Enviar</button>
    </div>`;

  $("#submit-user-text").onclick = () => {
    const userInput = $("#user-text-input").value.trim();
    if (!userInput) return;

    const professorPayload = {
      userQuestion: userInput,
    };
    continueProfessorInteraction(professorPayload);
  };
  $("#cancel-user-text").onclick = renderCurrentStateView;
}

function renderQuizView(topic) {
  const container = $("#learning-content");
  const navContainer = $("#content-navigation");

  try {
    let formHTML = `<form id="quiz-form">`;

    if (!topic.quiz || !Array.isArray(topic.quiz.questions)) {
      throw new Error(
        "O formato do quiz é inválido ou as questões não foram fornecidas como um array."
      );
    }

    topic.quiz.questions.forEach((q, qIdx) => {
      if (!q || typeof q.question !== "string" || !Array.isArray(q.options)) {
        throw new Error(`A estrutura da questão ${qIdx + 1} é inválida.`);
      }

      formHTML += `<div class="quiz-question"><p><strong>${qIdx + 1}. ${
        q.question
      }</strong></p><ul class="quiz-options">`;
      q.options.forEach((opt, oIdx) => {
        formHTML += `<li class="quiz-option"><input type="radio" id="q${qIdx}o${oIdx}" name="q${qIdx}" value="${opt}" required><label for="q${qIdx}o${oIdx}">${opt}</label></li>`;
      });
      formHTML += `</ul></div>`;
    });

    formHTML += `</form>`;
    container.innerHTML = `<h3>Avaliação: ${topic.title}</h3>${formHTML}`;
    navContainer.innerHTML = `<button id="submit-quiz-btn" class="option-btn btn-primary-action">Enviar Avaliação</button>`;
    $("#submit-quiz-btn").onclick = handleQuizSubmit;
  } catch (error) {
    console.error(
      "Falha ao renderizar o quiz. O formato do JSON provavelmente está incorreto.",
      error
    );

    const currentTopic = getActiveTopic();
    if (currentTopic) {
      currentTopic.quiz = null;
      saveState();
    }

    container.innerHTML = `<p>Ocorreu um erro ao processar as questões da avaliação. Solicitando uma nova versão para a IA...</p>`;
    navContainer.innerHTML = "";
    generateQuiz();
    setTimeout(() => {
      generateQuiz();
    }, 500);
  }
}

function renderQuizResultView(topic) {
  const container = $("#learning-content");
  const navContainer = $("#content-navigation");
  const navContainerReview = $("#content-navigation-review");
  const { questions, answers, score } = topic.quiz;

  let formHTML = `<form id="quiz-form">`;
  questions.forEach((q, qIdx) => {
    formHTML += `<div class="quiz-question"><p><strong>${qIdx + 1}. ${
      q.question
    }</strong></p><ul class="quiz-options">`;
    const selectedValue = answers[qIdx];
    q.options.forEach((opt, oIdx) => {
      const isCorrect = opt === q.correctAnswer;
      const isSelected = opt === selectedValue;

      let liClass = "quiz-option";
      if (isCorrect) {
        liClass += " correct";
      } else if (isSelected) {
        liClass += " incorrect";
      }

      formHTML += `
        <li class="${liClass}">
          <input type="radio" id="q${qIdx}o${oIdx}" name="q${qIdx}" value="${opt}" disabled ${
        isSelected ? "checked" : ""
      }>
          <label for="q${qIdx}o${oIdx}">${opt}</label>
        </li>`;
    });
    formHTML += `</ul></div>`;
  });
  formHTML += `</form>`;
  container.innerHTML = `<h3>Avaliação: ${topic.title}</h3>${formHTML}`;

  const resultDiv = document.createElement("div");
  resultDiv.id = "quiz-result";

  navContainerReview.innerHTML = "";
  navContainer.innerHTML = "";

  if (score >= 70) {
    resultDiv.className = "passed";
    resultDiv.innerHTML = `<h3>Parabéns! Você foi aprovado!</h3><p>Nota: ${score.toFixed(
      0
    )}%</p>`;
    if (
      !isLastTopicOfTrilha(
        getActiveTrilha(),
        appState.activeModuleIndex,
        appState.activeSubtopicIndex
      )
    ) {
      const nextBtn = document.createElement("button");
      nextBtn.className = "option-btn";
      nextBtn.textContent = "Próximo Subtópico →";
      nextBtn.onclick = goToNextTopic;
      navContainer.appendChild(nextBtn);
    }
  } else {
    resultDiv.className = "failed";
    resultDiv.innerHTML = `<h3>Não foi desta vez.</h3><p>Sua nota: ${score.toFixed(
      0
    )}%. Você precisa de 70%.</p>`;

    const retryBtn = document.createElement("button");
    retryBtn.className = "option-btn";
    retryBtn.textContent = "Tentar Novamente";

    retryBtn.onclick = () => {
      topic.quiz = null;
      saveState();
      generateQuiz();
    };
    navContainer.appendChild(retryBtn);
  }

  const reviewContentBtn = document.createElement("button");
  reviewContentBtn.className = "option-btn";
  reviewContentBtn.textContent = "Rever Conteúdo Estudado";
  reviewContentBtn.onclick = () => {
    const historyContainer = $("#study-history-container");
    const isVisible = historyContainer.classList.toggle("visible");
    historyContainer.classList.toggle("hidden", !isVisible);
    if (isVisible) {
      historyContainer.innerHTML = generateHistoryHtml(topic.chatHistory);
      reviewContentBtn.textContent = "Ocultar Conteúdo Estudado";
    } else {
      historyContainer.innerHTML = "";
      reviewContentBtn.textContent = "Rever Conteúdo Estudado";
    }
  };

  const reviewMistakesBtn = document.createElement("button");
  reviewMistakesBtn.id = "review-mistakes-btn";
  reviewMistakesBtn.className = "option-btn";
  reviewMistakesBtn.textContent = "Revisar Erros com Tutor IA";
  reviewMistakesBtn.onclick = () => reviewMistakes(topic);

  navContainerReview.prepend(reviewContentBtn);
  if (score < 70) {
    navContainer.prepend(reviewMistakesBtn);
  }

  $("#quiz-form").appendChild(resultDiv);
  $("#quiz-form").insertAdjacentHTML(
    "afterend",
    '<div id="study-history-container" class="hidden"></div>'
  );
}

async function showCertificatePreview() {
  const trilha = getActiveTrilha();
  const certInfo = JSON.parse(localStorage.getItem(CERTIFICATE_KEY));
  const studentName = certInfo ? certInfo.name : "Nome do Aluno";
  const courseName = trilha.title;
  const completionDate = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  $("#nome-aluno-render").textContent = studentName;
  $("#nome-curso-render").textContent = `${courseName}`;
  $("#data-emissao-render").textContent = `Emitido em ${completionDate}`;

  $("#certificate-preview-modal").classList.remove("hidden");
}

async function handleDownloadCertificate() {
  const downloadBtn = document.querySelector("#download-certificate-btn");
  downloadBtn.textContent = "Gerando Imagem...";
  downloadBtn.disabled = true;

  const originalElement = document.querySelector(
    "#certificado-container-render"
  );
  const clone = originalElement.cloneNode(true);

  clone.style.width = "820px";
  clone.style.height = "636px";
  clone.style.transform = "scale(1)";
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.top = "-9999px";

  document.body.appendChild(clone);

  const certInfo = JSON.parse(localStorage.getItem(CERTIFICATE_KEY)) || {};
  const studentNameFile = (certInfo.name || "aluno")
    .trim()
    .replace(/\s+/g, "_");

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      width: 820,
      height: 636,
    });
    const imageDataUrl = canvas.toDataURL("image/png");

    const previewDiv = document.getElementById("div-preview-certificado");

    previewDiv.innerHTML = "";
    const imgElement = document.createElement("img");

    imgElement.src = imageDataUrl;
    imgElement.alt = `Pré-visualização do Certificado de ${
      certInfo.name || "aluno"
    }`;
    imgElement.style.maxWidth = "100%";
    imgElement.style.height = "auto";
    imgElement.style.borderRadius = "8px";
    imgElement.style.border = "1px solid #323238";
    generatedCertificateUrl = imageDataUrl;
    generatedCertificateName = studentNameFile;

    previewDiv.appendChild(imgElement);
  } catch (error) {
    console.error("Erro ao gerar o certificado:", error);
    alert("Ocorreu um erro ao tentar gerar o certificado.");
  } finally {
    document.body.removeChild(clone);
    downloadBtn.textContent = "Baixar Certificado";
    downloadBtn.disabled = false;
  }
}

function downloadCertificate() {
  const link = document.createElement("a");
  link.href = generatedCertificateUrl;
  link.download = `Certificado_${generatedCertificateName}.png`;
  link.click();
}

function renderTrilhaCompletedView() {
  const tr = getActiveTrilha();
  $("#content-header").innerHTML = `<h1>Trilha Concluída!</h1>`;
  $("#learning-content").innerHTML = `
        <div style="text-align: center; padding: 2rem 0;">
            <h1 style="font-size: 4rem;">🎉</h1>
            <h3>Parabéns!</h3>
            <p style="font-size: 1.2rem; margin-top: 1rem;">Você concluiu com sucesso a trilha de <strong>${tr.title}</strong>!</p>
        </div>
        <div id="study-history-container" class="hidden"></div>
    `;
  $("#content-navigation").innerHTML = `
    <button id="show-certificate-btn" class="option-btn btn-primary-action">
        Ver Certificado
    </button>
    `;
}

function showSupportModal() {
  $("#support-modal").classList.remove("hidden");
}

function hideSupportModal() {
  $("#support-modal").classList.add("hidden");
}

async function createOrSelectTrilha(tema) {
  const id =
    "trilha-" +
    tema
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  if (appState.trilhas[id] && appState.trilhas[id].modules?.length > 0) {
    selectTrilha(id);
    return;
  }

  await processRequest("COORDENADOR", {
    history: [
      {
        role: "user",
        parts: [{ text: `Gere o currículo para o tema: "${tema}"` }],
      },
    ],
    onSuccess: (aiResponse) => {
      const newTrilha = {
        id,
        title: aiResponse.title,
        description: aiResponse.description,
        completed: false,
        lastAccessed: Date.now(),
        modules: aiResponse.modules.map((m) => ({
          ...m,
          subtopics: m.subtopics.map((sub) => ({
            ...sub,
            completed: false,
            chatHistory: [],
            quiz: null,
          })),
        })),
      };

      appState.trilhas[id] = newTrilha;
      appState.activeTrilhaId = id;
      appState.activeModuleIndex = 0;
      appState.activeSubtopicIndex = 0;

      saveState();
      renderDashboard();
      setTimeout(() => {
        selectTrilha(id);
      }, 300);
    },
  });
}

function selectTrilha(id) {
  appState.activeTrilhaId = id;
  const trilha = appState.trilhas[id];

  if (trilha) {
    trilha.lastAccessed = Date.now();
  }

  let firstUncompletedM = -1,
    firstUncompletedS = -1;
  if (trilha.modules) {
    for (let m = 0; m < trilha.modules.length; m++) {
      const subtopics = trilha.modules[m].subtopics;
      for (let s = 0; s < subtopics.length; s++) {
        if (!subtopics[s].completed) {
          firstUncompletedM = m;
          firstUncompletedS = s;
          break;
        }
      }
      if (firstUncompletedM !== -1) break;
    }
  }
  appState.activeModuleIndex = firstUncompletedM !== -1 ? firstUncompletedM : 0;
  appState.activeSubtopicIndex =
    firstUncompletedS !== -1 ? firstUncompletedS : 0;
  saveState();
  renderLearningScreen();
}

function selectTopic(mIdx, sIdx) {
  appState.activeModuleIndex = mIdx;
  appState.activeSubtopicIndex = sIdx;
  saveState();
  renderLearningScreen();

  if (window.innerWidth <= 768) {
    $("#learning-sidebar").classList.remove("open");
  }
}

function goToNextTopic() {
  const tr = getActiveTrilha();
  let { activeModuleIndex: mIdx, activeSubtopicIndex: sIdx } = appState;
  sIdx++;
  if (sIdx >= tr.modules[mIdx].subtopics.length) {
    mIdx++;
    sIdx = 0;
  }
  if (mIdx < tr.modules.length) {
    selectTopic(mIdx, sIdx);
  }
}

async function startOrContinueTopic() {
  const topic = getActiveTopic();
  if (!topic) return;
  const payload = { callNumber: 1 };
  await continueProfessorInteraction(payload, true);
}

async function continueProfessorInteraction(payload, isStartingTopic = false) {
  const topic = getActiveTopic();
  if (!topic) return;

  const userPayloadForHistory = JSON.stringify(payload);
  if (!isStartingTopic) {
    topic.chatHistory.push({
      role: "user",
      parts: [{ text: userPayloadForHistory }],
    });
  }

  const callNumber =
    topic.chatHistory.filter((m) => m.role === "model").length + 1;

  const payloadForAI = {
    subtopicTitle: topic.title,
    learningObjective: topic.learningObjective,
    ...payload,
  };
  if (!payloadForAI.userQuestion) {
    payloadForAI.callNumber = callNumber;
  }

  await processRequest("PROFESSOR", {
    history: [
      { role: "user", parts: [{ text: JSON.stringify(payloadForAI) }] },
    ],
    onSuccess: (aiResponse) => {
      topic.chatHistory.push({
        role: "model",
        parts: [{ text: JSON.stringify(aiResponse) }],
      });
      saveState();
      renderCurrentStateView();
    },
  });
}

function handleUserInteraction(option) {
  if (option.action === "escrever_pergunta") {
    renderFreeFormQuestionView(option);
  } else {
    continueProfessorInteraction(option);
  }
}

async function reviewMistakes(topic) {
  const reviewBtn = $("#review-mistakes-btn");
  if (reviewBtn) {
    reviewBtn.disabled = true;
    reviewBtn.textContent = "Analisando Erros...";
  }

  const incorrectQuestionsInfo = [];
  const incorrectIndices = [];

  topic.quiz.questions.forEach((q, i) => {
    const isCorrect = topic.quiz.answers[i] === q.correctAnswer;
    if (!isCorrect && topic.quiz.answers[i]) {
      incorrectQuestionsInfo.push({
        question: q.question,
        correctAnswer: q.correctAnswer,
        studentAnswer: topic.quiz.answers[i],
      });
      incorrectIndices.push(i);

      const li = $$(".quiz-question")[i];
      const explanationDiv = document.createElement("div");
      explanationDiv.className = "tutor-feedback-loading";
      explanationDiv.innerHTML = `<p><em>Tutor está analisando esta questão...</em></p>`;
      li.appendChild(explanationDiv);
    }
  });

  if (incorrectQuestionsInfo.length === 0) {
    if (reviewBtn) {
      reviewBtn.textContent = "Nenhum Erro para Revisar!";
      setTimeout(() => (reviewBtn.disabled = false), 2000);
    }
    return;
  }

  const tutorPayload = {
    learningObjective: topic.learningObjective,
    incorrectQuestions: incorrectQuestionsInfo,
    consolidatedContent: topic.chatHistory
      .filter((m) => m.role === "model")
      .map((m) => JSON.parse(m.parts[0].text).narrative)
      .join("\n\n"),
  };

  await processRequest("TUTOR", {
    history: [
      { role: "user", parts: [{ text: JSON.stringify(tutorPayload) }] },
    ],
    onSuccess: (aiResponse) => {
      if (aiResponse.explanations && Array.isArray(aiResponse.explanations)) {
        aiResponse.explanations.forEach((explanation, idx) => {
          const originalQuestionIndex = incorrectIndices[idx];
          const li = $$(".quiz-question")[originalQuestionIndex];
          if (li) {
            const loadingDiv = li.querySelector(".tutor-feedback-loading");
            if (loadingDiv) loadingDiv.remove();

            const feedbackDiv = document.createElement("div");
            feedbackDiv.className = "tutor-feedback";
            feedbackDiv.innerHTML = formatNarrative(explanation);
            li.appendChild(feedbackDiv);
          }
        });
      }
      if (reviewBtn) {
        reviewBtn.textContent = "Revisão Concluída!";
        reviewBtn.disabled = false;
      }
    },
  });
}

async function generateQuiz() {
  const topic = getActiveTopic();
  if (!topic || topic.quiz) return;
  const consolidatedContent = topic.chatHistory
    .filter((m) => m.role === "model")
    .map((m) => JSON.parse(m.parts[0].text).narrative)
    .join("\n\n---\n\n");
  const avaliadorPayload = {
    learningObjective: topic.learningObjective,
    consolidatedContent,
  };
  await processRequest("AVALIADOR", {
    history: [
      { role: "user", parts: [{ text: JSON.stringify(avaliadorPayload) }] },
    ],
    onSuccess: (aiResponse) => {
      topic.quiz = { questions: aiResponse, answers: [], score: undefined };
      saveState();
      renderLearningScreen();
    },
  });
}
async function handleDeleteTrilha(trilhaId) {
  const trilha = appState.trilhas[trilhaId];
  if (!trilha) return;
  const isConfirmed = await showConfirmationModal(
    "Apagar Trilha",
    `Tem certeza que quer apagar a trilha "<strong>${trilha.title}</strong>"?`,
    { confirmText: "Apagar", isDestructive: true }
  );
  if (isConfirmed) {
    delete appState.trilhas[trilhaId];
    saveState();
    renderDashboard();
  }
}
async function handleQuizSubmit() {
  const topic = getActiveTopic();
  const tr = getActiveTrilha();
  const form = $("#quiz-form");
  const userAnswers = [];
  let score = 0,
    allAnswered = true;
  const formData = new FormData(form);
  topic.quiz.questions.forEach((q, qIdx) => {
    const userAnswer = formData.get(`q${qIdx}`);
    if (userAnswer === null) allAnswered = false;
    userAnswers.push(userAnswer);
  });
  if (!allAnswered) {
    await showConfirmationModal(
      "Atenção",
      "Por favor, responda a todas as questões.",
      { showCancel: false, confirmText: "OK" }
    );
    return;
  }
  topic.quiz.questions.forEach((q, qIdx) => {
    if (userAnswers[qIdx] === q.correctAnswer) score++;
  });
  topic.quiz.answers = userAnswers;
  topic.quiz.score = (score / topic.quiz.questions.length) * 100;
  if (topic.quiz.score >= 70) {
    topic.completed = true;
    if (
      isLastTopicOfTrilha(
        tr,
        appState.activeModuleIndex,
        appState.activeSubtopicIndex
      )
    ) {
      tr.completed = true;
    }
  }
  saveState();
  renderLearningScreen();
}

function isLastTopicOfTrilha(trilha, mIdx, sIdx) {
  if (!trilha || !trilha.modules) return false;
  const isLastModule = mIdx === trilha.modules.length - 1;
  if (!isLastModule) return false;
  return sIdx === trilha.modules[mIdx].subtopics.length - 1;
}

function showPromptModal(title, requestBody, callback) {
  onManualResponseSubmit = callback;
  $("#modal-title").textContent = title;
  $("#prompt-display").textContent = JSON.stringify(requestBody, null, 2);
  $("#response-input").value = "";
  $("#modal-error-message").classList.add("hidden");
  $("#prompt-modal").classList.remove("hidden");

  const assistant = localStorage.getItem(ASSISTANT_ENABLED_KEY);
  const isAssistantEnabled = assistant ?? "true";
  if (window.innerWidth > 768 && isAssistantEnabled) {
    $("#prompt-modal").classList.remove("hidden");
    $("#chatbot-container").classList.remove("hidden");
  }
}

function hidePromptModal() {
  $("#prompt-modal").classList.add("hidden");
  if (onManualResponseSubmit) {
    const topic = getActiveTopic();
    if (topic && topic.chatHistory.length > 0) {
      const lastMessage = topic.chatHistory[topic.chatHistory.length - 1];
      if (lastMessage.role === "user") {
        topic.chatHistory.pop();
        saveState();
      }
    }
  }
  onManualResponseSubmit = null;
}

function showLoadingModal(title) {
  const modal = $("#loading-modal");
  modal.innerHTML = `<div class="modal-content" style="background: hsl(var(--card)); padding: 2rem; border-radius: var(--radius); text-align: center;"><h2 id="loading-title">${
    title || "Processando..."
  }</h2><div class="spinner"></div><p>Aguarde, a IA está trabalhando...</p></div>`;
  modal.classList.remove("hidden");
}

function hideLoadingModal() {
  $("#loading-modal").classList.add("hidden");
}

function showConfirmationModal(title, message, options = {}) {
  return new Promise((resolve) => {
    const modal = $("#confirmation-modal");
    $("#confirmation-title").textContent = title;
    $("#confirmation-message").innerHTML = message;
    const actionsContainer = $("#confirmation-actions");
    actionsContainer.innerHTML = "";
    const confirmText = options.confirmText || "Confirmar";
    const cancelText = options.cancelText || "Cancelar";
    const showCancel = options.showCancel !== false;
    const closeModal = (result) => {
      modal.classList.add("hidden");
      actionsContainer.innerHTML = "";
      resolve(result);
    };
    if (showCancel) {
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "confirmation-btn btn-cancel";
      cancelBtn.textContent = cancelText;
      cancelBtn.onclick = () => closeModal(false);
      actionsContainer.appendChild(cancelBtn);
    }
    const confirmBtn = document.createElement("button");
    confirmBtn.className = options.isDestructive
      ? "confirmation-btn btn-confirm"
      : "modal-btn";
    if (!options.isDestructive) {
      confirmBtn.style.backgroundColor = "hsl(var(--primary))";
      confirmBtn.style.color = "white";
    }
    confirmBtn.textContent = confirmText;
    confirmBtn.onclick = () => closeModal(true);
    actionsContainer.appendChild(confirmBtn);
    modal.querySelector(".modal-close-btn").onclick = () => closeModal(false);
    modal.classList.remove("hidden");
  });
}

function setupEventListeners() {
  $("#assistant-switch").addEventListener("change", (e) => {
    localStorage.setItem(ASSISTANT_ENABLED_KEY, e.target.checked);
  });

  $("#tutorial-next-btn").addEventListener("click", () => {
    if (currentTutorialStep < tutorialSteps.length - 1) {
      currentTutorialStep++;
      renderTutorialStep(currentTutorialStep);
    }
  });

  $("#tutorial-prev-btn").addEventListener("click", () => {
    if (currentTutorialStep > 0) {
      currentTutorialStep--;
      renderTutorialStep(currentTutorialStep);
    }
  });

  $("#tutorial-finish-btn").addEventListener("click", closeTutorial);

  $("#settings-btn").addEventListener("click", () =>
    $("#settings-modal").classList.remove("hidden")
  );
  $("#settings-close-btn").addEventListener("click", () =>
    $("#settings-modal").classList.add("hidden")
  );
  $("#settings-overlay").addEventListener("click", () =>
    $("#settings-modal").classList.add("hidden")
  );

  $("#theme-switch").addEventListener("change", (e) => {
    const newTheme = e.target.checked ? "dark" : "light";
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  });

  $("#change-name-btn").addEventListener("click", () => {
    const certInfo = JSON.parse(localStorage.getItem(CERTIFICATE_KEY));
    if (certInfo && certInfo.name) {
      $("#student-name").value = certInfo.name;
    } else {
      $("#student-name").value = "";
    }
    $("#settings-modal").classList.add("hidden");
    $("#certificate-modal").classList.remove("hidden");
  });

  $("#certificate-close-btn").addEventListener("click", () => {
    $("#certificate-modal").classList.add("hidden");
  });

  const syncApiToggles = (source) => {
    const isChecked = source.checked;
    localStorage.setItem(API_MODE_KEY, isChecked);
    $("#api-mode-toggle").checked = isChecked;
    $("#api-mode-switch-settings").checked = isChecked;
    document.dispatchEvent(new Event("apiModeChange"));
  };

  $("#api-mode-toggle").addEventListener("change", (e) =>
    syncApiToggles(e.target)
  );
  $("#api-mode-switch-settings").addEventListener("change", (e) =>
    syncApiToggles(e.target)
  );

  document.addEventListener("apiModeChange", () => {
    const isApiMode = localStorage.getItem(API_MODE_KEY) === "true";
    const labels = document.querySelectorAll(".mode-label");
    labels.forEach((label, index) => {
      label.classList.toggle(
        "active",
        (isApiMode && index === 1) || (!isApiMode && index === 0)
      );
    });
  });

  $("#assistant-switch").addEventListener("change", (e) => {
    localStorage.setItem(ASSISTANT_ENABLED_KEY, e.target.checked);
  });

  $("#assistant-switch").addEventListener("change", (e) => {
    localStorage.setItem(ASSISTANT_ENABLED_KEY, e.target.checked);
  });

  $("#zoom-in-btn").addEventListener("click", () => {
    currentZoomLevel = Math.min(1.5, currentZoomLevel + 0.1);
    applyZoom();
  });

  $("#zoom-out-btn").addEventListener("click", () => {
    currentZoomLevel = Math.max(0.5, currentZoomLevel - 0.1);
    applyZoom();
  });
  const chatbotToggleBtn = $("#chatbot-toggle-btn");
  const chatbotContainer = $("#chatbot-container");
  const chatbotCloseBtn = $("#chatbot-close-btn");

  if (chatbotToggleBtn && chatbotContainer && chatbotCloseBtn) {
    chatbotToggleBtn.addEventListener("click", () => {
      chatbotContainer.classList.remove("hidden");
      if (window.innerWidth <= 768) {
        chatbotToggleBtn.classList.add("hidden");
      }
    });
    chatbotCloseBtn.addEventListener("click", () => {
      chatbotContainer.classList.add("hidden");
      if (window.innerWidth <= 768) {
        chatbotToggleBtn.classList.remove("hidden");
      }
    });
  }

  $("#trilha-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const tema = $("#tema-input").value.trim();
    if (tema) {
      createOrSelectTrilha(tema);
      $("#tema-input").value = "";
    }
  });

  document.body.addEventListener("click", async (e) => {
    if (e.target.id === "show-certificate-btn") {
      showCertificatePreview();
      handleDownloadCertificate();
    }

    const deleteBtn = e.target.closest(".delete-trilha-btn");
    if (deleteBtn) {
      e.stopPropagation();
      await handleDeleteTrilha(deleteBtn.dataset.trilhaId);
      return;
    }
  });

  $("#trilhas-container").addEventListener("click", (e) => {
    const card = e.target.closest(".trilha-card");
    if (e.target.closest(".delete-trilha-btn")) return;
    if (card?.dataset.trilhaId) {
      selectTrilha(card.dataset.trilhaId);
    }
  });

  $("#clear-storage-btn").addEventListener("click", async () => {
    const isConfirmed = await showConfirmationModal(
      "Apagar Tudo",
      "Certeza que quer apagar <strong>TODAS</strong> as trilhas? A ação não pode ser desfeita.",
      { confirmText: "Apagar Tudo", isDestructive: true }
    );
    if (isConfirmed) {
      localStorage.clear();
      location.reload();
    }
  });

  $("#back-to-dashboard").onclick = () => {
    appState.activeTrilhaId = null;
    saveState();
    renderDashboard();
  };

  $("#certificate-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#student-name").value.trim();
    if (name) {
      localStorage.setItem(CERTIFICATE_KEY, JSON.stringify({ name }));
      $("#certificate-modal").classList.add("hidden");
      $("#settings-modal").classList.remove("hidden");
    }
  });

  $("#copy-prompt-btn").onclick = () => {
    navigator.clipboard.writeText($("#prompt-display").textContent);
    $("#copy-prompt-btn").textContent = "Copiado!";
    setTimeout(
      () => ($("#copy-prompt-btn").textContent = "Copiar Prompt"),
      2000
    );
  };

  $("#download-certificate-btn").onclick = downloadCertificate;
  $("#certificate-preview-modal .modal-close-btn").onclick = () => {
    $("#certificate-preview-modal").classList.add("hidden");
  };

  $("#submit-response-btn").onclick = () => {
    const raw = $("#response-input").value.trim();
    const errEl = $("#modal-error-message");
    if (!raw) {
      errEl.textContent = "Resposta vazia.";
      errEl.classList.remove("hidden");
      return;
    }
    let jsonText = raw.startsWith("```json")
      ? raw.slice(7, -3)
      : raw.startsWith("```")
      ? raw.slice(3, -3)
      : raw;
    try {
      const json = JSON.parse(jsonText.trim());
      if (onManualResponseSubmit) onManualResponseSubmit(json);
      hidePromptModal();
    } catch (err) {
      errEl.textContent = `Erro no JSON. (${err.message})`;
      errEl.classList.remove("hidden");
    }
  };

  $("#prompt-modal .modal-close-btn").onclick = hidePromptModal;
  $("#support-modal .modal-close-btn").onclick = hideSupportModal;

  const sidebar = $("#learning-sidebar");
  const openBtn = $("#mobile-sidebar-toggle");
  const closeBtn = $("#close-sidebar");

  const closeMobileSidebar = () => {
    sidebar.classList.remove("open");
  };

  openBtn.addEventListener("click", () => {
    sidebar.classList.add("open");
  });
  closeBtn.addEventListener("click", closeMobileSidebar);
}
function checkCertificateInfo() {
  const certInfo = localStorage.getItem(CERTIFICATE_KEY);
  if (!certInfo) {
    $("#certificate-modal").classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeSettings();
  loadState();
  initializeZoom();
  setupEventListeners();
  appState.activeTrilhaId = null;
  renderDashboard();
  if (!localStorage.getItem(TUTORIAL_KEY)) {
    setTimeout(showTutorial, 500);
  } else {
    checkCertificateInfo();
  }
});
