// ===========================================================
// DESPEJÁ — Lógica principal (Vanilla JavaScript)
// Herramienta contra el bloqueo mental y la parálisis de tareas
//
// Algoritmo central:
// 1. Parsear el "brain dump" en tareas individuales (split por separadores)
// 2. Detectar el tipo de cada tarea por palabras clave (heurística)
// 3. Asignar nano-pasos concretos según el tipo (plantillas)
// 4. Mostrar UNA sola tarea a la vez (modo túnel)
// 5. Degradar la dificultad si el usuario pulsa "es demasiado"
// ===========================================================

// --- PLANTILLAS DE NANO-PASOS POR TIPO DE TAREA ---
// Cada tipo tiene:
//   keywords: raíces de palabras para detectar el tipo (en español)
//   label: nombre legible del tipo
//   steps: pasos progresivos (del más fácil al que requiere más)
//   fallback: paso ultra-simplificado (cuando "es demasiado")
//   emergency: paso mínimo absoluto (cuando ni el fallback alcanza)

const TASK_TYPES = [
  {
    id: 'communication',
    label: 'Mensaje / Respuesta',
    keywords: ['respond', 'contest', 'enviar', 'mensaje', 'mail', 'email',
               'llam', 'hablar', 'avisar', 'profe', 'profesor', 'whatsapp',
               'instagram', 'mandar'],
    steps: [
      'Abrí la app o el mail donde tenés que escribir.',
      'Escribí "Hola" o "Buenos días".',
      'Agregá una oración con lo esencial que necesitás decir.',
      'Mandalo. No tiene que ser perfecto.'
    ],
    fallback: 'Abrí la conversación. Solo abrirla. Nada más.',
    emergency: 'Pensá qué querés decir. No escribas nada todavía.'
  },
  {
    id: 'writing',
    label: 'Escritura / Trabajo',
    keywords: ['escrib', 'redact', 'ensayo', 'texto', 'document', 'informe',
               'present', 'tarea', 'trabajo', 'resum', 'monograf', 'tp ',
               'hacer el tp', 'deber', 'entreg'],
    steps: [
      'Abrí un archivo nuevo. Ponele cualquier nombre.',
      'Escribí el título o el tema arriba de todo.',
      'Escribí 2 oraciones. Las que se te ocurran. No importa si son malas.',
      'Releé lo que pusiste y corregí o agregá algo.',
      'Seguí desde donde estés.'
    ],
    fallback: 'Solo abrí un archivo vacío y dejalo ahí abierto.',
    emergency: 'Quedarte 2 minutos frente a la pantalla. Sin obligación de escribir.'
  },
  {
    id: 'reading',
    label: 'Lectura / Estudio',
    keywords: ['leer', 'estudi', 'capítulo', 'libro', 'párrafo', 'apunte',
               'repas', 'lectura', 'página', 'exam', 'parcial', 'final',
               'materia', 'resumen'],
    steps: [
      'Encontrá el material y abrilo en la parte que necesitás.',
      'Leé solo la primera oración.',
      'Leé el párrafo completo.',
      'Anotá una palabra clave de lo que leíste.',
      'Pasá al siguiente párrafo.'
    ],
    fallback: 'Poné el material abierto frente a vos. Nada más.',
    emergency: 'Sentate con el material a la vista. 2 minutos. Sin leer.'
  },
  {
    id: 'cleaning',
    label: 'Orden / Limpieza',
    keywords: ['limpi', 'orden', 'lavar', 'habitación', 'escritorio', 'cuarto',
               'cocina', 'bañ', 'ropa', 'cama', 'platos', 'basura', 'piso'],
    steps: [
      'Elegí una sola cosa que esté fuera de lugar.',
      'Ponela donde va.',
      'Elegí otra. Solo una.',
      'Repetí. Una cosa a la vez, sin apuro.'
    ],
    fallback: 'Parate. Solo parate de la silla.',
    emergency: 'Mirá alrededor 30 segundos. Nada más.'
  },
  {
    id: 'errand',
    label: 'Trámite / Gestión',
    keywords: ['comprar', 'pagar', 'tramit', 'turno', 'sacar', 'ir a',
               'banco', 'farmacia', 'super', 'mercado', 'buscar'],
    steps: [
      'Anotá exactamente adónde tenés que ir o qué necesitás.',
      'Fijate si necesitás llevar algo (plata, documento, bolsa).',
      'Prepará eso y dejalo en la puerta o en tu mochila.',
      'Salí. El resto se resuelve en el camino.'
    ],
    fallback: 'Abrí el celular y buscá la dirección o el número.',
    emergency: 'Sentate y pensá: ¿qué es lo mínimo que necesito para esto?'
  }
];

// Tipo genérico (cuando no se detecta ningún patrón específico)
const GENERIC_TYPE = {
  id: 'generic',
  label: 'Tarea',
  steps: [
    'Pensá qué necesitás para hacer esto (herramienta, archivo, info).',
    'Conseguí eso y ponelo frente a vos.',
    'Hacé la parte más chica y obvia que se te ocurra.',
    'Seguí con lo que viene.'
  ],
  fallback: 'Pensá cuál sería el primer movimiento físico para arrancar con esto.',
  emergency: 'Quedarte 2 minutos con esto en mente. Sin presión de actuar.'
};


// --- ESTADO DE LA APLICACIÓN ---

const state = {
  currentScreen: 'dump',    // 'dump' | 'tunnel' | 'done'
  tasks: [],                 // Array de objetos tarea
  currentTaskIndex: 0,       // Índice de la tarea actual en el túnel
  completedCount: 0,
  postponedCount: 0,
  timer: {
    interval: null,
    seconds: 120,
    isRunning: false
  }
};


// --- REFERENCIAS AL DOM ---

const dom = {
  // Pantallas
  screenDump:   document.getElementById('screen-dump'),
  screenTunnel: document.getElementById('screen-tunnel'),
  screenDone:   document.getElementById('screen-done'),

  // Dump
  dumpInput: document.getElementById('dump-input'),
  btnDump:   document.getElementById('btn-dump'),

  // Tunnel
  stressOrb:       document.getElementById('stress-orb'),
  tasksRemaining:  document.getElementById('tasks-remaining'),
  stressLabel:     document.getElementById('stress-label'),
  btnBack:         document.getElementById('btn-back'),
  tunnelCard:      document.getElementById('tunnel-card'),
  taskTypeLabel:   document.getElementById('task-type-label'),
  taskName:        document.getElementById('task-name'),
  stepInstruction: document.getElementById('step-instruction'),
  stepCounter:     document.getElementById('step-counter'),
  btnDone:         document.getElementById('btn-done'),
  btnSimplify:     document.getElementById('btn-simplify'),
  btnLater:        document.getElementById('btn-later'),

  // Timer
  timerSection:  document.getElementById('timer-section'),
  timerRing:     document.getElementById('timer-ring'),
  timerDisplay:  document.getElementById('timer-display'),
  btnTimerStart: document.getElementById('btn-timer-start'),
  btnTimerSkip:  document.getElementById('btn-timer-skip'),

  // Done
  doneOrb:     document.getElementById('done-orb'),
  statDone:    document.getElementById('stat-done'),
  statLater:   document.getElementById('stat-later'),
  btnRestart:  document.getElementById('btn-restart'),
  btnContinue: document.getElementById('btn-continue'),

  // Keyboard
  keyboardBar: document.getElementById('keyboard-bar')
};


// ===========================================================
// 1. PARSEO DEL "BRAIN DUMP" (texto libre → array de tareas)
// ===========================================================

function parseBrainDump(rawText) {
  // Separadores: coma, punto y coma, salto de línea, " y " (conjunción), " e "
  const separatorRegex = /[,;\n]|\s+y\s+|\s+e\s+/gi;

  const rawParts = rawText.split(separatorRegex);

  const tasks = rawParts
    .map(part => part.trim())
    .map(part => part.replace(/^[-•*]\s*/, ''))  // Limpiar viñetas
    .filter(part => part.length > 2)              // Descartar fragmentos vacíos
    .map((text, index) => {
      const type = detectTaskType(text);
      return {
        id: index,
        raw: capitalizeFirst(text),
        type: type,
        steps: type.steps,
        currentStep: 0,
        degradation: 0,    // 0: normal, 1: fallback, 2: emergency
        status: 'pending'  // 'pending' | 'done' | 'postponed'
      };
    });

  return tasks;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


// ===========================================================
// 2. DETECCIÓN DEL TIPO DE TAREA (heurística por palabras clave)
// ===========================================================

function detectTaskType(text) {
  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Recorrer cada tipo y buscar coincidencias con las keywords
  for (const taskType of TASK_TYPES) {
    for (const keyword of taskType.keywords) {
      const normalizedKw = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normalizedKw)) {
        return taskType;
      }
    }
  }

  return GENERIC_TYPE;
}


// ===========================================================
// 3. GESTIÓN DE PANTALLAS
// ===========================================================

function showScreen(screenName) {
  state.currentScreen = screenName;

  dom.screenDump.classList.remove('active');
  dom.screenTunnel.classList.remove('active');
  dom.screenDone.classList.remove('active');

  switch (screenName) {
    case 'dump':
      dom.screenDump.classList.add('active');
      dom.keyboardBar.classList.remove('visible');
      dom.dumpInput.focus();
      break;
    case 'tunnel':
      dom.screenTunnel.classList.add('active');
      dom.keyboardBar.classList.add('visible');
      break;
    case 'done':
      dom.screenDone.classList.add('active');
      dom.keyboardBar.classList.remove('visible');
      break;
  }

  saveSession();
}


// ===========================================================
// 4. MODO TÚNEL — Mostrar UNA tarea a la vez
// ===========================================================

function enterTunnel() {
  state.currentTaskIndex = 0;
  state.completedCount = 0;
  state.postponedCount = 0;
  hideTimer();
  advanceToNextPending();
  showScreen('tunnel');
}

function advanceToNextPending() {
  // Buscar la próxima tarea pendiente desde la posición actual
  const pending = state.tasks.filter(t => t.status === 'pending');

  if (pending.length === 0) {
    finishSession();
    return;
  }

  const task = pending[0];
  state.currentTaskIndex = state.tasks.indexOf(task);

  renderCurrentTask();
  updateStressIndicator();
}

function renderCurrentTask() {
  const task = state.tasks[state.currentTaskIndex];
  if (!task) return;

  // Efecto de transición
  dom.tunnelCard.classList.add('switching');
  dom.tunnelCard.classList.remove('resolved', 'simplifying');

  setTimeout(() => {
    // Tipo de tarea
    dom.taskTypeLabel.textContent = task.type.label;

    // Nombre de la tarea (lo que el usuario escribió)
    dom.taskName.textContent = task.raw;

    // Instrucción del paso actual según el nivel de degradación
    let instruction;
    if (task.degradation === 0) {
      instruction = task.steps[task.currentStep] || task.steps[task.steps.length - 1];
    } else if (task.degradation === 1) {
      instruction = task.type.fallback;
    } else {
      instruction = task.type.emergency;
    }
    dom.stepInstruction.textContent = instruction;

    // Contador de pasos (solo en modo normal)
    if (task.degradation === 0) {
      const stepNum = task.currentStep + 1;
      const total = task.steps.length;
      dom.stepCounter.textContent = `Paso ${stepNum} de ${total}`;
    } else if (task.degradation === 1) {
      dom.stepCounter.textContent = 'Versión simplificada';
    } else {
      dom.stepCounter.textContent = 'Paso mínimo';
    }

    dom.tunnelCard.classList.remove('switching');
  }, 160);
}

function updateStressIndicator() {
  const pending = state.tasks.filter(t => t.status === 'pending');
  const count = pending.length;
  const total = state.tasks.length;

  dom.tasksRemaining.textContent = count;
  dom.stressLabel.textContent = count === 1 ? 'cosa pendiente' : 'cosas pendientes';

  // Actualizar el orb visual
  const orb = dom.stressOrb;
  const ratio = total > 0 ? count / total : 0;

  // Velocidad del pulso: más rápido = más estrés
  const speed = 0.5 + (1 - ratio) * 2.5;
  orb.style.setProperty('--pulse-speed', speed + 's');

  // Tamaño: más grande = más estrés
  const size = 16 + ratio * 40;
  orb.style.setProperty('--orb-size', size + 'px');

  // Color: rojo → naranja → teal → verde
  if (ratio > 0.7) {
    orb.style.setProperty('--orb-color', '#f85149');
  } else if (ratio > 0.4) {
    orb.style.setProperty('--orb-color', '#db8b3e');
  } else if (ratio > 0) {
    orb.style.setProperty('--orb-color', '#4a9e8e');
  } else {
    orb.style.setProperty('--orb-color', '#3fb950');
  }
}


// ===========================================================
// 5. ACCIONES DEL TÚNEL
// ===========================================================

// --- LISTO: completar paso actual o toda la tarea ---
function handleDone() {
  const task = state.tasks[state.currentTaskIndex];
  if (!task) return;

  // Si está en modo degradado (fallback/emergency), completar la tarea entera
  if (task.degradation > 0) {
    completeTask(task);
    return;
  }

  // Si hay más pasos, avanzar al siguiente
  if (task.currentStep < task.steps.length - 1) {
    task.currentStep++;
    renderCurrentTask();
    playSound('step');
    saveSession();
  } else {
    // Último paso: completar la tarea
    completeTask(task);
  }
}

function completeTask(task) {
  task.status = 'done';
  state.completedCount++;

  // Efecto visual breve
  dom.tunnelCard.classList.add('resolved');
  playSound('done');

  setTimeout(() => {
    hideTimer();
    advanceToNextPending();
  }, 400);
}

// --- ES DEMASIADO: degradar la dificultad ---
function handleSimplify() {
  const task = state.tasks[state.currentTaskIndex];
  if (!task) return;

  if (task.degradation < 2) {
    task.degradation++;
    dom.tunnelCard.classList.add('simplifying');

    // Si llegó al nivel emergency (2), mostrar el timer
    if (task.degradation === 2) {
      showTimer();
    }

    renderCurrentTask();
    playSound('simplify');
    saveSession();

    setTimeout(() => {
      dom.tunnelCard.classList.remove('simplifying');
    }, 600);
  } else {
    // Ya está en el nivel mínimo, ofrecer el timer si no está visible
    showTimer();
  }
}

// --- DESPUÉS: posponer la tarea sin culpa ---
function handleLater() {
  const task = state.tasks[state.currentTaskIndex];
  if (!task) return;

  task.status = 'postponed';
  state.postponedCount++;
  playSound('later');
  hideTimer();
  advanceToNextPending();
}

// --- VOLVER: reiniciar sesión ---
function handleBack() {
  if (confirm('¿Volver al inicio? Se pierde el progreso actual.')) {
    stopTimer();
    showScreen('dump');
  }
}


// ===========================================================
// 6. TIMER DE 2 MINUTOS
// ===========================================================

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
  if (state.timer.isRunning) {
    stopTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  state.timer.isRunning = true;
  state.timer.seconds = 120;
  updateTimerDisplay();

  dom.btnTimerStart.textContent = 'Pausar';
  dom.btnTimerStart.classList.add('running');
  dom.timerRing.classList.add('active');

  state.timer.interval = setInterval(() => {
    state.timer.seconds--;
    updateTimerDisplay();

    if (state.timer.seconds <= 0) {
      stopTimer();
      playSound('timer');
      dom.timerDisplay.textContent = '0:00';
    }
  }, 1000);
}

function stopTimer() {
  state.timer.isRunning = false;
  clearInterval(state.timer.interval);
  state.timer.interval = null;

  dom.btnTimerStart.textContent = 'Arrancar timer';
  dom.btnTimerStart.classList.remove('running');
  dom.timerRing.classList.remove('active');
}

function updateTimerDisplay() {
  const mins = Math.floor(state.timer.seconds / 60);
  const secs = state.timer.seconds % 60;
  dom.timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}


// ===========================================================
// 7. PANTALLA DE SESIÓN TERMINADA
// ===========================================================

function finishSession() {
  stopTimer();

  dom.statDone.textContent = state.completedCount;
  dom.statLater.textContent = state.postponedCount;

  // Si hay tareas pospuestas, mostrar botón para seguir con ellas
  const postponed = state.tasks.filter(t => t.status === 'postponed');
  if (postponed.length > 0) {
    dom.btnContinue.style.display = 'inline-flex';
  } else {
    dom.btnContinue.style.display = 'none';
  }

  showScreen('done');
  playSound('done');
}


// ===========================================================
// 8. SONIDOS SUTILES (Web Audio API — sin archivos externos)
// ===========================================================

function playSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'step':
        // Click suave y corto
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
        break;

      case 'done':
        // Dos notas ascendentes cortas
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);       // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
        break;

      case 'simplify':
        // Tono descendente suave
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        break;

      case 'later':
        // Click neutro
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
        break;

      case 'timer':
        // Campana suave cuando termina el timer
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        break;
    }
  } catch (e) {
    // No hace nada si el audio no está disponible
  }
}


// ===========================================================
// 9. PERSISTENCIA EN LOCALSTORAGE
// ===========================================================

function saveSession() {
  try {
    const sessionData = {
      tasks: state.tasks,
      currentTaskIndex: state.currentTaskIndex,
      completedCount: state.completedCount,
      postponedCount: state.postponedCount,
      currentScreen: state.currentScreen,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('despeja_session', JSON.stringify(sessionData));
  } catch (e) {
    // LocalStorage no disponible — no pasa nada
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem('despeja_session');
    if (!raw) return false;

    const data = JSON.parse(raw);

    // Solo restaurar si la sesión es de las últimas 4 horas
    const savedAt = new Date(data.savedAt);
    const hoursSince = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 4) {
      localStorage.removeItem('despeja_session');
      return false;
    }

    // Solo restaurar si hay tareas pendientes
    const hasPending = data.tasks.some(t => t.status === 'pending');
    if (!hasPending) return false;

    // Restaurar el tipo de tarea (el objeto se pierde al serializar)
    data.tasks.forEach(task => {
      task.type = detectTaskType(task.raw);
      task.steps = task.type.steps;
    });

    state.tasks = data.tasks;
    state.currentTaskIndex = data.currentTaskIndex;
    state.completedCount = data.completedCount;
    state.postponedCount = data.postponedCount;

    return true;
  } catch (e) {
    return false;
  }
}

function clearSession() {
  localStorage.removeItem('despeja_session');
}


// ===========================================================
// 10. EVENT LISTENERS
// ===========================================================

// --- Dump screen ---
dom.dumpInput.addEventListener('input', () => {
  const hasContent = dom.dumpInput.value.trim().length > 3;
  dom.btnDump.disabled = !hasContent;
});

dom.btnDump.addEventListener('click', () => {
  const raw = dom.dumpInput.value.trim();
  if (raw.length < 3) return;

  state.tasks = parseBrainDump(raw);

  if (state.tasks.length === 0) {
    dom.dumpInput.placeholder = 'No se detectaron tareas. Probá separándolas con comas.';
    return;
  }

  enterTunnel();
});

// --- Tunnel actions ---
dom.btnDone.addEventListener('click', handleDone);
dom.btnSimplify.addEventListener('click', handleSimplify);
dom.btnLater.addEventListener('click', handleLater);
dom.btnBack.addEventListener('click', handleBack);

// --- Timer ---
dom.btnTimerStart.addEventListener('click', toggleTimer);
dom.btnTimerSkip.addEventListener('click', () => {
  hideTimer();
});

// --- Done screen ---
dom.btnRestart.addEventListener('click', () => {
  clearSession();
  state.tasks = [];
  dom.dumpInput.value = '';
  dom.btnDump.disabled = true;
  showScreen('dump');
});

dom.btnContinue.addEventListener('click', () => {
  // Convertir las pospuestas de nuevo a pendientes
  state.tasks.forEach(t => {
    if (t.status === 'postponed') {
      t.status = 'pending';
      t.currentStep = 0;
      t.degradation = 0;
    }
  });
  state.postponedCount = 0;
  enterTunnel();
});

// --- Atajos de teclado ---
document.addEventListener('keydown', (e) => {
  // Solo funcionar en modo túnel y si no hay textarea en foco
  if (state.currentScreen !== 'tunnel') return;
  if (document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.tagName === 'INPUT') return;

  switch (e.key.toLowerCase()) {
    case 'enter':
      e.preventDefault();
      handleDone();
      break;
    case 's':
      e.preventDefault();
      handleSimplify();
      break;
    case 'd':
      e.preventDefault();
      handleLater();
      break;
    case 't':
      e.preventDefault();
      if (dom.timerSection.classList.contains('visible')) {
        toggleTimer();
      } else {
        showTimer();
      }
      break;
    case 'escape':
      handleBack();
      break;
  }
});

// --- Permitir enviar con Ctrl+Enter desde el textarea ---
dom.dumpInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (!dom.btnDump.disabled) {
      dom.btnDump.click();
    }
  }
});


// ===========================================================
// 11. INICIALIZACIÓN
// ===========================================================

function init() {
  // Intentar restaurar sesión previa
  const restored = loadSession();

  if (restored) {
    const pending = state.tasks.filter(t => t.status === 'pending');
    if (pending.length > 0 && confirm(`Tenés ${pending.length} tarea(s) pendientes de antes. ¿Querés seguir con esas?`)) {
      advanceToNextPending();
      showScreen('tunnel');
      return;
    }
  }

  // Pantalla inicial
  clearSession();
  showScreen('dump');
}

init();
