// 风莫村 · 角色编辑系统（Phase 3）
// 全屏宣纸风编辑器，支持 2-6 位角色配置、随机生成、预设加载。
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'react-toastify';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { FENGMOCUN_PRESETS, ProfileDraft } from '../../data/fengmocunPresets';
import {
  pickOne,
  pickSome,
  randomName,
  RANDOM_TRAITS,
  RANDOM_QUIRKS,
  RANDOM_HOBBIES,
  RANDOM_DESIRES,
  RANDOM_SECRETS,
  RANDOM_CATCHPHRASES,
  RANDOM_DISLIKES,
} from '../../data/randomPresets';
import CharacterCard from './CharacterCard';
// 改动3：LLM 配置读写。改动6：时间流速预设常量。
import { readLLMConfig, writeLLMConfig } from '../../data/summaryAdapter';
import { TIME_SCALE_PRESETS, TIME_SCALE_STORAGE_KEY, DEFAULT_TIME_SCALE } from '../../../convex/constants';

const MIN_CHARS = 2;
const MAX_CHARS = 6;

// 改动6：时间流速档位的中文标签（4x/8x/16x/60x）。
const TIME_SCALE_LABELS: Record<number, string> = {
  4: '慢节奏 4x',
  8: '默认 8x',
  16: '快进 16x',
  60: '测试模式 60x',
};

const emptyProfile = (): ProfileDraft => ({
  name: '',
  gender: '不限',
  personality: '',
  quirk: '',
  hobbies: '',
  dislikes: '',
  desire: '',
});

function randomProfile(): ProfileDraft {
  return {
    name: randomName(),
    gender: pickOne(['男', '女', '不限']),
    personality: pickSome(RANDOM_TRAITS, 2, 4).join('、'),
    quirk: pickOne(RANDOM_QUIRKS),
    catchphrase: pickOne(RANDOM_CATCHPHRASES),
    hobbies: pickSome(RANDOM_HOBBIES, 2, 3).join('、'),
    dislikes: pickOne(RANDOM_DISLIKES),
    desire: pickOne(RANDOM_DESIRES),
    secret: pickOne(RANDOM_SECRETS),
  };
}

function randomFieldValue(field: keyof ProfileDraft): string {
  switch (field) {
    case 'name': return randomName();
    case 'personality': return pickSome(RANDOM_TRAITS, 2, 4).join('、');
    case 'quirk': return pickOne(RANDOM_QUIRKS);
    case 'catchphrase': return pickOne(RANDOM_CATCHPHRASES);
    case 'hobbies': return pickSome(RANDOM_HOBBIES, 2, 3).join('、');
    case 'dislikes': return pickOne(RANDOM_DISLIKES);
    case 'desire': return pickOne(RANDOM_DESIRES);
    case 'secret': return pickOne(RANDOM_SECRETS);
    default: return '';
  }
}

type Props = {
  worldId?: Id<'worlds'>;
  onClose?: () => void;
};

export default function CharacterEditor({ worldId, onClose }: Props) {
  const [profiles, setProfiles] = useState<ProfileDraft[]>([emptyProfile()]);
  const [saving, setSaving] = useState(false);

  const existingProfiles = useQuery(
    api.characterProfiles.listProfiles,
    worldId ? { worldId } : 'skip',
  );
  const saveProfilesMut = useMutation(api.characterProfiles.saveProfiles);
  const applyMut = useMutation(api.characterProfiles.applyProfilesToWorld);

  // 改动6：worldId 优先取 props，缺省时从默认世界查询兜底。
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const effectiveWorldId = worldId ?? worldStatus?.worldId;
  const setTimeScaleMut = useMutation(api.gameSettings.setTimeScale);

  // 改动3：LLM 配置本地 state（从 localStorage 初始化）。
  const [llmConfig, setLlmConfig] = useState(() => readLLMConfig());
  // 改动6：时间流速本地 state（读 localStorage，无/非法则默认 8x）。
  const [timeScale, setTimeScaleState] = useState<number>(() => {
    try {
      const n = Number(localStorage.getItem(TIME_SCALE_STORAGE_KEY));
      return (TIME_SCALE_PRESETS as readonly number[]).includes(n) ? n : DEFAULT_TIME_SCALE;
    } catch {
      return DEFAULT_TIME_SCALE;
    }
  });

  // 改动3：保存 LLM 配置到 localStorage（统一 key，由 summaryAdapter 管理）。
  const saveLLMConfig = () => {
    writeLLMConfig({
      baseURL: llmConfig.baseURL,
      apiKey: llmConfig.apiKey,
      model: llmConfig.model,
    });
    toast.success('LLM 配置已保存');
  };

  // 改动6：切换时间流速——先写 localStorage 实时生效，再同步后端（拿不到 worldId 则只写本地）。
  const onChangeTimeScale = async (scale: number) => {
    setTimeScaleState(scale);
    try {
      localStorage.setItem(TIME_SCALE_STORAGE_KEY, String(scale));
    } catch {
      /* ignore */
    }
    if (effectiveWorldId) {
      try {
        await setTimeScaleMut({ worldId: effectiveWorldId, timeScale: scale });
      } catch (err: any) {
        toast.error(err?.message ?? '倍速同步后端失败');
        return;
      }
    }
    toast.success(`时间流速已切换为 ${scale}x`);
  };

  // 加载已有数据
  useEffect(() => {
    if (existingProfiles && existingProfiles.length > 0) {
      setProfiles(
        existingProfiles.map((p) => ({
          name: p.name,
          gender: p.gender,
          age: p.age ?? undefined,
          personality: p.personality,
          quirk: p.quirk,
          catchphrase: p.catchphrase ?? undefined,
          hobbies: p.hobbies,
          dislikes: p.dislikes,
          desire: p.desire,
          secret: p.secret ?? undefined,
        })),
      );
    }
  }, [existingProfiles]);

  const updateProfile = (idx: number, patch: Partial<ProfileDraft>) => {
    setProfiles((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const removeProfile = (idx: number) => {
    setProfiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const addProfile = () => {
    if (profiles.length >= MAX_CHARS) return;
    setProfiles((prev) => [...prev, emptyProfile()]);
  };

  const applyPresets = () => {
    setProfiles([...FENGMOCUN_PRESETS]);
    toast.success('已加载风莫村预设（6 位角色）');
  };

  const randomAll = () => {
    setProfiles((prev) =>
      prev.map((p) => {
        const filled: ProfileDraft = { ...p };
        if (!filled.name) filled.name = randomName();
        if (!filled.personality) filled.personality = pickSome(RANDOM_TRAITS, 2, 4).join('、');
        if (!filled.quirk) filled.quirk = pickOne(RANDOM_QUIRKS);
        if (!filled.catchphrase) filled.catchphrase = pickOne(RANDOM_CATCHPHRASES);
        if (!filled.hobbies) filled.hobbies = pickSome(RANDOM_HOBBIES, 2, 3).join('、');
        if (!filled.dislikes) filled.dislikes = pickOne(RANDOM_DISLIKES);
        if (!filled.desire) filled.desire = pickOne(RANDOM_DESIRES);
        if (!filled.secret) filled.secret = pickOne(RANDOM_SECRETS);
        return filled;
      }),
    );
    toast.success('已随机填充所有空字段');
  };

  const clearAll = () => {
    setProfiles([emptyProfile()]);
  };

  const onRandomField = (idx: number, field: keyof ProfileDraft) => {
    updateProfile(idx, { [field]: randomFieldValue(field) });
  };

  const validCount = profiles.filter((p) => p.name.trim()).length;
  const canStart = validCount >= MIN_CHARS;

  const handleStart = async () => {
    if (!canStart || !worldId) {
      toast.info('至少 2 个角色方可开始游戏');
      return;
    }
    setSaving(true);
    try {
      const toSave = profiles
        .filter((p) => p.name.trim())
        .map((p, i) => ({ ...p, slotIndex: i, name: p.name.trim() }));
      await saveProfilesMut({ worldId, profiles: toSave });
      await applyMut({ worldId });
      toast.success('角色已入村，游戏即将开始');
      onClose?.();
    } catch (err: any) {
      toast.error(err?.message ?? '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fmc-scroll h-full overflow-y-auto" style={{ backgroundColor: 'var(--paper-bg)' }}>
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-8">
        {/* 顶部标题栏 */}
        <div className="mb-4 flex items-center justify-between">
          <h1
            className="font-title text-3xl sm:text-4xl"
            style={{ color: 'var(--ink-900)', letterSpacing: '0.05em' }}
          >
            风莫村 · 人物设定
          </h1>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={!canStart}
              className="rounded-sm border px-3 py-1.5 font-caption text-sm transition-colors hover:bg-paper-fold disabled:cursor-not-allowed disabled:opacity-40"
              style={{ borderColor: 'var(--kraft-brown)', color: 'var(--ink-700)' }}
            >
              返回游戏
            </button>
          )}
        </div>

        {/* 工具行 */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <ToolBtn label="应用风莫村预设" onClick={applyPresets} />
          <ToolBtn label="随机生成全部" onClick={randomAll} />
          <ToolBtn label="清空重置" onClick={clearAll} />
        </div>

        {/* 数量提示 */}
        <p className="mb-4 font-caption text-xs text-ink-500">
          角色数量：{MIN_CHARS} 到 {MAX_CHARS} · 当前 {profiles.length} 个角色
        </p>

        {/* 角色卡网格 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {profiles.map((p, idx) => (
            <CharacterCard
              key={idx}
              index={idx}
              profile={p}
              onChange={(patch) => updateProfile(idx, patch)}
              onRemove={() => removeProfile(idx)}
              onRandomField={(field) => onRandomField(idx, field)}
            />
          ))}
        </div>

        {/* 添加角色按钮 */}
        {profiles.length < MAX_CHARS && (
          <button
            type="button"
            onClick={addProfile}
            className="mt-4 w-full cursor-pointer rounded-sm border border-dashed py-3 font-caption text-sm text-ink-500 transition-colors hover:bg-paper-fold"
            style={{ borderColor: 'var(--kraft-brown)' }}
          >
            + 添加角色
          </button>
        )}

        {/* 设置区（改动3 + 改动6）：LLM 配置 + 时间流速调节 */}
        <div
          className="mt-8 rounded-sm border p-5"
          style={{ borderColor: 'var(--kraft-brown)', backgroundColor: 'var(--paper-warm)' }}
        >
          <h2
            className="mb-4 font-title text-2xl"
            style={{ color: 'var(--ink-900)', letterSpacing: '0.04em' }}
          >
            设置
          </h2>

          {/* 改动3：LLM 配置入口（可选） */}
          <div className="mb-6">
            <h3 className="mb-1 font-caption text-sm" style={{ color: 'var(--kraft-dark)' }}>
              AI 总结设置（可选）
            </h3>
            <p className="mb-2 font-caption text-[11px]" style={{ color: 'var(--ink-500)' }}>
              不填则跳过「最近发生」AI 总结功能，其他功能不受影响。
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block font-caption text-xs text-ink-500">Base URL</span>
                <input
                  type="text"
                  value={llmConfig.baseURL}
                  onChange={(e) => setLlmConfig((c) => ({ ...c, baseURL: e.target.value }))}
                  placeholder="https://api.openai.com/v1"
                  className="w-full rounded-sm border bg-paper-bg px-3 py-2 font-body text-sm text-ink-900 outline-none"
                  style={{ borderColor: 'var(--kraft-brown)' }}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-caption text-xs text-ink-500">API Key</span>
                <input
                  type="password"
                  value={llmConfig.apiKey}
                  onChange={(e) => setLlmConfig((c) => ({ ...c, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full rounded-sm border bg-paper-bg px-3 py-2 font-body text-sm text-ink-900 outline-none"
                  style={{ borderColor: 'var(--kraft-brown)' }}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-caption text-xs text-ink-500">Model</span>
                <input
                  type="text"
                  value={llmConfig.model}
                  onChange={(e) => setLlmConfig((c) => ({ ...c, model: e.target.value }))}
                  placeholder="gpt-4o-mini"
                  className="w-full rounded-sm border bg-paper-bg px-3 py-2 font-body text-sm text-ink-900 outline-none"
                  style={{ borderColor: 'var(--kraft-brown)' }}
                />
              </label>
              <button
                type="button"
                onClick={saveLLMConfig}
                className="cursor-pointer rounded-sm border px-4 py-1.5 font-caption text-sm transition-colors hover:bg-paper-fold"
                style={{ borderColor: 'var(--kraft-brown)', color: 'var(--ink-700)' }}
              >
                保存
              </button>
            </div>
          </div>

          {/* 改动6：时间流速调节 */}
          <div>
            <h3 className="mb-2 font-caption text-sm" style={{ color: 'var(--kraft-dark)' }}>
              时间流速
            </h3>
            <select
              value={timeScale}
              onChange={(e) => onChangeTimeScale(Number(e.target.value))}
              className="w-full rounded-sm border bg-paper-bg px-3 py-2 font-body text-sm text-ink-900 outline-none"
              style={{ borderColor: 'var(--kraft-brown)' }}
            >
              {TIME_SCALE_PRESETS.map((s) => (
                <option key={s} value={s}>
                  {TIME_SCALE_LABELS[s] ?? `${s}x`}
                </option>
              ))}
            </select>
            <p className="mt-1 font-caption text-[11px] text-ink-500">
              数值越大，村中时光流逝越快（大事件、关系变化、人设漂移的节奏据此换算）。
            </p>
          </div>
        </div>

        {/* 底部 CTA */}
        <div className="sticky bottom-0 mt-6 border-t py-4" style={{ borderColor: 'var(--kraft-brown)', backgroundColor: 'var(--paper-bg)' }}>
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart || saving}
            className="w-full cursor-pointer rounded-sm py-3 font-caption text-base text-paper-bg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: 'var(--vermilion)' }}
          >
            {saving ? '正在保存……' : canStart ? '开始游戏' : `至少 ${MIN_CHARS} 个角色`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 工具按钮 ──
function ToolBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-sm border px-3 py-1.5 font-caption text-xs transition-colors hover:bg-paper-fold"
      style={{ borderColor: 'var(--kraft-brown)', color: 'var(--ink-700)' }}
    >
      {label}
    </button>
  );
}
