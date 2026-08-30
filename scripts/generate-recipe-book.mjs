// Génère recipe-book.html à la racine : une page autonome (aucun serveur, aucun
// fetch — tout est intégré au fichier) pour parcourir les 137 recettes, voir
// leur photo, éditer les textes, et préparer les photos manquantes/remplacées
// au format attendu (800×600 webp). Double-clic pour l'ouvrir, ça marche
// toujours, même hors ligne. Ne fait pas partie du build.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const recipesFr = JSON.parse(fs.readFileSync(path.join(root, 'src/data/recipes.json'), 'utf8'))
const recipesEnObj = JSON.parse(fs.readFileSync(path.join(root, 'src/data/recipes.en.json'), 'utf8'))
const imagesDisponibles = new Set(
  fs.readdirSync(path.join(root, 'public/plats')).map((f) => f.replace(/\.webp$/, '')),
)

function toDataUri(id) {
  const p = path.join(root, 'public/plats', `${id}.webp`)
  if (!fs.existsSync(p)) return null
  return 'data:image/webp;base64,' + fs.readFileSync(p).toString('base64')
}

const data = recipesFr.map((r) => ({
  ...r,
  _aPhoto: imagesDisponibles.has(r.id),
  _en: recipesEnObj[r.id] ?? null,
}))

const withPhoto = data.filter((r) => r._aPhoto).length

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Recueil de recettes — FFFood</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #f6f5f2; color: #1c1a17; }
  header { position: sticky; top: 0; z-index: 10; background: #1c1a17; color: #fff; padding: 14px 20px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  header h1 { font-size: 16px; margin: 0; font-weight: 600; }
  header .stat { font-size: 13px; opacity: .85; }
  header input[type="search"] { flex: 1; min-width: 180px; padding: 7px 10px; border-radius: 6px; border: none; font-size: 14px; }
  header label { font-size: 13px; display: flex; align-items: center; gap: 5px; cursor: pointer; }
  header button { background: #4a7c59; color: #fff; border: none; border-radius: 6px; padding: 8px 14px; font-size: 13px; cursor: pointer; font-weight: 600; }
  header button:hover { background: #3d6749; }
  main { max-width: 1200px; margin: 0 auto; padding: 16px; }
  .notice { background: #fef3d0; border: 1px solid #d9c07a; border-radius: 8px; padding: 10px 14px; font-size: 12.5px; margin-bottom: 14px; line-height: 1.5; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
  .card { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.12); display: flex; flex-direction: column; }
  .card.missing-img { outline: 2px solid #d98c3a; }
  .card.dirty { outline: 2px solid #4a7c59; }
  .thumb { aspect-ratio: 4/3; background: linear-gradient(135deg,#dcd3c4,#b8ab92); display: flex; align-items: center; justify-content: center; color: #6b5f4d; font-size: 12px; text-align: center; padding: 8px; position: relative; cursor: pointer; }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .thumb input[type=file] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .thumb .drop-hint { position: absolute; inset: 0; background: rgba(0,0,0,.45); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; opacity: 0; transition: opacity .15s; pointer-events: none; text-align:center; padding: 8px; }
  .thumb:hover .drop-hint { opacity: 1; }
  .badge { position: absolute; top: 6px; left: 6px; font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 999px; text-transform: uppercase; letter-spacing: .03em; z-index: 2; }
  .badge.ok { background: #4a7c59; color: #fff; }
  .badge.no { background: #d98c3a; color: #fff; }
  .badge.new { background: #2c6e91; color: #fff; }
  .dl-btn { position: absolute; bottom: 6px; right: 6px; z-index: 2; background: rgba(0,0,0,.6); color: #fff; border: none; border-radius: 6px; padding: 4px 8px; font-size: 10.5px; cursor: pointer; }
  .unsplash-btn { position: absolute; bottom: 6px; left: 6px; z-index: 2; background: rgba(0,0,0,.6); color: #fff; border: none; border-radius: 6px; padding: 4px 8px; font-size: 10.5px; cursor: pointer; }
  .unsplash-btn:hover { background: #2c6e91; }
  .body { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
  .titre { font-size: 15px; font-weight: 700; border: none; background: transparent; width: 100%; font-family: inherit; padding: 2px 0; }
  .meta { font-size: 12px; color: #6b6455; display: flex; gap: 10px; }
  .meta input { width: 46px; font-size: 12px; border: 1px solid #ddd7ca; border-radius: 4px; padding: 1px 4px; }
  .tags { font-size: 11px; color: #4a7c59; }
  details { font-size: 12.5px; }
  details summary { cursor: pointer; color: #6b6455; padding: 4px 0; user-select: none; }
  .ingredients, .etapes { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
  .ingredients li, .etapes li { display: flex; gap: 6px; align-items: flex-start; }
  .ingredients li span.idx, .etapes li span.idx { color: #a89d87; min-width: 14px; font-variant-numeric: tabular-nums; }
  [contenteditable] { outline: none; }
  [contenteditable]:hover { background: #fdf6e8; }
  [contenteditable]:focus { background: #fef3d0; box-shadow: 0 0 0 1px #d9c07a; border-radius: 3px; }
  input:focus, input:hover { background: #fdf6e8; }
  .ing-field { border: none; background: transparent; font-family: inherit; font-size: 12.5px; }
  .id { font-size: 10.5px; color: #a89d87; font-family: ui-monospace, monospace; }
  footer { text-align: center; padding: 30px; font-size: 12px; color: #8a8171; }
  .hidden { display: none !important; }
</style>
</head>
<body>
<header>
  <h1>Recueil de recettes</h1>
  <span class="stat" id="stat">${data.length} recettes · <strong>${withPhoto}</strong>/${data.length} avec photo</span>
  <input type="search" id="q" placeholder="Filtrer par titre, tag, ingrédient, id…" />
  <label><input type="checkbox" id="only-missing" /> photo manquante seulement</label>
  <button id="export">Exporter recipes.json</button>
</header>
<main>
  <div class="notice">
    <strong>Comment ça marche, sans serveur :</strong> cette page ne parle à rien — tout est déjà dedans.
    Édite les textes directement (clic dans le champ). Pour changer une photo, dépose une image sur la
    vignette : elle est recadrée en 800×600 et convertie en WebP <em>dans le navigateur</em>, puis un
    bouton « télécharger » apparaît — le fichier qu'il télécharge s'appelle déjà <code>&lt;id&gt;.webp</code>,
    prêt à glisser dans <code>public/plats/</code>. Quand tu as fini d'éditer les textes, clique
    « Exporter recipes.json » en haut et remplace <code>src/data/recipes.json</code> par le fichier téléchargé
    (ou dis-le à Claude, qui s'en charge).
  </div>
  <div class="grid" id="grid"></div>
</main>
<footer>Généré par scripts/generate-recipe-book.mjs — relance-le après avoir changé des photos/textes pour rafraîchir cette page.</footer>
<script>
const DATA = ${JSON.stringify(data)};

function card(r) {
  const el = document.createElement('div');
  el.className = 'card' + (r._aPhoto ? '' : ' missing-img');
  el.dataset.id = r.id;
  el.dataset.search = [r.titre, r.id, ...(r.tags||[]), ...(r.ingredients||[]).map(i=>i.nom)].join(' ').toLowerCase();
  el.dataset.hasPhoto = r._aPhoto ? '1' : '0';

  const thumb = document.createElement('div');
  thumb.className = 'thumb';

  const badge = document.createElement('span');
  badge.className = 'badge ' + (r._aPhoto ? 'ok' : 'no');
  badge.textContent = r._aPhoto ? 'photo' : 'manquante';
  thumb.appendChild(badge);

  let imgEl = null;
  if (r._aPhoto) {
    imgEl = document.createElement('img');
    imgEl.src = 'public/plats/' + r.id + '.webp';
    imgEl.alt = r.titre;
    thumb.appendChild(imgEl);
  } else {
    const span = document.createElement('span');
    span.textContent = 'clique ou dépose une photo ici';
    thumb.appendChild(span);
  }

  const hint = document.createElement('div');
  hint.className = 'drop-hint';
  hint.textContent = r._aPhoto ? 'remplacer la photo' : 'ajouter une photo';
  thumb.appendChild(hint);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleImage(r.id, fileInput.files[0], thumb, badge, imgEl);
  });
  thumb.appendChild(fileInput);

  const unsplashBtn = document.createElement('button');
  unsplashBtn.className = 'unsplash-btn';
  unsplashBtn.type = 'button';
  unsplashBtn.textContent = '🔍 Unsplash';
  unsplashBtn.title = 'Chercher « ' + r.titre + ' » sur Unsplash';
  unsplashBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open('https://unsplash.com/s/photos/' + encodeURIComponent(r.titre), '_blank', 'noopener');
  });
  thumb.appendChild(unsplashBtn);

  thumb.addEventListener('dragover', (e) => e.preventDefault());
  thumb.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleImage(r.id, f, thumb, badge, thumb.querySelector('img'));
  });

  const body = document.createElement('div');
  body.className = 'body';

  const titre = document.createElement('input');
  titre.className = 'titre';
  titre.value = r.titre;
  titre.dataset.field = 'titre';

  const idLine = document.createElement('div');
  idLine.className = 'id';
  idLine.textContent = r.id;

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = '<span>⏱ <input data-field="temps" type="number" value="' + r.temps + '" min="1"> min</span>' +
    '<span>🍽 <input data-field="portions" type="number" value="' + r.portions + '" min="1"> parts</span>';

  const tags = document.createElement('div');
  tags.className = 'tags';
  tags.contentEditable = 'true';
  tags.dataset.field = 'tags';
  tags.textContent = (r.tags||[]).join(', ');

  const desc = document.createElement('div');
  desc.style.cssText = 'font-size:12.5px;font-style:italic;color:#4a4436';
  desc.contentEditable = 'true';
  desc.dataset.field = 'description';
  desc.textContent = r.description || '(pas de description)';

  const detIng = document.createElement('details');
  const sumIng = document.createElement('summary');
  sumIng.textContent = 'Ingrédients (' + (r.ingredients||[]).length + ')';
  detIng.appendChild(sumIng);
  const ulIng = document.createElement('ul');
  ulIng.className = 'ingredients';
  (r.ingredients||[]).forEach((ing, i) => {
    const li = document.createElement('li');
    const idx = document.createElement('span'); idx.className = 'idx'; idx.textContent = (i+1) + '.';
    const q = document.createElement('input'); q.className='ing-field'; q.style.width='44px'; q.dataset.ing=i; q.dataset.ingfield='quantite'; q.value = ing.quantite;
    const u = document.createElement('input'); u.className='ing-field'; u.style.width='44px'; u.dataset.ing=i; u.dataset.ingfield='unite'; u.value = ing.unite;
    const n = document.createElement('span'); n.className='ing-field'; n.contentEditable='true'; n.dataset.ing=i; n.dataset.ingfield='nom'; n.style.flex='1'; n.textContent = ing.nom;
    const ry = document.createElement('span'); ry.className='ing-field'; ry.contentEditable='true'; ry.dataset.ing=i; ry.dataset.ingfield='rayon'; ry.style.cssText='width:100px;color:#a89d87'; ry.textContent = ing.rayon;
    li.append(idx, q, u, n, ry);
    ulIng.appendChild(li);
  });
  detIng.appendChild(ulIng);

  const detEt = document.createElement('details');
  const sumEt = document.createElement('summary');
  sumEt.textContent = 'Étapes (' + (r.etapes||[]).length + ')';
  detEt.appendChild(sumEt);
  const ulEt = document.createElement('ul');
  ulEt.className = 'etapes';
  (r.etapes||[]).forEach((et, i) => {
    const li = document.createElement('li');
    const idx = document.createElement('span'); idx.className = 'idx'; idx.textContent = (i+1) + '.';
    const txt = document.createElement('span'); txt.contentEditable = 'true'; txt.dataset.etape = i; txt.style.flex = '1'; txt.textContent = et;
    li.append(idx, txt);
    ulEt.appendChild(li);
  });
  detEt.appendChild(ulEt);

  const en = r._en;
  const detEn = document.createElement('details');
  const sumEn = document.createElement('summary');
  sumEn.textContent = en ? 'Version anglaise ✓' : 'Version anglaise MANQUANTE';
  if (!en) sumEn.style.color = '#c0392b';
  detEn.appendChild(sumEn);
  if (en) {
    const enTitre = document.createElement('div');
    enTitre.contentEditable = 'true';
    enTitre.dataset.enField = 'titre';
    enTitre.style.fontWeight = '600';
    enTitre.textContent = en.titre;
    const enUl = document.createElement('ul');
    enUl.className = 'etapes';
    (en.etapes||[]).forEach((et,i) => {
      const li = document.createElement('li');
      const idx = document.createElement('span'); idx.className='idx'; idx.textContent=(i+1)+'.';
      const txt = document.createElement('span'); txt.contentEditable='true'; txt.dataset.enEtape=i; txt.style.flex='1'; txt.textContent=et;
      li.append(idx, txt);
      enUl.appendChild(li);
    });
    detEn.append(enTitre, enUl);
  }

  body.append(titre, idLine, meta, tags, desc, detIng, detEt, detEn);
  el.append(thumb, body);
  return el;
}

function cropToWebp(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const fr = new FileReader();
    fr.onload = () => { img.src = fr.result; };
    fr.onerror = reject;
    img.onload = () => {
      const targetW = 800, targetH = 600;
      const targetRatio = targetW / targetH;
      const srcRatio = img.width / img.height;
      let sx, sy, sw, sh;
      if (srcRatio > targetRatio) { sh = img.height; sw = sh * targetRatio; sx = (img.width - sw) / 2; sy = 0; }
      else { sw = img.width; sh = sw / targetRatio; sx = 0; sy = (img.height - sh) / 2; }
      const canvas = document.createElement('canvas');
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('encodage webp échoué')), 'image/webp', 0.85);
    };
    img.onerror = reject;
    fr.readAsDataURL(file);
  });
}

async function handleImage(id, file, thumbEl, badgeEl, imgEl) {
  const blob = await cropToWebp(file);
  const url = URL.createObjectURL(blob);
  if (imgEl) { imgEl.src = url; }
  else {
    const img = document.createElement('img');
    img.src = url;
    thumbEl.querySelector('span:not(.badge)')?.remove();
    thumbEl.insertBefore(img, thumbEl.querySelector('.drop-hint'));
  }
  badgeEl.textContent = 'à télécharger'; badgeEl.className = 'badge new';
  thumbEl.closest('.card').classList.add('dirty');

  let dl = thumbEl.querySelector('.dl-btn');
  if (!dl) {
    dl = document.createElement('button');
    dl.className = 'dl-btn';
    thumbEl.appendChild(dl);
  }
  dl.textContent = 'télécharger ' + id + '.webp';
  dl.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    const a = document.createElement('a');
    a.href = url;
    a.download = id + '.webp';
    a.click();
  };
}

const grid = document.getElementById('grid');
const items = DATA.map(r => {
  const el = card(r);
  grid.appendChild(el);
  return { el, recipe: r };
});

function applyFilter() {
  const q = document.getElementById('q').value.trim().toLowerCase();
  const onlyMissing = document.getElementById('only-missing').checked;
  for (const it of items) {
    const matchesQ = !q || it.el.dataset.search.includes(q);
    const matchesMissing = !onlyMissing || it.el.dataset.hasPhoto === '0';
    it.el.classList.toggle('hidden', !(matchesQ && matchesMissing));
  }
}
document.getElementById('q').addEventListener('input', applyFilter);
document.getElementById('only-missing').addEventListener('change', applyFilter);

document.getElementById('export').addEventListener('click', () => {
  const out = items.map(({ el, recipe }) => {
    const r = { ...recipe };
    delete r._aPhoto; delete r._en;
    r.titre = el.querySelector('[data-field="titre"]').value.trim();
    r.temps = Number(el.querySelector('[data-field="temps"]').value) || r.temps;
    r.portions = Number(el.querySelector('[data-field="portions"]').value) || r.portions;
    r.tags = el.querySelector('[data-field="tags"]').textContent.split(',').map(s=>s.trim()).filter(Boolean);
    const descText = el.querySelector('[data-field="description"]').textContent.trim();
    if (descText && descText !== '(pas de description)') r.description = descText; else delete r.description;
    r.ingredients = (recipe.ingredients||[]).map((ing, i) => {
      const q = el.querySelector('[data-ing="'+i+'"][data-ingfield="quantite"]');
      const u = el.querySelector('[data-ing="'+i+'"][data-ingfield="unite"]');
      const n = el.querySelector('[data-ing="'+i+'"][data-ingfield="nom"]');
      const ry = el.querySelector('[data-ing="'+i+'"][data-ingfield="rayon"]');
      return { ...ing, quantite: Number(q.value)||ing.quantite, unite: u.value.trim(), nom: n.textContent.trim(), rayon: ry.textContent.trim() };
    });
    r.etapes = (recipe.etapes||[]).map((et,i) => el.querySelector('[data-etape="'+i+'"]').textContent.trim());
    return r;
  });
  const blob = new Blob([JSON.stringify(out, null, 2) + '\\n'], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'recipes.json';
  a.click();
});
</script>
</body>
</html>
`

fs.writeFileSync(path.join(root, 'recipe-book.html'), html, 'utf8')
console.log(`recipe-book.html généré : ${data.length} recettes, ${withPhoto} avec photo, ${data.length - withPhoto} sans.`)
