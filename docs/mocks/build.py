"""Rebuild the ten static mock concepts from the shared, local asset kit."""
from pathlib import Path
import argparse
import json

ROOT = Path(__file__).resolve().parent
CONCEPTS = [
    ('spotlight','Spotlight','A little soul. A lot of <em>presence.</em>','Find the voice for your next gathering.','The stage is yours','Theatrical portrait / ivory / gold','Stage-inspired reveals and a sliding artist spotlight.'),
    ('cloud-nine','Cloud Nine','Good music.<br>Higher <em>spirits.</em>','Bring your people together, beautifully.','A little closer to heaven','Floating circles / sky blue / friendly character','A cloud companion celebrates your growing shortlist.'),
    ('encore','Encore','Find your<br>next <em>amen.</em>','Local voices. Unforgettable worship.','One more song','Horizontal photo rail / coral / bold typography','Slide between performers and save your favourites.'),
    ('halo','Halo','Make room<br>for <em>wonder.</em>','Extraordinary voices for ordinary Sundays.','Let the light in','Circular portrait / pearl / luminous lilac','A live WebGPU halo follows the pointer, with a static fallback.'),
    ('gather','Gather','A room.<br>A song.<br><em>Together.</em>','Worship starts with people. Find yours.','Made for your people','Asymmetric collage / warm paper / illustrated host','A friendly host tracks three voices on your shortlist.'),
    ('constellation','Constellation','Your people.<br>Your <em>stars.</em>','Discover a constellation of local voices.','Every voice belongs','Orbiting portraits / violet / fine star paths','Build a saved constellation beneath subtle WebGPU starlight.'),
    ('sunday-paper','Sunday Paper','For the love<br>of <em>the song.</em>','Good voices. Good company. Gather here.','The Sunday edition · No. 01','Editorial columns / monochrome / generous margins','Quiet image zoom and crisp, deliberate micro-interactions.'),
    ('joy-club','Joy Club','Less planning.<br>More <em>praise.</em>','Meet the voices that move your people.','Everybody, sing','Rounded tiles / citrus / musical mascot','A musical character cheers on your personal shortlist.'),
    ('reverie','Reverie','Let the room<br><em>exhale.</em>','Beautiful worship, a little closer to home.','Music for the moment','Panoramic photo / sage / linen','A slow-feeling composition with user-controlled photo slides.'),
    ('headliner','Headliner','A voice worth<br><em>gathering for.</em>','Your next worship night starts here.','Tonight, together','Oversized feature / backstage typography / vermilion','Switch the stage and collect artists for your gathering.'),
]
STATES = ['default','loading','empty','error']
ARTISTS = [
 ('Abigail Mensah','Gospel · Brampton',650,'portrait','solo gospel hymns',45),
 ('Hosanna Collective','Band · Mississauga',1800,'band','band',30),
 ('Elijah Park','Acoustic · Markham',350,'elijah','acoustic hymns',35),
 ('Luz Viva','Spanish & English · North York',900,'stage','spanish band',20),
 ('Grace Tabernacle Choir','Gospel choir · Scarborough',2400,'crowd','choir gospel',35),
 ('Daniel & Ruth','Acoustic duo · Ajax',700,'guitar','acoustic hymns',65),
]

def photo(name, alt='', extra=''):
    return f'<img src="../../../assets/{name}.jpg" alt="{alt}" {extra}>'

def character(kind):
    body = '<path class="body" d="M22 82C-2 57 19 31 42 40C48 6 88 9 96 36C129 22 150 55 131 76C132 99 104 114 85 99C62 120 31 110 22 82Z"/>' if kind=='cloud-nine' else '<path class="body" d="M29 29Q72 5 115 31L126 101Q76 137 18 105Z"/>'
    return f'<div class="character" aria-hidden="true"><svg viewBox="0 0 150 150">{body}<circle class="eye" cx="59" cy="61" r="4"/><circle class="eye" cx="87" cy="61" r="4"/><path class="face" d="M61 79Q75 94 89 79M31 108L22 129M109 109L123 130M21 65L5 53M124 64L143 45"/></svg></div>'

def header():
    return '''<header class="topbar shell"><a class="brand" href="../discover/default.html"><span class="brand-mark" aria-hidden="true">✳</span> zamaro</a><nav class="nav" aria-label="Primary"><a href="../discover/default.html">Discover</a><a href="#how">How it works</a></nav><div class="actions"><button class="plain" data-panel="saved-panel" aria-controls="saved-panel" aria-expanded="false">Saved <span data-saved-count>0</span></button><button class="icon-button" data-panel="account-panel" aria-controls="account-panel" aria-expanded="false" aria-label="Naomi’s account">NF</button></div></header><section id="saved-panel" class="inline-panel shell" hidden><h2>Your shortlist</h2><p id="saved-empty">Save a voice that feels right for your gathering.</p><ul id="saved-list"></ul></section><section id="account-panel" class="inline-panel shell" hidden><h2>Hello, Naomi.</h2><p>Riverside Community Church · Burlington</p><p class="mock-note">Account editing is outside this two-page concept.</p></section>'''

def search():
    filters=[('all','All voices'),('band','Band'),('solo','Solo vocalist'),('choir','Gospel choir'),('acoustic','Acoustic'),('hymns','Hymns'),('spanish','Spanish'),('budget','Under $800')]
    return '''<form class="search" id="search-form"><label><span>Your event date</span><input id="event-date" type="date" value="2026-11-14" min="2026-10-09" required></label><label><span>Where you gather</span><input id="location" value="Toronto" required></label><label><span>Driving distance</span><select id="radius"><option value="50">Within 50 km</option><option value="100" selected>Within 100 km</option><option value="150">Within 150 km</option></select></label><button class="primary" type="submit">Find your artist <span aria-hidden="true">↗</span></button></form><div class="filters" aria-label="Artist styles">''' + ''.join(f'<button class="chip" data-filter="{key}" aria-pressed="{str(key=="all").lower()}">{name}</button>' for key,name in filters) + '</div>'

def cards():
    html=[]
    for i,(name,style,price,img,tags,distance) in enumerate(ARTISTS):
        image=photo(img, f'Visual reference for {name}')
        image=f'<a class="card-image" href="../artist/default.html" aria-label="View Abigail Mensah’s profile">{image}</a>' if i==0 else f'<div class="card-image">{image}</div>'
        title='<a href="../artist/default.html">Abigail Mensah</a>' if i==0 else name
        html.append(f'<article class="artist-card" data-artist="{name}" data-tags="{tags}" data-price="{price}" data-distance="{distance}">{image}<button class="save" data-save="{name}" aria-pressed="false" aria-label="Save {name}">♡</button><div class="card-meta"><div><h3>{title}</h3><p>{style}</p></div><div class="price">${price:,}<small>from · CAD</small></div></div></article>')
    return '<div class="artist-grid">'+''.join(html)+'</div>'

def empty(live=False):
    attr='id="live-empty" hidden' if live else ''
    action='<button class="plain" data-reset>Try 14 Nov · widen radius</button>' if live else '<a class="plain" href="default.html">Try Saturday 21 Nov ↗</a><a href="default.html">Widen to 150 km</a>'
    return f'<div class="empty-panel" {attr}><span class="empty-symbol" aria-hidden="true">✳</span><h2>A little further.<br>A different day.</h2><p>No artists are free for this search. A nearby date or a wider radius may be just right.</p>{action}</div>'

def error(page):
    return f'<div class="empty-panel" role="alert"><span class="empty-symbol" aria-hidden="true">↻</span><h2>Let’s try that again.</h2><p>We couldn’t load {"these artists" if page=="discover" else "this artist profile"}. Your event details are still here.</p><a class="plain" href="default.html">Retry</a></div>'

def skeletons():
    return cards().replace('class="artist-grid"','class="artist-grid" aria-busy="true" aria-label="Loading artists" inert').replace('data-artist=','data-loading-artist=').replace('class="card-image"','class="card-image skeleton"').replace('class="card-meta"','class="card-meta skeleton-meta"')

def hero(c):
    slug,name,title,lead,kicker,*_=c
    mascot=character(slug) if slug in ['cloud-nine','gather','joy-club'] else ''
    gpu='<canvas class="gpu" aria-hidden="true"></canvas><button class="plain motion-toggle" data-motion aria-pressed="false">Pause glow</button>' if slug in ['halo','constellation'] else ''
    extra = '<div class="satellite satellite-one">'+photo('elijah','Portrait reference for Elijah Park')+'</div><div class="satellite satellite-two">'+photo('band','Instruments at a recording session')+'</div>' if slug in ['gather','constellation'] else ''
    progress='<p class="trail" data-progress>0 / 3 voices on your shortlist</p>' if slug in ['gather','joy-club','constellation'] else ''
    return f'''<section class="hero"><div class="hero-copy"><span class="eyebrow">{kicker}</span><h1>{title}</h1><p>{lead}</p><p class="hero-location">Christian worship artists · Toronto & beyond</p>{progress}</div><div class="hero-art"><figure class="hero-photo">{photo('portrait','Portrait reference for Abigail Mensah','data-hero-image')}<figcaption class="photo-caption"><div><strong data-hero-name>Abigail Mensah</strong><small data-hero-genre>Gospel · Brampton</small></div><a href="../artist/default.html" data-hero-link>Meet Abigail ↗</a></figcaption>{gpu}</figure><span class="orbit-label">✦ A voice for your gathering</span><span class="hero-number" aria-hidden="true">01</span>{mascot}{extra}</div><div class="hero-controls"><button class="icon-button" data-slide="-1" aria-label="Previous featured artist">←</button><button class="icon-button" data-slide="1" aria-label="Next featured artist">→</button><span data-slide-count aria-live="polite">01 / 03</span></div></section>'''

def discover(c,state):
    content=cards()+empty(True) if state=='default' else skeletons() if state=='loading' else empty() if state=='empty' else error('discover')
    search_html=search().replace('value="2026-11-14"', 'value="2026-11-15"') if state=='empty' else search()
    return hero(c)+search_html+f'<section id="artists"><div class="section-head"><div><h2>Find your kind of worship.</h2><p id="result-count">{"Looking for your voices…" if state=="loading" else "6 artists available · within 100 km of Toronto" if state=="default" else "Your search · Sunday 15 November" if state=="empty" else "Your search · Saturday 14 November"}</p></div><span class="trail">LOCAL VOICES / BIG HEART</span></div>{content}</section>'

def artist(c,state):
    base='<a class="back" href="../discover/default.html">← Back to discovering</a>'
    if state=='error':
        return base+'<section class="profile-copy"><h1>Abigail Mensah</h1></section>'+error('artist')
    if state=='loading':
        return artist(c,'default').replace('class="profile-hero"','class="profile-hero loading-profile" aria-busy="true" aria-label="Loading artist profile"').replace('class="profile-detail"','class="profile-detail loading-profile" aria-busy="true"')
    media = '<div class="empty-panel"><h3>The first song is still to come.</h3><p>No videos yet. Ask Abigail about a sample when you request a date.</p></div>' if state=='empty' else f'''<div class="media">{photo('vocalist','Microphone on stage')}<button class="plain" data-preview aria-expanded="false" aria-controls="preview-details">▷ Preview performance</button></div><div id="preview-details" class="status" hidden><strong>A moment of worship</strong><p>Performance preview concept: a live acoustic rendition of Amazing Grace.</p><p class="mock-note">No licensed artist recording was supplied. This panel demonstrates the preview interaction; it does not play a recording.</p></div>'''
    review='<p>No church reviews yet. Your gathering could begin a lovely story.</p>' if state=='empty' else '<blockquote>“She made a room of strangers feel like one church.”<cite>Tomi Oduya · Harvest Point Church, Milton</cite></blockquote>'
    return base+f'''<section class="profile-hero"><div class="profile-visual">{photo('portrait','Portrait reference for fictional artist Abigail Mensah')}<button class="save" data-save="Abigail Mensah" aria-label="Save Abigail Mensah" aria-pressed="false">♡</button><span class="orbit-label">Gospel with heart.</span></div><div class="profile-copy"><span class="eyebrow">Solo vocalist · Brampton</span><h1>Abigail<br><em>Mensah.</em></h1><p class="rating">{"New to Zamaro" if state=='empty' else '★ 4.9 · 38 church reviews'}</p><p>A soulful voice. A generous spirit. Abigail brings gospel, familiar hymns and contemporary worship to every room.</p><form class="booking" id="booking-form"><div class="booking-top"><div><strong>$650</strong> <small>from · CAD / gathering</small></div><span class="trail">LET’S GATHER</span></div><div class="booking-row"><label><span>Your gathering date</span><input id="booking-date" type="date" value="2026-11-14" min="2026-10-09" aria-describedby="booking-feedback" required></label><button class="primary" type="submit">Request to book ↗</button></div><small>Share a date. Start a conversation.</small><div id="booking-feedback" class="status" role="status" tabindex="-1"></div></form></div></section><section class="profile-detail"><div><h2>A little of the feeling.</h2>{media}</div><div><h2>Songs you know by heart.</h2><ul class="song-list"><li>Amazing Grace <span>Hymn</span></li><li>Goodness of God <span>Contemporary</span></li><li>How Great Thou Art <span>Hymn</span></li></ul><h2>From the congregation.</h2>{review}</div></section><section class="profile-detail"><div class="media">{photo('stage','Lights over a live music gathering')}</div><div><span class="eyebrow">Room for every voice</span><h2>Small chapel.<br>Full heart.</h2><p>Available for Sunday services, worship nights and community gatherings across the Greater Toronto Area.</p></div></section>'''

def footer():
    return '''<section class="how" id="how"><h2>Less admin.<br>More amen.</h2><ol><li>Find your voice.</li><li>Share your date.</li><li>Gather together.</li></ol><span aria-hidden="true">✳</span></section><div id="feedback" class="status" role="status" aria-live="polite"></div><footer><a class="brand" href="../discover/default.html">zamaro</a><span>Made for the moments we share.</span><button class="plain" data-panel="artist-info" aria-expanded="false" aria-controls="artist-info">Are you an artist? ↗</button></footer><section class="inline-panel" id="artist-info" hidden><h2>Bring your voice.</h2><p>Share your music with churches across Toronto and the GTA.</p><p class="mock-note">Artist sign-up is outside these two mocked pages.</p></section>'''

def page(c,screen,state):
    slug,name,*_=c
    content=discover(c,state) if screen=='discover' else artist(c,state)
    links=''.join(f'<a href="{s}.html"'+(' aria-current="page"' if state==s else '')+f'>{s}</a>' for s in STATES)
    gpu='<script src="../../../assets/gpu.js"></script>' if slug in ['halo','constellation'] and screen=='discover' else ''
    return f'''<!doctype html>
<html lang="en" data-concept="{slug}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{name} · {screen.title()} · {state} — Zamaro</title><meta name="mock:kind" content="page"><meta name="mock:screen" content="{screen}"><meta name="mock:state" content="{state}"><meta name="description" content="Zamaro {name}, {screen} concept in its {state} state."><link rel="stylesheet" href="../../assets/tokens.css"><link rel="stylesheet" href="../../assets/ui.css"><link rel="stylesheet" href="../../assets/mock.css"></head><body><a class="skip-link" href="#main">Skip to content</a>{header()}<main id="main" class="shell">{content}{footer()}<p class="mock-note">{name} / {screen} / {state}. Fictional artists and reviews; reference imagery does not identify the artists. Local demo only. Press T to switch theme.</p></main><nav class="mock-bar" aria-label="Mock navigation"><a href="../../index.html">{name}</a><a href="../../../index.html">All concepts</a>{links}<button data-theme-toggle>◐ Theme</button></nav><script src="../../../assets/mock.js"></script>{gpu}</body></html>'''

def build(only=None):
    for c in CONCEPTS:
        slug,name,*_=c
        if only and slug!=only: continue
        root=ROOT/slug
        (root/'assets').mkdir(parents=True,exist_ok=True)
        (root/'assets'/'tokens.css').write_text(f'@import url("../../assets/tokens.css");\n@import url("../../assets/concepts.css");\n',encoding='utf-8')
        (root/'assets'/'ui.css').write_text('@import url("../../assets/ui.css");\n@import url("../../assets/layouts.css");\n',encoding='utf-8')
        (root/'assets'/'mock.css').write_text('/* Mock chrome is shared in the collection UI kit. */\n',encoding='utf-8')
        manifest={'project':f'Zamaro — {name}','screens':[{'id':s,'kind':'page','title':'Discover artists' if s=='discover' else 'Artist profile','route':'/' if s=='discover' else '/artists/abigail-mensah','states':STATES} for s in ['discover','artist']]}
        (root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
        (root/'README.md').write_text(f'''# Zamaro — {name}

{c[5]}. {c[6]}

## Cast and catalog

Today: 9 October 2026. Default gathering: 14 November 2026, Toronto, within 100 km.
Booker: Naomi Fraser, Riverside Community Church, Burlington. Featured artist: Abigail Mensah,
gospel vocalist, Brampton, from CAD $650. Supporting artists and prices are shared across all concepts.
All artists, churches, availability, distances and reviews are fictional. Photography is visual reference only.

## Review

Open `index.html` from disk. Use `?theme=dark` or `?chrome=0`; T switches theme.
The eight views cover two pages in four states. Theme and responsive variants are runtime styles.
See [collection README](../README.md) for imagery provenance, interaction scope and validation.

## Open questions and assumptions

- Only Discover and Artist profile are in scope; no extra account, payment or sign-up pages.
- Empty artist means no videos or reviews yet; bio, photos and booking remain available.
- Only Abigail has a profile mock; other artists can be saved without misleading profile links.
- 15 November has no fixture availability; 14 and 21 November demonstrate available dates.
- Requests show local feedback only. No deposit, fee or confirmation policy is implied.
- Progressive scripts are included to demonstrate the motion and interactions explicitly requested.

## Commands

From the project root:

```powershell
python .agents/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks/concepts/{slug} --write
python .agents/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks/concepts/{slug}
```
''',encoding='utf-8')
        for screen in ['discover','artist']:
            (root/'pages'/screen).mkdir(parents=True,exist_ok=True)
            for state in STATES:
                (root/'pages'/screen/f'{state}.html').write_text(page(c,screen,state),encoding='utf-8')
        print(f'{name}: 2 pages, 8 state files')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--concept')
    args=parser.parse_args()
    build(args.concept)
