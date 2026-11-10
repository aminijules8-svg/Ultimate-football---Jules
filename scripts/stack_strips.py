# Stack clip strips (scripts/clipsheet.mjs output) into one review image: python3 scripts/stack_strips.py <dir> <tag> <out.png> clip1,clip2,...
import sys
from PIL import Image
d, tag, out, names = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].split(',')
ims = [Image.open(f'{d}/{tag}-{n}.png').crop((0, 0, 1500, 330)).resize((900, 198)) for n in names]
sheet = Image.new('RGB', (900, sum(i.height for i in ims)))
y = 0
for im in ims:
    sheet.paste(im, (0, y)); y += im.height
sheet.save(out)
