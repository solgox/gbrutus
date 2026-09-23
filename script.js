(() => {
  const experience = document.querySelector('.experience');
  const sticky = document.querySelector('.experience__sticky');
  const shots = ['wide', 'damage', 'repair', 'polish', 'launch'].map(name => document.querySelector('.shot--' + name));
  const wipe = document.querySelector('.shot__wipe');
  const scan = document.querySelector('.camera__scan');
  const flare = document.querySelector('.camera__flare');
  const fill = document.querySelector('.hud__fill');
  const percent = document.querySelector('.hud__percent');
  const cue = document.querySelector('.experience__scroll');
  const chapters = [...document.querySelectorAll('.chapter')];
  const jumps = [...document.querySelectorAll('[data-jump]')];
  const comparison = document.querySelector('.comparison');
  const slider = document.querySelector('#comparison-slider');
  const canvas = document.querySelector('.atmosphere');
  const context = canvas.getContext('2d', { alpha: true });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const centers = [.04, .255, .435, .615, .805, .965];
  const boundaries = [0, .175, .365, .545, .735, .915, 1.001];
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const fade = (p, a, b) => smooth((p - a) / (b - a));
  const pulse = (p, a, b, c, d) => fade(p, a, b) * (1 - fade(p, c, d));
  let progress = 0;
  let currentChapter = -1;
  let visible = true;
  let pending = false;
  let canvasWidth = 0, canvasHeight = 0, specks = [], previousFrame = 0;

  function position(shot, opacity, x, y, angle, scale) {
    shot.style.opacity = opacity.toFixed(3);
    shot.style.transform = reducedMotion.matches ? '' :
      `translate3d(${x.toFixed(2)}%,${y.toFixed(2)}%,0) rotateY(${angle.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
  }

  function render() {
    pending = false;
    const bounds = experience.getBoundingClientRect();
    const distance = Math.max(1, experience.offsetHeight - sticky.offsetHeight);
    progress = clamp(-bounds.top / distance);
    visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
    const opening = 1 - fade(progress, .17, .235);
    const returnShot = fade(progress, .70, .77) * (1 - fade(progress, .89, .955));
    const damage = pulse(progress, .17, .235, .34, .405);
    const repair = pulse(progress, .34, .405, .52, .585);
    const polish = pulse(progress, .52, .585, .70, .77);
    const launch = fade(progress, .89, .955);
    const depth = window.innerWidth <= 700 ? .45 : 1;
    position(shots[0], Math.max(opening, returnShot), -progress * 1.5 * depth, -.4 * depth, (progress < .7 ? -3 + progress * 13 : 2) * depth, 1.025 + progress * .055 * depth);
    position(shots[1], damage, (-3 + fade(progress, .17, .405) * 7) * depth, depth, (-5 + fade(progress, .17, .405) * 7) * depth, 1.06 + fade(progress, .17, .405) * .06 * depth);
    position(shots[2], repair, (-2 + fade(progress, .34, .585) * 5) * depth, -.5 * depth, (3 - fade(progress, .34, .585) * 6) * depth, 1.05 + fade(progress, .34, .585) * .055 * depth);
    position(shots[3], polish, (2 - fade(progress, .52, .77) * 5) * depth, .5 * depth, (-3 + fade(progress, .52, .77) * 6) * depth, 1.04 + fade(progress, .52, .77) * .05 * depth);
    position(shots[4], launch, (-2 + fade(progress, .89, 1) * 3) * depth, 0, (-2 + fade(progress, .89, 1) * 3) * depth, 1.095 - fade(progress, .89, 1) * .08 * depth);
    const revealed = smooth((progress - .76) / .125) * 100;
    shots[0].style.setProperty('--wipe', `${revealed.toFixed(2)}%`);
    wipe.style.opacity = (returnShot * pulse(progress, .75, .78, .875, .91)).toFixed(3);
    scan.style.opacity = (damage * .85).toFixed(3);
    scan.style.setProperty('--scan-position', `${(17 + fade(progress, .19, .39) * 67).toFixed(1)}%`);
    flare.style.opacity = clamp(polish * .8 + returnShot * .3).toFixed(3);
    fill.style.height = `${(progress * 100).toFixed(1)}%`;
    percent.textContent = `${String(Math.round(progress * 100)).padStart(2, '0')}%`;
    cue.style.opacity = (1 - fade(progress, .015, .055)).toFixed(3);
    let active = 0;
    for (let i = 1; i < boundaries.length - 1; i++) if (progress >= boundaries[i]) active = i;
    chapters.forEach((chapter, index) => {
      const opacity = (index === 0 ? 1 : fade(progress, boundaries[index] - .025, boundaries[index] + .02)) *
        (index === chapters.length - 1 ? 1 : 1 - fade(progress, boundaries[index + 1] - .025, boundaries[index + 1] + .02));
      chapter.style.opacity = opacity.toFixed(3);
      chapter.style.transform = reducedMotion.matches ? '' : `translate3d(0,${((1 - opacity) * 24).toFixed(1)}px,0)`;
      chapter.classList.toggle('is-visible', index === active);
      chapter.inert = index !== active;
    });
    if (active !== currentChapter) {
      jumps.forEach((jump, index) => {
        jump.classList.toggle('is-current', active === index);
        if (active === index) jump.setAttribute('aria-current', 'step');
        else jump.removeAttribute('aria-current');
      });
      currentChapter = active;
    }
  }

  function requestRender() {
    if (!pending) { pending = true; requestAnimationFrame(render); }
  }
  jumps.forEach(jump => jump.addEventListener('click', () => {
    const top = window.scrollY + experience.getBoundingClientRect().top;
    const distance = experience.offsetHeight - sticky.offsetHeight;
    window.scrollTo({ top: top + centers[Number(jump.dataset.jump)] * distance, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }));
  function updateComparison() {
    const value = clamp(Number(slider.value) / 100) * 100;
    comparison.style.setProperty('--comparison', `${value}%`);
    slider.setAttribute('aria-valuetext', `${value} percent of restored yacht revealed`);
  }
  function resizeAtmosphere() {
    if (!context) return;
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvasWidth = bounds.width;
    canvasHeight = bounds.height;
    canvas.width = Math.round(canvasWidth * ratio);
    canvas.height = Math.round(canvasHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    let seed = 713;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    specks = Array.from({ length: window.innerWidth <= 700 ? 21 : 49 }, () =>
      ({ x: random(), y: random(), depth: .25 + random() * .75, phase: random() * Math.PI * 2, radius: .45 + random() * 1.15 }));
  }
  function paint(time) {
    requestAnimationFrame(paint);
    if (!context || !visible || reducedMotion.matches || time - previousFrame < 32) return;
    previousFrame = time;
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    for (const point of specks) {
      const x = (point.x * canvasWidth + Math.sin(time * .00015 + point.phase) * 12 - progress * 85 * point.depth + canvasWidth) % canvasWidth;
      const y = (point.y * canvasHeight + Math.cos(time * .00022 + point.phase) * 9 + progress * 65 * point.depth + canvasHeight) % canvasHeight;
      const alpha = (.13 + .22 * point.depth) * (.75 + .25 * Math.sin(time * .001 + point.phase));
      context.beginPath();
      context.fillStyle = `rgba(220,243,214,${alpha.toFixed(3)})`;
      context.arc(x, y, point.radius * point.depth, 0, Math.PI * 2);
      context.fill();
    }
  }
  slider.addEventListener('input', updateComparison);
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', () => { resizeAtmosphere(); requestRender(); }, { passive: true });
  reducedMotion.addEventListener?.('change', requestRender);
  document.querySelector('#year').textContent = String(new Date().getFullYear());
  resizeAtmosphere();
  updateComparison();
  render();
  if (context) requestAnimationFrame(paint);
})();
