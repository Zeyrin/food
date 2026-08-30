import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Langue = 'fr' | 'en'

const CLE_LANGUE = 'fffood:langue'

export type Dico = { [cle: string]: string | Dico | Dico[] }

const fr: Dico = {
  foyer: {
    sessionImpossible:
      "Impossible d'ouvrir une session avec le serveur. Si vous administrez ce site : activez les connexions anonymes dans Supabase (Authentication → Providers → Anonymous sign-ins).",
  },
  reglages: {
    donneesTitre:
      "Données & vie privée",
    donneesTexte:
      "Ce qui reste sur ce téléphone, ce qui est partagé dans le foyer, et ce que voit la mesure d'audience.",
    donneesLien:
      "Lire la page",
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
    codeAPartagerAide:
      "Donnez-le à qui partage cette maison : il l'entre sur son écran d'accueil, et vous tenez la même liste.",
    copierCode: 'Copier le code',
    codeCopie: 'Copié',
    partageInactif:
      "Le partage n'est pas configuré sur cette installation : l'app fonctionne seule sur cet appareil.",
    rejoindreAutreFoyer: 'Rejoindre un autre foyer',
    rejoindreAutreFoyerTexte:
      'Change la maison que vous partagez — vos recettes et votre liste actuelles resteront accessibles avec leur propre code.',
    codeLabel: 'Code du foyer à rejoindre',
    codeIndice: "Six caractères, ou collez le lien de partage qu'on vous a envoyé.",
    codeErreurIntrouvable: 'Code introuvable, vérifiez-le.',
    codeErreurReseau: 'La recherche a échoué. Vérifiez votre connexion et réessayez.',
    lienSansFoyer: 'Ce lien ne mène à aucune maison. Collez-le en entier.',
    lienIntrouvable: 'Ce lien ne mène à aucune maison connue : elle a peut-être été supprimée.',
    confirmerCode: 'Rejoindre la maison {{code}} ?',
    confirmerLien: 'Rejoindre la maison de ce lien ?',
    confirmerGarde:
      "Vos recettes et votre liste actuelles resteront accessibles avec leur propre code, que l'écran d'accueil proposera pour y revenir.",
    recherche: 'Recherche…',
    rejoindre: 'Rejoindre',
    quitterFoyer: 'Quitter ce foyer',
    quitterConfirmation: 'Quitter ce foyer sur cet appareil ? {{code}}',
    quitterConfirmationCode:
      "Son code ({{code}}) restera proposé sur l'écran d'accueil pour y revenir.",
    annuler: 'Annuler',
    quitter: 'Quitter',
    quitterTexte: 'Retour à l\'écran d\'accueil, pour en créer un nouveau ou en rejoindre un autre par code.',
    quitterFoyerBouton: 'Quitter le foyer',
    versionTitre: "Version de l'app",
    versionTexte:
      "L'app se met à jour toute seule : au démarrage, elle vérifie s'il y a du neuf et l'installe. Ce bouton force la vérification tout de suite.",
    versionInstallee: 'Version installée',
    majInstaller: 'Installer la nouvelle version',
    majVerification: 'Vérification…',
    majAJour: 'Vous avez la dernière version',
    majVerifier: 'Vérifier les mises à jour',
    reinstallerLien: "Un souci d'affichage ? Réinstaller la dernière version",
    reinstallerLabel: 'Confirmer la réinstallation',
    reinstallerConfirmation:
      "Recharger l'app depuis le réseau ? Vos recettes, votre panier et votre liste sont conservés.",
    reinstallerBouton: 'Recharger',
    creditsPhoto: 'Crédits photo',
    creditsPhotoTexte: 'Les photos des plats sont de leurs auteurs, sous licence Creative Commons ou Unsplash.',
    voirListe: 'Voir la liste',
  },
  bienvenue: {
    partageInactif:
      "Le partage n'est pas configuré sur cette installation : l'app fonctionne seule sur cet appareil.",
    // Le problème du soir, biffé plutôt que résolu à coups d'arguments :
    // la question ne se pose plus, elle est raturée. `reponse` porte le
    // ton (« réglé », pas « nous proposons des solutions »).
    question: "Qu'est-ce qu'on mange ce soir ?",
    reponse: 'Décidé.',
    intro: 'Décider les repas de la semaine, en tirer la liste, et cuisiner. À deux, sans compte.',
    // Trois gestes, dans l'ordre où l'app les propose (voir la barre
    // d'onglets) : choisir des plats, s'en servir pour la liste de
    // courses, puis cuisiner. Nouveau venu, on ne sait pas encore que
    // « Proposer » cache un panier ou que « Liste » sort du panier.
    commentTitre: 'Comment ça marche',
    etapeProposerTitre: 'Choisissez des plats',
    etapeProposerTexte: 'Piochez dans le catalogue, ou collez vos propres recettes.',
    etapeListeTitre: 'La liste se fait seule',
    etapeListeTexte: 'Les ingrédients de vos plats, regroupés par rayon.',
    etapeCuisineTitre: 'Cuisinez, étape par étape',
    etapeCuisineTexte: 'Minuteurs intégrés, et une note pour retrouver ce que vous avez aimé.',
    ou: 'ou',
    creation: 'Création…',
    creerMaMaison: 'Créer ma maison',
    creerAide: 'Une maison neuve, avec un code à donner à qui la partagera.',
    creerErreur: "La maison n'a pas pu être créée. Vérifiez votre connexion et réessayez.",
    rejoindreAvecCode: 'Rejoindre une maison',
    rejoindreAide: 'Celle de quelqu\'un d\'autre : sa liste, ses recettes, son historique.',
    codeLabel: 'Code du foyer à rejoindre',
    codeIndice: 'Six caractères, ou collez le lien de partage qu\'on vous a envoyé.',
    codeErreurIntrouvable: 'Code introuvable, vérifiez-le.',
    codeErreurReseau: 'La recherche a échoué. Vérifiez votre connexion et réessayez.',
    lienSansFoyer: 'Ce lien ne mène à aucune maison. Collez-le en entier.',
    lienIntrouvable: "Ce lien ne mène à aucune maison connue : elle a peut-être été supprimée.",
    recherche: 'Recherche…',
    rejoindre: 'Rejoindre',
    repriseTitre: 'Votre maison précédente',
    repriseSansCode: 'Ouverte par lien',
    repriseAide:
      'Vous l\'avez quittée, mais elle existe toujours : vos recettes et votre liste vous y attendent.',
    repriseBouton: 'Y revenir',
    repriseEnCours: 'Retour…',
    repriseOublier: 'Oublier cette maison',
    repriseIntrouvable: "Cette maison est introuvable : elle a peut-être été supprimée.",
    repriseErreur: 'Le retour a échoué. Vérifiez votre connexion et réessayez.',
  },
  placeholders: {
    // Une recette sans photo (ajoutée depuis l'app, en général) : plutôt
    // qu'une case vide ou une simple initiale, une formule qui fait
    // sourire — chacune reste attachée à la même recette d'un rendu à
    // l'autre (voir `phraseRecette` dans lib/identite.ts). Objet plutôt
    // que tableau : `i18n.test.ts` traite un tableau comme une liste de
    // sous-dictionnaires (voir `onboarding`), pas de simples chaînes.
    sansPhoto: {
      '0': 'Mangé avant la photo.',
      '1': "Trop bon pour attendre l'appareil photo.",
      '2': 'Le parfum ne tenait pas en photo.',
      '3': 'Photo en cours de digestion.',
      '4': 'On a préféré se resservir.',
      '5': 'Belle à table, timide en photo.',
      '6': "Personne n'a pensé à sortir son téléphone.",
      '7': "Ici, on juge au nez, pas à l'œil.",
      '8': "Les mains étaient trop occupées à se resservir.",
      '9': 'Le temps de trouver le téléphone, il ne restait plus rien.',
      '10': "Cette recette préfère l'incognito.",
      '11': 'Vue une seule fois. Mangée deux fois plus vite.',
      '12': "L'appareil photo a eu moins de succès que le plat.",
      '13': "Sublime en vrai, on vous jure.",
      '14': "Photo ratée, plat réussi : on a gardé le bon des deux.",
      '15': 'Personne ne fait de photo un lundi soir affamé.',
      '16': "Imaginez, mais avec plus de vapeur qui monte.",
      '17': "A fini dans les assiettes avant de finir en photo.",
      '18': 'Sentait trop bon pour attendre.',
      '19': "Cette recette-là se raconte, elle ne se montre pas.",
    },
  },
  propose: {
    titre: 'Proposer',
    rechercheLabel: 'Chercher un plat ou un ingrédient',
    recherchePlaceholder: 'Un plat, un ingrédient…',
    effacerRecherche: 'Effacer la recherche',
    filtres: 'Filtres',
    toutEffacer: 'Tout effacer',
    favoris: 'Favoris',
    favori: 'Favori',
    aucunFavori:
      "Pas encore de favori. Une recette y entre quand vous l'ajoutez vous-même, ou quand vous répondez « À refaire » après l'avoir cuisinée.",
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
    // Les compteurs entre parenthèses : le titre dit de quoi il s'agit,
    // le nombre reste un détail qu'on lit en second, jamais un mot.
    retour: 'Retour',
    titreIngredients: 'Ingrédients ({{n}})',
    titreEtapes: 'Étapes ({{n}})',
    reprendre: 'Reprendre (étape {{n}} sur {{total}})',
    repartirDuDebut: 'Repartir du début',
    commencer: 'Commencer ({{total}} étape{{s}})',
    cetaitComment: "C'était comment ?",
    finTexte: 'Bon appétit ! Votre réponse affine les prochaines propositions.',
    aRefaire: 'À refaire',
    jamais: 'Plus jamais',
    retourAuMenu: 'Retour au menu',
    quitterModeCuisson: 'Quitter le mode cuisson',
    etapeSur: 'Étape {{n}} sur {{total}}',
    allerAEtape: "Aller à l'étape {{n}}",
    lancer: 'Minuteur ({{duree}})',
    dosesDeLEtape: 'Pour cette étape',
    precedent: 'Précédent',
    suivant: 'Suivant',
    termine: 'Terminé',
  },
  cuissonListe: {
    titre: 'Cuisson',
    videTexte: 'Ajoutez des recettes au panier pour pouvoir les cuisiner.',
    tousFaits: "Tous les plats de la semaine sont cuisinés — rien n'empêche d'en refaire un.",
    restants: 'À cuisiner cette semaine ({{restants}} sur {{total}}).',
    dejaCuisine: 'Déjà cuisiné',
    parts: '{{n}} part{{s}}',
    minutes: '{{n}} min',
  },
  detail: {
    retour: 'Retour',
    favori: 'Favori',
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
    suppressionEnCours: 'Suppression…',
    suppressionEchouee: 'La suppression a échoué. Vérifiez votre connexion et réessayez.',
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
    titre: 'Minuteurs ({{n}})',
    dialogueLabel: 'Minuteurs en cours',
    termine: 'Terminé',
    revenirA: 'Revenir à {{titre}}',
    supprimer: 'Supprimer le minuteur {{nom}}',
    toutSupprimer: 'Tout supprimer',
  },
  notificationMinuteur: {
    // Elle part du service worker, hors de tout composant : traduite par
    // `traduire()` plutôt que par `t`, mais traduite quand même — elle
    // sortait en français en dur, même app réglée en anglais.
    corps: "{{titre}} — c'est prêt.",
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
      texte:
        'Par temps de préparation, par tag, ou par favoris — les plats que vous avez aimés après les avoir cuisinés, et ceux que vous avez ajoutés vous-même.',
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
      texte:
        "Les étapes défilent une à une. Les doses de l'étape s'affichent sur une ligne juste au-dessus — la consigne reste une phrase, le nombre reste un nombre.",
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
  /**
   * Le nom d'un minuteur est découpé dans l'étape (`lib/duree.ts`).
   * Quand elle n'offre rien à lire — « Laisser 20 min » et rien
   * d'autre —, il reste ce libellé.
   */
  duree: {
    minuteurSansNom: 'Minuteur {{duree}}',
  },
  /**
   * Noms d'unité et séparateur décimal, pour le formulaire de recette
   * comme pour `lib/aggregate.ts` — qui n'est pas un composant : sans
   * dictionnaire, une liste de courses en anglais annonçait
   * « 2 c. à s. » et « 0,5 pincée ».
   *
   * Un seul bloc : il y en avait deux, et le second masquait
   * silencieusement le premier (même clé dans le même objet). Le
   * formulaire n'avait donc plus aucun libellé et retombait sur les
   * codes bruts — « piece » au lieu de « pièce ».
   */
  unites: {
    g: 'g',
    kg: 'kg',
    ml: 'ml',
    cl: 'cl',
    l: 'l',
    cs: 'c. à s.',
    cc: 'c. à c.',
    pincee: 'pincée',
    pincees: 'pincées',
    piece: 'pièce',
    botte: 'botte',
    bottes: 'bottes',
    separateurDecimal: ',',
  },
  sync: {
    partageNonConfigureAjout: "Le partage n'est pas configuré : impossible d'enregistrer la recette.",
    partageNonConfigureModification:
      "Le partage n'est pas configuré : impossible d'enregistrer la modification.",
    partageNonConfigureSuppression:
      "Le partage n'est pas configuré : impossible de supprimer la recette.",
  },
  collage: {
    aucunJson: 'Aucun JSON trouvé dans le texte collé.',
    jsonMalForme:
      "Le JSON est incomplet ou mal formé — souvent une réponse d'IA coupée en route. Redemandez-la, ou collez-la en entier.",
    listeVide: 'La liste collée est vide.',
    recetteNumero: 'Recette #{{n}}',
  },
  erreur: {
    titre: "L'app s'est arrêtée",
    texte:
      "Rien n'est perdu : vos recettes, votre panier et votre liste sont enregistrés. Rechargez pour repartir de l'accueil.",
    recharger: "Recharger l'app",
    details: 'Détail technique',
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
  foyer: {
    sessionImpossible:
      "Could not open a session with the server. If you administer this site: enable anonymous sign-ins in Supabase (Authentication → Providers → Anonymous sign-ins).",
  },
  reglages: {
    donneesTitre:
      "Data & privacy",
    donneesTexte:
      "What stays on this phone, what is shared within the household, and what the audience measurement sees.",
    donneesLien:
      "Read the page",
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
    codeAPartagerAide:
      'Hand it to whoever shares this household: they enter it on their welcome screen, and you hold the same list.',
    copierCode: 'Copy the code',
    codeCopie: 'Copied',
    partageInactif:
      'Sharing is not configured on this install: the app works on this device alone.',
    rejoindreAutreFoyer: 'Join another household',
    rejoindreAutreFoyerTexte:
      'Switch the household you share — your current recipes and list will stay reachable with their own code.',
    codeLabel: 'Household code to join',
    codeIndice: 'Six characters, or paste the share link you were sent.',
    codeErreurIntrouvable: 'Code not found, please check it.',
    codeErreurReseau: 'The search failed. Check your connection and try again.',
    lienSansFoyer: 'That link leads to no household. Paste all of it.',
    lienIntrouvable: 'That link leads to no known household: it may have been deleted.',
    confirmerCode: 'Join household {{code}}?',
    confirmerLien: 'Join the household this link points to?',
    confirmerGarde:
      'Your current recipes and list will stay reachable with their own code, which the welcome screen will offer to take you back to.',
    recherche: 'Searching…',
    rejoindre: 'Join',
    quitterFoyer: 'Leave this household',
    quitterConfirmation: 'Leave this household on this device? {{code}}',
    quitterConfirmationCode:
      'Its code ({{code}}) will stay offered on the welcome screen to come back to.',
    annuler: 'Cancel',
    quitter: 'Leave',
    quitterTexte: 'Back to the welcome screen, to create a new one or join another by code.',
    quitterFoyerBouton: 'Leave the household',
    versionTitre: 'App version',
    versionTexte:
      'The app updates itself: on startup it checks for something new and installs it. This button forces the check right now.',
    versionInstallee: 'Installed version',
    majInstaller: 'Install the new version',
    majVerification: 'Checking…',
    majAJour: 'You have the latest version',
    majVerifier: 'Check for updates',
    reinstallerLien: 'Display trouble? Reinstall the latest version',
    reinstallerLabel: 'Confirm the reinstall',
    reinstallerConfirmation:
      'Reload the app from the network? Your recipes, your basket and your list are kept.',
    reinstallerBouton: 'Reload',
    creditsPhoto: 'Photo credits',
    creditsPhotoTexte: 'Dish photos belong to their authors, under Creative Commons or Unsplash license.',
    voirListe: 'See the list',
  },
  bienvenue: {
    partageInactif:
      "Sharing is not configured on this install: the app works on this device alone.",
    question: 'What are we eating tonight?',
    reponse: 'Sorted.',
    intro: 'Decide the week\'s meals, turn them into a list, and cook. Together, no account.',
    commentTitre: 'How it works',
    etapeProposerTitre: 'Pick some dishes',
    etapeProposerTexte: 'Browse the catalog, or paste in your own recipes.',
    etapeListeTitre: 'The list builds itself',
    etapeListeTexte: 'Every ingredient from your dishes, grouped by aisle.',
    etapeCuisineTitre: 'Cook, step by step',
    etapeCuisineTexte: 'Built-in timers, and a note to remember what you liked.',
    ou: 'or',
    creation: 'Creating…',
    creerMaMaison: 'Create my household',
    creerAide: 'A fresh household, with a code to hand to whoever shares it.',
    creerErreur: 'The household could not be created. Check your connection and try again.',
    rejoindreAvecCode: 'Join a household',
    rejoindreAide: 'Someone else\'s: their list, their recipes, their history.',
    codeLabel: 'Household code to join',
    codeIndice: 'Six characters, or paste the share link you were sent.',
    codeErreurIntrouvable: 'Code not found, please check it.',
    codeErreurReseau: 'The search failed. Check your connection and try again.',
    lienSansFoyer: 'That link leads to no household. Paste all of it.',
    lienIntrouvable: 'That link leads to no known household: it may have been deleted.',
    recherche: 'Searching…',
    rejoindre: 'Join',
    repriseTitre: 'Your previous household',
    repriseSansCode: 'Opened from a link',
    repriseAide:
      'You left it, but it still exists: your recipes and your list are waiting there.',
    repriseBouton: 'Go back to it',
    repriseEnCours: 'Going back…',
    repriseOublier: 'Forget this household',
    repriseIntrouvable: 'That household cannot be found: it may have been deleted.',
    repriseErreur: 'Going back failed. Check your connection and try again.',
  },
  placeholders: {
    sansPhoto: {
      '0': 'Eaten before the photo happened.',
      '1': 'Too good to wait for the camera.',
      '2': "The smell didn't fit in a photo.",
      '3': 'Photo currently being digested.',
      '4': 'We went for seconds instead.',
      '5': 'Gorgeous on the plate, camera-shy.',
      '6': 'Nobody thought to grab their phone.',
      '7': 'Judged by smell, not by sight, here.',
      '8': 'Hands were too busy going for seconds.',
      '9': 'By the time the phone came out, it was gone.',
      '10': 'This recipe prefers to stay incognito.',
      '11': 'Seen once. Eaten twice as fast.',
      '12': 'The camera had less luck than the dish.',
      '13': 'Gorgeous in person, we promise.',
      '14': 'Photo failed, dinner succeeded: we kept the good one.',
      '15': 'Nobody photographs a hungry Monday night.',
      '16': 'Picture it, but with more steam rising off it.',
      '17': 'Made it to the plates before it made it to a photo.',
      '18': 'Smelled too good to wait around.',
      '19': "This one's told, not shown.",
    },
  },
  propose: {
    titre: 'Suggest',
    rechercheLabel: 'Search for a dish or an ingredient',
    recherchePlaceholder: 'A dish, an ingredient…',
    effacerRecherche: 'Clear search',
    filtres: 'Filters',
    toutEffacer: 'Clear all',
    favoris: 'Favorites',
    favori: 'Favorite',
    aucunFavori:
      'No favorites yet. A recipe joins them when you add it yourself, or when you answer "Make again" after cooking it.',
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
    retour: 'Back',
    titreIngredients: 'Ingredients ({{n}})',
    titreEtapes: 'Steps ({{n}})',
    reprendre: 'Resume (step {{n}} of {{total}})',
    repartirDuDebut: 'Start over',
    commencer: 'Start ({{total}} step{{s}})',
    cetaitComment: 'How was it?',
    finTexte: 'Enjoy your meal! Your answer sharpens the next suggestions.',
    aRefaire: 'Make again',
    jamais: 'Never again',
    retourAuMenu: 'Back to menu',
    quitterModeCuisson: 'Quit cooking mode',
    etapeSur: 'Step {{n}} of {{total}}',
    allerAEtape: 'Go to step {{n}}',
    lancer: 'Timer ({{duree}})',
    dosesDeLEtape: 'For this step',
    precedent: 'Previous',
    suivant: 'Next',
    termine: 'Done',
  },
  cuissonListe: {
    titre: 'Cooking',
    videTexte: 'Add recipes to the basket to be able to cook them.',
    tousFaits: 'Every dish this week has been cooked — nothing stops you from making one again.',
    restants: 'To cook this week ({{restants}} of {{total}}).',
    dejaCuisine: 'Already cooked',
    parts: '{{n}} serving{{s}}',
    minutes: '{{n}} min',
  },
  detail: {
    retour: 'Back',
    favori: 'Favorite',
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
    suppressionEnCours: 'Deleting…',
    suppressionEchouee: 'Could not delete. Check your connection and try again.',
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
    titre: 'Timers ({{n}})',
    dialogueLabel: 'Running timers',
    termine: 'Done',
    revenirA: 'Back to {{titre}}',
    supprimer: 'Delete the timer {{nom}}',
    toutSupprimer: 'Delete all',
  },
  notificationMinuteur: {
    corps: "{{titre}} — it's ready.",
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
      texte:
        'By prep time, by tag, or by favorites — the dishes you liked after cooking them, and the ones you added yourself.',
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
      texte:
        'The steps scroll one by one. The quantities for each step sit on a line just above it — the instruction stays a sentence, the number stays a number.',
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
  duree: {
    minuteurSansNom: 'Timer {{duree}}',
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
    pincees: 'pinches',
    piece: 'piece',
    botte: 'bunch',
    bottes: 'bunches',
    separateurDecimal: '.',
  },
  sync: {
    partageNonConfigureAjout: 'Sharing is not configured: the recipe cannot be saved.',
    partageNonConfigureModification: 'Sharing is not configured: the change cannot be saved.',
    partageNonConfigureSuppression: 'Sharing is not configured: the recipe cannot be deleted.',
  },
  collage: {
    aucunJson: 'No JSON found in the pasted text.',
    jsonMalForme:
      'The JSON is incomplete or malformed — often an AI answer cut off mid-way. Ask for it again, or paste it in full.',
    listeVide: 'The pasted list is empty.',
    recetteNumero: 'Recipe #{{n}}',
  },
  erreur: {
    titre: 'The app stopped',
    texte:
      'Nothing is lost: your recipes, basket and list are saved. Reload to start again from the home screen.',
    recharger: 'Reload the app',
    details: 'Technical detail',
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

/**
 * Exporté pour `i18n.test.ts`, qui vérifie que les deux colonnes
 * portent exactement les mêmes clés et les mêmes `{{variables}}`.
 * Le repli sur le français rend une traduction manquante invisible à
 * l'usage : c'est précisément pour ça qu'un test doit la voir.
 */
export const dictionnaires: Record<Langue, Dico> = { fr, en }

function resoudre(dico: Dico, chemin: string): string | undefined {
  const parts = chemin.split('.')
  let cur: Dico | string = dico
  for (const p of parts) {
    if (typeof cur !== 'object' || cur === null) return undefined
    cur = (cur as Dico)[p] as Dico | string
  }
  return typeof cur === 'string' ? cur : undefined
}

/**
 * Une clé, une langue, ses variables. Le français sert de filet : une
 * clé absente de `en` s'affiche en français plutôt que de laisser son
 * chemin technique à l'écran (`i18n.test.ts` veille à ce que le cas ne
 * se produise pas).
 */
export function traduireEn(
  langue: Langue,
  chemin: string,
  variables?: Record<string, string | number>,
): string {
  const brut = resoudre(dictionnaires[langue], chemin) ?? resoudre(dictionnaires.fr, chemin) ?? chemin
  if (!variables) return brut
  return brut.replace(/\{\{(\w+)\}\}/g, (_, cle: string) => String(variables[cle] ?? ''))
}

export function etapesOnboarding(langue: Langue) {
  return dictionnaires[langue].onboarding as unknown as { titre: string; texte: string }[]
}

/** Les formules pour une recette sans photo, voir `phraseRecette`. */
export function phrasesSansPhoto(langue: Langue): string[] {
  const dico = (dictionnaires[langue].placeholders as unknown as { sansPhoto: Record<string, string> })
    .sansPhoto
  return Object.keys(dico)
    .sort((a, b) => Number(a) - Number(b))
    .map((cle) => dico[cle]!)
}

/**
 * La langue à la première ouverture. On ne présumait rien et on
 * servait du français à tout le monde, alors que l'anglais est traduit
 * de bout en bout : `navigator.language` répond à la question sans
 * jamais rien demander. Un choix déjà fait dans les réglages prime,
 * évidemment — c'est la seule valeur qu'on écrit.
 */
function lireLangueSauvegardee(): Langue {
  try {
    const v = localStorage.getItem(CLE_LANGUE)
    if (v === 'fr' || v === 'en') return v
  } catch {
    /* stockage indisponible : on continue avec la langue du navigateur */
  }
  // `window` et non `navigator` : Node en expose un, avec sa propre
  // locale (« en-US »), et les tests basculeraient en anglais sans le
  // vouloir. La détection n'a de sens que dans un navigateur.
  if (typeof window !== 'undefined') {
    // `startsWith` plutôt qu'une égalité : « en-GB », « en-US » et
    // « en » désignent la même colonne du dictionnaire.
    if (window.navigator?.language?.toLowerCase().startsWith('en')) return 'en'
  }
  return 'fr'
}

/**
 * La langue courante, hors React. `aggregate.ts`, `validerRecette.ts`
 * et `collerRecettes.ts` produisent du texte lu par un humain — des
 * unités (« c. à s. »), des messages de validation — sans être des
 * composants : ils n'ont ni contexte ni hook à leur disposition. Une
 * app n'affiche qu'une langue à la fois, donc un module en suffit à
 * la porter, et `FournisseurLangue` la tient à jour.
 */
let langueActive: Langue = lireLangueSauvegardee()

/** Traduction hors composant. Sous React, préférer `useLangue().t`. */
export const traduire = (chemin: string, variables?: Record<string, string | number>) =>
  traduireEn(langueActive, chemin, variables)

interface ContexteLangue {
  langue: Langue
  definirLangue: (l: Langue) => void
  t: (chemin: string, variables?: Record<string, string | number>) => string
}

const Contexte = createContext<ContexteLangue | null>(null)

export function FournisseurLangue({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>(lireLangueSauvegardee)

  // Pendant le rendu, pas dans l'effet : les fonctions pures appelées
  // par les composants d'en dessous (formatQuantite, notamment) lisent
  // `langueActive` au cours de ce même rendu. La mettre à jour après
  // coup afficherait une fois les unités de l'ancienne langue.
  langueActive = langue

  useEffect(() => {
    try {
      localStorage.setItem(CLE_LANGUE, langue)
    } catch {
      /* stockage plein ou navigation privée stricte : tant pis, pas de mémorisation */
    }
    document.documentElement.lang = langue
  }, [langue])

  const t = (chemin: string, variables?: Record<string, string | number>) =>
    traduireEn(langue, chemin, variables)

  return <Contexte.Provider value={{ langue, definirLangue: setLangue, t }}>{children}</Contexte.Provider>
}

export function useLangue() {
  const ctx = useContext(Contexte)
  if (!ctx) throw new Error('useLangue doit être utilisé sous FournisseurLangue')
  return ctx
}
