import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getDocumentProxy } from "npm:unpdf@1.8.1";

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";
const FINGERPRINT_VERSION = 5;
const PARSER_VERSION = 19;
const SEMANTIC_RE = /(кешбек|cashback|категор|партнер|акці|пропозиці|знижк|бонус|винагород|mcc)/i;
const VALUE_RE = /(\d+(?:[.,]\d+)?\s*%|₴|\bгрн\b|\bдо\s+\d|\b20\d{2}\b|\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b)/i;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
function decodeBasicEntities(s: string) {
  return s.replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&mdash;|&#8212;/gi, "—").replace(/&ndash;|&#8211;/gi, "–").replace(/&laquo;|&#171;/gi, "«").replace(/&raquo;|&#187;/gi, "»").replace(/&rsquo;|&#8217;/gi, "’");
}
function cleanText(html: string) {
  return decodeBasicEntities(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ").replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ").replace(/<!--([\s\S]*?)-->/g, " ").replace(/<br\b[^>]*>/gi, "\n").replace(/<\/(?:p|div|li|section|article|main|aside|header|footer|h[1-6]|tr|td|th|ul|ol)>/gi, "\n").replace(/<[^>]+>/g, " "))
    .split(/\r?\n/).map((line) => line.replace(/[\t\f\v ]+/g, " ").trim()).filter(Boolean).join("\n").trim();
}
function focusText(text: string) {
  const rawChunks = text.split(/\n+|(?<=[.!?;:])\s+(?=[A-ZА-ЯІЇЄҐ0-9])/u).map((x) => x.replace(/\s+/g, " ").trim()).filter((x) => x.length >= 2 && x.length <= 1200);
  const chunks: string[] = [], seen = new Set<string>();
  for (const c of rawChunks) { const key = c.toLocaleLowerCase("uk-UA"); if (!seen.has(key)) { seen.add(key); chunks.push(c); } }
  const keep = new Set<number>();
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i], semantic = SEMANTIC_RE.test(c), valued = VALUE_RE.test(c);
    if ((semantic && c.length >= 14) || (semantic && valued)) {
      for (let j = Math.max(0, i - 3); j <= Math.min(chunks.length - 1, i + 4); j++) {
        const n = chunks[j]; if (j === i || VALUE_RE.test(n) || SEMANTIC_RE.test(n) || n.length >= 20) keep.add(j);
      }
    }
    if (valued && /%|₴|грн/i.test(c) && c.length <= 500) keep.add(i);
  }
  let selected = [...keep].sort((a,b)=>a-b).map((i)=>chunks[i]); if (!selected.length) selected = chunks.slice(0,120);
  return selected.map((x)=>x.replace(/\b(?:сьогодні|зараз)\b/gi,(m)=>m.toLowerCase())).join("\n").slice(0,100_000);
}
async function sha256(input: string) { const bytes = new TextEncoder().encode(input); const digest = await crypto.subtle.digest("SHA-256", bytes); return Array.from(new Uint8Array(digest)).map((b)=>b.toString(16).padStart(2,"0")).join(""); }
function detectAccessBlock(raw: string) {
  const s = String(raw || "");
  const incapsula = /_Incapsula_Resource|\bincapsula\b|\bimperva\b/i.test(s);
  const noIndexChallenge = /<meta[^>]+name\s*=\s*["']?robots["']?[^>]+content\s*=\s*["']?noindex\s*,\s*nofollow/i.test(s);
  if (incapsula && (s.length < 5_000 || noIndexChallenge)) return "antibot_incapsula";
  const cloudflare = /cf-chl-|challenge-platform|Just a moment(?:\.\.\.)?/i.test(s);
  if (cloudflare && (s.length < 20_000 || /<title[^>]*>\s*Just a moment/i.test(s))) return "antibot_challenge";
  if (s.length < 20_000 && (/<title>\s*Access Denied\s*<\/title>|\baccess denied\b/i.test(s))) return "access_denied";
  return null;
}
function titleFromHtml(html: string) { const m=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i); return m ? cleanText(m[1]).slice(0,300) : null; }

function parseRateNumber(raw) {
  const n = Number(String(raw || "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}
function uniqNumbers(values) {
  return [...new Set(values.map((x) => Number(x.toFixed(4))))].sort((a, b) => b - a);
}
function parseIsoNumericDate(raw) {
  const m = String(raw || "").match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
  if (!m) return null;
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
  return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
const UA_MONTHS = {"січня":1,"лютого":2,"березня":3,"квітня":4,"травня":5,"червня":6,"липня":7,"серпня":8,"вересня":9,"жовтня":10,"листопада":11,"грудня":12};
function parseUaDate(raw, fallbackYear) {
  const numeric = parseIsoNumericDate(raw);
  if (numeric) return numeric;
  const m = String(raw || "").toLowerCase().match(/(\d{1,2})\s+(січня|лютого|березня|квітня|травня|червня|липня|серпня|вересня|жовтня|листопада|грудня)(?:\s+(20\d{2}))?/iu);
  if (!m) return null;
  const d = Number(m[1]), mo = UA_MONTHS[m[2]], y = Number(m[3] || fallbackYear || 0);
  if (!y || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function extractWindow(text) {
  const compact = String(text || "").replace(/\s+/g, " ");
  const ranges = [];
  for (const m of compact.matchAll(/з\s+(\d{1,2}[./-]\d{1,2}[./-]20\d{2})\s*(?:р(?:оку)?\.?\s*)?(?:по|до|–|—|-)\s*(\d{1,2}[./-]\d{1,2}[./-]20\d{2})/giu)) {
    const a = parseIsoNumericDate(m[1]), b = parseIsoNumericDate(m[2]);
    if (a && b) ranges.push({valid_from:a, valid_to:b});
  }
  for (const m of compact.matchAll(/з\s+(\d{1,2}\s+(?:січня|лютого|березня|квітня|травня|червня|липня|серпня|вересня|жовтня|листопада|грудня)(?:\s+20\d{2})?)\s*(?:року\s*)?(?:по|до|–|—|-)\s*(\d{1,2}\s+(?:січня|лютого|березня|квітня|травня|червня|липня|серпня|вересня|жовтня|листопада|грудня)\s+20\d{2})/giu)) {
    const end = parseUaDate(m[2]);
    const endYear = end ? Number(end.slice(0,4)) : null;
    const start = parseUaDate(m[1], endYear);
    if (start && end) ranges.push({valid_from:start, valid_to:end});
  }
  const uniqueRanges = [...new Map(ranges.map((r) => [`${r.valid_from}|${r.valid_to}`, r])).values()];

  const starts = [];
  const relevantStem = "(?:кешбек|cashback|програм|акці|лояльн|категор)";
  const startNum = new RegExp(relevantStem+"[^.]{0,180}?(?:діє|діють|чинн|триває|проводиться|–|-|:)?[^.]{0,50}?з\\s+(\\d{1,2}[./-]\\d{1,2}[./-]20\\d{2})","giu");
  for (const m of compact.matchAll(startNum)) {
    const d = parseIsoNumericDate(m[1]); if (d) starts.push(d);
  }
  const startWords = new RegExp(relevantStem+"[^.]{0,180}?(?:діє|діють|чинн|триває|проводиться|–|-|:)?[^.]{0,50}?з\\s+(\\d{1,2}\\s+(?:січня|лютого|березня|квітня|травня|червня|липня|серпня|вересня|жовтня|листопада|грудня)\\s+20\\d{2})","giu");
  for (const m of compact.matchAll(startWords)) {
    const d = parseUaDate(m[1]); if (d) starts.push(d);
  }
  const latestStart = starts.sort().at(-1) || null;

  if (uniqueRanges.length === 1) {
    const r = uniqueRanges[0];
    if (latestStart && latestStart > r.valid_to) return {valid_from:latestStart, valid_to:null};
    return r;
  }
  if (uniqueRanges.length > 1) return {valid_from:null, valid_to:null};
  if (latestStart) return {valid_from:latestStart, valid_to:null};

  const monthForms = {
    "січень":1,"січні":1,"лютий":2,"лютому":2,"березень":3,"березні":3,
    "квітень":4,"квітні":4,"травень":5,"травні":5,"червень":6,"червні":6,
    "липень":7,"липні":7,"серпень":8,"серпні":8,"вересень":9,"вересні":9,
    "жовтень":10,"жовтні":10,"листопад":11,"листопаді":11,"грудень":12,"грудні":12
  };
  const monthMatches = [];
  const now = new Date();
  const inferYear = (mo) => {
    const y = now.getUTCFullYear();
    const candidates = [y-1,y,y+1].map((yy)=>({yy,dist:Math.abs(Date.UTC(yy,mo-1,1)-Date.UTC(y,now.getUTCMonth(),now.getUTCDate()))}));
    return candidates.sort((a,b)=>a.dist-b.dist)[0].yy;
  };
  for (const m of compact.toLowerCase().matchAll(/(?:кешбек|cashback|категор)[^.]{0,120}?(?:на|у|в)\s+(січень|січні|лютий|лютому|березень|березні|квітень|квітні|травень|травні|червень|червні|липень|липні|серпень|серпні|вересень|вересні|жовтень|жовтні|листопад|листопаді|грудень|грудні)(?:\s+(20\d{2}))?/giu)) {
    const mo = monthForms[m[1]], y = Number(m[2] || inferYear(mo));
    if (mo && y) {
      const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
      monthMatches.push({valid_from:`${y}-${String(mo).padStart(2,"0")}-01`,valid_to:`${y}-${String(mo).padStart(2,"0")}-${String(last).padStart(2,"0")}`});
    }
  }
  const uniqueMonths=[...new Map(monthMatches.map((r)=>[`${r.valid_from}|${r.valid_to}`,r])).values()];
  if(uniqueMonths.length===1) return uniqueMonths[0];

  const ends = [];
  const endNum = new RegExp(relevantStem+"[^.]{0,180}?(?:діє|діють|чинн|триває|проводиться|–|-|:)?[^.]{0,50}?до\\s+(\\d{1,2}[./-]\\d{1,2}[./-]20\\d{2})","giu");
  for (const m of compact.matchAll(endNum)) {
    const d = parseIsoNumericDate(m[1]); if (d) ends.push(d);
  }
  const endWords = new RegExp(relevantStem+"[^.]{0,180}?(?:діє|діють|чинн|триває|проводиться|–|-|:)?[^.]{0,50}?до\\s+(\\d{1,2}\\s+(?:січня|лютого|березня|квітня|травня|червня|липня|серпня|вересня|жовтня|листопада|грудня)\\s+20\\d{2})","giu");
  for (const m of compact.matchAll(endWords)) {
    const d = parseUaDate(m[1]); if (d) ends.push(d);
  }
  const uniqueEnds = [...new Set(ends)];
  return uniqueEnds.length === 1 ? {valid_from:null, valid_to:uniqueEnds[0]} : {valid_from:null, valid_to:null};
}
function compactLabel(s) {
  return String(s || "").replace(/^[•·*\-\s]+/,"").replace(/[;:.]+$/,"").replace(/\s+/g," ").trim();
}
function labelLooksLikeCategory(s) {
  const x = compactLabel(s);
  if (x.length < 3 || x.length > 90) return false;
  if (/^(до|від|кешбек|cashback|знижка|акція|пропозиція)$/iu.test(x)) return false;
  if (/(процентн|річн|комісі|подат|кредит|пільгов|ліміт|депозит|залишок|ставк)/iu.test(x)) return false;
  return true;
}
function splitTargets(raw) {
  return compactLabel(raw)
    .replace(/\([^)]*\)/g," ")
    .split(/\s*,\s*|\s+та\s+|\s+і\s+/iu)
    .map(compactLabel)
    .filter(labelLooksLikeCategory)
    .slice(0,8);
}
const DEFINED_CATEGORY_POOL = [
  ["Краса", /(?:^|\n)Краса\s*\(/iu],
  ["Медицина", /(?:^|\n)Медицина\s*\(/iu],
  ["Продукти та супермаркети", /(?:^|\n)Продукти(?:\s+та\s+супермаркети)?\s*\(/iu],
  ["Авто та АЗС", /(?:^|\n)Авто\s+та\s+АЗС\s*\(/iu],
  ["Одяг та взуття", /(?:^|\n)Одяг\s+та\s+взуття\s*\(/iu],
  ["Мандри", /(?:^|\n)Мандри\s*\(/iu],
  ["Розваги та спорт", /(?:^|\n)Розваги\s+та\s+спорт\s*\(/iu],
  ["Кафе та ресторани", /(?:^|\n)Кафе\s+та\s+ресторани\s*\(/iu],
  ["Кіно", /(?:^|\n)Кіно\s*\(/iu],
  ["Таксі", /(?:^|\n)Таксі\s*\(/iu],
  ["Тварини", /(?:^|\n)Тварини\s*\(/iu],
  ["Книги", /(?:^|\n)Книги\s*\(/iu],
  ["Відеоігри", /(?:^|\n)Відеоігри\s*\(/iu],
  ["Квіти", /(?:^|\n)Квіти\s*\(/iu],
  ["Фастфуд", /(?:^|\n)Фастфуд\s*\(/iu],
  ["Техніка", /(?:^|\n)Техніка\s*\(/iu],
  ["Дитячі товари", /(?:^|\n)Дитячі\s+товари\s*\(/iu],
  ["Транспорт", /(?:^|\n)Транспорт\s*\(/iu],
  ["Duty Free", /(?:^|\n)Duty\s*Free\s*\(/iu],
];
function extractMccTableCategoryPool(text) {
  const raw = String(text || "");
  const appendixIndex = raw.search(/Додаток\s*1[^\n]*(?:МСС|MCC)|Категорія\s+(?:перелік\s*)?(?:МСС|MCC)/iu);
  if (appendixIndex < 0) return [];
  const appendixRaw = raw.slice(appendixIndex);
  const normalizedAppendix = appendixRaw.replace(/\s+/g," ").toLocaleLowerCase("uk-UA");
  const knownCategories = [
    "Duty Free","Quasi Cash","Авіаквитки","Аврора та інші мультимаркети","Автосервіси","АЗС","Аптеки",
    "Благодійність","Готелі","Грошові перекази","Доставка","Ігри та застосунки","Кафе та ресторани",
    "Квіти","Кіно та театри","Книги","Комунальні послуги","Краса та догляд","Маркетплейси",
    "Медичні заклади","Одяг та взуття","Операції в банкоматі","Оренда авто","Побутова техніка",
    "Прикраси та подарунки","Продукти та супермаркети","Розваги","Спорт","Страхування","Таксі",
    "Товари для дітей","Транспорт","Усе для дому","Усе для тварин","Хімчистка","Поповнення мобільного телефону"
  ];
  const known = knownCategories.filter(name=>normalizedAppendix.includes(name.toLocaleLowerCase("uk-UA")));
  if (known.length >= 3) return known;

  const lines = appendixRaw.split(/\n+/).map(compactLabel).filter(Boolean);
  const pool = [];
  const seen = new Set();
  const cleanup = (name) => String(name || "")
    .replace(/^Категорія\s+/iu,"")
    .replace(/^(?:послуг|товарів|операцій)\s+(?=[А-ЯІЇЄҐA-Z])/u,"")
    .replace(/\s+Категорія$/iu,"")
    .replace(/\s+/g," ")
    .trim();
  const add = (name) => {
    const x = cleanup(name);
    if (!x || x.length < 2 || x.length > 80) return;
    if (!/[\p{L}]/u.test(x)) return;
    if (/^(?:Додаток.*|Категорія|перелік\s*(?:МСС|MCC)|МСС|MCC|послуг|товарів|операцій)$/iu.test(x)) return;
    const key = x.toLocaleLowerCase("uk-UA");
    if (!seen.has(key)) { seen.add(key); pool.push(x); }
  };
  let pendingLabels = [];
  for (let i = 0; i < lines.length && i < 260; i++) {
    const line = lines[i];
    const row = line.match(/^([\p{L}][\p{L}\p{M}\s’'&+./()\-]{1,79}?)\s+((?:0\d{3}|[1-9]\d{3})(?:\s+(?:0\d{3}|[1-9]\d{3})){0,160})(?:\s|$)/u);
    if (row) {
      add(row[1]);
      pendingLabels = [];
      continue;
    }
    const numericOnly = /^(?:0\d{3}|[1-9]\d{3})(?:\s+(?:0\d{3}|[1-9]\d{3})){0,200}$/u.test(line);
    if (numericOnly) {
      if (pendingLabels.length) add(pendingLabels.join(" "));
      pendingLabels = [];
      continue;
    }
    const labelOnly = /^[\p{L}][\p{L}\p{M}\s’'&+./()\-]{1,59}$/u.test(line);
    if (labelOnly && !/^(?:Категорія|перелік\s*(?:МСС|MCC)|МСС|MCC)$/iu.test(line)) {
      pendingLabels.push(line);
      if (pendingLabels.length > 2) pendingLabels.shift();
    } else {
      pendingLabels = [];
    }
  }
  return pool.length >= 3 ? pool : [];
}
function extractDefinedCategoryPool(text) {
  const raw = String(text || "");
  const pool = [];
  for (const [name, re] of DEFINED_CATEGORY_POOL) {
    if (re.test(raw)) pool.push(name);
  }
  const mccPool = extractMccTableCategoryPool(raw);
  const merged = [...pool];
  const keys = new Set(pool.map(x=>x.toLocaleLowerCase("uk-UA")));
  for (const name of mccPool) {
    const key=name.toLocaleLowerCase("uk-UA");
    if(!keys.has(key)){keys.add(key);merged.push(name);}
  }
  return merged.length >= 3 ? merged : [];
}
function nearestDateWindow(lines, idx) {
  return extractWindow(lines.slice(Math.max(0, idx - 3), Math.min(lines.length, idx + 4)).join(" "));
}
function safeDbText(s) {
  return String(s || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ").replace(/[ \t]+/g, " ");
}
function extractStructured(source, focused, title) {
  const sourceRole = source?.source_role || "primary";
  const dataMode = source?.data_mode || "fixed";
  const publishPolicy = source?.publish_policy || "review_required";
  const profile = source?.parser_profile || "generic";
  const raw = String(focused || "");
  const binaryLike = /%PDF-\d|\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008/.test(raw);
  const base = {
    parser_version: PARSER_VERSION,
    source_id: source?.id || null,
    bank: source?.bank || null,
    source_url: source?.url || null,
    source_role: sourceRole,
    data_mode: dataMode,
    publish_policy: publishPolicy,
    parser_profile: profile,
    review_policy: {
      auto_publish: false,
      official_primary: sourceRole === "primary",
      reference_only: sourceRole === "reference",
      manual_only: dataMode === "dynamic" || dataMode === "personalized" || publishPolicy === "manual_only",
      requires_human_review: true
    }
  };
  if (binaryLike) return { ...base, unsupported: true, reason: "binary_or_pdf_text", items: [], rates_percent: [], mcc: [], limits: {}, valid_from: null, valid_to: null };

  const lines = raw.split(/\n+/).map(compactLabel).filter(Boolean);
  const allText = [title || "", raw].filter(Boolean).join("\n");
  const rates = uniqNumbers([...allText.matchAll(/(\d{1,3}(?:[.,]\d+)?)\s*%/g)].map((m) => parseRateNumber(m[1])).filter((x) => x !== null));
  const globalWindow = extractWindow(allText);

  let maxCashback = null;
  const maxCashbackCandidates = [];
  let minPurchase = null;
  const bonusAmounts = [];
  const mcc = new Set();
  const conditionLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const limitContext = [line, lines[i+1] || ""].join(" ");
    const maxMatch = limitContext.match(/(?:максимальн[\p{L}\p{M}]*\s+(?:(?:сума|розмір).{0,80}(?:кешбек|винагород)|кешбек)|поверт[\p{L}\p{M}]*.{0,50}на рахунок до)[^\d]{0,120}(\d[\d\s]{0,12})(?:\s*\([^)]*\))?\s*(?:грн|₴|грив(?:ень|ні|ня)?)/iu);
    if (maxMatch) {
      const v = Number(maxMatch[1].replace(/\s+/g,""));
      if (Number.isFinite(v) && v > 0 && v <= 100000) maxCashbackCandidates.push(v);
    }
    if (/(мінімальн[\p{L}\p{M}]*\s+сума\s+(?:транзакц[\p{L}\p{M}]*|покупк[\p{L}\p{M}]*)|покуп[\p{L}\p{M}]*\s+від\s+\d+\s*(?:грн|грив))/iu.test(line)) {
      const mm = line.match(/(\d+(?:[.,]\d+)?)\s*(?:грн|грив)/iu);
      if (mm) {
        const v = Number(mm[1].replace(",","."));
        if (Number.isFinite(v) && v >= 0 && v <= 100000) minPurchase = v;
      }
    }
    for (const bm of line.matchAll(/(\d[\d\s]{0,10})\s+бонус(?:ів|и|а)?\b/giu)) {
      const v = Number(bm[1].replace(/\s+/g,""));
      if (Number.isFinite(v) && v > 0 && v <= 1000000) bonusAmounts.push(v);
    }
    if (/(?:MCC|МСС)/iu.test(line)) {
      const local = [line, lines[i+1] || "", lines[i+2] || "", lines[i+3] || ""].join(" ");
      for (const mm of local.matchAll(/\b([1-9]\d{3})\b/g)) mcc.add(mm[1]);
    }
    if (/(активуй|активувати|обира[\p{L}\p{M}]+\s+\d+\s+категор|власн[\p{L}\p{M}]*\s+або\s+кредитн|картк[\p{L}\p{M}]*\s+(?:visa|mastercard|radacard)|реєстр[\p{L}\p{M}]+\s+картк|персоналізован)/iu.test(line)) {
      if (conditionLines.length < 14) conditionLines.push(line.slice(0,320));
    }
  }

  const uniqueMaxCashbackCandidates = [...new Set(maxCashbackCandidates)].sort((a,b)=>a-b);
  maxCashback = uniqueMaxCashbackCandidates.length === 1 ? uniqueMaxCashbackCandidates[0] : null;

  const items = [];
  const pushItem = (item) => {
    const key = JSON.stringify([item.kind,item.name,item.category,item.partner,item.rate_percent,item.valid_from,item.valid_to]);
    if (!items.some((x) => JSON.stringify([x.kind,x.name,x.category,x.partner,x.rate_percent,x.valid_from,x.valid_to]) === key)) items.push(item);
  };

  if (profile === "categories" || profile === "cashback" || profile === "reference_matrix") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const paired = line.match(/(\d{1,3}(?:[.,]\d+)?)\s*%\s*кешбек[\p{L}\p{M}]*\s+за\s+(.+?)\s+та\s+(\d{1,3}(?:[.,]\d+)?)\s*%\s*кешбек[\p{L}\p{M}]*\s+на\s+категор[\p{L}\p{M}]*\s+[«"]?([^»"]{3,90})[»"]?/iu);
      if (paired) {
        const firstRate=parseRateNumber(paired[1]), secondRate=parseRateNumber(paired[3]);
        const w=nearestDateWindow(lines,i);
        if(firstRate!==null){
          const firstName=compactLabel(paired[2]);
          pushItem({kind:"promo",name:firstName,category:null,partner:null,rate_percent:firstRate,rate_text:`${paired[1]}%`,valid_from:w.valid_from||globalWindow.valid_from,valid_to:w.valid_to||globalWindow.valid_to,evidence:[line]});
        }
        if(secondRate!==null){
          const category=compactLabel(paired[4]);
          pushItem({kind:"category",name:category,category,partner:null,rate_percent:secondRate,rate_text:`${paired[3]}%`,valid_from:w.valid_from||globalWindow.valid_from,valid_to:w.valid_to||globalWindow.valid_to,evidence:[line]});
        }
        continue;
      }
      let m = line.match(/^(.{3,90}?)\s*[—–-]\s*(\d{1,3}(?:[.,]\d+)?)\s*%/u);
      if (m && labelLooksLikeCategory(m[1])) {
        const rate = parseRateNumber(m[2]);
        if (rate !== null) {
          const category = compactLabel(m[1]);
          const w = nearestDateWindow(lines, i);
          pushItem({ kind:"category", name:category, category, partner:null, rate_percent:rate, rate_text:`${m[2]}%`, valid_from:w.valid_from || globalWindow.valid_from, valid_to:w.valid_to || globalWindow.valid_to, evidence:[line] });
        }
        continue;
      }
      m = line.match(/^(\d{1,3}(?:[.,]\d+)?)\s*%\s*(?:кешбек[\p{L}\p{M}]*)?\s*(?:на|за|у|в)\s+(.{3,120})$/iu);
      if (m) {
        const rate = parseRateNumber(m[1]);
        if (rate !== null) {
          const targets = splitTargets(m[2]);
          const w = nearestDateWindow(lines, i);
          for (const target of targets) {
            const looksPartner = /\.ua\b|prom\b|rozetka\b|waudog\b|pleso\b|klr\b|hillary\b|sister'?s aroma\b|kodi\b|veloplanet|велопланет/iu.test(target);
            const looksBase = /^(?:усі|всі)\s+інші/iu.test(target);
            const kind = looksPartner ? "partner" : (looksBase ? "base" : "category");
            const display = looksBase ? "Інші покупки" : target;
            pushItem({ kind, name:display, category:kind==="category"?display:null, partner:kind==="partner"?display:null, rate_percent:rate, rate_text:`${m[1]}%`, valid_from:w.valid_from || globalWindow.valid_from, valid_to:w.valid_to || globalWindow.valid_to, evidence:[line] });
          }
        }
      }
    }
  }

  if (profile === "promos" || profile === "rules") {
    const promoLines = title ? [title, ...lines] : lines;
    for (let i = 0; i < promoLines.length; i++) {
      const line = promoLines[i];
      if (!/%/.test(line) || !/(кешбек|знижк|cashback)/iu.test(line)) continue;
      if (/(річн|ставк|комісі|подат)/iu.test(line)) continue;
      const rm = line.match(/(\d{1,3}(?:[.,]\d+)?)\s*%/);
      const rate = rm ? parseRateNumber(rm[1]) : null;
      if (rate === null) continue;
      const realIdx = title && i === 0 ? 0 : Math.max(0, i - (title ? 1 : 0));
      const w = nearestDateWindow(lines, realIdx);
      pushItem({
        kind:"promo",
        name:compactLabel(line).slice(0,180),
        category:null,
        partner:null,
        rate_percent:rate,
        rate_text:`${rm[1]}%`,
        valid_from:w.valid_from || globalWindow.valid_from,
        valid_to:w.valid_to || globalWindow.valid_to,
        evidence:[line]
      });
    }
  }

  let finalItems = items;
  if (profile === "promos" && items.length > 1) {
    const groups = new Map();
    for (const item of items) {
      const key = [item.rate_percent,item.valid_from||"",item.valid_to||""].join("|");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    if (groups.size === 1) {
      const one = [...groups.values()][0];
      finalItems = [one.slice().sort((a,b)=>String(a.name||"").length-String(b.name||"").length)[0]];
    }
  }
  const cleanItems = finalItems.slice(0,80).map((item) => ({
    ...item,
    conditions: conditionLines.slice(0,8),
    max_cashback_uah: maxCashback,
    min_purchase_uah: minPurchase,
    mcc: [...mcc]
  }));

  return {
    ...base,
    unsupported: false,
    rates_percent: rates,
    valid_from: globalWindow.valid_from,
    valid_to: globalWindow.valid_to,
    limits: {
      max_cashback_uah: maxCashback,
      max_cashback_candidates_uah: uniqueMaxCashbackCandidates,
      min_purchase_uah: minPurchase,
      bonus_amounts: [...new Set(bonusAmounts)].slice(0,20)
    },
    mcc: [...mcc].slice(0,60),
    conditions: conditionLines,
    items: cleanItems,
    item_count: cleanItems.length,
    confidence: cleanItems.length ? (sourceRole === "primary" && dataMode === "fixed" ? "review_ready" : "signal_only") : "summary_only"
  };
}
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const service = createClient(url, serviceKey, { auth: { persistSession: false } });
  const cronSecret = req.headers.get("x-saveflow-cron") || "";
  const { data: secretOk, error: secretError } = await service.rpc("validate_scanner_cron_secret", { p_secret: cronSecret });
  if (secretError || secretOk !== true) return json({ error: "Unauthorized" }, 401);

  const { data: sources, error: sourceError } = await service.from("scanner_sources").select("*").eq("enabled", true).order("source_role", { ascending: true }).order("bank", { ascending: true, nullsFirst: false });
  if (sourceError) return json({ error: sourceError.message }, 500);

  const { data: run, error: runError } = await service.from("scanner_runs").insert({ triggered_by: null, trigger_kind: "scheduled_monthly", total_sources: sources?.length || 0, status: "running" }).select("id").single();
  if (runError || !run) return json({ error: runError?.message || "Could not create run" }, 500);

  let changed=0, failed=0, candidates=0;
  const results: unknown[]=[];

  async function extractPdfText(bytes: Uint8Array) {
  const pdf = await getDocumentProxy(bytes);
  try {
    if (pdf.numPages > 320) throw new Error(`PDF has too many pages: ${pdf.numPages}`);
    const pages: string[] = [];
    let chars = 0;
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      let pageText = "";
      for (const item of (content.items || []) as any[]) {
        const str = typeof item?.str === "string" ? item.str : "";
        if (!str) continue;
        pageText += str + (item?.hasEOL ? "\n" : " ");
      }
      pageText = pageText.split(/\n+/).map((line) => line.replace(/[ \t]+/g, " ").trim()).filter(Boolean).join("\n");
      if (pageText) { pages.push(pageText); chars += pageText.length + 1; }
      if (chars >= 180_000) break;
    }
    return pages.join("\n");
  } finally {
    try { await pdf.destroy(); } catch (_) {}
  }
}

async function readFetchedResponse(res: Response) {
  const bytes = new Uint8Array(await res.arrayBuffer());
  const contentType = String(res.headers.get("content-type") || "");
  const magic = bytes.length >= 5 ? String.fromCharCode(...bytes.slice(0, 5)) : "";
  const isPdf = /application\/pdf/i.test(contentType) || magic === "%PDF-";
  if (isPdf) {
    const raw = await extractPdfText(bytes);
    return { raw, responseBytes: bytes.byteLength, documentType: "pdf", contentType };
  }
  return { raw: new TextDecoder().decode(bytes), responseBytes: bytes.byteLength, documentType: "html", contentType };
}
async function loadSource(source: any) {
    let directError: unknown = null;
    let blockedDirect: { status: number; raw: string; responseBytes?: number; documentType?: string; contentType?: string; transport: string } | null = null;
    try {
      const res = await fetch(source.url, { redirect:"follow", headers:{ "User-Agent":BROWSER_UA, "Accept":"text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8", "Accept-Language":"uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7", "Cache-Control":"no-cache", "Pragma":"no-cache" }, signal:AbortSignal.timeout(15_000) });
      const fetched=await readFetchedResponse(res), raw=fetched.raw; if (res.ok) return { status:res.status, raw, responseBytes:fetched.responseBytes, documentType:fetched.documentType, contentType:fetched.contentType, transport:fetched.documentType==="pdf"?"edge_fetch_pdf":"edge_fetch" }; if (detectAccessBlock(raw)) blockedDirect={ status:res.status, raw, responseBytes:fetched.responseBytes, documentType:fetched.documentType, contentType:fetched.contentType, transport:"edge_fetch_blocked" }; directError=new Error(`HTTP ${res.status}`);
    } catch(e) { directError=e; }
    const { data, error } = await service.rpc("scanner_fetch_source", { p_source_id: source.id });
    const row=Array.isArray(data)?data[0]:data;
    if (!error && row) { const fallbackRaw=String(row.content||""); if (Number(row.status)>=200 && Number(row.status)<300) return { status:Number(row.status), raw:fallbackRaw, transport:"db_http_fallback" }; if (detectAccessBlock(fallbackRaw)) return { status:Number(row.status), raw:fallbackRaw, transport:"db_http_fallback_blocked" }; }
    if (blockedDirect) return blockedDirect;
    const f=error?.message||(row?`HTTP ${row.status}`:"Fallback returned no data"); const d=directError instanceof Error?directError.message:String(directError||"Direct fetch failed"); throw new Error(`${d}; fallback: ${f}`);
  }

  async function scanOne(source:any) {
    const oldHash=source.last_hash||null, sourceFingerprintVersion=Number(source.fingerprint_version||0);
    try {
      const loaded=await loadSource(source), raw=loaded.raw, responseBytes=Number(loaded.responseBytes||new TextEncoder().encode(raw).byteLength), accessBlock=loaded.documentType==="pdf"?null:detectAccessBlock(raw), text=loaded.documentType==="pdf"?String(raw||"").replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim():cleanText(raw), categoryPool=extractDefinedCategoryPool(text), focused=focusText(text), pageTitle=loaded.documentType==="pdf"?(source.purpose||source.bank||"Official PDF"):(safeDbText(titleFromHtml(raw)||'')||null);
      let structured=extractStructured(source, focused, pageTitle);
      structured={...structured,source_format:loaded.documentType||"html",content_type:loaded.contentType||null};
      if (categoryPool.length) structured={...structured,category_pool:categoryPool,category_pool_source:"official_definitions"};
      const safeFocused=safeDbText(focused);
      if (accessBlock) structured={...structured,unsupported:true,reason:accessBlock,items:[],item_count:0,rates_percent:[],mcc:[],limits:{},valid_from:null,valid_to:null};
      const fingerprintInput=accessBlock?`__source_health__:${accessBlock}:${source.url}`:safeFocused, hash=await sha256(fingerprintInput);
      const isInitial=!oldHash||sourceFingerprintVersion!==FINGERPRINT_VERSION, isChanged=!isInitial&&oldHash!==hash&&!structured.unsupported;
      const {error:snapshotError}=await service.from("scanner_snapshots").insert({ run_id:run.id, source_id:source.id, http_status:loaded.status, content_hash:hash, response_bytes:responseBytes, title:pageTitle, text_excerpt:structured.unsupported?"":safeFocused.slice(0,8000), error:null, parser_version:PARSER_VERSION, structured_payload:structured }); if(snapshotError) throw new Error("Snapshot insert failed: "+snapshotError.message);
      await service.from("scanner_sources").update({ last_checked_at:new Date().toISOString(), last_http_status:loaded.status, last_hash:hash, last_error:null, fingerprint_version:FINGERPRINT_VERSION }).eq("id",source.id);
      let candidate:any=null;
      if (isChanged) {
        changed++;
        let affected:any[]=[], type=source.source_role==="reference"?"reference_change_signal":"official_source_changed", priority=source.source_role==="reference"?"low":"normal";
        if (source.source_role==="reference") {
          const {data}=await service.from("scanner_matrix_index").select("cell_key,bank,category,current_value,source_tier,source_url").eq("source_url",source.url); affected=data||[];
        } else if (source.bank) {
          const matrixEvidenceProfile=["cashback","categories","rules"].includes(String(source.parser_profile||""));
          const hasComparableEvidence=Number(structured.item_count||0)>0||(Array.isArray(structured.category_pool)&&structured.category_pool.length>0);
          if (matrixEvidenceProfile&&hasComparableEvidence) { const {data}=await service.from("scanner_matrix_index").select("cell_key,bank,category,current_value,source_tier,source_url").eq("bank",source.bank).eq("source_tier","reference"); affected=data||[]; }
          if (matrixEvidenceProfile&&hasComparableEvidence&&affected.length) { type="reference_to_official_review"; priority="high"; }
          else if (source.data_mode==="dynamic"||source.data_mode==="personalized"||source.publish_policy==="manual_only") { type="dynamic_or_personalized_source_changed"; priority="high"; }
        }
        const {data,error}=await service.from("scanner_candidates").insert({ run_id:run.id, source_id:source.id, bank:source.bank||null, candidate_type:type, priority, source_role:source.source_role, old_hash:oldHash, new_hash:hash, affected_cells:affected, excerpt:safeFocused.slice(0,6000), parser_version:PARSER_VERSION, structured_payload:structured, status:"pending" }).select("id,candidate_type,priority").single();
        if (!error&&data) { candidate=data; candidates++; }
      }
      if (!candidate && source.source_role==="primary" && (structured.unsupported || safeFocused.trim().length<80)) {
        const {data:existingUnreadable}=await service.from("scanner_candidates").select("id").eq("source_id",source.id).eq("candidate_type","official_source_unreadable").eq("new_hash",hash).limit(1);
        if (!existingUnreadable?.length) {
          const unreadablePayload={...structured,source_health:{readable:false,detected_on:new Date().toISOString().slice(0,10),reason:structured.unsupported?(structured.reason||"unsupported_content"):"empty_or_too_short_excerpt",excerpt_length:safeFocused.trim().length,response_bytes:responseBytes,transport:loaded.transport,auto_publish:false}};
          const {data:unreadableCandidate,error:unreadableError}=await service.from("scanner_candidates").insert({run_id:run.id,source_id:source.id,bank:source.bank||null,candidate_type:"official_source_unreadable",priority:"high",source_role:source.source_role,old_hash:oldHash,new_hash:hash,affected_cells:[],excerpt:safeFocused.slice(0,6000),parser_version:PARSER_VERSION,structured_payload:unreadablePayload,status:"pending"}).select("id,candidate_type,priority").single();
          if (!unreadableError&&unreadableCandidate) { candidate=unreadableCandidate; candidates++; }
        }
      }
      if (!candidate && isInitial && source.source_role==="primary" && source.bank && ["cashback","categories","rules"].includes(String(source.parser_profile||"")) && !structured.unsupported && safeFocused.trim().length>=80 && (Number(structured.item_count||0)>0 || (Array.isArray(structured.category_pool)&&structured.category_pool.length>0))) {
        const {data:affected}=await service.from("scanner_matrix_index").select("cell_key,bank,category,current_value,source_tier,source_url").eq("bank",source.bank).eq("source_tier","reference");
        if (affected?.length) {
          const {data:existingBootstrap}=await service.from("scanner_candidates").select("id").eq("source_id",source.id).eq("candidate_type","reference_to_official_review").eq("new_hash",hash).limit(1);
          if (!existingBootstrap?.length) {
            const bootstrapPayload={...structured,bootstrap_review:{detected_on:new Date().toISOString().slice(0,10),reason:"official_source_added_for_reference_cells",affected_count:affected.length,auto_publish:false}};
            const {data:bootstrapCandidate,error:bootstrapError}=await service.from("scanner_candidates").insert({run_id:run.id,source_id:source.id,bank:source.bank,candidate_type:"reference_to_official_review",priority:"high",source_role:source.source_role,old_hash:oldHash,new_hash:hash,affected_cells:affected,excerpt:safeFocused.slice(0,6000),parser_version:PARSER_VERSION,structured_payload:bootstrapPayload,status:"pending"}).select("id,candidate_type,priority").single();
            if (!bootstrapError&&bootstrapCandidate) { candidate=bootstrapCandidate; candidates++; }
          }
        }
      }
      if (!candidate && source.source_role==="primary" && source.data_mode==="fixed" && source.publish_policy==="review_required" && !structured.unsupported && structured.valid_to) {
        const today=new Date().toISOString().slice(0,10);
        if (String(structured.valid_to)<today) {
          const {data:existingExpiry}=await service.from("scanner_candidates").select("id").eq("source_id",source.id).eq("candidate_type","official_source_expired").eq("new_hash",hash).limit(1);
          if (!existingExpiry?.length) {
            const {data:exactAffected}=await service.from("scanner_matrix_index").select("cell_key,bank,category,current_value,source_tier,source_url").eq("source_url",source.url);
            const expiryPayload={...structured,expiry_review:{expired_on:structured.valid_to,detected_on:today,reason:"official_source_validity_ended",auto_publish:false}};
            const {data:expiryCandidate,error:expiryError}=await service.from("scanner_candidates").insert({run_id:run.id,source_id:source.id,bank:source.bank||null,candidate_type:"official_source_expired",priority:"high",source_role:source.source_role,old_hash:oldHash,new_hash:hash,affected_cells:exactAffected||[],excerpt:safeFocused.slice(0,6000),parser_version:PARSER_VERSION,structured_payload:expiryPayload,status:"pending"}).select("id,candidate_type,priority").single();
            if (!expiryError&&expiryCandidate) { candidate=expiryCandidate; candidates++; }
          }
        }
      }
      results.push({source_id:source.id,bank:source.bank,status:loaded.status,transport:loaded.transport,fingerprint_version:FINGERPRINT_VERSION,parser_version:PARSER_VERSION,structured_items:structured.item_count||0,baseline:isInitial,changed:isChanged,candidate});
    } catch(e) {
      failed++; const message=e instanceof Error?e.message:String(e);
      await service.from("scanner_snapshots").insert({run_id:run.id,source_id:source.id,error:message.slice(0,1000)});
      await service.from("scanner_sources").update({last_checked_at:new Date().toISOString(),last_error:message.slice(0,1000)}).eq("id",source.id);
      results.push({source_id:source.id,bank:source.bank,baseline:!oldHash||sourceFingerprintVersion!==FINGERPRINT_VERSION,error:message});
    }
  }

  const list=sources||[];
  for (let i=0;i<list.length;i+=4) await Promise.all(list.slice(i,i+4).map(scanOne));
  const finalStatus=failed===list.length&&list.length>0?"failed":(failed?"partial":"completed");
  await service.from("scanner_runs").update({finished_at:new Date().toISOString(),status:finalStatus,changed_sources:changed,failed_sources:failed,candidates_created:candidates,summary:{fingerprint_version:FINGERPRINT_VERSION,parser_version:PARSER_VERSION,results}}).eq("id",run.id);
  return json({run_id:run.id,status:finalStatus,total_sources:list.length,changed_sources:changed,failed_sources:failed,candidates_created:candidates,fingerprint_version:FINGERPRINT_VERSION,parser_version:PARSER_VERSION,results});
});
