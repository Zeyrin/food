// Génère recipe-review.html à la racine du dépôt : une page locale (ouvrir dans un
// navigateur, ou npm run dev + /recipe-review.html) pour parcourir les 137 recettes,
// voir leur photo (ou son absence), et éditer tout ce que l'utilisateur voit avant prod.
// Ne fait pas partie du build : n'est jamais copié dans dist/.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const recipesFr = JSON.parse(fs.readFileSync(path.join(root, 'src/data/recipes.json'), 'utf8'))
const recipesEn = JSON.parse(fs.readFileSync(path.join(root, 'src/data/recipes.en.json'), 'utf8'))
const enById = new Map(Object.entries(recipesEn))
const imagesDisponibles = new Set(
  fs.readdirSync(path.join(root, 'public/plats')).map((f) => f.replace(/\.webp$/, '')),
)

const data = recipesFr.map((r) => ({
  ...r,
  _aPhoto: imagesDisponibles.has(r.id),
  _en: enById.get(r.id) ?? null,
}))

const withPhoto = data.filter((r) => r._aPhoto).length

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Revue des recettes — FFFood</title>
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
  main { max-width: 1100px; margin: 0 auto; padding: 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
  .card { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.12); display: flex; flex-direction: column; }
  .card.missing-img { outline: 2px solid #d98c3a; }
  .thumb { aspect-ratio: 4/3; background: linear-gradient(135deg,#dcd3c4,#b8ab92); display: flex; align-items: center; justify-content: center; color: #6b5f4d; font-size: 12px; text-align: center; padding: 8px; position: relative; }
  .thumb img { width: 100%; height: 100%; object-fit: cover; }
  .badge { position: absolute; top: 6px; left: 6px; font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 999px; text-transform: uppercase; letter-spacing: .03em; }
  .badge.ok { background: #4a7c59; color: #fff; }
  .badge.no { background: #d98c3a; color: #fff; }
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
  .ing-field { border: none; background: transparent; font-family: inherit; font-size: 12.5px; }
  .id { font-size: 10.5px; color: #a89d87; font-family: ui-monospace, monospace; }
  .imgpath { font-size: 10.5px; color: #6b6455; word-break: break-all; }
  footer { text-align: center; padding: 30px; font-size: 12px; color: #8a8171; }
  .hidden { display: none !important; }
</style>
</head>
<body>
<header>
  <h1>Revue des recettes</h1>
  <span class="stat">${data.length} recettes · <strong id="stat-photo">${withPhoto}</strong>/${data.length} avec photo</span>
  <input type="search" id="q" placeholder="Filtrer par titre, tag, ingrédient, id…" />
  <label><input type="checkbox" id="only-missing" /> photo manquante seulement</label>
  <button id="export">Exporter le JSON édité</button>
</header>
<main>
  <div class="grid" id="grid"></div>
</main>
<footer>Généré par scripts/generate-recipe-review.mjs — édite ici, puis exporte pour remplacer src/data/recipes.json.</footer>
<script>
const DATA = ${JSON.stringify(data)};

function card(r) {
  const el = document.createElement('div');
  el.className = 'card' + (r._aPhoto ? '' : ' missing-img');
  el.dataset.search = [r.titre, r.id, ...(r.tags||[]), ...(r.ingredients||[]).map(i=>i.nom)].join(' ').toLowerCase();
  el.dataset.hasPhoto = r._aPhoto ? '1' : '0';

  const thumb = document.createElement('div');
  thumb.className = 'thumb';
  const badge = document.createElement('span');
  badge.className = 'badge ' + (r._aPhoto ? 'ok' : 'no');
  badge.textContent = r._aPhoto ? 'photo' : 'manquante';
  thumb.appendChild(badge);
  if (r._aPhoto) {
    const img = document.createElement('img');
    img.src = 'public/plats/' + r.id + '.webp';
    img.loading = 'lazy';
    img.alt = r.titre;
    thumb.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.textContent = 'pas de public/plats/' + r.id + '.webp';
    thumb.appendChild(span);
  }

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
  desc.style.fontSize = '12.5px';
  desc.style.fontStyle = 'italic';
  desc.style.color = '#4a4436';
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
    li.innerHTML = '<span class="idx">' + (i+1) + '.</span>' +
      '<input class="ing-field" data-ing="' + i + '" data-ingfield="quantite" style="width:44px" value="' + ing.quantite + '">' +
      '<input class="ing-field" data-ing="' + i + '" data-ingfield="unite" style="width:44px" value="' + ing.unite + '">' +
      '<span class="ing-field" contenteditable="true" data-ing="' + i + '" data-ingfield="nom" style="flex:1">' + ing.nom + '</span>' +
      '<span class="ing-field" contenteditable="true" data-ing="' + i + '" data-ingfield="rayon" style="width:100px;color:#a89d87">' + ing.rayon + '</span>';
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
    const idx = document.createElement('span');
    idx.className = 'idx';
    idx.textContent = (i+1) + '.';
    const txt = document.createElement('span');
    txt.contentEditable = 'true';
    txt.dataset.etape = i;
    txt.style.flex = '1';
    txt.textContent = et;
    li.appendChild(idx);
    li.appendChild(txt);
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
      li.appendChild(idx); li.appendChild(txt);
      enUl.appendChild(li);
    });
    detEn.appendChild(enTitre);
    detEn.appendChild(enUl);
  }

  const imgPath = document.createElement('div');
  imgPath.className = 'imgpath';
  imgPath.textContent = 'public/plats/' + r.id + '.webp';

  body.append(titre, idLine, meta, tags, desc, detIng, detEt, detEn, imgPath);
  el.append(thumb, body);
  return { el, recipe: r };
}

const grid = document.getElementById('grid');
const items = DATA.map(r => {
  const { el, recipe } = card(r);
  grid.appendChild(el);
  return { el, recipe };
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

fs.writeFileSync(path.join(root, 'recipe-review.html'), html, 'utf8')
console.log(`recipe-review.html généré : ${data.length} recettes, ${withPhoto} avec photo, ${data.length - withPhoto} sans.`)
