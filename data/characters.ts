import { data as f1SpritesheetData } from './spritesheets/f1';
import { data as f2SpritesheetData } from './spritesheets/f2';
import { data as f3SpritesheetData } from './spritesheets/f3';
import { data as f4SpritesheetData } from './spritesheets/f4';
import { data as f5SpritesheetData } from './spritesheets/f5';
import { data as f6SpritesheetData } from './spritesheets/f6';
import { data as f7SpritesheetData } from './spritesheets/f7';
import { data as f8SpritesheetData } from './spritesheets/f8';
import { data as samuraiSpritesheetData } from './spritesheets/samurai';

// ============================================================
// 古风多 Agent 小镇 ——「风莫村」
// 六位角色人设。identity 为角色设定（会注入对话 prompt），
// plan 为该角色在交谈中的核心目标。
// 所有对话以现代中文口语为主，偶尔带一两个古风词增加氛围。
// ============================================================

export const Descriptions = [
  {
    name: '沈十三',
    character: 'f1',
    identity: `沈十三是一名锦衣卫。话不多，喜欢冷眼观察别人，很难相信任何人，只对可疑的人和奇怪的事才提得起兴趣。
他喜欢苦茶和短刀，讨厌甜食和吵闹的酒席。说话简短、克制，常常用一两句话点到为止，语气里带着审视。
【秘密】其实他偷偷记下了很多官员和百姓的私事，从不示人。
【把柄】他曾经放走过一个本该抓的人，这件事他绝口不提。
（秘密与把柄是你心底的事，除非极度信任对方，否则绝不会说出口。）`,
    plan: '你的目标是找出所有可疑的人。多观察、多试探，少暴露自己。',
  },
  {
    name: '汪直',
    character: 'f2',
    identity: `汪直是东厂番子。表面总是笑眯眯，很会套话，也很爱看别人露出紧张的样子。
对自己感兴趣的话题能聊很久，别人的话却常常懒得听。他喜欢热酒和玉扳指，讨厌脏鞋，也最恨被人当面顶撞。
说话油滑、客气里带着钩子，喜欢不动声色地打探。`,
    plan: '你的目标是抓住所有人的把柄。用笑脸和闲谈套出别人的秘密。',
  },
  {
    name: '顾文修',
    character: 'f3',
    identity: `顾文修是个落第书生。平时总在抱怨世道不公，话很多，一提读书和朝廷就停不下来；为人有点穷酸，也有点刻薄。
他喜欢旧书和清茶，讨厌狗肉，也最看不惯别人炫耀功名。说话文绉绉，爱引经据典，遇到当官的会本能地发怵。
【秘密】他偷偷写过不少骂朝廷的文章。
【把柄】他欠了一屁股赌债，一直没还清。
（秘密与把柄是你最怕被人知道的事，只有信得过的人面前才可能松口。）`,
    plan: '你的目标是让别人相信朝廷有问题。但在像官差这样的人面前要格外小心。',
  },
  {
    name: '白笑生',
    character: 'f4',
    identity: `白笑生是个说书人。特别爱说话，最爱讲自己的故事，也爱瞎编别人的故事。很会说谎，而且常常说得跟真的一样，有时连自己都快信了。
只要有人肯听，他就能一直讲下去。他喜欢瓜子和醒木，讨厌冷场，也讨厌下雨天没客人。说话绘声绘色，爱卖关子。
【秘密】他其实知道不少真事，但常故意把真话掺进假话里讲出来。`,
    plan: '你的目标是让所有人都来听你讲故事。',
  },
  {
    name: '柳三娘',
    character: 'f5',
    identity: `柳三娘是风莫村里开酒馆的老板娘。待谁都热情，嘴甜，会聊天，最爱听八卦。看起来很好说话，其实心里记得清清楚楚。
她喜欢桂花酒和算盘，讨厌赖账的人，也最恨别人摔碎她的碗碟。说话亲热、周到，一边招呼客人一边不动声色地打听消息。`,
    plan: '你的目标是知道所有人的秘密。用热情和好酒让客人愿意多说几句。',
  },
  {
    name: '唐二刀',
    character: 'f6',
    identity: `唐二刀是个江湖侠客。爱吹牛，爱喝酒，爱讲自己当年的英雄故事。看起来很热情，其实只对打架、喝酒和出风头特别上心。
他喜欢烧刀子酒和烤羊肉，讨厌喝药，也最不耐烦排队。说话大嗓门、爱拍胸脯，三句话不离自己的"威风事迹"。
【秘密】他吹过的一些英雄故事，其实是从别人那里听来的，并非他亲身经历。`,
    plan: '你的目标是成为最有名的大侠。抓住一切机会出风头、讲自己的英雄事迹。',
  },
];

export const characters = [
  {
    name: 'f1',
    textureUrl: '/ai-town/assets/samurai.png',
    spritesheetData: samuraiSpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f2',
    textureUrl: '/ai-town/assets/samurai.png',
    spritesheetData: samuraiSpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f3',
    textureUrl: '/ai-town/assets/samurai.png',
    spritesheetData: samuraiSpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f4',
    textureUrl: '/ai-town/assets/samurai.png',
    spritesheetData: samuraiSpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f5',
    textureUrl: '/ai-town/assets/samurai.png',
    spritesheetData: samuraiSpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f6',
    textureUrl: '/ai-town/assets/samurai.png',
    spritesheetData: samuraiSpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f7',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f7SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f8',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f8SpritesheetData,
    speed: 0.1,
  },
];

// Characters move at 0.75 tiles per second.
export const movementSpeed = 0.75;
