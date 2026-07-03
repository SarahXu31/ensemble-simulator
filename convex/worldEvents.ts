import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';
import { MutationCtx } from './_generated/server';
import { WORLD_EVENT_PRESETS } from './worldEventsPresets';
// 改动2/6：按现实毫秒 + 当前倍速换算触发时间。
import { scaledRealMs } from './constants';
import { readTimeScale, ensureBackgroundJobs } from './gameSettings';

// 计算某世界「开局至今经过的现实毫秒数」。以 worldStatus 的创建时间为世界起点。
async function currentElapsedMs(ctx: MutationCtx, worldId: Id<'worlds'>): Promise<number> {
  const worldStatus = await ctx.db
    .query('worldStatus')
    .withIndex('worldId', (q) => q.eq('worldId', worldId))
    .unique();
  const startedAt = worldStatus?._creationTime ?? Date.now();
  return Math.max(0, Date.now() - startedAt);
}

// 播种预设大事件（幂等：已存在则跳过）。
// 改动2：写入 triggerMs；若检测到旧数据（无 triggerMs 字段）则清空重播，完成迁移。
async function ensureSeeded(ctx: MutationCtx, worldId: Id<'worlds'>): Promise<number> {
  const existing = await ctx.db
    .query('worldEvents')
    .withIndex('worldId_triggered', (q) => q.eq('worldId', worldId))
    .collect();
  if (existing.length > 0) {
    const stale = existing.some((e) => e.triggerMs === undefined);
    if (!stale) return 0;
    // 旧数据迁移：删除后按新的 triggerMs 预设重播。
    for (const e of existing) {
      await ctx.db.delete(e._id);
    }
  }
  for (const preset of WORLD_EVENT_PRESETS) {
    await ctx.db.insert('worldEvents', {
      worldId,
      triggerMs: preset.triggerMs,
      title: preset.title,
      description: preset.description,
      kind: preset.kind,
      triggered: false,
      affectedRoles: preset.affectedRoles,
    });
  }
  return WORLD_EVENT_PRESETS.length;
}

// 把某世界到点且未触发的事件置为已触发。返回触发数。
async function triggerForWorld(ctx: MutationCtx, worldId: Id<'worlds'>) {
  await ensureSeeded(ctx, worldId);
  const elapsed = await currentElapsedMs(ctx, worldId);
  // 改动6：按当前倍速换算每个事件的等效触发现实时长。
  const scale = await readTimeScale(ctx, worldId);
  const pending = await ctx.db
    .query('worldEvents')
    .withIndex('worldId_triggered', (q) => q.eq('worldId', worldId).eq('triggered', false))
    .collect();
  let count = 0;
  const now = Date.now();
  for (const ev of pending) {
    const base = ev.triggerMs ?? 0;
    if (elapsed >= scaledRealMs(base, scale)) {
      await ctx.db.patch(ev._id, { triggered: true, triggeredAt: now });
      count++;
    }
  }
  return { elapsed, scale, triggered: count };
}

// 为某个世界播种预设大事件（外部/手动调用）。
export const seedWorldEvents = internalMutation({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const seeded = await ensureSeeded(ctx, args.worldId);
    return { seeded };
  },
});

// 前端用：返回某世界的全部大事件；已触发的按 triggeredAt 升序排在前。
export const listWorldEvents = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query('worldEvents')
      .withIndex('worldId_triggered', (q) => q.eq('worldId', args.worldId))
      .collect();
    const triggered = all
      .filter((e) => e.triggered)
      .sort((a, b) => (a.triggeredAt ?? 0) - (b.triggeredAt ?? 0));
    const pending = all
      .filter((e) => !e.triggered)
      .sort((a, b) => (a.triggerMs ?? 0) - (b.triggerMs ?? 0));
    return { triggered, pending };
  },
});

// 定时器/手动调用：把到点且未触发的事件置为已触发。
export const checkAndTriggerEvents = internalMutation({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    return await triggerForWorld(ctx, args.worldId);
  },
});

// 定时器入口：遍历所有 running 世界逐个检查。由 crons.ts 每分钟调用。
export const worldEventTicker = internalMutation({
  args: {},
  handler: async (ctx) => {
    const worlds = await ctx.db.query('worldStatus').collect();
    let total = 0;
    for (const ws of worlds) {
      if (ws.status === 'running') {
        const { triggered } = await triggerForWorld(ctx, ws.worldId);
        total += triggered;
        // 改动4/5：确保关系打分、人设漂移的后台定时任务已启动（幂等，仅首次排期）。
        await ensureBackgroundJobs(ctx, ws.worldId);
      }
    }
    return { total };
  },
});
