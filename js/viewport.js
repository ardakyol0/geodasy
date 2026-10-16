import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { UI, SHOW } from './data/concepts.js';
import { V } from './util.js';
import { GEO2THREE, B, kinfo, ellipsoid, geoid, terrain, kMarker, globalFrame, rayToGeo } from './earth.js';
import { buildTGCS, buildBridge } from './tgcs-scene.js';
import { buildGeodetic } from './geodetic-scene.js';
import { buildAstronomic } from './astronomic-scene.js';

const INV = GEO2THREE.clone().invert();
const LOW = new Set(['ellipsoid', 'geoid', 'equator', 'greenwich', 'meridianPlane', 'horizonG', 'horizonA', 'terrain', 'perp']);
const NEAR_DIST = 1.35;

export function createWorld(mode, S) {
  const w = new THREE.Group();
  w.matrixAutoUpdate = false; w.matrix.copy(GEO2THREE); w.matrixWorldNeedsUpdate = true;
  const K = kinfo(S);
  ellipsoid(w);
  if (mode !== 'tgcs') { geoid(w, K); terrain(w, K); }
  if (mode !== 'overlay') globalFrame(w, K, S, mode);
  kMarker(w, K, mode);
  let bridge = null;
  if (mode === 'tgcs' || mode === 'all') { buildTGCS(w, K, S, mode); bridge = buildBridge(w, K, mode); }
  if (mode === 'lgcs' || mode === 'all') buildGeodetic(w, K, S, { ref: false });
  if (mode === 'lacs' || mode === 'overlay') buildGeodetic(w, K, S, { ref: true });
  if (mode === 'lacs' || mode === 'overlay' || mode === 'all') buildAstronomic(w, K, S, { overlay: mode === 'overlay' });
  return { w, K, bridge };
}

const isVis = (o) => { for (; o; o = o.parent) if (o.visible === false) return false; return true; };
const ownerCid = (o) => { for (let p = o; p; p = p.parent) if (p.userData.cid !== undefined) return p.userData.cid; return null; };

export class Viewport {
  constructor(parent, mode, S, app) {
    this.mode = mode; this.S = S; this.app = app; this.show = new Set(SHOW[mode]);
    const el = this.el = document.createElement('div');
    el.className = 'vp';
    const canvas = document.createElement('canvas');
    el.appendChild(canvas);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.className = 'lbl-layer';
    el.appendChild(this.labelRenderer.domElement);
    // etiketlerin üzerindeyken de tekerlek zoom'u tuvale iletilsin
    this.labelRenderer.domElement.addEventListener('wheel', (e) => { e.preventDefault(); canvas.dispatchEvent(new WheelEvent('wheel', e)); }, { passive: false });
    this.labelRenderer.domElement.addEventListener('click', (e) => { const l = e.target.closest('.lbl'); if (l) app.onPick(l.dataset.cid); });
    el.insertAdjacentHTML('beforeend', `
      <div class="vp-title">${UI.vpTitle[mode]}</div>
      <div class="vp-btns"><button data-f="K">${mode === 'tgcs' ? UI.focusP : UI.focusK}</button><button data-f="overview">${UI.overview}</button></div>
      <div class="vp-warn">${mode === 'tgcs' ? UI.warnTgcs : UI.warn}</div>
      ${mode === 'tgcs' || mode === 'all' ? `<div class="vp-hint">${UI.hintDrag}</div>` : `<div class="vp-hint">${UI.hint}</div>`}`);
    el.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => this.focus(b.dataset.f)));
    parent.appendChild(el);

    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(3, 5, 4); this.scene.add(dl);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.01, 60);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true; this.controls.zoomToCursor = true; this.controls.enablePan = true;
    // sol tuş: sahneyi 2B kaydır (pan); sağ tuş: döndür; tekerlek: zoom
    this.controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    this.controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    this.controls.screenSpacePanning = true; this.controls.dampingFactor = 0.12; this.controls.minDistance = 0.02; this.controls.maxDistance = 12;
    this.controls.addEventListener('change', () => { this.dirty = true; app.onCamera?.(this); });
    this.ray = new THREE.Raycaster(); this.ray.params.Line.threshold = 0.02; this.ray.params.Points.threshold = 0.01;
    this.hl = null; this.dirty = true; this.tween = null; this.tmp = V();
    this.bindPointer(canvas);
    new ResizeObserver(() => this.resize()).observe(el);
    this.rebuild();
    this.focus('overview', true);
  }

  resize() {
    const w = this.el.clientWidth || 1, h = this.el.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.labelRenderer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.dirty = true;
    if (!this.framed) { this.framed = true; this.focus('overview', true); }
  }

  rebuild() {
    if (this.world) {
      this.world.w.traverse((o) => {
        o.geometry?.dispose(); o.material?.dispose?.();
        if (o.isCSS2DObject) o.element.remove();
      });
      this.scene.remove(this.world.w);
    }
    this.world = createWorld(this.mode, this.S);
    this.scene.add(this.world.w);
    this.scene.updateMatrixWorld(true);
    this.labels = []; this.cids = new Set(); this.pickSphere = null;
    this.world.w.traverse((o) => {
      if (o.userData.isLabel) this.labels.push(o);
      if (o.userData.cid !== undefined && !o.userData.isLabel && this.show.has(o.userData.cid)) this.cids.add(o.userData.cid);
      if (o.userData.drag) this.pickSphere = o;
    });
    this.applyLayers();
    this.applyHighlight(this.hl);
  }

  applyLayers() {
    const L = this.S.layers;
    const rec = (o, pv) => {
      let eff = pv;
      const u = o.userData;
      if (u.layer !== undefined || u.cid !== undefined) {
        const own = (u.cid === undefined || this.show.has(u.cid)) && (u.layer === undefined || L[u.layer] !== false) && (!u.isLabel || L.labels !== false) && u.bridgeVis !== false;
        eff = pv && own;
        o.visible = u.isLabel ? eff : own;
        u.baseVis = o.visible;
      }
      o.children.forEach((c) => rec(c, eff));
    };
    rec(this.world.w, true);
    this.dirty = true;
  }

  applyHighlight(ids) {
    this.hl = ids;
    const white = new THREE.Color(1, 1, 1);
    this.world.w.traverse((o) => {
      const cid = o.userData.cid ?? ownerCid(o);
      const on = !ids || ids.has(cid);
      if (o.isCSS2DObject) {
        o.element.classList.toggle('dim', !!ids && !on);
        o.element.classList.toggle('hl', !!ids && on);
        return;
      }
      const m = o.material;
      if (!m || m.userData.skip || m.userData.base === undefined) return;
      m.opacity = ids ? (on ? Math.min(1, m.userData.base + 0.4) : m.userData.base * 0.1) : m.userData.base;
      m.color.copy(m.userData.color);
      if (ids && on && !m.vertexColors) m.color.lerp(white, 0.25);
    });
  }

  focus(kind, instant = false) {
    const K = this.world.K, S = this.S;
    const af = Math.max(1, 1 / this.camera.aspect) * 1.0;
    const dirK = K.n.clone().addScaledVector(K.e, -0.6).add(V(0, 0, 0.5)).normalize();
    let tgt, pos;
    if (kind === 'overview') { tgt = V(); pos = dirK.clone().multiplyScalar(5.0 * af); }
    else if (kind === 'center') { tgt = V(); pos = V(1.2, -1.5, 0.9).multiplyScalar(1.4 * af); }
    else if (kind === 'Kfar') { tgt = K.K.clone().multiplyScalar(0.6); pos = tgt.clone().addScaledVector(dirK, 2.2 * af); }
    else { tgt = K.K.clone().addScaledVector(K.n, -0.05); pos = tgt.clone().addScaledVector(K.n.clone().multiplyScalar(0.5).addScaledVector(K.no, -0.8).addScaledVector(K.e, 0.35).normalize(), 0.95 * af); }
    tgt.applyMatrix4(GEO2THREE); pos.applyMatrix4(GEO2THREE);
    this.goTo(pos, tgt, instant);
  }

  goTo(pos, tgt, instant) {
    if (instant) { this.camera.position.copy(pos); this.controls.target.copy(tgt); this.controls.update(); this.dirty = true; return; }
    this.tween = { p0: this.camera.position.clone(), t0: this.controls.target.clone(), p1: pos, t1: tgt, k: 0 };
  }

  copyCameraFrom(o) {
    this.camera.position.copy(o.camera.position); this.controls.target.copy(o.controls.target);
    this.camera.zoom = o.camera.zoom; this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  // --- etkileşim ---
  setRay(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.camera);
  }

  pick(e) {
    this.setRay(e);
    const hits = this.ray.intersectObject(this.world.w, true).filter((h) => isVis(h.object) && h.object.material?.userData.skip !== true || h.object.userData.drag);
    const ids = hits.map((h) => ownerCid(h.object)).filter((c) => c !== null);
    return ids.find((c) => !LOW.has(c)) ?? ids[0] ?? null;
  }

  bindPointer(canvas) {
    let down = null, drag = false;
    canvas.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY };
      if ((this.mode === 'tgcs' || this.mode === 'all') && this.pickSphere && isVis(this.pickSphere)) {
        this.setRay(e);
        if (this.ray.intersectObject(this.pickSphere).length) { drag = true; this.controls.enabled = false; canvas.setPointerCapture(e.pointerId); }
      }
    }, true);
    canvas.addEventListener('pointermove', (e) => {
      if (drag) {
        this.setRay(e);
        const o = this.ray.ray.origin.clone().applyMatrix4(INV), d = this.ray.ray.direction.clone().transformDirection(INV);
        const g = rayToGeo(o, d);
        if (g) this.app.onDrag(Math.max(-1.3, Math.min(1.3, g.phi)), g.lam);
        return;
      }
      if (e.buttons) return;
      const c = this.pick(e);
      canvas.style.cursor = c ? 'pointer' : 'move';
      this.app.onHover(c);
    });
    canvas.addEventListener('pointerleave', () => this.app.onHover(null));
    canvas.addEventListener('pointerup', (e) => {
      if (drag) { drag = false; this.controls.enabled = true; return; }
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 4) this.app.onPick(this.pick(e));
    });
  }

  // --- çizim ---
  declutter() {
    const W = this.el.clientWidth, H = this.el.clientHeight, cam = this.camera.position;
    const placed = [], tmp = this.tmp, p = new THREE.Vector3();
    for (const o of this.labels) {
      const bv = o.userData.baseVis;
      o.getWorldPosition(p);
      const far = o.userData.near && p.distanceTo(cam) > NEAR_DIST;
      o.visible = bv && !far;
      if (!o.visible) continue;
      // yer küresi arkasında kalan etiketleri soluklaştır
      const q = p.length();
      let occ = false;
      if (q > 0.9) {
        const d = p.clone().sub(cam), t = Math.max(0, Math.min(1, -cam.dot(d) / d.dot(d)));
        occ = cam.clone().addScaledVector(d, t).length() < B * 0.97 && t < 1;
      }
      o.element.classList.toggle('occ', occ);
      tmp.copy(p).project(this.camera);
      const inner = o.element.firstChild, w = o.element.offsetWidth, h = o.element.offsetHeight || 20;
      const x = (tmp.x * 0.5 + 0.5) * W, y = (-tmp.y * 0.5 + 0.5) * H;
      let best = [0, 0];
      for (const dy of [0, h + 2, -(h + 2), 2 * (h + 2), -2 * (h + 2), 3 * (h + 2), -3 * (h + 2)]) {
        const r = [x, y + dy - h / 2, x + w, y + dy + h / 2];
        if (!placed.some((s) => r[0] < s[2] && r[2] > s[0] && r[1] < s[3] && r[3] > s[1])) { best = [0, dy]; break; }
      }
      inner.style.transform = `translate(0px,${best[1]}px)`;
      placed.push([x, y + best[1] - h / 2, x + w, y + best[1] + h / 2]);
    }
  }

  render(dt, bridgeT) {
    if (this.tween) {
      const t = this.tween; t.k = Math.min(1, t.k + dt * 1.8);
      const e = t.k * t.k * (3 - 2 * t.k);
      this.camera.position.lerpVectors(t.p0, t.p1, e); this.controls.target.lerpVectors(t.t0, t.t1, e);
      if (t.k >= 1) this.tween = null;
      this.dirty = true;
    }
    this.controls.update();
    if (this.world.bridge) {
      const r = this.world.bridge.update(bridgeT);
      if (r.changed) this.applyLayers();
      this.stage = r.stage;
      if (bridgeT >= 0 && bridgeT < 3) this.dirty = true;
    }
    if (this.dirty) { this.declutter(); this.dirty = false; this.labelsStale = 2; }
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
    if (this.labelsStale > 0) { this.labelsStale--; this.dirty = this.labelsStale > 0 ? true : this.dirty; }
  }
}
