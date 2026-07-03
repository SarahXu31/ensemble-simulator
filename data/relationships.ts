// ============================================================
// 「风莫村」轻关系层 + 轻任务层 预设数据
// ------------------------------------------------------------
// 关系层：每两个角色之间有三个状态值（0-100）
//   favor   好感   —— 越高越亲近、越愿意搭话
//   trust   信任   —— 越高越愿意透露真心话/秘密
//   tension 戒备   —— 越高越警惕、越冷淡或试探
// 关系是「有方向的」：A 对 B 的态度，和 B 对 A 的态度可以不同。
// 对话结束后，这些值会根据这次交谈自动更新，并影响后续对话。
// ============================================================

export const RELATIONSHIP_CHARACTERS = [
  '沈十三',
  '汪直',
  '顾文修',
  '白笑生',
  '柳三娘',
  '唐二刀',
] as const;

export type RelationshipValues = {
  favor: number; // 好感
  trust: number; // 信任
  tension: number; // 戒备 / 紧张
};

export function isKnownCharacter(name: string): boolean {
  return (RELATIONSHIP_CHARACTERS as readonly string[]).includes(name);
}

export function clampValue(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// from 角色 对 to 角色 的初始态度。默认中性约为 50。
export const INITIAL_RELATIONSHIPS: Record<string, Record<string, RelationshipValues>> = {
  沈十三: {
    汪直: { favor: 25, trust: 15, tension: 80 }, // 东厂与锦衣卫是对头，戒备极高
    顾文修: { favor: 35, trust: 30, tension: 60 }, // 骂朝廷的书生，可疑，重点观察
    白笑生: { favor: 30, trust: 15, tension: 55 }, // 满嘴谎话，不可信
    柳三娘: { favor: 45, trust: 35, tension: 45 }, // 消息灵通，也得留个心眼
    唐二刀: { favor: 35, trust: 30, tension: 40 }, // 吵闹的吹牛侠客
  },
  汪直: {
    沈十三: { favor: 30, trust: 20, tension: 70 }, // 对头，既警惕又想试探
    顾文修: { favor: 55, trust: 30, tension: 50 }, // 对他骂朝廷很感兴趣，可下手
    白笑生: { favor: 50, trust: 25, tension: 35 }, // 爱听他的故事，也想套话
    柳三娘: { favor: 55, trust: 35, tension: 30 }, // 八卦来源，重点套话对象
    唐二刀: { favor: 45, trust: 30, tension: 30 }, // 嘴不严的大老粗，好套话
  },
  顾文修: {
    沈十三: { favor: 20, trust: 15, tension: 80 }, // 锦衣卫，怕得要死
    汪直: { favor: 20, trust: 10, tension: 85 }, // 东厂番子，更怕
    白笑生: { favor: 45, trust: 35, tension: 35 }, // 都靠一张嘴，有点惺惺相惜
    柳三娘: { favor: 50, trust: 40, tension: 40 }, // 老主顾，欠着账要客气
    唐二刀: { favor: 35, trust: 35, tension: 35 }, // 看不起的粗人
  },
  白笑生: {
    沈十三: { favor: 40, trust: 30, tension: 45 }, // 冷脸客人，怕冷场
    汪直: { favor: 50, trust: 30, tension: 40 }, // 难得有人捧场，但要小心
    顾文修: { favor: 55, trust: 40, tension: 25 }, // 有共同话题的酸书生
    柳三娘: { favor: 65, trust: 50, tension: 20 }, // 村里给他舞台，关系最好
    唐二刀: { favor: 60, trust: 40, tension: 25 }, // 他的故事是上好的素材
  },
  柳三娘: {
    沈十三: { favor: 50, trust: 35, tension: 40 }, // 难缠的冷面客，热情应对
    汪直: { favor: 45, trust: 25, tension: 50 }, // 危险人物，表面热情
    顾文修: { favor: 50, trust: 40, tension: 40 }, // 欠账的老主顾
    白笑生: { favor: 65, trust: 50, tension: 20 }, // 招揽客人的活招牌
    唐二刀: { favor: 55, trust: 40, tension: 35 }, // 能带来酒钱，也爱闹事
  },
  唐二刀: {
    沈十三: { favor: 35, trust: 30, tension: 40 }, // 扫兴的闷葫芦
    汪直: { favor: 35, trust: 25, tension: 45 }, // 不喜欢这种阴笑的人
    顾文修: { favor: 35, trust: 30, tension: 30 }, // 看不起的酸书生
    白笑生: { favor: 65, trust: 45, tension: 20 }, // 最爱有人捧场听他吹
    柳三娘: { favor: 60, trust: 45, tension: 25 }, // 给酒的老板娘，关系好
  },
};

export function getInitialRelationship(from: string, to: string): RelationshipValues | null {
  return INITIAL_RELATIONSHIPS[from]?.[to] ?? null;
}

// 用一句中文描述当前关系，注入对话 prompt。
export function describeRelationship(otherName: string, r: RelationshipValues): string {
  const level = (n: number, low: string, mid: string, high: string) =>
    n <= 33 ? low : n <= 66 ? mid : high;
  const favorWord = level(r.favor, '冷淡', '一般', '亲近');
  const trustWord = level(r.trust, '提防', '将信将疑', '信得过');
  const tensionWord = level(r.tension, '放松', '略有戒心', '高度戒备');
  return (
    `你对${otherName}的当前关系：好感${r.favor}/100（${favorWord}）、` +
    `信任${r.trust}/100（${trustWord}）、戒备${r.tension}/100（${tensionWord}）。` +
    `请让你的语气和分寸贴合这种关系：戒备高就更冷淡、更试探、更不愿透露真心话；` +
    `好感与信任高就更热络、更愿意多聊几句甚至吐露一点心里话。`
  );
}

// ============================================================
// 轻任务层：每位角色有三类简单"小目标"（社交 / 移动 / 信息）。
// 会作为一句提示注入对话 prompt，让角色行为更有动机。
// ============================================================

export type TaskCategory = 'social' | 'move' | 'info';

export const CHARACTER_TASKS: Record<string, Record<TaskCategory, string>> = {
  沈十三: {
    social: '社交任务：找一个你觉得可疑的人，旁敲侧击地试探他。',
    move: '移动任务：在村里换个地方，盯着人多的地方。',
    info: '信息任务：从别人口中套出一件"奇怪的事"。',
  },
  汪直: {
    social: '社交任务：用笑脸接近一个人，让他放松警惕。',
    move: '移动任务：往酒席热闹处凑，方便听人说话。',
    info: '信息任务：套出别人一个可以当把柄的小秘密。',
  },
  顾文修: {
    social: '社交任务：找人聊聊世道，看看谁愿意附和你。',
    move: '移动任务：避开看着像官差的人，挑个清净处坐。',
    info: '信息任务：打听朝廷或官员最近有什么不公的事。',
  },
  白笑生: {
    social: '社交任务：拉住一个人，开始给他讲一段故事。',
    move: '移动任务：站到人多的地方，好招揽听众。',
    info: '信息任务：打听一件真事，好掺进你的故事里。',
  },
  柳三娘: {
    social: '社交任务：热情招呼一位客人，让他多坐一会儿。',
    move: '移动任务：在村里四处走动，照应每一位客人。',
    info: '信息任务：从闲聊里听出一个别人不想让人知道的秘密。',
  },
  唐二刀: {
    social: '社交任务：找人喝两杯，顺便讲讲你的英雄事迹。',
    move: '移动任务：走到最热闹的地方，好出风头。',
    info: '信息任务：打听谁还没听过你的威风事迹。',
  },
};

export function getTaskHint(name: string): string | null {
  const tasks = CHARACTER_TASKS[name];
  if (!tasks) return null;
  const cats: TaskCategory[] = ['social', 'move', 'info'];
  const pick = cats[Math.floor(Math.random() * cats.length)];
  return tasks[pick];
}
