import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Langue = 'fr' | 'en'

const CLE_LANGUE = 'fffood:langue'

type Dico = { [cle: string]: string | Dico | Dico[] }

const fr: Dico = {
  maj: {
    texte: 'Une nouvelle version est prête.',
    recharger: 'Recharger',
    plusTard: 'Plus tard',
  },
  reglages: {
    synchroTitre:
      'Synchro bloquée',
    synchroTexte:
      "Le réseau répond, mais le serveur refuse les écritures : cet appareil garde tout en local, l'autre téléphone ne voit rien. À vérifier côté Supabase — les policies de la table, la réplication temps réel, et que la clé du fichier .env est la bonne.",
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
    intro: 'Décider les repas de la semaine, en tirer la liste, et cuisiner. À deux, sans compte.',
    ou: 'ou',
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
    titreAjout: 'Ajouter une recette',
    titreEdition: 'Modifier la recette',
    intro:
      "Saisie automatique : demandez des recettes à une IA avec le prompt ci-dessous, puis collez sa réponse telle quelle — bloc de code, phrases autour et liste de plusieurs recettes sont acceptés. Dans les étapes, un ingrédient entre accolades — « cuire les {{exemple}} » — s'affiche avec sa dose en mode cuisson.",
    etape1: '1. Le prompt à copier',
    demandePlaceholder: "Ce que vous voulez (ex: 5 recettes d'été, végé, en moins de 20 min)…",
    copie: 'Copié !',
    copierLePrompt: 'Copier le prompt',
    copieRefusee: 'Ce navigateur refuse la copie automatique. Sélectionnez le texte ci-dessous et copiez-le à la main.',
    promptAMain: 'Prompt à copier à la main',
    etape2: "2. La réponse de l'IA",
    reponsePlaceholder: '{ "titre": "...", "temps": 30, ... }',
    dejaAuCatalogue: 'Déjà au catalogue, {{mot}} de côté : {{titres}}.',
    laissee: 'laissée',
    laissees: 'laissées',
    resteLaisseDeCote: 'Le reste a été laissé de côté :',
    recetteAjoutee: '{{n}} recette{{s}} ajoutée{{s}}.',
    rienAAjouter: 'Rien à ajouter dans ce collage.',
    modificationSeule: 'Vous modifiez une recette : collez-en une seule, pas une liste.',
    echecAjout: "Échec de l'ajout.",
    modificationsEnregistrees: 'Modifications enregistrées !',
    recettesAjoutees: '{{n}} recettes ajoutées !',
    recetteAjouteeSeule: 'Recette ajoutée !',
    ajoutEnCours: 'Ajout…',
    enregistrer: 'Enregistrer',
    ajouterAuCatalogue: 'Ajouter au catalogue',
    terminer: 'Terminer',
    annuler: 'Annuler',
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
    synchroRefusee: 'Synchro bloquée',
    chargement: 'Chargement…',
    reglages: 'Réglages',
    horsLigne: 'Hors ligne — vos changements se synchroniseront au retour du réseau',
    proposer: 'Proposer',
    panier: 'Panier ({{n}})',
    liste: 'Liste',
    cuisson: 'Cuisson',
    ajouter: 'Ajouter',
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
      titre: 'Le Panier',
      texte:
        "Les plats retenus pour la semaine atterrissent ici. Ajustez le nombre de parts, puis générez la liste quand vous êtes prêt·e.",
    },
    {
      titre: 'Ajouter une recette',
      texte:
        "Toujours accessible : ce bouton fait entrer une nouvelle recette dans votre catalogue, en quelques secondes avec l'aide d'une IA.",
    },
    {
      titre: 'La Liste',
      texte: "Générée automatiquement à partir du panier, triée par magasin. Cochez d'abord ce que vous avez déjà.",
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
  stores: {
    intermarche: 'Intermarché',
    primeur: 'Primeur & asiat',
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
    ingredientMagasinInvalide: "{{oi}} : « magasin » doit être l'un de : {{liste}}.",
  },
}

const en: Dico = {
  maj: {
    texte: 'A new version is ready.',
    recharger: 'Reload',
    plusTard: 'Later',
  },
  reglages: {
    synchroTitre:
      'Sync blocked',
    synchroTexte:
      'The network responds, but the server refuses writes: this device keeps everything locally and the other phone sees nothing. Check on the Supabase side — the table policies, realtime replication, and that the key in .env is the right one.',
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
    intro: 'Decide the week\'s meals, turn them into a list, and cook. Together, no account.',
    ou: 'or',
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
    titreAjout: 'Add a recipe',
    titreEdition: 'Edit the recipe',
    intro:
      'Automatic entry: ask an AI for recipes with the prompt below, then paste its reply as-is — a code block, surrounding sentences, and a list of several recipes are all accepted. In the steps, an ingredient in braces — "cook the {{exemple}}" — shows its dose in cooking mode.',
    etape1: '1. The prompt to copy',
    demandePlaceholder: 'What you want (e.g. 5 summer recipes, vegetarian, under 20 min)…',
    copie: 'Copied!',
    copierLePrompt: 'Copy the prompt',
    copieRefusee: 'This browser refuses automatic copying. Select the text below and copy it by hand.',
    promptAMain: 'Prompt to copy by hand',
    etape2: "2. The AI's reply",
    reponsePlaceholder: '{ "titre": "...", "temps": 30, ... }',
    dejaAuCatalogue: 'Already in the catalog, {{mot}} aside: {{titres}}.',
    laissee: 'left',
    laissees: 'left',
    resteLaisseDeCote: 'The rest was left aside:',
    recetteAjoutee: '{{n}} recipe{{s}} added.',
    rienAAjouter: 'Nothing to add from this paste.',
    modificationSeule: 'You are editing a recipe: paste just one, not a list.',
    echecAjout: 'Failed to add.',
    modificationsEnregistrees: 'Changes saved!',
    recettesAjoutees: '{{n}} recipes added!',
    recetteAjouteeSeule: 'Recipe added!',
    ajoutEnCours: 'Adding…',
    enregistrer: 'Save',
    ajouterAuCatalogue: 'Add to catalog',
    terminer: 'Done',
    annuler: 'Cancel',
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
    synchroRefusee: 'Sync blocked',
    chargement: 'Loading…',
    reglages: 'Settings',
    horsLigne: 'Offline — your changes will sync when the network is back',
    proposer: 'Suggest',
    panier: 'Basket ({{n}})',
    liste: 'List',
    cuisson: 'Cooking',
    ajouter: 'Add',
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
      titre: 'The Basket',
      texte:
        'Dishes picked for the week land here. Adjust the number of servings, then generate the list when ready.',
    },
    {
      titre: 'Add a recipe',
      texte: 'Always available: this button brings a new recipe into your catalog, in seconds with AI help.',
    },
    {
      titre: 'The List',
      texte: 'Generated automatically from the basket, sorted by shop. Tick off what you already have first.',
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
  stores: {
    intermarche: 'Intermarché',
    primeur: 'Greengrocer & Asian store',
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
    ingredientMagasinInvalide: '{{oi}}: "magasin" must be one of: {{liste}}.',
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
