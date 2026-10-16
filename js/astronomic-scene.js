// LACS: jeoit / çekül referanslı yerel astronomik sistem ve düşey sapma.
import * as THREE from 'three';
import { PAL } from './data/concepts.js';
import { V, tube, dashed, arrow, dot, disk, arcPts, arcAround, label, rightAngle } from './util.js';
import { put } from './earth.js';
import { H0 } from './earth.js';

const LA = 0.3, LZ = 0.42;

export function buildAstronomic(w, K, S, { overlay = false } = {}) {
  const P = K.K, up = K.up;
  const rh = V(Math.cos(K.l), Math.sin(K.l), 0);
  // çekül doğrultusu (z̄): ucu ξ-η üçgeninin ucu ile çakışır
  const tipN = P.clone().addScaledVector(K.n, LZ);
  const tipA = tipN.clone().addScaledVector(K.no, K.xi * LZ);
  const tipP = tipA.clone().addScaledVector(K.e, K.eta * LZ);
  put(w, arrow(P, tipP.clone().sub(P), tipP.clone().sub(P).length(), PAL.astro, 0.011), 'plumb', 'localAxes');
  put(w, label('plumb', tipP.clone().addScaledVector(up, 0.03), '<b>z̄</b> çekül doğrultusu (Plumb line / zenith)', undefined, { near: true }), 'plumb', 'localAxes');
  put(w, arrow(P, K.northA, LA, PAL.astro, 0.007), 'ax', 'localAxes');
  put(w, label('ax', P.clone().addScaledVector(K.northA, LA + 0.03), '<b>x̄</b> astronomik kuzey (Astronomic north)', undefined, { near: true }), 'ax', 'localAxes');
  put(w, arrow(P, K.eastA, LA, PAL.astro, 0.007), 'ay', 'localAxes');
  put(w, label('ay', P.clone().addScaledVector(K.eastA, LA + 0.03), '<b>ȳ</b> astronomik doğu', undefined, { near: true }), 'ay', 'localAxes');
  put(w, disk(P, up, 0.24, PAL.astro, overlay ? 0.1 : 0.14), 'horizonA', 'planes');
  put(w, label('horizonA', P.clone().addScaledVector(K.eastA, -0.2).addScaledVector(K.northA, -0.12), 'astronomik ufuk (Astronomic horizon)', undefined, { near: true }), 'horizonA', 'planes');

  // çekül aşağı: jeoide dik iner, dik açı işareti + teğet yama
  const Gp = P.clone().addScaledVector(up, -H0 / up.dot(K.n));
  put(w, tube([P, Gp], PAL.astro, 0.006), 'plumb', 'heights');
  const pg = new THREE.Group();
  pg.add(disk(Gp, up, 0.09, PAL.geoid, 0.4));
  pg.add(rightAngle(Gp, up, K.northA, 0.035, PAL.astro));
  put(w, pg, 'perp', 'planes');
  put(w, label('perp', Gp.clone().addScaledVector(K.eastA, 0.07), '<b>⊾</b> çekül ⟂ jeoit', undefined, { near: true }), 'perp', 'planes');

  // astronomik enlem Φ ve boylam Λ
  const s2 = P.z / up.z, Qraw = P.clone().addScaledVector(up, -s2);
  const Lm = Math.atan2(up.y, up.x), dirL = V(Math.cos(Lm), Math.sin(Lm), 0);
  // schematic: çekülün ekvatoru deldiği nokta, O'dan geçen Λ çizgisinin üzerine alınır (fark çok küçüktür)
  const Qa = dirL.clone().multiplyScalar(Qraw.dot(dirL));
  const rha = V(up.x, up.y, 0).normalize();
  put(w, dashed([P, Qa], PAL.astro, 0.8), 'Phi', 'angles');
  put(w, dot(Qa, PAL.astro, 0.012), 'Phi', 'angles');
  put(w, tube(arcPts(Qa, rha, up, 0.4), PAL.astro, 0.006), 'Phi', 'angles');
  put(w, label('Phi', Qa.clone().addScaledVector(rha.clone().add(up).normalize(), 0.47), '<b>Φ</b> astronomik enlem (Astronomic latitude)'), 'Phi', 'angles');
  put(w, tube(arcAround(V(), V(0, 0, 1), V(1, 0, 0), Lm, 0.65), PAL.astro, 0.006), 'Lam', 'angles');
  put(w, dashed([dirL.clone().multiplyScalar(-0.4), dirL.clone().multiplyScalar(1.1)], PAL.astro, 0.85), 'Lam', 'angles'); // O'dan geçen, ekvatora paralel tek çizgi
  put(w, label('Lam', arcAround(V(), V(0, 0, 1), V(1, 0, 0), Lm * 0.5, 0.77)[36], '<b>Λ</b> astronomik boylam (Astronomic longitude)'), 'Lam', 'angles');

  // düşey sapma θ ve bileşenleri
  put(w, tube(arcPts(P, K.n, up, 0.26), PAL.theta, 0.007), 'theta', 'angles');
  put(w, label('theta', P.clone().addScaledVector(K.n.clone().add(up).normalize(), 0.3), '<b>θ</b> düşey sapma (Deflection of the vertical) — abartılmış', undefined, { near: true }), 'theta', 'angles');
  put(w, tube([tipN, tipA], PAL.xi, 0.006), 'xi', 'angles');
  put(w, tube([tipA, tipP], PAL.eta, 0.006), 'eta', 'angles');
  put(w, label('xi', tipN.clone().lerp(tipA, 0.5).addScaledVector(K.n, 0.05), '<b>ξ</b> meridyen bileşeni', undefined, { near: true }), 'xi', 'angles');
  put(w, label('eta', tipA.clone().lerp(tipP, 0.5).addScaledVector(K.n, -0.05), '<b>η</b> ilk düşey bileşeni', undefined, { near: true }), 'eta', 'angles');

  // iki kuzey arasındaki fark ve azimutlar
  put(w, tube(arcPts(P, K.no, K.northA, 0.34), PAL.theta, 0.005), 'northDiff', 'angles');
  put(w, label('northDiff', P.clone().addScaledVector(K.no.clone().add(K.northA).normalize(), 0.4), '<b>Δ</b> kuzey farkı (jeodezik ≠ astronomik)', undefined, { near: true }), 'northDiff', 'angles');
  const dv = K.I.clone().sub(P), hv = dv.clone().addScaledVector(up, -dv.dot(up));
  put(w, dashed([P, P.clone().add(hv)], PAL.astro, 0.9), 'azA', 'projections');
  const aa = arcAround(P, up, K.northA, -K.ast.az, 0.27);
  put(w, tube(aa, PAL.astro, 0.004), 'azA', 'angles');
  put(w, label('azA', aa[Math.floor(aa.length / 2)].clone().addScaledVector(up, 0.03), '<b>A</b> astronomik azimut (Astronomic azimuth)', undefined, { near: true }), 'azA', 'angles');
}
