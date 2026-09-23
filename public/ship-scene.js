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

function applyRestoration(mesh) {
  const single = !Array.isArray(mesh.material);
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const transformed = materials.map(source => {
    const material = source.clone();
    if (!['fiancate', 'coperta1', 'chiglia1'].includes(material.name)) return material;
    if (material.name === 'fiancate') {
      material.color.set('#e4e9e4');
      material.roughness = .36;
      material.metalness = .08;
    } else if (material.name === 'coperta1') {
      material.color.set('#d4d6cb');
      material.roughness = .5;
    } else {
      material.color.set('#17242b');
      material.roughness = .6;
    }
    material.onBeforeCompile = shader => {
      shader.uniforms.uRestoration = restorationUniform;
      shader.vertexShader = 'varying vec3 vHullWorld;\n' + shader.vertexShader.replace(
        '#include <begin_vertex>', '#include <begin_vertex>\n vHullWorld = (modelMatrix * vec4(position, 1.0)).xyz;'
      );
      shader.fragmentShader = `varying vec3 vHullWorld;
        uniform float uRestoration;
        float dirtNoise(vec3 p) {
          return .5 + .5 * sin(p.z * 11.7 + sin(p.x * 8.2)) * sin(p.y * 19.1 + p.z * 3.6);
        }
      ` + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float alongHull = clamp((vHullWorld.z + 6.8) / 13.6, 0.0, 1.0);
        float irregular = sin(vHullWorld.y * 8.0 + vHullWorld.z * 2.4) * .012;
        float cleared = smoothstep(alongHull - .075, alongHull + .075, uRestoration + irregular);
        float grime = .24 + dirtNoise(vHullWorld) * .17;
        float rustStreak = pow(max(0.0, sin(vHullWorld.z * 17.0 + sin(vHullWorld.x * 6.0))), 14.0);
        vec3 weathered = vec3(grime * .90, grime * .92, grime * .88) - rustStreak * vec3(.035, .075, .085);
        diffuseColor.rgb *= mix(weathered, vec3(1.0), cleared);
        float wetEdge = exp(-pow((uRestoration - alongHull) * 27.0, 2.0));
        diffuseColor.rgb += vec3(.13, .19, .09) * wetEdge * smoothstep(.02, .12, uRestoration);
      `);
    };
    material.customProgramCacheKey = () => `hull-restoration-${material.name}`;
    return material;
  });
  mesh.material = single ? transformed[0] : transformed;
}

function decorateDock() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: '#0b1920', metalness: .36, roughness: .72 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.12;
  scene.add(floor);
  const grid = new THREE.GridHelper(25, 24, '#45615d', '#25373b');
  grid.position.y = -.095;
  grid.material.transparent = true;
  grid.material.opacity = .24;
  scene.add(grid);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(7.2, 7.215, 128),
    new THREE.MeshBasicMaterial({ color: '#8dbd9a', transparent: true, opacity: .34, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -.085;
  scene.add(ring);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(5.6, 64),
    new THREE.MeshBasicMaterial({ color: '#02080a', transparent: true, opacity: .35, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.y = .53;
  shadow.position.y = -.08;
  scene.add(shadow);
  const supportMaterial = new THREE.MeshStandardMaterial({ color: '#40515a', metalness: .78, roughness: .44 });
  for (const x of [-.82, .82]) for (const z of [-3.05, 3.05]) {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(.18, .8, .35), supportMaterial);
    stand.position.set(x, .32, z);
    scene.add(stand);
  }
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
  const orbit = smooth((progress - .17) / .66);
  const angle = -.78 + orbit * Math.PI * 2;
  const approach = Math.sin(orbit * Math.PI);
  const radius = mobile.matches ? 29 - approach * 2 : 17.5 - approach * 3.2;
  camera.position.set(Math.sin(angle) * radius, 5.6 + Math.sin(orbit * Math.PI * 2) * 1.25, Math.cos(angle) * radius);
  camera.lookAt(0, 1.85, 0);
  restorationUniform.value = smooth((progress - .19) / .62);
  renderer.render(scene, camera);
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
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile.matches, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#0a1920', .024);
    camera = new THREE.PerspectiveCamera(40, 1, .1, 120);
    scene.add(new THREE.HemisphereLight('#d8edff', '#455652', 2.5));
    const key = new THREE.DirectionalLight('#fff0d7', 3.2);
    key.position.set(-7, 12, 10);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#b8e8eb', 3.8);
    rim.position.set(8, 5, -9);
    scene.add(rim);
    decorateDock();
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
    window.gbrutusScene.ready = true;
    document.body.classList.add('has-3d');
    resize();
    frame();
    window.dispatchEvent(new Event('scroll'));
  } catch (error) {
    // The aligned photographic cleaning scene remains fully functional.
    console.warn('3D vessel unavailable; using the photographic restoration.', error);
    renderer?.dispose();
  }
}

const observer = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return;
  observer.disconnect();
  init();
}, { rootMargin: '400px' });
observer.observe(section);
window.addEventListener('resize', () => { lastWidth = 0; frame(); }, { passive: true });
