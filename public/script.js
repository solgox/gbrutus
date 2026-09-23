(() => {
  const experience = document.querySelector('.experience');
  const sticky = document.querySelector('.experience__sticky');
  const shots = ['wide', 'damage', 'repair', 'polish', 'return', 'launch'].map(name => document.querySelector('.shot--' + name));
  const wipe = document.querySelector('.shot--return .shot__wipe');
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
  const boundaries = [0, .205, .39, .575, .76, .93, 1.001];
  const captions = [
    [0, 0, .15, .18],
    [.235, .27, .325, .355],
    [.415, .45, .515, .545],
    [.60, .635, .70, .73],
    [.79, .825, .87, .90],
    [.945, .98, 1, 1]
  ];
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const fade = (p, a, b) => smooth((p - a) / (b - a));
  const pulse = (p, a, b, c, d) => fade(p, a, b) * (1 - fade(p, c, d));
  let progress = 0;
  let currentChapter = -1;
  let visible = true;
  let pending = false;
  let previousTick = 0;
  let canvasWidth = 0, canvasHeight = 0, specks = [], previousFrame = 0;

  function position(shot, x, y, angle, scale) {
    shot.style.transform = reducedMotion.matches ? '' :
      `translate3d(${x.toFixed(2)}%,${y.toFixed(2)}%,0) rotateY(${angle.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
  }

  function scrollPosition() {
    const bounds = experience.getBoundingClientRect();
    const distance = Math.max(1, experience.offsetHeight - sticky.offsetHeight);
    visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
    return clamp(-bounds.top / distance);
  }

  // Each photograph arrives behind a moving soft edge. The images never become
  // two equally translucent full-screen frames, which caused the double exposure.
  function reveal(shot, p, start, end) {
    const edge = -10 + fade(p, start, end) * 120;
    shot.style.setProperty('--edge', `${edge.toFixed(2)}%`);
  }

  function renderScene(p) {
    const depth = window.innerWidth <= 700 ? .42 : 1;
    const push = fade(p, .01, .265);
    const inspect = fade(p, .125, .39);
    const mend = fade(p, .31, .57);
    const finish = fade(p, .50, .735);
    const pullback = fade(p, .69, .90);
    const depart = fade(p, .89, 1);

    position(shots[0], -push * 6 * depth, -push * 1.2 * depth, (-2 + push * 5) * depth, 1.025 + push * .51 * depth);
    position(shots[1], (-2 + inspect * 4) * depth, (.8 - inspect * 1.2) * depth, (-5 + inspect * 4) * depth, 1.15 - inspect * .11 * depth);
    position(shots[2], (3 - mend * 4) * depth, (-.8 + mend * 1.1) * depth, (3 - mend * 5) * depth, 1.14 - mend * .09 * depth);
    position(shots[3], (-3 + finish * 5) * depth, (.6 - finish * .8) * depth, (-4 + finish * 5) * depth, 1.17 - finish * .12 * depth);
    position(shots[4], (2 - pullback * 3) * depth, -.5 * depth, (3 - pullback * 5) * depth, 1.18 - pullback * .15 * depth);
    position(shots[5], (-2 + depart * 3) * depth, 0, (-3 + depart * 4) * depth, 1.13 - depart * .09 * depth);
    reveal(shots[1], p, .125, .265);
    reveal(shots[2], p, .31, .45);
    reveal(shots[3], p, .50, .64);
    reveal(shots[4], p, .69, .82);
    reveal(shots[5], p, .89, .975);

    const restored = fade(p, .79, .895) * 100;
    shots[4].style.setProperty('--wipe', `${restored.toFixed(2)}%`);
    wipe.style.opacity = pulse(p, .79, .81, .875, .90).toFixed(3);
    scan.style.opacity = pulse(p, .23, .27, .32, .38).toFixed(3);
    scan.style.setProperty('--scan-position', `${(17 + fade(p, .20, .39) * 67).toFixed(1)}%`);
    flare.style.opacity = clamp(pulse(p, .59, .63, .72, .78) * .7 + pulse(p, .8, .84, .89, .94) * .3).toFixed(3);
    fill.style.height = `${(p * 100).toFixed(1)}%`;
    percent.textContent = `${String(Math.round(p * 100)).padStart(2, '0')}%`;
    cue.style.opacity = (1 - fade(p, .015, .055)).toFixed(3);
    let active = 0;
    for (let i = 1; i < boundaries.length - 1; i++) if (p >= boundaries[i]) active = i;
    chapters.forEach((chapter, index) => {
      const [enter, fullyVisible, leave, gone] = captions[index];
      const opacity = (index === 0 ? 1 : fade(p, enter, fullyVisible)) *
        (index === chapters.length - 1 ? 1 : 1 - fade(p, leave, gone));
      chapter.style.opacity = opacity.toFixed(3);
      chapter.style.transform = reducedMotion.matches ? '' : `translate3d(0,${((1 - opacity) * 18).toFixed(1)}px,0)`;
      chapter.classList.toggle('is-visible', index === active && opacity > .4);
      chapter.inert = index !== active || opacity <= .4;
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

  function render(time) {
    pending = false;
    const target = scrollPosition();
    const elapsed = previousTick ? Math.min(64, time - previousTick) : 16;
    previousTick = time;
    if (reducedMotion.matches || Math.abs(target - progress) > .55) progress = target;
    else progress += (target - progress) * (1 - Math.exp(-elapsed / 125));
    if (Math.abs(target - progress) < .00015) progress = target;
    renderScene(progress);
    if (progress !== target) requestRender();
  }

  function requestRender() {
    if (!pending) { pending = true; requestAnimationFrame(render); }
  }
  jumps.forEach(jump => jump.addEventListener('click', () => {
    const top = window.scrollY + experience.getBoundingClientRect().top;
    const distance = experience.offsetHeight - sticky.offsetHeight;
    window.scrollTo({ top: top + centers[Number(jump.dataset.jump)] * distance, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
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
  progress = scrollPosition();
  renderScene(progress);
  if (context) requestAnimationFrame(paint);
})();
