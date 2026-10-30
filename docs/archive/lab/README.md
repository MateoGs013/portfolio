# Lab archivado

`/lab` y el visor de CV «Modern IDE» salieron del sitio público (Respuestas de Mateo, 30-oct-2026): `/lab` y sus alias redirigen a `/` con 301 y el CV de `/about` queda solo en Harvard ATS.

Lo que hay acá está fuera del build (Nuxt no lo escanea y ESLint ignora `docs/archive/**`):

- `ExplorerLab.vue`: la mesa de trabajo del lab.
- `ui/`: los 11 `Ui*` que solo usaba el lab.
- `CvModernIde.vue`: el visor de CV con estética de editor.
- `useBenchoSound.ts`: la síntesis de sonido que usaban esos componentes.

`ExplorerLab.vue` también importa `Ui*` que se borraron en F1 (`UiBorderBeam`, `UiClickSpark`, `UiCopyPill`, `UiCursorWorkList`, `UiDecryptedText`, `UiDotGlobe`, `UiRollingCounter`, `UiSegmentedSwitch`, `UiSharePill`, `UiSlideConfirm`, `UiThinkingTrace`). Para volver a montarlo, recuperarlos del historial de git con `git show a30e434:app/components/ui/<Nombre>.vue`.
