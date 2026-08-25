# Note de passation — le repositionnement commercial

*Rédigée le 28 juillet 2026, à la fin de la session d'analyse. Objectif : qu'une personne (ou
une session) qui reprend le dossier dans trois semaines ou trois mois comprenne en dix minutes
ce qui a été décidé, pourquoi, et ce qu'il reste à faire.*

---

## 1. Le point de départ

Développeur web freelance en Île-de-France, 7+ ans d'expérience, React/TypeScript, PWA
offline-first, synchro temps réel. Trois applications personnelles construites par plaisir
(Coup de Tête, une app « quoi faire cet aprem », l'app Courses de ce dépôt), aucune monétisée.

Situation commerciale à l'entrée : **~1 000 € par projet, deux clients associatifs, un seul
retainer à 100 €/mois, aucun pipeline.** Une tentative de démarchage physique chez un
restaurateur, soldée par un silence.

**Le problème tel qu'il était formulé au départ** : « je crée des apps mais je bloque toujours à
l'étape de les faire connaître sur les réseaux ; comment je fais du marketing ? »

**Le problème réel, tel qu'il est apparu après analyse** : ce n'en était pas un de marketing.

---

## 2. Ce qui a été fait

Quatre recherches approfondies menées en parallèle, toutes sur sources primaires vérifiées
(pages tarifaires officielles, INSEE, CNIL, Légifrance, URSSAF, France Num, baromètres sectoriels
avec méthodologie publiée), plus deux vérifications directes sur la réforme de la facturation
électronique et sur le marché parisien des missions.

Onze documents produits dans `business/`. Le dépôt `food` sert de support parce que la branche
de travail était déjà rattachée à ce projet ; les documents n'ont aucun lien avec le code de
l'application.

---

## 3. Les cinq conclusions qui ont changé la direction

### 3.1 Le diagnostic n'était pas le bon

Le code de l'app Courses a été relu avant toute recommandation : ~3 200 lignes de TypeScript,
tests unitaires sur la logique métier, offline-first réel, synchro temps réel avec gestion
documentée des cas limites (collision de topic en StrictMode, abonnement realtime qui échoue en
silence, stratégie last-writer-wins assumée et justifiée). Les arbitrages produit de
`PARCOURS.md` relèvent d'une compétence de conception, pas seulement d'exécution.

**Conclusion : le blocage n'est pas la compétence technique, ni la capacité à finir un produit.
C'est le segment, le prix et le canal.**

### 3.2 Le chiffre central

Le marché parisien pour un profil React/TypeScript à 7 ans d'expérience est à **600-800 €/jour**
(TJMètre : médiane Paris 620 € ; Free-Work : 576 € de moyenne IDF sur la tranche 11-15 ans ;
marché senior Next/TS : 650-800 €).

Le prix horaire implicite pratiqué était de **~100 €/jour** (1 000 € pour une dizaine de jours).

**Le marché paie 6 à 8× ce qui était facturé, pour le même travail, dans la même ville.** C'est
la conclusion qui rend tout le reste secondaire.

### 3.3 Une mission en régie règle la survie deux fois

Objectif : 2 500 € net/mois = **3 900 € HT/mois** (micro-BNC 2026 : 25,6 % de cotisations + 2,2 %
de versement libératoire + 0,2 % de CFP = 28 % de prélèvements).

224 missions React ouvertes sur Free-Work au moment du relevé, dont plusieurs à Paris entre 450
et 600 €/jour, et une à Levallois sur 18 mois à 600 €/jour. Free-Work ne prélève **aucune
commission** (jobboard monétisé côté recruteur).

À 600 €/jour sur **4 jours par semaine** : ~9 600 € brut, ~6 900 € net, soit **2,8× l'objectif —
et une journée par semaine protégée pour construire.** C'est l'arbitrage recommandé, et le seul
qui compte réellement : le temps plein résout la trésorerie mais reproduit le piège (exécutant
à plein temps, retour à zéro en fin de mission).

### 3.4 Les segments visés étaient les plus pauvres du marché

| Segment | Réalité budgétaire | Verdict |
|---|---|---|
| Associations | Budget structurellement nul | Garder pour les 3 avis Malt, pas pour le CA |
| Restauration | **28 % à budget numérique zéro**, 41 % entre 1 et 1 000 €/an | Abandonner |
| Artisans (plomberie, électricité, coiffure) | Budget médian **590-800 €** | Ne jamais cibler |
| Kinés | Agenda déjà plein → aucun besoin d'acquisition | Ne jamais cibler |

**La leçon transversale : l'accessibilité d'un segment est un piège. Ces gens sont faciles à
joindre précisément parce qu'ils n'achètent pas.**

### 3.5 L'échantillon était de un

Le taux de conversion du porte-à-porte est de 2-5 %. À 3 %, il faut **33 portes pour une vente**.
Un seul prospect contacté, aucune relance envoyée — alors que sur 7,5 millions d'emails analysés
(Belkins), **les étapes 2 à 6 génèrent 58,6 % des réponses** et l'étape 3 à elle seule produit
35,6 % des rendez-vous.

Le silence du restaurateur n'était pas un verdict. C'était le résultat statistiquement attendu.

---

## 4. Les erreurs corrigées en cours de route

Trois recommandations ont été formulées puis **invalidées par la recherche**. Elles sont
consignées ici pour qu'elles ne soient pas reproposées.

**❌ « Vends-leur un site pour économiser les commissions TheFork. »**
Faux. Sur sa page tarifaire officielle, TheFork indique que les réservations venant du site du
restaurant, d'Instagram et de Facebook sont **déjà incluses, sans commission**. TheFork PAY est
également gratuit pour les restaurateurs. Le pitch se serait fait démonter par le premier
prospect informé. S'ajoutent : ~13 % seulement de pénétration de TheFork sur le marché cible, et
une concurrence consolidée (Zenchef + CoverManager + Formitable + Resengo = **une seule
entreprise**, PSG Equity majoritaire, 50 M€+) qui vend le site web à **29 €/mois**.
→ `01-marche-restaurants.md`

**❌ « L'offline-first est ton différenciateur, vends ça. »**
Faux. Praxedo publie un guide technique « Offline First », Kizeo documente sa file de synchro
locale, Daxium et Coredinate aussi. Un dirigeant de PME ne saura jamais distinguer un bon d'un
mauvais offline en démo de 30 minutes. Ce qui se vend réellement : **le processus métier
spécifique, la propriété des données, l'intégration au SI existant.**
→ `03-apps-metier.md`

**❌ « Le SEO et le contenu écrit sont ton canal, puisque tu n'aimes pas la vidéo. »**
Vrai sur le fond, faux sur le calendrier. Ahrefs, sur 2 millions de pages : **95 % des nouvelles
pages n'atteignent jamais le top 10 en un an**. Comptez 12 à 24 mois pour un flux fiable. En
situation de survie, ce n'est pas un canal, c'est un investissement — 1 h/semaine maximum, en
second plan.
→ `04-prospection.md`

---

## 5. Ce qui est décidé

1. **TJM fixé à 600 €**, plancher de sortie à 500 €. Ne plus jamais l'improviser.
2. **Prix projet minimum 2 750 € HT** si le forfait redevient un jour le mode de facturation
   (c'est ce que les agences paient déjà en sous-traitance).
3. **Canal principal : la régie**, via Free-Work en priorité (zéro commission), Malt en second.
4. **4 jours par semaine, pas 5.** Demandé dès le premier échange, systématiquement.
5. **Positionnement affiché : « 7 ans, React/TypeScript, PWA, temps réel »** — surtout pas
   « création de sites web », qui déclasse immédiatement.
6. **Segments définitivement écartés** : associations, restauration, artisans, kinés, démarchage
   de commerce en général.
7. **Statut : micro-entreprise.** L'EURL coûterait ~2 000 €/an de comptabilité et imposerait des
   cotisations minimales même sans CA. La question se repose à 65-70 k€ de CA.
8. **Règle anti-candy-product** : une journée par semaine maximum, sur **un seul** produit
   existant, et cette journée se gagne.

---

## 6. Ce qui reste ouvert

- **Le seuil de TVA sera franchi en 4 à 5 mois** au rythme visé (37 500 € pour les prestations de
  services). À anticiper : facturation avec TVA, déclarations. Impact neutre côté client, les ESN
  et grands comptes étant assujettis.
- **Le portage salarial** comme clé d'accès : certains grands comptes refusent de contracter avec
  une micro-entreprise. Perte d'environ 500 €/mois de net, gain de droits chômage et retraite. À
  accepter pour décrocher une mission à 600 €, pas comme choix par défaut.
- **La spécialisation facturation électronique** (`08-facturation-electronique.md`) : ce n'est
  plus un plan de survie mais une carte à jouer pour la suite. Obligation légale de réception au
  **1er septembre 2026** (confirmée, pas de report — DGFiP, 6 mai 2026), émission TPE/PME au
  **1er septembre 2027**. Un profil React senior sachant intégrer Factur-X et les API de
  plateformes agréées se vend plus cher qu'un profil React générique, avec une demande garantie
  par la loi.
- **Le virage app métier** (`03-apps-metier.md`) : panier 10 000-30 000 €, meilleur canal = les
  intégrateurs ERP (Odoo, Divalto, EBP), prix plancher 12 000 €, premier pas toujours vendu en
  audit payant 1 200-1 800 €. À enclencher depuis une position stable, pas depuis la survie.
- **Quel produit occupe la journée protégée ?** Coup de Tête ou la préparation du virage app
  métier. Décision non tranchée, mais **une seule chose à la fois**.

---

## 7. Les actions immédiates, non encore faites

À l'heure de cette note, aucune n'est engagée.

**Trésorerie — une demi-journée, personne à convaincre :**
- [ ] **Aide Financière Exceptionnelle du CPSTI** — jusqu'à 2 000 €, non remboursable, motif
      « ralentissement temporaire de l'activité ». Formulaire sur le compte URSSAF.
- [ ] **Prime d'activité / RSA** — simulation caf.fr, 15 minutes. Éligibilité très probable au
      niveau de CA actuel.
- [ ] **Droits ARE** — vérification France Travail. Si des droits existent, prendre l'**ARE
      mensuelle** plutôt que l'ARCE (elle lisse un revenu incertain ; l'ARCE est un capital vite
      consommé et imposable).
- [ ] **Malt Open** — importer les 3 clients existants pour obtenir 3 avis vérifiés. C'est le
      seuil documenté pour sortir de l'anonymat algorithmique. Coût nul.

**Mise en marché — semaines 1 et 2 :**
- [ ] CV et profils refaits autour du positionnement senior React/TS.
- [ ] **20 à 30 candidatures sur Free-Work** (224 missions React ouvertes, plus TypeScript et
      front-end). C'est du volume, pas de la vente.
- [ ] Profil Malt à 100 %, TJM affiché 600 €, disponibilité confirmée, **réponse sous 24 h**
      (critère de classement documenté).
- [ ] Demander le 4/5 dès le premier échange.

**Délais réalistes** : 2 à 8 semaines jusqu'au premier jour facturé, puis 30 à 60 jours jusqu'au
premier encaissement. **C'est l'intervalle que les aides de trésorerie servent à couvrir.**

---

## 8. Une alerte technique sans rapport avec le commercial

**iOS purge le stockage script-writable — cache du service worker et IndexedDB — après environ 7
jours d'inactivité**, avec un cap de 50 Mo et un historique de corruption d'IndexedDB. L'API
Persistent Storage existe depuis Safari 17 mais exige la permission de notification.

Concrètement, sur l'app Courses : **une semaine sans l'ouvrir sur iPhone peut vider les données
locales.** Sur une future app professionnelle contenant des données non synchronisées, c'est
rédhibitoire — il faut un wrapper Capacitor (un seul code base, stockage natif fiable,
distribution App Store/MDM).

---

## 9. Comment naviguer le dossier

**Entrer par `10-paris-7ans.md`** — c'est le plan à jour, et il remplace la couche 2 de
`05-plan.md`. Puis `05-plan.md` pour la structure générale et les règles.

Le reste est le dossier de preuves, à consulter au besoin : `00-diagnostic.md` (l'analyse de
départ), `01` à `04` (les quatre recherches), `06` à `09` (portfolio, règles de vente,
facturation électronique, messages prêts à envoyer). `pipeline.csv` attend d'être rempli.

Chaque chiffre du dossier porte sa source. **Ne pas réutiliser un chiffre sans vérifier qu'il est
toujours valable** — plusieurs dispositifs ont fermé récemment (Chèque France Num national en
octobre 2025, Chèque Numérique Île-de-France le 24 octobre 2025) et les seuils micro-entreprise
ont été revalorisés par la loi de finances 2026 (micro-BNC à 83 600 €, et non 77 700 € comme le
répètent encore beaucoup de sources).

---

## 10. La phrase à retenir

Le sentiment de « faire du candy product » était en partie juste, mais il désignait le mauvais
gaspillage. Le gaspillage n'était pas de coder des applications le week-end — **c'était de vendre
à 100 € la journée, dans la ville de France qui paie le mieux, une compétence que le marché
valorise à 600 €.**
