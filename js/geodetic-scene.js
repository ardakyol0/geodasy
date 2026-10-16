// LGCS: elipsoit referanslı yerel jeodezik sistem.
import * as THREE from 'three';
import { PAL } from './data/concepts.js';
import { V, tube, dashed, arrow, dot, disk, arcPts, arcAround, cone, label, bracket } from './util.js';
import { put } from './earth.js';

const LA = 0.3, LZ = 0.42;

// Yerel eksenler + ufuk düzlemi (+ sol elli rozeti). Oluşturulan nesneleri döndürür (köprü animasyonu için).
export function localAxes(w, K, { ref = false } = {}) {
  const o = [];
  const add = (obj, cid, layer) => { o.push(put(w, obj, cid, layer)); };
  const P = K.K;
  add(arrow(P, K.no, LA, PAL.geo, 0.007), 'gx', 'localAxes');
  add(label('gx', P.clone().addScaledVector(K.no, LA + 0.03), '<b>x</b> jeodezik kuzey (Geodetic north)', undefined, { near: true }), 'gx', 'localAxes');
  add(arrow(P, K.n, LZ, PAL.geo, 0.011), 'gz', 'localAxes');
  add(label('gz', P.clone().addScaledVector(K.n, LZ + 0.03), '<b>z</b> elipsoit normali (Ellipsoid normal)', undefined, { near: true }), 'gz', 'localAxes');
  add(disk(P, K.n, 0.24, PAL.geo, ref ? 0.08 : 0.14), 'horizonG', 'planes');
  if (!ref) {
    add(arrow(P, K.e, LA, PAL.geo, 0.007), 'gy', 'localAxes');
    add(label('gy', P.clone().addScaledVector(K.e, LA + 0.03), '<b>y</b> doğu (East)', undefined, { near: true }), 'gy', 'localAxes');
    // sol elli rozeti: yukarıdan bakınca x→y saat yönü
    const arc = arcPts(P, K.no, K.e, 0.13);
    const g = new THREE.Group();
    g.add(tube(arc, PAL.geo, 0.0035));
    g.add(cone(arc[arc.length - 1], arc[arc.length - 1].clone().sub(arc[arc.length - 2]), PAL.geo, 0.012, 0.035));
    add(g, 'leftHand', 'localAxes');
    add(label('leftHand', P.clone().addScaledVector(K.no.clone().add(K.e), 0.115), '<b>↻</b> SOL ELLİ (Left-handed)', undefined, { near: true }), 'leftHand', 'localAxes');
  }
  return o;
}

// normal çizgisi, h / N / H ölçüleri
export function normalAndHeights(w, K, { h = true, NH = false } = {}) {
  put(w, tube([K.K, K.F], PAL.geo, 0.006), 'normal', 'heights');
  put(w, dot(K.F, PAL.geo, 0.014), 'foot', 'heights');
  put(w, label('foot', K.F.clone().addScaledVector(K.e, -0.05).addScaledVector(K.n, -0.04), '<b>K′</b> normalin elipsoitle kesişimi', undefined, { near: true }), 'foot', 'heights');
  if (h) {
    const off = K.e.clone().multiplyScalar(0.05);
    put(w, bracket(K.F, K.K, off, PAL.h), 'h', 'heights');
    put(w, label('h', K.F.clone().lerp(K.K, 0.5).add(off).addScaledVector(K.e, 0.02), '<b>h</b> elipsoidal yükseklik (Ellipsoidal height)', undefined, { near: true }), 'h', 'heights');
  }
  if (NH) {
    const off = K.e.clone().multiplyScalar(-0.05);
    put(w, dot(K.G, PAL.N, 0.014), 'undulation', 'heights');
    put(w, bracket(K.F, K.G, off, PAL.N), 'undulation', 'heights');
    put(w, label('undulation', K.F.clone().lerp(K.G, 0.5).add(off).addScaledVector(K.e, -0.02), '<b>N</b> jeoit ondülasyonu (Geoid undulation)', undefined, { near: true }), 'undulation', 'heights');
    put(w, bracket(K.G, K.K, off, PAL.H), 'orthometric', 'heights');
    put(w, label('orthometric', K.G.clone().lerp(K.K, 0.5).add(off).addScaledVector(K.e, -0.02), '<b>H</b> ortometrik yükseklik (Orthometric height)', undefined, { near: true }), 'orthometric', 'heights');
  }
}

export function buildGeodetic(w, K, S, { ref = false } = {}) {
  localAxes(w, K, { ref });
  normalAndHeights(w, K, { h: !ref, NH: !ref });
  // hedef nokta i, ışın, yatay izdüşüm, azimut ve yükseklik açısı
  const P = K.K, dv = K.I.clone().sub(P);
  const hv = dv.clone().addScaledVector(K.n, -dv.dot(K.n)), hd = hv.clone().normalize();
  const Ih = P.clone().add(hv);
  put(w, dot(K.I, PAL.K, 0.016), 'target', 'terrain');
  put(w, tube([K.I, K.I.clone().addScaledVector(K.n, 0.05)], PAL.K, 0.003), 'target', 'terrain');
  put(w, label('target', K.I.clone().addScaledVector(K.n, 0.07), '<b>i</b> hedef nokta (Target point)', undefined, { near: true }), 'target', 'terrain');
  put(w, tube([P, K.I], PAL.geo, 0.003, 0.9), 'dist', 'angles');
  put(w, dashed([P, Ih], PAL.geo, 0.9), 'alpha', 'projections');
  put(w, dashed([Ih, K.I], PAL.geo, 0.7), 'elev', 'projections');
  const R = ref ? 0.2 : 0.2;
  const ag = new THREE.Group();
  const aa = arcAround(P, K.n, K.no, -K.geo.az, R);
  ag.add(tube(aa, PAL.geo, 0.004));
  put(w, ag, 'alpha', 'angles');
  put(w, label('alpha', aa[Math.floor(aa.length / 2)].clone().addScaledVector(K.n, 0.02), '<b>α</b> jeodezik azimut (Geodetic azimuth)', undefined, { near: true }), 'alpha', 'angles');
  if (!ref) {
    put(w, tube(arcPts(P, hd, dv.clone().normalize(), 0.16), PAL.geo, 0.004), 'elev', 'angles');
    put(w, label('elev', P.clone().addScaledVector(hd.clone().add(dv.clone().normalize()).normalize(), 0.2), '<b>ε</b> yükseklik açısı (Elevation)', undefined, { near: true }), 'elev', 'angles');
    put(w, label('dist', P.clone().lerp(K.I, 0.6).addScaledVector(K.n, 0.03), '<b>r</b> mesafe (Distance)', undefined, { near: true }), 'dist', 'angles');
  }
}
