update public.scanner_matrix_index
set current_value='5%',
    source_url='https://www.bisbank.com.ua/pryvatnym-kliyentam/programa-cash-back/',
    source_tier='official',
    checked_on='2026-10-15',
    updated_at=now()
where bank='БІЗБАНК' and category='Техніка';

delete from public.scanner_matrix_index
where bank='ПУМБ' and category='АЗС';

update public.scanner_matrix_index
set current_value='—',
    checked_on='2026-10-15',
    updated_at=now()
where source_tier='official_dynamic'
  and current_value='у застосунку';
