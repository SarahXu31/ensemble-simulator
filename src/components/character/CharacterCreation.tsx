import { CSSProperties, ReactNode, useState } from 'react';
import { useMutation } from 'convex/react';
import { toast } from 'react-toastify';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
  RANDOM_TRAITS,
  RANDOM_QUIRKS,
  RANDOM_HOBBIES,
  RANDOM_DESIRES,
  RANDOM_SECRETS,
  RANDOM_GENDERS,
  Gender,
  pickOne,
  pickSome,
  randomName,
} from '../../data/randomPresets';
import { Avatar } from './characterUtils';
import { DiceIcon, CloseIcon } from '../icons';

type Draft = {
  id: string;
  name: string;
  gender: Gender;
  traits: string[];
  quirk: string;
  hobbies: string[];
  desire: string;
  secret: string;
};

let draftSeq = 0;
const newId = () => `draft-${++draftSeq}`;

const emptyDraft = (): Draft => ({
  id: newId(),
  name: '',
  gender: '不明',
  traits: [],
  quirk: '',
  hobbies: [],
  desire: '',
  secret: '',
});

const randomDraft = (): Omit<Draft, 'id'> => ({
  name: randomName(),
  gender: pickOne(RANDOM_GENDERS),
  traits: pickSome(RANDOM_TRAITS, 3, 5),
  quirk: pickOne(RANDOM_QUIRKS),
  hobbies: pickSome(RANDOM_HOBBIES, 2, 4),
  desire: pickOne(RANDOM_DESIRES),
  secret: pickOne(RANDOM_SECRETS),
});

const MAX_CHARS = 6;
const MIN_CHARS = 3;

// 「随机」小按钮
function DiceButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex cursor-pointer items-center gap-1 rounded-sm border border-kraft-brown px-2 py-1 font-caption text-xs text-ink-700 transition-colors hover:bg-paper-fold"
    >
      <DiceIcon size={14} />
      随机
    </button>
  );
}

function FieldLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <span className="font-caption text-sm" style={{ color: 'var(--kraft-dark)' }}>
        {children}
      </span>
      {action}
    </div>
  );
}

// 多选 tag 组
function TagGroup({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (t: string) => {
    onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const on = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="cursor-pointer rounded-full border px-3 py-1 font-caption text-xs transition-colors"
            style={
              on
                ? { borderColor: 'var(--vermilion)', color: 'var(--vermilion)', backgroundColor: 'rgba(184,58,58,0.06)' }
                : { borderColor: 'var(--kraft-brown)', color: 'var(--ink-700)' }
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

const inputStyle: CSSProperties = {
  backgroundColor: 'var(--paper-bg)',
  borderColor: 'var(--kraft-brown)',
  color: 'var(--ink-900)',
};

export default function CharacterCreation({
  worldId,
  onClose,
}: {
  worldId?: Id<'worlds'>;
  onClose?: () => void;
}) {
  const [chars, setChars] = useState<Draft[]>(() => [emptyDraft(), emptyDraft(), emptyDraft()]);
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const createPlayerCharacter = useMutation(api.players.createPlayerCharacter);

  const draft = chars[active];
  const patch = (p: Partial<Draft>) =>
    setChars((prev) => prev.map((c, i) => (i === active ? { ...c, ...p } : c)));

  const addChar = () => {
    if (chars.length >= MAX_CHARS) return;
    setChars((prev) => [...prev, emptyDraft()]);
    setActive(chars.length);
  };

  // 随机填充当前这一位（保留其 id）。
  const fillRandom = () =>
    setChars((prev) => prev.map((c, i) => (i === active ? { ...randomDraft(), id: c.id } : c)));

  const onSave = async () => {
    const roster = chars.filter((c) => c.name.trim().length > 0);
    if (roster.length === 0) {
      toast.info('请至少为一位村民起个名字。');
      return;
    }
    if (!worldId) {
      toast.error('世界尚未就绪，请稍候再试。');
      return;
    }
    setSaving(true);
    try {
      for (const c of roster) {
        await createPlayerCharacter({
          worldId,
          name: c.name.trim(),
          gender: c.gender,
          personality: c.traits,
          quirk: c.quirk.trim(),
          hobbies: c.hobbies,
          desire: c.desire.trim(),
          secret: c.secret.trim(),
        });
        toast.success(`${c.name.trim()} 已入村`);
      }
      onClose?.();
    } catch (error: any) {
      toast.error(error?.message ?? '入村失败，请稍后再试。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fmc-scroll h-full overflow-y-auto" style={{ backgroundColor: 'var(--paper-bg)' }}>
      <div className="mx-auto max-w-[640px] px-5 py-8 sm:px-8">
        {/* 标题栏 */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1
              className="font-title text-4xl"
              style={{ color: 'var(--ink-900)', letterSpacing: '0.05em' }}
            >
              入村造册
            </h1>
            <p className="mt-1 font-caption text-xs text-ink-500">
              为风莫村添置 {MIN_CHARS}–{MAX_CHARS} 位村民，落笔成册。
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              aria-label="关闭"
              title="关闭"
              onClick={onClose}
              className="cursor-pointer rounded-sm border border-kraft-brown p-1.5 text-ink-700 transition-colors hover:bg-paper-fold"
            >
              <CloseIcon size={18} />
            </button>
          )}
        </div>

        {/* 顶部进度小方块 */}
        <div className="mb-6 flex items-center gap-2">
          {chars.map((c, i) => (
            <button
              key={c.id}
              type="button"
              aria-label={`第 ${i + 1} 位`}
              onClick={() => setActive(i)}
              className="h-7 w-7 cursor-pointer rounded-sm border font-caption text-xs transition-colors"
              style={
                i === active
                  ? { borderColor: 'var(--vermilion)', backgroundColor: 'var(--vermilion)', color: 'var(--paper-bg)' }
                  : c.name.trim()
                  ? { borderColor: 'var(--kraft-dark)', backgroundColor: 'var(--paper-warm)', color: 'var(--ink-900)' }
                  : { borderColor: 'var(--kraft-brown)', color: 'var(--ink-500)' }
              }
            >
              {i + 1}
            </button>
          ))}
          {chars.length < MAX_CHARS && (
            <button
              type="button"
              aria-label="新增一位"
              title="新增一位"
              onClick={addChar}
              className="h-7 w-7 cursor-pointer rounded-sm border border-dashed border-kraft-brown font-caption text-sm text-ink-500 transition-colors hover:bg-paper-fold"
            >
              +
            </button>
          )}
          <div className="ml-auto">
            <DiceButton label="随机填此位" onClick={fillRandom} />
          </div>
        </div>

        {/* 表单主体 */}
        <div className="flex items-center gap-4 border-b pb-5" style={{ borderColor: 'var(--paper-fold)' }}>
          <Avatar name={draft.name || '客'} size={56} />
          <div className="flex-1">
            <FieldLabel action={<DiceButton label="随机取名" onClick={() => patch({ name: randomName() })} />}>
              名字
            </FieldLabel>
            <input
              type="text"
              value={draft.name}
              placeholder="请赐一姓名"
              onChange={(e) => patch({ name: e.target.value })}
              className="w-full rounded-sm border px-3 py-2 font-body text-base focus:outline-none focus:ring-1"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="pt-5">
          {/* 性别 */}
          <div className="mb-5">
            <FieldLabel>性别</FieldLabel>
            <div className="flex gap-2">
              {RANDOM_GENDERS.map((g) => {
                const on = draft.gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => patch({ gender: g })}
                    className="cursor-pointer rounded-sm border px-4 py-1.5 font-caption text-sm transition-colors"
                    style={
                      on
                        ? { borderColor: 'var(--vermilion)', color: 'var(--vermilion)', backgroundColor: 'rgba(184,58,58,0.06)' }
                        : { borderColor: 'var(--kraft-brown)', color: 'var(--ink-700)' }
                    }
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 性格 */}
          <div className="mb-5">
            <FieldLabel action={<DiceButton label="随机性格" onClick={() => patch({ traits: pickSome(RANDOM_TRAITS, 3, 5) })} />}>
              性格（选 3–5）
            </FieldLabel>
            <TagGroup options={RANDOM_TRAITS} value={draft.traits} onChange={(t) => patch({ traits: t })} />
          </div>

          {/* 怪癖 */}
          <div className="mb-5">
            <FieldLabel action={<DiceButton label="随机怪癖" onClick={() => patch({ quirk: pickOne(RANDOM_QUIRKS) })} />}>
              怪癖
            </FieldLabel>
            <input
              type="text"
              value={draft.quirk}
              placeholder="一处与众不同的小癖好"
              onChange={(e) => patch({ quirk: e.target.value })}
              className="w-full rounded-sm border px-3 py-2 font-body text-sm focus:outline-none focus:ring-1"
              style={inputStyle}
            />
          </div>

          {/* 爱好 */}
          <div className="mb-5">
            <FieldLabel action={<DiceButton label="随机爱好" onClick={() => patch({ hobbies: pickSome(RANDOM_HOBBIES, 2, 4) })} />}>
              爱好
            </FieldLabel>
            <TagGroup options={RANDOM_HOBBIES} value={draft.hobbies} onChange={(h) => patch({ hobbies: h })} />
          </div>

          {/* 渴望 */}
          <div className="mb-5">
            <FieldLabel action={<DiceButton label="随机渴望" onClick={() => patch({ desire: pickOne(RANDOM_DESIRES) })} />}>
              渴望
            </FieldLabel>
            <input
              type="text"
              value={draft.desire}
              placeholder="此生念念不忘之事"
              onChange={(e) => patch({ desire: e.target.value })}
              className="w-full rounded-sm border px-3 py-2 font-body text-sm focus:outline-none focus:ring-1"
              style={inputStyle}
            />
          </div>

          {/* 秘密 */}
          <div className="mb-6">
            <FieldLabel action={<DiceButton label="随机秘密" onClick={() => patch({ secret: pickOne(RANDOM_SECRETS) })} />}>
              秘密
            </FieldLabel>
            <textarea
              value={draft.secret}
              rows={3}
              placeholder="藏在心底、不欲人知之事"
              onChange={(e) => patch({ secret: e.target.value })}
              className="w-full resize-none rounded-sm border px-3 py-2 font-body text-sm focus:outline-none focus:ring-1"
              style={inputStyle}
            />
          </div>

          {/* 底部 CTA */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex-1 cursor-pointer rounded-sm py-3 font-caption text-sm text-paper-bg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: 'var(--vermilion)' }}
            >
              {saving ? '正在入村……' : '保存并入村'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 cursor-pointer rounded-sm border py-3 font-caption text-sm transition-colors hover:bg-paper-fold"
              style={{ borderColor: 'var(--kraft-brown)', color: 'var(--ink-700)' }}
            >
              保留空缺
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
