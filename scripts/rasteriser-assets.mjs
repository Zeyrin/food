// Les icônes et écrans de lancement partent des SVG de `assets/` :
// `@capacitor/assets` ne lit que du PNG, et la PWA veut ses deux tailles.
import sharp from 'sharp'
const fichiers = ['icon', 'icon-foreground', 'splash', 'splash-dark']
for (const nom of fichiers) {
  await sharp(`assets/${nom}.svg`).png().toFile(`assets/${nom}.png`)
}
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#385e16' } })
  .png()
  .toFile('assets/icon-background.png')
// Carré plein pour la PWA : Android découpe lui-même son masque.
for (const taille of [192, 512]) {
  await sharp('assets/icon.svg').resize(taille, taille).png().toFile(`public/icon-${taille}.png`)
}
console.log('assets/*.png et public/icon-*.png à jour')
