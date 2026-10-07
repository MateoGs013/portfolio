# Documento de Arquitectura y Estándares: Panel de Administración 2026

Este documento establece la visión técnica, el diseño de interacción (UX/UI) y las directrices operativas del panel de administración propio (`/admin`) del portafolio. Sirve como referencia estructural obligatoria para Mateo y cualquier colaborador o agente de IA que trabaje sobre este módulo.

---

## 1. La Tesis del Admin

El portafolio se fundamenta en un modelo de contenido único y relacional: **un solo modelo relacional servido sobre PostgreSQL 17 que alimenta el explorador interactivo, el modo Focus/Hiperfoco y las representaciones de perfil profesional**. Cero duplicación.

El panel de administración es el **taller de trastienda** donde ese modelo se gestiona y enriquece:
1. **Fuente de verdad unificada:** Cada proyecto, experiencia laboral, tecnología o documento se redacta una sola vez. No existen silos fragmentados.
2. **Coherencia con las vistas del sitio:**
   - Campos como `summary`, `year`, `role`, `status` y `metrics` alimentan las fichas técnicas y tablas de datos estructurados.
   - Campos como `brief`, `outcome`, `steps` y la galería multimedia detallan la narrativa en profundidad y los casos de estudio.
   - En el **Modo Focus / Hiperfoco**, la interfaz pública filtra los elementos ornamentales para permitir una lectura fluida, veloz y directa del contenido aquí administrado.
3. **Herramienta operativa, no juguete decorativo:** El panel no compite con la estética pública del portafolio. Su virtud radica en la **claridad ergonómica, la velocidad de carga y la tolerancia a errores de usuario**.

---

## 2. Perfiles de Usuario (User Personas)

El diseño del panel debe satisfacer a dos usuarios muy distintos con la misma interfaz:

### Perfil A: Mateo Sonzogni (Autor & Ingeniero)
- **Objetivos:** Publicar casos de estudio, mantener al día el stack tecnológico, validar métricas reales de performance (LCP, bundles) y auditar ofertas de trabajo del agente Eros.
- **Necesidades:** Atajos de teclado rápidos (`Ctrl + S`, `Esc`), acceso directo a URLs y repositorios, opción de inspección de JSON en modo avanzado y feedback técnico inmediato.

### Perfil B: Asistente Operativo / Curador de Contenido
- **Objetivos:** Cargar nuevos proyectos asignados, redactar notas breves, subir imágenes de capturas, enlazar tecnologías y generar propuestas para vacantes de empleo.
- **Fricciones a eliminar:** Desconocimiento de SQL, Prisma, tipos TypeScript o sintaxis JSON. No debe verse forzado a adivinar qué es un `slug` ni a lidiar con tablas rígidas sin previsualización de imágenes.
- **Garantías requeridas:** Textos de ayuda explicativos en cada campo, sugerencia automática de slugs a partir del título, editor visual de métricas (clave-valor) y mensajes de confirmación comprensibles.

---

## 3. Principios de Diseño UX/UI (Estándares 2026)

Inspirado en los mejores patrones de **Linear, Vercel Dashboard, Supabase Studio y Sanity Studio**:

### 3.1. Cero Emojis y Minimalismo Tipográfico
- Los emojis (`🚀`, `💼`, `⭐`, `🔥`, `💡`, `🟢`, etc.) degradan la percepción de una herramienta profesional y generan inconsistencias visuales según el sistema operativo.
- La jerarquía se construye con tipografía moderna (**Plus Jakarta Sans** para interfaz y **JetBrains Mono** para código e identificadores), pesos equilibrados (400, 500, 600, 700) y micro-indicadores geométricos (`dots` de estado de 6px).

### 3.2. Iconografía Estrictamente Utilitaria
- Se prohíbe la iconografía ornamental.
- Solo se emplean iconos SVG de trazo fino cuando cumplen una función operativa inequívoca:
  - Lupa: campo de búsqueda interactivo.
  - Más (+): añadir fila, métrica o registro.
  - Basura / Cruz: eliminar o cancelar.
  - Flecha diagonal exterior: abrir enlace en nueva pestaña.
  - Ojo: revelar / ocultar clave de acceso en el login.

### 3.3. Ergonomía Desktop y Layout Elástico
- **Arquitectura de dos estados de rejilla:**
  - **Estado Dashboard:** La rejilla adopta `240px 1fr`, permitiendo que el lienzo principal ocupe todo el ancho disponible con un contenedor central de hasta `1200px`. Esto elimina el error histórico donde el Dashboard se aplastaba a 320px.
  - **Estado Explorador / Colecciones:** La rejilla adopta `240px 340px 1fr`, distribuyendo armónicamente la navegación lateral, el listado de registros y el editor detallado.
- **Editor en contenedor Flex nativo:**
  - El editor (`.editor-wrap`) funciona como una columna flex con `height: 100%`.
  - La cabecera permanece fija arriba.
  - El cuerpo del formulario scrolle verticalmente de forma independiente.
  - La barra de acciones (`.actions-footer`) está anclada al pie del editor dentro del flujo flex natural, erradicando posicionamientos `fixed` con cálculos de píxeles mágicos que desbordan pantallas panorámicas.

### 3.4. Revelación Progresiva (Progressive Disclosure)
- En lugar de presentar un formulario infinito de 25 campos verticales, el editor divide el trabajo en pestañas lógicas:
  1. **Datos Básicos:** Identidad, título, slug, estado, rol, empresa y tecnologías.
  2. **Historia y Textos:** Síntesis ejecutiva, reto y resultado con pautas editoriales breves.
  3. **Galería Multimedia:** Carga visual arrastrable, asignación de roles de imagen y previsualizador a pantalla completa (lightbox).
  4. **Enlaces y Pasos:** Enlaces a demostraciones y pasos numerados del caso de estudio.
  5. **Métricas de Impacto:** Editor visual para métricas de negocio o técnicas con opción de modo avanzado en JSON.

---

## 4. Módulos del Sistema

### 4.1. Panel Principal (Dashboard)
- Ofrece una lectura ejecutiva en menos de tres segundos: cantidad de proyectos en vivo, puestos de experiencia, herramientas en el stack y ofertas laborales destacadas detectadas por IA.
- Accesos directos de un clic para crear nuevos registros o revisar el sitio público.
- Modal de **Guía para Asistentes** accesible desde la cabecera en todo momento.

### 4.2. Gestor de Casos de Estudio (Proyectos)
- **Generador de Slugs:** Convierte títulos en identificadores limpios para URL en minúsculas y sin acentos.
- **Selector de Tecnologías:** Buscador reactivo y chips interactivos con contraste accesible.
- **Galería Multimedia:** Vista previa de capturas en cuadrícula, identificación clara de portada (`COVER`) y edición de texto alternativo (`Alt`) para accesibilidad y SEO.

### 4.3. Agente de Búsqueda Laboral (Job Hunter AI)
- Panel de reclutamiento inteligente que rastrea vacantes de tecnología (Get on Board, RemoteOK, Hacker News).
- Evaluación automática con Gemini: veredicto, cálculo de coincidencia porcentual, análisis de fortalezas y detección de requisitos faltantes.
- Redacción automatizada de cartas de presentación y pitch adaptados a la vacante con copia instantánea.
- **Generador de CV Adaptado (Estándar Harvard ATS):** Adaptación y priorización inteligente del currículum con respecto a la vacante seleccionada, renderizado en formato estructurado estándar ATS, previsualización en el panel, descarga/impresión A4 en documento limpio de una sola página y exportación a texto plano.
- Seguimiento de estados (`guardado` → `postulado` → `descartado`).

---

## 5. Criterios de Aceptación (Checklist de Calidad)

Antes de dar por finalizada cualquier modificación en el módulo del admin:

- [ ] **Sin emojis:** Ninguna pantalla, botón, texto de ayuda o notificación contiene emojis.
- [ ] **Iconografía mínima:** No hay iconos meramente decorativos.
- [ ] **Layout desktop comprobado:** El Dashboard ocupa el ancho completo y el editor tiene barra de acciones anclada limpiamente sin desbordes.
- [ ] **Responsive validado:** El panel es utilizable en laptops (1366x768), monitores estándar (1080p) y pantallas anchas (1440p+).
- [ ] **Accesibilidad:** Contraste de texto conforme a WCAG AA, soporte de atajos de teclado (`Ctrl + S`, `Esc`) y foco visible en todos los campos.
- [ ] **Verificación de código:** `pnpm lint` y `pnpm typecheck` pasan con cero errores.
