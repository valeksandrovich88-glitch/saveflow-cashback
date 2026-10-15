-- Promote cashback matrix provenance only where current matrix values
-- exactly match structured evidence from official bank sources.
-- Values themselves are intentionally not changed here.

update public.scanner_matrix_index
set source_tier='official',
    source_url='https://unexbank.ua/privatnim-osobam/kartki/card-virtualna-debetova-kartka-onlajn',
    checked_on=date '2026-10-07',
    updated_at=now()
where cell_key in (
  'Аптеки / здоров''я|||Unex Bank',
  'Одяг та взуття|||Unex Bank'
)
  and current_value='до 4%';

update public.scanner_matrix_index
set source_tier='official',
    source_url='https://tascombank.ua/promo/zayavka-na-card-credit/',
    checked_on=date '2026-10-07',
    updated_at=now()
where cell_key='Аптеки / здоров''я|||ТАСКОМБАНК'
  and current_value='до 3%';
