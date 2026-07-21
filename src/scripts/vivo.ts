// Marco vivo (DESIGN.md §4.4): el reloj del taller late en tiempo real.
// Un solo intervalo a nivel módulo — con view transitions initVivo() se
// llama en cada astro:page-load y el intervalo anterior se limpia.
let intervalo: number | undefined;

export function initVivo(): void {
  if (intervalo !== undefined) {
    clearInterval(intervalo);
    intervalo = undefined;
  }
  const relojes = document.querySelectorAll<HTMLElement>('[data-reloj]');
  if (!relojes.length) return;

  const fmt = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  const tick = () => {
    const hora = fmt.format(new Date());
    relojes.forEach((el) => {
      el.textContent = hora;
    });
  };
  tick();
  intervalo = window.setInterval(tick, 1000);
}
