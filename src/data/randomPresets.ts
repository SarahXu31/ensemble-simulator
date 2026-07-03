// 风莫村 · 角色创建随机预设（古风江湖风味）
// 用于「随机」按钮从内置列表中取值。纯前端骨架，不涉及后端。

export const RANDOM_SURNAMES = [
  '沈', '汪', '顾', '白', '柳', '唐', '苏', '陆', '楚', '燕', '萧', '南宫',
];

export const RANDOM_GIVEN_NAMES = [
  '十三', '文修', '笑生', '三娘', '二刀', '青梧', '知微', '望舒', '听澜', '拂衣',
  '怀瑾', '暮云', '砚秋', '雪见', '归晚',
];

// 直接可用的整名（更稳妥的取名池）
export const RANDOM_FULL_NAMES = [
  '沈砚秋', '柳青梧', '苏望舒', '陆听澜', '楚归晚', '燕拂衣', '萧暮云', '顾知微',
  '白雪见', '唐怀瑾', '南宫无恙', '林晚照', '程灯儿', '方寒山', '温若谷', '钟离夜',
];

export const RANDOM_GENDERS = ['男', '女', '不明'] as const;
export type Gender = (typeof RANDOM_GENDERS)[number];

// 性格 tag 池（多选 3–5）
export const RANDOM_TRAITS = [
  '寡言', '多疑', '油滑', '刻薄', '热忱', '爱吹牛', '心细', '记仇', '嘴甜', '孤高',
  '贪杯', '仗义', '胆小', '好奇', '沉稳', '爱憎分明', '善伪装', '刀子嘴豆腐心',
];

// 怪癖 单行池
export const RANDOM_QUIRKS = [
  '说话前必先冷笑一声',
  '随身带着一把从不出鞘的短刀',
  '一紧张就摸鼻子',
  '记账记在袖口里',
  '逢人便要考对方一句诗',
  '喝酒只喝三杯，多一杯都不肯',
  '爱把别人的故事说成自己的',
  '睡前必要把门闩检查三遍',
  '听到官差二字会下意识站直',
  '总把「想当年」挂在嘴边',
];

// 爱好 tag 池（多选）
export const RANDOM_HOBBIES = [
  '品苦茶', '听书', '摸骨牌', '斗蟋蟀', '抄旧书', '钓鱼', '养画眉', '习刀',
  '酿桂花酒', '逛夜市', '看星象', '收旧物', '下象棋', '写打油诗',
];

// 渴望 单行池
export const RANDOM_DESIRES = [
  '想找出二十年前那桩旧案的真凶',
  '想攒够银子，赎回当铺里的祖传玉佩',
  '想成为方圆百里最有名的说书人',
  '想在乱世里护住酒馆和几个熟客',
  '想洗清当年被冤的那桩案子',
  '想抓住一个能换取前程的把柄',
  '想安安稳稳过完这个多事之春',
  '想让世人都听见他没说完的那句话',
];

// 口头禅池
export const RANDOM_CATCHPHRASES = [
  '想当年……',
  '此事容我三思。',
  '嘿，这事儿我知道。',
  '你说的，未必是真的。',
  '得了吧。',
  '酒过三巡，真话自来。',
  '我只是路过而已。',
  '不好说，不好说。',
  '有意思，继续。',
  '别急，听我讲完。',
  '无所谓，反正都一样。',
  '唉，世道如此。',
  '你信吗？反正我信。',
  '此言差矣。',
  '走着瞧罢。',
];

// 最讨厌池
export const RANDOM_DISLIKES = [
  '甜食',
  '吵闹酒席',
  '虚伪之人',
  '被人当面揭穿',
  '拖泥带水的事',
  '背后嚼舌',
  '高处',
  '不讲道理的人',
  '阴雨天',
  '粗鄙武夫',
  '官府中人',
  '无聊的规矩',
  '别人翻他旧账',
  '半途而废',
  '酒后失态之人',
];

// 秘密 多行池
export const RANDOM_SECRETS = [
  '曾放走过一个本该拿问的人，这件事绝口不提。',
  '偷偷记下了许多官员与百姓的私事，从不示人。',
  '写过不少骂朝廷的文章，藏在酒坛底下。',
  '欠着一屁股赌债，一直没还清。',
  '知道先帝驾崩当夜宫里真正发生了什么。',
  '当年那桩「英雄事迹」，其实是从别人口中听来的。',
  '账本最后一页，记着一个不能见光的名字。',
];

// —— 随机取值工具 ——
export function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickSome<T>(arr: readonly T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function randomName(): string {
  return pickOne(RANDOM_FULL_NAMES);
}
