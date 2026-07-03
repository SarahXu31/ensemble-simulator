import { ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { PauseIcon, PlayIcon, FastForwardIcon } from '../icons';

// 会话开启时刻，用于计算「开局距今」。
const SESSION_START = Date.now();
const HOUR_MS = 60 * 60 * 1000;

// 改动1&6：读取当前时间倍速（localStorage: fengmo_time_scale，默认 8x）。
function readTimeScale(): number {
  try {
    const n = Number(localStorage.getItem('fengmo_time_scale'));
    return n > 0 ? n : 8;
  } catch {
    return 8;
  }
}

function useWorldClock(worldTime?: number) {
  const now = worldTime ?? Date.now();
  const elapsedMs = Math.max(0, now - SESSION_START);
  // 改动1&6：游戏内时间 = 现实经过时间 × 倍速。8x 时 1 游戏小时 = 现实 7.5 分钟。
  const scale = readTimeScale();
  const gameHours = (elapsedMs * scale) / HOUR_MS;
  const hours = Math.floor(gameHours);
  // 「世界时辰」以游戏内每 2 小时推进一个时辰刻度，给出章回小说式的时序感。
  const shichen = 47 + Math.floor(gameHours / 2);
  return { shichen, elapsedHours: hours };
}

type CtrlButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
};

function CtrlButton({ label, active, disabled, onClick, children }: CtrlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex h-9 w-9 items-center justify-center rounded-sm border transition-colors',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        active
          ? 'border-vermilion bg-vermilion text-paper-bg'
          : 'border-kraft-brown text-ink-700 hover:bg-paper-fold',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export default function WorldStatusBar({ worldTime }: { worldTime?: number }) {
  const stopAllowed = useQuery(api.testing.stopAllowed) ?? false;
  const defaultWorld = useQuery(api.world.defaultWorldStatus);
  const frozen = defaultWorld?.status === 'stoppedByDeveloper';

  const unfreeze = useMutation(api.testing.resume);
  const freeze = useMutation(api.testing.stop);

  const { shichen, elapsedHours } = useWorldClock(worldTime);

  const onPause = async () => {
    if (!stopAllowed || frozen) return;
    console.log('Freezing world');
    await freeze();
  };
  const onPlay = async () => {
    if (!stopAllowed || !frozen) return;
    console.log('Unfreezing world');
    await unfreeze();
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-4 sm:px-8"
      style={{ borderColor: 'var(--kraft-brown)', backgroundColor: 'var(--paper-bg)' }}
    >
      {/* 左：村名 + 纪年 + 节气 */}
      <div className="flex min-w-0 items-baseline gap-2 sm:gap-3">
        <span
          className="font-title text-2xl leading-none sm:text-3xl"
          style={{ color: 'var(--ink-900)', letterSpacing: '0.05em' }}
        >
          风莫村
        </span>
        <span className="hidden font-caption text-xs text-ink-500 sm:inline">·</span>
        <span className="font-caption text-xs text-ink-500 sm:text-sm">建元三年</span>
        <span className="font-caption text-xs text-ink-500">·</span>
        <span className="font-caption text-xs text-ink-500 sm:text-sm">春末</span>
      </div>

      {/* 中：世界时辰 + 开局距今 */}
      <div className="hidden flex-col items-center leading-tight md:flex">
        <span className="font-caption text-sm text-ink-700">第 {shichen} 时辰</span>
        <span className="font-caption text-[11px] text-ink-500">开局 {elapsedHours}h</span>
      </div>

      {/* 右：时序控制 —— 暂停 / 播放 / 快进 */}
      <div className="flex items-center gap-2">
        <span className="mr-1 hidden font-caption text-xs text-ink-500 sm:inline">时序</span>
        <CtrlButton
          label={stopAllowed ? '暂停世界' : '暂停（当前部署未开放）'}
          active={frozen}
          disabled={!stopAllowed || frozen}
          onClick={onPause}
        >
          <PauseIcon size={18} />
        </CtrlButton>
        <CtrlButton
          label={stopAllowed ? '继续推进' : '播放（当前部署未开放）'}
          active={!frozen}
          disabled={!stopAllowed || !frozen}
          onClick={onPlay}
        >
          <PlayIcon size={18} />
        </CtrlButton>
        <CtrlButton label="快进（暂未开放）" disabled>
          <FastForwardIcon size={18} />
        </CtrlButton>
      </div>
    </header>
  );
}
