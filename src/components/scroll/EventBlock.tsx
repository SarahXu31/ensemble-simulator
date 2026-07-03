import { StoryEvent } from '../../data/types';
import SealedCard from './SealedCard';
import { TrendUpIcon, TrendDownIcon } from '../icons';

type EventBlockProps = {
  event: StoryEvent;
  // 点击对话说话人名 → 在右栏人物簿中查看该角色
  onActorClick?: (name: string) => void;
};

export default function EventBlock({ event, onActorClick }: EventBlockProps) {
  // importance=3 一律渲染为牌签
  if (event.importance === 3) {
    return <SealedCard event={event} />;
  }

  switch (event.type) {
    case 'chapter':
      return (
        <div className="fmc-enter my-10 flex items-center justify-center gap-4">
          <span className="h-px flex-1" style={{ backgroundColor: 'var(--kraft-brown)' }} />
          <div className="flex flex-col items-center">
            {event.chapterNo ? (
              <span className="font-caption text-xs tracking-widest text-ink-500">
                {event.chapterNo}
              </span>
            ) : null}
            <span
              className="font-title text-3xl sm:text-4xl"
              style={{ color: 'var(--ink-900)', letterSpacing: '0.05em' }}
            >
              {event.title}
            </span>
          </div>
          <span className="h-px flex-1" style={{ backgroundColor: 'var(--kraft-brown)' }} />
        </div>
      );

    case 'narration':
      return (
        <p
          className="fmc-enter my-4 indent-8 font-body"
          style={{ color: 'var(--ink-700)', fontSize: '16px', lineHeight: 1.9 }}
        >
          {event.text}
        </p>
      );

    case 'dialogue': {
      const speaker = event.actors[0] ?? '不知何人';
      return (
        <div className="fmc-enter my-4 font-body" style={{ lineHeight: 1.9 }}>
          <button
            type="button"
            onClick={() => onActorClick?.(speaker)}
            className="cursor-pointer font-semibold hover:underline"
            style={{ color: 'var(--vermilion)', fontSize: '16px' }}
          >
            「{speaker}」
          </button>
          <p className="mt-0.5 indent-8" style={{ color: 'var(--ink-900)', fontSize: '16px' }}>
            {event.text}
          </p>
        </div>
      );
    }

    case 'encounter':
      return (
        <article
          className="fmc-enter my-5 rounded-sm px-5 py-4"
          style={{
            backgroundColor: 'var(--paper-warm)',
            border: '1px solid var(--kraft-brown)',
          }}
        >
          {event.actors.length > 0 && (
            <div className="mb-1.5 font-caption text-xs text-ink-500">
              {event.actors.join(' · ')}
            </div>
          )}
          <p className="font-body" style={{ color: 'var(--ink-900)', fontSize: '16px', lineHeight: 1.9 }}>
            {event.text}
          </p>
        </article>
      );

    case 'relationship': {
      const down = event.relationDelta === 'down';
      const accent = down ? 'var(--umber)' : 'var(--jade)';
      return (
        <div
          className="fmc-enter my-3 flex items-center gap-2 py-1 pl-3"
          style={{ borderLeft: `3px solid ${accent}` }}
        >
          <span style={{ color: accent }}>
            {down ? <TrendDownIcon size={16} /> : <TrendUpIcon size={16} />}
          </span>
          <p className="font-body text-sm" style={{ color: 'var(--ink-700)' }}>
            {event.text}
          </p>
        </div>
      );
    }

    case 'system':
      return (
        <div
          className="fmc-enter my-3 py-1 pl-3"
          style={{ borderLeft: '4px solid var(--vermilion)' }}
        >
          <p className="font-caption text-xs" style={{ color: 'var(--ink-500)', lineHeight: 1.7 }}>
            {event.text}
          </p>
        </div>
      );

    default:
      return null;
  }
}
