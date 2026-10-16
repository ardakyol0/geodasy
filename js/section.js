// 2B meridyen kesiti: K'dan geçen meridyen düzleminin yandan şematik görünüşü (SVG).
import { PAL, CONCEPTS } from './data/concepts.js';

export function renderSection(el, S, onPick) {
  const th = S.theta * Math.PI / 180, xi = 0.8 * th;
  const kx = 190, yF = 225;             // K'nın altındaki elipsoit noktası
  const Npx = 34 + S.g * 8, Hpx = 36;
  const yG = yF - Npx, yK = yG - Hpx;
  const sl = Math.tan(-xi * 1.6);       // jeoit eğimi (kesitte görünür olsun diye biraz abartılı)
  const geoPath = [];
  for (let dx = -170; dx <= 170; dx += 10) geoPath.push(`${kx + dx},${(yG + sl * dx + 5 * (1 - Math.cos(0.03 * dx))).toFixed(1)}`);
  const terr = [];
  for (let dx = -170; dx <= 170; dx += 10) {
    const g = yG + sl * dx + 5 * (1 - Math.cos(0.03 * dx));
    terr.push(`${kx + dx},${(g - Hpx - (dx === 0 ? 0 : 10 * Math.sin(dx / 22) - 10 * Math.sin(0))).toFixed(1)}`);
  }
  const L = 70, dxp = Math.sin(xi * 1.6) * L, dyp = Math.cos(xi * 1.6) * L; // çekül, normalden ξ kadar sapar
  const g = (cid, inner) => `<g data-cid="${cid}" class="sg">${inner}</g>`;
  const txt = (x, y, t, c, a = 'start') => `<text x="${x}" y="${y}" fill="${c}" text-anchor="${a}" font-size="12" font-weight="600">${t}</text>`;
  const px = kx + dxp, py = yK - dyp;
  const thetaArc = `M ${kx} ${yK - 44} A 44 44 0 0 ${dxp >= 0 ? 1 : 0} ${kx + 44 * Math.sin(xi * 1.6)} ${yK - 44 * Math.cos(xi * 1.6)}`;
  // φ küçük inset
  const ox = 56, oy = 270;
  const phi = 0.8, rr = 38;
  const kxi = ox + rr * Math.cos(phi), kyi = oy - rr * 0.82 * Math.sin(phi) * 1.0;
  el.innerHTML = `<svg viewBox="0 0 380 300" class="sec">
    ${g('ellipsoid', `<path d="M10 ${yF + 18} Q ${kx} ${yF - 12} 370 ${yF + 18}" fill="none" stroke="${PAL.ellipsoid}" stroke-width="3"/>${txt(14, yF + 36, 'elipsoit', PAL.ellipsoid)}`)}
    ${g('geoid', `<polyline points="${geoPath.join(' ')}" fill="none" stroke="${PAL.geoid}" stroke-width="2.5" stroke-dasharray="5 4"/>${txt(300, yG - 8, 'jeoit', PAL.geoid)}`)}
    ${g('terrain', `<polyline points="${terr.join(' ')}" fill="none" stroke="${PAL.terrain}" stroke-width="3"/>${txt(300, yK - 14, 'arazi', PAL.terrain)}`)}
    ${g('normal', `<line x1="${kx}" y1="${yK}" x2="${kx}" y2="${yF}" stroke="${PAL.geo}" stroke-width="2.5"/><line x1="${kx}" y1="${yK}" x2="${kx}" y2="${yK - L}" stroke="${PAL.geo}" stroke-width="2.5" stroke-dasharray="4 3"/>${txt(kx - 6, yK - L - 4, 'normal', PAL.geo, 'end')}`)}
    ${g('plumb', `<line x1="${kx}" y1="${yK}" x2="${px}" y2="${py}" stroke="${PAL.astro}" stroke-width="2.5"/><line x1="${kx}" y1="${yK}" x2="${kx - dxp * 0.5}" y2="${yK + dyp * 0.5}" stroke="${PAL.astro}" stroke-width="2.5"/>${txt(px + 6, py - 2, 'çekül', PAL.astro)}`)}
    ${g('theta', `<path d="${thetaArc}" fill="none" stroke="${PAL.theta}" stroke-width="3"/>${txt(kx + 14, yK - 52, 'θ', PAL.theta)}`)}
    ${g('h', `<line x1="${kx + 30}" y1="${yK}" x2="${kx + 30}" y2="${yF}" stroke="#fff" stroke-width="2"/><line x1="${kx + 25}" y1="${yK}" x2="${kx + 35}" y2="${yK}" stroke="#fff"/><line x1="${kx + 25}" y1="${yF}" x2="${kx + 35}" y2="${yF}" stroke="#fff"/>${txt(kx + 38, (yK + yF) / 2 + 4, 'h', '#fff')}`)}
    ${g('undulation', `<line x1="${kx - 30}" y1="${yG}" x2="${kx - 30}" y2="${yF}" stroke="${PAL.N}" stroke-width="2"/>${txt(kx - 40, (yG + yF) / 2 + 4, 'N', PAL.N, 'end')}`)}
    ${g('orthometric', `<line x1="${kx - 30}" y1="${yK}" x2="${kx - 30}" y2="${yG}" stroke="${PAL.H}" stroke-width="2"/>${txt(kx - 40, (yK + yG) / 2 + 4, 'H', PAL.H, 'end')}`)}
    ${g('K', `<circle cx="${kx}" cy="${yK}" r="6" fill="${PAL.K}"/>${txt(kx + 10, yK + 16, 'K', PAL.K)}`)}
    ${g('phi', `<line x1="${ox - 6}" y1="${oy}" x2="${ox + 70}" y2="${oy}" stroke="${PAL.plane}" stroke-width="1.5"/>
      <path d="M ${ox} ${oy} m ${rr} 0 A ${rr} ${rr * 0.82} 0 0 0 ${ox} ${oy - rr * 0.82}" fill="none" stroke="${PAL.ellipsoid}" stroke-width="1.5"/>
      <line x1="${kxi - 18 * Math.cos(phi)}" y1="${kyi + 18 * Math.sin(phi)}" x2="${kxi + 12 * Math.cos(phi)}" y2="${kyi - 12 * Math.sin(phi)}" stroke="${PAL.phi}" stroke-width="2"/>
      <path d="M ${ox + 30} ${oy} A 26 26 0 0 0 ${ox + 30 - 26 * (1 - Math.cos(phi))} ${oy - 26 * Math.sin(phi)}" fill="none" stroke="${PAL.phi}" stroke-width="2" transform="translate(-6 0)"/>
      ${txt(ox + 32, oy - 8, 'φ', PAL.phi)}${txt(ox + 8, oy + 14, 'ekvator · meridyen', PAL.plane)}`)}
  </svg>
  <p class="note">${'Kesit; ölçekli değildir. θ ve N abartılmıştır.'}</p>`;
  el.querySelectorAll('[data-cid]').forEach((n) => {
    n.addEventListener('click', () => onPick(n.dataset.cid));
    n.addEventListener('mouseenter', () => el.dispatchEvent(new CustomEvent('sec-hover', { detail: n.dataset.cid })));
    n.addEventListener('mouseleave', () => el.dispatchEvent(new CustomEvent('sec-hover', { detail: null })));
  });
}

export function highlightSection(el, ids) {
  el.querySelectorAll('.sg').forEach((n) => {
    n.classList.toggle('dim', !!ids && !ids.has(n.dataset.cid));
    n.classList.toggle('hl', !!ids && ids.has(n.dataset.cid));
  });
}
