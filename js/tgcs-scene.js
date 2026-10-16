// TGCS: P'nin konum vektörü, X/Y/Z bileşen kutusu, h ve "yerel sistemi kur" köprüsü.
import * as THREE from 'three';
import { PAL, BRIDGE } from './data/concepts.js';
import { V, tube, dashed, arrow, disk, label } from './util.js';
import { put, northV, eastV, nrm } from './earth.js';
import { localAxes, normalAndHeights } from './geodetic-scene.js';

export function buildTGCS(w, K, S, mode) {
  const P = K.K, { x: X, y: Y, z: Z } = P;
  put(w, arrow(V(), P.clone().normalize(), P.length(), PAL.vec, 0.006), 'posvec', 'globalAxes');
  put(w, label('posvec', P.clone().multiplyScalar(0.55).add(V(0, 0, 0.05)), '<b>OP</b> konum vektörü (Position vector)'), 'posvec', 'globalAxes');
  const c = { o: V(), x: V(X, 0, 0), y: V(0, Y, 0), z: V(0, 0, Z), xy: V(X, Y, 0), xz: V(X, 0, Z), yz: V(0, Y, Z), p: P };
  const comps = [
    ['compX', PAL.X, [c.o, c.x], [[c.y, c.xy], [c.z, c.xz], [c.yz, c.p]], 'X'],
    ['compY', PAL.Y, [c.o, c.y], [[c.x, c.xy], [c.z, c.yz], [c.xz, c.p]], 'Y'],
    ['compZ', PAL.Z, [c.o, c.z], [[c.x, c.xz], [c.y, c.yz], [c.xy, c.p]], 'Z'],
  ];
  comps.forEach(([cid, col, axis, edges, s]) => {
    put(w, tube(axis, col, 0.011, 0.95), cid, 'projections');
    edges.forEach((e) => put(w, dashed(e, col, 0.8), cid, 'projections'));
    const mid = axis[0].clone().lerp(axis[1], 0.5);
    put(w, label(cid, mid.add(s === 'Z' ? V(0.04, 0, 0) : V(0, 0, 0.05)), `<b>${s}</b> bileşeni (${s} component)`), cid, 'projections');
  });
  if (mode === 'tgcs') normalAndHeights(w, K, { h: true, NH: false });
}

// Yerel sistemi kurma animasyonu. t: <0 gizli, 0..3 animasyon, >=3 bitti.
export function buildBridge(w, K, mode) {
  const L = 0.4, ghost = new THREE.Group(), yG = new THREE.Group();
  const cols = [PAL.X, PAL.Y, PAL.Z];
  ghost.add(arrow(V(), V(1, 0, 0), L, cols[0], 0.008));
  yG.add(arrow(V(), V(0, 1, 0), L, cols[1], 0.008));
  ghost.add(yG);
  ghost.add(arrow(V(), V(0, 0, 1), L, cols[2], 0.008));
  [['X′', V(L + 0.03, 0, 0)], ['Z′', V(0, 0, L + 0.03)]].forEach(([t, p]) => ghost.add(label('bridge', p, `<b>${t}</b>`)));
  const yl = label('bridge', V(0, L + 0.03, 0), '<b>Y′</b>'); yG.add(yl);
  put(w, ghost, 'bridge', 'localAxes');
  const final = mode === 'all' ? [] : localAxes(w, K, {});
  const m = new THREE.Matrix4().makeBasis(K.no, K.e.clone().negate(), K.n); // x→kuzey, y→batı, z→yukarı (sağ elli)
  const qL = new THREE.Quaternion().setFromRotationMatrix(m), qI = new THREE.Quaternion();
  const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  let last = null;
  return {
    update(t) {
      ghost.position.lerpVectors(V(), K.K, ease(t));
      ghost.quaternion.slerpQuaternions(qI, qL, ease(t - 1));
      yG.rotation.z = Math.PI * ease(t - 2);
      const stage = t < 0 ? -1 : t < 1 ? 1 : t < 2 ? 2 : t < 3 ? 3 : 4;
      const gv = t >= 0 && t < 3, fv = t >= 3;
      ghost.userData.bridgeVis = gv;
      final.forEach((o) => { o.userData.bridgeVis = fv; });
      const key = `${gv}${fv}`;
      const changed = key !== last; last = key;
      return { stage, changed };
    },
  };
}
