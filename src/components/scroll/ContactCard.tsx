import { ContactRecord, RELATION_DELTA_THRESHOLD } from '../../data/contacts';
import { Avatar } from '../character/characterUtils';
import {
  BoltIcon,
  HeartCrackIcon,
  PersonaDriftIcon,
  MapPinIcon,
  ChevronRightIcon,
} from '../icons';

type ContactCardProps = {
  record: ContactRecord;
  onOpen: (record: ContactRecord) => void;
};

// 简易相对时间。
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return '刚刚';
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 时辰前`;
  return `${Math.floor(hr / 24)} 日前`;
}

const statusColor: Record<string, string> = {
  正在对话: 'var(--jade)',
  对话结束: 'var(--ink-500)',
  相遇: 'var(--kraft-dark)',
  独自行走: 'var(--ink-500)',
};

// 高亮小标签
function HighlightTag({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-caption text-[11px]"
      style={{ backgroundColor: 'rgba(184,58,58,0.08)', color: 'var(--vermilion)' }}
    >
      {icon}
      {label}
    </span>
  );
}

export default function ContactCard({ record, onOpen }: ContactCardProps) {
  const hasRelationBreak =
    !!record.relationshipDelta &&
    Math.abs(record.relationshipDelta.delta) > RELATION_DELTA_THRESHOLD;
  const highlighted = record.isBigEvent || hasRelationBreak || !!record.personaDrift;

  const names = record.participantNames.length ? record.participantNames : ['风莫村'];

  return (
    <button
      type="button"
      onClick={() => onOpen(record)}
      className="fmc-enter group my-2.5 flex w-full cursor-pointer items-center gap-3 rounded-sm px-4 py-3 text-left transition-colors hover:bg-paper-fold"
      style={{
        backgroundColor: 'var(--paper-warm)',
        border: '1px solid var(--kraft-brown)',
        borderLeft: highlighted ? '4px solid var(--vermilion)' : '1px solid var(--kraft-brown)',
      }}
    >
      {/* 头像（最多两个叠放） */}
      <div className="flex shrink-0 -space-x-2">
        {names.slice(0, 2).map((n) => (
          <span
            key={n}
            className="inline-block rounded-full"
            style={{ boxShadow: '0 0 0 2px var(--paper-warm)' }}
          >
            <Avatar name={n} size={32} />
          </span>
        ))}
      </div>

      {/* 主体 */}
      <div className="min-w-0 flex-1">
        {/* 高亮标签行 */}
        {highlighted && (
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {record.isBigEvent && (
              <HighlightTag icon={<BoltIcon size={12} />} label={`大事件${record.bigEventTitle ? ' · ' + record.bigEventTitle : ''}`} />
            )}
            {hasRelationBreak && (
              <HighlightTag icon={<HeartCrackIcon size={12} />} label="感情巨变" />
            )}
            {record.personaDrift && (
              <HighlightTag icon={<PersonaDriftIcon size={12} />} label="人设漂移" />
            )}
          </div>
        )}

        {/* 参与者 · 状态 */}
        <div className="flex items-center gap-2">
          <span
            className="truncate font-body text-[15px]"
            style={{ color: 'var(--ink-900)' }}
          >
            {names.join(' 与 ')}
          </span>
          <span
            className="shrink-0 font-caption text-[11px]"
            style={{ color: statusColor[record.status] ?? 'var(--ink-500)' }}
          >
            · {record.status}
          </span>
        </div>

        {/* 地点 · 时间 · 消息数 / 漂移说明 */}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-caption text-[11px] text-ink-500">
          <span className="inline-flex items-center gap-1">
            <MapPinIcon size={11} />
            {record.location ?? '村中某处'}
          </span>
          <span>{relativeTime(record.endedAt ?? record.startedAt)}</span>
          {record.messageCount > 0 && <span>{record.messageCount} 句往来</span>}
          {record.personaDrift && (
            <span style={{ color: 'var(--umber)' }}>
              {record.personaDrift.role}：{record.personaDrift.summary}
            </span>
          )}
        </div>
      </div>

      {/* 展开箭头 */}
      <span className="shrink-0 text-ink-500 transition-colors group-hover:text-ink-700">
        <ChevronRightIcon size={16} />
      </span>
    </button>
  );
}
