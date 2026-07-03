import { lazy, Suspense, useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { ToastContainer } from 'react-toastify';
import { api } from '../convex/_generated/api';
import Game from './components/Game.tsx';
import WorldStatusBar from './components/scroll/WorldStatusBar.tsx';
import VillageButton from './components/VillageButton.tsx';
import { HelpIcon, CloseIcon, UserPlusIcon, FeatherIcon } from './components/icons.tsx';
import { MAX_HUMAN_PLAYERS } from '../convex/constants.ts';

const CharacterCreation = lazy(() => import('./components/character/CharacterCreation.tsx'));
const CharacterEditor = lazy(() => import('./components/character/CharacterEditor.tsx'));

export default function Home() {
  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const forced = params.get('onboard') === '1';

  const [helpOpen, setHelpOpen] = useState(false);
  const [creationOpen, setCreationOpen] = useState(forced);
  const [editorOpen, setEditorOpen] = useState(false);

  // 改动3：监听「打开设置」事件（RecentHappenings 未配置 LLM Key 时会派发），打开角色编辑器（内含设置区）。
  useEffect(() => {
    const openSettings = () => setEditorOpen(true);
    window.addEventListener('fengmo:open-settings', openSettings);
    return () => window.removeEventListener('fengmo:open-settings', openSettings);
  }, []);

  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;

  const hasProfiles = useQuery(
    api.characterProfiles.hasProfiles,
    worldId ? { worldId } : 'skip',
  );

  const openCreation = () => setCreationOpen(true);
  const closeCreation = () => {
    setCreationOpen(false);
    try {
      localStorage.setItem('fmc_onboarded', '1');
    } catch {
      /* ignore */
    }
  };

  // ── 三态判定 ──
  // 1. 世界未就绪 → loading
  // 2. hasProfiles === false（或用户主动编辑）→ 全屏 CharacterEditor
  // 3. hasProfiles === true 且未编辑 → 游戏主界面

  const isLoading = worldStatus === undefined || hasProfiles === undefined;
  const showEditor = !isLoading && (editorOpen || hasProfiles === false);

  if (isLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--paper-bg)' }}
      >
        <p className="font-caption text-sm text-ink-500">世界正在苏醒……</p>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="h-screen" style={{ backgroundColor: 'var(--paper-bg)' }}>
        <Suspense
          fallback={<div style={{ color: '#8b6914', textAlign: 'center', marginTop: '2rem' }}>载入中…</div>}
        >
          <CharacterEditor
            worldId={worldId}
            onClose={() => setEditorOpen(false)}
          />
        </Suspense>
        <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="light" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: 'var(--paper-bg)' }}>
      <WorldStatusBar />

      <main className="relative min-h-0 flex-1">
        <Game />
      </main>

      {/* 右下角控制簇：进村 / 编辑人物 / 新建角色 / 帮助 */}
      <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2">
        <VillageButton />
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 font-caption text-sm shadow-sm transition-colors hover:bg-paper-fold"
          style={{
            borderColor: 'var(--kraft-brown)',
            backgroundColor: 'var(--paper-warm)',
            color: 'var(--ink-700)',
          }}
        >
          <FeatherIcon size={16} />
          编辑人物
        </button>
        <button
          type="button"
          onClick={openCreation}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 font-caption text-sm shadow-sm transition-colors hover:bg-paper-fold"
          style={{
            borderColor: 'var(--kraft-brown)',
            backgroundColor: 'var(--paper-warm)',
            color: 'var(--ink-700)',
          }}
        >
          <UserPlusIcon size={16} />
          新建角色
        </button>
        <button
          type="button"
          aria-label="进村须知"
          title="进村须知"
          onClick={() => setHelpOpen(true)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-colors hover:bg-paper-fold"
          style={{
            borderColor: 'var(--kraft-brown)',
            backgroundColor: 'var(--paper-warm)',
            color: 'var(--kraft-dark)',
          }}
        >
          <HelpIcon size={18} />
        </button>
      </div>

      {/* 极简 footer（左下细字灰色） */}
      <footer className="pointer-events-none fixed bottom-4 left-4 z-20 flex items-center gap-3 font-caption text-xs text-ink-500">
        <a
          className="pointer-events-auto hover:text-ink-700"
          href="https://a16z.com"
          target="_blank"
          rel="noreferrer"
        >
          a16z
        </a>
        <span>·</span>
        <a
          className="pointer-events-auto hover:text-ink-700"
          href="https://convex.dev/c/ai-town"
          target="_blank"
          rel="noreferrer"
        >
          Convex
        </a>
        <span>·</span>
        <a
          className="pointer-events-auto hover:text-ink-700"
          href="https://github.com/a16z-infra/ai-town"
          target="_blank"
          rel="noreferrer"
        >
          GitHub Star
        </a>
      </footer>

      {/* 帮助抽屉（右侧滑出，浅底、非全屏遮罩） */}
      {helpOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setHelpOpen(false)}>
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(26,26,26,0.18)' }} />
          <aside
            className="fmc-scroll absolute right-0 top-0 h-full w-[min(90vw,380px)] overflow-y-auto border-l p-6 shadow-2xl"
            style={{ borderColor: 'var(--kraft-brown)', backgroundColor: 'var(--paper-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="font-title text-3xl"
                style={{ color: 'var(--ink-900)', letterSpacing: '0.04em' }}
              >
                进村须知
              </h2>
              <button
                type="button"
                aria-label="关闭"
                onClick={() => setHelpOpen(false)}
                className="cursor-pointer rounded-sm border border-kraft-brown p-1 text-ink-700 transition-colors hover:bg-paper-fold"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div
              className="space-y-4 font-body text-sm"
              style={{ color: 'var(--ink-700)', lineHeight: 1.9 }}
            >
              <p>
                欢迎来到「风莫村」。这是一座古风江湖村落，住着几位性格迥异的角色，他们会自顾自地攀谈、结下或深或浅的交情。这一卷宣纸，正记录着村中正在发生的事。
              </p>
              <div>
                <h3 className="mb-1 font-caption text-base" style={{ color: 'var(--kraft-dark)' }}>
                  观察者视角
                </h3>
                <p>
                  你是一位路过的外乡人。往下滚动主栏卷轴，便能读到村里的旁白、对话与大小事件。点击对话中的说话人，右侧「人物簿」会显示他的人设、心事与关系网。
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-caption text-base" style={{ color: 'var(--kraft-dark)' }}>
                  与角色攀谈
                </h3>
                <p>
                  点右下角「进村走走」，你便以外乡人身份入村。在人物簿中选一位村民，点「发起对话」，他就会朝你走来开口交谈。你可随时「结束攀谈」。
                </p>
              </div>
              <p>
                风莫村同时最多容纳 {MAX_HUMAN_PLAYERS} 位真人访客。若你闲置五分钟，会被自动请出村子。
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* 角色创建：整张宣纸页（非遮罩） */}
      {creationOpen && (
        <div className="fixed inset-0 z-40" style={{ backgroundColor: 'var(--paper-bg)' }}>
          <Suspense
            fallback={<div style={{ color: '#8b6914', textAlign: 'center', marginTop: '2rem' }}>载入中…</div>}
          >
            <CharacterCreation worldId={worldId} onClose={closeCreation} />
          </Suspense>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="light" />
    </div>
  );
}
