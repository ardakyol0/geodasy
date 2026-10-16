import { Viewport } from './viewport.js';
import { createUI } from './ui.js';
import { LAYERS, CONCEPTS, TOUR } from './data/concepts.js';
import { D2R } from './earth.js';

const MODES = { tgcs: ['tgcs'], lgcs: ['lgcs'], lacs: ['lacs'], split: ['lgcs', 'lacs'], all: ['all'], overlay: ['overlay'] };
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

const S = { phi: 40 * D2R, lam: 30 * D2R, g: 1.5, theta: 10, geocentric: false, bridgeT: -1, layers: Object.fromEntries(LAYERS.map(([id]) => [id, true])) };

const app = {
  S, vps: [], tab: 'tgcs', prevTab: 'tgcs', sync: true, hover: null, pinned: null, tour: null, quiz: null, run: false,

  effective() {
    if (this.quiz) return new Set([this.quiz.target]);
    if (this.hover) return new Set([this.hover]);
    return this.pinned;
  },
  applyHl() {
    const ids = this.effective();
    this.vps.forEach((v) => v.applyHighlight(ids));
    ui.setHighlight(ids);
    const first = this.hover ?? (this.pinned && this.pinned.size === 1 ? [...this.pinned][0] : null);
    if (!this.tour) ui.showInfo(first ?? this.lastInfo);
  },
  onHover() {}, // üzerine gelince hiçbir şey değişmez; yalnızca tıklama etkiler
  onPick(cid) {
    if (this.quiz) return;
    this.pinned = cid ? new Set([cid]) : null; this.lastInfo = cid || this.lastInfo; this.tour = null; ui.renderTour();
    this.applyHl(); ui.showPanel('info');
  },
  onDrag(phi, lam) {
    S.phi = Math.max(-75 * D2R, Math.min(75 * D2R, phi)); S.lam = lam; this.changed();
  },
  onCamera(vp) {
    if (!this.sync || this.vps.length !== 2 || this.syncing) return;
    this.syncing = true; this.vps.filter((v) => v !== vp).forEach((v) => v.copyCameraFrom(vp)); this.syncing = false;
  },
  changed() {
    if (this.pending) return;
    this.pending = true;
    requestAnimationFrame(() => {
      this.pending = false;
      this.vps.forEach((v) => v.rebuild());
      ui.refreshSummary(); ui.refreshLegend();
      if ($sec()) ui.drawSection();
    });
  },
  setTab(tab) {
    if (tab !== 'overlay') this.prevTab = tab;
    this.tab = tab; this.lastStage = undefined;
    this.vps.forEach((v) => { v.el.remove(); v.renderer.dispose(); });
    const views = document.getElementById('views');
    views.className = MODES[tab].length === 2 ? 'split' : '';
    this.vps = MODES[tab].map((m) => new Viewport(views, m, S, app));
    ui.refreshToolbar(); ui.refreshCards(); ui.refreshLegend(); this.applyHl();
    if (this.vps.length === 2) this.vps[1].copyCameraFrom(this.vps[0]);
  },
  buildLocal() { S.bridgeT = 0; this.run = true; },
  resetLocal() { S.bridgeT = -1; this.run = false; },

  startTour() { this.pinned = null; this.tour = 0; if (this.tab !== 'all') this.setTab('all'); this.gotoStep(0); },
  gotoStep(i) {
    this.tour = i; const s = TOUR[i];
    this.pinned = s.hl ? new Set(s.hl) : null; this.hover = null;
    if (s.bridge) this.buildLocal(); else if (i > 4) { S.bridgeT = 3; this.run = false; } else this.resetLocal();
    this.vps.forEach((v) => v.focus(s.view));
    this.applyHl(); ui.renderTour();
  },
  stopTour() { this.tour = null; this.pinned = null; this.applyHl(); ui.renderTour(); },

  startQuiz() { this.pinned = null; this.tour = null; this.quiz = { n: 0, ok: 0 }; document.body.classList.add('quiz'); this.nextQuiz(); },
  nextQuiz() {
    const pool = [...new Set(this.vps.flatMap((v) => [...v.cids]))].filter((c) => CONCEPTS[c] && !['bridge', 'K'].includes(c));
    const target = rnd(pool.filter((c) => c !== this.quiz.target));
    const options = [target];
    while (options.length < 4) { const c = rnd(pool); if (!options.includes(c)) options.push(c); }
    Object.assign(this.quiz, { target, options: options.sort(() => Math.random() - 0.5) });
    this.applyHl(); ui.renderQuiz(); ui.showInfo(null);
  },
  stopQuiz() { this.quiz = null; document.body.classList.remove('quiz'); this.applyHl(); ui.renderQuiz(); },
};
const $sec = () => document.getElementById('p-section').classList.contains('on');

const ui = createUI(app);
ui.renderTour(); ui.renderQuiz();
app.setTab('tgcs');
window.app = app; // hata ayıklama / ekran görüntüsü testleri için

let last = performance.now();
(function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (app.run && S.bridgeT >= 0) { S.bridgeT = Math.min(3, S.bridgeT + dt * 0.5); if (S.bridgeT >= 3) app.run = false; }
  app.vps.forEach((v) => v.render(dt, S.bridgeT));
  const st = app.vps.find((v) => v.world.bridge)?.stage;
  if (st !== undefined && st !== app.lastStage) { app.lastStage = st; ui.caption(st); }
  requestAnimationFrame(loop);
})(last);
