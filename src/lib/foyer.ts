import { supabase } from './sync'

/**
 * Code court pour rejoindre un foyer sans copier un UUID. Alphabet
 * sans caractères ambigus à l'oral/à l'écrit (0/O, 1/I/l exclus).
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function genererCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return code
}

/**
 * Crée un foyer : UUID neuf + code court enregistré dans Supabase.
 * Réessaie si le code généré entre en collision (rare avec 31^6
 * combinaisons, mais la contrainte unique le rejetterait sinon).
 */
export async function creerFoyerAvecCode(): Promise<{ id: string; code: string }> {
  const id = crypto.randomUUID()
  if (!supabase) return { id, code: genererCode() }

  for (let tentative = 0; tentative < 5; tentative++) {
    const code = genererCode()
    const { error } = await supabase.from('foyers').insert({ foyer: id, code })
    if (!error) return { id, code }
    if (!error.message.includes('duplicate')) throw error
  }
  throw new Error('Impossible de générer un code unique, réessayez.')
}

/**
 * Résout un code en UUID de foyer. Un seul `select` ciblé sur le
 * code exact — jamais d'énumération de la table côté app.
 */
export async function resoudreCode(code: string): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('foyers')
    .select('foyer')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle()
  return data?.foyer ?? null
}
