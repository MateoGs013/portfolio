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

1. **Regla de Diseño 2026: Tailwind CSS First.** Toda la interfaz del panel de administración (`server/admin/`) se construye sobre clases utilitarias de **Tailwind CSS**. Queda prohibido escribir archivos CSS monolíticos y frágiles. Los estilos de origen residen en `server/admin/admin.src.css` y se compilan a `server/admin/admin.css` mediante `@tailwindcss/cli`.
2. **Cero emojis en toda la interfaz.** Prohibido terminantemente el uso de emojis (`🚀`, `💼`, `⭐`, `🔥`, `💡`, `🟢`, etc.) en títulos, botones, badges, modales o textos de ayuda. La seriedad y el pulido de una herramienta profesional 2026 se sostiene en tipografía rigurosa, contraste y micro-indicadores sobrios (dots geométricos y texto semántico).
3. **Iconos solo si son estrictamente utilitarios.** No usar iconografía decorativa. Un icono se justifica únicamente si acelera la comprensión o reemplaza una acción estándar (lupa de búsqueda, cruz de cerrar, flecha de navegación, más de agregar, basura de eliminar, enlace externo). Si el texto es suficiente, se usa texto.
4. **Operabilidad universal para asistentes.** Un asistente sin conocimientos de programación ni SQL debe poder cargar un proyecto, redactar un caso de estudio, asignar tecnologías y subir imágenes en menos de cinco minutos sin cometer errores de formato.
5. **Navegación ágil con Command Palette (`⌘K` / `Ctrl+K`).** La consola cuenta con un buscador modal accesible en cualquier momento para saltar directamente a proyectos, vacantes, secciones o acciones rápidas sin necesidad del mouse.
6. **Layout desktop elástico y robusto.** La estructura responde a un sistema flex y grid limpio:
   - Modo Dashboard: `grid-template-columns: 240px 1fr;` con contenedor centralizado y fluido.
   - Modo Colecciones: `grid-template-columns: 240px minmax(300px, 340px) 1fr;` donde el editor es una columna flex autónoma (`display: flex; flex-direction: column; height: 100%;`) con cabecera fija, scroll central y barra de acciones anclada al pie del contenedor.
7. **Coherencia con el explorador y modo Focus.** Un registro alimenta tanto la vista detallada de datos técnicos como el modo Focus (lectura limpia sin distracciones) y la ficha de perfil/CV. El editor debe explicar al operador el propósito de cada campo (`summary` sintetiza la tarjeta y vista rápida; `brief`, `outcome` y `steps` articulan el relato técnico y casos de estudio; `metrics` sustentan el impacto medible).
8. **Métricas sin fricción de código.** Las métricas técnicas de un proyecto (`metrics`) no pueden requerir que un asistente escriba JSON a mano. Se provee un editor visual clave-valor ("Métrica" / "Valor"), manteniendo un selector discreto a JSON plano solo para desarrolladores.
9. **Lenguaje claro y tranquilizador.** Los modales de confirmación y mensajes de error deben redactarse en español claro y empático. Prohibidos los tecnicismos intimidantes como *"mutación DELETE ACID irreversible"*.

---

## Anatomía de la Interfaz

Todo el panel vive en `server/admin/` (UI en Vue 3 global servida por Express) y habla con `/api/admin/*` con el `ADMIN_TOKEN`.

### 1. Cabecera Global (`header`)
- Altura fija de 52px (h-13).
- Identidad minimalista: monograma tipográfico `MS`, título `Mateo Sonzogni` y badge `CMS 2026`.
- Indicador de estado del sistema (`status-dot live` + `VPS Coolify · Conectado`).
- Command Palette trigger en el centro (`⌘K`).
- Accesos directos utilitarios: enlace a `Ver Portafolio`, botón `Guía Asistente` (modal de ayuda) y botón `Salir`.
- Toast de feedback integrado con micro-animaciones.

### 2. Barra Lateral de Navegación (`aside`)
- Ancho fijo de 240px (w-60).
- Agrupación por jerarquía funcional:
  - **Vista General:** `Panel Principal` (Dashboard).
  - **Contenido:** `Proyectos`, `Experiencia Laboral`, `Habilidades & Stack`, `Empresas & Clientes`, `Páginas & Textos`.
  - **Herramientas & IA:** `Job Hunter (Eros IA)`.
- Contadores numéricos en badges sobrios alineados a la derecha.

### 3. Explorador de Registros
- Se muestra en modo colecciones y Job Hunter; se oculta en el Dashboard.
- Buscador reactivo en tiempo real.
- Filtros rápidos por estado (`Todos`, `LIVE`, `WIP`, `Destacados`) mediante botones píldora neutros.
- Botón de acción principal destacado en la parte superior: `+ Nuevo`.
- Tarjetas de lista: título con elipsis, metadatos en una línea, `status-dot` de estado y badge tipográfico para proyectos destacados.

### 4. Lienzo del Editor Progresivo
- Contenedor flex vertical (`height: 100%; overflow: hidden;`).
- **Cabecera:** Breadcrumb legible, título del registro y selector de estado.
- **Pestañas lineales (Linear-style tabs):** Agrupación por momento de trabajo:
  - `Datos Básicos`: título con generador de slug, estado, rol, fechas, empresa y selector visual de tecnologías.
  - `Caso de Estudio & Textos`: resumen, reto y resultado con textos de ayuda editorial.
  - `Multimedia & Portada`: zona de carga (dropzone) con especificaciones de imagen, y cuadrícula de tarjetas con miniatura, texto Alt, selector de rol (`COVER`, `GALLERY`, `LAYER`) y lightbox.
  - `Métricas de Impacto`: editor visual clave-valor con sincronización automática a JSON.
  - `Tecnologías & Enlaces`: selector de chips de stack y URLs públicas/repo.
  - `Enlaces & Pasos`: lista de enlaces directos y pasos secuenciales del proceso.
- **Barra de Acciones Inferior:**
  - Anclada al pie del editor dentro del flujo flex.
  - Atajo visible (`Ctrl + S`), estado de guardado, botón `Descartar`, botón destructivo `Eliminar` y botón principal `Guardar Cambios`.

### 5. Job Hunter (Centro de Oportunidades IA)
- Cuatro métricas ejecutivas: Total vacantes, Match ≥ 70%, Postuladas, Descartadas.
- Botón de escaneo con spinner de actividad y sincronización con portales tech.
- Detalle de vacante: medidor de compatibilidad por color semántico, enlace original, generador de pitch con Gemini y botón con feedback de copia inmediata.
- Generador de CV adaptado Harvard ATS: reestructura y prioriza habilidades, proyectos y logros para la vacante seleccionada, con vista previa formateada en B&W, descarga/impresión A4 y exportación en texto plano ATS.

---

## Defaults a Evitar

- **Cosplay de terminal / hacker OS:** Luces de semáforo de macOS, texto verde flúor, prompts falsos (`root@portfolio:`).
- **Emojis decorativos:** Cohetes, maletines, estrellas, herramientas. El estándar 2026 es tipográfico y sobrio.
- **Hojas de estilo monolíticas gigantescas:** Escribir CSS manual sin Tailwind genera duplicación y deuda técnica.
- **Formularios monolíticos sin pestañas:** Forzar al usuario a scrollear 20 campos técnicos continuos agota la atención.
