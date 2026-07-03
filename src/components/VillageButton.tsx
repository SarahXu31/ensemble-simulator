import { useCallback } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { toast } from 'react-toastify';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { waitForInput } from '../hooks/sendInput';
import { useServerGame } from '../hooks/serverGame';

// 「进村走走 / 离开村子」—— 沿用原 InteractButton 的 Convex 逻辑，换上宣纸皮肤。
export default function VillageButton() {
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const game = useServerGame(worldId);
  const humanTokenIdentifier = useQuery(api.world.userStatus, worldId ? { worldId } : 'skip');
  const userPlayerId =
    game && [...game.world.players.values()].find((p) => p.human === humanTokenIdentifier)?.id;
  const join = useMutation(api.world.joinWorld);
  const leave = useMutation(api.world.leaveWorld);
  const isPlaying = !!userPlayerId;

  const convex = useConvex();
  const joinInput = useCallback(
    async (worldId: Id<'worlds'>) => {
      let inputId;
      try {
        inputId = await join({ worldId });
      } catch (e: any) {
        if (e instanceof ConvexError) {
          toast.error(e.data);
          return;
        }
        throw e;
      }
      try {
        await waitForInput(convex, inputId);
      } catch (e: any) {
        toast.error(e.message);
      }
    },
    [convex, join],
  );

  const joinOrLeaveGame = () => {
    if (!worldId || game === undefined) return;
    if (isPlaying) {
      console.log(`Leaving game for player ${userPlayerId}`);
      void leave({ worldId });
    } else {
      console.log(`Joining game`);
      void joinInput(worldId);
    }
  };

  return (
    <button
      type="button"
      onClick={joinOrLeaveGame}
      className="cursor-pointer rounded-full border px-4 py-2 font-caption text-sm shadow-sm transition-colors"
      style={
        isPlaying
          ? { borderColor: 'var(--kraft-brown)', backgroundColor: 'var(--paper-warm)', color: 'var(--ink-700)' }
          : { borderColor: 'var(--vermilion)', backgroundColor: 'var(--vermilion)', color: 'var(--paper-bg)' }
      }
    >
      {isPlaying ? '离开村子' : '进村走走'}
    </button>
  );
}
