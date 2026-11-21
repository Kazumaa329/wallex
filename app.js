/* ============ Wallex — app.js ============ */
(() => {
'use strict';

/* ---------- Constants ---------- */
const KEY = 'wallex:v1';

const WALLETS = [
  { id: 'cash',     name: 'Cash',     icon: 'banknote',   color: '#16a34a' },
  { id: 'gcash',    name: 'GCash',    icon: 'smartphone', color: '#0a6cff', logo: 'logo-gcash.png' },
  { id: 'maya',     name: 'Maya',     icon: 'wallet',     color: '#059669', logo: 'logo-maya.png' },
  { id: 'maribank', name: 'MariBank', icon: 'landmark',   color: '#f97316', logo: 'logo-maribank.png' },
  { id: 'gotyme',   name: 'GoTyme',   icon: 'card',       color: '#0891b2', logo: 'logo-gotyme.png' },
  { id: 'landbank', name: 'LandBank', icon: 'building',   color: '#15803d', logo: 'logo-landbank.png' },
];

/* Default Categories (Sero + Wallex styling) */
const DEFAULT_EXPENSE_CATS = [
  { id: 'housing',   name: 'Housing',            icon: 'home',      color: '#b27c73', budget: 9000 },
  { id: 'food',      name: 'Food & Dining',      icon: 'coffee',    color: '#d29c42', budget: 4000 },
  { id: 'groceries', name: 'Groceries',          icon: 'bag',       color: '#489b6e', budget: 3500 },
  { id: 'commute',   name: 'Transport',          icon: 'bus',       color: '#4078a6', budget: 2000 },
  { id: 'bills',     name: 'Home Bills',         icon: 'file-text', color: '#7a5697', budget: 3000 },
  { id: 'health',    name: 'Self-Care & Health', icon: 'heart',     color: '#2dd4bf', budget: 1500 },
  { id: 'shopping',  name: 'Shopping',           icon: 'bag',       color: '#cf5b5b', budget: 2500 },
  { id: 'utilities', name: 'Utilities',          icon: 'zap',       color: '#eab308', budget: 2000 },
  { id: 'gas',       name: 'Fuel / Gas',         icon: 'fuel',      color: '#d95d4e', budget: 1500 },
  { id: 'game',      name: 'Entertainment',      icon: 'gamepad',   color: '#6366f1', budget: 1000 },
  { id: 'other',     name: 'Other',              icon: 'package',   color: '#64748b', budget: 0 },
];

const DEFAULT_INCOME_CATS = [
  { id: 'salary',    name: 'Salary',             icon: 'briefcase', color: '#4ade80' },
  { id: 'freelance', name: 'Freelance',          icon: 'laptop',    color: '#2dd4bf' },
  { id: 'invest_inc',name: 'Investment',         icon: 'trend',     color: '#60a5fa' },
  { id: 'allowance', name: 'Allowance & Gifts',  icon: 'gift',      color: '#fbbf24' },
  { id: 'other_inc', name: 'Other Income',       icon: 'sparkles',  color: '#a78bfa' },
];

const AVAILABLE_ICONS = [
  'home', 'coffee', 'utensils', 'bag', 'bus', 'car', 'fuel', 'file-text',
  'heart', 'zap', 'gamepad', 'briefcase', 'laptop', 'gift', 'package',
  'banknote', 'smartphone', 'wallet', 'landmark', 'card', 'building',
  'sparkles', 'tag', 'target'
];

const AVAILABLE_COLORS = [
  '#b27c73', '#d95d4e', '#d29c42', '#489b6e', '#4ade80', '#2dd4bf',
  '#4078a6', '#60a5fa', '#eab308', '#7a5697', '#cf5b5b', '#64748b'
];

const GOAL_COLORS = ['#4ade80', '#2dd4bf', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'];

const TYPE_UI = {
  expense:  { save: 'Save expense',       wal: 'Paid from',   note: 'Note (optional)' },
  income:   { save: 'Save income',        wal: 'Deposit to',  note: 'Source / Note (e.g. Allowance, Pay)' },
  transfer: { save: 'Save transfer',      wal: 'From',        note: 'Note (optional)' },
  invest:   { save: 'Invest in DragonFi', wal: 'From',        note: 'Note (optional)' },
};
const TYPE_NAME = { expense: 'expense', income: 'income', transfer: 'transfer', invest: 'investment', goal: 'goal' };

/* ---------- Helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const r2 = n => Math.round(n * 100) / 100;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wallet = id => WALLETS.find(w => w.id === id);

function expenseCats() {
  return (S.categories && S.categories.expense && S.categories.expense.length)
    ? S.categories.expense
    : DEFAULT_EXPENSE_CATS;
}
function incomeCats() {
  return (S.categories && S.categories.income && S.categories.income.length)
    ? S.categories.income
    : DEFAULT_INCOME_CATS;
}

function cat(id, type = 'expense') {
  if (type === 'income') {
    const ic = incomeCats().find(c => c.id === id);
    if (ic) return ic;
  }
  const ec = expenseCats().find(c => c.id === id);
  if (ec) return ec;
  const ic = incomeCats().find(c => c.id === id);
  if (ic) return ic;
  return { id: id || 'other', name: id || 'Other', icon: 'package', color: '#64748b' };
}

const DRAGON_LOGO = 'logo-dragonfi.png';
const logoImg = src => `<img src="${src}" alt="" width="36" height="36" draggable="false">`;
const IC = n => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;

function fmt(n) {
  if (S.settings.hidden) return '₱••••';
  const a = Math.abs(n);
  const s = a.toLocaleString('en-PH', {
    minimumFractionDigits: Number.isInteger(r2(a)) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return (n < 0 ? '-' : '') + '₱' + s;
}
const short = n => S.settings.hidden ? '••' : n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(Math.round(n));
function num(str) {
  const s = String(str ?? '').replace(/[,₱\s]/g, '');
  if (s === '' || s === '-' || isNaN(s)) return null;
  return r2(parseFloat(s));
}
function niceDate(d) {
  const [y, m, dd] = d.split('-').map(Number);
  const dt = new Date(y, m - 1, dd);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const diff = Math.round((t - dt) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return dt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: dt.getFullYear() === t.getFullYear() ? undefined : 'numeric' });
}
const parts = s => s.split('-').map(Number);
const dateOf = s => { const [y, m, d] = parts(s); return new Date(y, m - 1, d); };
function daysBetween(a, b) {
  const [y1, m1, d1] = parts(a), [y2, m2, d2] = parts(b);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5);
}
function eachDay(from, to) {
  const out = [];
  for (let d = dateOf(from); ymd(d) <= to && out.length < 3700; d.setDate(d.getDate() + 1)) out.push(ymd(d));
  return out;
}

/* ---------- State & Persistence ---------- */
function defaults() {
  const w = {};
  WALLETS.forEach(x => (w[x.id] = 0));
  return {
    settings: {
      theme: 'dark',
      budget: 0,
      cycle: 'month',
      defaultWallet: 'cash',
      hidden: false,
      since: null,
      lastExport: null,
      userName: 'Sam',
    },
    categories: {
      expense: JSON.parse(JSON.stringify(DEFAULT_EXPENSE_CATS)),
      income: JSON.parse(JSON.stringify(DEFAULT_INCOME_CATS)),
    },
    wallets: w,
    dragon: { invested: 0, value: 0 },
    goals: [],
    txs: [],
  };
}

function load() {
  const base = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      const res = {
        settings: { ...base.settings, ...(d.settings || {}) },
        categories: {
          expense: Array.isArray(d.categories?.expense) && d.categories.expense.length ? d.categories.expense : base.categories.expense,
          income: Array.isArray(d.categories?.income) && d.categories.income.length ? d.categories.income : base.categories.income,
        },
        wallets: { ...base.wallets, ...(d.wallets || {}) },
        dragon: { ...base.dragon, ...(d.dragon || {}) },
        goals: Array.isArray(d.goals) ? d.goals : [],
        txs: Array.isArray(d.txs) ? d.txs : [],
      };
      // Ensure default categories exist if missing
      DEFAULT_EXPENSE_CATS.forEach(dc => {
        if (!res.categories.expense.some(c => c.id === dc.id)) res.categories.expense.push(dc);
      });
      DEFAULT_INCOME_CATS.forEach(dc => {
        if (!res.categories.income.some(c => c.id === dc.id)) res.categories.income.push(dc);
      });
      return res;
    }
  } catch (e) { console.warn('Wallex: could not read saved data', e); }
  return base;
}

let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Could not save. Storage is full or blocked'); }
}

/* ---------- Money Logic ---------- */
function apply(t, dir) {
  const a = t.amount * dir;
  if (t.type === 'expense') S.wallets[t.wallet] = r2(S.wallets[t.wallet] - a);
  else if (t.type === 'income') S.wallets[t.wallet] = r2(S.wallets[t.wallet] + a);
  else if (t.type === 'transfer') {
    S.wallets[t.wallet] = r2(S.wallets[t.wallet] - (t.amount + (t.fee || 0)) * dir);
    S.wallets[t.to]     = r2(S.wallets[t.to] + a);
  } else if (t.type === 'invest') {
    S.wallets[t.wallet] = r2(S.wallets[t.wallet] - a);
    S.dragon.invested = r2(S.dragon.invested + a);
    S.dragon.value    = r2(S.dragon.value + a);
  } else if (t.type === 'goal') {
    const g = S.goals.find(x => x.id === t.goalId);
    const sign = t.dir === 'in' ? 1 : -1;
    S.wallets[t.wallet] = r2(S.wallets[t.wallet] - sign * a);
    if (g) g.saved = r2(Math.max(0, g.saved + sign * a));
  }
}
const liquid = () => r2(WALLETS.reduce((s, w) => s + (S.wallets[w.id] || 0), 0));
const locked = () => r2(S.goals.reduce((s, g) => s + (g.saved || 0), 0));
const netWorth = () => r2(liquid() + locked() + S.dragon.value);

function monthIncome() {
  const m = today().slice(0, 7);
  return r2(S.txs.filter(t => t.type === 'income' && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0));
}
function monthRewards() {
  // Cashback / rewards / small incentives: transactions tagged allowance or specific note, or 45 sample
  const m = today().slice(0, 7);
  const inc = S.txs.filter(t => t.type === 'income' && (t.cat === 'allowance' || /reward|cashback/i.test(t.note || '')) && t.date.startsWith(m));
  return r2(inc.reduce((s, t) => s + t.amount, 0));
}

function cycle() {
  const n = new Date();
  if (S.settings.cycle === 'week') {
    const dow = (n.getDay() + 6) % 7;
    const s = new Date(n); s.setDate(n.getDate() - dow);
    const e = new Date(s); e.setDate(s.getDate() + 6);
    return { from: ymd(s), to: ymd(e), left: 7 - dow, label: 'this week' };
  }
  const dim = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
  const p = today().slice(0, 8);
  return { from: p + '01', to: p + pad(dim), left: dim - n.getDate() + 1, label: 'this month' };
}
const cycleSpent = c => r2(S.txs.filter(t => t.type === 'expense' && t.date >= c.from && t.date <= c.to).reduce((s, t) => s + t.amount, 0));
function dailyBudget() {
  const b = S.settings.budget || 0;
  if (S.settings.cycle === 'week') return b / 7;
  const n = new Date();
  return b / new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
}
const sortedTxs = () => [...S.txs].sort((a, b) => (b.date.localeCompare(a.date)) || ((b.ts || 0) - (a.ts || 0)));

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------- Theme ---------- */
function setTheme(t) {
  S.settings.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#0d1712' : '#f3f7f4');
  save();
  const av = $('#view-analytics');
  if (av && !av.hidden) renderAnalytics();
}

/* ---------- Sero Hero Card (Image 1) ---------- */
function renderHero() {
  $('#userGreeting').textContent = S.settings.userName || 'Sam';
  $('#net').textContent = fmt(netWorth());
  $('#hcIncome').textContent = fmt(monthIncome());
  const rew = monthRewards();
  $('#hcRewards').textContent = fmt(rew > 0 ? rew : 45.00);
  $('#hcLocked').textContent = fmt(locked() + S.dragon.value);

  // Eye icon state
  const eye = $('#eyeIcon use');
  if (eye) eye.setAttribute('href', S.settings.hidden ? '#i-eye-off' : '#i-eye');

  // Compatibility fields
  if ($('#liquid')) $('#liquid').textContent = fmt(liquid());
}

/* ---------- Sero SPENDING Section (Image 1 Centerpiece & Interactive Spinner) ---------- */
let spendingPeriod = 'month'; // 'day' | 'week' | 'month' | 'custom'
let spendingOffsetMonth = 0;
let activeSpendingCatId = null;

let ringRotation = 0; // manual rotation angle in degrees
let spinVelocity = 0;
let isDraggingWheel = false;
let animFrameId = null;
let activeSlicesData = [];

function getSpendingDateRange() {
  const now = new Date();
  if (spendingPeriod === 'day') {
    return { from: today(), to: today(), label: niceDate(today()) };
  }
  if (spendingPeriod === 'week') {
    const s = new Date(now);
    s.setDate(now.getDate() - 6);
    return { from: ymd(s), to: today(), label: 'Last 7 days' };
  }
  if (spendingPeriod === 'month') {
    const target = new Date(now.getFullYear(), now.getMonth() + spendingOffsetMonth, 1);
    const y = target.getFullYear(), m = target.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    const from = `${y}-${pad(m + 1)}-01`;
    const to = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
    const label = target.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    return { from, to, label };
  }
  // custom / all
  let from = today();
  for (const t of S.txs) if (t.type === 'expense' && t.date < from) from = t.date;
  return { from, to: today(), label: 'All time' };
}

function updateCenterCard(item, total) {
  if (!item) return;
  const tot = total || activeSlicesData.reduce((s, x) => s + x.amount, 0);
  const pct = tot > 0 ? Math.round((item.amount / tot) * 100) : 0;
  $('#scIcon').innerHTML = `<svg class="ic" style="stroke:#ffffff!important;fill:none!important;color:#ffffff!important;stroke-width:2.2px"><use href="#i-${item.cat.icon}"/></svg>`;
  $('#scIcon').style.background = item.cat.color;
  $('#scName').textContent = item.cat.name;
  $('#scPct').textContent = `${pct}%`;
  $('#scAmt').textContent = fmt(item.amount);
  $('#scAddBtn').textContent = '+ add new';
  $('#scSeeBtn').style.display = '';
}

function updateWheelActiveSlice() {
  if (!activeSlicesData.length) return;
  let bestSlice = null;
  let minDiff = 9999;

  activeSlicesData.forEach(item => {
    let eff = (item.midA + ringRotation) % 360;
    if (eff < 0) eff += 360;
    let diff = Math.min(eff, 360 - eff);
    if (diff < minDiff) {
      minDiff = diff;
      bestSlice = item;
    }
  });

  if (bestSlice && bestSlice.cat.id !== activeSpendingCatId) {
    activeSpendingCatId = bestSlice.cat.id;
    updateCenterCard(bestSlice);
    $$('.sero-arc-path').forEach(p => {
      const isSel = p.dataset.scat === activeSpendingCatId;
      p.classList.toggle('active', isSel);
      p.setAttribute('stroke-width', isSel ? '34' : '28');
    });
  }
}

function spinToCategory(catId) {
  const item = activeSlicesData.find(x => x.cat.id === catId);
  if (!item) return;

  cancelAnimationFrame(animFrameId);
  let target = -item.midA;
  let diff = (target - ringRotation) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  let startRot = ringRotation;
  let startTime = performance.now();
  let duration = Math.min(500, Math.max(260, Math.abs(diff) * 2.8));

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function step(now) {
    let elapsed = now - startTime;
    let progress = Math.min(1, elapsed / duration);
    ringRotation = startRot + diff * easeOutCubic(progress);
    const rot = $('#seroRotator');
    if (rot) rot.setAttribute('transform', `rotate(${ringRotation.toFixed(2)} 170 170)`);
    updateWheelActiveSlice();
    if (progress < 1) {
      animFrameId = requestAnimationFrame(step);
    } else {
      ringRotation = ringRotation % 360;
      if (rot) rot.setAttribute('transform', `rotate(${ringRotation.toFixed(2)} 170 170)`);
      updateWheelActiveSlice();
    }
  }
  animFrameId = requestAnimationFrame(step);
}

function setupWheelInteraction() {
  const stage = $('#seroChartStage');
  if (!stage || stage._wheelInitialized) return;
  stage._wheelInitialized = true;

  let lastAngle = 0;
  let lastTime = 0;
  let totalMoved = 0;

  function getPointerAngle(e) {
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
  }

  function setRotationAttr(deg) {
    const rot = $('#seroRotator');
    if (rot) rot.setAttribute('transform', `rotate(${deg.toFixed(2)} 170 170)`);
  }

  function snapToNearest() {
    if (!activeSlicesData.length) return;
    let best = null;
    let minD = 9999;
    activeSlicesData.forEach(item => {
      let eff = (item.midA + ringRotation) % 360;
      if (eff < 0) eff += 360;
      let diff = Math.min(eff, 360 - eff);
      if (diff < minD) {
        minD = diff;
        best = item;
      }
    });
    if (best) spinToCategory(best.cat.id);
  }

  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('#seroCenterCard button')) return;
    if (e.button != null && e.button !== 0) return;

    cancelAnimationFrame(animFrameId);
    isDraggingWheel = true;
    totalMoved = 0;
    lastAngle = getPointerAngle(e);
    lastTime = Date.now();
    spinVelocity = 0;
    stage.classList.add('grabbing');
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });

  stage.addEventListener('pointermove', e => {
    if (!isDraggingWheel) return;
    const nowAngle = getPointerAngle(e);
    let delta = nowAngle - lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    totalMoved += Math.abs(delta);
    ringRotation = (ringRotation + delta) % 360;
    setRotationAttr(ringRotation);

    const now = Date.now();
    const dt = Math.max(1, now - lastTime);
    spinVelocity = (delta / dt) * 16;
    lastTime = now;
    lastAngle = nowAngle;

    updateWheelActiveSlice();
  });

  const onPointerUp = e => {
    if (!isDraggingWheel) return;
    isDraggingWheel = false;
    stage.classList.remove('grabbing');
    try { stage.releasePointerCapture(e.pointerId); } catch (_) {}

    // Tap detected
    if (totalMoved < 5) {
      const arc = e.target.closest('.sero-arc-path');
      if (arc && arc.dataset.scat) {
        spinToCategory(arc.dataset.scat);
        return;
      }
    }

    // Momentum physics spin
    if (Math.abs(spinVelocity) > 0.4) {
      function momentumLoop() {
        if (isDraggingWheel) return;
        if (Math.abs(spinVelocity) < 0.05) {
          snapToNearest();
          return;
        }
        ringRotation = (ringRotation + spinVelocity) % 360;
        setRotationAttr(ringRotation);
        updateWheelActiveSlice();
        spinVelocity *= 0.94; // friction
        animFrameId = requestAnimationFrame(momentumLoop);
      }
      animFrameId = requestAnimationFrame(momentumLoop);
    } else {
      snapToNearest();
    }
  };

  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerUp);

  // Mouse wheel / trackpad scroll to spin
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    cancelAnimationFrame(animFrameId);
    const delta = (e.deltaY > 0 ? 8 : -8);
    ringRotation = (ringRotation + delta) % 360;
    setRotationAttr(ringRotation);
    updateWheelActiveSlice();
  }, { passive: false });
}

function renderSpendingSection() {
  $$('#spendingPills button').forEach(b => b.classList.toggle('active', b.dataset.sp === spendingPeriod));
  const { from, to, label } = getSpendingDateRange();
  $('#spMonthLabel').textContent = label;

  const exps = S.txs.filter(t => t.type === 'expense' && t.date >= from && t.date <= to);
  const total = r2(exps.reduce((s, t) => s + t.amount, 0));
  $('#spendingBig').textContent = fmt(total);

  // Group by category
  const byCat = {};
  exps.forEach(t => {
    byCat[t.cat] = r2((byCat[t.cat] || 0) + t.amount);
  });

  const activeCats = Object.keys(byCat)
    .map(cid => ({ cat: cat(cid, 'expense'), amount: byCat[cid] }))
    .filter(x => x.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  $('#spendingCount').textContent = `${activeCats.length} categor${activeCats.length === 1 ? 'y' : 'ies'}`;

  const svg = $('#seroSvgRing');
  const cx = 170, cy = 170, R = 105, W = 28;

  if (!activeCats.length || total === 0) {
    activeSlicesData = [];
    let emptyArcs = '';
    const nSeg = 8;
    const segSpan = 360 / nSeg;
    const gap = 14;
    for (let i = 0; i < nSeg; i++) {
      const a1 = i * segSpan + gap / 2;
      const a2 = (i + 1) * segSpan - gap / 2;
      const r1 = (a1 * Math.PI) / 180, r2 = (a2 * Math.PI) / 180;
      const x1 = cx + R * Math.cos(r1), y1 = cy + R * Math.sin(r1);
      const x2 = cx + R * Math.cos(r2), y2 = cy + R * Math.sin(r2);
      emptyArcs += `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" stroke="var(--surface3)" stroke-width="${W}" stroke-linecap="round" fill="none" opacity="0.6"/>`;
    }
    svg.innerHTML = `<g id="seroRotator" transform="rotate(${ringRotation.toFixed(2)} 170 170)">${emptyArcs}</g>`;

    $('#scIcon').innerHTML = `<svg class="ic" style="stroke:#ffffff!important;fill:none!important;color:#ffffff!important;stroke-width:2.2px"><use href="#i-home"/></svg>`;
    $('#scIcon').style.background = 'var(--surface2)';
    $('#scName').textContent = 'No Spending';
    $('#scPct').textContent = '0%';
    $('#scAmt').textContent = fmt(0);
    $('#scAddBtn').textContent = '+ add new';
    $('#scSeeBtn').style.display = 'none';
    setupWheelInteraction();
    return;
  }

  $('#scSeeBtn').style.display = '';

  let selCat = activeCats.find(x => x.cat.id === activeSpendingCatId) || activeCats[0];
  activeSpendingCatId = selCat.cat.id;

  const N = activeCats.length;
  let pathsHtml = '';
  let iconsHtml = '';
  activeSlicesData = [];

  if (N === 1) {
    const c = activeCats[0];
    const a1 = 12, a2 = 348;
    const r1 = (a1 * Math.PI) / 180, r2 = (a2 * Math.PI) / 180;
    const x1 = cx + R * Math.cos(r1), y1 = cy + R * Math.sin(r1);
    const x2 = cx + R * Math.cos(r2), y2 = cy + R * Math.sin(r2);
    pathsHtml += `<path class="sero-arc-path active" data-scat="${c.cat.id}" d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 1 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" stroke="${c.cat.color}" stroke-width="${W + 6}" stroke-linecap="round" fill="none"/>`;
    iconsHtml += `<g class="sero-arc-icon-g" transform="translate(${cx}, ${cy - R}) rotate(90)" style="fill:none;stroke:#ffffff;color:#ffffff">
      <use href="#i-${c.cat.icon}" x="-9" y="-9" width="18" height="18" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
    activeSlicesData.push({ cat: c.cat, amount: c.amount, startA: a1, endA: a2, midA: 0 });
  } else {
    const gapAngle = Math.max(14, Math.min(24, 360 / (N * 2.2)));
    const totalGap = N * gapAngle;
    const usableAngle = Math.max(120, 360 - totalGap);

    let curAngle = gapAngle / 2;
    activeCats.forEach(item => {
      const frac = item.amount / total;
      const span = Math.max(8, frac * usableAngle);
      const startA = curAngle;
      const endA = startA + span;
      const midA = (startA + endA) / 2;

      const r1 = (startA * Math.PI) / 180, r2 = (endA * Math.PI) / 180, rm = (midA * Math.PI) / 180;
      const x1 = cx + R * Math.cos(r1), y1 = cy + R * Math.sin(r1);
      const x2 = cx + R * Math.cos(r2), y2 = cy + R * Math.sin(r2);
      const largeArc = span > 180 ? 1 : 0;
      const isSel = item.cat.id === selCat.cat.id;

      pathsHtml += `<path class="sero-arc-path ${isSel ? 'active' : ''}" data-scat="${item.cat.id}" d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" stroke="${item.cat.color}" stroke-width="${isSel ? W + 6 : W}" stroke-linecap="round" fill="none"/>`;

      const ix = cx + R * Math.cos(rm);
      const iy = cy + R * Math.sin(rm);
      iconsHtml += `<g class="sero-arc-icon-g" transform="translate(${ix.toFixed(2)}, ${iy.toFixed(2)}) rotate(90)" style="fill:none;stroke:#ffffff;color:#ffffff">
        <use href="#i-${item.cat.icon}" x="-9" y="-9" width="18" height="18" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`;

      activeSlicesData.push({ cat: item.cat, amount: item.amount, startA, endA, midA });
      curAngle = endA + gapAngle;
    });
  }

  svg.innerHTML = `<g id="seroRotator" transform="rotate(${ringRotation.toFixed(2)} 170 170)">${pathsHtml}${iconsHtml}</g>`;

  updateCenterCard(selCat, total);
  setupWheelInteraction();
}

/* ---------- Budgets Section (Image 2) ---------- */
function renderBudgets() {
  const box = $('#budgetsBox');
  if (!box) return;

  const m = today().slice(0, 7);
  const exps = S.txs.filter(t => t.type === 'expense' && t.date.startsWith(m));
  const byCat = {};
  exps.forEach(t => (byCat[t.cat] = r2((byCat[t.cat] || 0) + t.amount)));

  // Categories with budget > 0
  const budgeted = expenseCats().filter(c => c.budget && c.budget > 0);

  if (!budgeted.length) {
    box.innerHTML = `
      <div class="card empty" style="grid-column: 1 / -1; margin:0; padding:18px;">
        <div><b>No category budgets set</b></div>
        <div class="lbl" style="margin-top:4px">Tap <b>Manage &rarr;</b> to assign monthly budgets to Food, Transport, Housing and more.</div>
      </div>`;
    return;
  }

  box.innerHTML = budgeted.map(c => {
    const spent = byCat[c.id] || 0;
    const pct = Math.round((spent / c.budget) * 100);
    const fillPct = Math.min(100, pct);
    const color = pct >= 100 ? '#f87171' : pct >= 75 ? '#fbbf24' : '#4ade80';

    return `
      <div class="budget-card" data-bcat="${c.id}" role="button" tabindex="0">
        <div class="budget-card-head">
          <div class="budget-card-ic" style="background:${c.color}">${IC(c.icon)}</div>
          <div class="budget-card-name">${esc(c.name)}</div>
          <span class="budget-card-pct" style="color:${color}">${pct}%</span>
        </div>
        <div class="budget-card-amt"><b>${fmt(spent)}</b> / ${fmt(c.budget)}</div>
        <div class="budget-track">
          <div class="budget-fill" style="width:${fillPct}%;background:${color}"></div>
        </div>
      </div>`;
  }).join('');
}

/* ---------- Category Manager View (Image 3) ---------- */
function renderCategoryManager() {
  const expBox = $('#expenseCatItems');
  const incBox = $('#incomeCatItems');
  if (!expBox || !incBox) return;

  // Expense List
  expBox.innerHTML = expenseCats().map(c => `
    <div class="cat-mgr-row" data-cat-row="${c.id}" data-cat-type="expense">
      <div class="cat-mgr-circle-ic" style="background:${c.color}">${IC(c.icon)}</div>
      <div class="cat-mgr-row-name">${esc(c.name)}</div>
      ${c.budget > 0 ? `<span class="cat-mgr-row-budget">${fmt(c.budget)}/mo</span>` : ''}
      <button class="cat-mgr-kebab" data-cat-kebab="${c.id}" data-cat-type="expense" aria-label="Category options"><svg class="ic"><use href="#i-more"/></svg></button>
    </div>`).join('');

  // Income List
  incBox.innerHTML = incomeCats().map(c => `
    <div class="cat-mgr-row" data-cat-row="${c.id}" data-cat-type="income">
      <div class="cat-mgr-circle-ic" style="background:${c.color}">${IC(c.icon)}</div>
      <div class="cat-mgr-row-name">${esc(c.name)}</div>
      <button class="cat-mgr-kebab" data-cat-kebab="${c.id}" data-cat-type="income" aria-label="Category options"><svg class="ic"><use href="#i-more"/></svg></button>
    </div>`).join('');
}

/* Category Modal (Add / Edit) */
let catModalData = null; // { mode: 'new' | 'edit', type: 'expense' | 'income', id: null }

function openCategoryModal(mode, type = 'expense', id = null) {
  catModalData = { mode, type, id };
  const overlay = $('#catModalOverlay');
  const title = $('#catModalTitle');
  const nameInp = $('#catNameInp');
  const budgetField = $('#catBudgetField');
  const budgetInp = $('#catBudgetInp');
  const delBtn = $('#deleteCatBtn');

  title.textContent = mode === 'new' ? 'New Category' : 'Edit Category';
  delBtn.hidden = mode === 'new';

  let currentCat = null;
  if (mode === 'edit' && id) {
    currentCat = (type === 'income' ? incomeCats() : expenseCats()).find(c => c.id === id);
  }

  nameInp.value = currentCat ? currentCat.name : '';
  budgetInp.value = (currentCat && currentCat.budget) ? currentCat.budget : '';
  budgetField.hidden = type === 'income';

  // Type Seg
  $$('#catTypeSeg button').forEach(b => {
    b.classList.toggle('active', b.dataset.ctype === type);
  });

  // Render Icon Picker
  const selIcon = currentCat ? currentCat.icon : 'coffee';
  $('#catIconPicker').innerHTML = AVAILABLE_ICONS.map(ic => `
    <button type="button" class="ip-btn ${ic === selIcon ? 'active' : ''}" data-ic="${ic}">
      ${IC(ic)}
    </button>`).join('');

  // Render Color Picker
  const selColor = currentCat ? currentCat.color : AVAILABLE_COLORS[0];
  $('#catColorPicker').innerHTML = AVAILABLE_COLORS.map(c => `
    <button type="button" class="cp-btn ${c === selColor ? 'active' : ''}" data-cp="${c}" style="background:${c}"></button>`).join('');

  overlay.hidden = false;
  setTimeout(() => nameInp.focus(), 60);
}

function closeCategoryModal() {
  $('#catModalOverlay').hidden = true;
  catModalData = null;
}

function saveCategoryModal() {
  if (!catModalData) return;
  const name = $('#catNameInp').value.trim();
  if (!name) { toast('Please enter a category name'); $('#catNameInp').focus(); return; }

  const selIcBtn = $('#catIconPicker .ip-btn.active');
  const selCpBtn = $('#catColorPicker .cp-btn.active');
  const icon = selIcBtn ? selIcBtn.dataset.ic : 'coffee';
  const color = selCpBtn ? selCpBtn.dataset.cp : AVAILABLE_COLORS[0];
  const budget = catModalData.type === 'expense' ? num($('#catBudgetInp').value || '0') : 0;

  const targetArr = catModalData.type === 'income' ? S.categories.income : S.categories.expense;

  if (catModalData.mode === 'new') {
    const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16) + '_' + uid().slice(0, 4);
    const newCat = { id: newId, name, icon, color };
    if (catModalData.type === 'expense') newCat.budget = budget || 0;
    targetArr.push(newCat);
    toast('Category created');
  } else {
    const existing = targetArr.find(c => c.id === catModalData.id);
    if (existing) {
      existing.name = name;
      existing.icon = icon;
      existing.color = color;
      if (catModalData.type === 'expense') existing.budget = budget || 0;
      toast('Category updated');
    }
  }

  save();
  closeCategoryModal();
  renderCategoryManager();
  buildCats();
  renderHome();
}

function deleteCategoryModal() {
  if (!catModalData || catModalData.mode !== 'edit' || !catModalData.id) return;
  const id = catModalData.id;
  const type = catModalData.type;
  closeCategoryModal();

  openConfirm('Delete category?', 'Transactions in this category will be preserved as “Other”.', 'Delete category', () => {
    if (type === 'income') {
      S.categories.income = S.categories.income.filter(c => c.id !== id);
    } else {
      S.categories.expense = S.categories.expense.filter(c => c.id !== id);
      S.txs.forEach(t => { if (t.cat === id) t.cat = 'other'; });
    }
    save();
    renderCategoryManager();
    buildCats();
    renderHome();
    toast('Category deleted');
  });
}

/* Category Kebab Menu */
let kebabCat = null;
function openCatMenu(id, type) {
  const c = cat(id, type);
  kebabCat = { id, type, c };
  $('#catMenuHead').innerHTML = `
    <div class="cat-mgr-circle-ic" style="background:${c.color}">${IC(c.icon)}</div>
    <div>
      <div style="font-weight:700;font-size:15px">${esc(c.name)}</div>
      <div class="lbl">${type === 'income' ? 'Income Category' : 'Expense Category'}</div>
    </div>`;
  $('#catMenuOverlay').hidden = false;
}
function closeCatMenu() {
  $('#catMenuOverlay').hidden = true;
  kebabCat = null;
}

/* ---------- Safe-to-Spend & Wallets ---------- */
function renderSafe() {
  const budget = S.settings.budget || 0;
  const c = cycle();
  const spent = cycleSpent(c);
  const remaining = r2(budget - spent);
  const pct = budget > 0 ? Math.min(100, Math.max(0, (spent / budget) * 100)) : 0;
  const color = pct >= 100 ? 'var(--red)' : pct >= 75 ? 'var(--amber)' : 'var(--green)';
  const pace = budget > 0 ? Math.max(0, remaining) / c.left : 0;

  const arc = 'M10 62 A50 50 0 0 1 110 62';
  const gauge = `
    <div class="gauge-wrap">
      <svg class="gauge" viewBox="0 0 120 70" aria-hidden="true">
        <path class="g-bg" d="${arc}" pathLength="100"/>
        <path class="g-fg" d="${arc}" pathLength="100" style="stroke:${color};stroke-dasharray:${pct.toFixed(1)} 100"/>
      </svg>
      <div class="gauge-pct">${budget > 0 ? Math.round(pct) + '% used' : 'No budget'}</div>
    </div>`;

  let body, meta;
  if (budget > 0) {
    body = `
      <div class="lbl">Daily Safe-to-Spend</div>
      <div class="safe-num" style="color:${remaining < 0 ? 'var(--red)' : 'var(--text)'}">${fmt(r2(pace))}</div>
      <div class="lbl">per day, ${c.label}</div>`;
    meta = `
      <span>Left <b>${fmt(remaining)}</b></span>
      <span>Spent <b>${fmt(spent)}</b></span>
      <span><b>${c.left}</b> day${c.left === 1 ? '' : 's'} left</span>
      ${remaining < 0 ? '<span class="neg">Over budget</span>' : ''}`;
  } else {
    body = `
      <div class="lbl">Daily Safe-to-Spend</div>
      <div class="safe-num">—</div>`;
    meta = '<span>Set a budget limit in <b>Settings</b> to see your daily pace.</span>';
  }
  $('#safe').innerHTML = `<div class="safe-top"><div class="safe-main">${body}</div>${gauge}</div><div class="safe-meta">${meta}</div>`;
}

function renderWallets() {
  $('#wallets').innerHTML = WALLETS.map(w => `
    <div class="wcard">
      <div class="wbadge${w.logo ? ' logo' : ''}" style="background:${w.color}">${w.logo ? logoImg(w.logo) : IC(w.icon)}</div>
      <div class="winfo">
        <div class="wname">${w.name}</div>
        <div class="wbal ${S.wallets[w.id] < 0 ? 'neg' : ''}">${fmt(S.wallets[w.id])}</div>
      </div>
      <button class="icon-btn" data-rec="${w.id}" aria-label="Reconcile ${w.name}" title="Reconcile">${IC('pencil')}</button>
    </div>`).join('');
}

function ringHtml(pct, color) {
  const p = Math.max(0, Math.min(100, pct));
  return `<div class="ring"><svg viewBox="0 0 64 64" aria-hidden="true">
    <circle class="r-bg" cx="32" cy="32" r="27"/>
    <circle class="r-fg" cx="32" cy="32" r="27" pathLength="100" transform="rotate(-90 32 32)" style="stroke:${color};stroke-dasharray:${p.toFixed(1)} 100;stroke-linecap:${p > 0 ? 'round' : 'butt'}"/>
  </svg><span class="ring-pct">${Math.round(pct)}%</span></div>`;
}

let goalsExpanded = false;
function renderGoals() {
  const box = $('#goals');
  const btn = $('#goalsAll');
  btn.hidden = S.goals.length < 2;
  btn.textContent = goalsExpanded ? 'Show less' : 'See all →';
  box.classList.toggle('expanded', goalsExpanded);
  if (!S.goals.length) {
    box.innerHTML = `<div class="card goal-empty" style="width:100%;display:flex;align-items:center;gap:12px;margin:0">
      <div style="font-size:28px">${IC('target')}</div>
      <div style="flex:1"><div style="font-weight:700">No savings goals yet</div><div class="lbl">Set aside money for emergencies or future buys.</div></div>
      <button class="btn primary" data-goal-new>+ Add Goal</button></div>`;
    return;
  }
  box.innerHTML = S.goals.map(g => {
    const p = g.target > 0 ? (g.saved / g.target) * 100 : 0;
    return `<button class="gcard" data-goal="${g.id}" aria-label="${esc(g.name)}, ${Math.round(p)} percent saved">
      ${ringHtml(p, g.color)}
      <div class="gname">${esc(g.name)}</div>
      <div class="gamt"><b>${fmt(g.saved)}</b> / ${fmt(g.target)}</div>
    </button>`;
  }).join('') + `<button class="gcard add" data-goal-new aria-label="Add goal">${IC('plus')}<span>New goal</span></button>`;
}

function renderDragon() {
  const { invested, value } = S.dragon;
  const gain = r2(value - invested);
  const pct = invested > 0 ? (gain / invested) * 100 : 0;
  const cls = gain > 0 ? 'up' : gain < 0 ? 'down' : 'flat';
  const sign = gain > 0 ? '+' : gain < 0 ? '-' : '';
  const badge = `${sign}${fmt(Math.abs(gain))} (${sign}${Math.abs(pct).toFixed(1)}%)`;
  $('#dragon').innerHTML = `
    <div class="dragon-head">
      <div class="wbadge logo">${logoImg(DRAGON_LOGO)}</div>
      <div class="winfo"><div class="wname">DragonFi</div><span class="badge ${cls}">${badge}</span></div>
      <button class="icon-btn" data-edit-dragon aria-label="Edit DragonFi values" title="Edit market value">${IC('pencil')}</button>
    </div>
    <div class="dragon-stats">
      <div><div class="lbl">Total Invested</div><div class="mid">${fmt(invested)}</div></div>
      <div><div class="lbl">Current Market Value</div><div class="mid">${fmt(value)}</div></div>
    </div>`;
}

/* ---------- Transactions Rows & Filters (Image 2) ---------- */
function txView(t) {
  if (t.type === 'expense') {
    const c = cat(t.cat, 'expense');
    const custom = t.cat === 'other' && t.label;
    return { icon: IC(c.icon), color: c.color, title: custom ? t.label : c.name, tag: custom ? 'Other' : '', amt: '-' + fmt(t.amount), cls: 'neg', wal: wallet(t.wallet)?.name || '' };
  }
  if (t.type === 'income') {
    const c = cat(t.cat, 'income');
    return { icon: IC(c.icon || 'in'), color: c.color || '#4ade80', title: t.note || c.name || 'Income', tag: c.name || '', amt: '+' + fmt(t.amount), cls: 'pos', wal: wallet(t.wallet)?.name || '' };
  }
  if (t.type === 'transfer') {
    return { icon: IC('swap'), color: '#60a5fa', title: `${wallet(t.wallet)?.name} → ${wallet(t.to)?.name}`, tag: t.fee ? 'Fee ' + fmt(t.fee) : '', amt: fmt(t.amount), cls: '', wal: 'Transfer' };
  }
  if (t.type === 'goal') {
    const name = t.goalName || 'goal';
    return { icon: IC('target'), color: '#2dd4bf', title: (t.dir === 'in' ? 'Deposit to ' : 'Withdraw from ') + name, tag: '', amt: fmt(t.amount), cls: '', wal: wallet(t.wallet)?.name || '' };
  }
  return { icon: IC('trend'), color: '#2dd4bf', title: 'DragonFi investment', tag: '', amt: fmt(t.amount), cls: '', wal: wallet(t.wallet)?.name || '' };
}

function txRow(t) {
  const v = txView(t);
  return `
    <div class="tx" data-tx="${t.id}" role="button" tabindex="0" aria-label="Options for ${esc(v.title)}">
      <div class="tx-ic" style="--c:${v.color}">${v.icon}</div>
      <div class="tx-main">
        <div class="tx-title">${esc(v.title)}</div>
        <div class="tx-sub"><span class="chip">${esc(v.wal)}</span>${v.tag ? `<span>${esc(v.tag)}</span>` : ''}${t.note ? `<span>· ${esc(t.note)}</span>` : ''}</div>
      </div>
      <div class="tx-amt ${v.cls}">${v.amt}</div>
    </div>`;
}

const act = { q: '', f: 'all', limit: 40 };
function matches(t) {
  const f = act.f;
  if (f === 'income' && t.type !== 'income') return false;
  if (f === 'expenses' && t.type !== 'expense') return false;
  if (f === 'savings' && !(t.type === 'goal' || t.type === 'invest')) return false;
  if (f === 'transfers' && t.type !== 'transfer') return false;
  const q = act.q.trim().toLowerCase().replace(/,/g, '');
  if (!q) return true;
  const v = txView(t);
  const hay = [v.title, v.wal, v.tag, t.note, t.label, TYPE_NAME[t.type], t.cat && cat(t.cat).name, t.to && wallet(t.to)?.name, t.goalName, String(t.amount), t.date]
    .filter(Boolean).join(' ').toLowerCase();
  return q.split(/\s+/).every(w => hay.includes(w));
}

function renderRecent() {
  $$('#filters button').forEach(b => b.classList.toggle('active', b.dataset.flt === act.f));
  const all = sortedTxs();
  const box = $('#recent');
  if (!all.length) {
    box.innerHTML = `<div class="empty">No transactions yet.<br>Tap <b>+</b> to add your first one.</div>`;
    return;
  }
  const list = all.filter(matches);
  if (!list.length) {
    box.innerHTML = `<div class="empty">No matching transactions${act.q.trim() ? ` for “${esc(act.q.trim())}”` : ''}.</div>`;
    return;
  }
  const shown = list.slice(0, act.limit);
  let last = '', html = '';
  for (const t of shown) {
    if (t.date !== last) { html += `<div class="date-sep">${niceDate(t.date)}</div>`; last = t.date; }
    html += txRow(t);
  }
  if (list.length > shown.length) html += `<button class="btn more" data-more style="width:100%;margin-top:10px">Show ${Math.min(40, list.length - shown.length)} more</button>`;
  box.innerHTML = html;
}

function renderHome() {
  renderHero();
  renderSpendingSection();
  renderBudgets();
  renderGoals();
  renderWallets();
  renderDragon();
  renderSafe();
  renderRecent();
  if (!$('#view-calendar').hidden) { renderCalendar(); renderDayDetail(); }
  if (!$('#view-analytics').hidden) renderAnalytics();
  if (!$('#view-categories').hidden) renderCategoryManager();
}

/* ---------- Settings ---------- */
function renderSettings() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const wk = S.settings.cycle === 'week';
  $('#settingsBox').innerHTML = `
    <div class="set-row">
      <div><b>Your name</b><small>Shown in the greeting</small></div>
      <div class="inp" style="width:150px"><input id="setUserName" value="${esc(S.settings.userName || 'Sam')}" placeholder="Sam" aria-label="User name"></div>
    </div>
    <div class="set-row">
      <div><b>Dark forest mode</b><small>Sero-inspired dark green palette</small></div>
      <label class="switch"><input type="checkbox" id="setDark" ${dark ? 'checked' : ''} aria-label="Dark mode"><span></span></label>
    </div>
    <div class="set-row">
      <div><b>Hide balances</b><small>Masks peso amounts in the app as ₱••••</small></div>
      <label class="switch"><input type="checkbox" id="setHide" ${S.settings.hidden ? 'checked' : ''} aria-label="Hide balances"><span></span></label>
    </div>
    <div class="set-row">
      <div><b>Budget cycle</b><small>How often your budget pace resets</small></div>
      <div class="seg two" role="group" aria-label="Budget cycle">
        <button data-cycle="month" class="${wk ? '' : 'active'}">Monthly</button>
        <button data-cycle="week" class="${wk ? 'active' : ''}">Weekly</button>
      </div>
    </div>
    <div class="set-row">
      <div><b>${wk ? 'Weekly' : 'Monthly'} budget limit</b><small>Powers the Safe-to-Spend pace</small></div>
      <div class="inp" style="width:150px"><span>₱</span><input id="setBudget" inputmode="decimal" value="${S.settings.budget || ''}" placeholder="0" aria-label="Budget limit"></div>
    </div>
    <div class="set-row">
      <div><b>Default wallet</b><small>Pre-selected in the + modal</small></div>
      <select id="setWallet" class="input" style="width:150px" aria-label="Default wallet">
        ${WALLETS.map(w => `<option value="${w.id}" ${S.settings.defaultWallet === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
      </select>
    </div>
    <div class="set-row">
      <div><b>Category Manager</b><small>Manage income and expense categories</small></div>
      <button class="btn" data-nav="categories">Manage Categories &rarr;</button>
    </div>
    ${backupRows()}
    <div class="set-row">
      <div><b>Reset all</b><small>Erase every wallet, goal and transaction</small></div>
      <button class="btn danger" id="resetBtn">Reset all</button>
    </div>`;
}

/* ---------- Navigation ---------- */
const TITLES = { home: 'Home', categories: 'Categories', calendar: 'Calendar', analytics: 'Analytics', settings: 'Settings' };
function nav(view) {
  $$('.view').forEach(v => (v.hidden = v.id !== 'view-' + view));
  $$('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === view));
  $('#viewTitle').textContent = TITLES[view] || 'Wallex';
  closeDay();
  if (view === 'settings') renderSettings();
  if (view === 'categories') renderCategoryManager();
  if (view === 'calendar') { renderCalendar(); renderDayDetail(); }
  if (view === 'analytics') renderAnalytics();
  window.scrollTo(0, 0);
}

/* ---------- Quick-Add Modal (Add + Edit) ---------- */
let M = null; // { type, cat, editId }

function walletOptions() { return WALLETS.map(w => `<option value="${w.id}">${w.name}</option>`).join(''); }
function buildSelects() {
  $('#walSel').innerHTML = walletOptions();
  $('#toSel').innerHTML = walletOptions();
}

function buildCats() {
  const isInc = M && M.type === 'income';
  const list = isInc ? incomeCats() : expenseCats();
  $('#cats').innerHTML = list.map(c => `
    <button type="button" class="cat ${M && M.cat === c.id ? 'sel' : ''}" data-cat="${c.id}" style="--c:${c.color}">
      <span class="ci">${IC(c.icon)}</span><span>${esc(c.name)}</span>
    </button>`).join('');
}

function topCombos() {
  const map = new Map();
  for (const t of S.txs) {
    if (t.type !== 'expense') continue;
    const k = [t.cat, t.label || '', t.amount, t.wallet].join('|');
    const e = map.get(k) || { n: 0, last: 0, t };
    e.n++; e.last = Math.max(e.last, t.ts || 0); e.t = t;
    map.set(k, e);
  }
  return [...map.values()].sort((a, b) => b.n - a.n || b.last - a.last).slice(0, 3).map(e => e.t);
}
function renderCombos() {
  const combos = topCombos();
  const box = $('#combos');
  box.innerHTML = combos.map((t, i) => {
    const c = cat(t.cat, 'expense');
    const name = t.cat === 'other' && t.label ? esc(t.label) : c.name;
    return `<button type="button" class="combo" data-combo="${i}"><span class="cb-ic" style="color:${c.color}">${IC(c.icon)}</span>${name} ${fmt(t.amount)} • ${wallet(t.wallet)?.name}</button>`;
  }).join('');
  box._data = combos;
}
function syncFeeChips() {
  const v = num($('#fee').value || '0');
  $$('#feeChips button').forEach(b => b.classList.toggle('on', v !== null && +b.dataset.fee === v));
}

function setType(type) {
  M.type = type;
  $('#sheet').dataset.type = type;
  $('#typeTabs').classList.toggle('locked', !!M.editId);
  $$('#typeTabs button').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  $$('#sheet [data-show]').forEach(el => {
    el.hidden = !el.dataset.show.split(' ').includes(type);
  });
  if (M.editId || !($('#combos')._data || []).length) $('#combos').hidden = true;
  $('#other').hidden = !(type === 'expense' && M.cat === 'other');
  const ui = TYPE_UI[type];
  $('#walLabel').textContent = ui.wal;
  $('#note').placeholder = ui.note;
  $('#noteLabel').textContent = type === 'income' ? 'Source / Note' : 'Note (optional)';
  $('#saveBtn').textContent = M.editId ? 'Save changes' : ui.save;

  // Rebuild category chips for Expense vs Income
  buildCats();
}

function selectCat(id) {
  M.cat = id;
  $$('#cats .cat').forEach(b => b.classList.toggle('sel', b.dataset.cat === id));
  $('#other').hidden = !(M.type === 'expense' && id === 'other');
  if (id === 'other') setTimeout(() => $('#other').focus(), 30);
}

function openAdd(pref = {}) {
  M = { type: pref.type || 'expense', cat: pref.cat || null, editId: pref.editId || null };
  renderCombos();
  $('#amt').value = pref.amount != null ? pref.amount : '';
  $('#other').value = pref.label || '';
  $('#note').value = pref.note || '';
  $('#fee').value = pref.fee ? pref.fee : '';
  $('#date').value = pref.date || today();
  const w = pref.wallet || S.settings.defaultWallet || 'cash';
  $('#walSel').value = w;
  $('#toSel').value = pref.to || (WALLETS.find(x => x.id !== w) || WALLETS[0]).id;
  $('#overlay').hidden = false;
  document.body.style.overflow = 'hidden';
  setType(M.type);
  if (pref.cat) selectCat(pref.cat);
  syncFeeChips();
  setTimeout(() => { const a = $('#amt'); a.focus(); a.select(); }, 60);
}
function closeAdd() {
  $('#overlay').hidden = true;
  document.body.style.overflow = '';
}

function submitTx() {
  const type = M.type;
  const amount = num($('#amt').value);
  if (amount === null || amount <= 0) { toast('Enter an amount'); $('#amt').focus(); return; }
  const date = $('#date').value || today();
  const w = $('#walSel').value;
  const t = { id: uid(), ts: Date.now(), type, amount, wallet: w, date, note: $('#note').value.trim() };

  if (type === 'expense') {
    if (!M.cat) return toast('Pick a category');
    t.cat = M.cat;
    if (M.cat === 'other') {
      const label = $('#other').value.trim();
      if (!label) { toast('Tell me what it was'); $('#other').focus(); return; }
      t.label = label;
    }
  }
  if (type === 'income') {
    t.cat = M.cat || 'salary';
  }
  if (type === 'transfer') {
    t.to = $('#toSel').value;
    if (t.to === w) return toast('Pick two different wallets');
    const fee = num($('#fee').value || '0');
    if (fee === null || fee < 0) return toast('Invalid fee');
    t.fee = fee;
  }

  const old = M.editId && S.txs.find(x => x.id === M.editId);
  if (old) {
    apply(old, -1);
    const next = { ...t, id: old.id, ts: old.ts };
    S.txs = S.txs.map(x => (x.id === old.id ? next : x));
    apply(next, 1);
  } else {
    apply(t, 1);
    S.txs.push(t);
  }
  save();
  closeAdd();
  renderHome();
  toast(old ? 'Changes saved' : type === 'expense' ? 'Expense saved' : type === 'income' ? 'Income added' : type === 'transfer' ? 'Transfer saved' : 'Invested in DragonFi');
}

/* ---------- Transaction Options (Edit / Duplicate / Delete) ---------- */
let menuId = null;
function openMenu(id) {
  const t = S.txs.find(x => x.id === id);
  if (!t) return;
  menuId = id;
  const v = txView(t);
  $('#aHead').innerHTML = `
    <div class="tx-ic" style="--c:${v.color}">${v.icon}</div>
    <div class="tx-main"><div class="tx-title">${esc(v.title)}</div><div class="tx-sub">${niceDate(t.date)} · ${esc(v.wal)}</div></div>
    <div class="tx-amt ${v.cls}">${v.amt}</div>`;
  const editable = t.type !== 'goal';
  $('#aBtns').innerHTML =
    (editable ? `<button class="menu-btn" data-act="edit">${IC('pencil')}Edit</button>
                 <button class="menu-btn" data-act="dup">${IC('copy')}Duplicate</button>` : '') +
    `<button class="menu-btn danger" data-act="del">${IC('trash')}Delete</button>
     <button class="menu-btn" data-act="cancel">${IC('close')}Cancel</button>`;
  $('#aOverlay').hidden = false;
}
function closeMenu() { $('#aOverlay').hidden = true; menuId = null; }
function menuAction(a) {
  const t = S.txs.find(x => x.id === menuId);
  closeMenu();
  if (!t || a === 'cancel') return;
  if (a === 'edit') return openAdd({ ...t, editId: t.id });
  if (a === 'dup') return openAdd({ ...t, date: today() });
  if (a === 'del') {
    openConfirm('Delete transaction?', 'Wallet balances will be recalculated.', 'Delete', () => {
      apply(t, -1);
      S.txs = S.txs.filter(x => x.id !== t.id);
      save(); renderHome(); toast('Deleted');
    });
  }
}

/* ---------- Savings Goal Sheet ---------- */
let G = null; // { mode: 'new' | 'edit' | 'move', id, dir }
function openGoal(mode, id, dir) {
  G = { mode, id: id || null, dir: dir || 'in' };
  renderGoalSheet();
  $('#gOverlay').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeGoal() {
  $('#gOverlay').hidden = true;
  document.body.style.overflow = '';
  G = null;
}
function renderGoalSheet() {
  const box = $('#gSheet');
  const g = S.goals.find(x => x.id === G.id);
  if (G.mode !== 'new' && !g) return closeGoal();

  if (G.mode === 'move') {
    const p = g.target > 0 ? (g.saved / g.target) * 100 : 0;
    const inn = G.dir === 'in';
    box.dataset.type = inn ? 'income' : 'transfer';
    box.innerHTML = `
      <div class="sheet-head">
        <h3 class="sheet-title">Savings goal</h3>
        <button class="link-btn" data-gedit>Edit goal</button>
        <button class="icon-btn" data-gclose aria-label="Close">${IC('close')}</button>
      </div>
      <div class="sheet-body">
        <div class="g-sum" style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
          ${ringHtml(p, g.color)}
          <div><div class="gname">${esc(g.name)}</div>
            <div class="gamt"><b>${fmt(g.saved)}</b> / ${fmt(g.target)}</div>
            <div class="gamt">${fmt(Math.max(0, r2(g.target - g.saved)))} to go</div></div>
        </div>
        <div class="seg two" role="group" aria-label="Deposit or withdraw" style="margin-bottom:12px">
          <button data-gdir="in" class="${inn ? 'active' : ''}">Deposit</button>
          <button data-gdir="out" class="${inn ? '' : 'active'}">Withdraw</button>
        </div>
        <div class="amount-row"><span class="cur">₱</span><input id="gAmt" type="text" inputmode="decimal" placeholder="0" autocomplete="off" aria-label="Amount"></div>
        <label class="field"><span class="lbl">${inn ? 'From wallet' : 'To wallet'}</span><select id="gWal" class="input">${walletOptions()}</select></label>
      </div>
      <button class="save-btn" id="gSave">${inn ? 'Deposit to goal' : 'Withdraw to wallet'}</button>`;
    $('#gWal').value = S.settings.defaultWallet || 'cash';
    setTimeout(() => { const a = $('#gAmt'); if (a) a.focus(); }, 60);
    return;
  }

  const editing = G.mode === 'edit';
  box.dataset.type = 'invest';
  box.innerHTML = `
    <div class="sheet-head">
      <h3 class="sheet-title">${editing ? 'Edit goal' : 'New savings goal'}</h3>
      <button class="icon-btn" data-gclose aria-label="Close">${IC('close')}</button>
    </div>
    <div class="sheet-body">
      <label class="field"><span class="lbl">Goal name</span><input id="gName" class="input" maxlength="30" placeholder="e.g. Emergency Fund" value="${editing ? esc(g.name) : ''}" autocomplete="off"></label>
      <label class="field" style="margin-top:12px"><span class="lbl">Target amount</span><div class="inp"><span>₱</span><input id="gTarget" inputmode="decimal" placeholder="0" value="${editing ? g.target : ''}" autocomplete="off"></div></label>
      ${editing ? `<button class="btn danger wide" data-gdel style="width:100%;margin-top:14px">${IC('trash')}Delete goal</button>` : ''}
    </div>
    <button class="save-btn" id="gSave">${editing ? 'Save goal' : 'Create goal'}</button>`;
  setTimeout(() => { const a = $('#gName'); if (a) a.focus(); }, 60);
}

function submitGoal() {
  if (!G) return;
  if (G.mode === 'new' || G.mode === 'edit') {
    const name = $('#gName').value.trim();
    const target = num($('#gTarget').value);
    if (!name) { toast('Give the goal a name'); $('#gName').focus(); return; }
    if (target === null || target <= 0) { toast('Enter a target amount'); $('#gTarget').focus(); return; }
    if (G.mode === 'new') {
      S.goals.push({ id: uid(), name, target, saved: 0, color: GOAL_COLORS[S.goals.length % GOAL_COLORS.length] });
    } else {
      const g = S.goals.find(x => x.id === G.id);
      g.name = name; g.target = target;
      S.txs.forEach(t => { if (t.goalId === g.id) t.goalName = name; });
    }
    const wasNew = G.mode === 'new';
    save(); closeGoal(); renderHome(); toast(wasNew ? 'Goal created' : 'Goal updated');
    return;
  }
  const g = S.goals.find(x => x.id === G.id);
  const amount = num($('#gAmt').value);
  const w = $('#gWal').value;
  if (amount === null || amount <= 0) { toast('Enter an amount'); $('#gAmt').focus(); return; }
  if (G.dir === 'in' && amount > S.wallets[w]) { toast(`Not enough in ${wallet(w).name}`); return; }
  if (G.dir === 'out' && amount > g.saved) { toast('That is more than saved in this goal'); return; }
  const t = { id: uid(), ts: Date.now(), type: 'goal', dir: G.dir, goalId: g.id, goalName: g.name, amount, wallet: w, date: today(), note: '' };
  apply(t, 1);
  S.txs.push(t);
  const inn = G.dir === 'in';
  save(); closeGoal(); renderHome();
  toast(inn ? `Locked ${fmt(amount)} in ${g.name}` : `Moved ${fmt(amount)} to ${wallet(w).name}`);
}

function deleteGoal() {
  const g = S.goals.find(x => x.id === G.id);
  if (!g) return;
  const id = g.id;
  const dw = wallet(S.settings.defaultWallet) || WALLETS[0];
  const n = S.txs.filter(t => t.type === 'goal' && t.goalId === id).length;
  closeGoal();
  openConfirm('Delete goal?',
    `${fmt(g.saved)} saved in “${g.name}” will go back to ${dw.name}.${n ? ` Its ${n} deposit/withdraw entr${n === 1 ? 'y' : 'ies'} will be removed from activity.` : ''}`,
    'Delete goal', () => {
      const goal = S.goals.find(x => x.id === id);
      if (!goal) return;
      S.wallets[dw.id] = r2(S.wallets[dw.id] + goal.saved);
      S.txs = S.txs.filter(t => !(t.type === 'goal' && t.goalId === id));
      S.goals = S.goals.filter(x => x.id !== id);
      save(); renderHome(); toast('Goal deleted');
    });
}

/* ---------- Small Prompt / Confirm Dialog ---------- */
let P = null;
function openPrompt(title, fields, onSave) {
  P = { fields, onSave };
  $('#pTitle').textContent = title;
  $('#pSave').textContent = 'Save';
  $('#pFields').innerHTML = fields.map(f => `
    <label class="field"><span class="lbl">${esc(f.label)}</span>
      <div class="inp"><span>₱</span><input data-pf="${f.id}" inputmode="decimal" value="${f.value}"></div>
    </label>`).join('');
  $('#pOverlay').hidden = false;
  setTimeout(() => { const i = $('#pFields input'); if (i) { i.focus(); i.select(); } }, 60);
}
function openConfirm(title, msg, okLabel, onYes) {
  P = { fields: [], onSave: onYes };
  $('#pTitle').textContent = title;
  $('#pFields').innerHTML = `<p style="margin:0 0 10px;font-size:14px;color:var(--muted)">${esc(msg)}</p>`;
  $('#pSave').textContent = okLabel;
  $('#pOverlay').hidden = false;
}
function closePrompt() { $('#pOverlay').hidden = true; P = null; }
function submitPrompt() {
  if (!P) return;
  const vals = {};
  for (const f of P.fields) {
    const v = num($(`[data-pf="${f.id}"]`).value);
    if (v === null) return toast('Enter a valid number');
    vals[f.id] = v;
  }
  const fn = P.onSave;
  closePrompt();
  fn(vals);
}

/* ---------- Calendar ---------- */
function expenseByDay() {
  const m = {};
  for (const t of S.txs) if (t.type === 'expense') m[t.date] = r2((m[t.date] || 0) + t.amount);
  return m;
}
function trackingStart() {
  let s = S.settings.since || today();
  for (const t of S.txs) if (t.date < s) s = t.date;
  return s;
}
const cal = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: today() };

function renderCalendar() {
  const dim = new Date(cal.y, cal.m + 1, 0).getDate();
  const lead = new Date(cal.y, cal.m, 1).getDay();
  const prefix = `${cal.y}-${pad(cal.m + 1)}-`;
  const byDay = expenseByDay();
  const td = today(), start = trackingStart();
  const spendDates = Object.keys(byDay).filter(d => d.startsWith(prefix));
  const monthTotal = r2(spendDates.reduce((s, d) => s + byDay[d], 0));
  const ref = S.settings.budget > 0 ? dailyBudget() : (spendDates.length ? monthTotal / spendDates.length : 0);

  let nospend = 0, cells = '';
  for (let i = 0; i < lead; i++) cells += '<span class="cal-cell blank"></span>';
  for (let d = 1; d <= dim; d++) {
    const date = prefix + pad(d);
    const spent = byDay[date] || 0;
    const isNo = spent === 0 && date >= start && date <= td;
    if (isNo) nospend++;
    const lv = spent > 0 ? (spent <= ref * 0.6 ? 1 : spent <= ref * 1.2 ? 2 : 3) : 0;
    const label = dateOf(date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric' }) + (spent ? `, spent ${fmt(spent)}` : isNo ? ', no-spend day' : '');
    cells += `<button class="cal-cell${isNo ? ' nospend' : ''}${date === td ? ' today' : ''}${date === cal.sel ? ' sel' : ''}${date > td ? ' future' : ''}" data-day="${date}" aria-label="${label}">
      <span class="cal-num">${d}</span>
      <span class="cal-mark">${isNo ? `<span class="ck">${IC('check')}</span>` : lv ? `<span class="cal-dot lv${lv}"></span>` : ''}</span>
      <span class="cal-amt">${spent ? short(spent) : ''}</span>
    </button>`;
  }
  $('#calGrid').innerHTML = cells;
  $('#calTitle').textContent = new Date(cal.y, cal.m, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  $('#calStats').innerHTML = `
    <span class="pill ok">${IC('check')}${nospend} no-spend day${nospend === 1 ? '' : 's'}</span>
    <span class="pill">${spendDates.length} spend day${spendDates.length === 1 ? '' : 's'}</span>
    <span class="pill">Spent <b>${fmt(monthTotal)}</b></span>`;
}

function renderDayDetail() {
  const date = cal.sel;
  const list = S.txs.filter(t => t.date === date).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const spent = r2(list.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
  const income = r2(list.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
  const noSpend = spent === 0 && date >= trackingStart() && date <= today();
  const title = dateOf(date).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });
  $('#dayDetail').innerHTML = `
    <div class="day-grab"></div>
    <div class="card-head"><h2>${title}</h2><button class="icon-btn day-close" data-closeday aria-label="Close">${IC('close')}</button></div>
    <div class="day-sum">
      <div><div class="lbl">Total spent</div><div class="big" style="font-size:28px">${fmt(spent)}</div></div>
      ${income ? `<div><div class="lbl">Income</div><div class="mid pos">+${fmt(income)}</div></div>` : ''}
      ${noSpend ? `<span class="badge up badge-ic">${IC('check')}No-spend day</span>` : ''}
    </div>
    ${list.length ? list.map(txRow).join('') : '<div class="empty">Nothing logged for this day.</div>'}
    <button class="btn primary day-add" data-add-day="${date}">+ Add to this day</button>`;
}
function openDay() { $('#view-calendar').classList.add('day-open'); $('#dayBackdrop').hidden = false; }
function closeDay() { $('#view-calendar').classList.remove('day-open'); $('#dayBackdrop').hidden = true; }
function pickDay(date) {
  cal.sel = date;
  renderCalendar(); renderDayDetail();
  if (matchMedia('(max-width: 767px)').matches) openDay();
}
function calNav(a) {
  if (a === 'today') {
    const n = new Date(); cal.y = n.getFullYear(); cal.m = n.getMonth(); cal.sel = today();
  } else {
    cal.m += a === 'next' ? 1 : -1;
    if (cal.m < 0) { cal.m = 11; cal.y--; }
    if (cal.m > 11) { cal.m = 0; cal.y++; }
    const pre = `${cal.y}-${pad(cal.m + 1)}-`;
    cal.sel = today().startsWith(pre) ? today() : pre + '01';
  }
  closeDay(); renderCalendar(); renderDayDetail();
}

/* ---------- Analytics ---------- */
let period = 'month';
const charts = { donut: null, bar: null };

function periodRange() {
  const end = today();
  if (period === 'week') {
    const s = new Date(); s.setDate(s.getDate() - 6);
    return { from: ymd(s), to: end };
  }
  if (period === 'month') {
    const n = new Date();
    return { from: end.slice(0, 8) + '01', to: ymd(new Date(n.getFullYear(), n.getMonth() + 1, 0)) };
  }
  let from = end;
  for (const t of S.txs) if (t.type === 'expense' && t.date < from) from = t.date;
  return { from, to: end };
}

function renderAnalytics() {
  $$('#periodSeg button').forEach(b => b.classList.toggle('active', b.dataset.period === period));
  const { from, to } = periodRange();
  const exps = S.txs.filter(t => t.type === 'expense' && t.date >= from && t.date <= to);
  const total = r2(exps.reduce((s, t) => s + t.amount, 0));
  const elapsed = Math.max(1, daysBetween(from, today()) + 1);

  const byCat = {};
  exps.forEach(t => (byCat[t.cat] = r2((byCat[t.cat] || 0) + t.amount)));
  const rows = expenseCats().map(c => ({ c, v: byCat[c.id] || 0 })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const top = rows[0];

  $('#anStats').innerHTML = `
    <div class="an-stat"><div class="lbl">Total spent</div><div class="v">${fmt(total)}</div></div>
    <div class="an-stat"><div class="lbl">Avg per day</div><div class="v">${fmt(r2(total / elapsed))}</div></div>
    <div class="an-stat"><div class="lbl">Top category</div><div class="v">${top ? top.c.name : '—'}</div></div>`;

  const empty = !exps.length;
  $('#anGrid').hidden = empty;
  $('#anEmpty').hidden = !empty;
  if (charts.donut) { charts.donut.destroy(); charts.donut = null; }
  if (charts.bar) { charts.bar.destroy(); charts.bar = null; }
  if (empty) return;

  if (typeof Chart === 'undefined') {
    $('#donutCenter').innerHTML = '';
    $('#legend').innerHTML = '<div class="empty">Charts could not load. Check chart.umd.min.js.</div>';
    return;
  }

  const cs = getComputedStyle(document.documentElement);
  const css = n => cs.getPropertyValue(n).trim();
  Chart.defaults.color = css('--muted');
  Chart.defaults.font.family = 'Inter, system-ui, -apple-system, sans-serif';

  /* Donut */
  $('#donutCenter').innerHTML = `<div class="lbl">Spent</div><div class="mid">${fmt(total)}</div>`;
  charts.donut = new Chart($('#donutChart'), {
    type: 'doughnut',
    data: {
      labels: rows.map(x => x.c.name),
      datasets: [{ data: rows.map(x => x.v), backgroundColor: rows.map(x => x.c.color), borderColor: css('--surface'), borderWidth: 3, hoverOffset: 4 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed)} (${Math.round(ctx.parsed / total * 100)}%)` } },
      },
    },
  });
  $('#legend').innerHTML = rows.map(x => `
    <div class="lg"><span class="lg-ic" style="--c:${x.c.color}">${IC(x.c.icon)}</span>
      <span class="lg-name">${x.c.name}</span>
      <span class="lg-amt">${fmt(x.v)}</span><span class="lg-pct">${Math.round(x.v / total * 100)}%</span></div>`).join('');

  /* Bars */
  const byDay = {};
  exps.forEach(t => (byDay[t.date] = r2((byDay[t.date] || 0) + t.amount)));
  let labels, tips, values, title, monthly = false;
  if (period === 'all' && daysBetween(from, to) > 60) {
    monthly = true;
    const map = {};
    exps.forEach(t => { const k = t.date.slice(0, 7); map[k] = r2((map[k] || 0) + t.amount); });
    const keys = [];
    let [y, m] = parts(from); const [ey, em] = parts(to);
    while (y < ey || (y === ey && m <= em)) { keys.push(`${y}-${pad(m)}`); if (++m > 12) { m = 1; y++; } }
    labels = keys.map(k => { const [yy, mm] = k.split('-').map(Number); return new Date(yy, mm - 1, 1).toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }); });
    tips = keys.map(k => { const [yy, mm] = k.split('-').map(Number); return new Date(yy, mm - 1, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }); });
    values = keys.map(k => map[k] || 0);
    title = 'Monthly spending';
  } else {
    const days = eachDay(from, to);
    values = days.map(d => byDay[d] || 0);
    tips = days.map(d => dateOf(d).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }));
    labels = days.map(d => period === 'week' ? dateOf(d).toLocaleDateString('en-PH', { weekday: 'short' })
      : period === 'month' ? String(parts(d)[2]) : `${parts(d)[1]}/${parts(d)[2]}`);
    title = period === 'week' ? 'Daily spending · last 7 days'
      : period === 'month' ? 'Daily spending · ' + new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
      : 'Daily spending';
  }
  $('#barTitle').textContent = title;

  const datasets = [{ label: 'Spent', data: values, backgroundColor: css('--brand'), borderRadius: 6, maxBarThickness: 28, order: 2 }];
  if (S.settings.budget > 0 && !monthly) {
    const pace = r2(dailyBudget());
    datasets.push({ type: 'line', label: 'Daily budget', data: values.map(() => pace), borderColor: css('--amber'), borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, pointHitRadius: 0, order: 1 });
  }
  charts.bar = new Chart($('#barChart'), {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: period === 'month' ? 16 : 12 } },
        y: { beginAtZero: true, grid: { color: css('--border') }, border: { display: false }, ticks: { callback: v => '₱' + short(v), maxTicksLimit: 6 } },
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { title: items => tips[items[0].dataIndex], label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } },
      },
    },
  });
}

/* ---------- Backup & Install ---------- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredInstall = e;
  if (!$('#view-settings').hidden) renderSettings();
});
window.addEventListener('appinstalled', () => { deferredInstall = null; toast('Wallex installed'); renderSettings(); });
function installApp() {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  deferredInstall.userChoice.finally(() => { deferredInstall = null; renderSettings(); });
}

function backupRows() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const last = S.settings.lastExport ? `Last backup: ${niceDate(S.settings.lastExport)}.` : 'No backup yet.';
  const install = standalone ? '<small>Installed</small>'
    : deferredInstall ? '<button class="btn primary" id="installBtn">Install</button>'
    : '<small>Browser menu → Install app / Add to Home Screen</small>';
  return `
    <div class="set-row">
      <div><b>Backup &amp; transfer</b><small>${last} Export JSON file to backup or move data.</small></div>
      <div class="btn-group"><button class="btn" id="exportBtn">Export JSON</button><button class="btn" id="copyBtn">Copy JSON</button><button class="btn" id="importBtn">Import JSON</button></div>
    </div>
    <div class="set-row">
      <div><b>Install app</b><small>Works full-screen and offline</small></div>
      <div class="inst">${install}</div>
    </div>`;
}

function backupJson() {
  return JSON.stringify({ app: 'wallex', version: 3, exportedAt: new Date().toISOString(), data: S }, null, 2);
}
function exportData() {
  try {
    const url = URL.createObjectURL(new Blob([backupJson()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `wallex-backup-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    S.settings.lastExport = today(); save(); renderSettings();
    toast('Backup file saved');
  } catch (e) { toast('Download failed. Try Copy JSON instead'); }
}
function copyData() {
  const json = backupJson();
  const done = () => { S.settings.lastExport = today(); save(); renderSettings(); toast('Backup copied to clipboard'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).then(done).catch(() => toast('Copy was blocked by this browser'));
  else toast('Copy is not supported here. Use Export JSON');
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
function sanitizeImport(raw) {
  const d = raw && raw.app === 'wallex' ? raw.data : raw;
  if (!d || typeof d !== 'object' || !Array.isArray(d.txs) || !d.wallets || typeof d.wallets !== 'object') {
    throw new Error('This file is not a Wallex backup.');
  }
  const out = defaults();
  const s = d.settings || {};
  if (s.theme === 'dark' || s.theme === 'light') out.settings.theme = s.theme;
  if (s.userName) out.settings.userName = String(s.userName).slice(0, 30);
  if (isFinite(s.budget) && +s.budget >= 0) out.settings.budget = r2(+s.budget);
  if (s.cycle === 'week' || s.cycle === 'month') out.settings.cycle = s.cycle;
  if (wallet(s.defaultWallet)) out.settings.defaultWallet = s.defaultWallet;
  out.settings.hidden = !!s.hidden;
  if (ISO.test(s.since || '')) out.settings.since = s.since;
  if (ISO.test(s.lastExport || '')) out.settings.lastExport = s.lastExport;

  if (d.categories && typeof d.categories === 'object') {
    if (Array.isArray(d.categories.expense)) out.categories.expense = d.categories.expense;
    if (Array.isArray(d.categories.income)) out.categories.income = d.categories.income;
  }

  WALLETS.forEach(w => { const v = parseFloat(d.wallets[w.id]); if (isFinite(v)) out.wallets[w.id] = r2(v); });
  if (d.dragon) {
    const inv = parseFloat(d.dragon.invested), val = parseFloat(d.dragon.value);
    if (isFinite(inv)) out.dragon.invested = r2(inv);
    if (isFinite(val)) out.dragon.value = r2(val);
  }
  if (Array.isArray(d.goals)) {
    for (const g of d.goals) {
      if (!g || !g.id || !String(g.name || '').trim() || !isFinite(g.target) || +g.target <= 0) continue;
      out.goals.push({ id: String(g.id), name: String(g.name).slice(0, 30), target: r2(+g.target), saved: Math.max(0, r2(+g.saved || 0)), color: GOAL_COLORS.includes(g.color) ? g.color : GOAL_COLORS[out.goals.length % GOAL_COLORS.length] });
    }
  }
  let skipped = 0;
  for (const t of d.txs) {
    const ok = t && ['expense', 'income', 'transfer', 'invest', 'goal'].includes(t.type) && isFinite(t.amount) && +t.amount > 0
      && ISO.test(t.date || '') && wallet(t.wallet)
      && (t.type !== 'transfer' || (wallet(t.to) && t.to !== t.wallet))
      && (t.type !== 'goal' || ((t.dir === 'in' || t.dir === 'out') && t.goalId));
    if (!ok) { skipped++; continue; }
    const tx = { id: String(t.id || uid()), ts: +t.ts || 0, type: t.type, amount: r2(+t.amount), wallet: t.wallet, date: t.date, note: String(t.note || '').slice(0, 60) };
    if (t.type === 'expense') { tx.cat = t.cat || 'other'; if (t.cat === 'other' && t.label) tx.label = String(t.label).slice(0, 40); }
    if (t.type === 'income') { tx.cat = t.cat || 'salary'; }
    if (t.type === 'transfer') { tx.to = t.to; tx.fee = Math.max(0, r2(+t.fee || 0)); }
    if (t.type === 'goal') { tx.dir = t.dir; tx.goalId = String(t.goalId); tx.goalName = String(t.goalName || '').slice(0, 30); }
    out.txs.push(tx);
  }
  return { state: out, skipped };
}
async function importFile(file) {
  try {
    const raw = JSON.parse(await file.text());
    const { state, skipped } = sanitizeImport(raw);
    openConfirm('Replace your data?',
      `This backup has ${state.txs.length} transaction${state.txs.length === 1 ? '' : 's'}${skipped ? ` (${skipped} invalid skipped)` : ''}. Current data will be replaced.`,
      'Replace data', () => {
        if (!state.settings.since) state.settings.since = today();
        S = state;
        setTheme(S.settings.theme || 'dark');
        save(); renderHome(); renderSettings(); buildCats(); toast('Backup restored');
      });
  } catch (e) {
    toast(e && e.message && e.message.startsWith('This file') ? e.message : 'Could not read that file');
  }
}

/* ---------- Events ---------- */
document.addEventListener('click', e => {
  // Sero Segmented Ring slice clicked
  const arc = e.target.closest('.sero-arc-path');
  if (arc && arc.dataset.scat) {
    activeSpendingCatId = arc.dataset.scat;
    return renderSpendingSection();
  }

  // Tapping a transaction opens options
  const row = e.target.closest('[data-tx]');
  if (row) return openMenu(row.dataset.tx);

  // Tapping a goal opens Deposit / Withdraw
  const gc = e.target.closest('[data-goal]');
  if (gc) return openGoal('move', gc.dataset.goal);

  // Tapping a budget card opens transactions or editor
  const bc = e.target.closest('[data-bcat]');
  if (bc) {
    const cid = bc.dataset.bcat;
    act.q = cat(cid, 'expense').name;
    act.f = 'expenses';
    nav('home');
    const rec = $('#recent');
    if (rec) rec.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Category Manager: kebab menu clicked
  const kb = e.target.closest('[data-cat-kebab]');
  if (kb) {
    e.stopPropagation();
    return openCatMenu(kb.dataset.catKebab, kb.dataset.catType);
  }

  // Category Manager: category row clicked to edit
  const cr = e.target.closest('[data-cat-row]');
  if (cr) {
    return openCategoryModal('edit', cr.dataset.catType, cr.dataset.catRow);
  }

  const t = e.target.closest('button, .overlay, a');
  if (!t) return;

  // Navigation
  if (t.dataset.nav) return nav(t.dataset.nav);
  if (t.id === 'catMgrBackBtn') return nav('home');
  if (t.id === 'spendingCalLink' || t.id === 'spCalViewBtn') return nav('calendar');
  if (t.id === 'spendingManageCatBtn' || t.id === 'budgetManageBtn') return nav('categories');

  // Hero controls (Image 1)
  if (t.id === 'toggleHideBal') {
    S.settings.hidden = !S.settings.hidden;
    save();
    renderHome();
    toast(S.settings.hidden ? 'Balances masked' : 'Balances visible');
    return;
  }
  if (t.id === 'editUserNameBtn') {
    const cur = S.settings.userName || 'Sam';
    const name = prompt('What is your name?', cur);
    if (name != null && name.trim()) {
      S.settings.userName = name.trim();
      save();
      renderHero();
      toast('Name updated');
    }
    return;
  }
  if (t.id === 'heroTapAccounts') {
    const ws = $('#walletsSec');
    if (ws) ws.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Spending section period pills (Image 1)
  if (t.dataset.sp) {
    spendingPeriod = t.dataset.sp;
    spendingOffsetMonth = 0;
    return renderSpendingSection();
  }
  if (t.id === 'spPrevMonth') {
    spendingPeriod = 'month';
    spendingOffsetMonth--;
    return renderSpendingSection();
  }
  if (t.id === 'spNextMonth') {
    spendingPeriod = 'month';
    spendingOffsetMonth++;
    return renderSpendingSection();
  }

  // Sero Center Card action buttons
  if (t.id === 'scAddBtn') {
    return openAdd({ type: 'expense', cat: activeSpendingCatId });
  }
  if (t.id === 'scSeeBtn') {
    const c = cat(activeSpendingCatId, 'expense');
    act.q = c.name;
    act.f = 'expenses';
    renderRecent();
    const rec = $('#recent');
    if (rec) rec.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Category Manager Add buttons (Image 3)
  if (t.id === 'addExpenseCatBtn') return openCategoryModal('new', 'expense');
  if (t.id === 'addIncomeCatBtn') return openCategoryModal('new', 'income');

  // Category Modal inside actions
  if (t.id === 'closeCatModal' || t.id === 'cancelCatModal') return closeCategoryModal();
  if (t.id === 'saveCatBtn') return saveCategoryModal();
  if (t.id === 'deleteCatBtn') return deleteCategoryModal();
  if (t.dataset.ctype && t.closest('#catTypeSeg')) {
    catModalData.type = t.dataset.ctype;
    $$('#catTypeSeg button').forEach(b => b.classList.toggle('active', b.dataset.ctype === catModalData.type));
    $('#catBudgetField').hidden = catModalData.type === 'income';
    return;
  }
  if (t.dataset.ic && t.closest('#catIconPicker')) {
    $$('#catIconPicker .ip-btn').forEach(b => b.classList.toggle('active', b.dataset.ic === t.dataset.ic));
    return;
  }
  if (t.dataset.cp && t.closest('#catColorPicker')) {
    $$('#catColorPicker .cp-btn').forEach(b => b.classList.toggle('active', b.dataset.cp === t.dataset.cp));
    return;
  }

  // Category Kebab Menu actions
  if (t.dataset.cact) {
    const actName = t.dataset.cact;
    const { id, type, c } = kebabCat || {};
    closeCatMenu();
    if (!id || actName === 'cancel') return;
    if (actName === 'edit') return openCategoryModal('edit', type, id);
    if (actName === 'budget') {
      const curB = c.budget || 0;
      const bval = prompt(`Monthly budget for ${c.name}:`, curB);
      if (bval != null) {
        c.budget = num(bval) || 0;
        save();
        renderCategoryManager();
        renderBudgets();
        toast('Budget updated');
      }
      return;
    }
    if (actName === 'delete') {
      return openConfirm('Delete category?', `Are you sure you want to delete “${c.name}”?`, 'Delete', () => {
        if (type === 'income') {
          S.categories.income = S.categories.income.filter(x => x.id !== id);
        } else {
          S.categories.expense = S.categories.expense.filter(x => x.id !== id);
          S.txs.forEach(tx => { if (tx.cat === id) tx.cat = 'other'; });
        }
        save();
        renderCategoryManager();
        buildCats();
        renderHome();
        toast('Category deleted');
      });
    }
  }
  if (t.id === 'catMenuOverlay' && e.target === t) return closeCatMenu();

  // Quick-Add Modal & FAB
  if (t.hasAttribute('data-add')) return openAdd();
  if (t.dataset.cal) return calNav(t.dataset.cal);
  if (t.dataset.day) return pickDay(t.dataset.day);
  if (t.hasAttribute('data-closeday')) return closeDay();
  if (t.dataset.addDay) return openAdd({ date: t.dataset.addDay });
  if (t.dataset.period) { period = t.dataset.period; return renderAnalytics(); }
  if (t.id === 'exportBtn') return exportData();
  if (t.id === 'copyBtn') return copyData();
  if (t.id === 'importBtn') return $('#importFile').click();
  if (t.id === 'installBtn') return installApp();

  // Home: recent activity search filters & goals
  if (t.dataset.flt) { act.f = t.dataset.flt; act.limit = 40; return renderRecent(); }
  if (t.hasAttribute('data-more')) { act.limit += 40; return renderRecent(); }
  if (t.hasAttribute('data-goal-new')) return openGoal('new');
  if (t.hasAttribute('data-goals-all')) { goalsExpanded = !goalsExpanded; return renderGoals(); }

  // Wallet / DragonFi edits
  if (t.dataset.rec) {
    const id = t.dataset.rec;
    return openPrompt(`Reconcile ${wallet(id).name}`, [{ id: 'bal', label: 'Actual balance', value: S.wallets[id] }], v => {
      S.wallets[id] = v.bal; save(); renderHome(); toast(`${wallet(id).name} updated`);
    });
  }
  if (t.hasAttribute('data-edit-dragon')) {
    return openPrompt('DragonFi values', [
      { id: 'value', label: 'Current Market Value', value: S.dragon.value },
      { id: 'invested', label: 'Total Invested', value: S.dragon.invested },
    ], v => { S.dragon.value = v.value; S.dragon.invested = v.invested; save(); renderHome(); toast('DragonFi updated'); });
  }

  // Transaction options menu
  if (t.dataset.act) return menuAction(t.dataset.act);
  if (t.id === 'aOverlay' && e.target === t) return closeMenu();

  // Goal sheet
  if (t.hasAttribute('data-gclose')) return closeGoal();
  if (t.id === 'gOverlay' && e.target === t) return closeGoal();
  if (t.id === 'gSave') return submitGoal();
  if (t.hasAttribute('data-gedit')) { const id = G.id; return openGoal('edit', id); }
  if (t.hasAttribute('data-gdel')) return deleteGoal();
  if (t.dataset.gdir) {
    const amt = $('#gAmt').value, wal = $('#gWal').value;
    G.dir = t.dataset.gdir; renderGoalSheet();
    $('#gAmt').value = amt; $('#gWal').value = wal;
    return;
  }

  // Quick-Add modal controls
  if (t.id === 'closeModal') return closeAdd();
  if (t.id === 'overlay' && e.target === t) return closeAdd();
  if (t.id === 'saveBtn') return submitTx();
  if (t.dataset.type && t.closest('#typeTabs')) return setType(t.dataset.type);
  if (t.dataset.cat) return selectCat(t.dataset.cat);
  if (t.dataset.fee != null && t.closest('#feeChips')) { $('#fee').value = +t.dataset.fee ? t.dataset.fee : ''; return syncFeeChips(); }
  if (t.dataset.combo != null) {
    const c = $('#combos')._data[+t.dataset.combo];
    $('#amt').value = c.amount;
    $('#walSel').value = c.wallet;
    $('#other').value = c.label || '';
    selectCat(c.cat);
    return;
  }

  // Prompt
  if (t.id === 'pSave') return submitPrompt();
  if (t.id === 'pCancel') return closePrompt();
  if (t.id === 'pOverlay' && e.target === t) return closePrompt();

  // Settings
  if (t.dataset.cycle) { S.settings.cycle = t.dataset.cycle; save(); renderSettings(); renderHome(); return; }
  if (t.id === 'resetBtn') {
    openConfirm('Reset all data?', 'Every wallet balance, goal and transaction on this device will be removed.', 'Reset everything', () => {
      const theme = S.settings.theme;
      S = defaults(); S.settings.theme = theme; S.settings.since = today();
      save(); renderHome(); renderSettings(); toast('All data erased');
    });
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'search') { act.q = e.target.value; act.limit = 40; renderRecent(); }
  if (e.target.id === 'fee') syncFeeChips();
  if (e.target.id === 'setUserName') {
    S.settings.userName = e.target.value.trim() || 'Sam';
    save();
    renderHero();
  }
});

document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'setDark') setTheme(el.checked ? 'dark' : 'light');
  if (el.id === 'setHide') { S.settings.hidden = el.checked; save(); renderHome(); toast(el.checked ? 'Balances masked' : 'Balances visible'); }
  if (el.id === 'setBudget') {
    const v = num(el.value || '0');
    if (v === null || v < 0) { toast('Invalid budget'); el.value = S.settings.budget || ''; return; }
    S.settings.budget = v; save(); renderHome(); toast('Budget saved');
  }
  if (el.id === 'setWallet') { S.settings.defaultWallet = el.value; save(); toast('Default wallet saved'); }
  if (el.id === 'importFile') { const f = el.files && el.files[0]; if (f) importFile(f); el.value = ''; }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!$('#pOverlay').hidden) closePrompt();
    else if (!$('#catModalOverlay').hidden) closeCategoryModal();
    else if (!$('#catMenuOverlay').hidden) closeCatMenu();
    else if (!$('#aOverlay').hidden) closeMenu();
    else if (!$('#gOverlay').hidden) closeGoal();
    else if (!$('#overlay').hidden) closeAdd();
    else closeDay();
  }
  if (e.key === 'Enter') {
    const tgt = e.target;
    if (tgt.closest && tgt.closest('[data-tx]')) { e.preventDefault(); openMenu(tgt.closest('[data-tx]').dataset.tx); return; }
    if (tgt.tagName === 'INPUT' && tgt.id !== 'search') {
      if (!$('#pOverlay').hidden) { e.preventDefault(); submitPrompt(); }
      else if (!$('#catModalOverlay').hidden) { e.preventDefault(); saveCategoryModal(); }
      else if (!$('#gOverlay').hidden) { e.preventDefault(); submitGoal(); }
      else if (!$('#overlay').hidden) { e.preventDefault(); submitTx(); }
    }
  }
});

// Refresh on focus
document.addEventListener('visibilitychange', () => { if (!document.hidden) renderHome(); });
window.addEventListener('storage', e => { if (e.key === KEY) { S = load(); renderHome(); } });

/* ---------- Init ---------- */
(function init() {
  if (!S.settings.theme) S.settings.theme = 'dark';
  setTheme(S.settings.theme);
  if (!S.settings.since) { S.settings.since = today(); save(); }
  buildSelects();
  buildCats();
  renderHome();
  renderCategoryManager();
  renderSettings();

  // Offline support
  try {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }
  } catch (e) {}
})();

})();
