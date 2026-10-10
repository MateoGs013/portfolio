// Componente Modal: HelpModal (AdmHelpModal)
// Guía de Asistencia Operativa para Curadores y Colaboradores (Invariante #4)

export const HelpModal = {
  name: 'AdmHelpModal',
  emits: ['close'],
  template: `
    <div
      class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="$emit('close')"
    >
      <div class="bg-[#121318] border border-white/15 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 class="text-sm font-bold text-white tracking-tight uppercase font-mono-code">
              Guía de Asistencia Operativa CMS 2026
            </h3>
            <p class="text-xs text-zinc-400 mt-0.5">
              Protocolo para cargar y curar contenido en menos de cinco minutos sin errores.
            </p>
          </div>
          <button
            type="button"
            @click="$emit('close')"
            class="text-zinc-400 hover:text-white text-xs cursor-pointer px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div class="space-y-4 text-xs text-zinc-300 leading-relaxed font-sans">
          <div class="p-3.5 bg-[#09090b] rounded-lg border border-white/10 space-y-1.5">
            <h4 class="font-bold text-white font-mono-code text-[11px] uppercase tracking-wider text-[#ff3e00]">
              1. Carga de Proyectos & Casos de Estudio
            </h4>
            <p>
              Completá el <strong>Título</strong> y el <strong>Slug</strong> se generará automáticamente sin espacios ni acentos. Asigná la <strong>Empresa</strong> cliente y seleccioná las tecnologías en los chips categorizados. En la pestaña de <em>Caso de Estudio</em>, redactá la síntesis ejecutiva (1 a 2 líneas concisas), el desafío técnico y los resultados obtenidos.
            </p>
          </div>

          <div class="p-3.5 bg-[#09090b] rounded-lg border border-white/10 space-y-1.5">
            <h4 class="font-bold text-white font-mono-code text-[11px] uppercase tracking-wider text-[#ff3e00]">
              2. Métricas de Impacto Cuantificables
            </h4>
            <p>
              Usá los <strong>presets rápidos</strong> (Lighthouse, Bundle Size, Deploy SLA) para añadir métricas verificables con un clic en lugar de escribir código. El sistema sincroniza automáticamente las claves y valores a formato estructurado.
            </p>
          </div>

          <div class="p-3.5 bg-[#09090b] rounded-lg border border-white/10 space-y-1.5">
            <h4 class="font-bold text-white font-mono-code text-[11px] uppercase tracking-wider text-[#ff3e00]">
              3. Multimedia & Roles de Portada
            </h4>
            <p>
              Arrastrá capturas en WebP, PNG o JPG (máximo 10MB). Definí cuál es la portada principal (<strong>COVER</strong>) y cuáles corresponden a la galería o capas interactivas.
            </p>
          </div>

          <div class="p-3.5 bg-[#09090b] rounded-lg border border-white/10 space-y-1.5">
            <h4 class="font-bold text-white font-mono-code text-[11px] uppercase tracking-wider text-[#ff3e00]">
              4. Atajos de Teclado Productivos
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono-code pt-1">
              <div><kbd class="bg-black/50 border border-white/10 px-1.5 py-0.5 rounded text-zinc-300">Ctrl + S</kbd> : Guardar cambios</div>
              <div><kbd class="bg-black/50 border border-white/10 px-1.5 py-0.5 rounded text-zinc-300">Ctrl + N</kbd> : Crear nuevo</div>
              <div><kbd class="bg-black/50 border border-white/10 px-1.5 py-0.5 rounded text-zinc-300">Ctrl + D</kbd> : Duplicar borrador</div>
              <div><kbd class="bg-black/50 border border-white/10 px-1.5 py-0.5 rounded text-zinc-300">Ctrl + K</kbd> : Command Palette</div>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2 border-t border-white/5">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-primary !h-[30px] !text-xs cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  `,
}
