import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { insertInput } from './aiTown/insertInput';
import { characters } from '../data/characters';

// 把「入村造册」表单里的字段，拼成一段贴合现有 Descriptions 风格的人设文本。
// 说明：为遵守「不改动 convex/aiTown/* 引擎核心逻辑」的约束，这里走引擎已有的
// `join` input（会安全地在下一步创建 player + playerDescription），不直接改世界文档。
// TODO(Phase 3): 若要让新村民像预设 agent 一样自主攀谈，需要新增一个 createPlayerAgent
// input（携带 identity/plan 生成 agentDescription），目前仅落为可被人物簿查看的村民。
function buildDescription(args: {
  name: string;
  gender: string;
  personality: string[];
  quirk: string;
  hobbies: string[];
  desire: string;
  secret: string;
}): string {
  const parts: string[] = [];
  const genderWord = args.gender === '不明' ? '' : `（${args.gender}）`;
  const traits = args.personality.length ? args.personality.join('、') : '性情不明';
  parts.push(`${args.name}${genderWord}是新入风莫村的一位村民。性情${traits}。`);
  if (args.quirk.trim()) parts.push(`有个怪癖：${args.quirk.trim()}。`);
  if (args.hobbies.length) parts.push(`平日爱好${args.hobbies.join('、')}。`);
  if (args.desire.trim()) parts.push(`\n【渴望】${args.desire.trim()}`);
  if (args.secret.trim()) parts.push(`\n【秘密】${args.secret.trim()}`);
  parts.push('\n（秘密是你心底的事，除非极度信任对方，否则绝不会说出口。）');
  return parts.join('');
}

export const createPlayerCharacter = mutation({
  args: {
    worldId: v.id('worlds'),
    name: v.string(),
    gender: v.string(), // '男' | '女' | '不明'
    personality: v.array(v.string()),
    quirk: v.string(),
    hobbies: v.array(v.string()),
    desire: v.string(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`Invalid world ID: ${args.worldId}`);
    }
    const name = args.name.trim();
    if (!name) {
      throw new Error('村民须有姓名');
    }
    // 随机分配一张立绘（spritesheet key，如 f1..f8）。
    const character = characters[Math.floor(Math.random() * characters.length)].name;
    const description = buildDescription({ ...args, name });

    // 通过引擎已有的 join input 落库（引擎在下一步创建 player + playerDescription）。
    const inputId = await insertInput(ctx, args.worldId, 'join', {
      name,
      character,
      description,
    });
    return { inputId, name };
  },
});
