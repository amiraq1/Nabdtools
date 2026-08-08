/* نبض — محرّك عرض السجل الديناميكي
   يقرأ data/updates.json ويُظهر التحديثات مع فلاتر أداة/نوع. */
const arDays = ['الأحد','الإثنان','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const arMonths = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const arTypes = { pricing: 'تسعير', release: 'إصدار', breaking: 'تغيير جذري', funding: 'تمويل', milestone: 'محطة' };
const logos = {
  openrouter: ['OR', '#e8a33d'], opencode: ['OC', '#5fae6e'], cursor: ['CU', '#6b9bd1'],
  claude: ['CL', '#c2645a'], midjourney: ['MJ', '#e8a33d'], perplexity: ['PX', '#5fae6e'],
  copilot: ['GH', '#6b9bd1'], windsurf: ['WS', '#c2645a']
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function fmtFull(d) {
  return `${arDays[d.getDay()]} ${d.getDate()} ${arMonths[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtDate(iso) {
  const [y, m, day] = iso.split('-').map(Number);
  return `${day} ${arMonths[m - 1]} ${y}`;
}

let DATA = [];
let activeTool = 'all';
let activeType = 'all';

async function load() {
  try {
    const res = await fetch('data/updates.json', { cache: 'no-store' });
    DATA = await res.json();
  } catch (e) {
    document.getElementById('log').innerHTML = '<p class="log-empty">تعذر تحميل البيانات.</p>';
    return;
  }
  buildToolFilters();
  wireFilters();
  render();
  setSync();
}

function buildToolFilters() {
  const seen = [];
  DATA.forEach(e => { if (!seen.includes(e.slug)) seen.push(e.slug); });
  seen.sort((a, b) => String(a).localeCompare(String(b), 'ar'));
  const bar = document.getElementById('toolFilters');
  const all = document.createElement('button');
  all.className = 'chip active'; all.dataset.filter = 'tool'; all.dataset.value = 'all'; all.textContent = 'الكل';
  bar.appendChild(all);
  seen.forEach(slug => {
    const name = (DATA.find(e => e.slug === slug) || {}).tool || slug;
    const b = document.createElement('button');
    b.className = 'chip'; b.dataset.filter = 'tool'; b.dataset.value = slug;
    b.textContent = name;
    bar.appendChild(b);
  });
}

function wireFilters() {
  document.querySelectorAll('.chip[data-filter]').forEach(c => {
    c.addEventListener('click', () => {
      const group = c.dataset.filter;
      if (group === 'type') {
        activeType = c.dataset.value;
      } else {
        activeTool = c.dataset.value;
      }
      document.querySelectorAll(`.chip[data-filter="${group}"]`).forEach(x => {
        x.classList.toggle('active', x === c);
      });
      render();
    });
  });
}

function render() {
  const log = document.getElementById('log');
  const visible = DATA.filter(e =>
    (activeTool === 'all' || e.slug === activeTool) &&
    (activeType === 'all' || e.type === activeType)
  );
  log.innerHTML = '';
  document.getElementById('countShown').textContent = visible.length;
  const empty = document.getElementById('logEmpty');
  if (!visible.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  log.insertAdjacentHTML('beforeend', visible.map(entry).join(''));
}

function entry(e) {
  const [abbr, bg] = logos[e.slug] || [String(e.tool).slice(0, 2).toUpperCase(), '#e8a33d'];
  const t = arTypes[e.type] || e.type;
  return `<article class="entry" data-tool="${esc(e.slug)}" data-type="${esc(e.type)}">
    <div class="entry-head">
      <div class="entry-logo" style="background:${bg}">${esc(abbr)}</div>
      <div class="entry-tool"><span class="entry-tool-name">${esc(e.tool)}</span><time class="entry-date">${fmtDate(e.date)}</time></div>
      <span class="entry-type ${esc(e.type)}">${esc(t)}</span>
    </div>
    <h3 class="entry-title">${esc(e.title)}</h3>
    <div class="entry-diff">
      <div class="diff-item"><span class="diff-label">قبل</span><span class="diff-value">${esc(e.diff_before)}</span></div>
      <div class="diff-item"><span class="diff-label">بعد</span><span class="diff-value">${esc(e.diff_after)}</span></div>
    </div>
    <p class="entry-body">${esc(e.body)}</p>
    <div class="entry-source">المصدر: <a href="${esc(e.source_url)}" target="_blank" rel="noopener">${esc(e.source_name)}</a> <span class="verified">✓ مُتحقَّق</span></div>
  </article>`;
}

function setSync() {
  document.getElementById('lastSync').textContent = `آخر مزامنة: ${fmtFull(new Date())}`;
}

document.addEventListener('DOMContentLoaded', load);
