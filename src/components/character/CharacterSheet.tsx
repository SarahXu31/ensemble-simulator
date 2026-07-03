import { ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { GameId } from '../../../convex/aiTown/ids';
import { ServerGame } from '../../hooks/serverGame';
import { useSendInput } from '../../hooks/sendInput';
import { toastOnError } from '../../toasts';
import { INITIAL_RELATIONSHIPS } from '../../../data/relationships';
import { Avatar, inferGender, parseIdentity } from './characterUtils';
import { CloseIcon } from '../icons';

type CharacterSheetProps = {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  game: ServerGame;
  playerId?: GameId<'players'>;
  onSelectPlayer: (playerId?: GameId<'players'>) => void;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-0.5 font-caption text-xs" style={{ color: 'var(--kraft-dark)' }}>
        {label}
      </div>
      <div className="font-body text-sm" style={{ color: 'var(--ink-900)', lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  );
}

export default function CharacterSheet({
  worldId,
  engineId,
  game,
  playerId,
  onSelectPlayer,
}: CharacterSheetProps) {
  const humanTokenIdentifier = useQuery(api.world.userStatus, { worldId });

  const players = [...game.world.players.values()];
  const humanPlayer = players.find((p) => p.human === humanTokenIdentifier);
  const humanConversation = humanPlayer ? game.world.playerConversation(humanPlayer) : undefined;
  // 若正与某人交谈，自动定位到对方。
  if (humanPlayer && humanConversation) {
    const otherPlayerIds = [...humanConversation.participants.keys()].filter(
      (p) => p !== humanPlayer.id,
    );
    playerId = otherPlayerIds[0];
  }

  const player = playerId && game.world.players.get(playerId);
  const playerConversation = player && game.world.playerConversation(player);
  const playerDescription = playerId && game.playerDescriptions.get(playerId);

  const startConversation = useSendInput(engineId, 'startConversation');
  const acceptInvite = useSendInput(engineId, 'acceptInvite');
  const rejectInvite = useSendInput(engineId, 'rejectInvite');
  const leaveConversation = useSendInput(engineId, 'leaveConversation');

  // 空态
  if (!playerId || !player || !playerDescription) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="font-body text-sm" style={{ color: 'var(--ink-500)', lineHeight: 1.9 }}>
          点击左侧对话记录中的角色查看人设。
        </p>
      </div>
    );
  }

  const isMe = humanPlayer && player.id === humanPlayer.id;
  const canInvite = !isMe && !playerConversation && humanPlayer && !humanConversation;
  const sameConversation =
    !isMe &&
    humanPlayer &&
    humanConversation &&
    playerConversation &&
    humanConversation.id === playerConversation.id;

  const humanStatus =
    humanPlayer && humanConversation && humanConversation.participants.get(humanPlayer.id)?.status;
  const playerStatus = playerConversation && playerConversation.participants.get(playerId)?.status;

  const haveInvite = sameConversation && humanStatus?.kind === 'invited';
  const waitingForAccept =
    sameConversation &&
    playerConversation &&
    playerConversation.participants.get(playerId)?.status.kind === 'invited';
  const waitingForNearby =
    sameConversation && playerStatus?.kind === 'walkingOver' && humanStatus?.kind === 'walkingOver';
  const inConversationWithMe =
    sameConversation &&
    playerStatus?.kind === 'participating' &&
    humanStatus?.kind === 'participating';

  const onStartConversation = async () => {
    if (!humanPlayer || !playerId) return;
    console.log('Starting conversation');
    await toastOnError(startConversation({ playerId: humanPlayer.id, invitee: playerId }));
  };
  const onAcceptInvite = async () => {
    if (!humanPlayer || !humanConversation || !playerId) return;
    await toastOnError(
      acceptInvite({ playerId: humanPlayer.id, conversationId: humanConversation.id }),
    );
  };
  const onRejectInvite = async () => {
    if (!humanPlayer || !humanConversation) return;
    await toastOnError(
      rejectInvite({ playerId: humanPlayer.id, conversationId: humanConversation.id }),
    );
  };
  const onLeaveConversation = async () => {
    if (!humanPlayer || !inConversationWithMe || !humanConversation) return;
    await toastOnError(
      leaveConversation({ playerId: humanPlayer.id, conversationId: humanConversation.id }),
    );
  };

  const { brief, secrets } = parseIdentity(playerDescription.description);
  const gender = inferGender(playerDescription.name, playerDescription.description);

  // 该角色的行动纲领（plan）
  const agent = [...game.world.agents.values()].find((a) => a.playerId === playerId);
  const plan = agent && game.agentDescriptions.get(agent.id)?.plan;

  // 关系网（来自预设初始关系值）
  const rel = INITIAL_RELATIONSHIPS[playerDescription.name] as
    | Record<string, { favor: number; trust: number; tension: number }>
    | undefined;

  return (
    <div className="fmc-scroll flex h-full flex-col overflow-y-auto px-5 py-6">
      {/* 头部：头像 + 名字 + 性别 + 关闭 */}
      <div className="flex items-start gap-3">
        <Avatar name={playerDescription.name} size={64} />
        <div className="min-w-0 flex-1">
          <h2
            className="font-title text-2xl leading-tight"
            style={{ color: 'var(--ink-900)', letterSpacing: '0.03em' }}
          >
            {playerDescription.name}
          </h2>
          <span className="font-caption text-xs text-ink-500">{gender}</span>
        </div>
        <button
          type="button"
          aria-label="收起人物簿"
          title="收起"
          onClick={() => onSelectPlayer(undefined)}
          className="cursor-pointer rounded-sm border border-kraft-brown p-1 text-ink-700 transition-colors hover:bg-paper-fold"
        >
          <CloseIcon size={16} />
        </button>
      </div>

      <div className="my-4 h-px" style={{ backgroundColor: 'var(--paper-fold)' }} />

      {/* 当前活动 */}
      {!playerConversation && player.activity && player.activity.until > Date.now() && (
        <Field label="此刻">{player.activity.description}</Field>
      )}

      {/* 性情 */}
      {isMe ? (
        <Field label="身份">
          <i>这是你自己 —— 一名路过的外乡人。</i>
        </Field>
      ) : (
        brief && <Field label="性情 · 怪癖 · 爱好">{brief}</Field>
      )}

      {/* 心之所向 */}
      {!isMe && plan && <Field label="心之所向">{plan}</Field>}

      {/* 关系网 mini list */}
      {!isMe && rel && Object.keys(rel).length > 0 && (
        <div className="mb-3">
          <div className="mb-1 font-caption text-xs" style={{ color: 'var(--kraft-dark)' }}>
            关系网
          </div>
          <ul className="space-y-1">
            {Object.entries(rel).map(([other, v]) => (
              <li
                key={other}
                className="flex items-center justify-between border-b py-1 font-caption text-xs"
                style={{ borderColor: 'var(--paper-fold)' }}
              >
                <span style={{ color: 'var(--ink-900)' }}>{other}</span>
                <span className="text-ink-500">
                  好感 {v.favor} · 戒备 {v.tension}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 秘密（模糊，hover 展开） */}
      {!isMe && secrets.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 font-caption text-xs" style={{ color: 'var(--kraft-dark)' }}>
            秘密（悬停展开）
          </div>
          {secrets.map((s) => (
            <p
              key={s}
              tabIndex={0}
              className="fmc-secret mb-1 font-body text-sm"
              style={{ color: 'var(--ink-700)', lineHeight: 1.8 }}
            >
              {s}
            </p>
          ))}
        </div>
      )}

      {/* 底部 CTA */}
      <div className="mt-auto pt-4">
        {canInvite && (
          <button
            type="button"
            onClick={onStartConversation}
            className="w-full cursor-pointer rounded-sm py-2.5 font-caption text-sm text-paper-bg transition-colors"
            style={{ backgroundColor: 'var(--vermilion)' }}
          >
            发起对话
          </button>
        )}
        {waitingForAccept && (
          <div className="w-full rounded-sm border border-kraft-brown py-2.5 text-center font-caption text-sm text-ink-500">
            等待对方应答……
          </div>
        )}
        {waitingForNearby && (
          <div className="w-full rounded-sm border border-kraft-brown py-2.5 text-center font-caption text-sm text-ink-500">
            正在走近……
          </div>
        )}
        {haveInvite && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAcceptInvite}
              className="flex-1 cursor-pointer rounded-sm py-2.5 font-caption text-sm text-paper-bg"
              style={{ backgroundColor: 'var(--vermilion)' }}
            >
              应答
            </button>
            <button
              type="button"
              onClick={onRejectInvite}
              className="flex-1 cursor-pointer rounded-sm border border-kraft-brown py-2.5 font-caption text-sm text-ink-700 transition-colors hover:bg-paper-fold"
            >
              回绝
            </button>
          </div>
        )}
        {inConversationWithMe && (
          <button
            type="button"
            onClick={onLeaveConversation}
            className="w-full cursor-pointer rounded-sm border border-kraft-brown py-2.5 font-caption text-sm text-ink-700 transition-colors hover:bg-paper-fold"
          >
            结束攀谈
          </button>
        )}
        {!humanPlayer && !isMe && (
          <p className="text-center font-caption text-xs text-ink-500">
            点右下角「进村走走」，方可与村民攀谈。
          </p>
        )}
      </div>
    </div>
  );
}
