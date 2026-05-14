-- Allow technical bug reports in abuse_reports category
-- Date: 2026-05-09

do $$
begin
  alter table public.abuse_reports drop constraint if exists abuse_reports_category_check;
  alter table public.abuse_reports
    add constraint abuse_reports_category_check
    check (category in ('bug', 'illegal_content', 'fraud', 'harassment', 'privacy', 'other'));
exception
  when others then
    null;
end $$;
