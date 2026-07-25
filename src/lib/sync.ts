import { createClient } from '@supabase/supabase-js'
import type { ListState, Recipe } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

const VIDE: ListState = { coche: {}, dejaPossede: {} }

/**
 * La seule donnée synchronisée : l'état de la liste du foyer.
 * Une ligne, un JSON, dernier écrivain gagne. Deux personnes qui
 * cochent des produits différents ne se marchent pas dessus ;
 * deux personnes qui cochent le même en même temps arrivent au
 * même résultat. Ça suffit pour des courses.
 */
export async function lireListe(foyer: string): Promise<ListState> {
  if (!supabase) return VIDE
  const { data } = await supabase.from('listes').select('etat').eq('foyer', foyer).maybeSingle()
  return (data?.etat as ListState) ?? VIDE
}

export async function ecrireListe(foyer: string, etat: ListState): Promise<void> {
  if (!supabase) return
  await supabase.from('listes').upsert({ foyer, etat, maj: new Date().toISOString() })
}

export function suivreListe(foyer: string, onChange: (etat: ListState) => void): () => void {
  if (!supabase) return () => {}
  const canal = supabase
    .channel(`liste:${foyer}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'listes', filter: `foyer=eq.${foyer}` },
      (payload) => {
        const etat = (payload.new as { etat?: ListState })?.etat
        if (etat) onChange(etat)
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(canal)
  }
}

/**
 * Recettes ajoutées depuis l'app, en plus du corpus statique
 * (src/data/recipes.json). Une ligne par recette dans Supabase :
 * pas de fusion à faire, juste les accumuler.
 */
export async function lireRecettes(foyer: string): Promise<Recipe[]> {
  if (!supabase) return []
  const { data } = await supabase.from('recettes').select('recette').eq('foyer', foyer)
  return (data ?? []).map((ligne) => ligne.recette as Recipe)
}

export async function ajouterRecette(foyer: string, recette: Recipe): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré : impossible de partager la recette entre téléphones.')
  await supabase.from('recettes').insert({ foyer, recette })
}

export function suivreRecettes(foyer: string, onAjout: (recette: Recipe) => void): () => void {
  if (!supabase) return () => {}
  const canal = supabase
    .channel(`recettes:${foyer}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'recettes', filter: `foyer=eq.${foyer}` },
      (payload) => {
        const recette = (payload.new as { recette?: Recipe })?.recette
        if (recette) onAjout(recette)
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(canal)
  }
}
