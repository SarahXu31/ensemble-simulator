import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { GameId } from '../../convex/aiTown/ids';
import { useServerGame } from '../hooks/serverGame';
import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat';
import ScrollFeed from './scroll/ScrollFeed';
import CharacterSheet from './character/CharacterSheet';
import { CloseIcon } from './icons';

// 保留以兼容仍存在（但不再渲染）的 Pixi 相关文件，便于回滚。
export const SHOW_DEBUG_UI = !!import.meta.env.VITE_SHOW_DEBUG_UI;

export default function Game() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<GameId<'players'>>();

  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const engineId = worldStatus?.engineId;
  const game = useServerGame(worldId);

  // 心跳，保持世界存活。
  useWorldHeartbeat();

  if (!worldId || !engineId || !game) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="font-body text-sm text-ink-500">卷轴徐徐展开，稍候……</p>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_320px]">
      {/* 主栏 · 事件卷轴 */}
      <div className="min-h-0">
        <ScrollFeed worldId={worldId} game={game} onSelectPlayer={setSelectedPlayerId} />
      </div>

      {/* 右栏 · 人物簿（lg+ 常驻，粘顶） */}
      <aside
        className="hidden min-h-0 border-l lg:block"
        style={{ borderColor: 'var(--kraft-brown)', backgroundColor: 'var(--paper-warm)' }}
      >
        <CharacterSheet
          worldId={worldId}
          engineId={engineId}
          game={game}
          playerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
        />
      </aside>

      {/* 移动端 · 人物簿折叠为顶部抽屉（选中角色时出现，非全屏遮罩） */}
      {!!selectedPlayerId && (
        <div
          className="fixed inset-x-0 top-14 z-20 max-h-[70vh] overflow-hidden border-b shadow-lg lg:hidden"
          style={{ borderColor: 'var(--kraft-brown)', backgroundColor: 'var(--paper-warm)' }}
        >
          <div className="flex justify-end px-3 pt-2">
            <button
              type="button"
              aria-label="收起人物簿"
              onClick={() => setSelectedPlayerId(undefined)}
              className="cursor-pointer rounded-sm border border-kraft-brown p-1 text-ink-700"
            >
              <CloseIcon size={16} />
            </button>
          </div>
          <div className="max-h-[62vh] overflow-y-auto">
            <CharacterSheet
              worldId={worldId}
              engineId={engineId}
              game={game}
              playerId={selectedPlayerId}
              onSelectPlayer={setSelectedPlayerId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
