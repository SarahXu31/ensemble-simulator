// 风莫村 · 事件流类型定义（见 design-system/MASTER.md 第 5.1 节）

export type StoryEventType =
  | 'narration'
  | 'dialogue'
  | 'encounter'
  | 'system'
  | 'relationship'
  | 'chapter';

export type StoryMood = 'calm' | 'tense' | 'joyful' | 'grim' | 'mystery';

export type StoryEvent = {
  id: string;
  ts: number; // 世界时辰（相对刻度）
  type: StoryEventType;
  actors: string[];
  text: string;
  mood?: StoryMood;
  importance?: 1 | 2 | 3; // 3 = 大事件牌签
  // 以下为可选展示字段
  title?: string; // chapter 标题 / sealed card 事件名
  chapterNo?: string; // 章节序号，如「第一幕」
  relationDelta?: 'up' | 'down'; // relationship 类型：良性 / 恶性
};
