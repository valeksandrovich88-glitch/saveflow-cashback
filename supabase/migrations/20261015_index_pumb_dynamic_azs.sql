-- Keep the public PUMB AZS placeholder represented in the scanner audit index.
-- PUMB exposes monthly category selection in-app; no stable public current AZS category rate is published.
-- Partner fuel offers remain separate in the Partners block.

insert into public.scanner_matrix_index
  (cell_key, bank, category, current_value, source_url, source_tier, checked_on, updated_at)
values
  ('АЗС|||ПУМБ','ПУМБ','АЗС','—','https://www.pumb.ua/cashback','official_dynamic',date '2026-10-15',now())
on conflict (cell_key) do update set
  bank=excluded.bank,
  category=excluded.category,
  current_value=excluded.current_value,
  source_url=excluded.source_url,
  source_tier=excluded.source_tier,
  checked_on=excluded.checked_on,
  updated_at=now();
