const D = AFCAT_DATA;
const SUBJ_COLORS = { English: '#6FA8E0', Maths: '#F2A93C', Reasoning: '#5FD98A', GK: '#E86B5C' };
const isDark = true;

function fmt1(n) { return (Math.round(n * 10) / 10).toFixed(1); }

/* ---------- HERO STATS ---------- */
function buildHeroStats() {
  const c = D.corpus_stats;
  const items = [
    { num: c.total_papers, lbl: 'PAPERS ANALYSED' },
    { num: c.real_exam_questions.toLocaleString(), lbl: 'REAL EXAM QUESTIONS' },
    { num: c.model_paper_questions, lbl: 'MODEL PAPER QUESTIONS' },
    { num: '2021–2026', lbl: 'COVERAGE WINDOW' },
  ];
  const el = document.getElementById('hero-stats');
  el.innerHTML = items.map(i => `<div class="stat-tile"><span class="num">${i.num}</span><span class="lbl">${i.lbl}</span></div>`).join('');
}

/* ---------- FLIGHTSTRIP ---------- */
function buildFlightstrip() {
  const track = document.getElementById('flightstrip-track');
  const rows = D.subject_timeline;
  track.innerHTML = rows.map(r => {
    const segs = ['English', 'Maths', 'Reasoning', 'GK'].map(s =>
      `<div class="fs-seg" style="height:${r[s]}%; background:${SUBJ_COLORS[s]}"></div>`
    ).join('');
    const tip = `${r.paper} · Eng ${fmt1(r.English)}% · Math ${fmt1(r.Maths)}% · Reas ${fmt1(r.Reasoning)}% · GK ${fmt1(r.GK)}%`;
    return `<div class="flightstrip-bar">${segs}<div class="fs-tooltip">${tip}</div></div>`;
  }).join('');
  const legend = document.getElementById('flightstrip-legend');
  legend.innerHTML = Object.entries(SUBJ_COLORS).map(([k, v]) =>
    `<div class="leg-item"><span class="leg-swatch" style="background:${v}"></span>${k}</div>`
  ).join('');
}

/* ---------- TIMELINE CHART ---------- */
function buildTimelineChart() {
  const rows = D.subject_timeline;
  const labels = rows.map(r => r.paper.replace('AFCAT ', ''));
  const ctx = document.getElementById('chart-timeline');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: ['English', 'Maths', 'Reasoning', 'GK'].map(s => ({
        label: s,
        data: rows.map(r => r[s]),
        borderColor: SUBJ_COLORS[s],
        backgroundColor: SUBJ_COLORS[s],
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.25,
        fill: false,
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#131C30', borderColor: 'rgba(140,160,200,0.3)', borderWidth: 1,
          titleColor: '#E7E7DE', bodyColor: '#E7E7DE',
          callbacks: { label: (c) => ` ${c.dataset.label}: ${fmt1(c.parsed.y)}%` }
        }
      },
      scales: {
        x: { ticks: { color: '#8891A4', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(140,160,200,0.08)' } },
        y: { ticks: { color: '#8891A4', font: { family: 'JetBrains Mono', size: 10 }, callback: v => v + '%' }, grid: { color: 'rgba(140,160,200,0.08)' }, min: 0 }
      }
    }
  });
}

/* ---------- TOPICS TABS + CHART ---------- */
let topicsChart = null;
function buildTopicsSection() {
  const tabsEl = document.getElementById('subject-tabs');
  const subjects = ['English', 'Maths', 'Reasoning', 'GK'];
  tabsEl.innerHTML = subjects.map((s, i) => `<button class="tab-btn ${i === 0 ? 'active' : ''}" data-subj="${s}">${s}</button>`).join('');
  tabsEl.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tabsEl.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTopicsChart(btn.dataset.subj);
    });
  });
  renderTopicsChart(subjects[0]);
}

function renderTopicsChart(subject) {
  const data = D.topics_by_subject[subject].slice(0, 9);
  const labels = data.map(d => d.topic);
  const early = data.map(d => d.pct_early);
  const recent = data.map(d => d.pct_recent);
  const ctx = document.getElementById('chart-topics');
  if (topicsChart) topicsChart.destroy();
  topicsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Early (2021-22)', data: early, backgroundColor: 'rgba(140,160,200,0.35)', borderRadius: 3 },
        { label: 'Recent (2025-26)', data: recent, backgroundColor: SUBJ_COLORS[subject], borderRadius: 3 },
      ]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#131C30', borderColor: 'rgba(140,160,200,0.3)', borderWidth: 1,
          titleColor: '#E7E7DE', bodyColor: '#E7E7DE',
          callbacks: { label: c => ` ${c.dataset.label}: ${fmt1(c.parsed.x)}%` }
        }
      },
      scales: {
        x: { ticks: { color: '#8891A4', font: { family: 'JetBrains Mono', size: 10 }, callback: v => v + '%' }, grid: { color: 'rgba(140,160,200,0.08)' } },
        y: { ticks: { color: '#E7E7DE', font: { family: 'Space Grotesk', size: 12 } }, grid: { display: false } }
      }
    }
  });
  const legendHtml = `<div style="display:flex;gap:16px;margin-top:10px;font-family:JetBrains Mono;font-size:11px;color:#8891A4">
    <span><span style="display:inline-block;width:9px;height:9px;background:rgba(140,160,200,0.35);border-radius:2px;margin-right:5px"></span>Early (2021-22)</span>
    <span><span style="display:inline-block;width:9px;height:9px;background:${SUBJ_COLORS[subject]};border-radius:2px;margin-right:5px"></span>Recent (2025-26)</span>
  </div>`;
  let legendContainer = document.getElementById('topics-legend');
  if (!legendContainer) {
    legendContainer = document.createElement('div');
    legendContainer.id = 'topics-legend';
    document.getElementById('chart-topics').closest('.chart-wrap').after(legendContainer);
  }
  legendContainer.innerHTML = legendHtml;
}

/* ---------- DIFFICULTY CHART ---------- */
function buildDifficultyChart() {
  const rows = D.difficulty_timeline;
  const labels = rows.map(r => r.paper.replace('AFCAT ', ''));
  const ctx = document.getElementById('chart-difficulty');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: ['English', 'Maths', 'Reasoning', 'GK'].map(s => ({
        label: s,
        data: rows.map(r => r[s]),
        borderColor: SUBJ_COLORS[s],
        backgroundColor: SUBJ_COLORS[s],
        borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, tension: 0.25, fill: false, spanGaps: true,
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#131C30', borderColor: 'rgba(140,160,200,0.3)', borderWidth: 1,
          titleColor: '#E7E7DE', bodyColor: '#E7E7DE',
          callbacks: { label: c => ` ${c.dataset.label}: ${Math.round(c.parsed.y)} chars avg` }
        }
      },
      scales: {
        x: { ticks: { color: '#8891A4', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(140,160,200,0.08)' } },
        y: { ticks: { color: '#8891A4', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(140,160,200,0.08)' } }
      }
    }
  });
}

/* ---------- MOVERS ---------- */
function buildMovers() {
  const risingEl = document.getElementById('rising-list');
  const fallingEl = document.getElementById('falling-list');
  risingEl.innerHTML = D.rising_topics.slice(0, 8).map(m => `
    <div class="mover-row">
      <span class="mover-topic">${m.topic}</span>
      <span class="mover-delta up">+${fmt1(m.delta)}pp</span>
    </div>`).join('');
  fallingEl.innerHTML = D.falling_topics.slice(0, 8).map(m => `
    <div class="mover-row">
      <span class="mover-topic">${m.topic}</span>
      <span class="mover-delta down">${fmt1(m.delta)}pp</span>
    </div>`).join('');
}

/* ---------- VANISHED ---------- */
function buildVanished() {
  const el = document.getElementById('vanished-list');
  if (D.vanished_topics.length === 0) {
    el.innerHTML = `<div class="vanished-row"><span class="topic">Nothing qualifies — every early-era topic still shows up at some rate in recent papers.</span></div>`;
    return;
  }
  el.innerHTML = D.vanished_topics.map(v => `
    <div class="vanished-row">
      <span class="topic">${v.topic}</span>
      <span class="stat">${fmt1(v.early_pct)}% early → <b>${fmt1(v.recent_pct)}%</b> recent</span>
    </div>`).join('');
}

/* ---------- LADDER ---------- */
function buildLadder() {
  const el = document.getElementById('ladder-list');
  const maxScore = D.priority_ladder[0].priority_score;
  el.innerHTML = D.priority_ladder.slice(0, 20).map(l => `
    <div class="ladder-row">
      <span class="ladder-rank">#${l.rank}</span>
      <span class="ladder-topic">${l.topic}</span>
      <div class="ladder-bar-wrap"><div class="ladder-bar" style="width:${(l.priority_score / maxScore * 100).toFixed(0)}%"></div></div>
      <span class="ladder-score">${fmt1(l.priority_score)}</span>
    </div>`).join('');
}

/* ---------- SESSION GRID ---------- */
function buildSessionGrid() {
  const sg = D.session_grid;
  const maxVal = Math.max(...Object.values(sg.subjects).flat());
  let html = '<table class="sgrid"><thead><tr><th>Subject</th>' + sg.papers.map(p => `<th>${p.replace('AFCAT ', '')}</th>`).join('') + '</tr></thead><tbody>';
  for (const subj of ['English', 'Maths', 'Reasoning', 'GK']) {
    html += `<tr><td class="subj-label">${subj}</td>`;
    sg.subjects[subj].forEach(v => {
      const intensity = v / maxVal;
      const bg = `rgba(242,169,60,${(intensity * 0.55).toFixed(2)})`;
      html += `<td class="cell" style="background:${bg}">${v}</td>`;
    });
    html += '</tr>';
  }
  html += '</tbody></table>';
  document.getElementById('session-grid').innerHTML = html;
}

/* ---------- FOCUS ---------- */
function buildFocus() {
  const yesEl = document.getElementById('focus-yes-list');
  const noEl = document.getElementById('focus-no-list');
  yesEl.innerHTML = D.focus_here.map(f => `
    <div class="focus-item">${f.topic}<span class="pct">${fmt1(f.recent_pct)}% of recent papers</span></div>`).join('');
  noEl.innerHTML = D.dont_focus_here.slice(0, 12).map(f => `
    <div class="focus-item">${f.topic}<span class="pct">${fmt1(f.recent_pct)}% recent</span></div>`).join('');
}

/* ---------- INIT ---------- */
buildHeroStats();
buildFlightstrip();
buildTimelineChart();
buildTopicsSection();
buildDifficultyChart();
buildMovers();
buildVanished();
buildLadder();
buildSessionGrid();
buildFocus();
