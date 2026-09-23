(() => {
  const film = document.querySelector('.film');
  const sticky = document.querySelector('.film__sticky');
  const intro = document.querySelector('.film__intro');
  const cards = [...document.querySelectorAll('.story-card')];
  const percentage = document.querySelector('.film__percentage');
  const hint = document.querySelector('.film__scroll-hint');
  const comparison = document.querySelector('.comparison');
  const slider = document.querySelector('#comparison-slider');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let ticking = false;
  let activeStep = -1;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function updateFilm() {
    ticking = false;
    const scrollLength = film.offsetHeight - sticky.offsetHeight;
    const progress = clamp(-film.getBoundingClientRect().top / Math.max(1, scrollLength), 0, 1);
    const reveal = reducedMotion.matches ? (progress > .47 ? 100 : 0) : clamp((progress - .17) / .72 * 100, 0, 100);
    sticky.style.setProperty('--progress', `${Math.round(progress * 100)}%`);
    sticky.style.setProperty('--reveal', `${reveal.toFixed(2)}%`);
    sticky.style.setProperty('--zoom', (1.03 + progress * .045).toFixed(3));
    sticky.style.setProperty('--beam-opacity', String(clamp((progress - .14) * 12, 0, 1)));
    percentage.textContent = `${String(Math.round(reveal)).padStart(2, '0')}%`;
    intro.classList.toggle('is-hidden', progress > .095);
    hint.classList.toggle('is-hidden', progress > .045);

    const step = progress < .11 ? -1 : Math.min(3, Math.floor((progress - .11) / .225));
    if (step !== activeStep) {
      cards.forEach((card, index) => card.classList.toggle('is-active', index === step));
      activeStep = step;
    }
  }

  function requestFilmUpdate() {
    if (!ticking) { ticking = true; requestAnimationFrame(updateFilm); }
  }

  function updateComparison() {
    const value = Number(slider.value);
    comparison.style.setProperty('--comparison', `${value}%`);
    slider.setAttribute('aria-valuetext', `${value} percent of restored yacht revealed`);
  }

  slider.addEventListener('input', updateComparison);
  window.addEventListener('scroll', requestFilmUpdate, { passive: true });
  window.addEventListener('resize', requestFilmUpdate, { passive: true });
  reducedMotion.addEventListener?.('change', requestFilmUpdate);
  document.querySelector('#year').textContent = String(new Date().getFullYear());
  updateComparison();
  updateFilm();
})();
