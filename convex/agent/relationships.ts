import { v } from 'convex/values';
import { ActionCtx, internalMutation, internalQuery } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { internal } from '../_generated/api';
import { chatCompletion } from '../util/llm';
import { INITIAL_RELATIONSHIPS, clampValue, isKnownCharacter } from '../../data/relationships';

const selfInternal = internal.agent.relationships;

// 读取 fromName 对 toName 的当前关系值。
export const getRelationship = internalQuery({
  args: { worldId: v.id('worlds'), fromName: v.string(), toName: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('relationships')
      .withIndex('byPair', (q) =>
        q.eq('worldId', args.worldId).eq('fromName', args.fromName).eq('toName', args.toName),
      )
      .first();
    if (!row) return null;
    return { favor: row.favor, trust: row.trust, tension: row.tension };
  },
});

// 为一个世界播种所有初始关系（有方向）。若已存在则跳过，保证只播种一次。
export const seedRelationships = internalMutation({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('relationships')
      .withIndex('byPair', (q) => q.eq('worldId', args.worldId))
      .first();
    if (existing) {
      return;
    }
    for (const from of Object.keys(INITIAL_RELATIONSHIPS)) {
      for (const [to, vals] of Object.entries(INITIAL_RELATIONSHIPS[from])) {
        await ctx.db.insert('relationships', {
          worldId: args.worldId,
          fromName: from,
          toName: to,
          favor: vals.favor,
          trust: vals.trust,
          tension: vals.tension,
        });
      }
    }
  },
});

// 对一条关系施加增量，并夹紧到 0-100。
export const applyDelta = internalMutation({
  args: {
    worldId: v.id('worlds'),
    fromName: v.string(),
    toName: v.string(),
    favorDelta: v.number(),
    trustDelta: v.number(),
    tensionDelta: v.number(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('relationships')
      .withIndex('byPair', (q) =>
        q.eq('worldId', args.worldId).eq('fromName', args.fromName).eq('toName', args.toName),
      )
      .first();
    if (!row) {
      return;
    }
    await ctx.db.patch(row._id, {
      favor: clampValue(row.favor + args.favorDelta),
      trust: clampValue(row.trust + args.trustDelta),
      tension: clampValue(row.tension + args.tensionDelta),
    });
  },
});

function parseDeltas(content: string): { favor: number; trust: number; tension: number } | null {
  const match = content.match(/\{[\s\S]*?\}/);
  if (!match) {
    return null;
  }
  try {
    const obj = JSON.parse(match[0]);
    const num = (x: any) => {
      const n = Number(x);
      if (!isFinite(n)) return 0;
      return Math.max(-15, Math.min(15, Math.round(n)));
    };
    return {
      favor: num(obj.favor),
      trust: num(obj.trust),
      tension: num(obj.tension),
    };
  } catch {
    return null;
  }
}

// 在一次对话结束后，根据对话总结更新 fromName 对 toName 的关系值。
// 仅当双方都是预设的六位角色时才生效（观察者/人类玩家不计入关系层）。
export async function updateRelationshipAfterConversation(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  fromName: string,
  toName: string,
  summary: string,
) {
  if (!isKnownCharacter(fromName) || !isKnownCharacter(toName)) {
    return;
  }
  let deltas: { favor: number; trust: number; tension: number } | null = null;
  try {
    const { content } = await chatCompletion({
      messages: [
        {
          role: 'user',
          content:
            `你是${fromName}。下面是你刚刚和${toName}的一段对话总结：\n` +
            `「${summary}」\n` +
            `请根据这次交谈，判断你对${toName}的三种感受发生了多大变化。\n` +
            `只输出一个 JSON 对象，三个字段都是 -15 到 15 之间的整数：\n` +
            `{"favor": 好感变化, "trust": 信任变化, "tension": 戒备变化}\n` +
            `关系变好时 favor、trust 上升、tension 下降；关系变差时相反。\n` +
            `只输出 JSON，不要任何多余文字。`,
        },
      ],
      max_tokens: 120,
    });
    deltas = parseDeltas(content);
  } catch (e) {
    deltas = null;
  }
  // 兜底：若 LLM 无法给出可解析结果，则给一个很小的正向变化（交谈多少会拉近一点）。
  if (!deltas) {
    deltas = { favor: 1, trust: 0, tension: -1 };
  }
  await ctx.runMutation(selfInternal.applyDelta, {
    worldId,
    fromName,
    toName,
    favorDelta: deltas.favor,
    trustDelta: deltas.trust,
    tensionDelta: deltas.tension,
  });
}
