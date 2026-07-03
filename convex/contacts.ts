import { v } from 'convex/values';
import { query } from './_generated/server';

// 返回某世界「已结束的对话」记录（archivedConversations），带参与者姓名，供事件流的
// 接触状态卡展示。按结束时间倒序，最多取 limit 条。
export const listArchivedContacts = query({
  args: {
    worldId: v.id('worlds'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const archived = await ctx.db
      .query('archivedConversations')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    // 一次性拉取 playerDescriptions 做 id → name 映射。
    const descs = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
    const nameByPlayer = new Map(descs.map((d) => [d.playerId, d.name] as const));

    const sorted = archived.sort((a, b) => b.ended - a.ended).slice(0, limit);
    return sorted.map((c) => ({
      id: c.id,
      created: c.created,
      ended: c.ended,
      numMessages: c.numMessages,
      participantNames: c.participants
        .map((p) => nameByPlayer.get(p))
        .filter((n): n is string => !!n),
    }));
  },
});
