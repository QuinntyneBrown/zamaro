/* palette.js: the Unplugged palette playground.
   Loaded in <head> so the saved palette applies before first paint.

   State = five seed colours + a contrast number. tokens.css derives every
   other colour (surfaces, borders, dark theme) from these, so setting six
   custom properties on <html> restyles the whole page.

   Sources, in priority order: URL (?palette=sage&contrast=85, or
   ?palette=custom&colors=hex.hex.hex.hex.hex), localStorage, the default.
   Presets are hand-curated five-swatch themes in the spirit of Adobe Color
   (color.adobe.com) and are contrast-checked at the default contrast (90). */
(function () {
  var root = document.documentElement;
  var KEY = 'unplugged-palette';
  var DEFAULT_CONTRAST = 90;
  var PRESETS = {
    newsprint: { label: 'Newsprint Soft', colors: ['#3b3a36', '#f6f3ea', '#f2d36b', '#e9dcae', '#d8d3c4'] },
    sage:      { label: 'Sage & Linen',   colors: ['#34413a', '#f3f0e7', '#c9825f', '#b9c4a7', '#dcd3bf'] },
    rose:      { label: 'Dusty Rose',     colors: ['#4a3442', '#f8f0ef', '#d99aa5', '#e8c6c4', '#cdb8c6'] },
    harbour:   { label: 'Harbour Fog',    colors: ['#2f3b48', '#f1f3f3', '#c7a35a', '#b7c6d3', '#d9dcd6'] },
    clay:      { label: 'Clay Studio',    colors: ['#47342a', '#f5eee4', '#a65a33', '#e2c3a3', '#b9b48f'] },
    lavender:  { label: 'Lavender Hour',  colors: ['#3c3550', '#f5f3f7', '#d6b25e', '#cdc3e3', '#e3dccb'] }
  };
  var SEEDS = ['--seed-ink', '--seed-paper', '--seed-accent', '--seed-tint-a', '--seed-tint-b'];

  function readStored() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function store(state) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } }

  function isHex(v) { return /^#?[0-9a-f]{6}$/i.test(v || ''); }
  function hex(v) { return '#' + String(v).replace('#', '').toLowerCase(); }
  function clampContrast(n) { n = Number(n); return isFinite(n) ? Math.min(100, Math.max(60, Math.round(n))) : DEFAULT_CONTRAST; }

  function fromPreset(name, contrast) {
    var p = PRESETS[name] || PRESETS.newsprint;
    return { name: PRESETS[name] ? name : 'newsprint', colors: p.colors.slice(), contrast: clampContrast(contrast) };
  }

  function initialState() {
    var q = new URLSearchParams(location.search);
    var name = q.get('palette');
    if (name === 'custom' && q.get('colors')) {
      var list = q.get('colors').split('.');
      if (list.length === 5 && list.every(isHex)) return { name: 'custom', colors: list.map(hex), contrast: clampContrast(q.get('contrast')) };
    }
    if (name && PRESETS[name]) return fromPreset(name, q.get('contrast'));
    var saved = readStored();
    if (saved && saved.colors && saved.colors.length === 5 && saved.colors.every(isHex)) {
      saved.contrast = clampContrast(saved.contrast);
      return saved;
    }
    return fromPreset('newsprint', DEFAULT_CONTRAST);
  }

  var state = initialState();

  function paint() {
    SEEDS.forEach(function (prop, i) { root.style.setProperty(prop, state.colors[i]); });
    root.style.setProperty('--contrast', state.contrast);
  }
  paint();

  function reducedMotion() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }

  // animate: cross-fade the whole page with a View Transition when supported;
  // otherwise the @property-registered seeds glide (tokens.css .palette-animate).
  function apply(next, options) {
    state = next;
    store(state);
    var animate = options && options.animate && !reducedMotion();
    if (animate && document.startViewTransition) {
      document.startViewTransition(paint).finished.then(sync, sync);
    } else {
      root.classList.toggle('palette-animate', !!animate);
      paint();
      sync();
    }
  }

  function toParams() {
    var p = { palette: state.name, contrast: String(state.contrast) };
    if (state.name === 'custom') p.colors = state.colors.map(function (c) { return c.slice(1); }).join('.');
    return p;
  }

  // ---------- Colour maths (sRGB / WCAG / OKLCH) ------------------------------
  function toRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function toHex(rgb) { return '#' + rgb.map(function (v) { return Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0'); }).join(''); }
  function mix(a, b, t) { var A = toRgb(a), B = toRgb(b); return toHex(A.map(function (v, i) { return v * t + B[i] * (1 - t); })); }
  function lum(rgb) {
    var c = rgb.map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function oklch(L, C, H) {
    var h = H * Math.PI / 180, a = C * Math.cos(h), b = C * Math.sin(h);
    var l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    var m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    var s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
    return toHex([
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076127010 * s
    ].map(function (v) { v = Math.min(1, Math.max(0, v)); return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055); }));
  }

  // Resolve any computed CSS colour (oklab(), color(srgb …)) to sRGB via a 1×1 canvas.
  var probe;
  function resolve(color) {
    if (!probe) { probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); probe.canvas.width = probe.canvas.height = 1; }
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = '#000'; probe.fillStyle = color;
    probe.fillRect(0, 0, 1, 1);
    var d = probe.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  }

  // ---------- Panel wiring ----------------------------------------------------
  var panel;
  function $(sel) { return panel ? panel.querySelector(sel) : null; }

  function readout() {
    if (!panel) return;
    var cs = getComputedStyle(document.body);
    var bg = resolve(cs.backgroundColor);
    var body = ratio(resolve(cs.color), bg);
    var muted = ratio(resolve(getComputedStyle($('[data-muted-probe]')).color), bg);
    [['[data-aa="body"]', 'Text', body], ['[data-aa="muted"]', 'Muted', muted]].forEach(function (row) {
      var el = $(row[0]);
      if (!el) return;
      var ok = row[2] >= 4.5;
      el.dataset.ok = ok ? 'true' : 'false';
      el.textContent = row[1] + ' ' + row[2].toFixed(1) + ':1 ' + (ok ? '· AA ✓' : '· below AA');
    });
  }

  function sync() {
    if (!panel) return;
    panel.querySelectorAll('[data-preset]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.preset === state.name ? 'true' : 'false'); });
    $('#pal-ink').value = state.colors[0];
    $('#pal-paper').value = state.colors[1];
    $('#pal-accent').value = state.colors[2];
    $('#pal-contrast').value = state.contrast;
    $('#pal-contrast-out').textContent = state.contrast;
    $('[data-custom-label]').hidden = state.name !== 'custom';
    requestAnimationFrame(readout);
    setTimeout(readout, 700); // after any glide finishes
  }

  function custom(index, value) {
    var c = state.colors.slice();
    c[index] = value;
    // Keep the photo tints in tune: tint A leans on the accent, tint B on the ink.
    c[3] = mix(c[2], c[1], 0.45);
    c[4] = mix(c[0], c[1], 0.16);
    apply({ name: 'custom', colors: c, contrast: state.contrast });
  }

  function surprise() {
    var h = Math.floor(Math.random() * 360), turn = [150, 180, 210, 35][Math.floor(Math.random() * 4)];
    var ink = oklch(0.33, 0.035, h), paper = oklch(0.97, 0.012, h), accent = oklch(0.78, 0.11, (h + turn) % 360);
    apply({ name: 'custom', colors: [ink, paper, accent, mix(accent, paper, 0.45), mix(ink, paper, 0.16)], contrast: state.contrast }, { animate: true });
  }

  function wire() {
    panel = document.getElementById('palette');
    if (!panel) return;
    panel.addEventListener('click', function (event) {
      var preset = event.target.closest('[data-preset]');
      if (preset) { apply(fromPreset(preset.dataset.preset, state.contrast), { animate: true }); return; }
      if (event.target.closest('#pal-reset')) { apply(fromPreset('newsprint', DEFAULT_CONTRAST), { animate: true }); window.mockToast && mockToast('Palette reset'); return; }
      if (event.target.closest('#pal-surprise')) { surprise(); return; }
      if (event.target.closest('#pal-copy')) {
        var css = ':root {\n' + SEEDS.map(function (p, i) { return '  ' + p + ': ' + state.colors[i] + ';'; }).join('\n') + '\n  --contrast: ' + state.contrast + ';\n}';
        var done = function () { window.mockToast && mockToast('Palette copied as CSS'); };
        if (navigator.clipboard) navigator.clipboard.writeText(css).then(done, function () { prompt('Copy the palette', css); });
        else prompt('Copy the palette', css);
        return;
      }
      if (event.target.closest('#pal-eyedrop')) {
        new window.EyeDropper().open().then(function (r) { custom(2, r.sRGBHex.slice(0, 7)); }, function () { /* cancelled */ });
      }
    });
    $('#pal-ink').addEventListener('input', function (e) { custom(0, e.target.value); });
    $('#pal-paper').addEventListener('input', function (e) { custom(1, e.target.value); });
    $('#pal-accent').addEventListener('input', function (e) { custom(2, e.target.value); });
    $('#pal-contrast').addEventListener('input', function (e) {
      state.contrast = clampContrast(e.target.value);
      root.classList.remove('palette-animate');
      root.style.setProperty('--contrast', state.contrast);
      $('#pal-contrast-out').textContent = state.contrast;
      store(state);
      requestAnimationFrame(readout);
    });
    if (window.EyeDropper) $('#pal-eyedrop').hidden = false;
    // Recheck contrast when the theme flips.
    new MutationObserver(function () { setTimeout(readout, 50); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    panel.addEventListener('toggle', function (e) { if (e.newState === 'open') sync(); });
    sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.unpluggedPalette = { apply: apply, toParams: toParams, presets: PRESETS };
})();
