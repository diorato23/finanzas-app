import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltam variáveis de ambiente.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log("Iniciando migração de datas...")
  
  // Buscar transações com fecha_vencimiento nulo
  const { data, error } = await supabase
    .from('transacciones')
    .select('id, created_at')
    .is('fecha_vencimiento', null)
    
  if (error) {
    console.error("Erro ao buscar:", error)
    return
  }
  
  console.log(`Encontradas ${data.length} transações para atualizar.`)
  
  for (const t of data) {
    const dateOnly = new Date(t.created_at).toISOString().split('T')[0]
    const { error: updateError } = await supabase
        .from('transacciones')
        .update({ fecha_vencimiento: dateOnly })
        .eq('id', t.id)
        
    if (updateError) {
        console.error(`Erro ao atualizar ${t.id}:`, updateError)
    }
  }
  
  console.log("Migração concluída.")
}

main()
