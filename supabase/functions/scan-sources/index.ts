import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";
const FINGERPRINT_VERSION = 6;
const PARSER_VERSION = 33;
const SEMANTIC_RE = /(кешбек|cashback|категор|партнер|акці|пропозиці|знижк|бонус|винагород|mcc)/i;
const VALUE_RE = /(\d+(?:[.,]\d+)?\s*%|₴|\bгрн\b|\bдо\s+\d|\b20\d{2}\b|\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b)/i;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function decodeBasicEntities(s: string) {
  return s
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&mdash;|&#8212;/gi, "—")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&laquo;|&#171;/gi, "«")
    .replace(/&raquo;|&#187;/gi, "»")
    .replace(/&rsquo;|&#8217;/gi, "’");
}

function cleanText(html: string) {
  return decodeBasicEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
      .replace(/<!--([\s\S]*?)-->/g, " ")
      .replace(/<br\b[^>]*>/gi, "\n")
      .replace(/<\/(?:p|div|li|section|article|main|aside|header|footer|h[1-6]|tr|td|th|ul|ol)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .split(/\r?\n/)
    .map((line) => line.replace(/[\t\f\v ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function focusText(text: string) {
  const rawChunks = text
    .split(/\n+|(?<=[.!?;:])\s+(?=[A-ZА-ЯІЇЄҐ0-9])/u)
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter((x) => x.length >= 2 && x.length <= 1200);

  const chunks: string[] = [];
  const seen = new Set<string>();
  for (const c of rawChunks) {
    const key = c.toLocaleLowerCase("uk-UA");
    if (!seen.has(key)) {
      seen.add(key);
      chunks.push(c);
    }
  }

  const keep = new Set<number>();
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const semantic = SEMANTIC_RE.test(c);
    const valued = VALUE_RE.test(c);
    const usefulAnchor = (semantic && c.length >= 14) || (semantic && valued);
    if (usefulAnchor) {
      for (let j = Math.max(0, i - 3); j <= Math.min(chunks.length - 1, i + 4); j++) {
        const neighbor = chunks[j];
        if (j === i || VALUE_RE.test(neighbor) || SEMANTIC_RE.test(neighbor) || neighbor.length >= 20) keep.add(j);
      }
    }
    if (valued && /%|₴|грн/i.test(c) && c.length <= 500) keep.add(i);
  }

  let selected = [...keep].sort((a, b) => a - b).map((i) => chunks[i]);
  if (!selected.length) selected = chunks.slice(0, 120);

  return selected
    .map((x) => x.replace(/\b(?:сьогодні|зараз)\b/gi, (m) => m.toLowerCase()))
    .join("\n")
    .slice(0, 100_000);
}

async function sha256(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function sha256Bytes(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
function titleFromHtml(html: string) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? cleanText(m[1]).slice(0, 300) : null;
}

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
const RAIF_MCC_CATEGORIES = [
  "Duty Free","Quasi Cash","Авіаквитки","Аврора та інші мультимаркети","Автосервіси","АЗС","Аптеки",
  "Благодійність","Готелі","Грошові перекази","Доставка","Ігри та застосунки","Кафе та ресторани",
  "Квіти","Кіно та театри","Книги","Комунальні послуги","Краса та догляд","Маркетплейси",
  "Медичні заклади","Одяг та взуття","Операції в банкоматі","Оренда авто","Побутова техніка",
  "Прикраси та подарунки","Продукти та супермаркети","Розваги","Спорт","Страхування","Таксі",
  "Товари для дітей","Транспорт","Усе для дому","Усе для тварин","Хімчистка","Поповнення мобільного телефону"
];
const IZI_MCC_CATEGORIES = [
  "Одяг та взуття","Тварини","Авто та азс","Продукти і супермаркети","Медицина і косметологія",
  "Кафе і ресторани","Книги","Квіти","Таксі і транспорт","Подорожі","Спорт і розваги",
  "Ремонт та будівництво","Електроніка та побутова техніка","Фастфуд","Кінотеатри","Різне"
];
function extractKnownSourceCategoryPool(text, sourceId) {
  const raw = String(text || "");
  const appendixIndex = raw.search(/Додаток\s*1|Назва\s+категорії|Категорія\s+(?:перелік\s*)?(?:МСС|MCC)/iu);
  if (appendixIndex < 0) return [];
  const normalized = raw.slice(appendixIndex).replace(/\s+/g," ").toLocaleLowerCase("uk-UA");
  const wanted = sourceId==="raif-cashback" ? RAIF_MCC_CATEGORIES
    : sourceId==="izibank-cashback-rules" ? IZI_MCC_CATEGORIES
    : null;
  if (!wanted) return [];
  const found=wanted.filter(name=>normalized.includes(name.toLocaleLowerCase("uk-UA")));
  if(sourceId==="izibank-cashback-rules" && /бонуси\s+на\s+усі\s+покупки/iu.test(raw)) found.push("Усі покупки");
  return [...new Set(found)];
}
function extractMccTableCategoryPool(text) {
  const raw = String(text || "");
  const appendixIndex = raw.search(/Додаток\s*1[^\n]*(?:МСС|MCC)|Категорія\s+(?:перелік\s*)?(?:МСС|MCC)/iu);
  if (appendixIndex < 0) return [];
  const appendixRaw = raw.slice(appendixIndex);
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
    const row = line.match(/^([\p{L}][\p{L}\p{M}\s’'&+./()\-]{1,79}?)\s+((?:0\d{3}|[1-9]\d{3})(?:[\s,;\-–]+(?:0\d{3}|[1-9]\d{3})){0,160})(?:\s|$)/u);
    if (row) {
      add(row[1]);
      pendingLabels = [];
      continue;
    }
    const numericOnly = /^(?:0\d{3}|[1-9]\d{3})(?:[\s,;\-–]+(?:0\d{3}|[1-9]\d{3})){0,200}$/u.test(line);
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
function extractDefinedCategoryPool(text, sourceId="") {
  const raw = String(text || "");
  const sourcePool = extractKnownSourceCategoryPool(raw, sourceId);
  if (sourcePool.length >= 3) return sourcePool;
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
function normalizeCreditDniproStructured(text, structured) {
  const raw = String(text || "");
  const start = raw.search(/Пропозиції\s+від\s+партнерів/iu);
  let partnerLines = [];
  if (start >= 0) {
    const tail = raw.slice(start);
    const stopMatch = tail.slice(1).search(/(?:Завантажуйте|Станьте\s+партнером|Основні\s+умови)/iu);
    const segment = stopMatch >= 0 ? tail.slice(0, stopMatch + 1) : tail.slice(0, 2200);
    partnerLines = segment.split(/\n+/).map(compactLabel).filter((line) =>
      /^\d{1,3}(?:[.,]\d+)?\s*%\s+(?:на|за)\s+/iu.test(line)
    );
  }
  const partnerKeys = new Set(partnerLines.map((x) => x.toLocaleLowerCase("uk-UA")));
  const existing = Array.isArray(structured?.items) ? structured.items : [];
  const items = existing.filter((item) => {
    const evidence = Array.isArray(item?.evidence) ? item.evidence : [];
    return !evidence.some((line) => partnerKeys.has(compactLabel(line).toLocaleLowerCase("uk-UA")));
  });
  const categoryExamples = [
    "Продукти та харчування",
    "Медицина",
    "Авто та АЗС",
    "Техніка",
    "Дитячі товари",
    "Транспорт",
    "Duty Free"
  ];
  const limits = { ...(structured?.limits || {}) };
  if (limits.max_cashback_uah == null) limits.max_cashback_uah = 500;
  return {
    ...structured,
    items,
    item_count: items.length,
    limits,
    selection: {
      ...(structured?.selection || {}),
      max_categories: 4,
      offered_categories: 8,
      cadence: "monthly"
    },
    max_bank_category_rate_percent: 20,
    category_examples: categoryExamples,
    category_examples_source: "official_cashback_page",
    partner_offer_signals: partnerLines.slice(0, 20)
  };
}
function evidenceNorm(s) {
  return String(s || "").toLowerCase().replace(/[’'`]/g,"").replace(/[^a-zа-яіїєґ0-9]+/giu," ").trim();
}
function evidenceAliases(s) {
  const n=evidenceNorm(s);
  if(/аптек|здоров/.test(n)) return ["аптек","медицин"];
  if(/книг|канц/.test(n)) return ["книг"];
  if(/кіно|театр/.test(n)) return ["кіно"];
  if(/азс/.test(n)) return ["азс","авто"];
  if(/кафе|ресторан/.test(n)) return ["кафе","ресторан"];
  if(/краса/.test(n)) return ["краса","космет","бюті","салон"];
  if(/одяг|взут/.test(n)) return ["одяг","взут"];
  if(/продукт|супермаркет/.test(n)) return ["продукт","супермаркет"];
  if(/розваг/.test(n)) return ["розваг"];
  if(/спорт|фітнес/.test(n)) return ["спорт","фітнес"];
  if(/транспорт/.test(n)) return ["транспорт"];
  if(/дитяч/.test(n)) return ["дитяч"];
  if(/дім|ремонт/.test(n)) return ["дім","ремонт","будівниц"];
  if(/таксі/.test(n)) return ["таксі"];
  if(/тварин/.test(n)) return ["тварин","зоомаг","ветерин"];
  if(/квіт/.test(n)) return ["квіт"];
  if(/усі покупки|всі покупки/.test(n)) return ["усі покупки","всі покупки","усі покупки","всі товари"];
  return n.split(" ").filter(x=>x.length>=4).slice(0,3);
}
function filterAffectedByEvidence(affected, structured) {
  const items=Array.isArray(structured?.items)?structured.items:[];
  const pool=Array.isArray(structured?.category_pool)?structured.category_pool:[];
  return (affected||[]).filter(cell=>{
    const aliases=evidenceAliases(cell?.category||"");
    const itemHit=items.some(item=>{
      const t=evidenceNorm([item?.category,item?.name,...(Array.isArray(item?.evidence)?item.evidence:[])].filter(Boolean).join(" "));
      return aliases.some(a=>a&&t.includes(evidenceNorm(a)));
    });
    const poolHit=pool.some(name=>{
      const pn=evidenceNorm(name);
      return aliases.some(a=>{
        const an=evidenceNorm(a);
        return an&&(pn.includes(an)||an.includes(pn));
      });
    });
    return itemHit||poolHit;
  });
}
function nearestDateWindow(lines, idx) {
  return extractWindow(lines.slice(Math.max(0, idx - 3), Math.min(lines.length, idx + 4)).join(" "));
}
function extractRadaRewardsCards(html) {
  const raw=String(html||"");
  const section=raw.match(/Категорії\s+кешбеку\s+на\s+([^<]+)<\/h3>([\s\S]*?)(?:Категорії\s+партнерського\s+кешбеку|Часті\s+запитання)/iu);
  if(!section) return {items:[],valid_from:null,valid_to:null};
  const month=extractWindow(`Категорії кешбеку на ${cleanText(section[1])}`);
  const items=[];
  for(const m of section[2].matchAll(/cards-grid__item[\s\S]*?cards-grid__heading[^>]*>\s*([^<]+?)\s*<\/div>[\s\S]*?cards-grid__text[^>]*>\s*(\d{1,3}(?:[.,]\d+)?)\s*%/giu)){
    const name=compactLabel(decodeBasicEntities(m[1]));
    const rate=parseRateNumber(m[2]);
    if(!name||rate===null)continue;
    items.push({
      kind:"category",name,category:name,partner:null,rate_percent:rate,rate_text:`${m[2]}%`,
      valid_from:month.valid_from,valid_to:month.valid_to,evidence:[`${name} — ${m[2]}%`]
    });
  }
  return {items,valid_from:month.valid_from,valid_to:month.valid_to};
}
function extractExplicitMaxCashback(text) {
  const raw=String(text||"");
  const patterns=[
    /Максимальн[\p{L}\p{M}]*\s+сума\s+кешбек[\p{L}\p{M}]*[^\d\n]{0,60}(\d[\d\s]{0,10})\s*(?:грн|₴|грив(?:ень|ні|ня)?)/iu,
    /Максимальн[\p{L}\p{M}]*\s+сума\s+винагород[\p{L}\p{M}]*[^\d\n]{0,100}(\d[\d\s]{0,10})\s*(?:грн|₴|грив(?:ень|ні|ня)?)/iu,
    /(?:ліміт|максимум)[^\n]{0,80}?(?:кешбек|винагород)[^\d\n]{0,60}(\d[\d\s]{0,10})\s*(?:грн|₴|грив(?:ень|ні|ня)?)/iu
  ];
  for(const re of patterns){
    const m=raw.match(re);
    if(!m)continue;
    const v=Number(m[1].replace(/\s+/g,""));
    if(Number.isFinite(v)&&v>0&&v<=100000)return v;
  }
  return null;
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
  const strongMaxCashbackCandidates = [];
  let minPurchase = null;
  let maxSelectableCategories = null;
  let selectionCadence = null;
  const bonusAmounts = [];
  const mcc = new Set();
  const conditionLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const limitContext = [line, lines[i+1] || ""].join(" ");
    const maxMatch = limitContext.match(/(?:максимальн[\p{L}\p{M}]*\s+(?:(?:сума|розмір).{0,80}(?:кешбек|винагород)|кешбек)|поверт[\p{L}\p{M}]*.{0,50}на рахунок до)[^\d]{0,120}(\d[\d\s]{0,12})(?:\s*\([^)]*\))?\s*(?:грн|₴|грив(?:ень|ні|ня)?)/iu);
    if (maxMatch) {
      const v = Number(maxMatch[1].replace(/\s+/g,""));
      if (Number.isFinite(v) && v > 0 && v <= 100000) {
        maxCashbackCandidates.push(v);
        strongMaxCashbackCandidates.push(v);
      }
    }
    const simpleCashbackLimit = line.match(/(?:кешбек|cashback)[^\n]{0,90}?до\s+(\d[\d\s]{0,10})\s*(?:грн|₴|грив(?:ень|ні|ня)?)/iu);
    if (simpleCashbackLimit) {
      const v = Number(simpleCashbackLimit[1].replace(/\s+/g,""));
      if (Number.isFinite(v) && v > 0 && v <= 100000) maxCashbackCandidates.push(v);
    }
    const selectMatch = line.match(/обира[\p{L}\p{M}]*\s+(?:до\s+)?(\d+)\s+категор[\p{L}\p{M}]*/iu);
    if (selectMatch) {
      const v = Number(selectMatch[1]);
      if (Number.isFinite(v) && v > 0 && v <= 20) maxSelectableCategories = v;
      if (/щомісяц|кожн[\p{L}\p{M}]*\s+місяц/iu.test(line)) selectionCadence = "monthly";
      else if (/квартал/iu.test(line)) selectionCadence = "quarterly";
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
    if (/(активуй|активувати|обира[\p{L}\p{M}]+\s+(?:до\s+)?\d+\s+категор|власн[\p{L}\p{M}]*\s+або\s+кредитн|картк[\p{L}\p{M}]*\s+(?:visa|mastercard|radacard)|реєстр[\p{L}\p{M}]+\s+картк|персоналізован)/iu.test(line)) {
      if (conditionLines.length < 14) conditionLines.push(line.slice(0,320));
    }
  }

  for (const m of allText.matchAll(/максимальн[\p{L}\p{M}]*[^\n.]{0,120}?(?:кешбек|винагород)[^\d\n]{0,60}(\d[\d\s]{0,10})\s*(?:грн|₴|грив(?:ень|ні|ня)?)/giu)) {
    const v=Number(m[1].replace(/\s+/g,""));
    if(Number.isFinite(v)&&v>0&&v<=100000){maxCashbackCandidates.push(v);strongMaxCashbackCandidates.push(v);}
  }
  const uniqueMaxCashbackCandidates = [...new Set(maxCashbackCandidates)].sort((a,b)=>a-b);
  const uniqueStrongMaxCashbackCandidates = [...new Set(strongMaxCashbackCandidates)].sort((a,b)=>a-b);
  maxCashback = uniqueStrongMaxCashbackCandidates.length === 1
    ? uniqueStrongMaxCashbackCandidates[0]
    : (uniqueMaxCashbackCandidates.length === 1 ? uniqueMaxCashbackCandidates[0] : null);

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

  if (profile === "cashback" || profile === "promos" || profile === "rules") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const special = line.match(/^(кешбек\s+від\s+партнерів|кешбек[-\s]?маркет)[^\d%]{0,40}?(?:до\s+)?(\d{1,3}(?:[.,]\d+)?)\s*%/iu);
      if (special) {
        const rate=parseRateNumber(special[2]);
        if(rate!==null){
          const w=nearestDateWindow(lines,i);
          pushItem({kind:"program",name:compactLabel(special[1]),category:null,partner:null,rate_percent:rate,rate_text:`${special[2]}%`,valid_from:w.valid_from||globalWindow.valid_from,valid_to:w.valid_to||globalWindow.valid_to,evidence:[line]});
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
    selection: {
      max_categories: maxSelectableCategories,
      cadence: selectionCadence
    },
    mcc: [...mcc].slice(0,60),
    conditions: conditionLines,
    items: cleanItems,
    item_count: cleanItems.length,
    confidence: cleanItems.length ? (sourceRole === "primary" && dataMode === "fixed" ? "review_ready" : "signal_only") : "summary_only"
  };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return json({ error: "Missing authorization" }, 401);

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const service = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData.user;
  if (userError || !user) return json({ error: "Invalid session" }, 401);

  const { data: profile, error: profileError } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (profileError || profile?.role !== "admin") return json({ error: "Admin role required" }, 403);

  let body: { source_ids?: string[] } = {};
  try { body = await req.json(); } catch (_) {}
  const sourceIds = Array.isArray(body.source_ids) ? body.source_ids.filter(Boolean).slice(0, 50) : [];

  let sourceQuery = service.from("scanner_sources").select("*").eq("enabled", true).order("source_role", { ascending: true }).order("bank", { ascending: true, nullsFirst: false });
  if (sourceIds.length) sourceQuery = sourceQuery.in("id", sourceIds);
  const { data: sources, error: sourceError } = await sourceQuery;
  if (sourceError) return json({ error: sourceError.message }, 500);

  const staleBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  await service.from("scanner_runs")
    .update({ status: "failed", finished_at: new Date().toISOString(), summary: { reason: "stale_run_auto_closed" } })
    .eq("status", "running")
    .lt("started_at", staleBefore);

  const { data: activeRuns } = await service.from("scanner_runs")
    .select("id,started_at,trigger_kind")
    .eq("status", "running")
    .gte("started_at", staleBefore)
    .order("started_at", { ascending: false })
    .limit(1);
  if (activeRuns?.length) {
    return json({ status: "already_running", run_id: activeRuns[0].id, started_at: activeRuns[0].started_at, trigger_kind: activeRuns[0].trigger_kind });
  }

  const { data: run, error: runError } = await service.from("scanner_runs").insert({
    triggered_by: user.id,
    trigger_kind: "admin_manual",
    total_sources: sources?.length || 0,
    status: "running",
  }).select("id").single();
  if (runError || !run) return json({ error: runError?.message || "Could not create run" }, 500);

  let changed = 0, failed = 0, candidates = 0;
  const results: unknown[] = [];

  async function readFetchedResponse(res: Response) {
  const bytes = new Uint8Array(await res.arrayBuffer());
  const contentType = String(res.headers.get("content-type") || "");
  const magic = bytes.length >= 5 ? String.fromCharCode(...bytes.slice(0, 5)) : "";
  const isPdf = /application\/pdf/i.test(contentType) || magic === "%PDF-";
  if (isPdf) {
    const binaryHash = await sha256Bytes(bytes);
    return { raw: "", responseBytes: bytes.byteLength, documentType: "pdf", contentType, binaryHash };
  }
  return { raw: new TextDecoder().decode(bytes), responseBytes: bytes.byteLength, documentType: "html", contentType };
}

async function loadMastercardSubscriptionSource() {
  const origin = "https://bilshe.mastercard.ua";
  const commonHeaders = {
    "User-Agent": BROWSER_UA,
    "Accept": "text/html,application/javascript,*/*;q=0.8",
    "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.7",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
  };
  const pageRes = await fetch(origin + "/subscription", { headers: commonHeaders, signal: AbortSignal.timeout(15000) });
  if (!pageRes.ok) throw new Error("Mastercard subscription page HTTP " + pageRes.status);
  const pageHtml = await pageRes.text();
  const indexMatch = pageHtml.match(/<script[^>]+src=["\'](\/assets\/index-[^"\']+\.js)["\']/i);
  if (!indexMatch) throw new Error("Mastercard main bundle not found");
  const indexRes = await fetch(new URL(indexMatch[1], origin), { headers: commonHeaders, signal: AbortSignal.timeout(15000) });
  if (!indexRes.ok) throw new Error("Mastercard main bundle HTTP " + indexRes.status);
  const indexJs = await indexRes.text();
  const chunkMatch = indexJs.match(/assets\/PromotionOffersDetails-[A-Za-z0-9_-]+\.js/);
  if (!chunkMatch) throw new Error("Mastercard promotion details bundle not found");
  const chunkRes = await fetch(new URL("/" + chunkMatch[0], origin), { headers: commonHeaders, signal: AbortSignal.timeout(15000) });
  if (!chunkRes.ok) throw new Error("Mastercard promotion bundle HTTP " + chunkRes.status);
  const chunkJs = await chunkRes.text();
  const start = chunkJs.indexOf("E0=[");
  const end = start >= 0 ? chunkJs.indexOf("],D0=", start) : -1;
  if (start < 0 || end < 0) throw new Error("Mastercard subscription terms block not found");
  const section = chunkJs.slice(start + 3, end + 1)
    .replace(/\\n/g, "\n")
    .replace(/\\\"/g, "\"")
    .replace(/<[^>]+>/g, " ")
    .replace(/\},\{/g, "\n")
    .replace(/(?:title|text):/g, "\n")
    .replace(/[`{}\[\]]/g, " ")
    .replace(/\\/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
  if (!/Ощадбанк/i.test(section) || !/40\s*%/.test(section) || !/20\s*%/.test(section)) {
    throw new Error("Mastercard subscription terms sanity check failed");
  }
  return {
    status: 200,
    raw: section,
    responseBytes: new TextEncoder().encode(section).byteLength,
    documentType: "html",
    contentType: "text/javascript",
    transport: "mastercard_spa_bundle",
  };
}

async function loadSource(source: any) {
    if (source.id === "oschad-subscriptions-rules") {
      return await loadMastercardSubscriptionSource();
    }
    let directError: unknown = null;
    let blockedDirect: { status: number; raw: string; responseBytes?: number; documentType?: string; contentType?: string; transport: string } | null = null;
    try {
      const res = await fetch(source.url, {
        redirect: "follow",
        headers: {
          "User-Agent": BROWSER_UA,
          "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
        signal: AbortSignal.timeout(15_000),
      });
      const fetched = await readFetchedResponse(res);
      const raw = fetched.raw;
      if (res.ok) return { status: res.status, raw, responseBytes: fetched.responseBytes, documentType: fetched.documentType, contentType: fetched.contentType, transport: fetched.documentType === "pdf" ? "edge_fetch_pdf" : "edge_fetch" };
      if (detectAccessBlock(raw)) blockedDirect = { status: res.status, raw, responseBytes: fetched.responseBytes, documentType: fetched.documentType, contentType: fetched.contentType, transport: "edge_fetch_blocked" };
      directError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      directError = e;
    }

    const { data, error } = await service.rpc("scanner_fetch_source", { p_source_id: source.id });
    const row = Array.isArray(data) ? data[0] : data;
    if (!error && row) {
      const fallbackRaw = String(row.content || "");
      if (Number(row.status) >= 200 && Number(row.status) < 300) {
        return { status: Number(row.status), raw: fallbackRaw, transport: "db_http_fallback" };
      }
      if (detectAccessBlock(fallbackRaw)) {
        return { status: Number(row.status), raw: fallbackRaw, transport: "db_http_fallback_blocked" };
      }
    }
    if (blockedDirect) return blockedDirect;
    const fallbackMessage = error?.message || (row ? `HTTP ${row.status}` : "Fallback returned no data");
    const directMessage = directError instanceof Error ? directError.message : String(directError || "Direct fetch failed");
    throw new Error(`${directMessage}; fallback: ${fallbackMessage}`);
  }

  async function scanOne(source: any) {
    const oldHash = source.last_hash || null;
    const sourceFingerprintVersion = Number(source.fingerprint_version || 0);
    try {
      const loaded = await loadSource(source);
      const raw = loaded.raw;
      const responseBytes = Number(loaded.responseBytes || new TextEncoder().encode(raw).byteLength);
      const isPdf = loaded.documentType === "pdf";
      const accessBlock = isPdf ? null : detectAccessBlock(raw);
      let text = "", focused = "", safeFocused = "";
      let pageTitle = isPdf ? (source.purpose || source.bank || "Official PDF") : (safeDbText(titleFromHtml(raw) || '') || null);
      let categoryPool: string[] = [];
      let structured: any;
      let hash: string;
      if (isPdf) {
        const { data: previousRows } = await service.from("scanner_snapshots").select("structured_payload,title,text_excerpt").eq("source_id", source.id).not("structured_payload", "is", null).order("fetched_at", { ascending: false }).limit(1);
        const previous = previousRows?.[0] || null;
        const cached = previous?.structured_payload && typeof previous.structured_payload === "object" ? previous.structured_payload : null;
        const binaryHash = String(loaded.binaryHash || "");
        if (!binaryHash) throw new Error("PDF fingerprint missing");
        const pdfChanged = !!oldHash && sourceFingerprintVersion === FINGERPRINT_VERSION && oldHash !== binaryHash;
        structured = cached ? {...cached,parser_version:PARSER_VERSION,source_id:source.id,bank:source.bank||cached.bank||null,source_url:source.url,source_role:source.source_role||cached.source_role||"primary",data_mode:source.data_mode||cached.data_mode||"fixed",publish_policy:source.publish_policy||cached.publish_policy||"review_required",source_format:"pdf",content_type:loaded.contentType||"application/pdf",pdf_fingerprint_only:true,pdf_changed_unparsed:pdfChanged}
          : {parser_version:PARSER_VERSION,source_id:source.id,bank:source.bank||null,source_url:source.url,source_role:source.source_role||"primary",data_mode:source.data_mode||"fixed",publish_policy:source.publish_policy||"review_required",parser_profile:source.parser_profile||"rules",review_policy:{auto_publish:false,official_primary:source.source_role==="primary",reference_only:source.source_role==="reference",manual_only:true,requires_human_review:true},unsupported:false,items:[],item_count:0,rates_percent:[],mcc:[],limits:{},valid_from:null,valid_to:null,confidence:"fingerprint_only",source_format:"pdf",content_type:loaded.contentType||"application/pdf",pdf_fingerprint_only:true,pdf_changed_unparsed:pdfChanged};
        pageTitle = previous?.title || pageTitle;
        safeFocused = safeDbText(previous?.text_excerpt || "");
        hash = binaryHash;
      } else {
        text = cleanText(raw);
        categoryPool = extractDefinedCategoryPool(text, source.id);
        focused = focusText(text);
        safeFocused = safeDbText(focused);
        structured = extractStructured(source, focused, pageTitle);
        if (source.id === "creditdnepr-cashback") structured = normalizeCreditDniproStructured(text, structured);
        hash = await sha256(accessBlock ? `__source_health__:${accessBlock}:${source.url}` : safeFocused);
      }
      const explicitMaxCashback=extractExplicitMaxCashback(text);
      if(explicitMaxCashback!==null){
        const limits={...(structured.limits||{})};
        const candidates=[...new Set([...(Array.isArray(limits.max_cashback_candidates_uah)?limits.max_cashback_candidates_uah:[]),explicitMaxCashback])].sort((a,b)=>a-b);
        structured={...structured,limits:{...limits,max_cashback_uah:explicitMaxCashback,max_cashback_candidates_uah:candidates}};
      }
      if (source.id === "rada-rewards" && loaded.documentType !== "pdf") {
        const rada=extractRadaRewardsCards(raw);
        if(rada.items.length){
          const existing=Array.isArray(structured.items)?structured.items:[];
          const keys=new Set(existing.map(x=>JSON.stringify([x.kind,x.name,x.rate_percent,x.valid_from,x.valid_to])));
          const merged=[...existing];
          for(const item of rada.items){
            const key=JSON.stringify([item.kind,item.name,item.rate_percent,item.valid_from,item.valid_to]);
            if(!keys.has(key)){keys.add(key);merged.push(item);}
          }
          structured={...structured,items:merged,item_count:merged.length,valid_from:rada.valid_from||structured.valid_from,valid_to:rada.valid_to||structured.valid_to,confidence:"review_ready"};
        }
      }
      structured = { ...structured, source_format: loaded.documentType || "html", content_type: loaded.contentType || null };
      if (categoryPool.length) structured = { ...structured, category_pool: categoryPool, category_pool_source: "official_definitions" };
      if (accessBlock) {
        structured = {...structured,unsupported:true,reason:accessBlock,items:[],item_count:0,rates_percent:[],mcc:[],limits:{},valid_from:null,valid_to:null};
      }
      const isInitial = !oldHash || sourceFingerprintVersion !== FINGERPRINT_VERSION;
      const isChanged = !isInitial && oldHash !== hash && !structured.unsupported;

      const { error: snapshotError } = await service.from("scanner_snapshots").insert({
        run_id: run.id,
        source_id: source.id,
        http_status: loaded.status,
        content_hash: hash,
        response_bytes: responseBytes,
        title: pageTitle,
        text_excerpt: structured.unsupported ? "" : safeFocused.slice(0, 8_000),
        error: null,
        parser_version: PARSER_VERSION,
        structured_payload: structured,
      });
      if (snapshotError) throw new Error("Snapshot insert failed: " + snapshotError.message);

      await service.from("scanner_sources").update({
        last_checked_at: new Date().toISOString(),
        last_http_status: loaded.status,
        last_hash: hash,
        last_error: null,
        fingerprint_version: FINGERPRINT_VERSION,
      }).eq("id", source.id);

      // Keep an existing review task aligned with the newest parser output even when
      // the source content hash itself did not change.
      const { data: pendingEvidence } = await service.from("scanner_candidates")
        .select("id,structured_payload")
        .eq("source_id", source.id)
        .eq("candidate_type", "reference_to_official_review")
        .eq("new_hash", hash)
        .eq("status", "pending")
        .limit(1);
      if (pendingEvidence?.length) {
        const prev = pendingEvidence[0].structured_payload || {};
        const refreshedPayload = {
          ...structured,
          ...(prev.bootstrap_review ? { bootstrap_review: prev.bootstrap_review } : {}),
        };
        const {data:currentRefs}=await service.from("scanner_matrix_index")
          .select("cell_key,bank,category,current_value,source_tier,source_url")
          .eq("bank",source.bank)
          .eq("source_tier","reference");
        const comparableAffected=filterAffectedByEvidence(currentRefs||[],structured);
        const updatePayload=comparableAffected.length
          ? {excerpt:safeFocused.slice(0,6000),parser_version:PARSER_VERSION,structured_payload:refreshedPayload,affected_cells:comparableAffected,updated_at:new Date().toISOString()}
          : {excerpt:safeFocused.slice(0,6000),parser_version:PARSER_VERSION,structured_payload:refreshedPayload,affected_cells:[],status:"rejected",review_note:"Автоматично закрито: поточне офіційне джерело не містить зіставного підтвердження для reference-комірок.",reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
        await service.from("scanner_candidates").update(updatePayload).eq("id", pendingEvidence[0].id);
      }

      let candidate: any = null;
      if (isChanged) {
        changed++;
        let affected: any[] = [];
        let type = source.source_role === "reference" ? "reference_change_signal" : "official_source_changed";
        let priority = source.source_role === "reference" ? "low" : "normal";

        if (source.source_role === "reference") {
          const { data } = await service.from("scanner_matrix_index")
            .select("cell_key,bank,category,current_value,source_tier,source_url")
            .eq("source_url", source.url);
          affected = data || [];
        } else if (source.bank) {
          const matrixEvidenceProfile = ["cashback","categories","rules"].includes(String(source.parser_profile || ""));
          const hasComparableEvidence = Number(structured.item_count || 0) > 0 || (Array.isArray(structured.category_pool) && structured.category_pool.length > 0);
          if (matrixEvidenceProfile && hasComparableEvidence) {
            const { data } = await service.from("scanner_matrix_index")
              .select("cell_key,bank,category,current_value,source_tier,source_url")
              .eq("bank", source.bank)
              .eq("source_tier", "reference");
            affected = filterAffectedByEvidence(data || [], structured);
          }
          if (matrixEvidenceProfile && hasComparableEvidence && affected.length) {
            type = "reference_to_official_review";
            priority = "high";
          } else if (source.data_mode === "dynamic" || source.data_mode === "personalized" || source.publish_policy === "manual_only") {
            type = "dynamic_or_personalized_source_changed";
            priority = "high";
          }
        }

        const { data, error } = await service.from("scanner_candidates").insert({
          run_id: run.id,
          source_id: source.id,
          bank: source.bank || null,
          candidate_type: type,
          priority,
          source_role: source.source_role,
          old_hash: oldHash,
          new_hash: hash,
          affected_cells: affected,
          excerpt: safeFocused.slice(0, 6_000),
          parser_version: PARSER_VERSION,
          structured_payload: structured,
          status: "pending",
        }).select("id,candidate_type,priority").single();
        if (!error && data) { candidate = data; candidates++; }
      }

      if (!candidate && source.source_role === "primary" && !structured.pdf_fingerprint_only && (structured.unsupported || safeFocused.trim().length < 80)) {
        const { data: existingUnreadable } = await service.from("scanner_candidates")
          .select("id")
          .eq("source_id", source.id)
          .eq("candidate_type", "official_source_unreadable")
          .eq("new_hash", hash)
          .limit(1);
        if (!existingUnreadable?.length) {
          const unreadablePayload = {
            ...structured,
            source_health: {
              readable: false,
              detected_on: new Date().toISOString().slice(0, 10),
              reason: structured.unsupported ? (structured.reason || "unsupported_content") : "empty_or_too_short_excerpt",
              excerpt_length: safeFocused.trim().length,
              response_bytes: responseBytes,
              transport: loaded.transport,
              auto_publish: false,
            },
          };
          const { data: unreadableCandidate, error: unreadableError } = await service.from("scanner_candidates").insert({
            run_id: run.id,
            source_id: source.id,
            bank: source.bank || null,
            candidate_type: "official_source_unreadable",
            priority: "high",
            source_role: source.source_role,
            old_hash: oldHash,
            new_hash: hash,
            affected_cells: [],
            excerpt: safeFocused.slice(0, 6_000),
            parser_version: PARSER_VERSION,
            structured_payload: unreadablePayload,
            status: "pending",
          }).select("id,candidate_type,priority").single();
          if (!unreadableError && unreadableCandidate) { candidate = unreadableCandidate; candidates++; }
        }
      }

      if (!candidate && isInitial && source.source_role === "primary" && source.bank && ["cashback","categories","rules"].includes(String(source.parser_profile || "")) && !structured.unsupported && safeFocused.trim().length >= 80 && (Number(structured.item_count || 0) > 0 || (Array.isArray(structured.category_pool) && structured.category_pool.length > 0))) {
        const { data: affected } = await service.from("scanner_matrix_index")
          .select("cell_key,bank,category,current_value,source_tier,source_url")
          .eq("bank", source.bank)
          .eq("source_tier", "reference");
        const comparableAffected = filterAffectedByEvidence(affected || [], structured);
        if (comparableAffected.length) {
          const affected = comparableAffected;
          const { data: existingBootstrap } = await service.from("scanner_candidates")
            .select("id")
            .eq("source_id", source.id)
            .eq("candidate_type", "reference_to_official_review")
            .eq("new_hash", hash)
            .limit(1);
          if (!existingBootstrap?.length) {
            const bootstrapPayload = {
              ...structured,
              bootstrap_review: {
                detected_on: new Date().toISOString().slice(0, 10),
                reason: "official_source_added_for_reference_cells",
                affected_count: affected.length,
                auto_publish: false,
              },
            };
            const { data: bootstrapCandidate, error: bootstrapError } = await service.from("scanner_candidates").insert({
              run_id: run.id,
              source_id: source.id,
              bank: source.bank,
              candidate_type: "reference_to_official_review",
              priority: "high",
              source_role: source.source_role,
              old_hash: oldHash,
              new_hash: hash,
              affected_cells: affected,
              excerpt: safeFocused.slice(0, 6_000),
              parser_version: PARSER_VERSION,
              structured_payload: bootstrapPayload,
              status: "pending",
            }).select("id,candidate_type,priority").single();
            if (!bootstrapError && bootstrapCandidate) { candidate = bootstrapCandidate; candidates++; }
          }
        }
      }

      if (!candidate && source.source_role === "primary" && source.data_mode === "fixed" && source.publish_policy === "review_required" && !structured.unsupported && structured.valid_to) {
        const today = new Date().toISOString().slice(0, 10);
        if (String(structured.valid_to) < today) {
          const { data: existingExpiry } = await service.from("scanner_candidates")
            .select("id")
            .eq("source_id", source.id)
            .eq("candidate_type", "official_source_expired")
            .eq("new_hash", hash)
            .limit(1);
          if (!existingExpiry?.length) {
            let affected: any[] = [];
            const { data: exactAffected } = await service.from("scanner_matrix_index")
              .select("cell_key,bank,category,current_value,source_tier,source_url")
              .eq("source_url", source.url);
            affected = exactAffected || [];
            const expiryPayload = {
              ...structured,
              expiry_review: {
                expired_on: structured.valid_to,
                detected_on: today,
                reason: "official_source_validity_ended",
                auto_publish: false,
              },
            };
            const { data: expiryCandidate, error: expiryError } = await service.from("scanner_candidates").insert({
              run_id: run.id,
              source_id: source.id,
              bank: source.bank || null,
              candidate_type: "official_source_expired",
              priority: "high",
              source_role: source.source_role,
              old_hash: oldHash,
              new_hash: hash,
              affected_cells: affected,
              excerpt: safeFocused.slice(0, 6_000),
              parser_version: PARSER_VERSION,
              structured_payload: expiryPayload,
              status: "pending",
            }).select("id,candidate_type,priority").single();
            if (!expiryError && expiryCandidate) { candidate = expiryCandidate; candidates++; }
          }
        }
      }

      results.push({ source_id: source.id, bank: source.bank, status: loaded.status, transport: loaded.transport, fingerprint_version: FINGERPRINT_VERSION, parser_version: PARSER_VERSION, structured_items: structured.item_count || 0, baseline: isInitial, changed: isChanged, candidate });
    } catch (e) {
      failed++;
      const message = e instanceof Error ? e.message : String(e);
      await service.from("scanner_snapshots").insert({ run_id: run.id, source_id: source.id, error: message.slice(0, 1000) });
      await service.from("scanner_sources").update({ last_checked_at: new Date().toISOString(), last_error: message.slice(0, 1000) }).eq("id", source.id);
      results.push({ source_id: source.id, bank: source.bank, baseline: !oldHash || sourceFingerprintVersion !== FINGERPRINT_VERSION, error: message });
    }
  }

  const list = sources || [];
  for (let i = 0; i < list.length; i += 6) {
    await Promise.all(list.slice(i, i + 6).map(scanOne));
  }

  const finalStatus = failed === list.length && list.length > 0 ? "failed" : (failed ? "partial" : "completed");
  await service.from("scanner_runs").update({
    finished_at: new Date().toISOString(),
    status: finalStatus,
    changed_sources: changed,
    failed_sources: failed,
    candidates_created: candidates,
    summary: { fingerprint_version: FINGERPRINT_VERSION, parser_version: PARSER_VERSION, results },
  }).eq("id", run.id);

  return json({ run_id: run.id, status: finalStatus, total_sources: list.length, changed_sources: changed, failed_sources: failed, candidates_created: candidates, fingerprint_version: FINGERPRINT_VERSION, parser_version: PARSER_VERSION, results });
});
