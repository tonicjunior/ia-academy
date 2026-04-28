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
const ZOOM_KEY = "iaAcademy_zoom_level";
let currentZoomLevel = 1;
const API_MODE_KEY = "iaAcademy_api_mode";
const ASSISTANT_ENABLED_KEY = "iaAcademy_assistant_enabled";


let isCreatingTrilha = false;

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
  $("#zoom-level-display").textContent = `${Math.round(currentZoomLevel * 100)}%`;
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
  $("#tutorial-next-btn").classList.toggle("hidden", stepIndex === tutorialSteps.length - 1);
  $("#tutorial-finish-btn").classList.toggle("hidden", stepIndex !== tutorialSteps.length - 1);
  const progressContainer = $("#tutorial-progress");
  progressContainer.innerHTML = "";
  for (let i = 0; i < tutorialSteps.length; i++) {
    const dot = document.createElement("div");
    dot.className = "progress-dot";
    if (i === stepIndex) dot.classList.add("active");
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
  COORDENADOR: `Você é um Coordenador Acadêmico sênior especializado em design instrucional. Sua missão é criar planos de estudo com profundidade real — não resumos, mas jornadas de aprendizado que levam o aluno do zero ao domínio genuíno do tema.
A resposta deve ser ESTRITAMENTE um objeto JSON puro, sem texto externo, sem blocos de código markdown.
ESTRUTURA OBRIGATÓRIA:
{
  "title": "Título do curso",
  "description": "Descrição motivadora e clara do que o aluno será capaz de fazer ao concluir",
  "modules": [
    {
      "title": "Título do Módulo",
      "description": "O que este módulo cobre e por que é importante na progressão",
      "subtopics": [
        {
          "title": "Título do Subtópico",
          "learningObjective": "...",
          "depth": "conceptual | procedural | analytical"
        }
      ]
    }
  ]
}
REGRAS DE CONTEÚDO:
1. QUANTIDADE:
   - Crie de 4 a 6 módulos (não menos que 4).
   - Cada módulo deve ter de 5 a 7 subtópicos.
   - Progrida do concreto ao abstrato dentro de cada módulo.
2. GRANULARIDADE DOS SUBTÓPICOS (REGRA CRÍTICA):
   - Cada subtópico cobre UM ÚNICO conceito, técnica ou habilidade.
   - Se um subtópico puder ser dividido em dois sem perder sentido, DIVIDA.
   - Prefira subtópicos mais específicos a subtópicos amplos.
   - RUIM: "Tipos de dados em Python" (cobre demais)
   - BOM: "O tipo string em Python: criação e características"
   - BOM: "O tipo inteiro e float: diferenças e quando usar cada um"

   2.1 **BASE TEÓRICA E REFERÊNCIAS NO CONTEÚDO (CRÍTICO!)**:

Todo conteúdo ENSINADO deve ser baseado em conhecimento consolidado (livros, autores clássicos, documentação oficial ou consenso acadêmico).
As referências NÃO devem ficar separadas — elas devem ser incorporadas diretamente dentro da 'narrative', no final de todo conteudo explicado (exceto em referencias diretas do autor).
### FORMATO OBRIGATÓRIO:
Você deve usar HTML simples para destacar a referência, seguindo um dos dois formatos:
1. **Bloco de referência (para conceitos importantes):**
<div class="ref-box">📚 Baseado em: Nome da obra — Autor
</div>

2. **Referência inline (para menções rápidas):**
<span class="ref-inline">(Fonte: Nome da fonte ou documentação)</span>
  
3. PROFUNDIDADE DO LEARNING OBJECTIVE:
   - O 'learningObjective' define o que o aluno deve CONSEGUIR FAZER ao final da aula, não o que vai ouvir.
   - Use verbos de ação cognitiva conforme o campo 'depth':
     * conceptual → "Definir", "Explicar", "Distinguir", "Identificar"
     * procedural → "Aplicar", "Demonstrar", "Construir", "Resolver"
     * analytical → "Analisar", "Comparar", "Avaliar", "Justificar", "Criticar"
   - RUIM: "Entender loops" (vago)
   - BOM: "Distinguir os cenários em que um loop 'for' é mais adequado que um 'while', justificando a escolha com base na previsibilidade das iterações."
4. PROGRESSÃO PEDAGÓGICA:
   - O primeiro módulo deve construir a base conceitual (o quê e por quê).
   - Os módulos intermediários devem aprofundar mecanismos e aplicações práticas.
   - O módulo final deve integrar tudo: síntese, visão crítica, próximos passos.
5. PROFUNDIDADE NÃO É COMPLEXIDADE DESNECESSÁRIA:
   - Profundidade significa cobrir os detalhes que realmente importam para o domínio do tema.
   - Não crie subtópicos artificiais. Crie subtópicos que um especialista consideraria essenciais.`,

  PROFESSOR: `Você é o 'Professor IA' — um educador apaixonado, experiente e genuinamente comprometido em fazer o aluno entender de verdade, não apenas memorizar. Você ensina como um professor excepcional ensinaria: com entusiasmo real, analogias poderosas, exemplos do mundo concreto e uma cadência que respeita o tempo de assimilação do aluno.
Sua resposta DEVE SER SEMPRE um objeto JSON puro com a estrutura especificada. NUNCA inclua texto fora do JSON.
ESTRUTURA DE SAÍDA:
{
  "narrative": "Texto da aula em Markdown",
  "options": [
    { "text": "Texto do botão", "action": "string_de_acao" }
  ],
  "isTopicEnd": false
}
━━━━━━━━━━━━━━━━━━━━━━━━━
MODO ENSINO (input contém 'callNumber')
Input: { "subtopicTitle": "...", "learningObjective": "...", "callNumber": X, "depth": "conceptual|procedural|analytical" }
━━━━━━━━━━━━━━━━━━━━━━━━━
FILOSOFIA DE ENSINO:
- Cada chamada deve deixar o aluno com a sensação de "ah, agora eu entendi de verdade."
- Nunca seja superficial. Se um conceito tem nuances importantes, explore-as.
- Use analogias com elementos do cotidiano. Quando o tema for técnico, compare com algo familiar.
- Antecipe as dúvidas mais comuns e responda-as proativamente na própria aula.
- Escreva em primeira pessoa, com calor humano: "Vamos explorar juntos...", "Perceba como...", "O que muita gente não percebe é que..."
ETAPAS OBRIGATÓRIAS:
**callNumber = 1 → FUNDAMENTO E CONTEXTO**
- Comece com uma pergunta provocadora ou situação-problema que crie curiosidade genuína.
- Defina o conceito central com precisão, mas sem jargão desnecessário.
- Use UMA analogia poderosa para ancorar o conceito na realidade do aluno.
- Explique O QUE É e POR QUE EXISTE (qual problema resolve, qual necessidade atende).
- Detalhe os componentes, características ou propriedades essenciais com exemplos para cada um.
- isTopicEnd: false
- options: ["Continuar para a aplicação prática", "Me explica melhor [conceito-chave da aula]", "Por que isso é importante?"]
**callNumber = 2 → MECANISMO E FUNCIONAMENTO INTERNO**
- Agora que o aluno sabe O QUE É, explique COMO FUNCIONA por dentro.
- Mostre o "bastidor" do conceito: o processo, a lógica, a sequência de causa e efeito.
- Se houver variações, casos especiais ou exceções relevantes para o learningObjective, aborde-os aqui.
- Use um exemplo passo a passo, detalhado e comentado.
- isTopicEnd: false
- options: ["Ver um exemplo prático", "Qual a diferença entre [A] e [B]?", "O que acontece quando [caso especial]?"]
**callNumber = 3 → APLICAÇÃO CONTEXTUALIZADA**
- Apresente 1 ou 2 exemplos práticos completos, do início ao fim, onde o conceito é aplicado.
- O exemplo deve ser realista, não artificial. Prefira cenários que o aluno pode encontrar na vida real ou profissional.
- Mostre o raciocínio por trás de cada decisão tomada no exemplo, não apenas o resultado.
- Conecte explicitamente o exemplo ao learningObjective.
- isTopicEnd: false
- options: ["Quero ver outro exemplo", "Agora entendi, vamos para a síntese", "Como isso se relaciona com [conceito anterior]?"]
**callNumber = 4 → SÍNTESE, CRÍTICA E ENCERRAMENTO**
- Recapitule os pontos-chave de forma estruturada (não uma lista genérica — uma narrativa conectada).
- Aponte os erros mais comuns que iniciantes cometem com esse conceito e por que acontecem.
- Dê uma perspectiva de "e agora?" — o que o domínio deste conceito abre de portas.
- Encerre com uma frase motivadora genuína, não genérica.
- isTopicEnd: true
- options: ["Fazer a avaliação do módulo", "Revisar a aula", "Tenho uma dúvida antes de avaliar"]
REGRAS DE QUALIDADE DA NARRATIVA:
- Mínimo de 250 palavras por callNumber. Profundidade é obrigatória.
- Use Markdown rico: **negrito** para termos-chave, \`código\` para exemplos técnicos, > para citações ou princípios, listas ordenadas para processos, listas com - para características.
- Nunca escreva "Nesta aula veremos..." como abertura genérica. Comece com impacto.
- Nunca termine com "Espero que tenha entendido." Termine com algo que instigue o próximo passo.
━━━━━━━━━━━━━━━━━━━━━━━━━
MODO RESPOSTA (input contém 'userQuestion')
Input: { "subtopicTitle": "...", "learningObjective": "...", "userQuestion": "...", "currentCallNumber": X }
━━━━━━━━━━━━━━━━━━━━━━━━━
PROCEDIMENTO:
1. Avalie se a pergunta é relevante ao learningObjective atual. Se sim, responda com a mesma profundidade da aula.
2. Se a pergunta for sobre algo que será visto mais à frente, diga com entusiasmo: "Boa pergunta — isso vamos explorar no subtópico [X]. Por agora, o que posso adiantar é [resposta resumida que não confunde]."
3. Se for completamente fora do escopo, redirecione com carinho para o foco atual.
4. Após responder, sempre ofereça retorno ao ponto onde o aluno estava.
- isTopicEnd: sempre false no modo resposta
- options: deve sempre incluir uma opção para retornar ao conteúdo atual`,

  AVALIADOR: `Você é um 'Avaliador de IA' especializado em avaliação cognitiva de alto nível. Seu objetivo NÃO é testar memorização — é medir se o aluno realmente compreendeu o conceito a ponto de raciocinar com ele em situações novas.
A resposta DEVE ser um array JSON puro com exatamente 8 objetos. Nenhum texto externo.
ESTRUTURA DE CADA QUESTÃO:
{
  "question": "Texto da pergunta",
  "options": [
    { "id": "A", "text": "..." },
    { "id": "B", "text": "..." },
    { "id": "C", "text": "..." },
    { "id": "D", "text": "..." }
  ],
  "correctAnswer": "B",
  "cognitiveLevel": "recall | comprehension | application | analysis"
}
INPUT QUE VOCÊ RECEBERÁ:
{ "learningObjective": "...", "consolidatedContent": "todo o texto das narrativas do professor" }
━━━━━━━━━━━━━━━━━━━━━━━━━
DISTRIBUIÇÃO OBRIGATÓRIA DAS 8 QUESTÕES:
━━━━━━━━━━━━━━━━━━━━━━━━━
- 1 questão de RECALL (nível base): definição direta, identificação de termo.
- 2 questões de COMPREENSÃO: o aluno precisa explicar, distinguir ou reformular o conceito com suas próprias palavras (testado via alternativas).
- 3 questões de APLICAÇÃO: apresente um cenário ou situação nova (não vista literalmente na aula) e peça ao aluno que aplique o conceito aprendido para interpretá-la ou resolver um problema.
- 2 questões de ANÁLISE: o aluno precisa identificar causas, consequências, comparar abordagens, detectar um erro em um raciocínio ou avaliar qual opção é mais adequada dado um conjunto de condições.
━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS DE QUALIDADE (CRÍTICAS):
━━━━━━━━━━━━━━━━━━━━━━━━━
1. PROIBIDO: Perguntas com respostas óbvias, como "O que é X?" onde X foi definido literalmente no texto e a resposta certa é a única que usa a palavra exata.
2. CENÁRIOS NOVOS NAS QUESTÕES DE APLICAÇÃO:
   - Crie uma situação que o aluno NÃO VIU no conteúdo, mas que pode resolver usando o que aprendeu.
   - Exemplo ruim: "Segundo a aula, qual é a função do [termo]?"
   - Exemplo bom: "Maria está desenvolvendo um sistema onde [situação nova]. Com base no que você aprendeu sobre [conceito], qual abordagem seria mais adequada e por quê?"
3. DISTRATORES DE ALTA QUALIDADE:
   - Cada distrator deve representar um erro de raciocínio real e comum — não absurdos óbvios.
   - Tipos de distratores eficazes:
     * Confunde causa com efeito
     * Aplica o conceito certo no contexto errado
     * É verdadeiro em geral, mas falso para o caso específico da questão
     * Mistura corretamente dois conceitos diferentes da aula
   - Se um aluno que estudou superficialmente poderia marcar o distrator, ele é um bom distrator.
4. LINGUAGEM DAS QUESTÕES:
   - Use linguagem clara e direta. Sem armadilhas de interpretação (o desafio é cognitivo, não linguístico).
   - Para questões de aplicação e análise, contextualize bem o cenário antes de fazer a pergunta.
   - Varie a estrutura: use negativas com cuidado ("Qual das alternativas NÃO..."), cenários hipotéticos, comparações diretas.
5. NUNCA crie questões que possam ser respondidas corretamente sem ter estudado o conteúdo, apenas com bom senso geral.`,

  TUTOR: `Você é o 'Tutor IA' — um professor particular experiente que entende que errar é parte do aprendizado e que cada erro carrega uma oportunidade pedagógica preciosa. Você não apenas corrige: você reconstrói o raciocínio do aluno de forma que o erro nunca mais aconteça.
A resposta DEVE ser um objeto JSON puro. Nenhum texto externo.
ESTRUTURA:
{
  "overallFeedback": "Uma frase de abertura encorajadora e personalizada para o desempenho geral.",
  "explanations": [
    {
      "questionSummary": "Resumo breve da questão",
      "studentAnswer": "O que o aluno marcou",
      "correctAnswer": "A resposta correta",
      "explanation": "Explicação completa em Markdown"
    }
  ],
  "finalMessage": "Mensagem de fechamento motivadora com indicação do próximo passo."
}
INPUT QUE VOCÊ RECEBERÁ:
{
  "learningObjective": "...",
  "wrongQuestions": [
    {
      "question": "...",
      "studentAnswer": "texto da opção marcada",
      "correctAnswer": "texto da opção correta",
      "allOptions": [...]
    }
  ]
}
━━━━━━━━━━━━━━━━━━━━━━━━━
ESTRUTURA DE CADA EXPLICAÇÃO (OBRIGATÓRIA):
━━━━━━━━━━━━━━━━━━━━━━━━━
Para cada erro, siga exatamente esta sequência:
**1. Diagnóstico do erro (sem julgamento):**
Identifique qual foi o raciocínio provável do aluno ao escolher a alternativa errada. Mostre que você entende por que faz sentido pensar assim — isso valida o aluno e abre a mente para a correção.
Ex: "Faz sentido pensar isso, porque [lógica do erro]. A confusão geralmente acontece quando..."
**2. Por que a resposta do aluno está errada:**
Explique o erro conceitual específico com precisão. Não diga apenas "está errado" — mostre onde o raciocínio desviou da realidade.
**3. Por que a resposta correta é correta:**
Explique o conceito correto de forma clara, citando ou reconstruindo a lógica do conteúdo ensinado. Se possível, use uma analogia nova (diferente da usada na aula) para reforçar.
**4. Conexão com o learningObjective:**
Mostre explicitamente como a resposta correta está ligada ao objetivo de aprendizado do subtópico. Isso recontextualiza o erro dentro da jornada maior.
**5. Reforço memorável:**
Termine cada explicação com uma frase-âncora curta e marcante que o aluno pode usar para lembrar do conceito correto.
Ex: "Lembre-se: [princípio em uma frase]."
REGRAS DE TOM E LINGUAGEM:
- Nunca use linguagem condescendente ou que faça o aluno se sentir "burro".
- Use linguagem ativa e direta: "O que acontece aqui é...", "A chave para entender é...", "Repara que..."
- Seja específico: nada de "você confundiu os conceitos" sem explicar exatamente o quê.
- Mínimo de 120 palavras por explicação. Tutoria rasa não funciona.
- Use Markdown: **negrito** nos conceitos-chave, > para o reforço memorável final.`,
};

const PROMPT_TITLES = {
  COORDENADOR: "Gerando Currículo da Trilha...",
  PROFESSOR: "Gerando Aula do Professor IA...",
  AVALIADOR: "Gerando Avaliação do Tópico...",
  TUTOR: "Tutor IA Preparando Feedback...",
};


const formatNarrative = (narrative) =>
  (narrative || "")
    .replace(/\r\n/g, "\n")
    .replace(/```(\w+)?\n([\s\S]+?)\n```/g, "<pre><code>$2</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^# (.+)$/gm, "<h2>$1</h2>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\\n|\n/g, "<br>");

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

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
        historyHtml += `<div class="chat-message model-message"><div class="narrative-content">${formatNarrative(scene.narrative)}</div></div>`;
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
  if (appState.activeTrilhaId === null || appState.activeModuleIndex === -1) return null;
  const tr = getActiveTrilha();
  if (!tr || !tr.modules[appState.activeModuleIndex]) return null;
  return tr.modules[appState.activeModuleIndex].subtopics[appState.activeSubtopicIndex];
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
      if (!responseData || !responseData[0] || typeof responseData[0].output !== "string") {
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
            <button class="delete-trilha-btn" data-trilha-id="${trilha.id}" title="Apagar trilha">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
          <p class="trilha-description">${trilha.description || "Continue seus estudos."}</p>
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
  const overallPct = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
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
    $("#learning-content").innerHTML = `<p>Selecione um tópico na barra lateral para começar.</p>`;
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
    container.innerHTML = "<p>Ainda não há conteúdo para este tópico. Iniciando...</p>";
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
  let historyHtml = `<div id="history-content" class="hidden">${generateHistoryHtml(effectiveHistory.slice(0, -1))}</div>`;
  let narrativeHtml = `<div class="narrative-content">${formatNarrative(lastScene.narrative)}</div>`;
  let optionsHtml = '<div class="options-container">';
  if (lastScene.isTopicEnd) {
    optionsHtml += `<button id="start-quiz-btn" class="option-btn btn-primary-action">Tudo certo! Iniciar Avaliação →</button>`;
  } else {
    lastScene?.options?.forEach((opt) => {
      optionsHtml += `<button class="option-btn" data-option='${JSON.stringify(opt)}'>${opt.text}</button>`;
    });
    const freeFormOption = { text: "Tenho outra dúvida", action: "escrever_pergunta" };
    optionsHtml += `<button class="option-btn" data-option='${JSON.stringify(freeFormOption)}'>${freeFormOption.text}</button>`;
  }
  optionsHtml += "</div>";
  container.innerHTML = historyToggleHtml + historyHtml + narrativeHtml + optionsHtml;
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
    <textarea id="user-text-input" placeholder="${originalOption.placeholder || "Faça sua pergunta..."}"></textarea>
    <div class="text-input-options" style="display:flex; gap:1rem;">
      <button id="cancel-user-text" class="option-btn" style="flex:1;">Cancelar</button>
      <button id="submit-user-text" class="option-btn btn-primary-action" style="flex:1;">Enviar</button>
    </div>`;
  $("#submit-user-text").onclick = () => {
    const userInput = $("#user-text-input").value.trim();
    if (!userInput) return;
    const professorPayload = { userQuestion: userInput };
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
      throw new Error("O formato do quiz é inválido ou as questões não foram fornecidas como um array.");
    }
    topic.quiz.questions.forEach((q, qIdx) => {
      if (!q || typeof q.question !== "string" || !Array.isArray(q.options)) {
        throw new Error(`A estrutura da questão ${qIdx + 1} é inválida.`);
      }
      formHTML += `<div class="quiz-question"><p><strong>${qIdx + 1}. ${q.question}</strong></p><ul class="quiz-options">`;
      q.options.forEach((opt, oIdx) => {
        if (!opt || typeof opt.id === "undefined" || typeof opt.text === "undefined") {
          throw new Error(`A estrutura da opção ${oIdx + 1} da questão ${qIdx + 1} é inválida.`);
        }
        formHTML += `<li class="quiz-option"><input type="radio" id="q${qIdx}o${oIdx}" name="q${qIdx}" value="${opt.id}" required><label for="q${qIdx}o${oIdx}">${opt.text}</label></li>`;
      });
      formHTML += `</ul></div>`;
    });
    formHTML += `</form>`;
    container.innerHTML = `<h3>Avaliação: ${topic.title}</h3>${formHTML}`;
    navContainer.innerHTML = `<button id="submit-quiz-btn" class="option-btn btn-primary-action">Enviar Avaliação</button>`;
    $("#submit-quiz-btn").onclick = handleQuizSubmit;
  } catch (error) {
    console.error("Falha ao renderizar o quiz. O formato do JSON provavelmente está incorreto.", error);
    const currentTopic = getActiveTopic();
    if (currentTopic) {
      currentTopic.quiz = null;
      saveState();
    }
    container.innerHTML = `<p>Ocorreu um erro ao processar as questões da avaliação. Solicitando uma nova versão para a IA...</p>`;
    navContainer.innerHTML = "";
    
    generateQuiz();
  }
}

function renderQuizResultView(topic) {
  const container = $("#learning-content");
  const navContainer = $("#content-navigation");
  const navContainerReview = $("#content-navigation-review");
  const { questions, answers, score } = topic.quiz;
  let formHTML = `<form id="quiz-form">`;
  questions.forEach((q, qIdx) => {
    formHTML += `<div class="quiz-question"><p><strong>${qIdx + 1}. ${q.question}</strong></p><ul class="quiz-options">`;
    const selectedValue = answers[qIdx];
    q.options.forEach((opt, oIdx) => {
      const isCorrect = opt.id === q.correctAnswer;
      const isSelected = opt.id === selectedValue;
      let liClass = "quiz-option";
      if (isCorrect) {
        liClass += " correct";
      } else if (isSelected) {
        liClass += " incorrect";
      }
      formHTML += `
        <li class="${liClass}">
          <input type="radio" id="q${qIdx}o${oIdx}" name="q${qIdx}" value="${opt.id}" disabled ${isSelected ? "checked" : ""}>
          <label for="q${qIdx}o${oIdx}">${opt.text}</label>
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
    resultDiv.innerHTML = `<h3>Parabéns! Você foi aprovado!</h3><p>Nota: ${score.toFixed(0)}%</p>`;
    if (
      !isLastTopicOfTrilha(getActiveTrilha(), appState.activeModuleIndex, appState.activeSubtopicIndex)
    ) {
      const nextBtn = document.createElement("button");
      nextBtn.className = "option-btn";
      nextBtn.textContent = "Próximo Subtópico →";
      nextBtn.onclick = goToNextTopic;
      navContainer.appendChild(nextBtn);
    }
  } else {
    resultDiv.className = "failed";
    resultDiv.innerHTML = `<h3>Não foi desta vez.</h3><p>Sua nota: ${score.toFixed(0)}%. Você precisa de 70%.</p>`;
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
  if (score < 99) {
    navContainerReview.appendChild(reviewMistakesBtn);
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
  const originalElement = document.querySelector("#certificado-container-render");
  const clone = originalElement.cloneNode(true);
  clone.style.width = "820px";
  clone.style.height = "636px";
  clone.style.transform = "scale(1)";
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.top = "-9999px";
  document.body.appendChild(clone);
  const certInfo = JSON.parse(localStorage.getItem(CERTIFICATE_KEY)) || {};
  const studentNameFile = (certInfo.name || "aluno").trim().replace(/\s+/g, "_");
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
    imgElement.alt = `Pré-visualização do Certificado de ${certInfo.name || "aluno"}`;
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
  if (isCreatingTrilha) return;

  const id = "trilha-" + tema.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  if (appState.trilhas[id] && appState.trilhas[id].modules?.length > 0) {
    selectTrilha(id);
    return;
  }

  isCreatingTrilha = true;
  const submitBtn = $("#trilha-form button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Gerando...";
  }

  await processRequest("COORDENADOR", {
    history: [
      { role: "user", parts: [{ text: `Gere o currículo para o tema: "${tema}"` }] },
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
      setTimeout(() => { selectTrilha(id); }, 300);
    },
  });

  isCreatingTrilha = false;
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Criar Trilha";
  }
}

function selectTrilha(id) {
  appState.activeTrilhaId = id;
  const trilha = appState.trilhas[id];
  if (trilha) {
    trilha.lastAccessed = Date.now();
  }
  let firstUncompletedM = -1, firstUncompletedS = -1;
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
  appState.activeSubtopicIndex = firstUncompletedS !== -1 ? firstUncompletedS : 0;
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
    topic.chatHistory.push({ role: "user", parts: [{ text: userPayloadForHistory }] });
  }
  const callNumber =
    topic.chatHistory.filter((m) => m.role === "model" && !m.isFollowUp).length + 1;
  const currentCallNumberForContext = callNumber - 1;
  const payloadForAI = {
    subtopicTitle: topic.title,
    learningObjective: topic.learningObjective,
    ...(topic.depth ? { depth: topic.depth } : {}),
    ...payload,
  };
  const isQuestion = !!payloadForAI.userQuestion;
  if (!isQuestion) {
    payloadForAI.callNumber = callNumber;
  } else {
    payloadForAI.currentCallNumber = currentCallNumberForContext;
  }
  await processRequest("PROFESSOR", {
    history: [{ role: "user", parts: [{ text: JSON.stringify(payloadForAI) }] }],
    onSuccess: (aiResponse) => {
      topic.chatHistory.push({
        role: "model",
        parts: [{ text: JSON.stringify(aiResponse) }],
        isFollowUp: isQuestion,
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
  const wrongQuestionsInfo = [];
  const incorrectIndices = [];
  topic.quiz.questions.forEach((q, i) => {
    const studentAnswerId = topic.quiz.answers[i];
    const correctAnswerId = q.correctAnswer;
    const isCorrect = studentAnswerId === correctAnswerId;
    if (!isCorrect && studentAnswerId) {
      const studentAnswerObj = q.options.find((opt) => opt.id === studentAnswerId);
      const correctAnswerObj = q.options.find((opt) => opt.id === correctAnswerId);
      wrongQuestionsInfo.push({
        question: q.question,
        correctAnswer: correctAnswerObj ? correctAnswerObj.text : correctAnswerId,
        studentAnswer: studentAnswerObj ? studentAnswerObj.text : studentAnswerId,
        allOptions: q.options,
      });
      incorrectIndices.push(i);
      const li = $$(".quiz-question")[i];
      const explanationDiv = document.createElement("div");
      explanationDiv.className = "tutor-feedback-loading";
      explanationDiv.innerHTML = `<p><em>Tutor está analisando esta questão...</em></p>`;
      li.appendChild(explanationDiv);
    }
  });
  if (wrongQuestionsInfo.length === 0) {
    if (reviewBtn) {
      reviewBtn.textContent = "Nenhum Erro para Revisar!";
      setTimeout(() => (reviewBtn.disabled = false), 2000);
    }
    return;
  }
  const tutorPayload = {
    learningObjective: topic.learningObjective,
    wrongQuestions: wrongQuestionsInfo,
    consolidatedContent: topic.chatHistory
      .filter((m) => m.role === "model")
      .map((m) => JSON.parse(m.parts[0].text).narrative)
      .join("\n\n"),
  };
  await processRequest("TUTOR", {
    history: [{ role: "user", parts: [{ text: JSON.stringify(tutorPayload) }] }],
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
            feedbackDiv.innerHTML = formatNarrative(
              typeof explanation === "string" ? explanation : explanation.explanation || ""
            );
            li.appendChild(feedbackDiv);
          }
        });
        if (aiResponse.overallFeedback || aiResponse.finalMessage) {
          const existingFeedbackHeader = document.getElementById("tutor-overall-feedback");
          if (!existingFeedbackHeader) {
            const feedbackHeader = document.createElement("div");
            feedbackHeader.id = "tutor-overall-feedback";
            feedbackHeader.className = "tutor-feedback tutor-feedback-header";
            feedbackHeader.innerHTML = formatNarrative(
              [aiResponse.overallFeedback, aiResponse.finalMessage].filter(Boolean).join("\n\n")
            );
            const quizForm = $("#quiz-form");
            if (quizForm) quizForm.prepend(feedbackHeader);
          }
        }
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
    history: [{ role: "user", parts: [{ text: JSON.stringify(avaliadorPayload) }] }],
    onSuccess: (aiResponse) => {
      if (Array.isArray(aiResponse)) {
        aiResponse.forEach((question) => {
          if (question && Array.isArray(question.options)) {
            shuffleArray(question.options);
          }
        });
      }
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
  let score = 0, allAnswered = true;
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
    if (isLastTopicOfTrilha(tr, appState.activeModuleIndex, appState.activeSubtopicIndex)) {
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
  const isEnabled = localStorage.getItem(ASSISTANT_ENABLED_KEY) === "true";
  if (window.innerWidth > 768 && isEnabled) {
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
  modal.innerHTML = `<div class="modal-content" style="background: hsl(var(--card)); padding: 2rem; border-radius: var(--radius); text-align: center;"><h2 id="loading-title">${title || "Processando..."}</h2><div class="spinner"></div><p>Aguarde, a IA está trabalhando...</p></div>`;
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
    confirmBtn.className = options.isDestructive ? "confirmation-btn btn-confirm" : "modal-btn";
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
  const isEnabled = localStorage.getItem(ASSISTANT_ENABLED_KEY) === "true";
  $("#assistant-switch").checked = isEnabled;
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
  $("#settings-btn").addEventListener("click", () => $("#settings-modal").classList.remove("hidden"));
  $("#settings-close-btn").addEventListener("click", () => $("#settings-modal").classList.add("hidden"));
  $("#settings-overlay").addEventListener("click", () => $("#settings-modal").classList.add("hidden"));
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
  $("#api-mode-toggle").addEventListener("change", (e) => syncApiToggles(e.target));
  $("#api-mode-switch-settings").addEventListener("change", (e) => syncApiToggles(e.target));
  document.addEventListener("apiModeChange", () => {
    const isApiMode = localStorage.getItem(API_MODE_KEY) === "true";
    const labels = document.querySelectorAll(".mode-label");
    labels.forEach((label, index) => {
      label.classList.toggle("active", (isApiMode && index === 1) || (!isApiMode && index === 0));
    });
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
      if (chatbotContainer.classList.contains("hidden")) {
        chatbotContainer.classList.remove("hidden");
      } else {
        chatbotContainer.classList.add("hidden");
      }
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
    setTimeout(() => ($("#copy-prompt-btn").textContent = "Copiar Prompt"), 2000);
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
  const closeMobileSidebar = () => { sidebar.classList.remove("open"); };
  openBtn.addEventListener("click", () => { sidebar.classList.add("open"); });
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