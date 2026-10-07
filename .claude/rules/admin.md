---
paths:
  - "server/admin/**"
  - "server/src/admin/**"
---

# Admin y Consola de Gestión (CMS)

El panel de administración (`/admin`) es la mesa de trabajo interna del portafolio. No es una pieza de exhibición para el visitante público ni un cosplay de terminal: es la herramienta con la que Mateo y cualquier asistente o colaborador crean, curan y mantienen el contenido que alimenta el portafolio (explorador técnico, modo Focus/Hiperfoco y ficha de perfil), además de operar el agente autónomo de búsqueda laboral (**Job Hunter**) con generación de propuestas y CV Harvard ATS.

---

## Invariantes del Admin

Si se violan, la herramienta pierde su propósito.

1. **Cero emojis en toda la interfaz.** Prohibido terminantemente el uso de emojis (`🚀`, `💼`, `⭐`, `🔥`, `💡`, `🟢`, etc.) en títulos, botones, badges, modales o textos de ayuda. La seriedad y el pulido de una herramienta profesional 2026 se sostiene en tipografía rigurosa, contraste y micro-indicadores sobrios (dots geométricos y texto semántico).
2. **Iconos solo si son estrictamente utilitarios.** No usar iconografía decorativa. Un icono se justifica únicamente si acelera la comprensión o reemplaza una acción estándar (lupa de búsqueda, cruz de cerrar, flecha de navegación, más de agregar, basura de eliminar, enlace externo). Si el texto es suficiente, se usa texto.
3. **Operabilidad universal para asistentes.** Un asistente sin conocimientos de programación ni SQL debe poder cargar un proyecto, redactar un caso de estudio, asignar tecnologías y subir imágenes en menos de cinco minutos sin cometer errores de formato.
4. **Layout desktop elástico y robusto.** Prohibido el uso de footers con anchos fijos hardcodeados (`calc(100% - 560px)`). La estructura debe responder a un sistema flex y grid limpio:
   - Modo Dashboard: `grid-template-columns: 240px 1fr;` con contenedor centralizado y fluido.
   - Modo Colecciones: `grid-template-columns: 240px minmax(300px, 340px) 1fr;` donde el editor es una columna flex autónoma (`display: flex; flex-direction: column; height: 100%;`) con cabecera fija, scroll central y barra de acciones anclada al pie del contenedor.
5. **Coherencia con el explorador y modo Focus.** Un registro alimenta tanto la vista detallada de datos técnicos como el modo Focus (lectura limpia sin distracciones) y la ficha de perfil/CV. El editor debe explicar al operador el propósito de cada campo (`summary` sintetiza la tarjeta y vista rápida; `brief`, `outcome` y `steps` articulan el relato técnico y casos de estudio; `metrics` sustentan el impacto medible).
6. **Métricas sin fricción de código.** Las métricas técnicas de un proyecto (`metrics`) no pueden requerir que un asistente escriba JSON a mano. Se provee un editor visual clave-valor ("Métrica" / "Valor"), manteniendo un selector discreto a JSON plano solo para desarrolladores.
7. **Lenguaje claro y tranquilizador.** Los modales de confirmación y mensajes de error deben redactarse en español claro y empático. Prohibidos los tecnicismos intimidantes como *"mutación DELETE ACID irreversible"*.

---

## Anatomía de la Interfaz

Todo el panel vive en `server/admin/` (UI en Vue 3 global sin build) y habla con `/api/admin/*` con el `ADMIN_TOKEN`.

### 1. Cabecera Global (`header.top`)
- Altura fija de 52px.
- Identidad minimalista: monograma tipográfico `MS`, título `Mateo Sonzogni` y badge `CMS`.
- Indicador de estado del sistema (`dot` verde de 6px + `Sistema Conectado`).
- Accesos directos utilitarios: enlace a `Ver Portafolio` (pestaña nueva), botón `Guía Asistente` (modal de ayuda) y botón `Salir`.
- Toast de feedback integrado con animación sutil.

### 2. Barra Lateral de Navegación (`aside.models-sidebar`)
- Ancho fijo de 240px.
- Agrupación por jerarquía funcional:
  - **Vista General:** `Panel Principal` (Dashboard).
  - **Contenido:** `Proyectos`, `Experiencia Laboral`, `Habilidades & Stack`, `Empresas & Clientes`, `Páginas & Textos`.
  - **Herramientas & IA:** `Job Hunter (IA)`.
- Contadores numéricos en badges sobrios alineados a la derecha.

### 3. Explorador de Registros (`section.records-list`)
- Se muestra en modo colecciones y Job Hunter; se oculta en el Dashboard.
- Buscador reactivo en tiempo real con icono de lupa.
- Filtros rápidos por estado (`Todos`, `LIVE`, `WIP`, `Destacados`, `Archivados`) mediante botones píldora neutros.
- Botón de acción principal destacado en la parte superior: `+ Nuevo [Modelo]`.
- Tarjetas de lista: título con elipsis, metadatos en una línea, `dot` de estado y badge tipográfico para proyectos destacados.

### 4. Lienzo del Editor (`section.editor-wrap`)
- Contenedor flex vertical (`height: 100%; overflow: hidden;`).
- **Cabecera:** Breadcrumb legible, título del registro y selector o badge de estado.
- **Pestañas lineales (Linear-style tabs):** Agrupación por momento de trabajo:
  - `Datos Básicos`: título con generador de slug, estado, rol, fechas, empresa y selector visual de tecnologías.
  - `Historia y Textos`: resumen, reto y resultado con textos de ayuda editorial.
  - `Galería Multimedia`: zona de carga (dropzone) con especificaciones de imagen, y cuadrícula de tarjetas con miniatura, texto Alt, selector de rol (`COVER`, `GALLERY`, `LAYER`) y lightbox.
  - `Enlaces y Pasos`: lista de enlaces directos y pasos secuenciales del proceso con imagen vinculada.
  - `Métricas de Impacto`: editor visual clave-valor con sincronización automática a JSON.
- **Barra de Acciones Inferior (`footer.actions-footer`):**
  - Anclada al pie del editor dentro del flujo flex.
  - Atajo visible (`Ctrl + S`), estado de guardado, botón `Cancelar`, botón destructivo `Eliminar` y botón principal `Guardar Cambios`.

### 5. Job Hunter (Centro de Oportunidades IA)
- Cuatro métricas ejecutivas: Total vacantes, Match ≥ 70%, Postuladas, Descartadas.
- Botón de escaneo con spinner de actividad y sincronización con portales tech.
- Detalle de vacante: medidor de compatibilidad por color semántico, enlace original, generador de pitch con Gemini y botón con feedback de copia inmediata.
- Generador de CV adaptado Harvard ATS: reestructura y prioriza habilidades, proyectos y logros para la vacante seleccionada, con vista previa formateada, descarga/impresión A4 y exportación en texto plano ATS.

---

## Defaults a Evitar

- **Cosplay de terminal / hacker OS:** Luces de semáforo de macOS, texto verde flúor, prompts falsos (`root@portfolio:`), referencias a motores ACID o telemetría de satélite. Es pretencioso e intimida al usuario.
- **Emojis decorativos:** Cohetes, maletines, estrellas, herramientas, chispas. El estándar 2026 es tipográfico, limpio y sobrio.
- **Formularios monolíticos sin pestañas:** Forzar al usuario a scrollear 20 campos técnicos continuos agota la atención.
- **Anchos rígidos o cálculos con píxeles fijos:** Rompen la vista en pantallas 2K, 4K o laptops de 13 pulgadas.
- **Falta de feedback visual:** Cada guardado, copia o eliminación debe reflejarse en un toast claro y un estado visual inmediato.
