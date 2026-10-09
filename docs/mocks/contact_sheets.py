"""Build compact visual review sheets from the skill's screenshot output."""
from PIL import Image, ImageDraw, ImageOps
from build import ROOT, CONCEPTS, STATES

out=ROOT/'.cache'/'contact-sheets'
out.mkdir(parents=True,exist_ok=True)
for slug,*_ in CONCEPTS:
    for screen in ['discover','artist']:
        sheet=Image.new('RGB',(1200,1840),'#e9e9e9')
        draw=ImageDraw.Draw(sheet)
        for row,state in enumerate(STATES):
            for col,(viewport,theme) in enumerate((v,t) for v in ['360x800','768x1024','1280x800'] for t in ['light','dark']):
                path=ROOT/'.cache'/'screenshots'/f'{slug}__pages__{screen}__{state}--{viewport}--{theme}.png'
                if not path.exists():continue
                image=Image.open(path).convert('RGB')
                image.thumbnail((194,429))
                x=col*200+(200-image.width)//2;y=row*460
                draw.text((col*200+5,y+3),f'{state} / {viewport} / {theme}',fill='black')
                sheet.paste(image,(x,y+23))
        sheet.save(out/f'{slug}-{screen}.jpg',quality=90)
print(f'20 contact sheets in {out}')
