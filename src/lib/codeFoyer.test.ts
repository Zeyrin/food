import assert from 'node:assert/strict'
import { analyserSaisieFoyer } from './codeFoyer'

const UUID = '9f2b7c1a-4d3e-4b8f-9a10-5c6d7e8f9a0b'

// Le cas nominal : six caractères tapés à la main.
assert.deepEqual(analyserSaisieFoyer('A3F9K2'), { type: 'code', code: 'A3F9K2' })

// Un code ne voyage pas propre. Minuscules d'un clavier de téléphone,
// espaces d'un copier-coller maladroit, tiret ajouté par celui qui l'a
// recopié : rien de tout ça n'est une faute de saisie.
assert.deepEqual(analyserSaisieFoyer('a3f9k2'), { type: 'code', code: 'A3F9K2' })
assert.deepEqual(analyserSaisieFoyer('  A3F9K2  '), { type: 'code', code: 'A3F9K2' })
assert.deepEqual(analyserSaisieFoyer('A3F 9K2'), { type: 'code', code: 'A3F9K2' })
assert.deepEqual(analyserSaisieFoyer('A3F-9K2'), { type: 'code', code: 'A3F9K2' })

// En cours de frappe, il n'y a rien à signaler.
assert.deepEqual(analyserSaisieFoyer(''), { type: 'partiel', code: '' })
assert.deepEqual(analyserSaisieFoyer('A3F'), { type: 'partiel', code: 'A3F' })

// Au-delà de six, on garde les six premiers plutôt que de refuser : c'est
// ce que produit un collage qui traîne un caractère de trop.
assert.deepEqual(analyserSaisieFoyer('A3F9K2X'), { type: 'code', code: 'A3F9K2' })

// Le lien de partage porte l'UUID dans son fragment. Le coller doit
// marcher : c'est ce qu'on reçoit dans une conversation, et le code n'y
// est nulle part.
assert.deepEqual(analyserSaisieFoyer(`https://fffood.app/#/f/${UUID}`), { type: 'lien', foyer: UUID })
assert.deepEqual(analyserSaisieFoyer(`#/f/${UUID}`), { type: 'lien', foyer: UUID })
// Y compris entouré du texte d'un message.
assert.deepEqual(analyserSaisieFoyer(`Rejoins-moi : https://fffood.app/#/f/${UUID} !`), {
  type: 'lien',
  foyer: UUID,
})
// Postgres écrit l'UUID en minuscules, mais un lien recopié peut avoir
// été mis en forme : on normalise plutôt que de rater le foyer.
assert.deepEqual(analyserSaisieFoyer(`#/f/${UUID.toUpperCase()}`), { type: 'lien', foyer: UUID })

// L'UUID est cherché avant tout découpage : sans ça, ses premiers
// caractères alphanumériques partiraient comme un code court.
assert.equal(analyserSaisieFoyer(`https://fffood.app/#/f/${UUID}`).type, 'lien')

// Un lien sans foyer dedans ne devient pas un code par découpage :
// « https://fffood… » donnerait « HTTPSF », six caractères d'apparence
// valide, et un « code introuvable » qui n'apprend rien.
assert.deepEqual(analyserSaisieFoyer('https://fffood.app/'), { type: 'lienSansFoyer' })
assert.deepEqual(analyserSaisieFoyer('www.fffood.app'), { type: 'lienSansFoyer' })
assert.deepEqual(analyserSaisieFoyer('#/r/dahl-lentilles-corail'), { type: 'lienSansFoyer' })

// Un UUID tronqué n'en est pas un, et ne doit pas déclencher un appel
// réseau qui échouera côté base.
assert.deepEqual(analyserSaisieFoyer('#/f/9f2b7c1a-4d3e-4b8f-9a10'), { type: 'lienSansFoyer' })
