// Reseed map mutation: re-apply data/gentle.js bgtiles/objmap to the live world
// without wiping agents or conversations. Run with: npx convex run reseed:reseedMap
import { mutation } from './_generated/server';
import { kickEngine } from './aiTown/main';
import * as map from '../data/gentle';

function isBlocked(x: number, y: number) {
  if (x < 0 || y < 0 || x >= map.mapwidth || y >= map.mapheight) {
    return true;
  }
  for (const layer of map.objmap) {
    if (layer[x][y] !== -1) {
      return true;
    }
  }
  return false;
}

function findNearestWalkable(startX: number, startY: number, occupied: Set<string>) {
  const queue: Array<[number, number]> = [[startX, startY]];
  const visited = new Set<string>([`${startX},${startY}`]);
  while (queue.length) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;
    if (!isBlocked(x, y) && !occupied.has(key)) {
      return { x, y };
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      const nkey = `${nx},${ny}`;
      if (visited.has(nkey) || nx < 0 || ny < 0 || nx >= map.mapwidth || ny >= map.mapheight) {
        continue;
      }
      visited.add(nkey);
      queue.push([nx, ny]);
    }
  }
  return null;
}

export const reseedMap = mutation({
  handler: async (ctx) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();
    if (!worldStatus) throw new Error('No default world found');
    const row = await ctx.db
      .query('maps')
      .withIndex('worldId', (q) => q.eq('worldId', worldStatus.worldId))
      .unique();
    if (!row) throw new Error('No map row for default world');
    await ctx.db.patch(row._id, {
      width: map.mapwidth,
      height: map.mapheight,
      tileSetUrl: map.tilesetpath,
      tileSetDimX: map.tilesetpxw,
      tileSetDimY: map.tilesetpxh,
      tileDim: map.tiledim,
      bgTiles: map.bgtiles,
      objectTiles: map.objmap,
      animatedSprites: map.animatedsprites,
    });

    const world = await ctx.db.get(worldStatus.worldId);
    if (!world) {
      throw new Error('No default world row found');
    }
    const occupied = new Set<string>();
    const relocated: Array<{ id: string; from: { x: number; y: number }; to: { x: number; y: number } }> = [];
    const players = world.players.map((player) => {
      const x = Math.floor(player.position.x);
      const y = Math.floor(player.position.y);
      const fallback = findNearestWalkable(x, y, occupied);
      if (!fallback) {
        throw new Error(`Failed to find walkable tile for ${player.id}`);
      }
      const next = {
        ...player,
        pathfinding: undefined,
        speed: 0,
        position: { x: fallback.x, y: fallback.y },
      };
      occupied.add(`${fallback.x},${fallback.y}`);
      if (fallback.x !== x || fallback.y !== y || isBlocked(x, y)) {
        relocated.push({ id: player.id, from: { x, y }, to: fallback });
      }
      return next;
    });
    await ctx.db.patch(world._id, { players });
    await kickEngine(ctx, worldStatus.worldId);

    return {
      ok: true,
      width: map.mapwidth,
      height: map.mapheight,
      tileSet: map.tilesetpath,
      relocated,
    };
  },
});
