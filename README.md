# ⌖ DESPEJÁ // Consola de Descompresión Mental

> **"Cuando tenés la cabeza quemada y 10 cosas por hacer, una lista de tareas no te ayuda: te paraliza."**

Hice este proyecto porque me pasa todo el tiempo. Te sentás a estudiar o a laburar, el cerebro ve una montaña de pendientes (*el TP de química, el mail al profe, ordenar el escritorio, estudiar para el parcial*), se dispara el agobio y terminás scrolleando el celular cuatro horas sintiéndote culpable.

La mayoría de las apps de productividad (Notion, Todoist, Trello) están pensadas para cuando ya estás motivado. Y los bots de IA actuales te tiran frases de autoayuda que dan más ganas de revolear la computadora que de ponerte a hacer algo. 

**Despejá** nació para resolver el momento exacto donde se produce el bloqueo: **el primer movimiento.**

---

## ⚡ ¿Por qué funciona? (La filosofía detrás)

### 1. Cero positividad tóxica, cero sermones
No hay un muñequito felicitándote ni frases tipo *"¡Vos podés, campeón! ✨🌱"*. La consola tiene un tono seco, sobrio y puramente funcional. Como el tablero de un auto o una herramienta de taller.

### 2. Modo Túnel (Tunnel Vision radical)
El cerebro humano en estrés no puede jerarquizar. Si le mostrás 10 tareas juntas, la amígdala lo interpreta como amenaza difusa y activa la respuesta de congelamiento (*freeze*).  
En el Túnel ves **una sola acción concreta a la vez**. Todo el resto de la pantalla y de tus problemas queda bloqueado hasta que termines o decidas qué hacer con esa.

### 3. El botón «Es demasiado» (Desescalada sin culpa)
Si la tarea es *"Escribir el informe de historia"*, el cerebro se resiste. Al tocar **«Es demasiado»**, el sistema baja la palanca:
* *Nivel 1:* Abrí un archivo en blanco y ponele nombre.
* *Nivel 2:* Escribí dos oraciones horribles sin mirar la ortografía.
* *Nivel 3 (Acción mínima):* Poné las manos en el teclado y quedate 2 minutos frente a la pantalla. Nada más.

### 4. Cláusula de rescisión de los 2 minutos
Si tocás fondo, se activa un cronómetro de 120 segundos con una regla innegociable: **si pasan los dos minutos y todavía querés mandar todo al diablo, tenés autorización total para cerrar la pestaña sin culpa.** En el 85% de los casos, romper la inercia del primer minuto alcanza para seguir de largo.

---

## 🛠 Hecho con JavaScript puro, sin humo de IA

Hoy parece que si una app no le hace una consulta a ChatGPT no sirve. Yo quise demostrar lo contrario:
* **¿Por qué sin IA?** Porque para desarmar un bloqueo mental no necesitás un modelo de lenguaje de 70 mil millones de parámetros que tarde 4 segundos en responder y te invente cosas. Necesitás inmediatez absoluta (0 milisegundos de latencia) y que funcione incluso sin conexión a internet.
* **Parser heurístico:** Detecta raíces lingüísticas en español (`estudi*`, `escrib*`, `limpi*`, `respond*`, `compr*`) y clasifica al instante la naturaleza del bloqueo para aplicar la receta de acción adecuada.
* **Bóveda local con IndexedDB:** Muchas veces la procrastinación empieza buscando el archivo: *"¿dónde guardé el apunte?", "¿cuál era el link de Drive?"*. Podés arrastrar PDFs, capturas o pegar links directo a cada espacio de trabajo. Se guardan en la base de datos interna de tu navegador, sin servidores intermedios y sin subir tus cosas a la nube de nadie.
* **Audio analógico con Web Audio API:** Los clicks mecánicos de confirmación y los tonos de relay están sintetizados matemáticamente onda por onda en el navegador. Cero archivos `.mp3` pesados.

---

## 🎮 Controles y atajos de teclado

La interfaz fue diseñada como una consola física (inspirada en la estética industrial de Dieter Rams y los sintetizadores de Teenage Engineering). Podés usarla 100% con el teclado:

| Tecla | Función en la Consola |
| :---: | :--- |
| <kbd>Enter</kbd> | **HECHO** — Marca el paso cumplido y avanza por inercia. |
| <kbd>S</kbd> | **ES DEMASIADO** — Reduce la fricción al nivel inmediato inferior. |
| <kbd>D</kbd> | **POSTERGAR** — Manda la tarea al fondo de la cola sin juzgarte. |
| <kbd>T</kbd> | **CRONÓMETRO** — Dispara el timer de emergencia de 120 segundos. |
| <kbd>Ctrl + Enter</kbd> | Procesa el volcamiento inicial (*Brain Dump*). |

---

## 📂 Estructura del código

Sin dependencias externas, sin `node_modules` de 500 MB, sin frameworks inflados:

```text
despeja/
│
├── index.html        # Arquitectura semántica SPA de 3 paneles + Bóveda + Modales
├── style.css         # Sistema de diseño de consola industrial táctil
├── app.js            # Motor heurístico, IndexedDB, Web Audio API y state machine
└── README.md         # Manifiesto y documentación del proyecto
```

---

## 🚀 Cómo probarlo

Abrí directamente `index.html` con cualquier navegador moderno o probalo online en Vercel / GitHub Pages. No hace falta instalar nada.
