# Transformer les apps perso en preuve commerciale

*La sensation de « candy product » vient de ce que ces apps ne servent qu'à elles-mêmes. Ce
document les remet au travail — sans avoir à les monétiser.*

## Le renversement

Tant que Coup de Tête et l'app Courses sont des « projets perso non monétisés », elles sont
une source de culpabilité. Requalifiées en **preuves de compétence vérifiables**, elles
deviennent l'actif commercial le plus solide du dossier — parce qu'elles répondent à la seule
question que se pose un prospect : *est-ce que cette personne sait livrer ?*

Un dev freelance sans référence a un problème de crédibilité. Une dev freelance avec trois
applications en ligne, fonctionnelles, utilisables tout de suite, n'en a pas. C'est déjà réglé,
il suffit de le présenter comme tel.

## Ce que chaque app prouve exactement

Le piège est de les présenter comme « des projets sympas ». Il faut nommer la **compétence
technique démontrée**, parce que c'est elle qui se facture.

### App Courses
- **PWA offline-first réelle** : fonctionne intégralement sans réseau (en magasin, en sous-sol),
  IndexedDB, service worker.
- **Synchronisation temps réel multi-appareils** avec stratégie de résolution de conflit
  assumée et documentée.
- **Gestion des cas limites de production** : abonnement realtime qui échoue silencieusement,
  collision de topic en StrictMode — des bugs que la plupart des devs découvrent en prod.
- **Tests unitaires** sur la logique métier non triviale.
- **Conception produit** : arbitrages documentés, y compris les décisions de *ne pas* faire.

→ Ce que ça vend : **application métier terrain**, là où le réseau est absent ou instable.

### Coup de Tête
- Produit grand public complet, expérience soignée, une idée exprimée clairement.
→ Ce que ça vend : **capacité à concevoir une expérience utilisateur finie**, pas juste à
  exécuter une spec.

### L'app « quoi faire cet aprem »
- Rapidité d'exécution, produit minimal qui fonctionne.
→ Ce que ça vend : **capacité à livrer vite un périmètre restreint**.

## La phrase de positionnement

À tester, à ajuster, mais l'idée est là :

> « Je conçois et développe des applications web qui fonctionnent **même sans réseau**, et qui
> se synchronisent dès que la connexion revient. »

C'est spécifique, c'est rare, ça élimine immédiatement la comparaison avec les 15 000
personnes qui « font des sites », et c'est **prouvable en 30 secondes** : on ouvre l'app
Courses, on coupe le wifi, ça continue de marcher. Aucun concurrent low-cost ne peut faire
cette démo.

## La règle du « prouvable en 30 secondes »

Un prospect ne lit pas un portfolio. Il regarde une démo.

**À préparer une fois, réutilisable à l'infini :**
1. Les trois apps en ligne, avec une URL propre, accessibles depuis le téléphone.
2. Pour l'app Courses : la démo « mode avion ». On coupe la connexion, on continue à cocher,
   on rallume, tout remonte. C'est spectaculaire et ça se comprend sans être technique.
3. Un one-pager par app : le problème, la décision de conception la plus intéressante, le
   résultat. Pas de jargon.

**Ce que ça remplace** : le CV, les références clients que tu n'as pas encore, et surtout
l'obligation de développer du sur-mesure spéculatif avant signature (l'erreur commise avec le
restaurant).

## L'écrit comme canal, puisque la vidéo est exclue

La tentative TikTok a échoué non par manque de talent mais par **inadéquation au format** :
faire des vidéos quand on n'aime pas ça produit du contenu tiède, et pas assez souvent. Il
faut arrêter d'essayer de gagner à un jeu qu'on déteste.

Or le README du repo `food` est déjà, quasiment tel quel, un excellent article technique. Le
passage sur l'absence de gestion de stock — « un inventaire du placard suppose de déclarer
chaque consommation, ce que personne ne tient ; à la place, quinze secondes devant le frigo
ouvert » — est exactement le type de raisonnement produit qui donne envie d'embaucher
quelqu'un.

**Le contenu existe déjà. Il est écrit. Il suffit de le publier.**

Sujets directement extractibles du travail déjà fait, sans effort de création :
- Pourquoi une app de courses doit fonctionner sans réseau (et ce que ça change dans
  l'architecture).
- Last-writer-wins : quand la stratégie de synchro la plus bête est la bonne.
- Les abonnements temps réel qui échouent en silence — le bug qu'on ne voit qu'en production.
- Concevoir en enlevant : les fonctionnalités qu'on choisit de ne pas construire.

**Où publier** : là où se trouvent les prescripteurs et les clients techniques, pas là où se
trouve le divertissement. Un article technique bien écrit a une durée de vie de plusieurs
années et travaille pendant qu'on dort ; une vidéo TikTok meurt en 48 h.

**Fréquence tenable** : un article par mois vaut mieux qu'un rythme intenable abandonné au
bout de trois semaines. La régularité bat le volume.

## La règle anti-« candy product »

Le problème n'est pas de créer — c'est que créer une nouvelle app est la façon socialement
acceptable de procrastiner la vente de la précédente. Construire est confortable ; distribuer
est la partie où l'on se fait juger.

**La règle** : aucun nouveau projet tant que l'objectif commercial du mois n'est pas atteint.
Le temps de création n'est pas supprimé, il est **mis en cage** : une journée par semaine
maximum, sur **un seul** produit existant, et cette journée se **gagne** en ayant fait la
prospection de la semaine.

Ce n'est pas une punition. C'est ce qui transforme le plaisir de coder en récompense au lieu
d'en fuite.
