import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { ActionCtx, internalQuery } from '../_generated/server';
import { LLMMessage, chatCompletion } from '../util/llm';
import * as memory from './memory';
import { api, internal } from '../_generated/api';
import * as embeddingsCache from './embeddingsCache';
import { GameId, conversationId, playerId } from '../aiTown/ids';
import { NUM_MEMORIES_TO_SEARCH } from '../constants';
import { describeRelationship, getTaskHint } from '../../data/relationships';

const selfInternal = internal.agent.conversation;

type Relationship = { favor: number; trust: number; tension: number } | null;

// 统一的语言与口吻约束：现代口语优先，少量古风点缀，避免空泛寒暄。
const LANG_INSTRUCTION =
  '使用简体中文交流。以现代口语为主，可以根据身份偶尔带一两个古风词汇（如“阁下”、“稍候”），但严禁整句使用晦涩文言。' +
  '禁止毫无意义的寒暄、客套、夸赞或空泛的古风废话（如“近日可好”、“幸会”）。' +
  '每一句话都必须包含以下之一：具体的真实情报、一个明确的待解决问题、对他人的试探、或表达明确的立场冲突。' +
  '回答必须简短，控制在 200 字以内。';

export async function startConversationMessage(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  conversationId: GameId<'conversations'>,
  playerId: GameId<'players'>,
  otherPlayerId: GameId<'players'>,
): Promise<string> {
  const { player, otherPlayer, agent, otherAgent, lastConversation, relationship } =
    await ctx.runQuery(selfInternal.queryPromptData, {
      worldId,
      playerId,
      otherPlayerId,
      conversationId,
    });
  const embedding = await embeddingsCache.fetch(
    ctx,
    `${player.name} is talking to ${otherPlayer.name}`,
  );

  const memories = await memory.searchMemories(
    ctx,
    player.id as GameId<'players'>,
    embedding,
    Number(process.env.NUM_MEMORIES_TO_SEARCH) || NUM_MEMORIES_TO_SEARCH,
  );

  const memoryWithOtherPlayer = memories.find(
    (m) => m.data.type === 'conversation' && m.data.playerIds.includes(otherPlayerId),
  );
  const prompt = [`你是${player.name}，你刚刚在风莫村里和${otherPlayer.name}搭上了话。`];
  prompt.push(...agentPrompts(otherPlayer, agent, otherAgent ?? null));
  prompt.push(...relationshipPrompt(otherPlayer, relationship));
  prompt.push(...taskPrompt(player));
  prompt.push(...previousConversationPrompt(otherPlayer, lastConversation));
  prompt.push(...relatedMemoriesPrompt(memories));
  if (memoryWithOtherPlayer) {
    prompt.push(`不要只说“你好”，直接切入你们上次聊过的话题，或者就某个具体细节发问。`);
  }
  prompt.push(LANG_INSTRUCTION);
  const lastPrompt = `${player.name} to ${otherPlayer.name}:`;
  prompt.push(lastPrompt);

  const { content } = await chatCompletion({
    messages: [
      {
        role: 'system',
        content: prompt.join('\n'),
      },
    ],
    max_tokens: 300,
    stop: stopWords(otherPlayer.name, player.name),
  });
  return trimContentPrefx(content, lastPrompt);
}

function trimContentPrefx(content: string, prompt: string) {
  if (content.startsWith(prompt)) {
    return content.slice(prompt.length).trim();
  }
  return content;
}

export async function continueConversationMessage(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  conversationId: GameId<'conversations'>,
  playerId: GameId<'players'>,
  otherPlayerId: GameId<'players'>,
): Promise<string> {
  const { player, otherPlayer, conversation, agent, otherAgent, relationship } =
    await ctx.runQuery(selfInternal.queryPromptData, {
      worldId,
      playerId,
      otherPlayerId,
      conversationId,
    });
  const now = Date.now();
  const started = new Date(conversation.created);
  const embedding = await embeddingsCache.fetch(
    ctx,
    `What do you think about ${otherPlayer.name}?`,
  );
  const memories = await memory.searchMemories(ctx, player.id as GameId<'players'>, embedding, 3);
  const prompt = [
    `你是${player.name}，你正在和${otherPlayer.name}交谈。`,
    `这段对话开始于 ${started.toLocaleString()}，现在是 ${now.toLocaleString()}。`,
  ];
  prompt.push(...agentPrompts(otherPlayer, agent, otherAgent ?? null));
  prompt.push(...relationshipPrompt(otherPlayer, relationship));
  prompt.push(...relatedMemoriesPrompt(memories));
  prompt.push(
    `下面是你和${otherPlayer.name}目前的聊天记录。`,
    `不要再重新打招呼。回答要简短，控制在 200 字以内。`,
  );
  prompt.push(LANG_INSTRUCTION);

  const llmMessages: LLMMessage[] = [
    {
      role: 'system',
      content: prompt.join('\n'),
    },
    // 参考 AutoGen 官方 BufferedChatCompletionContext 示例 buffer_size=5，这里只保留最近 5 条聊天记录。
    ...(await previousMessages(
      ctx,
      worldId,
      player,
      otherPlayer,
      conversation.id as GameId<'conversations'>,
    )).slice(-5),
  ];
  const lastPrompt = `${player.name} to ${otherPlayer.name}:`;
  llmMessages.push({ role: 'user', content: lastPrompt });

  const { content } = await chatCompletion({
    messages: llmMessages,
    max_tokens: 300,
    stop: stopWords(otherPlayer.name, player.name),
  });
  return trimContentPrefx(content, lastPrompt);
}

export async function leaveConversationMessage(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  conversationId: GameId<'conversations'>,
  playerId: GameId<'players'>,
  otherPlayerId: GameId<'players'>,
): Promise<string> {
  const { player, otherPlayer, conversation, agent, otherAgent, relationship } =
    await ctx.runQuery(selfInternal.queryPromptData, {
      worldId,
      playerId,
      otherPlayerId,
      conversationId,
    });
  const prompt = [
    `你是${player.name}，你正在和${otherPlayer.name}交谈。`,
    `你决定结束这次谈话。不要说客套话，直接找个符合你性格的理由结束。`,
  ];
  prompt.push(...agentPrompts(otherPlayer, agent, otherAgent ?? null));
  prompt.push(...relationshipPrompt(otherPlayer, relationship));
  prompt.push(
    `下面是你和${otherPlayer.name}目前的聊天记录。`,
    `你打算怎么结束？回答要简短，控制在 200 字以内，并给出一个具体理由。`,
  );
  prompt.push(LANG_INSTRUCTION);
  const llmMessages: LLMMessage[] = [
    {
      role: 'system',
      content: prompt.join('\n'),
    },
    // 参考 AutoGen 官方 BufferedChatCompletionContext 示例 buffer_size=5，这里只保留最近 5 条聊天记录。
    ...(await previousMessages(
      ctx,
      worldId,
      player,
      otherPlayer,
      conversation.id as GameId<'conversations'>,
    )).slice(-5),
  ];
  const lastPrompt = `${player.name} to ${otherPlayer.name}:`;
  llmMessages.push({ role: 'user', content: lastPrompt });

  const { content } = await chatCompletion({
    messages: llmMessages,
    max_tokens: 300,
    stop: stopWords(otherPlayer.name, player.name),
  });
  return trimContentPrefx(content, lastPrompt);
}

function agentPrompts(
  otherPlayer: { name: string },
  agent: { identity: string; plan: string; personalityDrift?: string | null } | null,
  otherAgent: { identity: string; plan: string } | null,
): string[] {
  const prompt = [];
  if (agent) {
    prompt.push(`关于你：${agent.identity}`);
    prompt.push(`你这次交谈的目标：${agent.plan}`);
    // 改动5：附加近期人设漂移，让性格微调体现在言谈中。
    if (agent.personalityDrift) {
      prompt.push(`近期变化：${agent.personalityDrift}`);
    }
  }
  if (otherAgent) {
    prompt.push(`关于${otherPlayer.name}：${otherAgent.identity}`);
  }
  return prompt;
}

function relationshipPrompt(otherPlayer: { name: string }, relationship: Relationship): string[] {
  if (!relationship) {
    return [];
  }
  const lines = [describeRelationship(otherPlayer.name, relationship)];
  // 改动4：关系值影响后续对话的附加提示（阈值按既有 0-100 关系模型映射）。
  if (relationship.favor > 65) {
    lines.push(`你对${otherPlayer.name}颇有好感，乐于帮助。`);
  }
  if (relationship.trust < 35) {
    lines.push(`你对${otherPlayer.name}心存警惕，言语间有所保留。`);
  }
  if (relationship.tension > 65) {
    lines.push(`你与${otherPlayer.name}之间剑拔弩张，随时可能起冲突。`);
  }
  return lines;
}

function taskPrompt(player: { name: string }): string[] {
  const hint = getTaskHint(player.name);
  if (!hint) {
    return [];
  }
  return [`你心里还揣着一个小目标 —— ${hint}（可以自然地体现在言谈举止里，不必生硬说出。）`];
}

function previousConversationPrompt(
  otherPlayer: { name: string },
  conversation: { created: number } | null,
): string[] {
  const prompt = [];
  if (conversation) {
    const prev = new Date(conversation.created);
    const now = new Date();
    prompt.push(
      `你上次和${otherPlayer.name}交谈是在 ${prev.toLocaleString()}，现在是 ${now.toLocaleString()}。`,
    );
  }
  return prompt;
}

function relatedMemoriesPrompt(memories: memory.Memory[]): string[] {
  const prompt = [];
  if (memories.length > 0) {
    prompt.push(`下面是一些相关的记忆，按相关度从高到低排列：`);
    for (const memory of memories) {
      prompt.push(' - ' + memory.description);
    }
  }
  return prompt;
}

async function previousMessages(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  player: { id: string; name: string },
  otherPlayer: { id: string; name: string },
  conversationId: GameId<'conversations'>,
) {
  const llmMessages: LLMMessage[] = [];
  const prevMessages = await ctx.runQuery(api.messages.listMessages, { worldId, conversationId });
  for (const message of prevMessages) {
    const author = message.author === player.id ? player : otherPlayer;
    const recipient = message.author === player.id ? otherPlayer : player;
    llmMessages.push({
      role: 'user',
      content: `${author.name} to ${recipient.name}: ${message.text}`,
    });
  }
  return llmMessages;
}

export const queryPromptData = internalQuery({
  args: {
    worldId: v.id('worlds'),
    playerId,
    otherPlayerId: playerId,
    conversationId,
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`World ${args.worldId} not found`);
    }
    const player = world.players.find((p) => p.id === args.playerId);
    if (!player) {
      throw new Error(`Player ${args.playerId} not found`);
    }
    const playerDescription = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .first();
    if (!playerDescription) {
      throw new Error(`Player description for ${args.playerId} not found`);
    }
    const otherPlayer = world.players.find((p) => p.id === args.otherPlayerId);
    if (!otherPlayer) {
      throw new Error(`Player ${args.otherPlayerId} not found`);
    }
    const otherPlayerDescription = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.otherPlayerId))
      .first();
    if (!otherPlayerDescription) {
      throw new Error(`Player description for ${args.otherPlayerId} not found`);
    }
    const conversation = world.conversations.find((c) => c.id === args.conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${args.conversationId} not found`);
    }
    const agent = world.agents.find((a) => a.playerId === args.playerId);
    if (!agent) {
      throw new Error(`Player ${args.playerId} not found`);
    }
    const agentDescription = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('agentId', agent.id))
      .first();
    if (!agentDescription) {
      throw new Error(`Agent description for ${agent.id} not found`);
    }
    const otherAgent = world.agents.find((a) => a.playerId === args.otherPlayerId);
    let otherAgentDescription;
    if (otherAgent) {
      otherAgentDescription = await ctx.db
        .query('agentDescriptions')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('agentId', otherAgent.id))
        .first();
      if (!otherAgentDescription) {
        throw new Error(`Agent description for ${otherAgent.id} not found`);
      }
    }
    const lastTogether = await ctx.db
      .query('participatedTogether')
      .withIndex('edge', (q) =>
        q
          .eq('worldId', args.worldId)
          .eq('player1', args.playerId)
          .eq('player2', args.otherPlayerId),
      )
      // Order by conversation end time descending.
      .order('desc')
      .first();

    let lastConversation = null;
    if (lastTogether) {
      lastConversation = await ctx.db
        .query('archivedConversations')
        .withIndex('worldId', (q) =>
          q.eq('worldId', args.worldId).eq('id', lastTogether.conversationId),
        )
        .first();
      if (!lastConversation) {
        throw new Error(`Conversation ${lastTogether.conversationId} not found`);
      }
    }

    // 轻关系层：读取「当前角色」对「对方」的关系值，用于注入对话 prompt。
    const relationshipRow = await ctx.db
      .query('relationships')
      .withIndex('byPair', (q) =>
        q
          .eq('worldId', args.worldId)
          .eq('fromName', playerDescription.name)
          .eq('toName', otherPlayerDescription.name),
      )
      .first();
    const relationship: Relationship = relationshipRow
      ? {
          favor: relationshipRow.favor,
          trust: relationshipRow.trust,
          tension: relationshipRow.tension,
        }
      : null;

    // 改动5：读取当前角色的人设漂移，注入对话 prompt（近期变化）。
    const driftRow = await ctx.db
      .query('personalityDrifts')
      .withIndex('byName', (q) =>
        q.eq('worldId', args.worldId).eq('name', playerDescription.name),
      )
      .first();
    const personalityDrift = driftRow?.drift ?? null;

    return {
      player: { name: playerDescription.name, ...player },
      otherPlayer: { name: otherPlayerDescription.name, ...otherPlayer },
      conversation,
      agent: {
        identity: agentDescription.identity,
        plan: agentDescription.plan,
        personalityDrift,
        ...agent,
      },
      otherAgent: otherAgent && {
        identity: otherAgentDescription!.identity,
        plan: otherAgentDescription!.plan,
        ...otherAgent,
      },
      lastConversation,
      relationship,
    };
  },
});

function stopWords(otherPlayer: string, player: string) {
  // These are the words we ask the LLM to stop on. OpenAI only supports 4.
  const variants = [`${otherPlayer} to ${player}`];
  return variants.flatMap((stop) => [stop + ':', stop.toLowerCase() + ':']);
}
