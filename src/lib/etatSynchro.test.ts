import assert from 'node:assert/strict'
import {
  lireCauseSynchro,
  lireEtatSynchro,
  lireMotifSynchro,
  signalerSynchroOk,
  signalerSynchroRefusee,
} from './etatSynchro'

/**
 * L'état est un singleton de module : ce fichier le fait donc traverser
 * une seule suite ordonnée, plutôt que d'exporter une remise à zéro qui
 * n'existerait que pour les tests.
 *
 * Ce qui est vérifié n'est pas l'affichage mais l'arbitrage entre pannes
 * concurrentes — et il se trompait dans les deux sens : une écriture qui
 * passe effaçait un temps réel muet, et un temps réel muet au démarrage
 * masquait une écriture refusée ensuite. Dans les deux cas, l'écran des
 * réglages finissait par mentir sur ce qu'il fallait aller corriger.
 */

const etat = () => [lireEtatSynchro(), lireCauseSynchro()]

// Rien ne s'est encore produit.
assert.deepEqual(etat(), ['inconnu', null])

// Un canal muet est un refus, et le motif brut est conservé tel quel :
// c'est la seule piste pour les cas que l'écran ne prévoit pas.
signalerSynchroRefusee('tempsReel', 'Realtime « liste » : CHANNEL_ERROR')
assert.deepEqual(etat(), ['refuse', 'tempsReel'])
assert.equal(lireMotifSynchro(), 'Realtime « liste » : CHANNEL_ERROR')

// Une écriture qui passe ne répare pas le temps réel : REST et WebSocket
// sont deux chemins distincts. Sans ça, le diagnostic disparaissait au
// premier produit coché.
signalerSynchroOk()
assert.deepEqual(etat(), ['refuse', 'tempsReel'])

// Plus grave l'emporte : les canaux s'abonnent au montage, bien avant la
// première écriture, et le temps réel masquerait sinon le vrai problème.
signalerSynchroRefusee('ecriture', 'new row violates row-level security policy')
assert.deepEqual(etat(), ['refuse', 'ecriture'])
assert.equal(lireMotifSynchro(), 'new row violates row-level security policy')

// Moins grave ne l'emporte pas, et ne réécrit pas le motif.
signalerSynchroRefusee('tempsReel', 'Realtime « recettes » : TIMED_OUT')
assert.deepEqual(etat(), ['refuse', 'ecriture'])
assert.equal(lireMotifSynchro(), 'new row violates row-level security policy')

// Là, l'écriture est bien ce qui avait échoué : elle se rattrape.
signalerSynchroOk()
assert.deepEqual(etat(), ['ok', null])
assert.equal(lireMotifSynchro(), null)

// Une session refusée empêche tout, y compris de lire.
signalerSynchroRefusee('session', 'Anonymous sign-ins are disabled')
assert.deepEqual(etat(), ['refuse', 'session'])

// Et rien en dessous ne la remplace — l'accès au foyer échouera forcément
// aussi, mais c'est la session qu'il faut aller réparer.
signalerSynchroRefusee('acces', 'Accès au foyer refusé')
assert.deepEqual(etat(), ['refuse', 'session'])
