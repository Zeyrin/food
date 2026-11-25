# FFFood sur Android et iOS

L'app des stores est la PWA elle-même, emballée avec [Capacitor](https://capacitorjs.com) :
même bundle, mêmes 137 recettes embarquées, toujours utilisable hors ligne en magasin.
Il n'y a pas de deuxième code à entretenir — un changement dans `src/` part sur le site
et dans les deux apps.

Ce qui diffère sur téléphone est regroupé dans `src/lib/natif.ts` et
`src/lib/plateforme.ts` :

| Sur le site | Dans l'app des stores |
|---|---|
| Service worker, mise à jour automatique | Pas de service worker : la mise à jour passe par le store |
| Alerte de minuteur envoyée par le service worker quand il sonne | Notification locale **programmée au lancement** : elle part même app fermée |
| `navigator.wakeLock` | Plugin keep-awake, écran allumé pendant la cuisson |
| `navigator.share` | Feuille de partage native |
| Lien de foyer sur l'origine de la page | Lien sur `https://www.fffood.fr` (l'origine de l'app est `localhost`) |
| Crédits et données servis par le site | Les mêmes pages, ouvertes en ligne |

## Les commandes

```sh
npm run mobile           # build du site + copie dans android/ et ios/
npm run mobile:android   # idem, puis ouvre Android Studio
npm run mobile:ios       # idem, puis ouvre Xcode (sur Mac)
npm run mobile:assets    # régénère icônes et écrans de lancement depuis assets/*.svg
```

`android/` et `ios/` sont versionnés : ce sont des projets natifs ordinaires, qu'on
peut retoucher (permissions, version, nom). Le bundle web copié dedans, lui, ne l'est
pas — il faut relancer `npm run mobile` après chaque changement dans `src/`.

Le workflow GitHub **Mobile** compile les deux plateformes quand le natif change, ou à
la main depuis l'onglet Actions. Il publie un APK de debug à installer directement sur
un téléphone Android.

## FFFood+ : l'abonnement des apps

Les apps des stores vendent **FFFood+** par les achats intégrés d'Apple et de
Google (obligatoire pour un abonnement numérique), à travers
[RevenueCat](https://www.revenuecat.com) (`@revenuecat/purchases-capacitor`).

| Gratuit, partout | FFFood+ (apps des stores) |
|---|---|
| Catalogue des 137 recettes, panier, liste, cuisson, minuteurs | Ajouter ses propres recettes (lien, IA, à la main) |
| Rejoindre un foyer par lien ou par code | Inviter quelqu'un dans son foyer (lien ou code) |

Le site reste entièrement gratuit : pas de paiement web pour l'instant, et Apple
interdit de renvoyer depuis l'app vers un paiement extérieur.

Le code : `src/lib/abonnement.ts` (SDK), `src/lib/offre.ts` (textes du paywall,
testés), `src/hooks/usePlus.tsx` (`exiger('recettes' | 'foyer', action)`),
`src/components/Paywall.tsx`. **Sans clé RevenueCat au build, il n'y a pas de
paywall et tout est ouvert** (builds de dev, APK de debug).

### Mise en place (une fois)

1. **App Store Connect** → l'app `fr.fffood.app` → Abonnements : un groupe
   « FFFood+ » avec deux produits, `fffood_plus_annuel` (1 an, **24,99 €**,
   essai gratuit de 7 jours) et `fffood_plus_mensuel` (1 mois, **3,99 €**).
   En option, l'achat à vie : un produit *non consommable* `fffood_plus_a_vie`
   (**59,99 €**), hors du groupe d'abonnements. Signer le contrat
   « Paid Apps » et remplir les infos bancaires et fiscales, sinon les produits
   ne se chargent pas.
2. **Play Console** → Monétiser → Abonnements : les deux mêmes produits, avec
   un forfait de base chacun (et l'essai sur l'annuel) ; l'achat à vie en
   *produit intégré* (Monétiser → Produits intégrés), même identifiant.
3. **RevenueCat** : un projet, une app iOS et une app Android (avec la clé
   d'API App Store Connect et le compte de service Google), un *entitlement*
   **`plus`** auquel on rattache les quatre produits, et une *offering*
   « default » marquée *current* avec les paquets **Annual** et **Monthly**,
   et **Lifetime** si l'achat à vie est proposé (le paywall l'affiche alors en
   troisième, sans texte de renouvellement).
4. Les clés SDK publiques (`appl_…`, `goog_…`) dans `.env`
   (`VITE_REVENUECAT_IOS_KEY`, `VITE_REVENUECAT_ANDROID_KEY`) et dans les
   secrets du dépôt, avec `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` que le
   workflow Mobile passe maintenant au build.
5. **Supabase** : exécuter `supabase/migration-02-effacement.sql` dans le SQL
   Editor (fonction `effacer_mes_donnees`, utilisée par Réglages → Effacer mes
   données).

Les prix affichés viennent toujours du store (devise, taxes du pays) : on les
change dans les consoles, jamais dans le code.

### Ce que la revue d'Apple vérifie, et où c'est fait

| Exigence | Dans FFFood |
|---|---|
| Achat intégré pour un abonnement numérique | RevenueCat / StoreKit, aucun lien de paiement externe |
| Le paywall dit exactement ce qu'on obtient et pour quel prix | Les deux avantages, ce qui reste gratuit, prix et période du store, essai, renouvellement, résiliation |
| « Restaurer mes achats » | Paywall et Réglages → FFFood+ |
| Conditions d'utilisation + confidentialité dans l'app | `public/conditions.html` et `public/donnees.html`, liés depuis le paywall et Réglages ; les mêmes URL à mettre dans App Store Connect (EULA : celle d'Apple, citée dans les conditions) |
| Suppression des données depuis l'app | Réglages → Effacer mes données (serveur, session anonyme, appareil) |
| Connexion Apple si connexion sociale | Sans objet : pas de compte, pas de connexion |
| Consentement avant d'envoyer des données à une IA | Sans objet : l'app ne contacte aucune IA ; « une IA écrit la recette » fait copier un prompt que l'utilisateur colle lui-même dans l'outil de son choix |
| Textes d'autorisation | Seules les notifications sont demandées (pas de texte requis sur iOS) ; ni caméra, ni photos, ni position |
| Marche sur iPad | Cible iPhone + iPad, paywall centré sur tablette ; à vérifier sur un iPad réel avant envoi |
| Pas qu'un site emballé (4.2) | Hors ligne complet, notifications locales, écran allumé, partage natif, achats intégrés |
| Compte de démo | Pas de compte. Dans la note au relecteur : « aucun compte ; FFFood+ s'achète en sandbox depuis Réglages → FFFood+ ou en touchant Ajouter une recette » |

Note au relecteur suggérée : *FFFood works without an account. Free: the
137-recipe catalogue, basket, shopping list, cooking mode and timers, all
offline. FFFood+ (auto-renewable subscription) unlocks adding your own recipes
and inviting someone into your household; tap "Add a recipe" or Settings →
FFFood+ to see the paywall. Data deletion: Settings → Delete my data.*

## Publier sur le Play Store

1. Compte Google Play Console (25 $, une fois).
2. Une clé de signature, à garder précieusement — sans elle, plus de mise à jour :
   `keytool -genkey -v -keystore fffood.jks -alias fffood -keyalg RSA -keysize 2048 -validity 10000`
3. Dans les secrets du dépôt (Settings → Secrets → Actions) :
   `ANDROID_KEYSTORE_BASE64` (`base64 -w0 fffood.jks`), `ANDROID_KEYSTORE_PASSWORD`,
   `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Le workflow Mobile sort alors un `.aab`
   signé.
4. Avant chaque envoi, monter `versionCode` (et `versionName`) dans
   `android/app/build.gradle`.
5. Fiche : captures d'écran, description, politique de confidentialité
   (`https://www.fffood.fr/donnees.html`), questionnaire de classification.
   La permission « alarmes exactes » se justifie par les minuteurs de cuisson.
6. Les nouveaux comptes personnels doivent passer par un test fermé (12 testeurs
   pendant 14 jours) avant la production.

## Publier sur l'App Store

Il faut un Mac avec Xcode, et un compte Apple Developer (99 $/an).

1. `npm run mobile:ios`, puis dans Xcode : cible **App** → Signing & Capabilities →
   choisir l'équipe. L'identifiant est `fr.fffood.app`.
2. Monter la version (Marketing Version) et le build à chaque envoi.
3. Product → Archive → Distribute App → App Store Connect.
4. Dans App Store Connect : fiche, captures (6,9" et 6,5"), confidentialité
   (« Achats » collectés pour la fonctionnalité de l'app, non liés à l'identité ;
   le foyer est un UUID anonyme), liens vers les conditions et la confidentialité,
   puis TestFlight et soumission.

**Le risque de refus à connaître** : Apple rejette les apps qui ne sont « qu'un site
emballé » (règle 4.2). FFFood a de quoi y répondre — hors ligne complet, notifications
locales des minuteurs, écran maintenu allumé, partage natif — et c'est à mettre en avant
dans la note au relecteur.
