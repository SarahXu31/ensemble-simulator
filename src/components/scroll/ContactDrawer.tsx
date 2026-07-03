import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { GameId } from '../../../convex/aiTown/ids';
import { CloseIcon } from '../icons';

export type DrawerTarget = {
  title: string;
  subtitle?: string;
  participantNames: string[];
  conversationId?: string; // 有则拉真实消息
  eventText?: string; // worldEvent 卡：直接展示事件描述
  isBigEvent?: boolean;
};

type ContactDrawerProps = {
  worldId: Id<'worlds'>;
  target: DrawerTarget;
  onClose: () => void;
  onActorClick?: (name: string) => void;
};

export default function ContactDrawer({
  worldId,
  target,
  onClose,
  onActorClick,
}: ContactDrawerProps) {
  const messages = useQuery(
    api.messages.listMessages,
    target.conversationId
      ? { worldId, conversationId: target.conversationId as GameId<'conversations'> }
      : 'skip',
  );

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(26,26,26,0.18)' }} />
      <aside
        className="fmc-scroll absolute right-0 top-0 h-full w-[min(92vw,420px)] overflow-y-auto border-l p-6 shadow-2xl"
        style={{ borderColor: 'var(--kraft-brown)', backgroundColor: 'var(--paper-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {target.isBigEvent && (
              <span
                className="mb-1 inline-block rounded-sm px-1.5 py-0.5 font-caption text-[11px]"
                style={{ backgroundColor: 'var(--vermilion)', color: 'var(--paper-bg)' }}
              >
                大事件
              </span>
            )}
            <h2
              className="font-title text-3xl"
              style={{ color: 'var(--ink-900)', letterSpacing: '0.03em' }}
            >
              {target.title}
            </h2>
            {target.subtitle && (
              <p className="mt-1 font-caption text-xs text-ink-500">{target.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="cursor-pointer rounded-sm border border-kraft-brown p-1 text-ink-700 transition-colors hover:bg-paper-fold"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* 参与者 */}
        {target.participantNames.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {target.participantNames.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onActorClick?.(n)}
                className="cursor-pointer rounded-full border px-2.5 py-0.5 font-caption text-xs transition-colors hover:bg-paper-fold"
                style={{ borderColor: 'var(--kraft-brown)', color: 'var(--vermilion)' }}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {/* worldEvent：直接展示事件描述 */}
        {target.eventText && (
          <p
            className="font-body indent-8"
            style={{ color: 'var(--ink-900)', fontSize: '16px', lineHeight: 1.9 }}
          >
            {target.eventText}
          </p>
        )}

        {/* 对话：拉真实消息 */}
        {target.conversationId && (
          <div className="space-y-3">
            {messages === undefined && (
              <p className="font-caption text-sm text-ink-500">正在展开这段交谈……</p>
            )}
            {messages && messages.length === 0 && (
              <p className="font-caption text-sm text-ink-500">
                二人相对，尚未开口，且待下回。
              </p>
            )}
            {messages &&
              messages.map((m) => (
                <div key={m._id} className="font-body" style={{ lineHeight: 1.85 }}>
                  <button
                    type="button"
                    onClick={() => onActorClick?.(m.authorName)}
                    className="cursor-pointer font-semibold hover:underline"
                    style={{ color: 'var(--vermilion)', fontSize: '15px' }}
                  >
                    「{m.authorName}」
                  </button>
                  <p
                    className="mt-0.5 indent-8"
                    style={{ color: 'var(--ink-900)', fontSize: '15px' }}
                  >
                    {m.text}
                  </p>
                </div>
              ))}
          </div>
        )}
      </aside>
    </div>
  );
}
