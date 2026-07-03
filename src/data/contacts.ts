// 风莫村 · 接触状态卡数据层
// 把游戏世界里的 conversations（活跃 + 已归档）聚合成 ContactRecord，供事件流展示。

import { INITIAL_RELATIONSHIPS } from '../../data/relationships';

export type ContactStatus = '正在对话' | '对话结束' | '相遇' | '独自行走';

export type ContactRecord = {
  id: string; // conversationId
  participantNames: string[];
  status: ContactStatus;
  location?: string;
  startedAt: number;
  endedAt?: number;
  messageCount: number;
  lastMessagePreview?: string;
  // 高亮标记
  isBigEvent?: boolean;
  bigEventTitle?: string;
  bigEventText?: string;
  relationshipDelta?: { pair: [string, string]; delta: number };
  personaDrift?: { role: string; summary: string };
};

// 稳定字符串哈希，用于在无真实关系值时生成确定性的 mock。
export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// 由坐标推断场景地名（地图约 40×40）。
export function inferLocation(pos?: { x: number; y: number }): string {
  if (!pos) return '村中某处';
  const x = pos.x;
  if (x < 10) return '村口';
  if (x < 20) return '茶馆';
  if (x < 30) return '客栈';
  return '巷弄';
}

// 高亮阈值：|delta| 超过该值即视为「感情巨变」。
export const RELATION_DELTA_THRESHOLD = 20;

// 第一版：用初始关系值 + 基于 conversationId 的确定性随机累积，得到一个 [-40, 40] 的 delta。
// TODO(Phase 3): 接入后端真实关系值（relationships 表 + 对话后更新）。
export function mockRelationshipDelta(
  id: string,
  names: string[],
): { pair: [string, string]; delta: number } | undefined {
  if (names.length < 2) return undefined;
  const [a, b] = names;
  const base = INITIAL_RELATIONSHIPS[a]?.[b]?.favor ?? 50;
  const seed = hashStr(id + a + b);
  // -40 .. 40
  const raw = (seed % 81) - 40;
  // 让初始好感高的对更容易正向、好感低的更容易负向，增加一点"剧情感"。
  const bias = base >= 50 ? 4 : -4;
  const delta = Math.max(-45, Math.min(45, raw + bias));
  return { pair: [a, b], delta };
}

// 人设漂移：小概率触发（确定性），给出一句模板化描述。
export function mockPersonaDrift(
  id: string,
  names: string[],
): { role: string; summary: string } | undefined {
  if (names.length === 0) return undefined;
  const seed = hashStr('drift' + id);
  if (seed % 5 !== 0) return undefined; // 约 1/5 概率
  const role = names[seed % names.length];
  const summaries = [
    '言辞比往日锋利，似有心事。',
    '一反常态地热络，令人意外。',
    '几番欲言又止，性情微妙地变了。',
    '突然变得沉默，与平日判若两人。',
  ];
  return { role, summary: summaries[seed % summaries.length] };
}
