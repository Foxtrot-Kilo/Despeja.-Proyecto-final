# Despejá — Herramienta contra el Bloqueo Mental y la Parálisis de Tareas 🧠⚡

Aplicación web interactiva desarrollada como proyecto final. Diseñada para combatir la disfunción ejecutiva, el agobio cognitivo y la procrastinación mediante micro-pasos deterministas y el modo túnel.

---

## 🎯 El Problema que Resuelve

Las aplicaciones tradicionales de productividad (To-Do lists, Trello, Notion) fallan cuando una persona experimenta **parálisis de tareas**:
1. **Sobrecarga visual:** Ver una lista de 10 pendientes activa la respuesta de estrés y parálisis.
2. **Primer paso indefinido:** Tareas como *"Hacer el TP de historia"* o *"Estudiar para el parcial"* son demasiado abstractas para un cerebro fatigado.
3. **Frases condescendientes:** Los mensajes de "positividad tóxica" habituales en apps y bots de IA a menudo generan rechazo cuando alguien está saturado.

**Despejá** aborda esto desde la psicología cognitiva y la interfaz minimalista:
* **Sin frases artificiales ni sermones:** Tono seco, sobrio y puramente funcional.
* **Modo Túnel (Tunnel Vision):** La pantalla muestra **una única acción concreta** a la vez. El resto de las tareas queda completamente oculto.
* **Degradación interactiva de fricción:** Si un paso resulta abrumador, el botón *"Es demasiado"* reduce el esfuerzo a un nano-paso de 30 segundos.

---

## ⚙️ Cómo Funciona (100% JavaScript Nativo, Sin IA)

La aplicación no depende de APIs externas de pago ni modelos de lenguaje propensos a alucinaciones. Utiliza heurística y lógica limpia en el cliente:

1. **Parser de Descarga Mental (Brain Dump):**  
   El usuario vuelca sus pensamientos en bloque. Una expresión regular (`/[,;\n]|\s+y\s+|\s+e\s+/gi`) segmenta el texto en tareas independientes.
2. **Detección Heurística de Tipo:**  
   Analiza raíces morfológicas en español (`estudi*`, `escrib*`, `limpi*`, `respond*`, `compr*`) para clasificar la tarea en:
   * Mensajes y comunicación
   * Escritura y redacción de trabajos
   * Lectura y estudio
   * Orden y espacio físico
   * Trámites y gestiones
   * Tareas generales
3. **Plantillas Progresivas de Nano-Pasos:**  
   Asigna pasos de menor a mayor resistencia.
4. **Mecanismo de Desescalada (Fallback & Emergency):**  
   Al presionar *"Es demasiado"*, el paso se degrada (Nivel 0 $\rightarrow$ Nivel 1 $\rightarrow$ Nivel 2). En el nivel mínimo se activa un temporizador de 2 minutos bajo la regla: *"Si a los 2 minutos querés dejarlo, cerrás sin culpa"*.
5. **Síntesis de Audio con Web Audio API:**  
   Feedback sonoro sutil sintetizado matemáticamente en el navegador (sin archivos MP3 externos).
6. **Persistencia Local:**  
   Guarda y restaura el estado en `localStorage` ante cierres accidentales.

---

## 🛠 Stack Tecnológico

* **HTML5:** Semántica limpia con arquitectura SPA (Single Page Application) sin recarga.
* **CSS3:** Tema oscuro sobrio, variables CSS, tipografía (*Inter* y *Space Grotesk*), animaciones de respiración y diseño responsivo.
* **Vanilla JavaScript:** Manipulación del DOM, lógica de estados, Web Audio API, escuchadores de teclado (`Enter`, `S`, `D`, `T`).

---

## ⌨️ Atajos de Teclado (Modo Túnel)

| Tecla | Acción |
| :--- | :--- |
| <kbd>Enter</kbd> | Marcar paso/tarea como **Listo** |
| <kbd>S</kbd> | **Simplificar** (*Es demasiado*) |
| <kbd>D</kbd> | Postergar para **Después** |
| <kbd>T</kbd> | Activar / pausar **Timer de 2 min** |
| <kbd>Esc</kbd> | Volver a la pantalla de inicio |

---

## 🚀 Despliegue

El proyecto no requiere backend ni compilación. Puede ejecutarse abriendo directamente `index.html` en el navegador o desplegarse en **GitHub Pages** / **Vercel** en un clic.
