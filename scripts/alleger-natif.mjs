// Retire de `dist/` ce qui ne sert qu'au site avant `cap sync` : les
// visuels des réseaux sociaux (`public/social`, ~19 Mo) partaient dans
// l'APK et l'IPA sans jamais s'afficher dans l'app.
import { rmSync } from 'node:fs'

for (const dossier of ['dist/social']) {
  rmSync(dossier, { recursive: true, force: true })
  console.log(`natif : ${dossier} retiré`)
}
