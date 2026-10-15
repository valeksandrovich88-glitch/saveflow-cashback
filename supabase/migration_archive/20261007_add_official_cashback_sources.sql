-- Additional official cashback sources for SaveFlow scanner.
-- Idempotent by source id; safe to re-run.

insert into public.scanner_sources
  (id, bank, url, purpose, parser_profile, data_mode, source_role, publish_policy, enabled)
values
  ('abank-cashback','àбанк','https://a-bank.com.ua/services/cashback',
   'cashback program limits and monthly category model','cashback','dynamic','primary','manual_only',true),
  ('abank-cashback-rules','àбанк','https://conditions-and-rules.a-bank.com.ua/main/view-content-458/?lang=uk',
   'official cashback rules, category pool and MCC mapping','rules','fixed','primary','review_required',true),
  ('izibank-cashback','izibank','https://promo.izibank.com.ua/izicashback',
   'cashback program, category selection and partner cashback rules','cashback','dynamic','primary','manual_only',true),
  ('izibank-cashback-rules','izibank','https://izibank.com.ua/files/for-client/terms/cashback_program.pdf',
   'official cashback program rules, category/MCC pool and dynamic selection model','rules','dynamic','primary','manual_only',true),
  ('raif-cashback','Райффайзен Банк','https://raiffeisen.ua/content/dam/rbi/marketing/ua/documents/natsionalnyi-keshbek/ofitsiini-pravyla-keshbek.coredownload.pdf',
   'official rules of cashback program Ще, monthly category model, MCC pool and limits','rules','dynamic','primary','manual_only',true),
  ('vst-cashback-card','VST bank','https://vstbank.ua/private/cards/cash-back-card',
   'cashback card, monthly categories, limits and partner cashback','cashback','dynamic','primary','manual_only',true),
  ('creditdnepr-cashback','Банк Кредит Дніпро','https://creditdnepr.com.ua/pryvatnym-osobam/platizni-kartki/cashback',
   'cashback program, monthly category model and partner offers','cashback','dynamic','primary','manual_only',true),
  ('tascom-verycard','ТАСКОМБАНК','https://tascombank.ua/promo/zayavka-na-card-credit/',
   'cashback rates for Big Five and PudraCard card products','cashback','fixed','primary','review_required',true)
on conflict (id) do update set
  bank = excluded.bank,
  url = excluded.url,
  purpose = excluded.purpose,
  parser_profile = excluded.parser_profile,
  data_mode = excluded.data_mode,
  source_role = excluded.source_role,
  publish_policy = excluded.publish_policy,
  enabled = excluded.enabled,
  updated_at = now();
