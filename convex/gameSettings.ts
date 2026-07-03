import { v } from 'convex/values';
import { MutationCtx, internalQuery, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel';
import {
  DEFAULT_TIME_SCALE,
  TIME_SCALE_PRESETS,
  RELATION_SCORING_BASE_MS,
  PERSONA_DRIFT_BASE_MS,
  scaledRealMs,
} from './constants';

// 改动6：读取某世界当前时间倍速（无记录时返回默认 8x）。供后端换算使用。
export async function readTimeScale(ctx: MutationCtx, worldId: Id<'worlds'>): Promise<number> {
  const row = await ctx.db
    .query('gameSettings')
    .withIndex('worldId', (q) => q.eq('worldId', worldId))
    .unique();
  return row?.timeScale ?? DEFAULT_TIME_SCALE;
}

async function getOrCreateSettingsRow(ctx: MutationCtx, worldId: Id<'worlds'>) {
  const row = await ctx.db
    .query('gameSettings')
    .withIndex('worldId', (q) => q.eq('worldId', worldId))
    .unique();
  if (row) return row;
  const id = await ctx.db.insert('gameSettings', {
    worldId,
    timeScale: DEFAULT_TIME_SCALE,
    updatedAt: Date.now(),
  });
  return (await ctx.db.get(id))!;
}

// 改动4/5/6：确保关系打分、人设漂移的后台定时任务已启动（幂等，避免重复排期）。
// 首次调用时按当前倍速换算间隔并用 scheduler.runAfter 排下一次；任务内部会自我续排。
export async function ensureBackgroundJobs(ctx: MutationCtx, worldId: Id<'worlds'>) {
  const row = await getOrCreateSettingsRow(ctx, worldId);
  const scale = row.timeScale ?? DEFAULT_TIME_SCALE;
  if (!row.scoringStarted) {
    await ctx.scheduler.runAfter(
      scaledRealMs(RELATION_SCORING_BASE_MS, scale),
      internal.relationshipScoring.scoreRelationships,
      { worldId },
    );
    await ctx.db.patch(row._id, { scoringStarted: true, updatedAt: Date.now() });
  }
  if (!row.driftStarted) {
    await ctx.scheduler.runAfter(
      scaledRealMs(PERSONA_DRIFT_BASE_MS, scale),
      internal.personalityDrift.driftPersonality,
      { worldId },
    );
    await ctx.db.patch(row._id, { driftStarted: true, updatedAt: Date.now() });
  }
}

// 前端：读取当前倍速。
export const getTimeScale = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('gameSettings')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .unique();
    return row?.timeScale ?? DEFAULT_TIME_SCALE;
  },
});

// 前端：设置倍速（改动6）。仅接受预设档位，写入后即时生效于后端换算。
export const setTimeScale = mutation({
  args: { worldId: v.id('worlds'), timeScale: v.number() },
  handler: async (ctx, args) => {
    const scale = (TIME_SCALE_PRESETS as readonly number[]).includes(args.timeScale)
      ? args.timeScale
      : DEFAULT_TIME_SCALE;
    const row = await getOrCreateSettingsRow(ctx, args.worldId);
    await ctx.db.patch(row._id, { timeScale: scale, updatedAt: Date.now() });
    return { timeScale: scale };
  },
});

// 供 internalAction 读取倍速（关系打分/人设漂移的自我续排用）。
export const readTimeScaleInternal = internalQuery({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('gameSettings')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .unique();
    return row?.timeScale ?? DEFAULT_TIME_SCALE;
  },
});
