# Despejá - Consola de Descompresión Mental

### TL;DR

Despejá es una herramienta web diseñada para destrabar la cabeza cuando estás colapsado de tareas y no podés arrancar. 

En lugar de mostrarte una lista infinita que te genera más culpa y parálisis:
* **Volcás todo en bruto:** Escribís tus pendientes en un solo bloque de texto desordenado.
* **Modo Túnel:** La pantalla oculta el 99% de tus problemas y te fuerza a mirar una sola acción concreta a la vez.
* **Desescalada de fricción:** Si la tarea te supera, el botón «Es demasiado» la desarma en un nano-paso de 30 segundos (o activa un cronómetro de 2 minutos con permiso explícito de abandonar sin culpa).
* **Bóveda local de materiales:** Guardás PDFs, apuntes y enlaces en la base de datos interna del navegador (IndexedDB) para no perder tiempo buscando dónde estaban las cosas.
* **100% JavaScript nativo:** Sin frameworks, sin librerías externas, sin servidores y sin modelos de lenguaje de IA. Funciona offline y de forma instantánea.

---

## El origen del proyecto

Este proyecto nació de una frustración real que vivo casi todos los días: sentarme a estudiar o trabajar, tener diez cosas pendientes acumuladas (el trabajo práctico de química, contestarle un mail a un docente, ordenar la habitación, preparar el examen del jueves) y sentir que el cerebro entra en cortocircuito.

La respuesta estándar de la industria a este problema son las aplicaciones de productividad como Notion, Todoist o Trello. El problema es que esas herramientas están diseñadas para organizar proyectos cuando estás lúcido y motivado. Cuando estás saturado, ver una lista con quince casilleros vacíos no te organiza: te aplasta. La amígdala interpreta esa lista como una amenaza difusa y el cuerpo reacciona con la respuesta de congelamiento (*freeze response*). El resultado es siempre el mismo: cerrás la app, abrís el teléfono y perdés cuatro horas scrolleando con culpa.

La otra alternativa moderna son los asistentes de inteligencia artificial. Pero cuando estás bloqueado, que un bot te responda con frases prefabricadas de autoayuda («¡Vos podés con todo! Tomá aire fresco y empezá con energía») genera rechazo inmediato. 

Despejá fue construida para intervenir en ese segundo exacto donde se produce el bloqueo: el primer movimiento físico.

---

## Principios de funcionamiento

### 1. Tono seco y cero condescendencia
La consola no intenta ser tu terapeuta ni tu coach motivacional. No hay animaciones infantiles, no hay frases de aliento falsas y no hay signos de exclamación innecesarios. El diseño y los textos son sobrios, directos y funcionales, inspirados en el instrumental de medición analógico y los tableros de taller.

### 2. Modo Túnel radical (Tunnel Vision)
Cuando el nivel de estrés es alto, la memoria de trabajo colapsa. Despejá toma el texto libre del usuario, lo segmenta en unidades aisladas y activa el Modo Túnel: la interfaz oculta todo lo demás y te presenta un solo paso. No podés ver la tarea que sigue ni la que quedó atrás. Solo existe la acción presente.

### 3. Degradación de resistencia («Es demasiado»)
El cerebro no suele resistirse a la tarea en sí, sino a la escala del primer paso. «Hacer el informe de historia» es un bloque inmenso. Si tocás «Es demasiado», el sistema aplica una regla de fragmentación en tres niveles:
* Nivel 1 (Estándar): Pasos secuenciales de arranque.
* Nivel 2 (Simplificado): Abrir el programa o ubicar el material, sin obligación de producir.
* Nivel 3 (Acción mínima): Apoyar las manos en el teclado o quedarse dos minutos frente a la pantalla.

### 4. Cláusula de rescisión de los 120 segundos
En el nivel de acción mínima se despliega un cronómetro de dos minutos con una regla clara: si cumplidos los 120 segundos la resistencia mental sigue siendo total, tenés autorización explícita para cerrar la aplicación y postergar la tarea sin reproches. La paradoja psicológica es que, en más del 80% de los casos, romper la inercia del primer minuto basta para continuar por cuenta propia.

---

## Decisiones técnicas y arquitectura

### Por qué no utiliza Inteligencia Artificial
Hoy existe una tendencia a conectar cualquier desarrollo a una API de OpenAI o Gemini solo para decir que incluye IA. En este proyecto se tomó la decisión deliberada de evitarlo por tres razones:
1. **Latencia cero:** Una consulta a un servidor remoto tarda entre dos y cuatro segundos. Cuando una persona está al borde de abandonar una tarea, cuatro segundos de espera son suficientes para distraerse. Despejá procesa el texto en menos de dos milisegundos de forma local.
2. **Determinismo y privacidad:** La heurística basada en expresiones regulares y raíces morfológicas del español (`estudi*`, `escrib*`, `limpi*`, `respond*`, `compr*`) clasifica la intención de la tarea sin inventar información (*alucinaciones*) y sin enviar datos personales a servidores de terceros.
3. **Disponibilidad offline:** El sistema funciona en una computadora sin conexión a internet, en un colectivo o en un aula sin señal.

### Bóveda de materiales en IndexedDB
Muchas veces la procrastinación comienza con una excusa operativa: «tengo que hacer el trabajo, pero primero tengo que buscar dónde descargué el apunte o cuál era el enlace de Drive». 
Despejá incorpora una bóveda lateral donde podés arrastrar archivos (PDFs, imágenes de enunciados, apuntes) y guardar enlaces directos asociados a cada espacio de trabajo. Se almacenan directamente en la base de datos IndexedDB del navegador, permitiendo guardar archivos grandes de forma persistente sin costo de servidor.

### Audio sintetizado con Web Audio API
Las confirmaciones auditivas no utilizan archivos MP3 ni recursos pesados de red. Los tonos de conmutación y los clicks mecánicos de los botones están sintetizados matemáticamente en tiempo real usando osciladores y curvas de ganancia nativas del navegador.

---

## Controles por teclado

La interfaz está optimizada para poder operarse completamente desde el teclado una vez que se ingresa al Modo Túnel:

| Tecla | Acción |
| --- | --- |
| Enter | Marcar el paso actual como hecho y avanzar al siguiente |
| S | Es demasiado (degrada el nivel de dificultad del paso) |
| D | Postergar la tarea para el final de la sesión |
| T | Activar o pausar el cronómetro de emergencia de 120 segundos |
| Ctrl + Enter | Procesar la descarga mental inicial desde el campo de texto |

---

## Estructura del repositorio

El proyecto no tiene dependencias externas, compiladores ni carpetas de paquetes infladas. Es código limpio que corre en cualquier navegador:

```text
despeja/
├── index.html        Arquitectura SPA: paneles de entrada, túnel, informe y modales
├── style.css         Sistema visual industrial táctil, variables y layout responsivo
├── app.js            Lógica heurística, motor IndexedDB, Web Audio y gestor de estados
└── README.md         Documentación técnica y fundamentos del proyecto
```

---

## Ejecución

1. Clonar el repositorio o descargar los archivos.
2. Abrir `index.html` en cualquier navegador web moderno (Chrome, Firefox, Edge, Safari).
3. No requiere instalación de Node.js, servidores locales ni configuración previa.
