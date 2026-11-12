// ===========================================================
// DESPEJÁ // SISTEMA INDUSTRIAL v2.4 (Vanilla JavaScript)
// - Múltiples espacios de trabajo (Workspaces)
// - Bóveda de materiales y archivos en IndexedDB (sin servidores)
// - Descompresión mental heurística y modo túnel
// - Síntesis acústica de relays mecánicos (Web Audio API)
// ===========================================================

// --- 1. CAPA DE BASE DE DATOS LOCAL: INDEXEDDB (Bóveda de archivos) ---
const DB_NAME = 'DespejaVaultDB';
const DB_VERSION = 1;
let db = null;

function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains('materials')) {
        const store = database.createObjectStore('materials', { keyPath: 'id', autoIncrement: true });
        store.createIndex('workspaceId', 'workspaceId', { unique: false });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = (e) => {
      console.warn('IndexedDB no disponible, operando en memoria temporal', e);
      resolve(null);
    };
  });
}

function saveFileToVault(workspaceId, file) {
  return new Promise((resolve) => {
    if (!db) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const tx = db.transaction('materials', 'readwrite');
      const store = tx.objectStore('materials');
      const record = {
        workspaceId,
        type: 'file',
        name: file.name,
        size: formatBytes(file.size),
        mime: file.type,
        data: e.target.result,
        createdAt: new Date().toISOString()
      };
      const req = store.add(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

function saveLinkToVault(workspaceId, url) {
  return new Promise((resolve) => {
    if (!db) return resolve(null);
    const tx = db.transaction('materials', 'readwrite');
    const store = tx.objectStore('materials');
    const record = {
      workspaceId,
      type: 'link',
      name: url,
      data: url,
      createdAt: new Date().toISOString()
    };
    const req = store.add(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => resolve(null);
  });
}

function getMaterialsByWorkspace(workspaceId) {
  return new Promise((resolve) => {
    if (!db) return resolve([]);
    const tx = db.transaction('materials', 'readonly');
    const store = tx.objectStore('materials');
    const index = store.index('workspaceId');
    const req = index.getAll(workspaceId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

function deleteMaterial(id) {
  return new Promise((resolve) => {
    if (!db) return resolve();
    const tx = db.transaction('materials', 'readwrite');
    const store = tx.objectStore('materials');
    const req = store.delete(Number(id));
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  return (kb / 1024).toFixed(1) + ' MB';
}


// --- 2. PLANTILLAS HEURÍSTICAS DE MICRO-PASOS ---
const TASK_TYPES = [
  {
    id: 'communication',
    label: 'COMUNICACIÓN / MENSAJE',
    keywords: ['respond', 'contest', 'enviar', 'mensaje', 'mail', 'email', 'llam', 'hablar', 'avisar', 'profe', 'whatsapp', 'mandar'],
    steps: [
      'Abrir la aplicación o bandeja donde tenés que escribir.',
      'Tipear el encabezado: "Hola" o "Buenos días".',
      'Escribir exactamente una oración con lo esencial.',
      'Enviar. Sin revisión obsesiva.'
    ],
    fallback: 'Abrir el chat o mail. Solo dejarlo en pantalla.',
    emergency: 'Quedarte mirando la pantalla 60 segundos. Cero palabras requeridas.'
  },
  {
    id: 'writing',
    label: 'ESCRITURA / TRABAJO',
    keywords: ['escrib', 'redact', 'ensayo', 'texto', 'document', 'informe', 'present', 'tarea', 'trabajo', 'resum', 'tp', 'deber', 'entreg'],
    steps: [
      'Crear un archivo en blanco y guardarlo con un nombre.',
      'Copiar el título o tema en el encabezado.',
      'Escribir 2 oraciones preliminares (no importa la calidad).',
      'Formular un subtítulo y continuar por inercia.'
    ],
    fallback: 'Abrir el procesador de texto vacío y no escribir nada.',
    emergency: 'Poner las manos sobre el teclado durante 120 segundos.'
  },
  {
    id: 'reading',
    label: 'ESTUDIO / LECTURA',
    keywords: ['leer', 'estudi', 'capitulo', 'libro', 'parrafo', 'apunte', 'repas', 'lectura', 'pagina', 'exam', 'parcial', 'materia'],
    steps: [
      'Ubicar el material y abrirlo en la página requerida.',
      'Leer exclusivamente la primera oración.',
      'Completar el primer párrafo.',
      'Marcar una palabra clave y pasar al siguiente bloque.'
    ],
    fallback: 'Colocar el apunte o PDF abierto frente a vos.',
    emergency: 'Sostener el material en mano 2 minutos sin obligación de leer.'
  },
  {
    id: 'cleaning',
    label: 'ORDEN / ESPACIO FÍSICO',
    keywords: ['limpi', 'orden', 'lavar', 'habitacion', 'escritorio', 'cuarto', 'cocina', 'platos', 'basura'],
    steps: [
      'Identificar un único objeto fuera de lugar.',
      'Llevarlo a su posición correcta.',
      'Descartar un papel o residuo visible.',
      'Continuar con un elemento a la vez.'
    ],
    fallback: 'Ponerte de pie junto al espacio a ordenar.',
    emergency: 'Observar el sector 30 segundos en silencio.'
  },
  {
    id: 'errand',
    label: 'GESTIÓN / TRÁMITE',
    keywords: ['comprar', 'pagar', 'tramit', 'turno', 'sacar', 'ir a', 'banco', 'farmacia', 'super'],
    steps: [
      'Anotar en una línea el destino y objetivo puntual.',
      'Verificar si se requiere documentación o pago.',
      'Dejar los elementos preparados cerca de la salida.',
      'Iniciar el traslado.'
    ],
    fallback: 'Buscar la dirección o teléfono en el celular.',
    emergency: 'Mentalizar el recorrido durante 1 minuto.'
  }
];

const GENERIC_TYPE = {
  id: 'generic',
  label: 'ACCIÓN GENERAL',
  steps: [
    'Disponer los elementos físicos o digitales necesarios.',
    'Ejecutar la acción más pequeña y obvia posible.',
    'Evaluar el estado resultante y seguir el flujo natural.'
  ],
  fallback: 'Alistar las herramientas requeridas sobre la mesa.',
  emergency: 'Permanecer 2 minutos junto al espacio de trabajo.'
};


// --- 3. GESTOR DE ESPACIOS DE TRABAJO (WORKSPACES) ---
const state = {
  workspaces: [
    { id: 'ws_default', name: '01/ General', tasks: [], currentTaskIndex: 0, completedCount: 0, postponedCount: 0, currentScreen: 'dump' }
  ],
  activeWorkspaceId: 'ws_default',
  timer: {
    interval: null,
    seconds: 120,
    isRunning: false
  }
};

function getActiveWorkspace() {
  return state.workspaces.find(w => w.id === state.activeWorkspaceId) || state.workspaces[0];
}

function saveGlobalState() {
  try {
    localStorage.setItem('despeja_v2_state', JSON.stringify({
      workspaces: state.workspaces,
      activeWorkspaceId: state.activeWorkspaceId
    }));
  } catch (e) {}
}

function loadGlobalState() {
  try {
    const raw = localStorage.getItem('despeja_v2_state');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.workspaces && parsed.workspaces.length > 0) {
      state.workspaces = parsed.workspaces;
      state.activeWorkspaceId = parsed.activeWorkspaceId || state.workspaces[0].id;
    }
  } catch (e) {}
}


// --- 4. REFERENCIAS DOM ---
const dom = {
  workspacesList: document.getElementById('workspaces-list'),
  btnNewWorkspace: document.getElementById('btn-new-workspace'),
  btnToggleVault: document.getElementById('btn-toggle-vault'),
  btnCloseVault: document.getElementById('btn-close-vault'),
  vaultDrawer: document.getElementById('vault-drawer'),
  vaultBadge: document.getElementById('vault-badge'),
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  quickLinkInput: document.getElementById('quick-link-input'),
  btnAddLink: document.getElementById('btn-add-link'),
  vaultItemsList: document.getElementById('vault-items-list'),

  screenDump: document.getElementById('screen-dump'),
  screenTunnel: document.getElementById('screen-tunnel'),
  screenDone: document.getElementById('screen-done'),

  dumpCurrentSpaceLabel: document.getElementById('dump-current-space-label'),
  dumpInput: document.getElementById('dump-input'),
  btnDump: document.getElementById('btn-dump'),

  telemetryProgress: document.getElementById('telemetry-progress'),
  tasksRemainingBadge: document.getElementById('tasks-remaining-badge'),
  tunnelCard: document.getElementById('tunnel-card'),
  taskTypeLabel: document.getElementById('task-type-label'),
  taskLevelTag: document.getElementById('task-level-tag'),
  taskName: document.getElementById('task-name'),
  stepInstruction: document.getElementById('step-instruction'),
  stepCounter: document.getElementById('step-counter'),
  btnDistraction: document.getElementById('btn-distraction'),

  btnDone: document.getElementById('btn-done'),
  btnSimplify: document.getElementById('btn-simplify'),
  btnLater: document.getElementById('btn-later'),

  timerSection: document.getElementById('timer-section'),
  timerDisplay: document.getElementById('timer-display'),
  btnTimerStart: document.getElementById('btn-timer-start'),
  btnTimerSkip: document.getElementById('btn-timer-skip'),

  statDone: document.getElementById('stat-done'),
  statLater: document.getElementById('stat-later'),
  sessionSummaryText: document.getElementById('session-summary-text'),
  btnCopySummary: document.getElementById('btn-copy-summary'),
  btnContinue: document.getElementById('btn-continue'),
  btnRestart: document.getElementById('btn-restart'),

  btnInfo: document.getElementById('btn-info'),
  modalInfo: document.getElementById('modal-info'),
  modalDistraction: document.getElementById('modal-distraction'),
  distractionInput: document.getElementById('distraction-input'),
  btnSaveDistraction: document.getElementById('btn-save-distraction')
};


// --- 5. PARSER HEURÍSTICO ---
function parseBrainDump(rawText) {
  const parts = rawText.split(/[,;\n]|\s+y\s+|\s+e\s+/gi);
  return parts
    .map(p => p.trim().replace(/^[-•*]\s*/, ''))
    .filter(p => p.length > 2)
    .map((text, idx) => {
      const type = detectTaskType(text);
      return {
        id: Date.now() + '_' + idx,
        raw: text.charAt(0).toUpperCase() + text.slice(1),
        typeId: type.id,
        currentStep: 0,
        degradation: 0,
        status: 'pending'
      };
    });
}

function detectTaskType(text) {
  const norm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const t of TASK_TYPES) {
    for (const kw of t.keywords) {
      if (norm.includes(kw)) return t;
    }
  }
  return GENERIC_TYPE;
}

function getTaskTypeObject(typeId) {
  return TASK_TYPES.find(t => t.id === typeId) || GENERIC_TYPE;
}


// --- 6. RENDERIZADO DE ESPACIOS (TABS) ---
function renderWorkspacesTabs() {
  dom.workspacesList.innerHTML = '';
  state.workspaces.forEach(ws => {
    const tab = document.createElement('div');
    tab.className = `ws-tab ${ws.id === state.activeWorkspaceId ? 'active' : ''}`;
    tab.innerHTML = `
      <span>${escapeHtml(ws.name)}</span>
      ${state.workspaces.length > 1 ? `<span class="ws-del" title="Eliminar espacio" onclick="deleteWorkspace(event, '${ws.id}')">✕</span>` : ''}
    `;
    tab.addEventListener('click', () => switchWorkspace(ws.id));
    dom.workspacesList.appendChild(tab);
  });
}

function switchWorkspace(id) {
  state.activeWorkspaceId = id;
  renderWorkspacesTabs();
  const ws = getActiveWorkspace();
  dom.dumpCurrentSpaceLabel.textContent = `ESPACIO: ${ws.name.toUpperCase()}`;
  showScreen(ws.currentScreen || 'dump');
  if (ws.currentScreen === 'tunnel') {
    advanceToNextPending();
  }
  updateVaultBadgeAndList();
  playRelaySound('switch');
  saveGlobalState();
}

function createNewWorkspace() {
  const name = prompt('Nombre del nuevo espacio de trabajo (ej: Escuela, Proyecto X, Trámites):');
  if (!name || !name.trim()) return;
  const newId = 'ws_' + Date.now();
  const indexStr = (state.workspaces.length + 1).toString().padStart(2, '0');
  state.workspaces.push({
    id: newId,
    name: `${indexStr}/ ${name.trim()}`,
    tasks: [],
    currentTaskIndex: 0,
    completedCount: 0,
    postponedCount: 0,
    currentScreen: 'dump'
  });
  switchWorkspace(newId);
}

window.deleteWorkspace = function(e, id) {
  e.stopPropagation();
  if (state.workspaces.length <= 1) return;
  if (!confirm('¿Eliminar este espacio y todos sus datos?')) return;
  state.workspaces = state.workspaces.filter(w => w.id !== id);
  if (state.activeWorkspaceId === id) {
    state.activeWorkspaceId = state.workspaces[0].id;
  }
  renderWorkspacesTabs();
  switchWorkspace(state.activeWorkspaceId);
};


// --- 7. MODO TÚNEL ---
function showScreen(screenName) {
  const ws = getActiveWorkspace();
  ws.currentScreen = screenName;

  dom.screenDump.classList.remove('active');
  dom.screenTunnel.classList.remove('active');
  dom.screenDone.classList.remove('active');

  if (screenName === 'dump') dom.screenDump.classList.add('active');
  if (screenName === 'tunnel') dom.screenTunnel.classList.add('active');
  if (screenName === 'done') dom.screenDone.classList.add('active');

  saveGlobalState();
}

function enterTunnel() {
  const ws = getActiveWorkspace();
  ws.currentTaskIndex = 0;
  ws.completedCount = 0;
  ws.postponedCount = 0;
  hideTimer();
  advanceToNextPending();
  showScreen('tunnel');
}

function advanceToNextPending() {
  const ws = getActiveWorkspace();
  const pending = ws.tasks.filter(t => t.status === 'pending');

  if (pending.length === 0) {
    finishSession();
    return;
  }

  const currentTask = pending[0];
  ws.currentTaskIndex = ws.tasks.indexOf(currentTask);
  renderCurrentTask();
  updateTelemetry();
}

function renderCurrentTask() {
  const ws = getActiveWorkspace();
  const task = ws.tasks[ws.currentTaskIndex];
  if (!task) return;

  const type = getTaskTypeObject(task.typeId);
  dom.taskTypeLabel.textContent = type.label;
  dom.taskName.textContent = task.raw;

  let instruction = '';
  if (task.degradation === 0) {
    instruction = type.steps[task.currentStep] || type.steps[type.steps.length - 1];
    dom.taskLevelTag.textContent = 'NIVEL 1: ESTÁNDAR';
    dom.stepCounter.textContent = `Paso ${task.currentStep + 1} de ${type.steps.length}`;
  } else if (task.degradation === 1) {
    instruction = type.fallback;
    dom.taskLevelTag.textContent = 'NIVEL 2: SIMPLIFICADO';
    dom.stepCounter.textContent = 'Fricción reducida';
  } else {
    instruction = type.emergency;
    dom.taskLevelTag.textContent = 'NIVEL 3: ACCIÓN MÍNIMA';
    dom.stepCounter.textContent = 'Umbral cero';
  }

  dom.stepInstruction.textContent = instruction;
}

function updateTelemetry() {
  const ws = getActiveWorkspace();
  const total = ws.tasks.length;
  const remaining = ws.tasks.filter(t => t.status === 'pending').length;
  const done = ws.completedCount;

  dom.tasksRemainingBadge.textContent = `${remaining} / ${total}`;
  const pct = total > 0 ? (done / total) * 100 : 0;
  dom.telemetryProgress.style.width = pct + '%';
}

function handleDone() {
  const ws = getActiveWorkspace();
  const task = ws.tasks[ws.currentTaskIndex];
  if (!task) return;

  const type = getTaskTypeObject(task.typeId);

  if (task.degradation > 0 || task.currentStep >= type.steps.length - 1) {
    task.status = 'done';
    ws.completedCount++;
    playRelaySound('done');
    hideTimer();
    advanceToNextPending();
  } else {
    task.currentStep++;
    playRelaySound('step');
    renderCurrentTask();
  }
  saveGlobalState();
}

function handleSimplify() {
  const ws = getActiveWorkspace();
  const task = ws.tasks[ws.currentTaskIndex];
  if (!task) return;

  if (task.degradation < 2) {
    task.degradation++;
    if (task.degradation === 2) showTimer();
  } else {
    showTimer();
  }
  playRelaySound('simplify');
  renderCurrentTask();
  saveGlobalState();
}

function handleLater() {
  const ws = getActiveWorkspace();
  const task = ws.tasks[ws.currentTaskIndex];
  if (!task) return;

  task.status = 'postponed';
  ws.postponedCount++;
  playRelaySound('later');
  hideTimer();
  advanceToNextPending();
  saveGlobalState();
}


// --- 8. CRONÓMETRO DE 120 SEGUNDOS ---
function showTimer() {
  dom.timerSection.classList.add('visible');
  state.timer.seconds = 120;
  updateTimerDisplay();
}

function hideTimer() {
  dom.timerSection.classList.remove('visible');
  stopTimer();
}

function toggleTimer() {
  if (state.timer.isRunning) stopTimer();
  else startTimer();
}

function startTimer() {
  state.timer.isRunning = true;
  state.timer.seconds = 120;
  updateTimerDisplay();
  dom.btnTimerStart.textContent = 'PAUSAR';
  state.timer.interval = setInterval(() => {
    state.timer.seconds--;
    updateTimerDisplay();
    if (state.timer.seconds <= 0) {
      stopTimer();
      playRelaySound('done');
      dom.timerDisplay.textContent = '00:00';
    }
  }, 1000);
}

function stopTimer() {
  state.timer.isRunning = false;
  clearInterval(state.timer.interval);
  dom.btnTimerStart.textContent = 'REANUDAR';
}

function updateTimerDisplay() {
  const m = Math.floor(state.timer.seconds / 60);
  const s = state.timer.seconds % 60;
  dom.timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}


// --- 9. BALANCE FINAL Y EXPORTACIÓN ---
function finishSession() {
  stopTimer();
  const ws = getActiveWorkspace();
  dom.statDone.textContent = ws.completedCount;
  dom.statLater.textContent = ws.postponedCount;

  const doneTasks = ws.tasks.filter(t => t.status === 'done');
  const laterTasks = ws.tasks.filter(t => t.status === 'postponed');

  let report = `DESPEJÁ // BALANCE - ${ws.name}\nFecha: ${new Date().toLocaleDateString()}\n\n`;
  report += `✓ ACCIONES RESUELTAS (${doneTasks.length}):\n`;
  doneTasks.forEach(t => report += `  [x] ${t.raw}\n`);
  if (laterTasks.length > 0) {
    report += `\n⏳ POSTERGADAS SIN CULPA (${laterTasks.length}):\n`;
    laterTasks.forEach(t => report += `  [ ] ${t.raw}\n`);
    dom.btnContinue.style.display = 'inline-flex';
  } else {
    dom.btnContinue.style.display = 'none';
  }

  dom.sessionSummaryText.textContent = report;
  showScreen('done');
  playRelaySound('done');
}

dom.btnCopySummary.addEventListener('click', () => {
  navigator.clipboard.writeText(dom.sessionSummaryText.textContent);
  dom.btnCopySummary.textContent = '¡COPIADO AL PORTAPAPELES!';
  setTimeout(() => dom.btnCopySummary.textContent = 'COPIAR BALANCE AL PORTAPAPELES', 2000);
});

dom.btnContinue.addEventListener('click', () => {
  const ws = getActiveWorkspace();
  ws.tasks.forEach(t => {
    if (t.status === 'postponed') {
      t.status = 'pending';
      t.currentStep = 0;
      t.degradation = 0;
    }
  });
  ws.postponedCount = 0;
  enterTunnel();
});

dom.btnRestart.addEventListener('click', () => {
  const ws = getActiveWorkspace();
  ws.tasks = [];
  dom.dumpInput.value = '';
  dom.btnDump.disabled = true;
  showScreen('dump');
});


// --- 10. GESTIÓN DE LA BÓVEDA DE MATERIALES ---
async function updateVaultBadgeAndList() {
  const ws = getActiveWorkspace();
  const items = await getMaterialsByWorkspace(ws.id);
  dom.vaultBadge.textContent = items.length;

  if (items.length === 0) {
    dom.vaultItemsList.innerHTML = '<div class="vault-empty">No hay materiales cargados en este espacio.</div>';
    return;
  }

  dom.vaultItemsList.innerHTML = '';
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'vault-item';
    if (item.type === 'file') {
      el.innerHTML = `
        <span title="${escapeHtml(item.name)}">📄 <a href="${item.data}" download="${escapeHtml(item.name)}" class="vault-item-name">${escapeHtml(item.name)}</a> <small>(${item.size})</small></span>
        <button class="vault-item-del" onclick="removeVaultItem(${item.id})">✕</button>
      `;
    } else {
      el.innerHTML = `
        <span title="${escapeHtml(item.name)}">🔗 <a href="${item.data}" target="_blank" class="vault-item-name">${escapeHtml(item.name)}</a></span>
        <button class="vault-item-del" onclick="removeVaultItem(${item.id})">✕</button>
      `;
    }
    dom.vaultItemsList.appendChild(el);
  });
}

window.removeVaultItem = async function(id) {
  await deleteMaterial(id);
  updateVaultBadgeAndList();
};

dom.btnToggleVault.addEventListener('click', () => dom.vaultDrawer.classList.toggle('open'));
dom.btnCloseVault.addEventListener('click', () => dom.vaultDrawer.classList.remove('open'));

// Drag & drop de archivos
dom.dropZone.addEventListener('click', () => dom.fileInput.click());
dom.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dom.dropZone.classList.add('dragover'); });
dom.dropZone.addEventListener('dragleave', () => dom.dropZone.classList.remove('dragover'));
dom.dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dom.dropZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (!files || files.length === 0) return;
  const ws = getActiveWorkspace();
  for (const f of files) {
    await saveFileToVault(ws.id, f);
  }
  updateVaultBadgeAndList();
  playRelaySound('step');
});

dom.fileInput.addEventListener('change', async (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  const ws = getActiveWorkspace();
  for (const f of files) {
    await saveFileToVault(ws.id, f);
  }
  updateVaultBadgeAndList();
  playRelaySound('step');
});

dom.btnAddLink.addEventListener('click', async () => {
  const val = dom.quickLinkInput.value.trim();
  if (!val) return;
  const ws = getActiveWorkspace();
  await saveLinkToVault(ws.id, val);
  dom.quickLinkInput.value = '';
  updateVaultBadgeAndList();
  playRelaySound('step');
});


// --- 11. SÍNTESIS ACÚSTICA ANALÓGICA (Web Audio API) ---
function playRelaySound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'done') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'simplify') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else {
      // Click seco de relay
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    }
  } catch (e) {}
}


// --- 12. EVENT LISTENERS Y ATAJOS ---
dom.dumpInput.addEventListener('input', () => {
  dom.btnDump.disabled = dom.dumpInput.value.trim().length < 3;
});

dom.btnDump.addEventListener('click', () => {
  const val = dom.dumpInput.value.trim();
  if (val.length < 3) return;
  const ws = getActiveWorkspace();
  ws.tasks = parseBrainDump(val);
  enterTunnel();
});

dom.dumpInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    if (!dom.btnDump.disabled) dom.btnDump.click();
  }
});

dom.btnDone.addEventListener('click', handleDone);
dom.btnSimplify.addEventListener('click', handleSimplify);
dom.btnLater.addEventListener('click', handleLater);

dom.btnTimerStart.addEventListener('click', toggleTimer);
dom.btnTimerSkip.addEventListener('click', hideTimer);

dom.btnNewWorkspace.addEventListener('click', createNewWorkspace);

// Distracción rápida
dom.btnDistraction.addEventListener('click', () => {
  dom.distractionInput.value = '';
  dom.modalDistraction.classList.add('active');
  dom.distractionInput.focus();
});

dom.btnSaveDistraction.addEventListener('click', () => {
  const txt = dom.distractionInput.value.trim();
  if (txt) {
    const ws = getActiveWorkspace();
    const newTask = {
      id: Date.now() + '_distract',
      raw: txt,
      typeId: detectTaskType(txt).id,
      currentStep: 0,
      degradation: 0,
      status: 'pending'
    };
    ws.tasks.push(newTask);
    updateTelemetry();
    saveGlobalState();
    playRelaySound('step');
  }
  dom.modalDistraction.classList.remove('active');
});

// Modales info
dom.btnInfo.addEventListener('click', () => dom.modalInfo.classList.add('active'));
document.querySelectorAll('[data-close]').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  });
});

// Atajos globales de teclado
document.addEventListener('keydown', (e) => {
  const ws = getActiveWorkspace();
  if (ws.currentScreen !== 'tunnel') return;
  if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') return;

  if (e.key === 'Enter') { e.preventDefault(); handleDone(); }
  if (e.key.toLowerCase() === 's') { e.preventDefault(); handleSimplify(); }
  if (e.key.toLowerCase() === 'd') { e.preventDefault(); handleLater(); }
  if (e.key.toLowerCase() === 't') { e.preventDefault(); showTimer(); toggleTimer(); }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


// --- 13. ARRANQUE ---
async function startApp() {
  await initIndexedDB();
  loadGlobalState();
  renderWorkspacesTabs();
  const ws = getActiveWorkspace();
  dom.dumpCurrentSpaceLabel.textContent = `ESPACIO: ${ws.name.toUpperCase()}`;
  showScreen(ws.currentScreen || 'dump');
  if (ws.currentScreen === 'tunnel') {
    advanceToNextPending();
  }
  updateVaultBadgeAndList();
}

startApp();
