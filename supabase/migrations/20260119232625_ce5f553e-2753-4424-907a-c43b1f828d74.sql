-- Corrigir o cron job que está com comando incorreto
SELECT cron.unschedule('fallow-up');

-- Reagendar com comando correto
SELECT cron.schedule(
  'disparar-followups-automaticos',
  '* * * * *',
  'SELECT disparar_followups_automaticos();'
);