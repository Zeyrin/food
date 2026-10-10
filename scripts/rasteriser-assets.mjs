// Les icônes et écrans de lancement des stores partent des SVG de
// `assets/` : `@capacitor/assets` ne lit que du PNG, on les rastérise ici.
import sharp from 'sharp'
const fichiers = ['icon', 'icon-foreground', 'splash', 'splash-dark']
for (const nom of fichiers) {
  await sharp(`assets/${nom}.svg`).png().toFile(`assets/${nom}.png`)
}
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#1b3a2f' } })
  .png()
  .toFile('assets/icon-background.png')
console.log('assets/*.png à jour')
