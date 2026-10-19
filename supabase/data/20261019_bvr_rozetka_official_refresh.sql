-- SaveFlow official-data refresh: Банк Власний Рахунок + Картка Rozetka, 2026-10-19.
-- Official sources only:
-- https://bvr.ua/
-- https://silpo.ua/offers/other/xochete-balobonusy-navit-za-tovary-zi-znyzhkamy
-- https://rozetka.com.ua/ua/pages/rozetka-card-bonus/
-- https://help.rozetka.com.ua/p/207-aktsiia-rozetka-podorozhnyk-znyzhka-15-na-kartku-rozetka/

insert into public.scanner_sources
(id,bank,publisher,url,purpose,parser_profile,data_mode,source_role,publish_policy,enabled,fingerprint_version,updated_at)
values
  ('bvr-main','Банк Власний Рахунок','Банк Власний Рахунок','https://bvr.ua/',
   'official current BVR card rewards: +1% Silpo balobonus, monthly limit and card conditions',
   'cashback','dynamic','primary','review_required',true,6,now()),
  ('bvr-silpo-rewards-2026','Банк Власний Рахунок','Сільпо','https://silpo.ua/offers/other/xochete-balobonusy-navit-za-tovary-zi-znyzhkamy',
   'official current Silpo/BVR reward offer: +1% at Silpo and partner rewards up to 10% through 31.12.2026',
   'promos','fixed','primary','review_required',true,6,now()),
  ('rozetka-card-bonus','Картка Rozetka','ROZETKA','https://rozetka.com.ua/ua/pages/rozetka-card-bonus/',
   'official Rozetka Card reward program: 1% base, 4% in three monthly categories, promo-day rewards and limits',
   'cashback','dynamic','primary','review_required',true,6,now()),
  ('rozetka-podorozhnyk-2026','Картка Rozetka','ROZETKA','https://help.rozetka.com.ua/p/207-aktsiia-rozetka-podorozhnyk-znyzhka-15-na-kartku-rozetka/',
   'official Rozetka Card / Podorozhnyk 15% discount through 31.12.2026',
   'promos','fixed','primary','review_required',true,6,now())
on conflict (id) do update set
  bank=excluded.bank,publisher=excluded.publisher,url=excluded.url,purpose=excluded.purpose,
  parser_profile=excluded.parser_profile,data_mode=excluded.data_mode,source_role=excluded.source_role,
  publish_policy=excluded.publish_policy,enabled=true,updated_at=now();

insert into public.scanner_matrix_index
(cell_key,bank,category,current_value,source_url,source_tier,checked_on,updated_at)
values
  ('Продукти|||Банк Власний Рахунок','Банк Власний Рахунок','Продукти','—','https://bvr.ua/','official_partner_only',current_date,now()),
  ('Усі покупки|||Картка Rozetka','Картка Rozetka','Усі покупки','1%','https://rozetka.com.ua/ua/pages/rozetka-card-bonus/','official',current_date,now())
on conflict (cell_key) do update set
  bank=excluded.bank,category=excluded.category,current_value=excluded.current_value,
  source_url=excluded.source_url,source_tier=excluded.source_tier,checked_on=excluded.checked_on,updated_at=now();

insert into public.scanner_partner_index
(bank,partner_key,partner_name,aliases,category,current_value,rate_percent,source_tier,source_url,active,checked_on,updated_at)
values
 ('Банк Власний Рахунок','silpo','Сільпо','["Silpo"]'::jsonb,'Продукти','1%',1,'official','https://bvr.ua/',true,current_date,now()),
 ('Банк Власний Рахунок','e-zoo','E-ZOO','["E ZOO","EZOO"]'::jsonb,'Тварини','до 10%',10,'official_dynamic','https://silpo.ua/offers/other/xochete-balobonusy-navit-za-tovary-zi-znyzhkamy',true,current_date,now()),
 ('Банк Власний Рахунок','megogo-books','MEGOGO BOOKS','["Megogo Books"]'::jsonb,'Книги та канцтовари','до 10%',10,'official_dynamic','https://silpo.ua/offers/other/xochete-balobonusy-navit-za-tovary-zi-znyzhkamy',true,current_date,now()),
 ('Банк Власний Рахунок','on-clinic','ON Clinic','["ОН Клінік","ON CLINIC"]'::jsonb,'Аптеки / здоров''я','до 10%',10,'official_dynamic','https://silpo.ua/offers/other/xochete-balobonusy-navit-za-tovary-zi-znyzhkamy',true,current_date,now())
on conflict (bank,partner_key) do update set
  partner_name=excluded.partner_name,aliases=excluded.aliases,category=excluded.category,
  current_value=excluded.current_value,rate_percent=excluded.rate_percent,source_tier=excluded.source_tier,
  source_url=excluded.source_url,active=true,checked_on=excluded.checked_on,updated_at=now();

insert into public.global_content_items
(block,base_id,payload,source_url,hidden,updated_at)
values
 ('promo','promo-bvr-silpo-10-after-spend',
  jsonb_build_object(
    'bank','Банк Власний Рахунок','product','Сільпо · 10% знижки після 15 000 ₴ витрат',
    'value1','-10%','label1','одноразово','value2','','label2','','end','','logo','',
    'note','Одноразова знижка 10% на покупку в «Сільпо» після сумарних покупок карткою будь-де від 15 000 ₴ за місяць.',
    'source','https://bvr.ua/','__kind','custom','updatedAt',now()::text
  ),
  'https://bvr.ua/',false,now()),
 ('promo','promo-rozetka-podorozhnyk-2026',
  jsonb_build_object(
    'bank','Картка Rozetka','product','Подорожник · знижка з Карткою Rozetka',
    'value1','-15%','label1','фізичні аптеки','value2','','label2','','end','2026-12-31','logo','',
    'note','15% знижки на будь-які товари у фізичних аптеках «Подорожник» за умови 100% оплати Карткою Rozetka через POS-термінал.',
    'source','https://help.rozetka.com.ua/p/207-aktsiia-rozetka-podorozhnyk-znyzhka-15-na-kartku-rozetka/',
    '__kind','custom','updatedAt',now()::text
  ),
  'https://help.rozetka.com.ua/p/207-aktsiia-rozetka-podorozhnyk-znyzhka-15-na-kartku-rozetka/',false,now()),
 ('promo','promo-rozetka-ukrnafta-2026',
  jsonb_build_object(
    'bank','Картка Rozetka','product','UKRNAFTA · знижка на пальне',
    'value1','до 6 ₴/л','label1','пальне','value2','','label2','','end','2026-10-31','logo','',
    'note','Поточна офіційна пропозиція для власників Картки Rozetka: знижка до 6 ₴/л на пальне в UKRNAFTA.',
    'source','https://rozetka.com.ua/ua/pages/rozetka-card-bonus/','__kind','custom','updatedAt',now()::text
  ),
  'https://rozetka.com.ua/ua/pages/rozetka-card-bonus/',false,now())
on conflict (block,base_id) do update set
  payload=excluded.payload,source_url=excluded.source_url,hidden=false,updated_at=now();
