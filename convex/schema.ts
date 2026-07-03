import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { agentTables } from './agent/schema';
import { aiTownTables } from './aiTown/schema';
import { conversationId, playerId } from './aiTown/ids';
import { engineTables } from './engine/schema';

export default defineSchema({
  music: defineTable({
    storageId: v.string(),
    type: v.union(v.literal('background'), v.literal('player')),
  }),

  messages: defineTable({
    conversationId,
    messageUuid: v.string(),
    author: playerId,
    text: v.string(),
    worldId: v.optional(v.id('worlds')),
  })
    .index('conversationId', ['worldId', 'conversationId'])
    .index('messageUuid', ['conversationId', 'messageUuid']),

  // 轻关系层：记录角色之间有方向的关系值（好感 / 信任 / 戒备）。
  relationships: defineTable({
    worldId: v.id('worlds'),
    fromName: v.string(),
    toName: v.string(),
    favor: v.number(),
    trust: v.number(),
    tension: v.number(),
  }).index('byPair', ['worldId', 'fromName', 'toName']),

  // 角色档案系统：保存用户编辑的角色设定。
  characterProfiles: defineTable({
    worldId: v.id('worlds'),
    slotIndex: v.number(), // 0-5，同一 slot 覆盖式更新
    name: v.string(),
    gender: v.string(), // '男' | '女' | '不限'
    age: v.optional(v.string()),
    personality: v.string(), // 性格
    quirk: v.string(), // 怪癖
    catchphrase: v.optional(v.string()), // 口头禅
    hobbies: v.string(), // 爱好
    dislikes: v.string(), // 最讨厌
    desire: v.string(), // 最渴望
    secret: v.optional(v.string()), // 隐藏秘密
    updatedAt: v.number(),
  }).index('worldId_slot', ['worldId', 'slotIndex']),

  // 大事件系统：预设的世界级事件。
  // 改动2：触发时间从「世界内小时」改为「现实时间毫秒数」（triggerMs，DEFAULT_TIME_SCALE=8x 基准）。
  worldEvents: defineTable({
    worldId: v.id('worlds'),
    triggerMs: v.optional(v.number()), // 改动2：现实毫秒触发点（8x 基准），实际触发时按当前倍速换算
    triggerHour: v.optional(v.number()), // 兼容旧数据字段（已弃用，保留避免旧文档校验失败）
    title: v.string(),
    description: v.string(),
    kind: v.union(v.literal('big_event'), v.literal('narration'), v.literal('encounter')),
    triggered: v.boolean(),
    triggeredAt: v.optional(v.number()),
    affectedRoles: v.array(v.string()),
  }).index('worldId_triggered', ['worldId', 'triggered']),

  // 改动6：游戏级设置，目前仅保存时间流速（倍速），供后端大事件/定时打分换算。
  // 同时记录后台定时任务（关系打分、人设漂移）是否已启动，避免重复排期。
  gameSettings: defineTable({
    worldId: v.id('worlds'),
    timeScale: v.number(),
    scoringStarted: v.optional(v.boolean()),
    driftStarted: v.optional(v.boolean()),
    updatedAt: v.number(),
  }).index('worldId', ['worldId']),

  // 改动5：人设漂移记录。每个角色一条，保存最近一次微调后的性格变化描述。
  personalityDrifts: defineTable({
    worldId: v.id('worlds'),
    name: v.string(),
    drift: v.string(),
    updatedAt: v.number(),
  }).index('byName', ['worldId', 'name']),

  ...agentTables,
  ...aiTownTables,
  ...engineTables,
});
