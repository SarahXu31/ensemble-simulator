// 风莫村 · 大事件系统预设（6 条）
// 改动2：triggerMs 为「现实时间毫秒数」（DEFAULT_TIME_SCALE=8x 基准）。
//   实际触发时会按当前倍速换算（见 worldEvents.triggerForWorld / constants.scaledRealMs）。
// 注意：大赦令（21h）早于驾崩（24h），已按给定时间排序修正原有顺序冲突。

export type WorldEventKind = 'big_event' | 'narration' | 'encounter';

export type WorldEventPreset = {
  triggerMs: number; // 改动2：现实毫秒触发点（8x 基准）
  title: string;
  description: string;
  kind: WorldEventKind;
  affectedRoles: string[];
};

export const WORLD_EVENT_PRESETS: WorldEventPreset[] = [
  {
    triggerMs: 0, // 开场旁白：开局即触发
    title: '风起风莫',
    description: '建元三年春末，风莫村来了几个生面孔。老槐树下的酒馆里，茶烟未散，人心已各怀心事。',
    kind: 'narration',
    affectedRoles: [],
  },
  {
    triggerMs: 5_400_000, // 朝廷钦差过境：现实 90 分钟后
    title: '钦差过境',
    description: '朝廷钦差过境，锦衣卫封锁村口三个时辰，村里人心惶惶。',
    kind: 'big_event',
    affectedRoles: ['沈十三', '汪直'],
  },
  {
    triggerMs: 21_600_000, // 一场大雨：现实 6 小时后
    title: '一场大雨',
    description: '夜半骤雨如注，茶馆屋顶漏水，众人被迫挤在正堂避雨。',
    kind: 'encounter',
    affectedRoles: ['柳三娘', '白笑生', '唐二刀'],
  },
  {
    triggerMs: 43_200_000, // 官府贴出悬赏告示：现实 12 小时后
    title: '官府告示',
    description: '官府贴出告示，重金悬赏一名江湖逃犯，画像与村中某人有几分相似。',
    kind: 'big_event',
    affectedRoles: ['唐二刀', '顾文修'],
  },
  {
    triggerMs: 75_600_000, // 新皇大赦令：现实 21 小时后（早于驾崩）
    title: '大赦天下',
    description: '新皇颁大赦令，江湖旧案一笔勾销，风莫村中至少一人从此得以从容行走。',
    kind: 'big_event',
    affectedRoles: ['顾文修', '唐二刀'],
  },
  {
    triggerMs: 86_400_000, // 老皇驾崩，新皇登基：现实 24 小时后
    title: '老皇驾崩·新皇登基',
    description: '紫宸殿钟鸣三声，老皇宾天。三日后新皇于太和殿即位，天下震动。',
    kind: 'big_event',
    affectedRoles: [],
  },
];
