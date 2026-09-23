import * as THREE from 'three';
import { GLTFLoader } from './assets/3d/vendor/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from './assets/3d/vendor/meshopt_decoder.mjs';

// The photographic story is the fallback on devices without WebGL or when
// reduced motion is requested. This module only takes over after the model loads.
const canvas = document.querySelector('.vessel-stage__canvas');
const stage = document.querySelector('.vessel-stage');
const section = document.querySelector('.experience');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 700px)');
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
let progress = 0;
let renderer;
let camera;
let scene;
let vessel;
let restorationUniform = { value: 0 };
let active = false;
let lastWidth = 0;
let lastHeight = 0;
let lastRestoration = -1;
let modelMaterials = [];

// The yacht remains the same object for the entire story. Its shader receives
// a world-space cleaning front, so grime stays attached as the camera orbits.
const finish = {
  fiancate: ['#e9eae5', .26, .03], coperta1: ['#e1ddd1', .4, .01],
  chiglia1: ['#17232b', .44, .12], blinn5: ['#18242a', .31, .3],
  phongE2: ['#17242b', .23, .24], blinn2: ['#0d1c24', .14, .5],
  blinn1: ['#786651', .5, .02], nero1: ['#0c171b', .18, .3],
  lambert2: ['#7b6751', .54, .01], lambert3: ['#8e9690', .25, .68],
  blinn6: ['#142730', .12, .25], blinn7: ['#243039', .15, .32],
  blinn8: ['#9da7a2', .21, .76], lambert6: ['#7d3931', .49, .04],
  lambert4: ['#c5c5b9', .37, .08], lambert5: ['#355b56', .48, .08],
  blinn9: ['#667a71', .32, .35], blinn10: ['#a16d4b', .36, .45],
  blinn11: ['#d7d8ce', .28, .08], blinn12: ['#27383b', .22, .3],
  phongE4: ['#b4afa4', .37, .08], lambert1: ['#1a292d', .45, .1],
  blinn13: ['#b7c5c8', .16, .52]
};

function applyRestoration(mesh) {
  const single = !Array.isArray(mesh.material);
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const transformed = materials.map(source => {
    const material = source.clone();
    const style = finish[material.name];
    if (style) {
      material.color.set(style[0]);
      material.roughness = style[1];
      material.metalness = style[2];
    }
    // Transparent glass in the original file should still look like glass.
    if (['blinn6', 'blinn7', 'blinn13'].includes(material.name)) {
      material.transparent = true;
      material.opacity = .82;
      material.depthWrite = false;
    }
    if (!['fiancate', 'coperta1', 'chiglia1'].includes(material.name)) return material;
    modelMaterials.push({ material, cleanRoughness: material.roughness });
    material.onBeforeCompile = shader => {
      shader.uniforms.uRestoration = restorationUniform;
      shader.vertexShader = 'varying vec3 vHullWorld; varying vec3 vHullNormal;\n' + shader.vertexShader.replace(
        '#include <begin_vertex>', '#include <begin_vertex>\n vHullWorld = (modelMatrix * vec4(position, 1.0)).xyz; vHullNormal = normalize(mat3(modelMatrix) * normal);'
      );
      shader.fragmentShader = `varying vec3 vHullWorld; varying vec3 vHullNormal;
        uniform float uRestoration;
        float hash31(vec3 p) {
          p = fract(p * .1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }
        float noise31(vec3 p) {
          vec3 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash31(i), hash31(i + vec3(1.,0.,0.)), f.x),
                         mix(hash31(i + vec3(0.,1.,0.)), hash31(i + vec3(1.,1.,0.)), f.x), f.y),
                     mix(mix(hash31(i + vec3(0.,0.,1.)), hash31(i + vec3(1.,0.,1.)), f.x),
                         mix(hash31(i + vec3(0.,1.,1.)), hash31(i + vec3(1.,1.,1.)), f.x), f.y), f.z);
        }
      ` + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        vec3 p = vHullWorld;
        float lengthwise = clamp((p.z + 6.4) / 12.8, 0., 1.);
        float small = noise31(p * vec3(3.7, 3.7, 3.7));
        float mottled = noise31(p * vec3(1.1, 2.7, 1.1));
        float streak = noise31(vec3(p.x * 9.0, p.y * .42, p.z * 9.0));
        float drips = pow(smoothstep(.50, .83, streak), 2.0) * (.35 + .65 * mottled);
        float tide = 1.0 - smoothstep(.3, 1.75, p.y);
        float weather = clamp(.30 + small * .23 + mottled * .31 + drips * .28 + tide * .36, 0., 1.);
        float fracturedLine = sin(p.z * 4.8 + noise31(p * .8) * 2.3) * .045;
        float scar = exp(-pow((p.y - 1.72 - fracturedLine) * 8.3, 2.0))
                   * smoothstep(-3.3, -1.9, p.z) * (1.0 - smoothstep(2.0, 4.8, p.z))
                   * smoothstep(.12, .35, abs(p.x));
        vec3 sediment = mix(vec3(.32,.36,.34), vec3(.31,.25,.18), drips);
        vec3 dirtyColor = mix(vec3(.72,.70,.65), sediment, weather * .82);
        dirtyColor -= scar * vec3(.20,.18,.15);
        float broken = (noise31(p * 2.5) - .5) * .095;
        float front = .075 + lengthwise * .85 + broken;
        float clear = smoothstep(front - .095, front + .075, uRestoration);
        diffuseColor.rgb *= mix(dirtyColor, vec3(1.), clear);
        float freshWash = exp(-pow((uRestoration - front) * 18.0, 2.0)) * step(.02, uRestoration) * (1.0 - step(.995, uRestoration));
        diffuseColor.rgb += vec3(.062,.105,.095) * freshWash;
      `);
    };
    material.customProgramCacheKey = () => `hull-restoration-${material.name}`;
    return material;
  });
  mesh.material = single ? transformed[0] : transformed;
}

function decorateDock() {
  // Transparent contact shadow keeps the photographed dock visible below.
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(5.7, 80),
    new THREE.ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: `varying vec2 uvShadow; void main(){ uvShadow = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`, fragmentShader: `varying vec2 uvShadow; void main(){ float d=length(uvShadow - .5); gl_FragColor=vec4(.005,.013,.016, .62 * (1. - smoothstep(.10,.49,d))); }` })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.y = .53;
  shadow.position.y = -.08;
  scene.add(shadow);
  const supportMaterial = new THREE.MeshStandardMaterial({ color: '#323b3b', metalness: .6, roughness: .5 });
  for (const x of [-.92, .92]) for (const z of [-2.75, 2.75]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.64, .08, .72), supportMaterial);
    foot.position.set(x, .03, z);
    scene.add(foot);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(.095, .13, .85, 8), supportMaterial);
    stand.position.set(x, .48, z);
    scene.add(stand);
  }
}

function studioReflections() {
  const map = document.createElement('canvas');
  map.width = 1024; map.height = 512;
  const context = map.getContext('2d');
  const base = context.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, '#849aa2'); base.addColorStop(.25, '#3b515b');
  base.addColorStop(.52, '#15252c'); base.addColorStop(1, '#0b1418');
  context.fillStyle = base; context.fillRect(0, 0, 1024, 512);
  // Long architectural highlights reflect in varnish, glass and gelcoat.
  for (const [x, w, alpha] of [[110,50,.65],[240,24,.45],[390,72,.53],[610,26,.46],[825,58,.67]]) {
    const glow = context.createLinearGradient(x - 48, 0, x + w + 48, 0);
    glow.addColorStop(0, 'transparent');
    glow.addColorStop(.35, `rgba(217,238,240,${alpha})`);
    glow.addColorStop(.65, `rgba(240,246,235,${alpha})`);
    glow.addColorStop(1, 'transparent');
    context.fillStyle = glow; context.fillRect(x - 48, 56, w + 96, 180);
  }
  const texture = new THREE.CanvasTexture(map);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(texture);
  scene.environment = environment.texture;
  texture.dispose(); pmrem.dispose();
}

function resize() {
  if (!renderer) return;
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  if (width === lastWidth && height === lastHeight) return;
  lastWidth = width;
  lastHeight = height;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile.matches ? 1.15 : 1.6));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = mobile.matches ? 49 : 40;
  camera.updateProjectionMatrix();
}

function frame() {
  if (!active || !renderer || !vessel) return;
  resize();
  // A full orbit begins immediately and finishes at the same physical angle.
  // The dolly and crane add a sense of travel without introducing a jump.
  const orbit = smooth(progress);
  const angle = -.77 + orbit * Math.PI * 2;
  const approach = Math.sin(orbit * Math.PI);
  const radius = (mobile.matches ? 29.5 : 15.7) - approach * (mobile.matches ? 2.5 : 2.0);
  camera.position.set(Math.sin(angle) * radius, 5.5 + Math.sin(orbit * Math.PI * 2) * 1.05, Math.cos(angle) * radius);
  camera.lookAt(0, 1.65 + approach * .32, 0);
  restorationUniform.value = smooth((progress - .055) / .89);
  if (Math.abs(restorationUniform.value - lastRestoration) > .005) {
    modelMaterials.forEach(({ material, cleanRoughness }) => {
      material.roughness = cleanRoughness + (1 - restorationUniform.value) * .30;
    });
    lastRestoration = restorationUniform.value;
  }
  renderer.render(scene, camera);
}

function modelIsVisible() {
  // GL shader errors do not necessarily throw from renderer.render(). Check
  // the actual framebuffer before covering the photographic boat.
  const gl = renderer.getContext();
  const pixel = new Uint8Array(4);
  const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
  for (const x of [.3, .4, .5, .6, .7]) {
    for (const y of [.35, .45, .55, .65]) {
      gl.readPixels(Math.floor(width * x), Math.floor(height * y), 1, 1,
        gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      if (pixel[3] > 10) return true;
    }
  }
  return false;
}

function captureComparison() {
  const before = document.querySelector('.comparison > img');
  const after = document.querySelector('.comparison__after img');
  if (!before || !after) return;
  const initial = restorationUniform.value;
  try {
    restorationUniform.value = 0;
    renderer.render(scene, camera);
    const dirty = canvas.toDataURL('image/png');
    restorationUniform.value = 1;
    renderer.render(scene, camera);
    const clean = canvas.toDataURL('image/png');
    if (dirty.length < 10000 || clean.length < 10000) return;
    before.src = dirty;
    after.src = clean;
    before.alt = 'The weathered 3D yacht in the shipyard';
    after.alt = 'The same 3D yacht after hull restoration';
    document.querySelector('.comparison')?.classList.add('comparison--rendered');
  } catch (error) {
    console.warn('Unable to capture yacht comparison.', error);
  } finally {
    restorationUniform.value = initial;
    frame();
  }
}

window.gbrutusScene = {
  ready: false,
  setProgress(value) {
    progress = value;
    if (active) frame();
  }
};

async function init() {
  if (reducedMotion.matches || !canvas) return;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile.matches, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.55;
    scene = new THREE.Scene();
    studioReflections();
    camera = new THREE.PerspectiveCamera(40, 1, .1, 120);
    scene.add(new THREE.HemisphereLight('#dfedee', '#273b3e', 2.1));
    const key = new THREE.DirectionalLight('#eff6f4', 3.3);
    key.position.set(-7, 12, 10);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#ffc69b', 2.5);
    rim.position.set(8, 5, -9);
    scene.add(rim);
    // The photographed shipyard provides the floor and supports. Keeping the
    // WebGL scene limited to the boat makes its visibility test meaningful.
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    await MeshoptDecoder.ready;
    const path = mobile.matches ? 'assets/3d/motoryacht-mobile.glb' : 'assets/3d/motoryacht-optimized.glb';
    const model = await loader.loadAsync(path);
    vessel = model.scene;
    vessel.traverse(object => { if (object.isMesh) applyRestoration(object); });
    const bounds = new THREE.Box3().setFromObject(vessel);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    vessel.position.sub(center);
    const pivot = new THREE.Group();
    // The GLB is already Y-up and approximately five scene units long.
    const scale = (mobile.matches ? 10.1 : 12.4) / size.z;
    pivot.scale.setScalar(scale);
    pivot.position.y = size.y * scale / 2 + .08;
    pivot.add(vessel);
    scene.add(pivot);
    active = true;
    resize();
    frame();
    if (!modelIsVisible()) throw new Error('The 3D boat drew no visible pixels');
    window.gbrutusScene.ready = true;
    document.body.classList.add('has-3d');
    requestAnimationFrame(captureComparison);
    window.dispatchEvent(new Event('scroll'));
  } catch (error) {
    // The aligned photographic cleaning scene remains fully functional.
    console.warn('3D vessel unavailable; using the photographic restoration.', error);
    active = false;
    window.gbrutusScene.ready = false;
    document.body.classList.remove('has-3d');
    renderer?.dispose();
  }
}

const observer = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return;
  observer.disconnect();
  init();
}, { rootMargin: '400px' });
observer.observe(section);
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  active = false;
  window.gbrutusScene.ready = false;
  document.body.classList.remove('has-3d');
  window.dispatchEvent(new Event('scroll'));
});
window.addEventListener('resize', () => { lastWidth = 0; frame(); }, { passive: true });
