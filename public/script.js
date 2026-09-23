(() => {
  const experience = document.querySelector('.experience');
  const sticky = document.querySelector('.experience__sticky');
  const boat = document.querySelector('.restoration__pair');
  const wash = document.querySelector('.wash');
  const launch = document.querySelector('.shot--launch');
  const vesselStage = document.querySelector('.vessel-stage');
  const detail = document.querySelector('.detail');
  const detailImages = [...document.querySelectorAll('.detail__image')];
  const detailNumber = document.querySelector('.detail__number');
  const detailStep = document.querySelector('.detail__step');
  const scan = document.querySelector('.camera__scan');
  const flare = document.querySelector('.camera__flare');
  const fill = document.querySelector('.hud__fill');
  const percent = document.querySelector('.hud__percent');
  const restoredLabel = document.querySelector('.hud__restored');
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

  function scrollPosition() {
    const bounds = experience.getBoundingClientRect();
    const distance = Math.max(1, experience.offsetHeight - sticky.offsetHeight);
    visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
    return clamp(-bounds.top / distance);
  }

  function renderScene(p) {
    // The before and after frames are pixel-aligned. Both stay on the same
    // camera plane, while a feathered edge removes the dirt as scroll advances.
    const restored = fade(p, .11, .855);
    boat.style.setProperty('--wash', `${(-15 + restored * 130).toFixed(2)}%`);
    const travel = fade(p, .02, .86);
    const depth = window.innerWidth <= 700 ? .4 : 1;
    boat.style.transform = reducedMotion.matches ? '' :
      `translate3d(${(-travel * 1.8 * depth).toFixed(2)}%,${(-travel * .7 * depth).toFixed(2)}%,0) scale(${(1.015 + Math.sin(travel * Math.PI) * .055 * depth).toFixed(3)})`;
    wash.style.opacity = (restored > .015 && restored < .985 ? Math.min(1,restored * 8,(1 - restored) * 8) * .7 : 0).toFixed(3);
    window.gbrutusScene?.setProgress(p);
    vesselStage.style.opacity = window.gbrutusScene?.ready ? pulse(p, .12, .20, .83, .92).toFixed(3) : '0';
    launch.style.setProperty('--edge', `${(-10 + fade(p, .91, .99) * 120).toFixed(2)}%`);

    // The three close-ups explain the craft without replacing the boat.
    const detailPresence = window.gbrutusScene?.ready ? 0 : fade(p, .21, .255) * (1 - fade(p, .70, .77));
    detail.style.opacity = detailPresence.toFixed(3);
    detail.style.transform = reducedMotion.matches ? '' :
      `translate3d(${((1 - detailPresence) * 20 - travel * 9).toFixed(1)}px,${((1 - detailPresence) * 18 + travel * 10).toFixed(1)}px,0) scale(${(.96 + detailPresence * .04).toFixed(3)})`;
    const repairIn = fade(p, .395, .44);
    const polishIn = fade(p, .555, .60);
    detailImages[0].style.opacity = (1 - repairIn).toFixed(3);
    detailImages[1].style.opacity = (repairIn * (1 - polishIn)).toFixed(3);
    detailImages[2].style.opacity = polishIn.toFixed(3);
    detailImages.forEach((img, i) => {
      img.style.transform = reducedMotion.matches ? '' : `scale(${(1.045 - .035 * travel).toFixed(3)}) translate3d(${(-travel * (i + 1) * 1.1).toFixed(2)}%,0,0)`;
    });
    const detailIndex = p < .42 ? 0 : p < .58 ? 1 : 2;
    detailNumber.textContent = `0${detailIndex + 1} / 03`;
    detailStep.textContent = ['SURFACE ANALYSIS','GELCOAT REPAIR','FINAL POLISH'][detailIndex];

    scan.style.opacity = pulse(p, .205, .245, .36, .40).toFixed(3);
    scan.style.setProperty('--scan-position', `${(17 + fade(p, .20, .39) * 67).toFixed(1)}%`);
    flare.style.opacity = clamp(pulse(p, .60, .65, .77, .86) * .6).toFixed(3);
    fill.style.height = `${(p * 100).toFixed(1)}%`;
    percent.textContent = `${String(Math.round(p * 100)).padStart(2, '0')}%`;
    restoredLabel.textContent = `HULL / ${String(Math.round(restored * 100)).padStart(2, '0')}% RESTORED`;
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
    const clean = fade(progress, .11, .855);
    if (clean > .02 && clean < .98) {
      const edge = (-.15 + clean * 1.3) * canvasWidth;
      for (let i = 0; i < 28; i++) {
        const dot = specks[i];
        const drift = (time * (.013 + dot.depth * .009) + i * 59) % (canvasHeight * .29);
        const x = edge + Math.sin(i * 24.7 + time * .001) * (16 + dot.depth * 33);
        const y = canvasHeight * .35 + drift;
        context.beginPath();
        context.strokeStyle = `rgba(222,247,245,${(.055 + dot.depth * .13).toFixed(3)})`;
        context.lineWidth = .5 + dot.depth * .8;
        context.moveTo(x, y);
        context.lineTo(x - 2 * dot.depth, y + 5 + dot.depth * 8);
        context.stroke();
      }
    }
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
