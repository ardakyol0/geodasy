import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONCEPTS } from './data/concepts.js';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Y_AXIS = V(0, 1, 0), Z_AXIS = V(0, 0, 1);

export const tag = (o, cid, layer) => { o.userData.cid = cid; o.userData.layer = layer; return o; };

const reg = (m, color, opacity) => { m.userData.base = opacity; m.userData.color = new THREE.Color(color); return m; };
export const meshMat = (color, opacity = 1) =>
  reg(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: opacity > 0.9 }), color, opacity);
const faceMat = (color, opacity) =>
  reg(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }), color, opacity);
const lineMat = (color, opacity) => reg(new THREE.LineBasicMaterial({ color, transparent: true, opacity }), color, opacity);

export function tube(pts, color, r = 0.006, opacity = 1) {
  const curve = pts.length === 2 ? new THREE.LineCurve3(pts[0], pts[1]) : new THREE.CatmullRomCurve3(pts);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(2, pts.length * 2), r, 6, false), meshMat(color, opacity));
}

export function dashed(pts, color, opacity = 0.85) {
  const m = reg(new THREE.LineDashedMaterial({ color, dashSize: 0.025, gapSize: 0.018, transparent: true, opacity }), color, opacity);
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m);
  l.computeLineDistances();
  return l;
}

export function polyline(pts, color, opacity = 1) {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color, opacity));
}

export function arrow(origin, dir, len, color, r = 0.01) {
  const g = new THREE.Group();
  const head = Math.min(len * 0.35, r * 9);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len - head, 8), meshMat(color));
  shaft.position.y = (len - head) / 2;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, head, 12), meshMat(color));
  cone.position.y = len - head / 2;
  g.add(shaft, cone);
  g.quaternion.setFromUnitVectors(Y_AXIS, dir.clone().normalize());
  g.position.copy(origin);
  return g;
}

export function dot(p, color, r = 0.018, opacity = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), meshMat(color, opacity));
  m.position.copy(p);
  return m;
}

export function disk(c, n, r, color, opacity = 0.16, half = false) {
  const g = new THREE.Group();
  const geo = half ? new THREE.CircleGeometry(r, 48, -Math.PI / 2, Math.PI) : new THREE.CircleGeometry(r, 48);
  g.add(new THREE.Mesh(geo, faceMat(color, opacity)));
  const ring = [];
  for (let i = 0; i <= 48; i++) {
    const a = half ? -Math.PI / 2 + (Math.PI * i) / 48 : (2 * Math.PI * i) / 48;
    ring.push(V(Math.cos(a) * r, Math.sin(a) * r, 0));
  }
  if (half) ring.push(ring[0].clone());
  g.add(polyline(ring, color, Math.min(1, opacity * 3.5)));
  g.quaternion.setFromUnitVectors(Z_AXIS, n.clone().normalize());
  g.position.copy(c);
  return g;
}

export function arcPts(c, v0, v1, r, n = 28) {
  const ang = v0.angleTo(v1), out = [];
  if (ang < 1e-4) return [c.clone().addScaledVector(v0, r), c.clone().addScaledVector(v1, r)];
  const s = Math.sin(ang);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push(c.clone().addScaledVector(v0, (Math.sin((1 - t) * ang) / s) * r).addScaledVector(v1, (Math.sin(t * ang) / s) * r));
  }
  return out;
}

export function arcAround(c, axis, v0, ang, r, n = 36) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(c.clone().addScaledVector(v0.clone().applyAxisAngle(axis, (ang * i) / n), r));
  return out;
}

// küçük ok başı (yay uçları için)
export function cone(p, dir, color, r = 0.02, len = 0.06) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, len, 10), meshMat(color));
  m.quaternion.setFromUnitVectors(Y_AXIS, dir.clone().normalize());
  m.position.copy(p).addScaledVector(dir.clone().normalize(), len / 2);
  return m;
}

export function rightAngle(c, a, b, s, color) {
  const g = new THREE.Group();
  const p1 = c.clone().addScaledVector(a, s), p2 = p1.clone().addScaledVector(b, s), p3 = c.clone().addScaledVector(b, s);
  g.add(tube([p1, p2], color, 0.004), tube([p2, p3], color, 0.004));
  return g;
}

// Etiket: html verilmezse kavramın sym + kısa adı kullanılır. near: yalnızca yakın kamerada görünür.
export function label(cid, pos, html, layer, opts = {}) {
  const c = CONCEPTS[cid];
  const div = document.createElement('div');
  div.className = 'lbl';
  div.dataset.cid = cid;
  div.innerHTML = `<span class="in" style="--c:${c.col}">${html ?? `<b>${c.sym}</b> ${c.short}`}</span>`;
  const o = new CSS2DObject(div);
  o.position.copy(pos);
  tag(o, cid, layer);
  o.userData.isLabel = true;
  o.userData.near = !!opts.near;
  return o;
}

// iki uç arasında normale paralel ölçü çizgisi (uçlarda küçük çubuklar)
export function bracket(a, b, off, color, r = 0.005) {
  const g = new THREE.Group();
  const a2 = a.clone().add(off), b2 = b.clone().add(off);
  g.add(tube([a2, b2], color, r));
  const tick = off.clone().normalize().multiplyScalar(0.012);
  g.add(tube([a2.clone().sub(tick), a2.clone().add(tick)], color, r), tube([b2.clone().sub(tick), b2.clone().add(tick)], color, r));
  g.add(dashed([a, a2], color, 0.5), dashed([b, b2], color, 0.5));
  return g;
}
