// 风莫村 · 六位预设角色数据
// 用于「应用风莫村预设」按钮一键填充。

export type ProfileDraft = {
  name: string;
  gender: string;
  age?: string;
  personality: string;
  quirk: string;
  catchphrase?: string;
  hobbies: string;
  dislikes: string;
  desire: string;
  secret?: string;
};

export const FENGMOCUN_PRESETS: ProfileDraft[] = [
  {
    name: '沈十三',
    gender: '男',
    age: '三十余',
    personality: '寡言、多疑、心细',
    quirk: '总是摸腰间短刀刀柄',
    catchphrase: '你说的，未必是真的。',
    hobbies: '苦茶、短刀、抄旧书',
    dislikes: '甜食、吵闹酒席',
    desire: '找出所有可疑的人',
    secret: '偷偷记录官员私事，藏在酒坛底下，从不示人。',
  },
  {
    name: '汪直',
    gender: '男',
    age: '五十出头',
    personality: '油滑、爱吹牛、仗义',
    quirk: '爱把别人的故事说成自己的',
    catchphrase: '嘿，这事儿当年我可在场。',
    hobbies: '听书、摸骨牌、逛夜市',
    dislikes: '被人当面揭穿',
    desire: '成为方圆百里最有名的说书人',
    secret: '当年那桩"英雄事迹"，其实是从别人口中听来的。',
  },
  {
    name: '柳三娘',
    gender: '女',
    age: '二十有七',
    personality: '热忱、嘴甜、刀子嘴豆腐心',
    quirk: '说话前必先冷笑一声',
    catchphrase: '得了吧，你那点心思谁看不出来。',
    hobbies: '酿桂花酒、养画眉、下象棋',
    dislikes: '虚伪之人、拖泥带水',
    desire: '在乱世里护住酒馆和几个熟客',
    secret: '曾放走过一个本该拿问的人，这件事绝口不提。',
  },
  {
    name: '顾知微',
    gender: '男',
    age: '二十三',
    personality: '孤高、沉稳、善伪装',
    quirk: '逢人便要考对方一句诗',
    catchphrase: '此事……容我三思。',
    hobbies: '看星象、写打油诗、品苦茶',
    dislikes: '粗鄙武夫、不讲道理的人',
    desire: '洗清当年被冤的那桩案子',
    secret: '写过不少骂朝廷的文章，藏在书箱夹层里。',
  },
  {
    name: '燕拂衣',
    gender: '女',
    age: '十九',
    personality: '好奇、胆小、记仇',
    quirk: '一紧张就摸鼻子',
    catchphrase: '我、我只是路过而已……',
    hobbies: '钓鱼、收旧物、斗蟋蟀',
    dislikes: '黑暗、高处、被人跟踪',
    desire: '找到失踪多年的兄长',
    secret: '知道先帝驾崩当夜宫里真正发生了什么。',
  },
  {
    name: '萧暮云',
    gender: '男',
    age: '四十余',
    personality: '贪杯、爱憎分明、刻薄',
    quirk: '喝酒只喝三杯，多一杯都不肯',
    catchphrase: '酒过三巡，真话自来。',
    hobbies: '听书、习刀、养画眉',
    dislikes: '虚情假意、背后嚼舌',
    desire: '抓住一个能换取前程的把柄',
    secret: '账本最后一页，记着一个不能见光的名字。',
  },
];
