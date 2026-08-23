/**
 * La mesure d'usage, en une fonction.
 *
 * Le script Rybbit (`index.html`) ne compte rien de lui-même en dehors
 * des pages vues : ni les clics, ni les gestes. « Aucun événement »
 * n'était donc pas une panne du script, mais l'absence d'appel — c'est
 * cet appel-là. Le suivi des clics automatique existe côté Rybbit, mais
 * il rend une soupe de sélecteurs CSS que le moindre changement de
 * classe casse ; on nomme donc les gestes ici, à côté du code qui les
 * déclenche.
 *
 * Tout passe par cette fonction pour une raison : le script peut ne
 * jamais arriver — bloqueur de pub, extension de vie privée, premier
 * lancement hors ligne, `localStorage` refusé. Une app de courses n'a
 * pas le droit de tomber, ni de rater le geste de l'utilisateur, parce
 * qu'une mesure n'est pas partie.
 */

/** Rybbit n'accepte que des chaînes et des nombres en propriétés. */
export type Proprietes = Record<string, string | number>

interface ApiRybbit {
  event: (nom: string, proprietes?: Proprietes) => void
}

/**
 * Le script installe `window.rybbit` dès sa première ligne, avant même
 * d'avoir chargé sa configuration : les appels faits trop tôt sont mis
 * en file et rejoués. On n'a donc pas de file à tenir ici — seulement
 * l'absence totale du script à encaisser.
 */
function api(): ApiRybbit | undefined {
  return (globalThis as { rybbit?: ApiRybbit }).rybbit
}

export function suivre(nom: string, proprietes?: Proprietes): void {
  try {
    api()?.event(nom, proprietes)
  } catch (e) {
    // Une mesure ratée n'est pas un incident : elle ne remonte pas plus
    // haut que la console.
    console.warn(`Mesure « ${nom} » non envoyée : ${e}`)
  }
}
