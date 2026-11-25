/**
 * « Effacer mes données » (Réglages) : ce que demandent l'App Store
 * (5.1.1 v) et Google Play — supprimer depuis l'app ce que le service
 * garde. Le serveur d'abord, l'appareil ensuite : si le serveur refuse
 * (hors ligne, migration 02 pas passée), on ne touche à rien en local,
 * pour ne pas laisser croire que c'est fait.
 */
import { clear } from 'idb-keyval'
import { oublierPlus } from './abonnement'
import { supabase } from './sync'

export async function effacerMesDonnees(): Promise<void> {
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    // Pas de session : rien n'a jamais été écrit sous cette identité.
    if (data.session) {
      const { error } = await supabase.rpc('effacer_mes_donnees')
      if (error) throw new Error(error.message)
    }
    await supabase.auth.signOut().catch(() => {})
  }
  oublierPlus()
  await clear()
  try {
    localStorage.clear()
  } catch {
    /* stockage déjà inaccessible : rien à effacer */
  }
}
