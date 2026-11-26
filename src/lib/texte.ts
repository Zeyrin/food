/**
 * Comparer deux textes comme quelqu'un les lit : sans majuscules, sans
 * accents, et sans ligatures — « oeuf » est la façon dont presque tout le
 * monde tape « œuf », et la recherche n'en trouvait aucun. Même règle
 * pour regrouper les ingrédients : une recette ajoutée avec « Oeufs »
 * faisait une seconde ligne à côté de « œuf » dans la liste de courses.
 */
export function normaliserTexte(s: string): string {
  return s
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'AE')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** « poulet curry » → chaque mot doit se retrouver, dans n'importe quel ordre. */
export function motsRecherche(saisie: string): string[] {
  return normaliserTexte(saisie)
    .split(/[\s,;]+/)
    .filter((m) => m.length > 0)
}

/**
 * `mot` commence un mot de `texte` (tous deux normalisés) : « oeuf » trouve
 * « oeufs brouillés » et « blanc d'oeuf », mais plus « boeuf ».
 */
export function commenceUnMot(texte: string, mot: string): boolean {
  let i = texte.indexOf(mot)
  while (i !== -1) {
    if (i === 0 || !/\p{L}/u.test(texte[i - 1]!)) return true
    i = texte.indexOf(mot, i + 1)
  }
  return false
}
