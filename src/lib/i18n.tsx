import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Langue = 'fr' | 'en'

const CLE_LANGUE = 'fffood:langue'

type Dico = { [cle: string]: string | Dico | Dico[] }

const fr: Dico = {
  reglages: {
    titre: 'Réglages',
    fermer: 'Fermer les réglages',
    langue: 'Langue',
    installerTitre: 'Installer sur le téléphone',
    installerTexte:
      "Installée, l'app garde vos recettes et votre liste accessibles sans réseau — au rayon surgelés, c'est la différence entre une liste et un écran blanc.",
    installerBouton: 'Installer FFFood',
    installerOrdinateur: "Sur ordinateur : l'icône d'installation dans la barre d'adresse.",
    partager: 'Partager',
    ecranAccueil: "Sur l'écran d'accueil",
    ajouterEcranAndroid: "Installer l'application",
    magasinsTitre: 'Vos magasins',
    magasinsTexte:
      "La liste suit les rayons du magasin. Si vous prenez vos légumes au marché et le reste au supermarché, ajoutez un second magasin : la liste se coupe en deux, un arrêt après l'autre, dans l'ordre où vous les faites.",
    magasinPrincipal: 'Mon magasin',
    magasinSansNom: 'Autre magasin',
    nomDuMagasin: 'Nom du magasin {{n}}',
    ajouterMagasin: 'Ajouter un magasin',
    supprimerMagasin: 'Supprimer {{nom}}',
    monterMagasin: 'Faire {{nom}} plus tôt',
    routageTitre: 'Où prenez-vous quoi ?',
    routageTexte: 'Les rayons non réglés vont au premier magasin.',
    ouPrendreRayon: 'Magasin pour le rayon {{rayon}}',
    decouvrirTitre: "Découvrir l'app",
    decouvrirTexte: 'Revoir la présentation des fonctionnalités et comment les utiliser.',
    revoirPresentation: 'Revoir la présentation',
    votreFoyer: 'Votre foyer',
    codeAPartager: 'Code à partager',
    rejoindreAutreFoyer: 'Rejoindre un autre foyer',
    rejoindreAutreFoyerTexte:
      'Change la maison que vous partagez — vos recettes et votre liste actuelles resteront accessibles avec leur propre code.',
    codeLabel: 'Code du foyer à rejoindre',
    codeErreurIntrouvable: 'Code introuvable, vérifiez-le.',
    codeErreurReseau: 'La recherche a échoué. Vérifiez votre connexion et réessayez.',
    recherche: 'Recherche…',
    rejoindre: 'Rejoindre',
    quitterFoyer: 'Quitter ce foyer',
    quitterConfirmation: 'Quitter ce foyer sur cet appareil ? {{code}}',
    quitterConfirmationCode: 'Notez son code ({{code}}) pour y revenir.',
    annuler: 'Annuler',
    quitter: 'Quitter',
    quitterTexte: 'Retour à l\'écran d\'accueil, pour en créer un nouveau ou en rejoindre un autre par code.',
    quitterFoyerBouton: 'Quitter le foyer',
    creditsPhoto: 'Crédits photo',
    creditsPhotoTexte: 'Les photos des plats sont de leurs auteurs, sous licence Creative Commons ou Unsplash.',
    voirListe: 'Voir la liste',
  },
  bienvenue: {
    titre: 'Bienvenue',
    intro: 'Créez votre maison, ou rejoignez celle de quelqu\'un avec son code.',
    creation: 'Création…',
    creerMaMaison: 'Créer ma maison',
    creerErreur: "La maison n'a pas pu être créée. Vérifiez votre connexion et réessayez.",
    rejoindreAvecCode: 'Rejoindre avec un code',
    codeLabel: 'Code du foyer à rejoindre',
    codeErreurIntrouvable: 'Code introuvable, vérifiez-le.',
    codeErreurReseau: 'La recherche a échoué. Vérifiez votre connexion et réessayez.',
    recherche: 'Recherche…',
    rejoindre: 'Rejoindre',
  },
  propose: {
    titre: 'Proposer',
    rechercheLabel: 'Chercher un plat ou un ingrédient',
    recherchePlaceholder: 'Un plat, un ingrédient…',
    effacerRecherche: 'Effacer la recherche',
    filtres: 'Filtres',
    toutEffacer: 'Tout effacer',
    aRefaire: 'À refaire',
    minutesMax: '≤ {{n}} min',
    aucuneRecette: 'Aucune recette ne correspond.',
    catalogueVide: "Votre catalogue est vide : la première recette s'ajoute ici.",
    effacerFiltres: 'Effacer les filtres',
    contient: 'contient {{motif}}',
    retirerDuPanier: 'Retirer {{titre}} du panier',
    ajouterAuPanier: 'Ajouter {{titre}} au panier',
    minutes: '{{n}} min',
  },
  panier: {
    titre: 'Panier',
    retireDuPanier: '« {{titre}} » retiré du panier.',
    annuler: 'Annuler',
    viderLePanier: 'Vider le panier',
    viderConfirmation:
      'Vider les {{n}} plat{{s}} du panier ? La liste de courses part avec, cases cochées comprises. Le catalogue de recettes, lui, ne bouge pas.',
    vider: 'Vider',
    viderTexte: "Courses faites et plats cuisinés ? Repartez d'un panier et d'une liste vides.",
    completerSemaine: 'Compléter ma semaine',
    ajouterPlatRapide: 'Ajouter un plat rapide',
    nouvelleRecette: 'Nouvelle recette',
    videTexte: 'Rien pour l\'instant. Choisissez des recettes dans « Proposer ».',
    apercuSemaine: 'Aperçu semaine',
    plats: '{{n}} plat{{s}}',
    semaine: 'Semaine {{n}} · {{parts}} part{{s}}',
    tempsCuisine: '{{temps}} de cuisine',
    toutCuisine: 'Tout est cuisiné',
    aCuisiner: '{{n}} à cuisiner',
    selectionnes: 'Sélectionnés',
    retirerPlat: 'Retirer {{titre}} du panier',
    moinsDeParts: 'Moins de parts pour {{titre}}',
    plusDeParts: 'Plus de parts pour {{titre}}',
    portions: 'Portions',
    genererListe: 'Générer la liste de courses',
    minutes: '{{n}} min',
    heures: '{{h}} h{{reste}}',
  },
  liste: {
    titre: 'Liste',
    articlePlaceholder: 'Papier toilette, café…',
    articleLabel: "Nom de l'article à ajouter",
    ajouter: 'Ajouter à la liste',
    fermerAjout: "Fermer l'ajout d'article",
    ajouterArticle: 'Ajouter un article',
    videTexte: 'La liste se remplit à partir du panier de la semaine.',
    modeTri: "Ce que j'ai déjà",
    modeCourses: 'Liste magasin',
    triTexte: 'Ouvrez le frigo et le placard, touchez ce qui est déjà là. Le reste part en courses.',
    passerAuxCourses: 'Passer aux courses ({{n}} produits)',
    progression: 'Progression',
    prochaineCuisson: 'Prochaine cuisson',
    rienAAcheter: 'Rien à acheter',
    coursesTerminees: 'Courses terminées',
    rienAAcheterTexte: 'Tout ce qu\'il faut est déjà dans vos placards.',
    coursesTermineesTexte: 'Les {{n}} produits sont dans le panier.',
    passerALaCuisson: 'Passer à la cuisson',
    listeCopiee: 'Liste copiée !',
    envoyerListe: 'Envoyer la liste',
    partageRefuse: 'Ce navigateur refuse le partage et la copie. Sélectionnez le texte ci-dessous.',
    copierAMain: 'Liste de courses à copier à la main',
    pourPlats: 'Pour {{liste}}',
    retirer: 'Retirer {{nom}}',
    revoirLeTri: 'Revoir le tri',
    cuisson: 'Cuisson',
    listeDeCourses: 'Liste de courses — semaine {{n}}',
    titrePartage: 'Liste de courses',
    magasinSansNom: 'Autre magasin',
    plusieursMagasins: 'Vous faites plusieurs magasins ?',
    reglerMagasins: 'Dites lesquels.',
  },
  cuisson: {
    quitter: 'Quitter',
    ceQuIlFaut: "Ce qu'il faut",
    lesEtapes: 'Les étapes',
    reprendre: "Reprendre à l'étape {{n}}",
    repartirDuDebut: 'Repartir du début',
    commencer: 'Commencer',
    cetaitComment: "C'était comment ?",
    finTexte: 'Bon appétit ! Cuisinez-la à nouveau, ou écartez-la des prochaines idées.',
    aRefaire: 'À refaire',
    jamais: 'Jamais',
    retourAuMenu: 'Retour au menu',
    quitterModeCuisson: 'Quitter le mode cuisson',
    etapeSur: 'Étape {{n}} sur {{total}}',
    allerAEtape: "Aller à l'étape {{n}}",
    ingredients: 'Ingrédients',
    lancer: 'Lancer {{duree}}',
    precedent: 'Précédent',
    suivant: 'Suivant',
    termine: 'Terminé',
  },
  cuissonListe: {
    titre: 'Cuisson',
    videTexte: 'Ajoutez des recettes au panier pour pouvoir les cuisiner.',
    tousFaits: "Tous les plats de la semaine sont passés en cuisine. Rien n'empêche d'en refaire un.",
    restants: 'Choisissez le plat à cuisiner maintenant — {{restants}} sur {{total}} vous attendent encore.',
    dejaCuisine: 'Déjà cuisiné',
    parts: '{{n}} parts',
    minutes: '{{n}} min',
  },
  detail: {
    retour: 'Retour',
    moinsDeParts: 'Moins de parts',
    plusDeParts: 'Plus de parts',
    part: 'Part{{s}}',
    revenirA: 'revenir à {{n}}',
    ingredients: 'Ingrédients',
    etapes: 'Étapes',
    retirerDuPanier: 'Retirer du panier',
    ajouterAuPanier: 'Ajouter au panier',
    cuisiner: 'Cuisiner',
    modifier: 'Modifier',
    supprimerConfirmation:
      'Supprimer « {{titre}} » du catalogue ? Les autres appareils du foyer la perdront aussi.',
    annuler: 'Annuler',
    supprimer: 'Supprimer',
    supprimerDuCatalogue: 'Supprimer du catalogue',
    minutes: '{{n}} min',
  },
  ajouter: {
    // La section « Ajouter une recette » de l'écran Proposer.
    sectionTitre: 'Ajouter une recette',
    sectionSousTitre: 'Écrivez-la vous-même, ou faites-la écrire par une IA.',
    fermerSection: "Fermer l'ajout de recette",
    titreEdition: 'Modifier la recette',

    choixTitre: "Comment voulez-vous l'ajouter ?",
    choixMainTitre: "Je l'écris moi-même",
    choixMainTexte: 'Un formulaire guidé : le nom, les ingrédients avec leurs quantités, les étapes.',
    choixIaTitre: 'Je la fais écrire par une IA',
    choixIaTexte:
      "Vous dites ce que vous voulez manger, l'app prépare le message à envoyer à ChatGPT ou Claude, et vous recollez sa réponse ici.",
    retourAuChoix: 'Changer de méthode',

    // Le formulaire, champ par champ.
    blocPlat: 'Le plat',
    champNom: 'Nom du plat',
    champNomPlaceholder: 'Dahl de lentilles corail',
    champTemps: 'Temps total (min)',
    champPortions: 'Nombre de parts',
    champPortionsAide:
      "Les quantités ci-dessous valent pour ce nombre de parts — l'app les recalcule ensuite selon le nombre de convives.",
    champDescription: 'Une phrase qui donne envie (facultatif)',
    champDescriptionPlaceholder: 'Doux, épicé, prêt en une demi-heure.',
    blocTags: 'Les étiquettes',
    tagsAide: 'Elles servent à filtrer le catalogue : végé, rapide, four, asiatique…',
    tagNouveau: 'Nouvelle étiquette',
    tagAjouter: "Ajouter l'étiquette",
    blocIngredients: 'Les ingrédients',
    ingredientsAide:
      "Un ingrédient par ligne, avec sa quantité et son rayon. C'est le rayon qui range la liste de courses dans l'ordre du magasin.",
    ingredientNom: "Nom de l'ingrédient {{n}}",
    ingredientNomPlaceholder: 'lentilles corail',
    ingredientQuantite: 'Quantité',
    ingredientUnite: 'Unité',
    ingredientRayon: 'Rayon',
    ingredientPlacard: 'Toujours dans le placard (sel, huile, épices)',
    ingredientSupprimer: "Supprimer l'ingrédient {{n}}",
    ingredientAjouter: 'Ajouter un ingrédient',
    blocEtapes: 'Les étapes',
    etapesAide:
      "Une étape par bloc, dans l'ordre : en cuisine, elles défilent une à une. Un ingrédient entre accolades — « cuire les {{exemple}} » — s'affiche avec sa dose.",
    etapeNumero: 'Étape {{n}}',
    etapePlaceholder: "Émincer l'oignon et le faire revenir dans l'huile…",
    etapeAstuce: 'Tour de main (facultatif)',
    etapeAstuceLabel: "Tour de main de l'étape {{n}}",
    etapeSupprimer: "Supprimer l'étape {{n}}",
    etapeAjouter: 'Ajouter une étape',
    erreurNom: 'Donnez un nom au plat.',
    erreurDoublon: '« {{titre}} » est déjà au catalogue.',
    erreurTemps: 'Indiquez le temps total, en minutes.',
    erreurPortions: 'Indiquez pour combien de parts, au moins une.',
    erreurIngredients: 'Ajoutez au moins un ingrédient.',
    erreurIngredientNom: 'Ingrédient {{n}} : il manque son nom.',
    erreurIngredientQuantite: '« {{nom}} » : il manque sa quantité.',
    erreurEtapes: 'Ajoutez au moins une étape.',

    // Le chemin « une IA écrit la recette », en trois gestes.
    iaEtape1Titre: 'Dites ce que vous voulez manger',
    iaEtape1Texte:
      "L'app en fait un message complet, qui contient déjà le format qu'elle sait relire. Laissez vide pour une recette au choix.",
    iaEtape2Titre: 'Collez ce message dans une IA',
    iaEtape2Texte:
      'Ouvrez ChatGPT ou Claude, collez, envoyez. Copiez ensuite toute sa réponse — le bloc de code, les phrases autour, peu importe.',
    iaEtape3Titre: 'Recollez sa réponse ici',
    iaEtape3Texte: "L'app en extrait la ou les recettes, et les vérifie avant de les ajouter.",
    demandePlaceholder: "Ex : 5 recettes d'été, végé, en moins de 20 minutes",
    copie: 'Copié !',
    copierLePrompt: "Copier le message pour l'IA",
    copieRefusee:
      'Ce navigateur refuse la copie automatique. Sélectionnez le texte ci-dessous et copiez-le à la main.',
    promptAMain: 'Message à copier à la main',
    reponsePlaceholder: "Collez ici la réponse de l'IA…",
    dejaAuCatalogue: 'Déjà au catalogue, {{mot}} de côté : {{titres}}.',
    laissee: 'laissée',
    laissees: 'laissées',
    resteLaisseDeCote: 'Le reste a été laissé de côté :',
    recetteAjoutee: '{{n}} recette{{s}} ajoutée{{s}}.',
    rienAAjouter: "Rien à ajouter dans ce collage : vérifiez d'avoir copié toute la réponse de l'IA.",
    echecAjout: "Échec de l'ajout.",

    // Fin de parcours.
    succesUne: '« {{titre}} » est au catalogue.',
    succesPlusieurs: '{{n}} recettes sont au catalogue.',
    succesTexte: 'Elles rejoignent les autres, sur cet appareil comme sur celui de votre foyer.',
    enAjouterUneAutre: 'Ajouter une autre recette',
    voirLeCatalogue: 'Revenir au catalogue',

    ajoutEnCours: 'Ajout…',
    enregistrer: 'Enregistrer',
    ajouterAuCatalogue: 'Ajouter au catalogue',
    terminer: 'Terminer',
    annuler: 'Annuler',
  },
  unites: {
    g: 'g',
    kg: 'kg',
    ml: 'ml',
    cl: 'cl',
    l: 'l',
    cs: 'c. à soupe',
    cc: 'c. à café',
    pincee: 'pincée',
    piece: 'pièce',
    botte: 'botte',
  },
  tour: {
    passer: 'Passer',
    etapesLabel: 'Étapes de la visite',
    etapeLabel: 'Étape {{n}} sur {{total}} : {{titre}}',
    retour: 'Retour',
    commencer: 'Commencer',
    suivant: 'Suivant',
    dialogueLabel: 'Visite guidée de FFFood',
  },
  bandeauMinuteur: {
    label: '{{n}} minuteur{{s}} en cours, ouvrir la gestion',
    termine: 'Terminé',
  },
  panneauMinuteurs: {
    fermer: 'Fermer les minuteurs',
    titre: 'Minuteurs',
    dialogueLabel: 'Minuteurs en cours',
    termine: 'Terminé',
    revenirA: 'Revenir à {{titre}}',
    supprimer: 'Supprimer le minuteur {{nom}}',
    toutSupprimer: 'Tout supprimer',
  },
  app: {
    reglages: 'Réglages',
    horsLigne: 'Hors ligne — vos changements se synchroniseront au retour du réseau',
    proposer: 'Proposer',
    panier: 'Panier ({{n}})',
    liste: 'Liste',
    cuisson: 'Cuisson',
    foyerNonInitialiseReessayez: 'Foyer non initialisé, réessayez dans un instant.',
    foyerNonInitialise: 'Foyer non initialisé.',
  },
  onboarding: [
    {
      titre: 'Bienvenue sur FFFood',
      texte:
        "Un tour de deux minutes pour repérer les boutons utiles. Choisissez vos repas, générez la liste de courses, et cuisinez — sans compte, sans pub, même hors ligne en magasin.",
    },
    {
      titre: 'Chercher une recette',
      texte:
        "Un titre de plat, mais aussi un ingrédient : tapez « aubergine » pour trouver quoi faire de celle qui traîne.",
    },
    {
      titre: 'Filtrer le catalogue',
      texte: "Par temps de préparation, par tag, ou juste les plats « à refaire » que vous avez aimés.",
    },
    {
      titre: 'Ajouter une recette',
      texte:
        "Votre catalogue vous appartient. Cette bande ouvre l'ajout, en haut de « Proposer » : écrivez la recette dans un formulaire, ou faites-la écrire par une IA et recollez sa réponse.",
    },
    {
      titre: 'Le Panier',
      texte:
        "Les plats retenus pour la semaine atterrissent ici. Ajustez le nombre de parts, puis générez la liste quand vous êtes prêt·e.",
    },
    {
      titre: 'La Liste',
      texte: "Générée automatiquement à partir du panier, rangée dans l'ordre des rayons. Cochez d'abord ce que vous avez déjà.",
    },
    {
      titre: 'Le mode Cuisson',
      texte: 'Les étapes défilent une à une, avec les quantités affichées directement dans le texte.',
    },
    {
      titre: 'Réglages',
      texte: 'Le code de votre foyer à partager, et cette visite à tout moment, vous attendent ici.',
    },
    {
      titre: "C'est parti !",
      texte: "Vous savez l'essentiel. Le reste se découvre en cuisinant.",
    },
  ],
  rayons: {
    'fruits-legumes': 'Fruits & légumes',
    'viande-poisson': 'Viande & poisson',
    cremerie: 'Crèmerie & frais',
    boulangerie: 'Pain & pâtisserie',
    epicerie: 'Épicerie',
    surgeles: 'Surgelés',
    boissons: 'Boissons',
    autre: 'Ajouté à la main',
  },
  validation: {
    pasUnObjet: "Ce n'est pas un objet JSON valide.",
    titreManquant: '« titre » manquant.',
    tempsInvalide: '« temps » doit être un nombre de minutes positif.',
    portionsInvalide: '« portions » doit être un nombre ≥ 1.',
    tagsInvalide: '« tags » doit être une liste (peut être vide).',
    etapesInvalide: '« etapes » doit être une liste non vide de texte.',
    ingredientsInvalide: '« ingredients » doit être une liste non vide.',
    ingredientN: 'ingrédient #{{n}}',
    ingredientPasObjet: "{{oi}} : n'est pas un objet.",
    ingredientNomManquant: '{{oi}} : « nom » manquant.',
    ingredientQuantiteInvalide: '{{oi}} : « quantite » doit être un nombre positif.',
    ingredientUniteInvalide: "{{oi}} : « unite » doit être l'une de : {{liste}}.",
    ingredientRayonInvalide: "{{oi}} : « rayon » doit être l'un de : {{liste}}.",
  },
}

const en: Dico = {
  reglages: {
    titre: 'Settings',
    fermer: 'Close settings',
    langue: 'Language',
    installerTitre: 'Install on your phone',
    installerTexte:
      "Installed, the app keeps your recipes and list available without a network — in the frozen aisle, that's the difference between a list and a blank screen.",
    installerBouton: 'Install FFFood',
    installerOrdinateur: 'On a computer: the install icon in the address bar.',
    partager: 'Share',
    ecranAccueil: 'Add to Home Screen',
    ajouterEcranAndroid: 'Install app',
    magasinsTitre: 'Your shops',
    magasinsTexte:
      'The list follows the aisles of a shop. If you get your vegetables at the market and the rest at the supermarket, add a second shop: the list splits in two, one stop after the other, in the order you do them.',
    magasinPrincipal: 'My shop',
    magasinSansNom: 'Other shop',
    nomDuMagasin: 'Name of shop {{n}}',
    ajouterMagasin: 'Add a shop',
    supprimerMagasin: 'Remove {{nom}}',
    monterMagasin: 'Do {{nom}} earlier',
    routageTitre: 'Where do you get what?',
    routageTexte: 'Aisles you leave alone go to the first shop.',
    ouPrendreRayon: 'Shop for the {{rayon}} aisle',
    decouvrirTitre: 'Discover the app',
    decouvrirTexte: 'See the feature tour again and how to use them.',
    revoirPresentation: 'See the tour again',
    votreFoyer: 'Your household',
    codeAPartager: 'Code to share',
    rejoindreAutreFoyer: 'Join another household',
    rejoindreAutreFoyerTexte:
      'Switch the household you share — your current recipes and list will stay reachable with their own code.',
    codeLabel: 'Household code to join',
    codeErreurIntrouvable: 'Code not found, please check it.',
    codeErreurReseau: 'The search failed. Check your connection and try again.',
    recherche: 'Searching…',
    rejoindre: 'Join',
    quitterFoyer: 'Leave this household',
    quitterConfirmation: 'Leave this household on this device? {{code}}',
    quitterConfirmationCode: 'Write down its code ({{code}}) to come back.',
    annuler: 'Cancel',
    quitter: 'Leave',
    quitterTexte: 'Back to the welcome screen, to create a new one or join another by code.',
    quitterFoyerBouton: 'Leave the household',
    creditsPhoto: 'Photo credits',
    creditsPhotoTexte: 'Dish photos belong to their authors, under Creative Commons or Unsplash license.',
    voirListe: 'See the list',
  },
  bienvenue: {
    titre: 'Welcome',
    intro: 'Create your household, or join someone else\'s with their code.',
    creation: 'Creating…',
    creerMaMaison: 'Create my household',
    creerErreur: 'The household could not be created. Check your connection and try again.',
    rejoindreAvecCode: 'Join with a code',
    codeLabel: 'Household code to join',
    codeErreurIntrouvable: 'Code not found, please check it.',
    codeErreurReseau: 'The search failed. Check your connection and try again.',
    recherche: 'Searching…',
    rejoindre: 'Join',
  },
  propose: {
    titre: 'Suggest',
    rechercheLabel: 'Search for a dish or an ingredient',
    recherchePlaceholder: 'A dish, an ingredient…',
    effacerRecherche: 'Clear search',
    filtres: 'Filters',
    toutEffacer: 'Clear all',
    aRefaire: 'Make again',
    minutesMax: '≤ {{n}} min',
    aucuneRecette: 'No recipe matches.',
    catalogueVide: 'Your catalog is empty: the first recipe goes in here.',
    effacerFiltres: 'Clear filters',
    contient: 'contains {{motif}}',
    retirerDuPanier: 'Remove {{titre}} from basket',
    ajouterAuPanier: 'Add {{titre}} to basket',
    minutes: '{{n}} min',
  },
  panier: {
    titre: 'Basket',
    retireDuPanier: '"{{titre}}" removed from basket.',
    annuler: 'Undo',
    viderLePanier: 'Empty the basket',
    viderConfirmation:
      'Empty the {{n}} dish{{s}} from the basket? The shopping list goes with it, checked boxes included. The recipe catalog itself won\'t change.',
    vider: 'Empty',
    viderTexte: 'Shopping done and dishes cooked? Start fresh with an empty basket and list.',
    completerSemaine: 'Complete my week',
    ajouterPlatRapide: 'Add a quick dish',
    nouvelleRecette: 'New recipe',
    videTexte: 'Nothing yet. Pick recipes from "Suggest".',
    apercuSemaine: 'Week overview',
    plats: '{{n}} dish{{s}}',
    semaine: 'Week {{n}} · {{parts}} serving{{s}}',
    tempsCuisine: '{{temps}} of cooking',
    toutCuisine: 'Everything is cooked',
    aCuisiner: '{{n}} left to cook',
    selectionnes: 'Selected',
    retirerPlat: 'Remove {{titre}} from basket',
    moinsDeParts: 'Fewer servings for {{titre}}',
    plusDeParts: 'More servings for {{titre}}',
    portions: 'Servings',
    genererListe: 'Generate shopping list',
    minutes: '{{n}} min',
    heures: '{{h}} h{{reste}}',
  },
  liste: {
    titre: 'List',
    articlePlaceholder: 'Toilet paper, coffee…',
    articleLabel: 'Name of the item to add',
    ajouter: 'Add to the list',
    fermerAjout: 'Close item entry',
    ajouterArticle: 'Add an item',
    videTexte: 'The list fills up from this week\'s basket.',
    modeTri: 'What I already have',
    modeCourses: 'Shop list',
    triTexte: 'Open the fridge and cupboard, tap what\'s already there. The rest goes to the shop list.',
    passerAuxCourses: 'Go to shopping ({{n}} items)',
    progression: 'Progress',
    prochaineCuisson: 'Next to cook',
    rienAAcheter: 'Nothing to buy',
    coursesTerminees: 'Shopping done',
    rienAAcheterTexte: 'Everything you need is already in your cupboards.',
    coursesTermineesTexte: 'The {{n}} items are in the basket.',
    passerALaCuisson: 'Go to cooking',
    listeCopiee: 'List copied!',
    envoyerListe: 'Send the list',
    partageRefuse: 'This browser refuses sharing and copying. Select the text below.',
    copierAMain: 'Shopping list to copy by hand',
    pourPlats: 'For {{liste}}',
    retirer: 'Remove {{nom}}',
    revoirLeTri: 'Review sorting',
    cuisson: 'Cooking',
    listeDeCourses: 'Shopping list — week {{n}}',
    titrePartage: 'Shopping list',
    magasinSansNom: 'Other shop',
    plusieursMagasins: 'Shopping in more than one place?',
    reglerMagasins: 'Tell the app where.',
  },
  cuisson: {
    quitter: 'Quit',
    ceQuIlFaut: 'What you need',
    lesEtapes: 'The steps',
    reprendre: 'Resume at step {{n}}',
    repartirDuDebut: 'Start over',
    commencer: 'Start',
    cetaitComment: 'How was it?',
    finTexte: 'Enjoy your meal! Cook it again, or set it aside from future ideas.',
    aRefaire: 'Make again',
    jamais: 'Never again',
    retourAuMenu: 'Back to menu',
    quitterModeCuisson: 'Quit cooking mode',
    etapeSur: 'Step {{n}} of {{total}}',
    allerAEtape: 'Go to step {{n}}',
    ingredients: 'Ingredients',
    lancer: 'Start {{duree}}',
    precedent: 'Previous',
    suivant: 'Next',
    termine: 'Done',
  },
  cuissonListe: {
    titre: 'Cooking',
    videTexte: 'Add recipes to the basket to be able to cook them.',
    tousFaits: 'All of this week\'s dishes have been cooked. Nothing stops you from making one again.',
    restants: 'Choose the dish to cook now — {{restants}} of {{total}} are still waiting.',
    dejaCuisine: 'Already cooked',
    parts: '{{n}} servings',
    minutes: '{{n}} min',
  },
  detail: {
    retour: 'Back',
    moinsDeParts: 'Fewer servings',
    plusDeParts: 'More servings',
    part: 'Serving{{s}}',
    revenirA: 'back to {{n}}',
    ingredients: 'Ingredients',
    etapes: 'Steps',
    retirerDuPanier: 'Remove from basket',
    ajouterAuPanier: 'Add to basket',
    cuisiner: 'Cook',
    modifier: 'Edit',
    supprimerConfirmation:
      'Delete "{{titre}}" from the catalog? The household\'s other devices will lose it too.',
    annuler: 'Cancel',
    supprimer: 'Delete',
    supprimerDuCatalogue: 'Delete from catalog',
    minutes: '{{n}} min',
  },
  ajouter: {
    sectionTitre: 'Add a recipe',
    sectionSousTitre: 'Write it yourself, or have an AI write it.',
    fermerSection: 'Close recipe entry',
    titreEdition: 'Edit the recipe',

    choixTitre: 'How do you want to add it?',
    choixMainTitre: 'I write it myself',
    choixMainTexte: 'A guided form: the name, the ingredients with their amounts, the steps.',
    choixIaTitre: 'Have an AI write it',
    choixIaTexte:
      'You say what you feel like eating, the app prepares the message to send to ChatGPT or Claude, and you paste its reply back here.',
    retourAuChoix: 'Change method',

    blocPlat: 'The dish',
    champNom: 'Dish name',
    champNomPlaceholder: 'Red lentil dahl',
    champTemps: 'Total time (min)',
    champPortions: 'Number of servings',
    champPortionsAide:
      'The amounts below are for this number of servings — the app rescales them for however many people you cook for.',
    champDescription: 'One tempting sentence (optional)',
    champDescriptionPlaceholder: 'Mild, spiced, ready in half an hour.',
    blocTags: 'Tags',
    tagsAide: 'They filter the catalog: veggie, quick, oven, asian…',
    tagNouveau: 'New tag',
    tagAjouter: 'Add the tag',
    blocIngredients: 'Ingredients',
    ingredientsAide:
      'One ingredient per line, with its amount and its aisle. The aisle is what sorts the shopping list in the order of the shop.',
    ingredientNom: 'Name of ingredient {{n}}',
    ingredientNomPlaceholder: 'red lentils',
    ingredientQuantite: 'Amount',
    ingredientUnite: 'Unit',
    ingredientRayon: 'Aisle',
    ingredientPlacard: 'Always in the cupboard (salt, oil, spices)',
    ingredientSupprimer: 'Remove ingredient {{n}}',
    ingredientAjouter: 'Add an ingredient',
    blocEtapes: 'Steps',
    etapesAide:
      'One step per block, in order: while cooking they scroll one by one. An ingredient in braces — "cook the {{exemple}}" — shows its dose.',
    etapeNumero: 'Step {{n}}',
    etapePlaceholder: 'Slice the onion and soften it in the oil…',
    etapeAstuce: 'Tip (optional)',
    etapeAstuceLabel: 'Tip for step {{n}}',
    etapeSupprimer: 'Remove step {{n}}',
    etapeAjouter: 'Add a step',
    erreurNom: 'Give the dish a name.',
    erreurDoublon: '"{{titre}}" is already in the catalog.',
    erreurTemps: 'Give the total time, in minutes.',
    erreurPortions: 'Give a number of servings, at least one.',
    erreurIngredients: 'Add at least one ingredient.',
    erreurIngredientNom: 'Ingredient {{n}}: its name is missing.',
    erreurIngredientQuantite: '"{{nom}}": its amount is missing.',
    erreurEtapes: 'Add at least one step.',

    iaEtape1Titre: 'Say what you feel like eating',
    iaEtape1Texte:
      'The app turns it into a full message that already carries the format it knows how to read back. Leave it empty for a recipe of the AI\'s choosing.',
    iaEtape2Titre: 'Paste that message into an AI',
    iaEtape2Texte:
      'Open ChatGPT or Claude, paste, send. Then copy its whole reply — code block, surrounding sentences, it does not matter.',
    iaEtape3Titre: 'Paste its reply back here',
    iaEtape3Texte: 'The app pulls the recipes out of it and checks them before adding them.',
    demandePlaceholder: 'E.g. 5 summer recipes, vegetarian, under 20 minutes',
    copie: 'Copied!',
    copierLePrompt: 'Copy the message for the AI',
    copieRefusee:
      'This browser refuses automatic copying. Select the text below and copy it by hand.',
    promptAMain: 'Message to copy by hand',
    reponsePlaceholder: 'Paste the AI reply here…',
    dejaAuCatalogue: 'Already in the catalog, {{mot}} aside: {{titres}}.',
    laissee: 'left',
    laissees: 'left',
    resteLaisseDeCote: 'The rest was left aside:',
    recetteAjoutee: '{{n}} recipe{{s}} added.',
    rienAAjouter: 'Nothing to add from this paste: check that you copied the whole AI reply.',
    echecAjout: 'Failed to add.',

    succesUne: '"{{titre}}" is in the catalog.',
    succesPlusieurs: '{{n}} recipes are in the catalog.',
    succesTexte: 'They join the others, on this device and on your household\'s.',
    enAjouterUneAutre: 'Add another recipe',
    voirLeCatalogue: 'Back to the catalog',

    ajoutEnCours: 'Adding…',
    enregistrer: 'Save',
    ajouterAuCatalogue: 'Add to catalog',
    terminer: 'Done',
    annuler: 'Cancel',
  },
  unites: {
    g: 'g',
    kg: 'kg',
    ml: 'ml',
    cl: 'cl',
    l: 'l',
    cs: 'tbsp',
    cc: 'tsp',
    pincee: 'pinch',
    piece: 'piece',
    botte: 'bunch',
  },
  tour: {
    passer: 'Skip',
    etapesLabel: 'Tour steps',
    etapeLabel: 'Step {{n}} of {{total}}: {{titre}}',
    retour: 'Back',
    commencer: 'Start',
    suivant: 'Next',
    dialogueLabel: 'FFFood guided tour',
  },
  bandeauMinuteur: {
    label: '{{n}} timer{{s}} running, open management',
    termine: 'Done',
  },
  panneauMinuteurs: {
    fermer: 'Close timers',
    titre: 'Timers',
    dialogueLabel: 'Running timers',
    termine: 'Done',
    revenirA: 'Back to {{titre}}',
    supprimer: 'Delete the timer {{nom}}',
    toutSupprimer: 'Delete all',
  },
  app: {
    reglages: 'Settings',
    horsLigne: 'Offline — your changes will sync when the network is back',
    proposer: 'Suggest',
    panier: 'Basket ({{n}})',
    liste: 'List',
    cuisson: 'Cooking',
    foyerNonInitialiseReessayez: 'Household not ready yet, try again in a moment.',
    foyerNonInitialise: 'Household not ready.',
  },
  onboarding: [
    {
      titre: 'Welcome to FFFood',
      texte:
        'A two-minute tour to spot the useful buttons. Pick your meals, generate the shopping list, and cook — no account, no ads, even offline at the shop.',
    },
    {
      titre: 'Search for a recipe',
      texte: 'A dish name, but also an ingredient: type "eggplant" to find what to do with the one lying around.',
    },
    {
      titre: 'Filter the catalog',
      texte: 'By prep time, by tag, or just the "make again" dishes you liked.',
    },
    {
      titre: 'Add a recipe',
      texte:
        'Your catalog is yours. This band at the top of "Suggest" opens recipe entry: fill in a form yourself, or have an AI write the recipe and paste its reply back.',
    },
    {
      titre: 'The Basket',
      texte:
        'Dishes picked for the week land here. Adjust the number of servings, then generate the list when ready.',
    },
    {
      titre: 'The List',
      texte: 'Generated automatically from the basket, ordered by aisle. Tick off what you already have first.',
    },
    {
      titre: 'Cooking mode',
      texte: 'The steps scroll one by one, with quantities shown directly in the text.',
    },
    {
      titre: 'Settings',
      texte: 'Your household code to share, and this tour any time, are waiting here.',
    },
    {
      titre: "Let's go!",
      texte: 'You know the essentials. The rest you\'ll discover while cooking.',
    },
  ],
  rayons: {
    'fruits-legumes': 'Fruit & vegetables',
    'viande-poisson': 'Meat & fish',
    cremerie: 'Dairy & chilled',
    boulangerie: 'Bread & bakery',
    epicerie: 'Groceries',
    surgeles: 'Frozen',
    boissons: 'Drinks',
    autre: 'Added by hand',
  },
  validation: {
    pasUnObjet: 'This is not a valid JSON object.',
    titreManquant: '"titre" is missing.',
    tempsInvalide: '"temps" must be a positive number of minutes.',
    portionsInvalide: '"portions" must be a number ≥ 1.',
    tagsInvalide: '"tags" must be a list (can be empty).',
    etapesInvalide: '"etapes" must be a non-empty list of text.',
    ingredientsInvalide: '"ingredients" must be a non-empty list.',
    ingredientN: 'ingredient #{{n}}',
    ingredientPasObjet: '{{oi}}: is not an object.',
    ingredientNomManquant: '{{oi}}: "nom" is missing.',
    ingredientQuantiteInvalide: '{{oi}}: "quantite" must be a positive number.',
    ingredientUniteInvalide: '{{oi}}: "unite" must be one of: {{liste}}.',
    ingredientRayonInvalide: '{{oi}}: "rayon" must be one of: {{liste}}.',
  },
}

const dictionnaires: Record<Langue, Dico> = { fr, en }

function resoudre(dico: Dico, chemin: string): string | undefined {
  const parts = chemin.split('.')
  let cur: Dico | string = dico
  for (const p of parts) {
    if (typeof cur !== 'object' || cur === null) return undefined
    cur = (cur as Dico)[p] as Dico | string
  }
  return typeof cur === 'string' ? cur : undefined
}

export function etapesOnboarding(langue: Langue) {
  return dictionnaires[langue].onboarding as unknown as { titre: string; texte: string }[]
}

interface ContexteLangue {
  langue: Langue
  definirLangue: (l: Langue) => void
  t: (chemin: string, variables?: Record<string, string | number>) => string
}

const Contexte = createContext<ContexteLangue | null>(null)

function lireLangueSauvegardee(): Langue {
  try {
    const v = localStorage.getItem(CLE_LANGUE)
    if (v === 'fr' || v === 'en') return v
  } catch {
    /* stockage indisponible : on retombe sur le français */
  }
  return 'fr'
}

export function FournisseurLangue({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>(lireLangueSauvegardee)

  useEffect(() => {
    try {
      localStorage.setItem(CLE_LANGUE, langue)
    } catch {
      /* stockage plein ou navigation privée stricte : tant pis, pas de mémorisation */
    }
    document.documentElement.lang = langue
  }, [langue])

  const t = (chemin: string, variables?: Record<string, string | number>) => {
    const brut = resoudre(dictionnaires[langue], chemin) ?? resoudre(dictionnaires.fr, chemin) ?? chemin
    if (!variables) return brut
    return brut.replace(/\{\{(\w+)\}\}/g, (_, cle: string) => String(variables[cle] ?? ''))
  }

  return <Contexte.Provider value={{ langue, definirLangue: setLangue, t }}>{children}</Contexte.Provider>
}

export function useLangue() {
  const ctx = useContext(Contexte)
  if (!ctx) throw new Error('useLangue doit être utilisé sous FournisseurLangue')
  return ctx
}
