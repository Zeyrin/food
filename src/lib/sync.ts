import { createClient } from '@supabase/supabase-js'
import type { ListState, Recipe } from '../types'
import type { Historique } from './propose'

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
 * Le catalogue du foyer. Vide si Supabase n'est pas configuré —
 * à l'appelant de retomber sur le corpus de départ dans ce cas
 * (voir semerCorpusInitial et App.tsx).
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

export async function modifierRecette(foyer: string, recette: Recipe): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.')
  const { error } = await supabase
    .from('recettes')
    .update({ recette })
    .eq('foyer', foyer)
    .eq('recette->>id', recette.id)
  if (error) throw new Error(error.message)
}

export async function supprimerRecette(foyer: string, recipeId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.')
  const { error } = await supabase
    .from('recettes')
    .delete()
    .eq('foyer', foyer)
    .eq('recette->>id', recipeId)
  if (error) throw new Error(error.message)
}

/**
 * Peuple un foyer tout neuf avec le corpus de départ (src/data/recipes.json).
 * On garde les ids d'origine (« mapo-tofu », etc.) : l'historique local
 * (marquerCuisine) y fait référence, les changer casserait le lien.
 * N'écrit rien si le foyer a déjà des recettes — pas de doublon au
 * rechargement.
 */
export async function semerCorpusInitial(foyer: string, corpus: Recipe[]): Promise<Recipe[]> {
  if (!supabase) return []
  const { count } = await supabase
    .from('recettes')
    .select('id', { count: 'exact', head: true })
    .eq('foyer', foyer)
  if (count && count > 0) return []

  const { error } = await supabase.from('recettes').insert(corpus.map((recette) => ({ foyer, recette })))
  if (error) throw new Error(`Échec du seed initial : ${error.message}`)
  return corpus
}

/**
 * Suit le catalogue du foyer : ajout, modification et suppression.
 * On relit tout le catalogue à chaque changement plutôt que de
 * patcher l'état pièce par pièce — un DELETE ne transporte que la
 * clé primaire de la ligne, pas l'id de recette, donc le patch
 * ciblé demanderait REPLICA IDENTITY FULL côté base. Quelques
 * dizaines de recettes se relisent en une requête.
 */
/**
 * L'historique de cuisson est un fait du foyer, pas de l'appareil :
 * « on a mangé ça mardi » vaut pour les deux téléphones.
 */
export async function lireHistoriqueFoyer(foyer: string): Promise<Historique | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('historiques')
    .select('historique')
    .eq('foyer', foyer)
    .maybeSingle()
  return (data?.historique as Historique) ?? null
}

export async function ecrireHistoriqueFoyer(foyer: string, historique: Historique): Promise<void> {
  if (!supabase) return
  await supabase
    .from('historiques')
    .upsert({ foyer, historique, maj: new Date().toISOString() })
}

export function suivreHistorique(foyer: string, onChange: (h: Historique) => void): () => void {
  if (!supabase) return () => {}
  const canal = supabase
    .channel(`historique:${foyer}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'historiques', filter: `foyer=eq.${foyer}` },
      (payload) => {
        const h = (payload.new as { historique?: Historique })?.historique
        if (h) onChange(h)
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(canal)
  }
}

export function suivreRecettes(foyer: string, onChangement: (recettes: Recipe[]) => void): () => void {
  if (!supabase) return () => {}
  const canal = supabase
    .channel(`recettes:${foyer}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'recettes', filter: `foyer=eq.${foyer}` },
      () => void lireRecettes(foyer).then(onChangement),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(canal)
  }
}
