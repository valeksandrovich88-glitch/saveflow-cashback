-- Refresh verification dates for matrix values re-audited against official bank sources on 2026-10-15.
-- No cashback values are changed by this migration.

update public.scanner_matrix_index
set checked_on = date '2026-10-15',
    updated_at = now()
where
  (
    bank='БІЗБАНК'
    and category in ('АЗС','Одяг та взуття','Продукти','Транспорт','Техніка')
  )
  or (
    bank='RadaBank'
    and category in ('Аптеки / здоров''я','Кіно та театри','Книги та канцтовари','Розваги','Спорт та фітнес','Тварини')
  )
  or (
    bank='Акордбанк'
    and category in ('Аптеки / здоров''я','Дитячі товари','Одяг та взуття','Тварини')
  )
  or (
    bank='Кристалбанк'
    and category='Усі покупки'
  )
  or (
    bank='Ощадбанк'
    and category='Підписки'
  )
  or (
    bank='ПриватБанк'
    and category in ('Дитячі товари','Дім та ремонт','Ігри та додатки','Квіти','Книги та канцтовари','Техніка')
  )
  or (
    bank='VST bank'
    and category='АЗС'
  );
