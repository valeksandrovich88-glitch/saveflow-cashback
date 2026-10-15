-- Refresh verification dates for active partner cashback rows re-audited on 2026-10-15.
-- Values are unchanged. Rows marked active=false are intentionally preserved as inactive history.

update public.scanner_partner_index
set checked_on = date '2026-10-15',
    updated_at = now()
where active = true;
