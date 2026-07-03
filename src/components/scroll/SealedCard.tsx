import { StoryEvent } from '../../data/types';
import { SquareSeal } from '../icons';

// 大事件牌签（MASTER.md 5.2）：importance=3 的事件以此呈现。
export default function SealedCard({ event }: { event: StoryEvent }) {
  return (
    <article
      className="fmc-seal-enter my-6 rounded-sm"
      style={{
        backgroundColor: 'var(--paper-warm)',
        border: '2px solid var(--kraft-dark)',
      }}
    >
      {/* 顶部条：章节序号 + 事件名 + 朱砂方印 */}
      <div
        className="flex items-center gap-2 border-b px-5 py-2.5"
        style={{ borderColor: 'var(--kraft-brown)' }}
      >
        <SquareSeal size={12} />
        <span className="font-caption text-xs" style={{ color: 'var(--kraft-dark)' }}>
          {event.chapterNo ? `${event.chapterNo} · ` : ''}
          {event.title}
        </span>
      </div>

      {/* 正文 */}
      <div className="px-5 py-4">
        <p
          className="font-body indent-8"
          style={{ color: 'var(--ink-900)', fontSize: '17px', lineHeight: 1.9 }}
        >
          {event.text}
        </p>
        {/* 底部右对齐：世界时辰 */}
        <div className="mt-3 text-right">
          <span className="font-caption text-xs text-ink-500">第 {event.ts} 时辰记</span>
        </div>
      </div>
    </article>
  );
}
