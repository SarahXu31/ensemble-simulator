export const ACTION_TIMEOUT = 120_000; // more time for local dev
// export const ACTION_TIMEOUT = 60_000;// normally fine

export const IDLE_WORLD_TIMEOUT = 5 * 60 * 1000;
export const WORLD_HEARTBEAT_INTERVAL = 60 * 1000;

export const MAX_STEP = 10 * 60 * 1000;
export const TICK = 16;
export const STEP_INTERVAL = 1000;

export const PATHFINDING_TIMEOUT = 60 * 1000;
export const PATHFINDING_BACKOFF = 1000;
export const CONVERSATION_DISTANCE = 1.3;
export const MIDPOINT_THRESHOLD = 4;
export const TYPING_TIMEOUT = 15 * 1000;
export const COLLISION_THRESHOLD = 0.75;

// How many human players can be in a world at once.
export const MAX_HUMAN_PLAYERS = 8;

// Don't talk to anyone for 15s after having a conversation.
export const CONVERSATION_COOLDOWN = 15000;

// Don't do another activity for 10s after doing one.
export const ACTIVITY_COOLDOWN = 10_000;

// Don't talk to a player within 60s of talking to them.
export const PLAYER_CONVERSATION_COOLDOWN = 60000;

// Invite 80% of invites that come from other agents.
export const INVITE_ACCEPT_PROBABILITY = 0.8;

// Wait for 1m for invites to be accepted.
export const INVITE_TIMEOUT = 60000;

// Wait for another player to say something before jumping in.
export const AWKWARD_CONVERSATION_TIMEOUT = 60_000; // more time locally
// export const AWKWARD_CONVERSATION_TIMEOUT = 20_000;

// Leave a conversation after participating too long.
export const MAX_CONVERSATION_DURATION = 10 * 60_000; // more time locally
// export const MAX_CONVERSATION_DURATION = 2 * 60_000;

// Leave a conversation if it has more than 8 messages;
export const MAX_CONVERSATION_MESSAGES = 8;

// Wait for 1s after sending an input to the engine. We can remove this
// once we can await on an input being processed.
export const INPUT_DELAY = 1000;

// How many memories to get from the agent's memory.
// This is over-fetched by 10x so we can prioritize memories by more than relevance.
export const NUM_MEMORIES_TO_SEARCH = 3;

// Wait for at least two seconds before sending another message.
export const MESSAGE_COOLDOWN = 2000;

// Don't run a turn of the agent more than once a second.
export const AGENT_WAKEUP_THRESHOLD = 1000;

// How old we let memories be before we vacuum them
export const VACUUM_MAX_AGE = 2 * 7 * 24 * 60 * 60 * 1000;
export const DELETE_BATCH_SIZE = 64;

export const HUMAN_IDLE_TOO_LONG = 5 * 60 * 1000;

export const ACTIVITIES = [
  { description: 'reading a book', emoji: '📖', duration: 60_000 },
  { description: 'daydreaming', emoji: '🤔', duration: 60_000 },
  { description: 'gardening', emoji: '🥕', duration: 60_000 },
];

export const ENGINE_ACTION_DURATION = 30000;

// Bound the number of pathfinding searches we do per game step.
export const MAX_PATHFINDS_PER_STEP = 16;

export const DEFAULT_NAME = '外乡人';

// ── 改动1 & 改动6：游戏时间倍速（time scale）───────────────────────────
// 倍速 = 游戏内时间流速相对现实的倍数。8x 表示游戏内 1 小时 = 现实 7.5 分钟。
export const DEFAULT_TIME_SCALE = 8; // 默认 8x（改动1）
// 可选档位：慢节奏 4x / 默认 8x / 快进 16x / 测试模式 60x（改动6）
export const TIME_SCALE_PRESETS = [4, 8, 16, 60] as const;
// localStorage 键名，前端保存用户所选倍速（改动6）。
export const TIME_SCALE_STORAGE_KEY = 'fengmo_time_scale';

// 关系值 LLM 打分的基准间隔：DEFAULT_TIME_SCALE(8x) 下每现实 8 小时一次（改动4）。
export const RELATION_SCORING_BASE_MS = 8 * 60 * 60 * 1000; // 28,800,000ms
// 人设漂移的基准间隔：DEFAULT_TIME_SCALE(8x) 下每现实 24 小时一次（改动5）。
export const PERSONA_DRIFT_BASE_MS = 24 * 60 * 60 * 1000; // 86,400,000ms

// 把「基准倍速(8x)下配置的现实时长」按当前倍速换算为等效现实时长（改动6）。
// 倍速越高游戏跑得越快，同样的游戏内进度所需现实时间越短。
// 例：关系打分基准 8h@8x，16x 时换算为 4h，4x 时换算为 16h。
export function scaledRealMs(baseRealMsAt8x: number, scale: number): number {
  const s = scale > 0 ? scale : DEFAULT_TIME_SCALE;
  return (baseRealMsAt8x * DEFAULT_TIME_SCALE) / s;
}
