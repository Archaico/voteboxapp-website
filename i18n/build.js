// Builds the translated copies of voteboxapp.org from the English pages.
//
//   node build.js          write /<lang>/<page>.html for every language, add
//                          the language menu to the English pages, and
//                          refresh en-strings.json
//   node build.js --check  only report missing or unused translations
//
// The English pages stay the source. Each translatable piece of text (a
// heading, a paragraph, a button label, an SVG label, an alt text...) is
// looked up in <lang>.json by an ID made from its English text (listed with
// the English in en-strings.json). Anything without a translation stays in
// English and is reported, so a changed English sentence gets a new ID and
// never silently goes out of date. Text that is the same in every language
// (names, numbers, code identifiers) is listed under "keep" in
// languages.json.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://voteboxapp.org';
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'languages.json'), 'utf8'));
const PAGES = config.pages.map(p => p.file);
const CHECK_ONLY = process.argv.includes('--check');

// Tags whose content is treated as running text, so a paragraph with a <b>
// or a link inside is translated as one piece and word order can change.
const INLINE = new Set(['a', 'abbr', 'b', 'br', 'code', 'em', 'i', 'mark', 's', 'small',
  'span', 'strong', 'sub', 'sup', 'time', 'u', 'wbr']);
const SKIP = new Set(['script', 'style', 'noscript', 'template']);
const ATTRS = ['alt', 'title', 'aria-label', 'placeholder'];
const hasLetters = s => /\p{L}/u.test(s);
const norm = s => s.replace(/\s+/g, ' ').trim();
const idOf = key => crypto.createHash('sha1').update(key).digest('hex').slice(0, 8);
const KEEP = new Set(config.keep);

const load = html => cheerio.load(html, { xml: { xmlMode: false, decodeEntities: false } });

function isInlineOnly(node) {
  if (node.type === 'text' || node.type === 'comment') return true;
  if (node.type !== 'tag') return false;
  return INLINE.has(node.name) && (node.children || []).every(isInlineOnly);
}

// Finds every translatable piece of text in a page.
function collectUnits($) {
  const units = []; // { node, kind: 'html' | 'text' | 'attr', attr?, key }
  const walk = el => {
    for (const child of el.children || []) {
      if (child.type === 'text') {
        // Text sitting directly beside block elements.
        if (hasLetters(child.data)) units.push({ node: child, kind: 'text', key: norm(child.data) });
        continue;
      }
      if (child.type !== 'tag' || SKIP.has(child.name)) continue;
      for (const attr of ATTRS) {
        const v = child.attribs[attr];
        if (v && hasLetters(v)) units.push({ node: child, kind: 'attr', attr, key: norm(v) });
      }
      const text = $(child).text();
      const leaf = child.name === 'text' || child.name === 'title' ||
        ((child.children || []).every(isInlineOnly) && child.children.length > 0);
      if (leaf) {
        if (hasLetters(text)) units.push({ node: child, kind: 'html', key: norm($(child).html()) });
      } else {
        walk(child);
      }
    }
  };
  walk($.root()[0]);
  return units;
}

function langMenu(currentCode, page) {
  const all = [{ code: 'en', name: 'English', tag: 'en' }, ...config.languages];
  const href = code => (code === 'en' ? `/${page === 'index.html' ? '' : page}` : `/${code}/${page === 'index.html' ? '' : page}`);
  const cur = all.find(l => l.code === currentCode);
  const placement = config.pages.find(p => p.file === page).menu;
  const items = all.map(l =>
    `<li><a href="${href(l.code)}" hreflang="${l.tag}" lang="${l.tag}" data-lang="${l.code}"${l.code === currentCode ? ' aria-current="true"' : ''}>${l.name}</a></li>`
  ).join('');
  return `<!-- lang-menu:start -->
<style>
#vba-lang{${placement === 'overlay' ? 'position:absolute;top:10px;right:12px;' : 'position:relative;display:flex;justify-content:flex-end;max-width:1080px;margin:0 auto 8px;'}z-index:1000;font:14px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
#vba-lang details{position:relative}
#vba-lang summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.95);color:#16241c;border:1px solid rgba(0,0,0,.15);box-shadow:0 2px 8px rgba(0,0,0,.12);user-select:none}
#vba-lang summary::-webkit-details-marker{display:none}
#vba-lang ul{position:absolute;right:0;top:calc(100% + 6px);margin:0;padding:6px;list-style:none;min-width:170px;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.18)}
#vba-lang li a{display:block;padding:8px 12px;border-radius:8px;color:#16241c;text-decoration:none}
#vba-lang li a:hover{background:#eef3ec}
#vba-lang li a[aria-current]{font-weight:700;color:#1f5c3d}
#vba-suggest{position:fixed;left:12px;right:12px;bottom:12px;z-index:1001;max-width:460px;margin:0 auto;display:none;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;background:#16241c;color:#f3f0e6;font:15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3)}
#vba-suggest a{color:#c7dba0;font-weight:700;flex:1}
#vba-suggest button{background:none;border:0;color:#f3f0e6;font-size:20px;cursor:pointer;padding:0 4px}
</style>
<nav id="vba-lang" aria-label="Language"><details><summary><span aria-hidden="true">&#127760;</span> ${cur.name} <span aria-hidden="true">&#9662;</span></summary><ul>${items}</ul></details></nav>
<div id="vba-suggest" role="dialog"></div>
<script>
(function () {
  var KEY = 'vba-lang', current = '${currentCode}';
  var menu = document.getElementById('vba-lang');
  var store = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  menu.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-lang]');
    if (a) store(a.getAttribute('data-lang'));
  });
  document.addEventListener('click', function (e) {
    var d = menu.querySelector('details');
    if (d.open && !menu.contains(e.target)) d.open = false;
  });
  if (current !== 'en') return;
  var links = {};
  menu.querySelectorAll('a[data-lang]').forEach(function (a) { links[a.getAttribute('data-lang')] = a; });
  // A language picked earlier from this menu: go straight there.
  if (saved && saved !== 'en' && links[saved]) { location.replace(links[saved].href); return; }
  if (saved) return;
  // First visit: offer the phone's language, if we have it.
  var offers = ${JSON.stringify(Object.fromEntries(config.languages.map(l => [l.code, l.suggest])))};
  var wanted = (navigator.languages || [navigator.language || '']).map(function (l) { return String(l).toLowerCase().split('-')[0]; });
  var match = wanted.filter(function (c) { return offers[c]; })[0];
  if (!match || wanted[0] === 'en') return;
  var box = document.getElementById('vba-suggest');
  var go = document.createElement('a');
  go.href = links[match].href; go.lang = match; go.textContent = offers[match] + ' \\u2192';
  go.addEventListener('click', function () { store(match); });
  var close = document.createElement('button');
  close.type = 'button'; close.setAttribute('aria-label', 'Close'); close.textContent = '\\u00d7';
  close.addEventListener('click', function () { store('en'); box.style.display = 'none'; });
  box.appendChild(go); box.appendChild(close); box.style.display = 'flex';
})();
</script>
<!-- lang-menu:end -->`;
}

function alternateLinks(page) {
  const p = page === 'index.html' ? '' : page;
  const tags = [`<link rel="alternate" hreflang="en" href="${SITE}/${p}">`,
    ...config.languages.map(l => `<link rel="alternate" hreflang="${l.tag}" href="${SITE}/${l.code}/${p}">`),
    `<link rel="alternate" hreflang="x-default" href="${SITE}/${p}">`];
  return `<!-- lang-alternates:start -->\n${tags.join('\n')}\n<!-- lang-alternates:end -->`;
}

// Replaces a marked block, or inserts it after `anchor` the first time.
function upsert(html, name, block, anchor) {
  const re = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`);
  if (re.test(html)) return html.replace(re, block);
  const at = html.search(anchor);
  if (at < 0) throw new Error(`No ${anchor} to insert ${name} after`);
  const end = html.indexOf('>', at) + 1;
  return html.slice(0, end) + '\n' + block + html.slice(end);
}

function stripMarked(html) {
  return html.replace(/<!-- lang-(menu|alternates):start -->[\s\S]*?<!-- lang-\1:end -->\n?/g, '');
}

function rewriteLinks($, code) {
  $('[href], [src]').each((_, el) => {
    for (const attr of ['href', 'src']) {
      const v = el.attribs[attr];
      if (!v) continue;
      if (/^https:\/\/voteboxapp\.org\/?$/.test(v)) { el.attribs[attr] = `${SITE}/${code}/`; continue; }
      if (/^([a-z]+:|\/|#|\?)/i.test(v)) continue; // absolute, data:, mailto:, anchors
      const file = v.split(/[?#]/)[0];
      if (!PAGES.includes(file)) el.attribs[attr] = '../' + v;
    }
  });
}

const report = {};
const enStrings = {};

for (const lang of config.languages) {
  const dict = JSON.parse(fs.readFileSync(path.join(__dirname, `${lang.code}.json`), 'utf8'));
  const used = new Set();
  report[lang.code] = { missing: [], unused: [] };

  for (const page of PAGES) {
    const source = stripMarked(fs.readFileSync(path.join(ROOT, page), 'utf8'));
    const $ = load(source);
    const units = collectUnits($);
    enStrings[page] = Object.fromEntries(units.filter(u => !KEEP.has(u.key)).map(u => [idOf(u.key), u.key]));

    for (const u of units) {
      if (KEEP.has(u.key)) continue;
      const id = idOf(u.key);
      const t = dict[id];
      if (t === undefined) { report[lang.code].missing.push(`${page}: ${id} ${u.key}`); continue; }
      used.add(id);
      if (u.kind === 'html') $(u.node).html(t);
      else if (u.kind === 'text') u.node.data = u.node.data.replace(/\S[\s\S]*\S|\S/, t);
      else u.node.attribs[u.attr] = t.replace(/"/g, '&quot;');
    }
    if (CHECK_ONLY) continue;

    $('html').attr('lang', lang.tag);
    rewriteLinks($, lang.code);
    let out = $.html();
    out = upsert(out, 'lang-alternates', alternateLinks(page), /<head[\s>]/);
    out = upsert(out, 'lang-menu', langMenu(lang.code, page), /<body[\s>]/);
    fs.mkdirSync(path.join(ROOT, lang.code), { recursive: true });
    fs.writeFileSync(path.join(ROOT, lang.code, page), out);
  }
  report[lang.code].unused = Object.keys(dict).filter(k => !used.has(k));
}

if (!CHECK_ONLY) {
  for (const page of PAGES) {
    const file = path.join(ROOT, page);
    let html = fs.readFileSync(file, 'utf8');
    html = upsert(html, 'lang-alternates', alternateLinks(page), /<head[\s>]/);
    html = upsert(html, 'lang-menu', langMenu('en', page), /<body[\s>]/);
    fs.writeFileSync(file, html);
  }
  fs.writeFileSync(path.join(__dirname, 'en-strings.json'), JSON.stringify(enStrings, null, 2) + '\n');
}

let problems = 0;
for (const [code, r] of Object.entries(report)) {
  problems += r.missing.length;
  console.log(`${code}: ${r.missing.length} missing, ${r.unused.length} unused`);
  for (const m of r.missing) console.log(`   missing  ${m}`);
  for (const u of r.unused) console.log(`   unused   ${u}`);
}
process.exitCode = problems ? 1 : 0;
