// Ortak dünya geometrisi: elipsoit, jeoit, arazi, K noktası ve global çerçeve.
// Tüm koordinatlar "jeodezik" eksenlerde (Z yukarı) üretilir; viewport bunları GEO2THREE ile çevirir.
import * as THREE from 'three';
import { PAL } from './data/concepts.js';
import {
  V, tag, meshMat, tube, dashed, polyline, arrow, dot, disk, arcAround, arcPts, cone, label,
} from './util.js';

export const A = 1, B = 0.82, E2 = 1 - (B * B) / (A * A), D2R = Math.PI / 180;
export const GEO2THREE = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
export const H0 = 0.07, PATCH = 0.3;

export const nrm = (p, l) => V(Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p));
export const eastV = (l) => V(-Math.sin(l), Math.cos(l), 0);
export const northV = (p, l) => V(-Math.sin(p) * Math.cos(l), -Math.sin(p) * Math.sin(l), Math.cos(p));
export function pos(p, l, h = 0) {
  const N = A / Math.sqrt(1 - E2 * Math.sin(p) ** 2);
  return V((N + h) * Math.cos(p) * Math.cos(l), (N + h) * Math.cos(p) * Math.sin(l), (N * (1 - E2) + h) * Math.sin(p));
}

// P noktasını sürüklerken: ışının elipsoitle kesişimi → (φ, λ). Işın dünya (geo) uzayında.
export function rayToGeo(o, d) {
  const q = (v) => V(v.x / A, v.y / A, v.z / B);
  const oo = q(o), dd = q(d);
  const a = dd.dot(dd), b = 2 * oo.dot(dd), c = oo.dot(oo) - 1, disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  const p = o.clone().addScaledVector(d, t);
  const phi = Math.atan2(p.z / (B * B), Math.hypot(p.x, p.y) / (A * A));
  return { phi, lam: Math.atan2(p.y, p.x) };
}

const wave = (p, l) => Math.sin(2 * l + 0.5) * Math.cos(p) * 0.5 + Math.sin(3 * p - l) * 0.3 + Math.cos(4 * l) * Math.cos(p) ** 2 * 0.2;
const baseUnd = (S, p, l) => S.g * 0.05 * (0.9 + 0.5 * wave(p, l));

// K ile ilgili her şey burada hesaplanır (geodetik + astronomik çerçeveler, jeoit, arazi).
export function kinfo(S) {
  const p = S.phi, l = S.lam;
  const n = nrm(p, l), e = eastV(l), no = northV(p, l);
  const th = S.theta * D2R, xi = 0.8 * th, eta = 0.6 * th;
  const d = 1e-3;
  const gN = (baseUnd(S, p + d, l) - baseUnd(S, p - d, l)) / (2 * d);
  const gE = (baseUnd(S, p, l + d) - baseUnd(S, p, l - d)) / (2 * d) / Math.cos(p);
  const sN = -xi - gN, sE = -eta - gE; // jeoit eğimi = -(ξ, η): çekül jeoide dik olur
  const rel = (pp, ll) => {
    let dl = ll - l; dl = Math.atan2(Math.sin(dl), Math.cos(dl));
    return [pp - p, dl * Math.cos(p)];
  };
  const und = (pp, ll) => {
    const [dN, dE] = rel(pp, ll);
    return baseUnd(S, pp, ll) + (sN * dN + sE * dE) * Math.exp(-(dN * dN + dE * dE) / 0.12);
  };
  const bump = (dN, dE) => 0.03 * Math.sin(11 * dN + 0.7) * Math.cos(9 * dE - 0.3) + 0.02 * Math.sin(17 * dE + 2 * dN);
  const b0 = bump(0, 0);
  const Hfn = (dN, dE) => Math.max(0.012, H0 + bump(dN, dE) - b0);
  const terrainPos = (dN, dE) => {
    const pp = p + dN, ll = l + dE / Math.cos(p);
    return pos(pp, ll, und(pp, ll) + Hfn(dN, dE));
  };
  const und0 = und(p, l);
  const K = pos(p, l, und0 + H0);
  const F = pos(p, l, 0), G = pos(p, l, und0);
  const up = n.clone().addScaledVector(no, xi).addScaledVector(e, eta).normalize();
  const Zh = V(0, 0, 1);
  const northA = Zh.clone().addScaledVector(up, -Zh.dot(up)).normalize();
  const eastA = northA.clone().cross(up).normalize();
  // hedef nokta i (arazide)
  const I = terrainPos(0.13, 0.18);
  const dv = I.clone().sub(K);
  const azOf = (N_, E_, U_) => {
    const a = Math.atan2(dv.dot(E_), dv.dot(N_));
    return { az: a < 0 ? a + 2 * Math.PI : a, el: Math.asin(dv.dot(U_) / dv.length()) };
  };
  return {
    p, l, n, e, no, xi, eta, th, und, und0, Hfn, terrainPos, K, F, G, up, northA, eastA, I, r: dv.length(),
    geo: azOf(no, e, n), ast: azOf(northA, eastA, up),
  };
}

function gridMesh(nu, nv, fn, colorFn) {
  const P = [], C = [], I = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const v = fn(i / nu, j / nv);
    P.push(v.x, v.y, v.z);
    if (colorFn) C.push(...colorFn(i / nu, j / nv, v));
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * (nv + 1) + j, b = a + 1, c = a + nv + 1, d = c + 1;
    I.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  if (colorFn) g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setIndex(I);
  g.computeVertexNormals();
  return g;
}

function lambert(color, opacity, extra = {}) {
  const m = new THREE.MeshLambertMaterial({ color, transparent: true, opacity, depthWrite: false, ...extra });
  m.userData.base = opacity; m.userData.color = new THREE.Color(color);
  return m;
}

export const put = (w, o, cid, layer) => { tag(o, cid, layer); w.add(o); return o; };

export function ellipsoid(w) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(gridMesh(40, 80, (u, v) => pos(-Math.PI / 2 + Math.PI * u, -Math.PI + 2 * Math.PI * v)), lambert(0x4a5c86, 0.42)));
  const lines = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = []; for (let i = 0; i <= 96; i++) pts.push(pos(lat * D2R, (i / 96) * 2 * Math.PI, 0.002)); lines.push(pts);
  }
  for (let lon = 0; lon < 360; lon += 30) {
    const pts = []; for (let i = 0; i <= 48; i++) pts.push(pos(-Math.PI / 2 + (Math.PI * i) / 48, lon * D2R, 0.002)); lines.push(pts);
  }
  lines.forEach((pts) => g.add(polyline(pts, PAL.ellipsoid, 0.35)));
  g.add(tube(Array.from({ length: 97 }, (_, i) => pos(0, (i / 96) * 2 * Math.PI, 0.003)), PAL.plane, 0.006, 0.9)); // ekvator
  put(w, g, 'ellipsoid', 'ellipsoid');
}

export function geoid(w, K) {
  const g = new THREE.Group();
  const f = (u, v) => { const p = -Math.PI / 2 + Math.PI * u, l = -Math.PI + 2 * Math.PI * v; return pos(p, l, K.und(p, l)); };
  g.add(new THREE.Mesh(gridMesh(72, 144, f), lambert(PAL.geoid, 0.16)));
  const pts = [];
  for (let i = 0; i <= 36; i++) for (let j = 0; j < 72; j++) pts.push(f(i / 36, j / 72));
  const pg = new THREE.BufferGeometry().setFromPoints(pts);
  const pm = new THREE.PointsMaterial({ color: PAL.geoid, size: 0.012, transparent: true, opacity: 0.8 });
  pm.userData.base = 0.8; pm.userData.color = new THREE.Color(PAL.geoid);
  g.add(new THREE.Points(pg, pm));
  put(w, g, 'geoid', 'geoid');
}

export function terrain(w, K) {
  const col = new THREE.Color();
  const g = gridMesh(36, 36, (u, v) => K.terrainPos((u - 0.5) * 2 * PATCH, (v - 0.5) * 2 * PATCH), (u, v) => {
    const H = K.Hfn((u - 0.5) * 2 * PATCH, (v - 0.5) * 2 * PATCH);
    col.setHSL(0.09 + 0.14 * Math.max(0, 1 - H / 0.1), 0.45, 0.28 + H * 1.2);
    return [col.r, col.g, col.b];
  });
  const m = lambert(0xffffff, 0.95, { vertexColors: true, depthWrite: true });
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(g, m));
  grp.add(new THREE.LineSegments(new THREE.WireframeGeometry(g), (() => { const lm = new THREE.LineBasicMaterial({ color: PAL.terrain, transparent: true, opacity: 0.25 }); lm.userData.base = 0.25; lm.userData.color = new THREE.Color(PAL.terrain); return lm; })()));
  put(w, grp, 'terrain', 'terrain');
}

export function kMarker(w, K, mode) {
  const isP = mode === 'tgcs';
  put(w, dot(K.K, PAL.K, 0.022), 'K', 'always');
  const pick = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  pick.material.userData.skip = true; pick.userData.drag = true; pick.position.copy(K.K);
  put(w, pick, 'K', 'always');
  put(w, label('K', K.K.clone().addScaledVector(K.n, 0.05).addScaledVector(K.e, 0.03),
    isP ? '<b>P</b> topografya noktası (Topography point)' : '<b>K = P</b> gözlem noktası (aynı nokta)'), 'K', 'always');
}

function halfPlane(angle, r, color, opacity) {
  // XZ düzleminde x≥0 yarım disk, Z ekseni etrafında angle kadar döndürülmüş
  const g = new THREE.Group();
  g.add(disk(V(), V(0, -1, 0), r, color, opacity, true));
  const outer = new THREE.Group(); outer.add(g); outer.rotation.z = angle;
  return outer;
}

export function meridianCurve(K, fn, color, r = 0.004) {
  const pts = [];
  for (let i = 0; i <= 72; i++) { const p = -Math.PI / 2 + (Math.PI * i) / 72; pts.push(fn(p)); }
  return tube(pts, color, r, 0.9);
}

// Global çerçeve: O, X Y Z, düzlemler, φ λ yayları, K'dan geçen meridyen
export function globalFrame(w, K, S, mode) {
  const rh = V(Math.cos(K.l), Math.sin(K.l), 0);
  put(w, dot(V(), PAL.h, 0.022), 'O', 'globalAxes');
  put(w, label('O', V(0.03, 0.03, -0.1), '<b>O</b> = Yerin ağırlık merkezi (Origin)'), 'O', 'globalAxes');
  // eksenler
  [['Xaxis', V(1, 0, 0), PAL.X, 1.45, 'X', 'Greenwich yönü'], ['Yaxis', V(0, 1, 0), PAL.Y, 1.45, 'Y', '90° doğu'], ['Zaxis', V(0, 0, 1), PAL.Z, 1.35, 'Z', 'dönme ekseni']]
    .forEach(([cid, d, c, len, s, t]) => {
      put(w, arrow(V(), d, len, c, 0.011), cid, 'globalAxes');
      put(w, label(cid, d.clone().multiplyScalar(len + 0.04), `<b>${s}</b> ${t}`), cid, 'globalAxes');
    });
  // sağ elli rozeti: X'ten Y'ye saat yönünün tersi yay
  const hx = arcAround(V(), V(0, 0, 1), V(1, 0, 0), Math.PI / 2, 0.3);
  const hg = new THREE.Group(); hg.add(tube(hx, PAL.Z, 0.005)); hg.add(cone(hx[hx.length - 1], V(-1, 0, 0), PAL.Z, 0.016, 0.045));
  put(w, hg, 'rightHand', 'globalAxes');
  put(w, label('rightHand', V(0.28, 0.28, 0.0), '<b>↺</b> SAĞ ELLİ (Right-handed)', undefined, { near: false }), 'rightHand', 'globalAxes');
  // dönme oku + kutup
  const zt = 1.18;
  const rot = new THREE.Group();
  const ra = arcAround(V(0, 0, zt), V(0, 0, 1), V(0.13, 0, 0).normalize(), Math.PI * 1.55, 0.13);
  rot.add(tube(ra, PAL.Z, 0.005));
  const last = ra[ra.length - 1], prev = ra[ra.length - 2];
  rot.add(cone(last, last.clone().sub(prev), PAL.Z, 0.02, 0.05));
  put(w, rot, 'rotation', 'globalAxes');
  put(w, dot(V(0, 0, B), PAL.Z, 0.02), 'northPole', 'globalAxes');
  put(w, label('northPole', V(0.03, 0, B + 0.07), '<b>N</b> Kuzey Kutbu (North Pole)'), 'northPole', 'globalAxes');
  // düzlemler
  put(w, disk(V(), V(0, 0, 1), 1.3, PAL.plane, 0.1), 'equator', 'planes');
  put(w, label('equator', V(0.95, -0.95, 0), 'Ekvator düzlemi (Equatorial plane)'), 'equator', 'planes');
  const gw = halfPlane(0, 1.3, PAL.plane, 0.08);
  put(w, gw, 'greenwich', 'planes');
  put(w, meridianCurve(K, (p) => pos(p, 0, 0.003), PAL.plane, 0.004), 'greenwich', 'planes');
  put(w, label('greenwich', V(1.1, 0, -0.6), 'Greenwich meridyen düzlemi (Greenwich meridian plane)'), 'greenwich', 'planes');
  put(w, halfPlane(K.l, 1.3, PAL.meridian, 0.07), 'meridianPlane', 'planes');
  put(w, meridianCurve(K, (p) => pos(p, K.l, 0.004), PAL.meridian, 0.006), 'meridianCurve', 'planes');
  put(w, label('meridianPlane', rh.clone().multiplyScalar(1.12).add(V(0, 0, 0.72)), 'K meridyen düzlemi (Meridian plane)'), 'meridianPlane', 'planes');
  // φ: normal, ekvator düzlemini Q'da deler; yay Q'da çizilir
  const s = K.K.z / K.n.z, Q = K.K.clone().addScaledVector(K.n, -s);
  put(w, dashed([K.K, Q], PAL.phi, 0.9), 'phi', 'angles');
  put(w, dashed([Q, Q.clone().addScaledVector(rh, 0.55)], PAL.phi, 0.7), 'phi', 'angles');
  const pa = arcPts(Q, rh, K.n, 0.3);
  const pg = new THREE.Group(); pg.add(tube(pa, PAL.phi, 0.006)); put(w, pg, 'phi', 'angles');
  put(w, label('phi', Q.clone().addScaledVector(rh.clone().add(K.n).normalize(), 0.38), '<b>φ</b> jeodezik enlem (Geodetic latitude)'), 'phi', 'angles');
  put(w, dot(Q, PAL.phi, 0.012), 'phi', 'angles');
  // λ: ekvatorda O'da, X'ten meridyen izdüşümüne
  const la = arcAround(V(), V(0, 0, 1), V(1, 0, 0), K.l, 0.55);
  const lg = new THREE.Group(); lg.add(tube(la, PAL.lam, 0.006));
  lg.add(dashed([V(), rh.clone().multiplyScalar(1.1)], PAL.lam, 0.8));
  put(w, lg, 'lam', 'angles');
  put(w, label('lam', arcAround(V(), V(0, 0, 1), V(1, 0, 0), K.l / 2, 0.66)[36], '<b>λ</b> jeodezik boylam (Geodetic longitude)'), 'lam', 'angles');
  // geosentrik enlem (isteğe bağlı)
  if (S.geocentric) {
    const dF = K.F.clone().normalize();
    const g = new THREE.Group();
    g.add(dashed([V(), K.F.clone().multiplyScalar(1.02)], PAL.psi, 0.95));
    g.add(tube(arcPts(V(), rh, dF, 0.2), PAL.psi, 0.006));
    put(w, g, 'psi', 'angles');
    put(w, label('psi', V().addScaledVector(rh.clone().add(dF).normalize(), 0.3), '<b>ψ</b> geosentrik enlem ≠ φ (abartılı fark)'), 'psi', 'angles');
  }
}
