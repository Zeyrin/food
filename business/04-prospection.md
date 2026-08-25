# Prospection — le système minimum viable

*Pour quelqu'un qui déteste vendre. 4 h par semaine. Tenable indéfiniment.*

## D'abord : le restaurateur, décortiqué avec des chiffres

**L'échantillon était de 1.** Le taux de conversion du porte-à-porte est de **2 à 5 %**. À 3 %,
il faut **33 portes pour une vente**. Zéro vente sur une porte n'est pas un signal, c'est le
résultat statistiquement attendu.

**Le prix n'était pas le problème, la catégorie budgétaire l'était.** Baromètre France Num 2025
(11 021 entreprises) : **28 % des TPE-PME n'ont aucun budget numérique, 41 % dépensent entre 1 €
et 1 000 €/an, seules 31 % dépassent 1 000 €/an**. L'offre à 150 €/mois = 1 800 €/an, ce qui
place le restaurateur dans le **top ~20 % des dépenses numériques des TPE françaises**.

**Il payait 350 €/mois pour des couverts identifiables, pas pour un « budget site web ».** À
~2,60 €/couvert, il achète environ 135 couverts attribuables par mois — il voit la ligne dans son
logiciel. Un site sans mécanisme d'attribution n'est pas comparable.

**Offrir le site a détruit la vente.** Deux mécanismes documentés :
- **Ancrage** (Tversky & Kahneman 1974) : passer de 150 €/mois → gratuit → 500 € + 100 €/mois,
  c'est **négocier deux fois contre soi sans qu'il ait fait la moindre contre-offre**. Ça lui a
  appris que le silence produit une meilleure offre.
- **Coût de propagation** : le coût réel d'une concession qui se propage est **~3× la concession
  elle-même** (*Journal of the Academy of Marketing Science*).

Et l'arithmétique est cruelle : 150 €/mois = 1 800 €/an. 500 € + 100 €/mois = **1 700 € la
première année**. **Deux concessions spectaculaires pour un écart réel de 100 €.**

**Aucune relance n'a été envoyée.** Or sur 7 530 489 emails analysés (Belkins) : **les étapes 2 à
6 génèrent 58,6 % des réponses**, et **l'étape 3 à elle seule produit 35,6 % de tous les
rendez-vous** — plus que les étapes 1 et 2 réunies. Tu as abandonné avant la partie où les
ventes se font.
→ https://belkins.io/blog/sales-follow-up-statistics

**Et surtout : tu n'as jamais qualifié.** Tu as pitché avant de savoir s'il avait un budget, un
problème conscient et le pouvoir de décider. C'est la cause racine de tout le reste.

## Ce que les données disent en sa faveur

- **Les campagnes de moins de 50 destinataires obtiennent 5,8 % de réponse contre 2,1 % pour les
  grosses listes.** Ton handicap (pas d'équipe, pas de volume) est en réalité ton avantage : tu
  peux personnaliser à un niveau qu'aucune agence ne peut tenir.
- **Les entreprises de 0-10 salariés répondent 3× mieux** que les grands comptes (0,72 % vs
  0,22 %), et les fondateurs/propriétaires mieux que les VP.
- **Le secteur Food & Beverage est le n°1 de tous les secteurs à 3,47 % de réponse.** Son
  intuition d'aller vers les restaurateurs était statistiquement bonne. C'est l'exécution qui a
  manqué — mais le segment reste mauvais côté budget (voir `02-marche-freelance.md`).
- **68,6 % de l'acquisition du marché freelance web français vient du bouche-à-oreille** (étude
  Agences & Freelances Web 2025). Pour un introverti, c'est une excellente nouvelle : le canal
  dominant n'est pas un canal de vente, **c'est un canal de réputation**.
  → https://www.wp-community.fr/etude-agences-freelances-web-2025-ce-que-les-chiffres-disent-vraiment-du-marche-wordpress-francophone/

## Le cadre légal, précisément

**B2B = régime opt-out**, base légale = intérêt légitime. Deux conditions cumulatives (CNIL) :
la personne a été informée, et elle peut s'y opposer simplement et sans frais.

**Le point décisif** : la CNIL exclut explicitement les **adresses génériques** —
*« les adresses génériques de type info@nomsociete.fr… qui concernent des personnes morales, ne
sont pas soumises aux principes rappelés ci-dessus »*. → `contact@`, `info@`, `reservation@`
sont **hors du champ de ces obligations**. C'est la voie la plus propre.
→ https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique-sms-mms-et-automate-dappel

**Le piège inverse** : une adresse **personnelle** (`prenom.nom@gmail.com`), même utilisée
professionnellement, **exige l'opt-in**. Règle simple : gmail/orange/free + un prénom → **hors
séquence automatisée**, passer par le téléphone ou le formulaire de contact.

**Téléphone** : la loi du 11 août 2026 interdisant le démarchage sans consentement vise
expressément le **« consommateur »** (art. L223-1 du Code de la consommation). **Le cold call
B2B vers un professionnel reste licite.** Et c'est le canal qui **double le taux de réponse** en
combinaison avec l'email.

**Technique** : SPF + DKIM + DMARC obligatoires depuis 2024 (Google/Yahoo) et mai 2025
(Microsoft). Domaine d'envoi **secondaire**, jamais le principal. Warm-up sur 4-6 semaines.
Volume sûr : 20-40/jour pour un solo (seuil de danger à 50+). Plainte spam < 0,3 %, bounce < 2 %.

## La routine hebdomadaire — 4 h, 4 créneaux

**🟦 LUNDI — 60 min — Construire la liste** *(zéro interaction humaine)*
Un **seul segment par mois** — un segment = un message qui s'améliore, au lieu de 12 messages
médiocres. Constituer **30 prospects** : nom du dirigeant, email générique, téléphone, et **une
observation vérifiable par prospect**. Trier légalement : générique → séquence, gmail perso →
téléphone.

**🟩 MARDI — 60 min — Envoyer** *(zéro interaction humaine)*
Charger les 30 prospects dans une séquence de 4 emails (J0 / J+3 / J+8 / J+16). Envoi **8h-12h,
mardi/mercredi/jeudi**. Volume résultant : ~22 emails/jour, très en dessous du seuil de sécurité.

**🟨 JEUDI — 75 min — Répondre et pousser** *(la seule partie sociale)*
- 30 min : répondre à toutes les réponses. Objectif = **obtenir un appel de 15 min**, rien
  d'autre. Jamais de devis par email avant l'appel.
- 20 min : 5 messages prescripteurs (graphistes, agences, imprimeurs).
- 15 min : 1 post LinkedIn écrit — un cas concret chiffré, 150-200 mots, sans vidéo.
- 10 min : 3 appels sur les prospects à J+9 de la séquence.

**🟥 VENDREDI — 45 min — Piloter**
Mettre à jour `pipeline.csv`. Programmer les appels de la semaine suivante. **Une action de
recommandation** — intro, avis Google, ou témoignage écrit. **Une par semaine, sans exception**,
c'est le canal qui pèse 68,6 % du marché.

**Total : 4 h, dont ~50 minutes seulement d'interaction humaine directe.**

## Les volumes et ce qu'ils produisent

```
PAR MOIS : 120 prospects · ~480 emails · 12 appels · 20 prescripteurs · 8 posts

  → 10 à 14 réponses
  →  3 à 5  réponses positives
  →  2 à 4  appels de découverte
  →  1 à 2  propositions
  → 0,6 à 1,4 vente
```

**Le mois 1 produit peu, et c'est prévu** — 53 % des rendez-vous viennent de l'étape 3 des
séquences, donc de prospects contactés le mois précédent. **Abandonner au mois 1 annule tout.**

| | Mois 1 | Mois 2 | Mois 3 | Mois 4-6 |
|---|---|---|---|---|
| Total leads/mois | 1-2 | 2-3 | 3-5 | **5-8** |

## La qualification en 5 questions

| # | Question | Signal rouge |
|---|---|---|
| 1 | « Vos nouveaux clients, ils arrivent par où ? » | « Le bouche-à-oreille suffit » → **disqualifier** |
| 2 | **« Vous payez déjà quoi, tous les mois, pour attirer des clients ? »** | « Rien » → **disqualifier** |
| 3 | « Qu'est-ce qui vous a empêché de le faire jusqu'ici ? » | « J'ai un neveu qui devait le faire » → **disqualifier** |
| 4 | « Si on décidait aujourd'hui, ça démarrerait quand ? » | Pas de date → nurture, pas de devis |
| 5 | « Quelqu'un d'autre à impliquer dans la décision ? » | Associé absent → exiger sa présence au RDV 2 |

**La question n°2 change tout.** Pas « quel est votre budget ? » (personne ne répond), mais
**« qu'est-ce que vous payez déjà ? »**. Le restaurateur aurait répondu « 350 € à TheFork » — et
à cet instant, la conversation change de nature.

**Sur 10 appels, 6-7 doivent être disqualifiés en moins de 10 minutes.** Disqualifier n'est pas
un échec, c'est le livrable principal d'un appel de découverte.

## Le prix : quand et comment

**Annoncer tôt, et répéter.** Gong Labs, sur 11 331 opportunités : **les taux de gain sont les
plus élevés quand le prix est abordé dès le premier appel** (+10 %). Sur 25 537 conversations,
le prix devrait être mentionné **3 à 4 fois**. Le fuir jusqu'à la fin est ce qui crée le choc.
→ https://www.gong.io/blog/data-reveals-the-best-time-to-talk-price-and-budget

**Ne jamais présenter un seul prix** (Blair Enns) : présenter des options, en commençant par la
plus élevée.

**Face à « c'est trop cher », en 4 temps :**
1. **Silence 3 secondes**, puis reformuler en miroir : « Trop cher ? » *(silence)*. Dans une
   majorité de cas le prospect complète et révèle la vraie objection.
2. **Isoler** : « Mettons le prix de côté deux minutes. En dehors du tarif, est-ce que ça répond
   à votre problème ? » Si non → ce n'était pas un problème de prix.
3. **Question calibrée** (Voss) : « Je comprends. **Comment est-ce que je suis censée faire ça**
   à ce budget-là ? » — ça oblige le prospect à proposer lui-même la solution.
4. **Si concession, elle est conditionnelle et croisée** : « Je peux descendre à 1 200 € — dans
   ce cas vous fournissez les textes et les photos. Ou bien on garde tout à 1 800 € et vous payez
   en 3 fois. Lequel des deux ? »

**Données de renfort** : au-delà de 25-30 % de remise, le taux de gain **n'augmente plus**. Une
remise de 5 % détruit plus de marge qu'une hausse de 5 % n'en crée. Un cas documenté : **+22 % de
prix → taux de gain de 23 % à 31 % en 6 mois.**

## Le follow-up

**Le mythe à jeter** : « 80 % des ventes nécessitent 5 relances », attribué à la « National Sales
Executive Association » — **cette organisation n'a aucune existence traçable**. Ne pas culpabiliser
avec ce chiffre.

**Les vraies données** : 3-5 étapes optimales. **Au-delà de 4 emails, désinscriptions et plaintes
spam plus que triplées.** Téléphone : 3 tentatives, au 3e appel 93 % des conversations ont eu lieu.

```
J+0   E1  accroche spécifique          (matin, mar/mer/jeu)
J+3   E2  preuve : mini-cas chiffré     (même fil)
J+8   E3  angle différent + CTA oui/non
J+9       1 appel téléphonique          ← double le taux de réponse
J+16  E4  clôture de dossier
Puis archivage → réactivation à J+90 avec un contenu, pas une offre.
```

**L'email de clôture obtient souvent le meilleur taux de réponse de la séquence** — le « je ferme
votre dossier » lève l'ambiguïté et déclenche la réponse par aversion à la perte.

**Règle anti-lourdeur** : chaque relance **apporte quelque chose** (un chiffre, un cas, une
observation) et ne redemande jamais la même chose de la même façon.

## Les prescripteurs

Commission usuelle en France : **5-10 %** en secteur classique, 10-15 % avec réseau établi.
**Recommandation : 10 % du projet à l'encaissement + 10 % du récurrent pendant 12 mois.**

**Deux modèles — et lequel choisir** :

| | Apport d'affaires | **Sous-traitance marque blanche** |
|---|---|---|
| Sa marge | ~90 % | 60-75 % |
| Effort commercial | Faible | **Zéro** |
| Régularité | Aléatoire | **Récurrente** |

**En survie financière et quand on déteste vendre : commencer par la marque blanche.** Marge plus
faible, mais volume prévisible, zéro prospection, zéro négociation. **La marque blanche paie les
factures pendant que le direct se construit.**

Qui approcher, par rendement décroissant : **graphistes freelance** (ils reçoivent constamment
« et pour l'intégrer, vous connaissez quelqu'un ? ») → agences de com sans dev interne → agences
web débordées → imprimeurs → experts-comptables → photographes d'entreprise.

**L'erreur classique** : écrire « je cherche des clients, avez-vous des contacts ? ». C'est une
demande, personne n'y répond. **Ce qui marche : proposer une capacité de production disponible**,
avec un tarif partenaire affiché, un délai garanti et un engagement écrit de non-débauchage. Un
partenaire n'achète pas du talent, **il achète de la prévisibilité**.

Volume : 20 prescripteurs contactés → **2-3 partenariats actifs** → 1-2 leads/mois à partir du 3e
mois.

## Les délais honnêtes par canal

| Canal | Premiers leads | Effort/semaine |
|---|---|---|
| **Activer les clients existants** (avis, intro) | **1-3 semaines** | 30 min |
| Prescripteurs | 3-8 semaines | 1 h |
| Cold email ciblé | 2-6 semaines | 2 h |
| Fiche Google Business Profile (la sienne) | 4-8 semaines | 20 min |
| LinkedIn écrit | 4-10 semaines | 1 h |
| **SEO local organique** | **3-6 mois** | — |
| **Blog / SEO de fond** | **12-24 mois** pour un flux fiable | — |

⚠️ **En situation de survie, le SEO et le blog ne sont pas des canaux, ce sont des
investissements à 12 mois.** Ahrefs, sur 2 millions de pages : **95 % des nouvelles pages
n'atteignent jamais le top 10 en un an**, et les pages du top 10 ont en moyenne 950 jours. À
faire en second plan, 1 h/semaine max. **Toute personne qui vend « écris 3 articles par semaine,
les clients viendront » fait perdre un trimestre.**

## Les 3 seuils d'alerte du tableau de bord

- **Réponses < 5 % après 100 prospects** → le problème est le **ciblage**, pas le message.
  Changer de segment.
- **Réponses ≥ 8 % mais 0 appel** → le problème est le **CTA**, il demande trop.
- **Appels ≥ 4 mais 0 vente** → le problème est la **qualification** ou l'**offre**, jamais le
  prix.
