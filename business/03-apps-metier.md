# Apps métier terrain — l'hypothèse, corrigée

*J'avais formulé l'hypothèse « ton skill rare, c'est l'offline-first, vends ça ». La recherche
la valide à 70 % — mais pas pour la raison que j'avançais. Deux corrections importantes.*

## ✅ Ce qui est vrai

**Le panier moyen est 10 à 30× supérieur au site vitrine.**

| | Site vitrine | App métier terrain |
|---|---|---|
| Panier | 500-3 000 € | **10 000-30 000 €** (médiane projet logiciel : 30 000 €) |
| TJM effectif | 300-500 € | **600-800 €** |
| Récurrent | 100-300 €/an | **15-20 % du coût initial/an** = 3 000-6 000 €/an |
| Cycle de vente | 1-4 semaines | **3-6 mois** |
| Concurrence | Écrasante (Wix, IA, offres à 590 €) | Modérée |
| Financement public | **Non éligible** | **Oui, 30-50 % selon région** |

Le gap existe réellement : SaaS générique à 15-70 €/utilisateur/mois d'un côté, ESN à **55 000 €
de budget médian** de l'autre, et un espace de 10 000 à 35 000 € au milieu où ni l'un ni l'autre
ne va bien.
→ https://www.aktislab.fr/articles/combien-coute-logiciel-metier-sur-mesure · https://www.lafabriquedunet.fr/agences/pages/agences-developpement-logiciel/tarifs

**Signal institutionnel fort** : le dispositif *Pays de la Loire Investissement Numérique*
finance **30 % (40 % si éco-conçu), plafond 15 000 €**, les « applications métier
personnalisées » — et **exclut explicitement le site vitrine simple**. L'État subventionne
exactement ce vers quoi il faut aller et refuse de financer ce que tu vends aujourd'hui.
→ https://www.paysdelaloire.fr/les-aides/pays-de-la-loire-investissement-numerique

## ❌ Correction 1 — « offline-first » n'est PAS un argument de vente

**Tous les leaders du marché font déjà de l'offline et le revendiquent en une.** Praxedo publie
un guide technique « Offline First » revendiquant une durée hors-ligne illimitée. Kizeo
documente sa file de synchro locale. Daxium, Coredinate, NOMAD8 aussi.
→ https://www.praxedo.fr/notre-blog-specialise/mode-hors-ligne-gestion-interventions-zone-blanche/ · https://support.kizeo.com/docs/mode-hors-ligne-kizeo-forms

**Un dirigeant de PME ne saura jamais distinguer un bon d'un mauvais offline en démo de 30
minutes.** Vendre sur la technique, c'est perdre face à Kizeo à 15 €/mois.

Ce qui se vend réellement, d'après les frustrations remontées par les utilisateurs de ces
outils : **le processus métier spécifique, la propriété des données, l'intégration au SI
existant**. Les reproches faits à Kizeo ne portent jamais sur l'offline — ils portent sur la
rigidité du modèle de données, les formules de calcul limitées, les graphiques sommaires,
l'absence de niveaux d'administration intermédiaires. **C'est exactement là que le sur-mesure
gagne.**

**Ne jamais vendre « une app offline ». Vendre un problème métier chiffré résolu** : « vos 18
techniciens ressaisissent 45 minutes par jour, ça vous coûte X € par an ».

## ❌ Correction 2 — le seuil de rentabilité est à 15-20 utilisateurs

Le sur-mesure ne bat le SaaS qu'**au-delà de 15-20 utilisateurs terrain**.

- **PME de 12 techniciens sur Kizeo** : 25 € × 12 × 12 = 3 600 €/an. Un sur-mesure à 25 000 €
  **ne sera jamais rentabilisé**.
- **PME de 20 techniciens sur Praxedo** : 69 € × 20 × 12 = 16 560 €/an. Sur-mesure à 30 000 € →
  **retour sur investissement à ~2,6 ans**, puis 11 500 €/an d'économie.

Et le contexte budgétaire est brutal : **près de la moitié des TPE/PME investissent moins de
1 000 €/an dans le numérique** (Baromètre France Num 2025, 11 021 répondants). La cible n'est
pas « la PME française », c'est **son décile supérieur** : 20-50 salariés dont 15+ sur le
terrain.

## 🔴 Alerte technique : la PWA pure perd des données sur iPhone

**iOS purge le stockage script-writable — service worker cache ET IndexedDB — après ~7 jours
d'inactivité.** Cap de 50 Mo, historique d'instabilité et de corruption d'IndexedDB sur iOS.
L'API Persistent Storage existe depuis Safari 17 mais **exige la permission de notification**.
→ https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide · https://developer.apple.com/forums/thread/710157

Sur une app professionnelle contenant des heures de travail non synchronisées, **c'est un risque
de perte de données inacceptable**. Correctif obligatoire : **PWA + wrapper Capacitor** — un
seul code base, stockage natif fiable, distribution App Store/MDM. Bonus commercial : les PME
veulent une icône sur le téléphone et un déploiement de flotte, pas un favori Safari.
→ https://capacitorjs.com/docs/web/progressive-web-apps

*(À vérifier aussi sur l'app Courses : en usage réel, une semaine sans ouvrir l'app sur iPhone
peut vider IndexedDB.)*

## Le meilleur canal : vendre VIA les intégrateurs ERP

C'est le segment n°1 parce qu'il **résout le problème n°1 — l'absence de réseau commercial — en
s'appuyant sur celui de quelqu'un d'autre.**

Les intégrateurs Odoo, Divalto, EBP, Sage et les petites ESN régionales ont le client, la
confiance et le contrat de maintenance… et **quasiment jamais la compétence PWA offline-first +
résolution de conflits**. Ils sous-traitent, ou ils disent non.

- Panier : 12 000-35 000 € par projet (10 000-28 000 € nets après marge intégrateur)
- **1 partenaire signé = 3 à 8 projets/an**, cycle porté par le partenaire (2 mois au lieu de 6)
- TMA facturée à l'intégrateur, pas au client final → **payeur solide**

**Pitch (à l'intégrateur, pas au client final)** :
> « Vos clients ont votre ERP au bureau et du papier sur le terrain. Je livre la brique mobile
> qui manque : saisie 100 % hors réseau, synchro automatique au retour du signal, gestion des
> conflits d'édition simultanée, et une API qui se branche sur votre modèle de données. Vous
> gardez la relation client et vous facturez la brique. Je suis votre équipe mobile, sans avoir
> à la recruter. »

**Premier pas** : lister sur l'annuaire officiel des partenaires Odoo France les **20
intégrateurs de 5 à 30 personnes dans un rayon de 200 km**, en retenir 8 avec des références
BTP/logistique/maintenance. Leur envoyer **une démo vidéo de 90 secondes** : on remplit un
formulaire en mode avion, on tue le réseau, on force-quit l'app, on relance, tout est là, on
rallume, ça remonte — **et on montre le cas où deux personnes ont modifié la même fiche et
comment le conflit est résolu**. Cette dernière séquence est ce que personne ne sait montrer.

## Les deux autres segments viables

**🥈 Cabinets d'expertise et de contrôle** (diagnostic immobilier, expertise sinistre, bureaux
de contrôle, SPANC). Le logiciel n'est pas un coût de structure, **c'est l'outil de production**
— le rapport EST le livrable facturé. Ils paient déjà 80-250 €/mois. Le dirigeant décide seul,
les annuaires sont publics, et les **évolutions réglementaires permanentes** (DPE, amiante,
plomb, RE2020) créent une TMA structurelle. Panier 15 000-40 000 €.
→ Ne pas attaquer le cœur (Liciel, ORIS sont installés), attaquer la périphérie non couverte.

**🥉 Maintenance technique réglementée multi-sites** (CVC, assainissement, ascenseurs). C'est là
que l'incumbent est le plus cher (Praxedo 49-120 €/u/mois) et que le seuil des 15-20 utilisateurs
est réellement atteint. Adjuvant : la **traçabilité du temps de travail** (art. L3171-2 — en
l'absence de relevé fiable, les heures déclarées par le salarié sont présumées exactes aux
prud'hommes). Un dirigeant qui a perdu un litige achète tout de suite. Panier 25 000-60 000 €.

## ⚠️ Le vent contraire, et comment le retourner

**La facturation électronique capte le budget numérique ET l'attention des dirigeants de PME
pendant 18 mois** (réception au 1er septembre 2026, émission TPE/PME au 1er septembre 2027).
C'est un mur en travers du chemin de toute vente d'app métier.

**Deux options : l'attendre, ou s'y adosser.** La seconde est évidemment la bonne — c'est tout
l'objet de `08-facturation-electronique.md`. « Votre app terrain alimentera directement votre
flux de facturation électronique » est un argument, pas une concession.

## Verdict

**Y aller, mais par étapes, sans abandonner l'activité actuelle du jour au lendemain.** Il faut
**4 à 6 mois entre le premier contact et la signature** d'un contrat à 20-30 k€, et **15-20
conversations qualifiées par signature** tant qu'il n'y a ni référence ni prescripteur. C'est un
problème de trésorerie et de constance, pas de code.

Règles :
- **Prix plancher : 12 000 €.** En dessous, la marge ne couvre pas le cycle de vente.
- **Toujours vendre le premier pas en audit payant (1 200-1 800 €)** : ça filtre les curieux, ça
  se transforme en cahier des charges, et ça rend crédible le devis à 25 000 €.
- **Se référencer Activateur France Num** (gratuit, flux entrant qualifié) et maîtriser le
  dispositif de sa région — savoir monter un dossier de subvention est un différenciateur que ni
  Kizeo ni une ESN n'offrent.
- **Après 2-3 clients du même métier : produitiser.** Le 4e client du même vertical, c'est 70 %
  de marge.
