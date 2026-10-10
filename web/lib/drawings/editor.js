// Édition des dessins à la souris : création (deux clics, ou glisser), sélection, déplacement,
// redimensionnement par les poignées, style, suppression. Sauvegarde par marché et par symbole, et
// dernier style de chaque outil : storage.js.
import { cleanCalc, positionPoints, snapToBar } from '@shared/measures.js';
import {
  DRAW_TYPES, POSITIONS, TEXT_MAX, cleanStyle, fromPixel, hitTest, movePoints, setHandle, shapeIn, textSize, toPixel,
} from '@shared/drawings.js';
import { loadCalc, loadMagnet, loadSet, loadStyles, saveCalc, saveMagnet, saveSet, saveStyles } from './storage.js';

const CLICK_PX = 5; // en deçà, un glisser est un simple clic

export class DrawingEditor {
  // enabled() : faux dans les vues sans échelle de temps continue (TPO, Kagi, P&F, Line break).
  constructor(chart, enabled) {
    this.chart = chart;
    this.enabled = enabled;
    this.key = '';
    this.list = [];
    this.tool = null; // outil actif (null = curseur)
    this.sel = null; // identifiant du dessin sélectionné
    this.draft = null; // dessin en cours de création
    this.downAt = null;
    this.drag = null;
    this.editing = null; // identifiant de la note en cours de saisie
    this.onState = null; // (état résumé) -> barres de dessin et de style, saisie des notes
    this.styles = loadStyles();
    this.calc = loadCalc();
    this.magnet = loadMagnet(); // points collés aux prix OHLC des bougies
  }

  // Charge les dessins du symbole affiché quand il change.
  sync() {
    const m = this.chart.meta;
    const key = m ? `${m.market}:${m.symbol}` : '';
    if (key === this.key) return;
    this.key = key;
    this.list = key ? loadSet(key) : [];
    this.sel = null;
    this.draft = null;
    this.drag = null;
    this.editing = null;
    this.#changed();
  }

  // Dessins à afficher, dessin en cours compris.
  visible() {
    return this.draft ? [...this.list, this.draft] : this.list;
  }

  setTool(tool) {
    this.tool = tool;
    this.draft = null;
    if (tool) this.sel = null;
    this.#changed();
  }

  // Échap : annule le tracé en cours, puis l'outil, puis la sélection. Faux s'il n'y avait rien.
  escape() {
    if (!this.draft && !this.tool && !this.sel && !this.editing) return false;
    if (this.editing) this.setText(null);
    else if (this.draft || this.tool) this.setTool(null);
    else {
      this.sel = null;
      this.#changed();
    }
    return true;
  }

  // Style du dessin sélectionné (couleur, épaisseur, trait), retenu pour les prochains dessins de cet outil.
  setStyle(patch) {
    const d = this.list.find((x) => x.id === this.sel);
    if (!d) return;
    d.style = cleanStyle({ ...d.style, ...patch });
    this.styles[d.type] = d.style;
    saveStyles(this.styles);
    this.#save();
  }

  setMagnet(on) {
    this.magnet = on;
    saveMagnet(on);
    this.#changed();
  }

  // Capital et risque (%) d'une position (par défaut la sélectionnée), retenus pour les prochaines.
  // L'identifiant est passé par la barre de style : la saisie est validée en quittant le champ, parfois
  // après qu'un clic sur le graphique a déjà désélectionné la position.
  setCalc(patch, id = this.sel) {
    const d = this.list.find((x) => x.id === id);
    if (!d?.calc) return;
    d.calc = cleanCalc({ ...d.calc, ...patch });
    this.calc = d.calc;
    saveCalc(this.calc);
    this.#save();
  }

  // Fin de saisie d'une note : texte validé, ou null pour annuler. Une note vide est retirée.
  setText(text) {
    const d = this.list.find((x) => x.id === this.editing);
    this.editing = null;
    if (!d) return this.#changed();
    if (text !== null) d.text = text.slice(0, TEXT_MAX);
    if (!d.text.trim()) {
      this.list = this.list.filter((x) => x !== d);
      this.sel = null;
    }
    this.#save();
  }

  // Double-clic : ouvre la saisie d'une note. Vrai si l'événement est consommé.
  dblclick(p) {
    const hit = this.enabled() && !this.tool && this.#hit(p);
    const d = hit && this.list[hit.index];
    if (d?.type !== 'text') return false;
    this.sel = d.id;
    this.editing = d.id;
    this.#changed();
    return true;
  }

  removeSelected() {
    if (!this.sel) return false;
    this.list = this.list.filter((d) => d.id !== this.sel);
    this.sel = null;
    this.#save();
    return true;
  }

  clear() {
    this.list = [];
    this.sel = null;
    this.draft = null;
    this.#save();
  }

  // ---------- Souris (coordonnées du tracé principal) ; vrai si l'événement est consommé ----------

  down(p) {
    if (!this.enabled()) return false;
    let pt = this.#point(p);
    if (this.draft) {
      // Second clic : ignoré s'il retombe sur le premier point (ligne de longueur nulle).
      const [x, y] = this.#px(this.draft.pts[0]);
      if (Math.hypot(p.x - x, p.y - y) < CLICK_PX) return true;
      this.draft.pts[this.draft.pts.length - 1] = pt;
      this.#finish();
      return true;
    }
    if (this.tool === 'avwap') pt = this.#anchor(pt, p);
    if (this.tool) {
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      this.draft = { id, type: this.tool, pts: Array.from({ length: DRAW_TYPES[this.tool] }, () => ({ ...pt })), style: cleanStyle(this.styles[this.tool]) };
      if (this.tool === 'text') this.draft.text = '';
      if (POSITIONS.includes(this.tool)) {
        // Stop à 6 % de la hauteur visible, cible au double, sur 160 px de large.
        const s = this.chart.scale;
        this.draft.pts = positionPoints(pt, this.tool, (s.pTop - s.pBottom) * 0.06, this.#point({ x: p.x + 160, y: p.y }).t);
        this.draft.calc = { ...this.calc };
      }
      // Un seul clic : posé aussitôt (un point, ou position avec stop et cible par défaut).
      if (DRAW_TYPES[this.tool] === 1 || POSITIONS.includes(this.tool)) this.#finish();
      else {
        this.downAt = p;
        this.#changed();
      }
      return true;
    }
    const hit = this.#hit(p);
    if (!hit) {
      if (this.sel) {
        this.sel = null;
        this.#changed();
      }
      return false;
    }
    const d = this.list[hit.index];
    this.sel = d.id;
    this.drag = { d, handle: hit.handle, from: p, orig: d.pts.map((q) => ({ ...q })), moved: false };
    this.#changed();
    return true;
  }

  move(p) {
    if (this.draft) {
      this.draft.pts[this.draft.pts.length - 1] = this.#point(p);
      this.chart.invalidate();
    } else if (this.drag) {
      const g = this.drag;
      g.moved = true;
      const pt = g.d.type === 'avwap' ? this.#anchor(this.#point(p), p) : this.#point(p);
      if (g.handle >= 0) g.d.pts = setHandle(g.d, g.handle, pt);
      else g.d.pts = movePoints(this.chart.scale, this.#items(), g.orig, p.x - g.from.x, p.y - g.from.y);
      this.chart.invalidate();
    }
  }

  up(p) {
    // Tracé en glissant : le relâchement pose le dernier point ; sinon on attend le second clic.
    if (this.draft && this.downAt && Math.hypot(p.x - this.downAt.x, p.y - this.downAt.y) >= CLICK_PX) this.#finish();
    this.downAt = null;
    if (this.drag?.moved) this.#save();
    this.drag = null;
  }

  // Curseur de la souris au survol du tracé (null : curseur par défaut du graphique).
  cursor(p) {
    if (!this.enabled()) return null;
    if (this.tool || this.draft) return 'crosshair';
    if (this.drag) return this.drag.handle >= 0 ? 'grabbing' : 'move';
    const hit = this.#hit(p);
    return hit ? (hit.handle >= 0 ? 'grab' : 'move') : null;
  }

  // Dessin en train d'être tracé, déplacé ou étiré (profil à plage fixe : pas de nouvelle requête).
  moving(d) {
    return this.draft === d || this.drag?.d === d;
  }

  // Le graphique est occupé par un tracé (le double-clic ne doit pas revenir au direct).
  busy() {
    return Boolean(this.tool || this.draft || this.drag);
  }

  // ---------- Interne ----------

  #items() {
    return this.chart.view ?? [];
  }

  #px(pt) {
    return toPixel(this.chart.scale, this.#items(), pt);
  }

  // Point (heure, prix) sous la souris, collé à la bougie la plus proche si l'aimant est actif.
  #point(p) {
    const { scale, spec } = this.chart;
    const pt = fromPixel(scale, this.#items(), p.x, p.y);
    if (!this.magnet) return pt;
    const tf = scale.mode === 'time' && spec.type === 'time' ? spec.param : null;
    return snapToBar(this.chart.itemAt(this.#items(), p.x), pt, p.y, (v) => scale.yOfPrice(v), { tf });
  }

  // Contexte de calcul des formes (voir shapeIn).
  #view() {
    const { scale, spec, data } = this.chart;
    return { scale, items: this.#items(), bars: data.bars, tf: spec.type === 'time' ? spec.param : null };
  }

  // VWAP ancré : l'ancre est le début de la bougie sous la souris.
  #anchor(pt, p) {
    const bar = this.chart.itemAt(this.#items(), p.x);
    return bar ? { t: bar.t0, p: pt.p } : pt;
  }

  #hit(p) {
    const view = this.#view();
    const shapes = this.list.map((d) => shapeIn(d, view));
    return hitTest(shapes, p.x, p.y, 6, this.list.findIndex((d) => d.id === this.sel));
  }

  #finish() {
    this.list = [...this.list, this.draft];
    this.sel = this.draft.id;
    if (this.draft.type === 'text') this.editing = this.draft.id; // saisie du texte aussitôt
    this.draft = null;
    this.tool = null; // retour au curseur, comme TradingView
    this.#save();
  }

  #save() {
    if (this.key) saveSet(this.key, this.list);
    this.#changed();
  }

  #changed() {
    this.chart.invalidate();
    const sel = this.list.find((d) => d.id === this.sel);
    const note = this.list.find((d) => d.id === this.editing);
    const edit = note ? { id: note.id, at: this.#px(note.pts[0]), text: note.text, color: note.style.color, size: textSize(note.style.width) } : null;
    this.onState?.({
      tool: this.tool, magnet: this.magnet, sel: Boolean(sel), id: sel?.id ?? null, type: sel?.type ?? null, style: sel?.style ?? null, calc: sel?.calc ?? null, count: this.list.length, edit,
    });
  }
}
