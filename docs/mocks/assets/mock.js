/* Local-only prototype interactions. No requests are submitted to a service. */
(() => {
  const root = document.documentElement;
  const query = new URLSearchParams(location.search);
  root.dataset.theme = query.get('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (query.get('chrome') === '0') root.dataset.chrome = 'off';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const slideDuration = () => parseFloat(getComputedStyle(root).getPropertyValue('--duration-slide')) || 0;
  const announce = (text) => { if ($('#feedback')) $('#feedback').textContent = text; };
  const toggleTheme = () => { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; };
  $$('[data-theme-toggle]').forEach(button => button.addEventListener('click', toggleTheme));
  document.addEventListener('keydown', event => {
    if (event.key === 't' && !event.ctrlKey && !event.metaKey && !/INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) toggleTheme();
  });
  // Preserve review settings when following local page links.
  $$('a[href]').forEach(link => link.addEventListener('click', () => {
    const href = link.getAttribute('href');
    if (!href.includes('.html') || /^(https?:)/.test(href)) return;
    const url = new URL(href, location.href);
    url.searchParams.set('theme', root.dataset.theme);
    if (root.dataset.chrome === 'off') url.searchParams.set('chrome', '0');
    link.href = url.href;
  }));
  let saved;
  try { saved = new Set(JSON.parse(localStorage.getItem('zamaro-concept-saved') || '[]')); }
  catch { saved = new Set(); }
  function syncSaved() {
    $$('[data-save]').forEach(button => {
      const selected = saved.has(button.dataset.save);
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = selected ? '♥' : '♡';
      button.setAttribute('aria-label', `${selected ? 'Unsave' : 'Save'} ${button.dataset.save}`);
    });
    $$('[data-saved-count]').forEach(span => { span.textContent = saved.size; });
    $$('[data-progress]').forEach(span => { span.textContent = `${Math.min(saved.size, 3)} / 3 voices on your shortlist`; });
    if ($('#saved-list')) {
      $('#saved-list').replaceChildren();
      [...saved].forEach(name => { const li = document.createElement('li'); li.textContent = name; $('#saved-list').append(li); });
      $('#saved-empty').hidden = saved.size > 0;
    }
    try { localStorage.setItem('zamaro-concept-saved', JSON.stringify([...saved])); } catch { /* In-memory saving still works. */ }
  }
  $$('[data-save]').forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.save;
    if (saved.has(name)) saved.delete(name); else saved.add(name);
    syncSaved(); announce(saved.has(name) ? `${name} added to your shortlist.` : `${name} removed from your shortlist.`);
    if (saved.has(name) && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      $$('.character').forEach(character => character.animate([
        {transform:'rotate(-12deg) translateY(0)'},
        {transform:'rotate(12deg) translateY(-12%)'},
        {transform:'rotate(-12deg) translateY(0)'}
      ], {duration:slideDuration(),easing:'ease-out'}));
    }
  }));
  syncSaved();
  $$('[data-panel]').forEach(button => button.addEventListener('click', () => {
    const panel = document.getElementById(button.dataset.panel);
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) panel.scrollIntoView({block:'nearest', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }));
  let filter = 'all';
  function filterArtists() {
    const date = $('#event-date')?.value || '2026-11-14';
    const radius = Number($('#radius')?.value || 100);
    const city = $('#location')?.value.trim() || 'Toronto';
    const cards = $$('[data-artist]');
    let count = 0;
    cards.forEach(card => {
      const matches = (filter === 'all' || (filter === 'budget' ? Number(card.dataset.price) < 800 : card.dataset.tags.split(' ').includes(filter))) && Number(card.dataset.distance) <= radius && date !== '2026-11-15';
      card.hidden = !matches;
      if (matches) count++;
    });
    if ($('#result-count')) $('#result-count').textContent = `${count} artists available · within ${radius} km of ${city}`;
    if ($('#live-empty')) $('#live-empty').hidden = count !== 0;
    announce(count ? `Showing ${count} available artists.` : 'No artists match. Try another date or widen your radius.');
  }
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    $$('[data-filter]').forEach(chip => chip.setAttribute('aria-pressed', String(chip === button)));
    filterArtists();
  }));
  $('#search-form')?.addEventListener('submit', event => {
    event.preventDefault();
    if (!$$('[data-artist]').length) {
      location.href = 'default.html' + location.search;
      return;
    }
    filterArtists();
    $('#artists').scrollIntoView({block:'start', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
  $('[data-reset]')?.addEventListener('click', () => {
    $('#event-date').value = '2026-11-14'; $('#radius').value = '150'; filter = 'all';
    $$('[data-filter]').forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.filter === 'all')));
    filterArtists();
  });
  const frames = [
    ['portrait.jpg', 'Abigail Mensah', 'Gospel · Brampton', 'Portrait reference for fictional artist Abigail Mensah'],
    ['band.jpg', 'Hosanna Collective', 'Band · Mississauga', 'Recording instruments for Hosanna Collective'],
    ['elijah.jpg', 'Elijah Park', 'Acoustic · Markham', 'Portrait reference for fictional artist Elijah Park']
  ];
  let frame = 0;
  $$('[data-slide]').forEach(button => button.addEventListener('click', () => {
    frame = (frame + Number(button.dataset.slide) + frames.length) % frames.length;
    const [file, name, genre, alt] = frames[frame];
    const img = $('[data-hero-image]');
    if (!img) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) img.animate([{transform:'translateX(5%)',opacity:.35},{transform:'translateX(0)',opacity:1}], {duration:slideDuration(),easing:'ease-out'});
    img.src = '../../../assets/' + file; img.alt = alt;
    $('[data-hero-name]').textContent = name; $('[data-hero-genre]').textContent = genre;
    $('[data-slide-count]').textContent = `0${frame+1} / 03`;
    const link = $('[data-hero-link]');
    link.textContent = frame === 0 ? 'Meet Abigail ↗' : 'Save artist ♡';
    link.dataset.featured = name;
  }));
  $('[data-hero-link]')?.addEventListener('click', event => {
    const name = event.currentTarget.dataset.featured;
    if (name && name !== 'Abigail Mensah') { event.preventDefault(); saved.add(name); syncSaved(); announce(`${name} added to your shortlist.`); }
  });
  $('#booking-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const date = $('#booking-date').value;
    const status = $('#booking-feedback');
    if (date === '2026-11-15') {
      status.textContent = 'Abigail is unavailable on 15 November. Try 14 or 21 November.';
      $('#booking-date').setAttribute('aria-invalid','true');
      $('#booking-date').focus();
      return;
    }
    $('#booking-date').removeAttribute('aria-invalid');
    const formatted = new Date(date + 'T12:00:00').toLocaleDateString('en-CA',{month:'long',day:'numeric',year:'numeric'});
    status.textContent = `Demo request prepared for ${formatted}. Nothing was sent. In the live service, Abigail would receive your event details.`;
    status.focus();
  });
  $$('[data-preview]').forEach(button => button.addEventListener('click', () => {
    const panel = $('#preview-details'); panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    button.textContent = panel.hidden ? '▷ Preview performance' : 'Close preview';
  }));
})();
