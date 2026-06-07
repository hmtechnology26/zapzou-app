const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oquvsvroobikjqyultua.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdXZzdnJvb2Jpa2pxeXVsdHVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAzMTkyNiwiZXhwIjoyMDg5NjA3OTI2fQ.AtoRil9yTx4TzUw_l0UKeX7zaD8mZC7OqGtXBHWPjzY',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function migrate() {
  const { data: services, error: sErr } = await supabase
    .from('services')
    .select('id, environment_id')
    .not('environment_id', 'is', null);

  if (sErr) { console.error('Error fetching services:', sErr); return; }

  const { data: links, error: lErr } = await supabase
    .from('service_environment_links')
    .select('service_id');

  if (lErr) { console.error('Error fetching links:', lErr); return; }

  const linkedIds = new Set((links || []).map(l => l.service_id));
  const toInsert = (services || []).filter(s => !linkedIds.has(s.id));

  if (toInsert.length === 0) {
    console.log('Nenhum serviço para migrar.');
    return;
  }

  console.log(`Migrando ${toInsert.length} servicos...`);

  const batchSize = 100;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize).map(s => ({
      service_id: s.id,
      environment_id: s.environment_id,
    }));

    const { error } = await supabase.from('service_environment_links').insert(batch);
    if (error) {
      console.error(`Erro no lote ${i / batchSize + 1}:`, error);
    } else {
      console.log(`Lote ${i / batchSize + 1}/${Math.ceil(toInsert.length / batchSize)} OK (${batch.length})`);
    }
  }

  console.log('Migracao concluida!');
}

migrate();
