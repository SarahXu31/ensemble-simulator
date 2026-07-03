import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { chatCompletion } from './util/llm';
import { PERSONA_DRIFT_BASE_MS, DEFAULT_TIME_SCALE, scaledRealMs } from './constants';
import { isKnownCharacter } from '../data/relationships';

// 改动5：收集每个角色的漂移输入 —— 原始人设 + 近期重要记忆(importance>6) + 关系快照。
export const driftInputs = internalQuery({
  args: { worldId: v.id('worlds'), sinceMs: v.number() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.sinceMs;
    const world = await ctx.db.get(args.worldId);
    if (!world) return [];

    const playerDescs = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
    const nameByPlayer = new Map(playerDescs.map((d) => [d.playerId, d.name] as const));

    const agentDescs = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
    const identityByAgent = new Map(agentDescs.map((d) => [d.agentId, d.identity] as const));

    const out: {
      name: string;
      identity: string;
      memories: string[];
      relationshipChanges: string;
    }[] = [];

    for (const agent of (world as any).agents ?? []) {
      const name = nameByPlayer.get(agent.playerId);
      const identity = identityByAgent.get(agent.id);
      if (!name || !identity || !isKnownCharacter(name)) continue;

      // 近期重要记忆（importance > 6，且发生在回看窗口内）。
      const mems = await ctx.db
        .query('memories')
        .withIndex('playerId', (q) => q.eq('playerId', agent.playerId))
        .collect();
      const memories = mems
        .filter((m) => m.importance > 6 && m._creationTime > cutoff)
        .sort((a, b) => b._creationTime - a._creationTime)
        .slice(0, 8)
        .map((m) => m.description);

      // 关系快照（作为「关系变化」的近似输入）。
      const rels = await ctx.db
        .query('relationships')
        .withIndex('byPair', (q) => q.eq('worldId', args.worldId).eq('fromName', name))
        .collect();
      const relationshipChanges =
        rels.map((r) => `对${r.toName}：好感${r.favor} 信任${r.trust} 戒备${r.tension}`).join('；') ||
        '暂无明显关系变化';

      out.push({ name, identity, memories, relationshipChanges });
    }
    return out;
  },
});

// 改动5：写入/更新角色的 personalityDrift（累积覆盖为最新一条变化描述）。
export const upsertDrift = internalMutation({
  args: { worldId: v.id('worlds'), name: v.string(), drift: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('personalityDrifts')
      .withIndex('byName', (q) => q.eq('worldId', args.worldId).eq('name', args.name))
      .unique();
    if (row) {
      await ctx.db.patch(row._id, { drift: args.drift, updatedAt: Date.now() });
    } else {
      await ctx.db.insert('personalityDrifts', {
        worldId: args.worldId,
        name: args.name,
        drift: args.drift,
        updatedAt: Date.now(),
      });
    }
  },
});

// 改动5：人设漂移。游戏启动后每现实 24 小时（8x 基准）自动触发一次（scheduler.runAfter）。
export const driftPersonality = internalAction({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, { worldId }) => {
    let scale = DEFAULT_TIME_SCALE;
    try {
      scale = await ctx.runQuery(internal.gameSettings.readTimeScaleInternal, { worldId });
      const windowMs = scaledRealMs(PERSONA_DRIFT_BASE_MS, scale);
      const inputs = await ctx.runQuery(internal.personalityDrift.driftInputs, {
        worldId,
        sinceMs: windowMs,
      });
      for (const it of inputs) {
        // 无近期经历则跳过，避免无意义调用。
        if (it.memories.length === 0) continue;
        const prompt =
          `角色原始人设：${it.identity}\n` +
          `近期经历：${it.memories.join('；')}\n` +
          `关系变化：${it.relationshipChanges}\n\n` +
          `请根据以上经历，对角色性格做一处微小调整，用一句话描述变化（20字以内）。\n` +
          `要求：\n` +
          `1. 只能是细微变化，不能改变角色核心性格\n` +
          `2. 变化要符合逻辑，有因果关系\n` +
          `3. 如果没有明显触发事件，回复"无变化"`;
        let content = '';
        try {
          const res = await chatCompletion({
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 80,
          });
          content = (res.content || '').trim();
        } catch (e) {
          console.error('driftPersonality llm failed for', it.name, e);
          continue;
        }
        // 返回「无变化」则跳过；否则写入 personalityDrift 字段。
        if (!content || content.includes('无变化')) continue;
        await ctx.runMutation(internal.personalityDrift.upsertDrift, {
          worldId,
          name: it.name,
          drift: content,
        });
      }
    } catch (e) {
      console.error('driftPersonality failed:', e);
    }
    // 改动6：按当前倍速换算间隔后自我续排。
    const interval = scaledRealMs(PERSONA_DRIFT_BASE_MS, scale);
    await ctx.scheduler.runAfter(interval, internal.personalityDrift.driftPersonality, { worldId });
  },
});
