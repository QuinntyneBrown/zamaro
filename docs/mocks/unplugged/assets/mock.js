/* mock.js: tiny runtime for the Unplugged mocks. No framework, no build step.
   - theme: ?theme=light|dark, localStorage, the mock bar toggle, or the `t` key
   - chrome: ?chrome=0 hides the mock bar and notes (used for screenshots)
   - save: [data-save] hearts toggle, bump the Saved count and show a toast
   - video: [data-video-title] buttons fill the player dialog's caption
   - invoker commands: a small fallback for commandfor/command where unsupported
   - mock-bar links carry ?theme, ?chrome and the palette params (palette.js)
   Everything degrades gracefully when JavaScript is off. */
(function () {
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);

  function readStored(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode */ } }

  function currentTheme() {
    if (root.dataset.theme === 'dark' || root.dataset.theme === 'light') return root.dataset.theme;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    if (persist) store('mock-theme', theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      button.textContent = theme === 'dark' ? '☀ Light' : '☾ Dark';
      button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }
  function toggleTheme() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(function () { applyTheme(next, true); });
    } else applyTheme(next, true);
  }

  var requested = params.get('theme');
  if (requested === 'light' || requested === 'dark') applyTheme(requested, false);
  else if (readStored('mock-theme')) applyTheme(readStored('mock-theme'), false);
  else applyTheme(currentTheme(), false);

  if (params.get('chrome') === '0') root.dataset.chrome = 'off';

  // ---------- Toast (popover="manual") -------------------------------------
  var toastTimer;
  function toast(message) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    try { if (el.showPopover && !el.matches(':popover-open')) el.showPopover(); } catch (e) { el.hidden = false; }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { try { el.hidePopover(); } catch (e) { el.hidden = true; } }, 2600);
  }
  window.mockToast = toast;

  // ---------- Saved artists --------------------------------------------------
  function bumpSaved(delta) {
    document.querySelectorAll('[data-saved-count]').forEach(function (badge) {
      var n = Math.max(0, parseInt(badge.textContent, 10) + delta);
      badge.textContent = n;
      badge.setAttribute('aria-label', n + ' saved artists');
    });
  }

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-theme-toggle]');
    if (toggle) { toggleTheme(); return; }
    var chrome = event.target.closest('[data-chrome-toggle]');
    if (chrome) { root.dataset.chrome = root.dataset.chrome === 'off' ? 'on' : 'off'; return; }
    var save = event.target.closest('[data-save]');
    if (save) {
      var name = save.getAttribute('data-save');
      var on = save.getAttribute('aria-pressed') !== 'true';
      save.setAttribute('aria-pressed', on ? 'true' : 'false');
      save.setAttribute('aria-label', (on ? 'Remove ' : 'Save ') + name + (on ? ' from saved' : ''));
      save.classList.remove('is-popping'); void save.offsetWidth; if (on) save.classList.add('is-popping');
      bumpSaved(on ? 1 : -1);
      toast(on ? 'Saved ' + name : 'Removed ' + name);
      return;
    }
    var video = event.target.closest('[data-video-title]');
    if (video) { var title = document.getElementById('player-title'); if (title) title.textContent = video.getAttribute('data-video-title'); }
    var chip = event.target.closest('.chip[aria-pressed]');
    if (chip) { chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); return; }
    var busy = event.target.closest('[data-busy]');
    if (busy) { busy.setAttribute('aria-busy', 'true'); busy.textContent = busy.getAttribute('data-busy'); return; }
    var setter = event.target.closest('[data-set-state]');
    if (setter) {
      var target = document.querySelector(setter.getAttribute('data-target') || 'body');
      if (target) target.dataset.state = setter.getAttribute('data-set-state');
    }
  });

  // ---------- Invoker commands fallback ---------------------------------------
  // Browsers with native commandfor/command handle these buttons themselves.
  if (!('commandForElement' in HTMLButtonElement.prototype)) {
    document.addEventListener('click', function (event) {
      var button = event.target.closest('button[commandfor]');
      if (!button) return;
      var target = document.getElementById(button.getAttribute('commandfor'));
      var command = button.getAttribute('command');
      if (!target) return;
      if (command === 'show-modal' && target.showModal) target.showModal();
      else if (command === 'close' && target.close) target.close();
      else if (command === 'toggle-popover' && target.togglePopover) target.togglePopover();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.target.matches('input, textarea, select, [contenteditable]')) return;
    if (event.key === 't' && !event.metaKey && !event.ctrlKey && !event.altKey) toggleTheme();
  });

  // Carry theme, chrome and palette across sibling-state links so a review stays consistent.
  document.querySelectorAll('.mock-bar a[href]').forEach(function (link) {
    link.addEventListener('click', function () {
      try {
        var url = new URL(link.href);
        url.searchParams.set('theme', currentTheme());
        if (root.dataset.chrome === 'off') url.searchParams.set('chrome', '0');
        if (window.unpluggedPalette) {
          var p = window.unpluggedPalette.toParams();
          Object.keys(p).forEach(function (k) { url.searchParams.set(k, p[k]); });
        }
        link.href = url.toString();
      } catch (e) { /* relative file URLs in some viewers */ }
    });
  });
})();
