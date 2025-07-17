const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const STORAGE_KEY = "iaDevAcademy_v9_state"; // Versão atualizada
let appState = {};
let onManualResponseSubmit = null;
let GEMINI_API_KEY = "";

const GEMINI_MODEL_NAME = "gemini-1.5-flash-latest";
const BACKEND_API_URL = "https://apijs-production-2fd0.up.railway.app";
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_DELAY_MS = 1000;
const INTERACTIONS_BEFORE_QUIZ = 5;
let isApiCallInProgress = false;

const ICONS = {
  LOCKED: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  UNLOCKED: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`,
  COMPLETED: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
};

const PROMPTS = {
  COORDENADOR: `Você é um Coordenador Acadêmico de IA. Sua tarefa é criar um plano de estudos detalhado para um tema. A resposta deve ser ESTRITAMENTE um objeto JSON com a estrutura: { "title": "...", "description": "...", "modules": [ { "title": "Nome do Módulo", "subtopics": [ { "title": "Nome do Subtópico" } ] } ] }. Crie de 3 a 5 módulos. Cada módulo deve ter de 4 a 6 subtópicos, ordenados do básico ao avançado. Não inclua nenhum outro texto ou formatação. Apenas o JSON puro.`,
  PROFESSOR: `Você é o 'Professor IA', um especialista no tema e um educador excepcional. Sua missão é ensinar o subtópico atual de forma clara, didática e envolvente.

REGRAS OBRIGATÓRIAS:
1.  **Formato de Resposta**: Sua resposta DEVE SER ESTRITAMENTE um objeto JSON. Não inclua NENHUM texto fora do JSON.
2.  **Estrutura JSON**:
    {
      "narrative": "Sua explicação. Use markdown para formatação: **negrito** para termos importantes, \`código inline\` para snippets, e \\\`\\\`\\\` para blocos de código. Para criar parágrafos, insira o caractere de escape de nova linha (\\n) diretamente na string JSON.",
      "options": [
        { "text": "Texto da opção 1, como uma pergunta do aluno", "action": "aprofundar" },
        { "text": "Texto da opção 2, como uma pergunta do aluno", "action": "exemplo_pratico" }
      ],
      "isTopicEnd": false
    }
3.  **Interatividade Pedagógica**: Após sua explicação ('narrative'), ofereça 2 a 4 opções ('options') que promovam o engajamento. Cada objeto no array 'options' DEVE ter a estrutura: { "text": "Texto da pergunta do aluno", "action": "tipo_da_acao" }. Tipos de ação ('action') sugeridos:
    * **"aprofundar"**: Para detalhar um termo-chave. (Ex: "Pode me explicar melhor o que é 'assíncrono'?")
    * **"exemplo_pratico"**: Para um exemplo de código ou caso de uso. (Ex: "Me mostre um exemplo prático de uma Promise.")
    * **"analogia"**: Para explicar um conceito com uma analogia. (Ex: "Qual seria uma boa analogia para a diferença entre let e const?")
    * **"prosseguir"**: Para avançar quando o raciocínio estiver completo. (Ex: "Ok, entendi. Podemos ir para o próximo conceito?")
    * **"escrever_pergunta"**: Ofereça essa opção para que o aluno possa fazer uma pergunta aberta. (Ex: "Na verdade, eu tenho outra pergunta...")
4.  **Fim do Tópico**: Quando o subtópico for totalmente coberto, responda com \`"isTopicEnd": true\` e uma mensagem final.`,
  AVALIADOR: `Você é um 'Avaliador de IA'. Sua tarefa é criar uma avaliação sobre o subtópico ensinado. Com base no histórico da conversa e no título do subtópico, gere uma avaliação. A resposta deve ser ESTRITAMENTE um array JSON contendo exatamente 10 objetos de questão. Cada objeto deve ter o formato: { "question": "Texto da pergunta?", "options": ["Opção A", "Opção B", "Opção C", "Opção D"], "correctAnswer": "Opção C" }. As questões devem ser desafiadoras e as alternativas incorretas devem ser plausíveis.`,
  TUTOR: `Você é um 'Tutor de IA' paciente e didático. O aluno errou algumas questões no quiz. Sua tarefa é fornecer uma explicação clara para cada erro. A resposta DEVE ser um objeto JSON com a estrutura: { "explanations": ["explicação para o erro 1", "explicação para o erro 2", ...] }. Para cada explicação: 1. Confirme a resposta correta. 2. Explique POR QUE a resposta correta é a melhor. 3. Explique POR QUE a alternativa que o aluno marcou estava incorreta. Mantenha um tom encorajador. A ordem das explicações no array deve corresponder à ordem das questões erradas enviadas a você. Apenas o JSON, sem texto adicional.`,
};

const PROMPT_TITLES = {
  COORDENADOR: "Gerando Currículo da Trilha...",
  PROFESSOR: "Gerando Aula do Professor IA...",
  AVALIADOR: "Gerando Avaliação do Tópico...",
  TUTOR: "Tutor IA Preparando Feedback...",
};

async function loadApiKeys() {
  try {
    const response = await fetch(`${BACKEND_API_URL}/get-chat-key`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    GEMINI_API_KEY = data.key;
  } catch (error) {
    console.error("Erro ao carregar chave da API:", error);
    $("#api-mode-toggle").checked = false;
    appState.useApiMode = false;
    saveState();
    alert(
      "Não foi possível carregar a chave da API. O modo API foi desativado. Você pode continuar no modo manual."
    );
  }
}

async function callGeminiApi(requestBody, retries = 0, options = {}) {
  const { showGlobalLoader = true } = options; // Padrão é mostrar o loader
  if (isApiCallInProgress) return;
  isApiCallInProgress = true;
  if (showGlobalLoader) {
    showLoadingIndicator(false);
  }

  try {
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429 && retries < MAX_RETRIES) {
        const delay =
          INITIAL_BACKOFF_DELAY_MS * Math.pow(2, retries) +
          Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        isApiCallInProgress = false;
        // Passa as opções na chamada recursiva
        return callGeminiApi(requestBody, retries + 1, options);
      }
      throw new Error(`Erro da API: ${response.status}`);
    }
    const data = await response.json();
    if (!data.candidates || !data.candidates[0].content) {
      throw new Error(
        "Resposta inválida da API, pode ter sido bloqueada por segurança."
      );
    }
    const aiResponseText = data.candidates[0].content.parts[0].text;
    return JSON.parse(aiResponseText);
  } catch (error) {
    console.error("Erro na chamada da API Gemini:", error);
    showErrorMessage(
      "Ocorreu um erro ao comunicar com a IA. Verifique sua conexão, a chave da API ou tente usar o modo manual."
    );
    return null;
  } finally {
    isApiCallInProgress = false;
    if (showGlobalLoader) {
      hideLoadingIndicator();
    }
  }
}

function loadState() {
  const s = localStorage.getItem(STORAGE_KEY);
  appState = s
    ? JSON.parse(s)
    : {
        useApiMode: true,
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

async function processRequest(requestType, context, options = {}) {
  const sysPrompt = PROMPTS[requestType];
  const requestBody = {
    contents: context.history,
    systemInstruction: { parts: [{ text: sysPrompt }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      response_mime_type: "application/json",
    },
  };

  if (appState.useApiMode && GEMINI_API_KEY) {
    const result = await callGeminiApi(requestBody, 0, options);
    if (result) {
      context.onSuccess(result);
    }
  } else {
    showPromptModal(PROMPT_TITLES[requestType], requestBody, context.onSuccess);
  }
}

function showScreen(name) {
  $("#dashboard-screen").classList.toggle("hidden", name !== "dashboard");
  $("#learning-screen").classList.toggle("hidden", name !== "learning");
}

function renderDashboard() {
  const container = $("#trilhas-container");
  const wrapper = $("#trilhas-container-wrapper");
  container.innerHTML = "";

  const trilhas = Object.values(appState.trilhas);

  if (trilhas.length > 0) {
    wrapper.classList.remove("hidden");
    trilhas.forEach((trilha) => {
      const card = document.createElement("div");
      card.className = "trilha-card";
      card.onclick = () => selectTrilha(trilha.id);
      let total = 0,
        done = 0;
      if (trilha && trilha.modules?.length) {
        trilha.modules.forEach((m) => {
          total += m.subtopics.length;
          done += m.subtopics.filter((st) => st.completed).length;
        });
      }
      const pct = total > 0 ? (done / total) * 100 : 0;
      card.innerHTML = `
                                <h3>${trilha.title}</h3>
                                <p>${
                                  trilha.description || "Continue seus estudos."
                                }</p>
                                <div>
                                    <div class="progress-bar-container">
                                        <div class="progress-bar" style="width:${pct}%"></div>
                                    </div>
                                    <p class="progress-text">${Math.round(
                                      pct
                                    )}% concluído</p>
                                </div>
                              `;
      container.appendChild(card);
    });
  } else {
    wrapper.classList.add("hidden");
  }
  showScreen("dashboard");
}

function renderLearningScreen() {
  const tr = getActiveTrilha();
  if (!tr) return renderDashboard();

  $("#sidebar-title").textContent = tr.title;
  const modulesList = $("#modules-list");
  modulesList.innerHTML = "";

  const activeTopic = getActiveTopic();
  const isTopicInProgress =
    activeTopic && activeTopic.chatHistory.length > 0 && !activeTopic.completed;

  let subtopicUnlocked = true;
  tr.modules.forEach((mod, mIdx) => {
    const moduleLi = document.createElement("li");
    moduleLi.innerHTML = `<h3 class="module-title">${mod.title}</h3>`;
    const subtopicsUl = document.createElement("ul");
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
      if (isActive) {
        li.classList.add("active");
      }

      let isClickable = false;
      if (isTopicInProgress) {
        if (isActive) {
          isClickable = true;
        }
      } else {
        if (subtopicUnlocked) {
          isClickable = true;
        }
      }

      if (isClickable) {
        li.onclick = () => selectTopic(mIdx, sIdx);
      } else {
        li.classList.add("disabled");
      }

      if (!subtopicUnlocked && !sub.completed) {
        li.classList.add("locked");
        icon = ICONS.LOCKED;
      }

      if (subtopicUnlocked && !sub.completed) {
        subtopicUnlocked = false;
      }

      li.innerHTML = `${icon}<span>${sub.title}</span>`;
      subtopicsUl.appendChild(li);
    });
    moduleLi.appendChild(subtopicsUl);
    modulesList.appendChild(moduleLi);
  });

  if (tr.completed) {
    renderTrilhaCompletedView();
  } else {
    renderCurrentStateView();
  }
  showScreen("learning");
}

function renderCurrentStateView() {
  const topic = getActiveTopic();
  if (!topic) {
    showErrorMessage("Selecione um tópico na barra lateral para começar.");
    return;
  }

  if (topic.quiz && typeof topic.quiz.score === "number") {
    renderQuizResultView(topic);
  } else if (topic.quiz) {
    renderQuizView(topic);
  } else {
    const lastMessage = topic.chatHistory.slice(-1)[0];
    if (lastMessage && lastMessage.role === "model") {
      renderSceneView(JSON.parse(lastMessage.parts[0].text));
    } else {
      startOrContinueTopic();
    }
  }
}

function renderSceneView(scene) {
  const container = $("#main-content");
  container.innerHTML = `
                          <div id="scene-container" class="content-card">
                              <div class="scene-text">${scene.narrative
                                .replace(
                                  /```(\w+)?\n([\s\S]+?)\n```/g,
                                  "<pre>$2</pre>"
                                )
                                .replace(/`([^`]+)`/g, "<code>$1</code>")
                                .replace(
                                  /\*\*(.*?)\*\*/g,
                                  "<strong>$1</strong>"
                                )
                                .replace(/\*(.*?)\*/g, "<em>$1</em>")
                                .replace(/\\n|\n/g, "<br>")}
                              </div>
                          </div>
                          <div class="options-container"></div>
                          `;
  const optionsContainer = $(".options-container");
  if (scene.isTopicEnd) {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.style.backgroundColor = "var(--success-color)";
    btn.style.color = "white";
    btn.textContent = "Tudo certo! Iniciar Avaliação →";
    btn.onclick = generateQuiz;
    optionsContainer.appendChild(btn);
  } else {
    scene.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt.text; // Agora sempre usará 'text' por causa da normalização
      btn.onclick = () => handleUserInteraction(opt);
      optionsContainer.appendChild(btn);
    });
  }
}

function renderFreeFormQuestionView(originalOption) {
  const optionsContainer = $(".options-container");
  optionsContainer.innerHTML = `
                          <textarea id="user-text-input" placeholder="${
                            originalOption.placeholder ||
                            "Faça sua pergunta aqui..."
                          }"></textarea>
                          <div class="text-input-options">
                              <button id="cancel-user-text" class="option-btn btn-secondary">Cancelar</button>
                              <button id="submit-user-text" class="option-btn">Enviar Pergunta</button>
                          </div>
                          `;

  $("#submit-user-text").onclick = () => {
    const userInput = $("#user-text-input").value.trim();
    if (!userInput) return;
    const userMessage = `Ignorei as opções e fiz minha própria pergunta: "${userInput}". Por favor, responda de forma concisa e depois continue a aula, me dando novas opções para prosseguir.`;
    continueProfessorInteraction(userMessage);
  };

  $("#cancel-user-text").onclick = () => {
    renderCurrentStateView();
  };
}

function renderQuizView(topic) {
  const container = $("#main-content");
  let formHTML = `<form id="quiz-form">`;
  topic.quiz.questions.forEach((q, qIdx) => {
    formHTML += `<div class="quiz-question"><p><strong>${qIdx + 1}. ${
      q.question
    }</strong></p><ul class="quiz-options">`;
    q.options.forEach((opt, oIdx) => {
      formHTML += `<li class="quiz-option">
                                  <input type="radio" id="q${qIdx}o${oIdx}" name="q${qIdx}" value="${opt}" required>
                                  <label for="q${qIdx}o${oIdx}">${opt}</label>
                              </li>`;
    });
    formHTML += `</ul></div>`;
  });
  formHTML += `</form>`;
  container.innerHTML = `
                      <div id="quiz-container" class="content-card">
                          <h3>Avaliação: ${topic.title}</h3>
                          ${formHTML}
                      </div>
                      <div class="options-container">
                          <button id="submit-quiz-btn" class="option-btn" style="background:var(--primary-color);color:white;">Enviar Avaliação</button>
                      </div>
                      `;
  $("#submit-quiz-btn").onclick = handleQuizSubmit;
}

function renderQuizResultView(topic) {
  renderQuizView(topic);
  $("#submit-quiz-btn")?.remove();

  const { questions, answers, score } = topic.quiz;
  $$('#quiz-form input[type="radio"]').forEach(
    (radio) => (radio.disabled = true)
  );

  questions.forEach((q, qIdx) => {
    const selectedValue = answers[qIdx];
    const questionElement = $$(".quiz-question")[qIdx];

    const explanationContainer = document.createElement("div");
    explanationContainer.id = `explanation-${qIdx}`;
    explanationContainer.style.marginTop = "10px";
    questionElement.appendChild(explanationContainer);

    $$(`input[name="q${qIdx}"]`).forEach((radio) => {
      const parentLi = radio.parentElement;
      if (radio.value === q.correctAnswer) {
        parentLi.classList.add("correct");
      } else if (radio.value === selectedValue) {
        parentLi.classList.add("incorrect");
      }
      if (radio.value === selectedValue) {
        radio.checked = true;
      }
    });
  });

  const resultDiv = document.createElement("div");
  resultDiv.id = "quiz-result";
  const optionsContainer = $(".options-container");
  optionsContainer.innerHTML = "";

  if (score >= 70) {
    resultDiv.className = "passed";
    resultDiv.innerHTML = `<h3>Parabéns! Você foi aprovado!</h3><p>Sua nota: ${score.toFixed(
      0
    )}%</p><p style="margin-top:12px;">Clique no botão abaixo para avançar para o próximo desafio.</p>`;

    if (
      !isLastTopicOfTrilha(
        getActiveTrilha(),
        appState.activeModuleIndex,
        appState.activeSubtopicIndex
      )
    ) {
      const nextBtn = document.createElement("button");
      nextBtn.className = "option-btn";
      nextBtn.style.backgroundColor = "var(--success-color)";
      nextBtn.style.color = "white";
      nextBtn.textContent = "Próximo Subtópico →";
      nextBtn.onclick = goToNextTopic;
      optionsContainer.appendChild(nextBtn);

      const reviewBtn = document.createElement("button");
      reviewBtn.id = "review-mistakes-btn";
      reviewBtn.className = "option-btn";
      reviewBtn.style.backgroundColor = "var(--primary-color)";
      reviewBtn.style.color = "white";
      reviewBtn.textContent = "Revisar Meus Erros com o Tutor IA";
      reviewBtn.onclick = () => reviewMistakes(topic);

      optionsContainer.appendChild(reviewBtn);
    }
  } else {
    resultDiv.className = "failed";
    resultDiv.innerHTML = `<h3>Não foi desta vez.</h3><p>Sua nota: ${score.toFixed(
      0
    )}%. Você precisa de 70% para aprovação.</p>`;

    const studyBtn = document.createElement("button");
    studyBtn.className = "option-btn";
    studyBtn.textContent = "Estudar Novamente";
    studyBtn.onclick = () => {
      topic.chatHistory = [];
      topic.quiz = null;
      saveState();
      renderCurrentStateView();
    };

    const reviewBtn = document.createElement("button");
    reviewBtn.id = "review-mistakes-btn";
    reviewBtn.className = "option-btn";
    reviewBtn.style.backgroundColor = "var(--primary-color)";
    reviewBtn.style.color = "white";
    reviewBtn.textContent = "Revisar Meus Erros com o Tutor IA";
    reviewBtn.onclick = () => reviewMistakes(topic);

    optionsContainer.appendChild(reviewBtn);
    optionsContainer.appendChild(studyBtn);
  }
  $("#quiz-container").appendChild(resultDiv);
}

function renderTrilhaCompletedView() {
  const tr = getActiveTrilha();
  $("#main-content").innerHTML = `
                          <div class="content-card" style="text-align: center;">
                              <h1 style="color: var(--success-color); font-size: 3rem;">🎉</h1>
                              <h3>Parabéns!</h3>
                              <p style="font-size: 1.2rem; margin-top: 1rem;">Você concluiu com sucesso a trilha de <strong>${tr.title}</strong>!</p>
                              <p style="margin-top: 1rem;">Continue seus estudos explorando outras trilhas no dashboard.</p>
                          </div>
                          `;
}

function showLoadingIndicator(isGeneratingTrilha = false) {
  const message = isGeneratingTrilha
    ? "Gerando sua nova trilha de estudos..."
    : "Gerando conteúdo com a IA...";
  const target =
    isGeneratingTrilha || !$("#main-content")
      ? "#trilhas-container-wrapper"
      : "#main-content";
  $(
    target
  ).innerHTML = `<div id="loading-indicator"><div class="loader"></div><p>${message}</p></div>`;
  if (isGeneratingTrilha) {
    $(target).classList.remove("hidden");
  }
}

function hideLoadingIndicator() {
  const indicator = $("#loading-indicator");
  if (indicator && indicator.parentElement.id === "trilhas-container-wrapper") {
    indicator.parentElement.innerHTML =
      '<h2>Minhas Trilhas</h2><div id="trilhas-container"></div>';
  } else if (indicator) {
    indicator.remove();
  }
}

function showErrorMessage(message) {
  const target =
    appState.activeTrilhaId === null
      ? "#trilhas-container-wrapper"
      : "#main-content";
  $(
    target
  ).innerHTML = `<div class="content-card error-message"><p>${message}</p></div>`;
}

function showPromptModal(title, requestBody, callback) {
  onManualResponseSubmit = callback;
  $("#modal-title").textContent = title;
  $("#prompt-display").textContent = JSON.stringify(requestBody, null, 2);
  $("#response-input").value = "";
  $("#modal-error-message").classList.add("hidden");
  $("#prompt-modal").classList.remove("hidden");
}

function hidePromptModal() {
  $("#prompt-modal").classList.add("hidden");
  onManualResponseSubmit = null;
}

function isLastTopicOfTrilha(trilha, mIdx, sIdx) {
  if (!trilha || !trilha.modules) return false;
  const isLastModule = mIdx === trilha.modules.length - 1;
  if (!isLastModule) return false;
  const isLastSubtopic = sIdx === trilha.modules[mIdx].subtopics.length - 1;
  return isLastSubtopic;
}

async function createOrSelectTrilha(tema) {
  const id =
    "trilha-" +
    tema
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  appState.activeTrilhaId = id;

  if (!appState.trilhas[id]) {
    appState.trilhas[id] = {
      id,
      title: tema,
      completed: false,
      modules: [],
    };
  }

  const trilha = appState.trilhas[id];

  if (!trilha.modules?.length) {
    showLoadingIndicator(true);
    await processRequest("COORDENADOR", {
      history: [
        {
          role: "user",
          parts: [{ text: `Gere o currículo para o tema: "${tema}"` }],
        },
      ],
      onSuccess: (aiResponse) => {
        trilha.title = aiResponse.title;
        trilha.description = aiResponse.description;
        trilha.modules = aiResponse.modules.map((m) => ({
          ...m,
          subtopics: m.subtopics.map((sub) => ({
            ...sub,
            completed: false,
            chatHistory: [],
            quiz: null,
          })),
        }));
        appState.activeModuleIndex = 0;
        appState.activeSubtopicIndex = 0;
        saveState();
        hideLoadingIndicator();
        renderDashboard(); // Render dashboard first
        selectTrilha(id); // Then navigate
      },
    });
  } else {
    selectTrilha(id);
  }
}

function selectTrilha(id) {
  appState.activeTrilhaId = id;
  const trilha = appState.trilhas[id];
  let firstUncompletedM = -1;
  let firstUncompletedS = -1;

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

  const userMessage =
    topic.chatHistory.length === 0
      ? `Vamos começar o tópico: "${topic.title}". Por favor, me dê a introdução.`
      : `Continuando a aula sobre "${topic.title}". Minha última ação foi: ${
          topic.chatHistory.slice(-1)[0].parts[0].text
        }`;

  await continueProfessorInteraction(userMessage, true);
}

async function continueProfessorInteraction(
  userMessage,
  isStartingTopic = false
) {
  const topic = getActiveTopic();
  if (!topic) return;

  const history = [...topic.chatHistory];
  if (!isStartingTopic || topic.chatHistory.length === 0) {
    history.push({ role: "user", parts: [{ text: userMessage }] });
  }

  await processRequest("PROFESSOR", {
    history: history,
    onSuccess: (aiResponse) => {
      // Normaliza a resposta da IA para garantir consistência nos objetos de opção
      if (aiResponse.options && Array.isArray(aiResponse.options)) {
        aiResponse.options.forEach((opt) => {
          if (opt.label && !opt.text) {
            opt.text = opt.label;
            delete opt.label; // Limpa o objeto, deixando apenas a propriedade 'text'
          }
        });
      }

      if (!isStartingTopic || topic.chatHistory.length === 0) {
        topic.chatHistory.push({
          role: "user",
          parts: [{ text: userMessage }],
        });
      }

      topic.chatHistory.push({
        role: "model",
        parts: [{ text: JSON.stringify(aiResponse) }],
      });
      saveState();

      const modelMessagesCount = topic.chatHistory.filter(
        (m) => m.role === "model"
      ).length;

      if (
        !aiResponse.isTopicEnd &&
        modelMessagesCount >= INTERACTIONS_BEFORE_QUIZ
      ) {
        generateQuiz();
      } else {
        renderSceneView(aiResponse);
      }
    },
  });
}

function handleUserInteraction(option) {
  if (option.action === "escrever_pergunta") {
    renderFreeFormQuestionView(option);
  } else {
    // Agora sempre usará 'text' por causa da normalização
    const userMessage = `Minha escolha foi: "${option.text}" (ação: ${option.action}). Por favor, prossiga com a explicação.`;
    continueProfessorInteraction(userMessage);
  }
}

async function reviewMistakes(topic) {
  const reviewBtn = $("#review-mistakes-btn");
  if (reviewBtn) {
    reviewBtn.disabled = true;
    reviewBtn.textContent = "Revisando...";
  }

  const { questions, answers } = topic.quiz;
  const incorrectQuestionsInfo = [];
  const incorrectIndices = [];

  questions.forEach((q, i) => {
    const isCorrect = answers[i] === q.correctAnswer;
    if (!isCorrect && answers[i]) {
      // Only review answered, incorrect questions
      incorrectQuestionsInfo.push({
        question: q.question,
        correctAnswer: q.correctAnswer,
        studentAnswer: answers[i],
      });
      incorrectIndices.push(i);

      const explanationContainer = $(`#explanation-${i}`);
      explanationContainer.innerHTML = `<div style="display: flex; align-items: center; gap: 8px;"><div class="loader" style="width:24px; height:24px; border-width: 3px; margin: 0;"></div> <em style="color: var(--secondary-color);">Tutor IA está analisando sua resposta...</em></div>`;
    }
  });

  if (incorrectQuestionsInfo.length === 0) {
    if (reviewBtn) reviewBtn.textContent = "Nenhum erro para revisar!";
    return;
  }

  const context = `O subtópico é "${
    topic.title
  }". O aluno errou as seguintes questões: ${JSON.stringify(
    incorrectQuestionsInfo
  )}. Por favor, forneça uma explicação para cada erro, na mesma ordem.`;

  // Chama o processRequest para o TUTOR sem o loader global
  await processRequest(
    "TUTOR",
    {
      history: [{ role: "user", parts: [{ text: context }] }],
      onSuccess: (aiResponse) => {
        if (aiResponse.explanations && Array.isArray(aiResponse.explanations)) {
          aiResponse.explanations.forEach((explanation, idx) => {
            const originalQuestionIndex = incorrectIndices[idx];
            const explanationContainer = $(
              `#explanation-${originalQuestionIndex}`
            );
            if (explanationContainer) {
              explanationContainer.innerHTML = `<div style="background: #f1f3f5; padding: 12px; border-radius: 8px; border-left: 4px solid var(--primary-color);">${explanation.replace(
                /\\n|\n/g,
                "<br>"
              )}</div>`;
            }
          });
        }
        if (reviewBtn) reviewBtn.textContent = "Revisão Concluída!";
      },
    },
    { showGlobalLoader: false }
  );
}

async function generateQuiz() {
  const topic = getActiveTopic();
  if (!topic || topic.quiz) return;
  const context = `Subtópico: "${
    topic.title
  }". Histórico da conversa: ${JSON.stringify(topic.chatHistory)}`;
  await processRequest("AVALIADOR", {
    history: [{ role: "user", parts: [{ text: context }] }],
    onSuccess: (aiResponse) => {
      topic.quiz = {
        questions: aiResponse,
        answers: [],
        score: undefined,
      };
      saveState();
      renderLearningScreen();
    },
  });
}

function handleQuizSubmit() {
  const topic = getActiveTopic();
  const tr = getActiveTrilha();
  const form = $("#quiz-form");
  const userAnswers = [];
  let score = 0;
  let allAnswered = true;

  const formData = new FormData(form);
  topic.quiz.questions.forEach((q, qIdx) => {
    const userAnswer = formData.get(`q${qIdx}`);
    if (userAnswer === null) {
      allAnswered = false;
    }
    userAnswers.push(userAnswer);
  });

  if (!allAnswered) {
    alert(
      "Por favor, responda a todas as questões antes de enviar a avaliação."
    );
    return;
  }

  topic.quiz.questions.forEach((q, qIdx) => {
    if (userAnswers[qIdx] === q.correctAnswer) {
      score++;
    }
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

function setupEventListeners() {
  $("#api-mode-toggle").addEventListener("change", (e) => {
    if (e.target.checked && !GEMINI_API_KEY) {
      alert(
        "A chave da API não está disponível ou falhou ao carregar. Modo API desativado."
      );
      e.target.checked = false;
      appState.useApiMode = false;
    } else {
      appState.useApiMode = e.target.checked;
    }
    saveState();
  });

  $("#trilha-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const temaInput = $("#tema-input");
    const tema = temaInput.value.trim();
    if (tema) {
      createOrSelectTrilha(tema);
      temaInput.value = "";
    }
  });

  $("#back-to-dashboard").onclick = () => {
    appState.activeTrilhaId = null;
    appState.activeModuleIndex = -1;
    appState.activeSubtopicIndex = -1;
    saveState();
    renderDashboard();
  };

  $("#copy-prompt-btn").onclick = () => {
    navigator.clipboard.writeText($("#prompt-display").textContent);
    $("#copy-prompt-btn").textContent = "Copiado!";
    setTimeout(
      () => ($("#copy-prompt-btn").textContent = "Copiar Prompt"),
      2000
    );
  };

  $("#submit-response-btn").onclick = () => {
    const raw = $("#response-input").value.trim();
    const errorEl = $("#modal-error-message");
    if (!raw) {
      errorEl.textContent = "A área de resposta está vazia.";
      errorEl.classList.remove("hidden");
      return;
    }
    let jsonText = raw.startsWith("```json")
      ? raw.slice(7, -3)
      : raw.startsWith("```")
      ? raw.slice(3, -3)
      : raw;
    try {
      const aiJson = JSON.parse(jsonText.trim());
      if (onManualResponseSubmit) {
        onManualResponseSubmit(aiJson);
      }
      hidePromptModal();
    } catch (err) {
      console.error(err);
      errorEl.textContent = `Erro: Resposta inválida ou não é um JSON válido. (${err.message})`;
      errorEl.classList.remove("hidden");
    }
  };

  $(".modal-close-btn").onclick = hidePromptModal;
  $("#prompt-modal").addEventListener("click", (e) => {
    if (e.target === $("#prompt-modal")) {
      hidePromptModal();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  loadState();
  await loadApiKeys();
  setupEventListeners();

  $("#api-mode-toggle").checked = appState.useApiMode;

  if (appState.activeTrilhaId !== null) {
    renderLearningScreen();
  } else {
    renderDashboard();
  }
});


