-- SaveFlow àбанк official-data refresh, 2026-10-19.
-- Source of truth:
--   https://conditions-and-rules.a-bank.com.ua/main/view-content-458/?lang=uk
--   https://a-bank.com.ua/backend/api/v1/pages?where_by[]=path&search_by[]=/services/cashback
-- Exact current monthly percentages are not publicly stable, so dynamic category/partner values stay as a clean dash.

with matrix_rows(category) as (
  values
    ('АЗС'),
    ('Аптеки / здоров''я'),
    ('Ігри та додатки'),
    ('Кафе та ресторани'),
    ('Квіти'),
    ('Кіно та театри'),
    ('Книги та канцтовари'),
    ('Краса'),
    ('Одяг та взуття'),
    ('Продукти'),
    ('Розваги'),
    ('Спорт та фітнес'),
    ('Таксі'),
    ('Тварини')
)
insert into public.scanner_matrix_index(
  cell_key,bank,category,current_value,source_url,source_tier,checked_on,updated_at
)
select category || '|||àбанк','àбанк',category,'—',
       'https://conditions-and-rules.a-bank.com.ua/main/view-content-458/?lang=uk',
       'official_dynamic',current_date,now()
from matrix_rows
on conflict (cell_key) do update set
  bank=excluded.bank,
  category=excluded.category,
  current_value=excluded.current_value,
  source_url=excluded.source_url,
  source_tier=excluded.source_tier,
  checked_on=excluded.checked_on,
  updated_at=now();

insert into public.scanner_partner_index(
  bank,partner_key,partner_name,aliases,category,current_value,rate_percent,
  source_tier,source_url,active,checked_on,updated_at
)
values
  ('àбанк','atb','АТБ','["ATB","АТБ-Маркет"]'::jsonb,'Продукти','—',null,'official_dynamic','https://a-bank.com.ua/backend/api/v1/pages?where_by[]=path&search_by[]=/services/cashback',true,current_date,now()),
  ('àбанк','wog','WOG','["WOG PRIDE"]'::jsonb,'АЗС','—',null,'official_dynamic','https://a-bank.com.ua/backend/api/v1/pages?where_by[]=path&search_by[]=/services/cashback',true,current_date,now()),
  ('àбанк','anc','АНЦ','["ANC","Аптека АНЦ"]'::jsonb,'Аптеки / здоров''я','—',null,'official_dynamic','https://a-bank.com.ua/backend/api/v1/pages?where_by[]=path&search_by[]=/services/cashback',true,current_date,now()),
  ('àбанк','moyo','MOYO','["Moyo"]'::jsonb,'Техніка','—',null,'official_dynamic','https://a-bank.com.ua/backend/api/v1/pages?where_by[]=path&search_by[]=/services/cashback',true,current_date,now()),
  ('àбанк','opti','Opti','["Opti Taxi","Опті"]'::jsonb,'Таксі','—',null,'official_dynamic','https://a-bank.com.ua/backend/api/v1/pages?where_by[]=path&search_by[]=/services/cashback',true,current_date,now()),
  ('àбанк','master-zoo','Master Zoo','["MasterZoo","Мастер Зоо"]'::jsonb,'Тварини','—',null,'official_dynamic','https://a-bank.com.ua/backend/api/v1/pages?where_by[]=path&search_by[]=/services/cashback',true,current_date,now()),
  ('àбанк','knigarnya-e','Книгарня Є','["Книгарня \"Є\"","Bookshop E"]'::jsonb,'Книги та канцтовари','—',null,'official_dynamic','https://a-bank.com.ua/backend/api/v1/pages?where_by[]=path&search_by[]=/services/cashback',true,current_date,now()),
  ('àбанк','bomond-ua','Bomond.ua','["Bomond","Бомонд"]'::jsonb,'Краса','—',null,'official_dynamic','https://a-bank.com.ua/backend/api/v1/pages?where_by[]=path&search_by[]=/services/cashback',true,current_date,now()),
  ('àбанк','euroclub','Euroclub','["Euro Club","Євроклуб"]'::jsonb,'Транспорт','—',null,'official_dynamic','https://a-bank.com.ua/backend/api/v1/pages?where_by[]=path&search_by[]=/services/cashback',true,current_date,now())
on conflict (bank,partner_key) do update set
  partner_name=excluded.partner_name,
  aliases=excluded.aliases,
  category=excluded.category,
  current_value=excluded.current_value,
  rate_percent=excluded.rate_percent,
  source_tier=excluded.source_tier,
  source_url=excluded.source_url,
  active=true,
  checked_on=excluded.checked_on,
  updated_at=now();

insert into public.scanner_sources(
  id,bank,publisher,url,purpose,parser_profile,data_mode,source_role,publish_policy,
  enabled,fingerprint_version,updated_at
)
values(
  'abank-cashback-api','àбанк','àбанк',
  'https://a-bank.com.ua/backend/api/v1/pages?where_by[]=path&search_by[]=/services/cashback',
  'official production CMS partner roster for cashback page; exact partner rates are not published in this API',
  'cashback','dynamic','primary','review_required',true,6,now()
)
on conflict (id) do update set
  bank=excluded.bank,
  publisher=excluded.publisher,
  url=excluded.url,
  purpose=excluded.purpose,
  parser_profile=excluded.parser_profile,
  data_mode=excluded.data_mode,
  source_role=excluded.source_role,
  publish_policy=excluded.publish_policy,
  enabled=true,
  updated_at=now();
