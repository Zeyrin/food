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
   (« aucune donnée collectée liée à l'identité » — le foyer est un UUID anonyme),
   puis TestFlight et soumission.

**Le risque de refus à connaître** : Apple rejette les apps qui ne sont « qu'un site
emballé » (règle 4.2). FFFood a de quoi y répondre — hors ligne complet, notifications
locales des minuteurs, écran maintenu allumé, partage natif — et c'est à mettre en avant
dans la note au relecteur.
