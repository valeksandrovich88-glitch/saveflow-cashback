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
  ('raif-cashback','Райффайзен Банк','https://raiffeisen.ua/uk/aem/pryvatnym-osobam/vidkryty-rakhunok/payment-cards/keshbek-vid-raif.html',
   'cashback program and monthly category rules','cashback','dynamic','primary','manual_only',true)
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
