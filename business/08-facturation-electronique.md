# L'opportunité à 5 semaines : la facturation électronique

*Recherche du 28 juillet 2026. C'est la piste la plus urgente et la plus rentable du dossier.*

## Le fait

**Au 1er septembre 2026 — dans environ cinq semaines — TOUTES les entreprises françaises
assujetties à la TVA doivent être capables de RECEVOIR des factures électroniques.** Sans
exception de taille : micro-entreprises et auto-entrepreneurs en franchise en base inclus.

Le calendrier :

| Échéance | Qui | Quoi |
|---|---|---|
| **1er septembre 2026** | **Toutes les entreprises** | **Réception obligatoire** |
| 1er septembre 2026 | Grandes entreprises et ETI | Émission obligatoire |
| 1er septembre 2027 | PME, TPE, micro-entreprises | Émission obligatoire |

Concrètement, une facture électronique doit être un **document structuré** (Factur-X, UBL ou
CII) transmis via une **Plateforme Agréée** immatriculée par la DGFiP. Depuis l'abandon du
Portail Public de Facturation, le passage par une PA est obligatoire — plus de 100 figurent sur
la liste officielle d'impots.gouv.fr. Sanction : **15 € par facture non conforme, plafonnée à
15 000 €/an**.

Sources : [Pennylane — calendrier officiel](https://www.pennylane.com/fr/fiches-pratiques/facture-electronique/facturation-electronique-dates-cles-et-calendrier) ·
[Comparateur e-Facturation](https://comparateur-efacturation.fr/blog/calendrier-obligation-facturation-electronique-2026-2027) ·
[Socic — checklist TPE/PME](https://www.socic.fr/ressources-comptabilite/articles/facturation-electronique-obligatoire-2026-2027-calendrier-plateformes-agreees-e-reporting-et-checklist-tpe-pme)

## Pourquoi c'est LA bonne cible

### 1. Le marché est massivement en retard

- **82 % des entrepreneurs ne sont pas encore équipés** d'un outil de facturation
  électronique (OpinionWay pour Qonto, **mars 2026** — donnée récente).
  → https://www.compta-online.com/reforme-de-la-facturation-electronique-ao8552
- **38 % des entreprises n'ont toujours pas défini de plan d'action**, seules **35 % ont choisi
  leur plateforme agréée**, et **42 % déclarent n'en connaître aucune** (baromètre OpinionWay
  pour l'Ordre des experts-comptables).
  → https://www.legifiscal.fr/actualites-fiscales/4560-facturation-electronique-38-entreprises-ne-sont-pretes.html
- Secteurs les plus en retard : **juridique (10 % de préparation)** et **éducation (19 %)**.
  → https://www.daf-mag.fr/bi-1244/transformation-processus-2133/facturation-electronique-pourquoi-38-des-entreprises-ne-sont-pas-encore-pretes-25650

### 2. C'est une obligation légale, pas une opportunité

C'est la différence décisive avec tout le reste du dossier. Un restaurateur peut reporter
l'achat d'un site web au trimestre prochain, indéfiniment. **Une obligation légale avec
sanction et date couperet ne se reporte pas.** Le budget n'est pas arbitrable, et l'objection
« ce n'est pas le moment » disparaît mécaniquement.

Rappel de la hiérarchie des moteurs d'achat (`07-regles-de-vente.md`) : obligation légale >
risque à écarter > gain à obtenir. Ici on est au sommet.

### 3. L'urgence travaille pour toi

Cinq semaines. Le cycle de vente s'effondre : plus de « je vais réfléchir », plus de trois
relances espacées d'un mois. C'est exactement l'inverse du démarchage restaurant, où
l'indifférence était l'état par défaut.

Et l'urgence continue après septembre : les TPE/PME ont l'échéance **émission** au 1er
septembre 2027, donc la panique se rejoue sur douze mois. Ce n'est pas un one-shot.

## Ce qu'il y a réellement à vendre

⚠️ **Honnêteté nécessaire** : pour une TPE simple, se mettre en conformité = choisir une
plateforme agréée et s'y inscrire. Ce n'est pas du développement. Vendre « je vous développe
votre facturation électronique » serait au mieux inutile, au pire malhonnête.

Ce qui se vend réellement, par ordre de valeur :

**A. L'intégration technique (le vrai gisement de dev).**
Toute entreprise qui a un système qui produit des factures — e-commerce, ERP, logiciel métier,
outil interne, SaaS maison — doit le **connecter à une plateforme agréée** : génération du
format structuré (Factur-X/UBL/CII), transmission par API, gestion des statuts et des rejets,
archivage. C'est du travail de développeur, facturable au TJM, et personne ne peut le faire à
29 €/mois.

**B. L'accompagnement au choix et au paramétrage.**
Plus de 100 plateformes agréées, et 42 % des dirigeants n'en connaissent aucune. Le service
consiste à choisir, paramétrer, migrer les données, tester, former. C'est du conseil, ça se
facture à la journée ou au forfait, et l'expertise nécessaire s'acquiert en quelques jours de
lecture.

**C. La remise à plat du process de facturation.**
Beaucoup de TPE facturent sous Word ou Excel. L'obligation force la migration vers un outil.
C'est une porte d'entrée vers une relation durable et vers d'autres chantiers.

## Précision de ciblage : qui NE PAS démarcher

Vérification faite sur l'écosystème technique, et c'est un garde-fou important.

**Ne pas cibler les micro-entreprises et les indépendants seuls.** Pour eux, des plateformes
agréées comme Tiime sont **gratuites, sans engagement et opérationnelles en cinq minutes**. Il
n'y a aucune valeur à vendre, et prétendre le contraire détruirait la crédibilité. C'est le
même piège que le site vitrine à 29 €/mois chez les restaurants.

**Cibler les entreprises qui ont déjà un système qui produit des factures** : e-commerce, ERP,
logiciel métier, outil interne développé sur mesure, SaaS maison, cabinet avec un outil
spécifique. Là, la mise en conformité suppose un vrai travail : **API REST avec OAuth2, mapping
des pièces commerciales sur les schémas Factur-X, gestion des statuts de retour et des rejets,
middleware, archivage**. C'est du développement, ça se facture au TJM, et aucune plateforme à
bas prix ne le fait à leur place.

Sources : [Plateforme Agréée — PA avec API développeur](https://plateforme-agree.org/par-fonctionnalite/api-developpeur/) ·
[B2Brouter — API facturation électronique](https://www.b2brouter.net/fr/api-facturation-electronique/) ·
[Guide développeurs API 2026](https://compafacturation.com/api-facturation-electronique)

**Le critère de qualification en une question** : *« Aujourd'hui, vos factures sortent d'où ? »*
Si la réponse est « de Word ou d'un tableur », le client vaut une heure de conseil et une
recommandation d'outil gratuit — pas une mission. Si la réponse est « de notre logiciel / notre
site / notre ERP », c'est un prospect réel.

## Le canal d'acquisition qui change tout : les experts-comptables

C'est le point le plus important de ce document.

Un expert-comptable a **cent à trois cents clients TPE/PME** qui vont tous l'appeler avant le
1er septembre. Il n'a ni le temps ni, souvent, les compétences techniques pour gérer les
intégrations. Il est en train de vivre le pire trimestre de sa carrière.

**Un seul partenariat avec un cabinet remplace des mois de démarchage individuel.** C'est
exactement l'inverse du porte-à-porte chez les restaurants : au lieu de convaincre un prospect
indifférent à la fois, on convainc un prescripteur qui apporte un flux.

Le pitch au cabinet n'est pas commercial, il est utilitaire :

> « Vous avez des clients qui doivent être prêts au 1er septembre et dont le logiciel de
> facturation ne parle pas encore à une plateforme agréée. Je fais la partie technique :
> intégration, tests, migration. Vous gardez la relation client et le conseil comptable, je
> ne suis que votre exécutant technique. »

Ça ne menace pas son fonds de commerce, ça le soulage. C'est le seul angle qui fonctionne
avec un prescripteur.

**Autres prescripteurs de la même logique** : associations de gestion agréées, éditeurs de
logiciels métier dépassés par la demande d'intégration, CCI et chambres de métiers, réseaux
d'entrepreneurs, agences web qui ont des clients e-commerce à mettre en conformité.

## Le plan des cinq prochaines semaines

**Semaine 1 — Se rendre compétente.** Lire la documentation officielle, la liste des
plateformes agréées d'impots.gouv.fr, la spécification Factur-X. Choisir deux ou trois
plateformes et **tester réellement leurs API** en créant un compte d'essai. Objectif : pouvoir
répondre à une question technique sans hésiter. Ce n'est pas un mois de travail, c'est
quelques jours — et ça vaut infiniment plus que le temps passé sur un module de réservation
pour restaurant.

**Semaine 1 aussi — Se mettre soi-même en conformité.** Obligation qui la concerne
directement, et qui devient la meilleure démo : *« je l'ai fait pour moi, voilà comment. »*

**Semaines 2 à 5 — Contacter les cabinets comptables.** Pas les entreprises finales : les
cabinets. Dix à quinze cabinets de la région, par email puis par téléphone. Un cabinet qui dit
oui vaut cinquante restaurants démarchés.

**En parallèle — Écrire.** Un article : « Facturation électronique au 1er septembre : ce qu'une
TPE doit faire, concrètement ». Le sujet est ultra-recherché, l'échéance est imminente, et la
plupart du contenu existant est du SEO creux d'éditeurs. Un article honnête et technique se
référence vite et qualifie les prospects avant même le premier échange. C'est le canal écrit
qui convient au tempérament, plutôt que la vidéo.

## Le levier « aides publiques » (à vérifier selon la région)

Argument de vente puissant : une partie de la dépense peut être subventionnée, ce qui neutralise
l'objection prix. Les **chèques numériques régionaux** vont de **500 à 5 000 €** selon la
région, et sont cumulables avec les dispositifs nationaux (Île-de-France PM'up jusqu'à 5 000 €,
Nouvelle-Aquitaine Num'Aquitaine 2 000 €, Auvergne-Rhône-Alpes Atouts Numériques jusqu'à
16 000 € couvrant 50 % des dépenses). Plafond de cumul : 300 000 € sur 3 ans (règle *de
minimis*).

⚠️ **Le Chèque France Num de 500 € est fermé depuis octobre 2025**, et France Num n'est pas un
guichet de financement mais une plateforme de ressources et un annuaire d'experts. Les aides
réellement mobilisables sont **régionales** : à vérifier auprès de la région et de la CCI
locale avant de l'annoncer à un prospect. Des dispositifs spécifiquement fléchés facturation
électronique existent également.

Sources : [Subventions Facile](https://www.subventions-facile.fr/blog/digitalisation-pme-tpe-aides-guide) ·
[Comparatif Facture Électronique — aides 2026](https://www.comparatif-facture-electronique.fr/aides-subventions-facturation-electronique-2026/)

**Action** : se référencer comme prestataire dans l'annuaire France Num. C'est gratuit, et
c'est un canal d'inbound qualifié.

## Ce qui pourrait mal tourner

- ~~**Report de la réforme.**~~ **Risque écarté, vérifié.** Le calendrier a glissé par le passé
  (d'où la méfiance légitime), mais **il n'y aura pas de nouveau report**. Un amendement
  parlementaire demandant un délai supplémentaire a été **rejeté par l'Assemblée nationale**, et
  le **Directeur général des Finances publiques a confirmé au plus haut niveau l'absence de
  report** lors de la plénière de clôture de la Journée de la Facture Électronique du 6 mai
  2026 (FNFE-MPE). La DGFiP a depuis publié un guide de démarrage pratique confirmant le
  maintien du calendrier.
  → https://www.compta-online.com/facturation-electronique-ao5562

  C'est important commercialement : beaucoup de dirigeants **parient encore sur un report** pour
  justifier leur inaction. Pouvoir citer la confirmation officielle de la DGFiP est un argument
  qui débloque la décision.
- **Le marché s'équipe tout seul.** Les plateformes agréées vendent en direct, souvent à bas
  prix. → C'est pourquoi il faut vendre **l'intégration et l'accompagnement**, pas la
  plateforme.
- **La fenêtre se referme.** Après septembre 2026, la panique « réception » retombe. Mais
  l'échéance « émission » de septembre 2027 prend le relais, et les intégrations ratées ou
  bâclées de septembre 2026 deviendront du travail de reprise.
- **Compétence à acquérir vite.** Il faut être crédible techniquement en quelques jours. C'est
  le principal risque d'exécution — mais lire une spec et tester trois API est très exactement
  dans ses cordes.

## Comparaison avec les autres pistes du dossier

| Critère | Restaurants | Facturation électronique |
|---|---|---|
| Moteur d'achat | Gain hypothétique | **Obligation légale** |
| Urgence | Aucune | **5 semaines** |
| Cycle de vente | Long, indifférence | **Court, panique** |
| Concurrence | Consolidée, 29 €/mois | Cabinets débordés |
| Canal | Porte-à-porte, 1 à 1 | **Prescripteurs, 1 à N** |
| Facturable | Forfait écrasé | **TJM** |
| Verdict | Abandonner | **Prioritaire** |
