import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { insertInput } from './aiTown/insertInput';
import { characters } from '../data/characters';

// ─── Queries ───────────────────────────────────────────────────────────────────

export const listProfiles = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query('characterProfiles')
      .withIndex('worldId_slot', (q) => q.eq('worldId', args.worldId))
      .collect();
    return profiles.sort((a, b) => a.slotIndex - b.slotIndex);
  },
});

export const hasProfiles = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query('characterProfiles')
      .withIndex('worldId_slot', (q) => q.eq('worldId', args.worldId))
      .collect();
    return profiles.length >= 2;
  },
});

// ─── Mutations ─────────────────────────────────────────────────────────────────

export const saveProfiles = mutation({
  args: {
    worldId: v.id('worlds'),
    profiles: v.array(
      v.object({
        slotIndex: v.number(),
        name: v.string(),
        gender: v.string(),
        age: v.optional(v.string()),
        personality: v.string(),
        quirk: v.string(),
        catchphrase: v.optional(v.string()),
        hobbies: v.string(),
        dislikes: v.string(),
        desire: v.string(),
        secret: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // 先删除该世界的全部 profile
    const existing = await ctx.db
      .query('characterProfiles')
      .withIndex('worldId_slot', (q) => q.eq('worldId', args.worldId))
      .collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }
    // 写入新的 profiles
    const now = Date.now();
    for (const p of args.profiles) {
      await ctx.db.insert('characterProfiles', {
        worldId: args.worldId,
        slotIndex: p.slotIndex,
        name: p.name,
        gender: p.gender,
        age: p.age,
        personality: p.personality,
        quirk: p.quirk,
        catchphrase: p.catchphrase,
        hobbies: p.hobbies,
        dislikes: p.dislikes,
        desire: p.desire,
        secret: p.secret,
        updatedAt: now,
      });
    }
  },
});

export const applyProfilesToWorld = mutation({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) throw new Error(`Invalid world ID: ${args.worldId}`);

    const profiles = await ctx.db
      .query('characterProfiles')
      .withIndex('worldId_slot', (q) => q.eq('worldId', args.worldId))
      .collect();

    // 获取当前世界已有的玩家名单
    const existingNames = new Set(world.players.map((p: any) => p.name));

    // TODO(Phase 3 v2): 实现"替换"模式——先清空现有非人类 player 再重建。
    // 当前第一版只做增量：只对名字还没在世界里存在的 profile 调 create。
    for (const profile of profiles) {
      if (existingNames.has(profile.name)) continue;

      const character = characters[Math.floor(Math.random() * characters.length)].name;

      // 构造描述文本
      const parts: string[] = [];
      const genderWord = profile.gender === '不限' ? '' : `（${profile.gender}）`;
      parts.push(`${profile.name}${genderWord}是风莫村的一位村民。性情${profile.personality}。`);
      if (profile.quirk) parts.push(`有个怪癖：${profile.quirk}。`);
      if (profile.catchphrase) parts.push(`口头禅是"${profile.catchphrase}"。`);
      if (profile.hobbies) parts.push(`平日爱好${profile.hobbies}。`);
      if (profile.dislikes) parts.push(`最讨厌${profile.dislikes}。`);
      if (profile.desire) parts.push(`\n【渴望】${profile.desire}`);
      if (profile.secret) parts.push(`\n【秘密】${profile.secret}`);
      parts.push('\n（秘密是你心底的事，除非极度信任对方，否则绝不会说出口。）');
      const description = parts.join('');

      await insertInput(ctx, args.worldId, 'join', {
        name: profile.name,
        character,
        description,
      });
    }
  },
});
