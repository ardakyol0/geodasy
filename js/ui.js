// Yan panel, araç çubuğu, legend, tur, quiz — tüm metinler concepts.js'den gelir.
import { UI, CONCEPTS, CARDS, BRIDGE, TABLE, TOUR, LAYERS, PAL } from './data/concepts.js';
import { renderSection, highlightSection } from './section.js';

const $ = (s, r = document) => r.querySelector(s);
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };

export function createUI(app) {
  const S = app.S;
  const ui = {};
  const pbody = $('#pbody');
  const sections = {};
  Object.entries(UI.panelTabs).forEach(([id, name]) => {
    const b = el(`<button data-p="${id}">${name}</button>`);
    b.onclick = () => ui.showPanel(id);
    $('#ptabs').appendChild(b);
    sections[id] = el(`<div class="psec" id="p-${id}"></div>`);
    pbody.appendChild(sections[id]);
  });
  ui.showPanel = (id) => {
    $('#ptabs').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.p === id));
    Object.entries(sections).forEach(([k, s]) => s.classList.toggle('on', k === id));
    if (id === 'section') ui.drawSection();
  };

  // ---------- Bilgi sekmesi ----------
  sections.info.innerHTML = `<div id="infoCard" class="card"></div><div id="modeCards"></div><div id="bridgeCard" class="card"></div><h3 class="sh">${UI.legend}</h3><div id="legend"></div>`;
  ui.showInfo = (cid) => {
    const c = CONCEPTS[cid], box = $('#infoCard');
    if (!c || app.quiz) { box.innerHTML = `<p class="muted">${app.quiz ? UI.quiz.hiddenLabels : UI.noSel}</p>`; return; }
    box.innerHTML = `<h3 style="color:${c.col}">${c.tr} <small>(${c.en})</small></h3>
      <div class="chips"><span class="sym" style="border-color:${c.col};color:${c.col}">${c.sym}</span><span class="sys">${UI.quizSystems[c.sys]}</span></div>
      <h4>Bu nedir?</h4><p>${c.what}</p><h4>Nasıl belirlenir / ölçülür?</h4><p>${c.how}</p><h4>Diğer sistemlerle ilişkisi</h4><p>${c.rel}</p>`;
  };
  ui.refreshCards = () => {
    const modes = new Set(app.vps.map((v) => v.mode));
    $('#modeCards').innerHTML = [...modes].flatMap((m) => CARDS[m] || []).map((c) => `<div class="card"><h4>${c.title}</h4>${c.html}</div>`).join('');
    const bc = $('#bridgeCard');
    const hasP = modes.has('tgcs') || modes.has('all');
    bc.style.display = hasP ? '' : 'none';
    if (hasP) {
      bc.innerHTML = `<h4>P noktası şu an…</h4><p id="pSummary"></p><h4>Global ↔ yerel</h4>${BRIDGE.compare}
        <div class="row"><button id="goLgcs" class="btn">${UI.toLgcs}</button><button id="goLacs" class="btn">${UI.toLacs}</button></div>`;
      $('#goLgcs').onclick = () => app.setTab('lgcs');
      $('#goLacs').onclick = () => app.setTab('lacs');
      ui.refreshSummary();
    }
  };
  ui.refreshSummary = () => {
    const s = $('#pSummary'); if (!s) return;
    const phi = S.phi * 180 / Math.PI, lam = S.lam * 180 / Math.PI;
    const hemi = phi >= 0 ? 'kuzey' : 'güney', dir = lam >= 0 ? 'doğu' : 'batı';
    const lat = Math.abs(phi) < 25 ? 'ekvatora yakın (Z bileşeni küçük)' : Math.abs(phi) < 55 ? 'orta enlemde' : 'kutba yakın (Z bileşeni büyük)';
    const lon = Math.abs(lam) < 25 ? 'Greenwich’e yakın (Y bileşeni küçük)' : Math.abs(lam) < 100 ? 'Greenwich’ten uzaklaşmış (X ve Y birlikte değişir)' : 'Greenwich’in karşı yarısına yakın';
    s.textContent = `P şu an ${hemi} yarımkürede, ${dir} boylamında, elipsoitin h kadar üstünde; ${lat}; ${lon}.`;
  };
  ui.refreshLegend = () => {
    const present = new Set(app.vps.flatMap((v) => [...v.cids]));
    const groups = ['TGCS', 'LGCS', 'LACS', 'ORTAK'];
    $('#legend').innerHTML = groups.map((g) => {
      const items = Object.entries(CONCEPTS).filter(([id, c]) => c.sys === g && present.has(id));
      if (!items.length) return '';
      return `<div class="lg"><div class="lgh">${UI.quizSystems[g]}</div>${items.map(([id, c]) =>
        `<div class="li" data-cid="${id}"><i style="background:${c.col}"></i><b>${c.sym}</b> ${c.tr}</div>`).join('')}</div>`;
    }).join('');
    $('#legend').querySelectorAll('.li').forEach((n) => {
      n.onmouseenter = () => app.onHover(n.dataset.cid);
      n.onmouseleave = () => app.onHover(null);
      n.onclick = () => app.onPick(n.dataset.cid);
    });
  };
  ui.setHighlight = (ids) => {
    $('#legend').querySelectorAll('.li').forEach((n) => { n.classList.toggle('dim', !!ids && !ids.has(n.dataset.cid)); n.classList.toggle('hl', !!ids && ids.has(n.dataset.cid)); });
    highlightSection($('#secBox'), ids);
  };

  // ---------- Katmanlar / ayarlar ----------
  sections.layers.innerHTML = `<h3 class="sh">${UI.layersTitle}</h3><div id="layerList"></div><h3 class="sh">${UI.settingsTitle}</h3>
    <label class="sl">${UI.sliders.g}<input id="sg" type="range" min="0" max="3" step="0.1" value="${S.g}"></label><p class="note">${UI.sliderNote.g}</p>
    <label class="sl">${UI.sliders.theta}<span id="stv"></span><input id="st" type="range" min="2" max="25" step="1" value="${S.theta}"></label><p class="note">${UI.sliderNote.theta}</p>
    <label class="ck"><input id="sgc" type="checkbox"> ${UI.geocentricToggle}</label><p class="note">${UI.geocentricNote}</p>`;
  $('#layerList').innerHTML = LAYERS.map(([id, n]) => `<label class="ck"><input type="checkbox" data-l="${id}" checked> ${n}</label>`).join('');
  $('#layerList').onchange = (e) => { S.layers[e.target.dataset.l] = e.target.checked; app.vps.forEach((v) => v.applyLayers()); };
  const tv = () => { $('#stv').textContent = ` ≈ ${S.theta}° gösterilen (gerçekte ≈ 0,003°)`; };
  tv();
  $('#sg').oninput = (e) => { S.g = +e.target.value; app.changed(); };
  $('#st').oninput = (e) => { S.theta = +e.target.value; tv(); app.changed(); };
  $('#sgc').onchange = (e) => { S.geocentric = e.target.checked; app.changed(); };

  // ---------- Kesit ----------
  sections.section.innerHTML = `<h3 class="sh">${UI.section.title}</h3><p class="note">${UI.section.note}</p><div id="secBox"></div>`;
  ui.drawSection = () => {
    const b = $('#secBox');
    renderSection(b, S, (cid) => app.onPick(cid));
    b.oncontextmenu = null;
    b.addEventListener('sec-hover', (e) => app.onHover(e.detail), { once: false });
    highlightSection(b, app.effective());
  };

  // ---------- Tablo ----------
  sections.table.innerHTML = `<table class="tbl"><thead><tr>${TABLE.head.map((h, i) => `<th class="c${i}">${h}</th>`).join('')}</tr></thead><tbody>${
    TABLE.rows.map((r) => `<tr>${r.map((c, i) => (i ? `<td class="c${i}">${c}</td>` : `<th>${c}</th>`)).join('')}</tr>`).join('')}</tbody></table>`;

  // ---------- Tur ----------
  sections.tour.innerHTML = `<div id="tourBox"></div>`;
  ui.renderTour = () => {
    const b = $('#tourBox'), t = app.tour;
    if (t === null) { b.innerHTML = `<p>9-11 adımlık rehberli tur: Dünya’nın merkezinden yerel sistemlere kadar. Her adımda kamera ilgili bölgeye gider.</p><button class="btn pri" id="tStart">${UI.tour.start}</button>`; $('#tStart').onclick = () => app.startTour(); return; }
    const s = TOUR[t];
    b.innerHTML = `<div class="step">${UI.tour.stepOf} ${t + 1} / ${TOUR.length}</div><h3>${s.title}</h3><p>${s.text}</p>
      <div class="row"><button class="btn" id="tPrev" ${t === 0 ? 'disabled' : ''}>${UI.tour.prev}</button><button class="btn pri" id="tNext" ${t === TOUR.length - 1 ? 'disabled' : ''}>${UI.tour.next}</button><button class="btn" id="tStop">${UI.tour.stop}</button></div>`;
    $('#tPrev').onclick = () => app.gotoStep(t - 1); $('#tNext').onclick = () => app.gotoStep(t + 1); $('#tStop').onclick = () => app.stopTour();
  };

  // ---------- Quiz ----------
  sections.quiz.innerHTML = `<div id="quizBox"></div>`;
  ui.renderQuiz = () => {
    const b = $('#quizBox'), q = app.quiz;
    if (!q) { b.innerHTML = `<p>Sahnede bir öğe vurgulanır; adını ve hangi sisteme ait olduğunu seçersiniz. Etiketler gizlenir.</p><button class="btn pri" id="qStart">${UI.quiz.start}</button>`; $('#qStart').onclick = () => app.startQuiz(); return; }
    const opts = q.options.map((id) => `<label class="ck"><input type="radio" name="qn" value="${id}"> ${CONCEPTS[id].tr} <small>(${CONCEPTS[id].en})</small></label>`).join('');
    const sys = Object.entries(UI.quizSystems).map(([k, n]) => `<label class="ck"><input type="radio" name="qs" value="${k}"> ${n}</label>`).join('');
    b.innerHTML = `<div class="step">${UI.quiz.score}: ${q.ok} / ${q.n}</div><h4>${UI.quiz.q1}</h4>${opts}<h4>${UI.quiz.q2}</h4>${sys}
      <div class="row"><button class="btn pri" id="qCheck">${UI.quiz.check}</button><button class="btn" id="qNext" style="display:none">${UI.quiz.next}</button><button class="btn" id="qStop">${UI.quiz.stop}</button></div><div id="qFb"></div>`;
    $('#qCheck').onclick = () => {
      const n = $('input[name=qn]:checked', b)?.value, s = $('input[name=qs]:checked', b)?.value;
      if (!n || !s) { $('#qFb').innerHTML = '<p class="bad">Önce her iki soruyu da yanıtlayın.</p>'; return; }
      const c = CONCEPTS[q.target], okN = n === q.target, okS = s === c.sys;
      q.n++; if (okN && okS) q.ok++;
      $('#qFb').innerHTML = `<p class="${okN ? 'good' : 'bad'}">${okN ? 'Ad doğru.' : `Ad yanlış: doğrusu “${c.tr} (${c.en})”.`}</p>
        <p class="${okS ? 'good' : 'bad'}">${okS ? 'Sistem doğru.' : `Sistem yanlış: bu öğe “${UI.quizSystems[c.sys]}” grubuna girer.`}</p><p class="note">${c.what}</p>`;
      $('#qCheck').style.display = 'none'; $('#qNext').style.display = '';
    };
    $('#qNext').onclick = () => app.nextQuiz(); $('#qStop').onclick = () => app.stopQuiz();
  };

  // ---------- Üst sekmeler ve araç çubuğu ----------
  const tabs = $('#tabs');
  Object.entries(UI.tabs).forEach(([id, n]) => { const b = el(`<button data-t="${id}">${n}</button>`); b.onclick = () => app.setTab(id); tabs.appendChild(b); });
  ui.refreshToolbar = () => {
    tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.t === app.tab));
    const hasP = app.vps.some((v) => v.mode === 'tgcs' || v.mode === 'all');
    const split = app.vps.length === 2;
    const canCmp = false;
    $('#toolbar').innerHTML = `${hasP ? `<button class="btn pri" id="bBuild">${UI.buildLocal}</button><button class="btn" id="bReset">${UI.resetLocal}</button><span id="bCap" class="cap"></span>` : ''}
      ${split ? `<label class="ck"><input id="bSync" type="checkbox" ${app.sync ? 'checked' : ''}> ${UI.sync}</label>` : ''}
      ${canCmp ? `<button class="btn" id="bCmp">${app.tab === 'overlay' ? UI.compareOff : UI.compare}</button>` : ''}`;
    $('#bBuild')?.addEventListener('click', () => app.buildLocal());
    $('#bReset')?.addEventListener('click', () => app.resetLocal());
    $('#bSync')?.addEventListener('change', (e) => { app.sync = e.target.checked; });
    $('#bCmp')?.addEventListener('click', () => app.setTab(app.tab === 'overlay' ? app.prevTab : 'overlay'));
  };
  ui.caption = (stage) => { const c = $('#bCap'); if (c) c.textContent = stage < 0 ? '' : BRIDGE.captions[stage]; };

  ui.showPanel('info');
  return ui;
}
