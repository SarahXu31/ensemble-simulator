import { v } from 'convex/values';
import { internalAction, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { chatCompletion } from './util/llm';
import { RELATION_SCORING_BASE_MS, DEFAULT_TIME_SCALE, scaledRealMs } from './constants';
import { isKnownCharacter } from '../data/relationships';

// 改动4：取「过去一段时间」内所有角色间的对话记录，按对话分组拼成文本。
// sinceMs 为回看窗口（按倍速换算后的现实毫秒），窗口与打分间隔一致。
export const recentConversations = internalQuery({
  args: { worldId: v.id('worlds'), sinceMs: v.number() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.sinceMs;
    // messages 表无「时间」索引，这里全量拉取后在内存中按时间过滤（村庄规模下可接受）。
    const all = await ctx.db
      .query('messages')
      .withIndex('conversationId', (q) => q.eq('worldId', args.worldId))
      .collect();
    const recent = all.filter((m) => m._creationTime > cutoff);
    if (recent.length === 0) return { text: '' };

    const descs = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
    const nameByPlayer = new Map(descs.map((d) => [d.playerId, d.name] as const));

    // 按对话分组，保留时间顺序。
    const byConv = new Map<string, { name: string; text: string }[]>();
    recent
      .sort((a, b) => a._creationTime - b._creationTime)
      .forEach((m) => {
        const name = nameByPlayer.get(m.author);
        if (!name) return;
        const list = byConv.get(m.conversationId) ?? [];
        list.push({ name, text: m.text });
        byConv.set(m.conversationId, list);
      });

    let idx = 0;
    const blocks: string[] = [];
    for (const [, msgs] of byConv) {
      idx++;
      const body = msgs.map((m) => `${m.name}：${m.text}`).join('\n');
      blocks.push(`【对话${idx}】\n${body}`);
    }
    return { text: blocks.join('\n\n') };
  },
});

// 从 LLM 返回内容中解析关系变化数组，clamp 到 -5~+5，仅保留预设角色。
function parseScoreArray(
  content: string,
): { from: string; to: string; favor: number; trust: number; tension: number }[] {
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return [];
    const clamp = (x: any) => Math.max(-5, Math.min(5, Math.round(Number(x) || 0)));
    return arr
      .filter((it) => it && isKnownCharacter(it.from) && isKnownCharacter(it.to))
      .map((it) => ({
        from: String(it.from),
        to: String(it.to),
        favor: clamp(it.favor),
        trust: clamp(it.trust),
        tension: clamp(it.tension),
      }));
  } catch {
    return [];
  }
}

// 改动4：关系值 LLM 打分。游戏启动后每现实 8 小时（8x 基准）自动触发一次，
// 触发机制用 scheduler.runAfter（见 gameSettings.ensureBackgroundJobs 首次排期 + 本函数自我续排）。
export const scoreRelationships = internalAction({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, { worldId }) => {
    let scale = DEFAULT_TIME_SCALE;
    try {
      scale = await ctx.runQuery(internal.gameSettings.readTimeScaleInternal, { worldId });
      const windowMs = scaledRealMs(RELATION_SCORING_BASE_MS, scale);
      const { text } = await ctx.runQuery(internal.relationshipScoring.recentConversations, {
        worldId,
        sinceMs: windowMs,
      });
      if (text.trim()) {
        // 批量构造 prompt，一次请求评估所有关系对的变化。
        const prompt =
          `根据以下对话，评估每对角色的关系变化，返回 JSON：\n` +
          `[{"from": "角色A", "to": "角色B", "favor": +2, "trust": -1, "tension": +1}]\n` +
          `对话内容：${text}\n` +
          `要求：变化范围 -5 到 +5，没有明显变化的填 0`;
        const { content } = await chatCompletion({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
        });
        const items = parseScoreArray(content);
        for (const it of items) {
          // 累加到现有值（复用既有 applyDelta，夹紧到 0-100 以兼容 Phase 3 关系模型）。
          await ctx.runMutation(internal.agent.relationships.applyDelta, {
            worldId,
            fromName: it.from,
            toName: it.to,
            favorDelta: it.favor,
            trustDelta: it.trust,
            tensionDelta: it.tension,
          });
        }
      }
    } catch (e) {
      console.error('scoreRelationships failed:', e);
    }
    // 改动6：按当前倍速换算间隔后自我续排（倍速变化后下一周期即同步生效）。
    const interval = scaledRealMs(RELATION_SCORING_BASE_MS, scale);
    await ctx.scheduler.runAfter(interval, internal.relationshipScoring.scoreRelationships, {
      worldId,
    });
  },
});
