from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / 'public' / 'assets' / 'fengmocun_mix'
RPG_PATH = ASSET_DIR / 'rpg_town' / 'town_rpg_pack' / 'graphics' / 'tiles-map.png'
EAST_PATH = ASSET_DIR / 'old_eastern.png'
OUT_TILESET = ASSET_DIR / 'fengmocun_mixed_tiles.png'
OUT_TMJ = ASSET_DIR / 'fengmocun_mixed.tmj'
OUT_PREVIEW = ASSET_DIR / 'fengmocun_mixed_preview.png'

MAP_W = 40
MAP_H = 40
TILE = 16
ATLAS_COLS = 40


def load_rpg():
    return Image.open(RPG_PATH).convert('RGBA')


def load_eastern_scaled():
    img = Image.open(EAST_PATH).convert('RGBA')
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0 or (r < 20 and g < 20 and b < 20) or (abs(r - 189) < 28 and abs(g - 110) < 38 and abs(b - 209) < 38):
                px[x, y] = (0, 0, 0, 0)
    return img.resize((img.width // 2, img.height // 2), Image.Resampling.NEAREST)


RPG = load_rpg()
EAST = load_eastern_scaled()
RPG_COLS = RPG.width // TILE


def crop_index(img, cols, idx):
    x = (idx % cols) * TILE
    y = (idx // cols) * TILE
    return img.crop((x, y, x + TILE, y + TILE))


def crop_rect(img, tx, ty, tw, th, flip=False):
    tile = img.crop((tx * TILE, ty * TILE, (tx + tw) * TILE, (ty + th) * TILE))
    if flip:
        tile = tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return tile


def split_region(img):
    w, h = img.size
    out = []
    for ty in range(h // TILE):
        for tx in range(w // TILE):
            out.append(img.crop((tx * TILE, ty * TILE, (tx + 1) * TILE, (ty + 1) * TILE)))
    return out


GRASS = [3, 4, 25, 26, 47, 48]
FLOWERS = [1, 2, 23, 24, 45, 46]
DIRT = 90
PATH_H = [154, 155, 156, 157, 158]
PATH_V = [134, 156, 178, 200]
POND = {'tl': 161, 't': 162, 'tr': 163, 'l': 183, 'c': 184, 'r': 185, 'bl': 205, 'b': 206, 'br': 207}
STREAM = [100, 122, 144]
CRATE = 140
CHEST = 139
SIGN = 138
FENCE = [220, 242, 264, 286]

bg = [[None for _ in range(MAP_W)] for _ in range(MAP_H)]
block = [[False for _ in range(MAP_W)] for _ in range(MAP_H)]


def set_tile(x, y, tile):
    if 0 <= x < MAP_W and 0 <= y < MAP_H:
        bg[y][x] = tile.copy()


def mark_block(x0, y0, w, h):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if 0 <= x < MAP_W and 0 <= y < MAP_H:
                block[y][x] = True


def grass_tile(x, y):
    idx = GRASS[(x * 7 + y * 11 + (x ^ y)) % len(GRASS)]
    tile = crop_index(RPG, RPG_COLS, idx)
    if (x * 13 + y * 17) % 19 == 0:
        tile = Image.alpha_composite(tile, crop_index(RPG, RPG_COLS, FLOWERS[(x + y) % len(FLOWERS)]))
    return tile


for y in range(MAP_H):
    for x in range(MAP_W):
        set_tile(x, y, grass_tile(x, y))

for x in range(2, 10):
    set_tile(x, 31, crop_index(RPG, RPG_COLS, DIRT))
for x in range(30, 37):
    set_tile(x, 6, crop_index(RPG, RPG_COLS, DIRT))
for y in range(5, 35):
    idx = PATH_V[(y - 5) % len(PATH_V)]
    set_tile(19, y, crop_index(RPG, RPG_COLS, idx))
    set_tile(20, y, crop_index(RPG, RPG_COLS, idx))
for x in range(7, 33):
    idx = PATH_H[(x - 7) % len(PATH_H)]
    set_tile(x, 19, crop_index(RPG, RPG_COLS, idx))
    set_tile(x, 20, crop_index(RPG, RPG_COLS, idx))
for y in range(17, 23):
    for x in range(17, 23):
        set_tile(x, y, crop_index(RPG, RPG_COLS, PATH_H[(x + y) % len(PATH_H)]))

pond_x, pond_y, pond_w, pond_h = 28, 7, 6, 5
for y in range(pond_h):
    for x in range(pond_w):
        tx, ty = pond_x + x, pond_y + y
        if y == 0 and x == 0:
            idx = POND['tl']
        elif y == 0 and x == pond_w - 1:
            idx = POND['tr']
        elif y == pond_h - 1 and x == 0:
            idx = POND['bl']
        elif y == pond_h - 1 and x == pond_w - 1:
            idx = POND['br']
        elif y == 0:
            idx = POND['t']
        elif y == pond_h - 1:
            idx = POND['b']
        elif x == 0:
            idx = POND['l']
        elif x == pond_w - 1:
            idx = POND['r']
        else:
            idx = POND['c']
        set_tile(tx, ty, crop_index(RPG, RPG_COLS, idx))
        block[ty][tx] = True
for y in range(12, 18):
    idx = STREAM[(y - 12) % len(STREAM)]
    set_tile(31, y, crop_index(RPG, RPG_COLS, idx))
    block[y][31] = True


def draw_well_tile(part):
    img = crop_index(RPG, RPG_COLS, 156).copy()
    d = ImageDraw.Draw(img)
    stone = (146, 134, 120, 255)
    dark = (98, 85, 72, 255)
    water = (79, 141, 154, 255)
    if part == 'tl':
        d.rectangle([2, 4, 15, 15], fill=stone)
        d.rectangle([5, 7, 15, 15], fill=water)
        d.line([2, 4, 15, 4], fill=dark, width=2)
        d.line([2, 4, 2, 15], fill=dark, width=2)
    elif part == 'tr':
        d.rectangle([0, 4, 13, 15], fill=stone)
        d.rectangle([0, 7, 10, 15], fill=water)
        d.line([0, 4, 13, 4], fill=dark, width=2)
        d.line([13, 4, 13, 15], fill=dark, width=2)
    elif part == 'bl':
        d.rectangle([2, 0, 15, 12], fill=stone)
        d.rectangle([5, 0, 15, 9], fill=water)
        d.line([2, 12, 15, 12], fill=dark, width=2)
        d.line([2, 0, 2, 12], fill=dark, width=2)
    else:
        d.rectangle([0, 0, 13, 12], fill=stone)
        d.rectangle([0, 0, 10, 9], fill=water)
        d.line([0, 12, 13, 12], fill=dark, width=2)
        d.line([13, 0, 13, 12], fill=dark, width=2)
    return img

for dx, part in enumerate(['tl', 'tr']):
    set_tile(19 + dx, 18, draw_well_tile(part))
for dx, part in enumerate(['bl', 'br']):
    set_tile(19 + dx, 19, draw_well_tile(part))
mark_block(19, 18, 2, 2)

set_tile(16, 18, crop_index(RPG, RPG_COLS, SIGN))
set_tile(15, 18, crop_index(RPG, RPG_COLS, CHEST))
set_tile(15, 19, crop_index(RPG, RPG_COLS, CRATE))
set_tile(22, 22, crop_index(RPG, RPG_COLS, CRATE))

for x in range(3, 11):
    set_tile(x, 28, crop_index(RPG, RPG_COLS, 220 + ((x - 3) % 2) * 22 if x < 10 else 286))
for y in range(29, 34):
    set_tile(3, y, crop_index(RPG, RPG_COLS, FENCE[min(y - 29, len(FENCE) - 1)]))
for x in range(4, 10):
    set_tile(x, 33, crop_index(RPG, RPG_COLS, 286))
for y in range(29, 33):
    for x in range(4, 10):
        set_tile(x, y, crop_index(RPG, RPG_COLS, DIRT if (x + y) % 2 else 90))

left_blue = crop_rect(EAST, 0, 2, 7, 6)
center_blue = crop_rect(EAST, 7, 0, 7, 8)
right_blue = crop_rect(EAST, 7, 0, 7, 8)
red_house = crop_rect(EAST, 0, 8, 7, 8)
red_house_flip = crop_rect(EAST, 0, 8, 7, 8, flip=True)
large_tree = crop_rect(EAST, 7, 8, 4, 8)


def place_region(tile_x, tile_y, region, block_mode='full'):
    w = region.width // TILE
    h = region.height // TILE
    tiles = split_region(region)
    i = 0
    for ry in range(h):
        for rx in range(w):
            tile = tiles[i]
            i += 1
            if tile.getbbox() is not None:
                base = bg[tile_y + ry][tile_x + rx]
                bg[tile_y + ry][tile_x + rx] = Image.alpha_composite(base, tile)
    if block_mode == 'full':
        mark_block(tile_x, tile_y, w, h)
    elif block_mode == 'footprint':
        mark_block(tile_x, tile_y + max(0, h - 3), w, min(3, h))
        if h > 4:
            mark_block(tile_x + 1, tile_y + h - 4, max(1, w - 2), 1)

place_region(7, 10, left_blue, block_mode='full')
place_region(22, 11, right_blue, block_mode='full')
place_region(16, 3, center_blue, block_mode='full')
place_region(6, 24, red_house, block_mode='full')
place_region(24, 24, red_house_flip, block_mode='full')
place_region(33, 18, large_tree, block_mode='full')

pine = crop_rect(RPG, 5, 1, 4, 4)
for tx, ty in [(2, 5), (34, 23), (9, 4), (11, 29)]:
    place_region(tx, ty, pine, block_mode='full')

for x, y in [(26, 13), (27, 14), (28, 15), (13, 17), (23, 16), (24, 17)]:
    set_tile(x, y, Image.alpha_composite(bg[y][x], crop_index(RPG, RPG_COLS, FLOWERS[(x + y) % len(FLOWERS)])))

preview = Image.new('RGBA', (MAP_W * TILE, MAP_H * TILE), (0, 0, 0, 0))
flat_tiles = []
for y in range(MAP_H):
    for x in range(MAP_W):
        tile = bg[y][x]
        flat_tiles.append(tile)
        preview.paste(tile, (x * TILE, y * TILE), tile)
preview.save(OUT_PREVIEW)

blocker = Image.new('RGBA', (TILE, TILE), (0, 0, 0, 0))
all_tiles = flat_tiles + [blocker]
atlas_rows = (len(all_tiles) + ATLAS_COLS - 1) // ATLAS_COLS
atlas = Image.new('RGBA', (ATLAS_COLS * TILE, atlas_rows * TILE), (0, 0, 0, 0))
for idx, tile in enumerate(all_tiles):
    ax = (idx % ATLAS_COLS) * TILE
    ay = (idx // ATLAS_COLS) * TILE
    atlas.paste(tile, (ax, ay), tile)
atlas.save(OUT_TILESET)

bg_data = [i + 1 for i in range(MAP_W * MAP_H)]
blocker_gid = len(flat_tiles) + 1
obj_data = [blocker_gid if block[y][x] else 0 for y in range(MAP_H) for x in range(MAP_W)]

tmj = {
    'compressionlevel': -1,
    'height': MAP_H,
    'infinite': False,
    'layers': [
        {'data': bg_data, 'height': MAP_H, 'id': 1, 'name': 'bgtiles', 'opacity': 1, 'type': 'tilelayer', 'visible': True, 'width': MAP_W, 'x': 0, 'y': 0},
        {'data': obj_data, 'height': MAP_H, 'id': 2, 'name': 'objmap', 'opacity': 1, 'type': 'tilelayer', 'visible': True, 'width': MAP_W, 'x': 0, 'y': 0},
    ],
    'nextlayerid': 3,
    'nextobjectid': 1,
    'orientation': 'orthogonal',
    'renderorder': 'right-down',
    'tiledversion': '1.10.2',
    'tileheight': TILE,
    'tilesets': [{
        'columns': ATLAS_COLS,
        'firstgid': 1,
        'image': OUT_TILESET.name,
        'imageheight': atlas.height,
        'imagewidth': atlas.width,
        'margin': 0,
        'name': 'fengmocun_mixed_tiles',
        'spacing': 0,
        'tilecount': atlas_rows * ATLAS_COLS,
        'tileheight': TILE,
        'tilewidth': TILE,
    }],
    'tilewidth': TILE,
    'type': 'map',
    'version': '1.10',
    'width': MAP_W,
}
OUT_TMJ.write_text(json.dumps(tmj, ensure_ascii=False, indent=2))
print('generated', OUT_TMJ)
print('atlas', OUT_TILESET, atlas.size)
print('preview', OUT_PREVIEW)
