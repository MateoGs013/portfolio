// Toggle claro/oscuro (Tinta) + revelado del enlace secreto Fanzine.
// El cambio de EDICION ya NO ocurre acá: es navegacion por ruta (los chips
// del selector pasan a ser <a href> — ver Topbar.astro). La edicion la fija
// la ruta via data-tema en <html> (server-side). Persistencia: ms-theme.

export function initTema(reduced: boolean): void {
  void reduced; // el toggle no depende de reduced; se conserva la firma comun
  const root = document.documentElement;

  /* ---- claro / oscuro ---- */
  const modeBtn = document.getElementById('mode-btn');
  const esOscuro = (): boolean => {
    const attr = root.getAttribute('data-theme');
    return attr ? attr === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  };
  modeBtn?.setAttribute('aria-pressed', String(esOscuro()));
  modeBtn?.addEventListener('click', () => {
    const next = esOscuro() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    modeBtn.setAttribute('aria-pressed', String(next === 'dark'));
    try {
      localStorage.setItem('ms-theme', next);
    } catch {}
  });

  /* ---- edicion secreta: revelar el chip/enlace Fanzine si ya se desbloqueo
     con el clicker (ms-fanzine) o si estamos parados en esa edicion ---- */
  const chipFanzine = document.querySelector<HTMLElement>('[data-tema-btn="fanzine"]');
  if (chipFanzine) {
    let libre = root.getAttribute('data-tema') === 'fanzine';
    try {
      libre = libre || localStorage.getItem('ms-fanzine') === '1';
    } catch {}
    chipFanzine.hidden = !libre;
  }
}
