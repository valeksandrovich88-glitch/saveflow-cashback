-- Document BISBANK's protected official cashback source after manual verification on 2026-10-15.
-- Incapsula/Imperva blocks server-side fetches with HTTP 403, so the source stays manual-only.

update public.scanner_sources
set manual_reviewed_at = timestamptz '2026-10-15 15:49:40.845904+00',
    manual_review_note = 'Verified 2026-10-15 against official October 2026 BISBANK cashback publication. Server-side requests are blocked by Incapsula/Imperva (HTTP 403), so this source intentionally remains manual-only.',
    updated_at = now()
where id = 'bisbank-cashback';
