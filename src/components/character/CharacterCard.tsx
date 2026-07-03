// 风莫村 · 角色卡片组件（CharacterEditor 的子组件）
import { CSSProperties } from 'react';
import { CloseIcon, DiceIcon } from '../icons';
import { ProfileDraft } from '../../data/fengmocunPresets';

const inputStyle: CSSProperties = {
  backgroundColor: 'var(--paper-warm)',
  borderColor: 'var(--kraft-brown)',
  color: 'var(--ink-900)',
};

const focusClass = 'focus:outline-none focus:ring-1 focus:ring-vermilion focus:border-vermilion';

function DiceBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex cursor-pointer items-center gap-0.5 rounded-sm border border-kraft-brown px-1.5 py-0.5 font-caption text-[11px] text-ink-700 transition-colors hover:bg-paper-fold"
    >
      <DiceIcon size={12} />
      骰
    </button>
  );
}

function FieldRow({
  label,
  optional,
  hint,
  onRandom,
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  onRandom?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-caption text-xs" style={{ color: 'var(--kraft-dark)' }}>
          {label}
          {optional && <span className="ml-1 text-ink-500">（选填）</span>}
          {hint && <span className="ml-1 text-[10px] text-ink-500">{hint}</span>}
        </span>
        {onRandom && <DiceBtn label={`随机${label}`} onClick={onRandom} />}
      </div>
      {children}
    </div>
  );
}

type Props = {
  index: number;
  profile: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft>) => void;
  onRemove: () => void;
  onRandomField: (field: keyof ProfileDraft) => void;
};

export default function CharacterCard({ index, profile, onChange, onRemove, onRandomField }: Props) {
  return (
    <div
      className="relative rounded-sm border p-4"
      style={{ borderColor: 'var(--kraft-brown)', backgroundColor: 'var(--paper-warm)' }}
    >
      {/* 序号 + 删除 */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-caption text-sm font-bold" style={{ color: 'var(--ink-900)' }}>
          第 {index + 1} 位
        </span>
        <button
          type="button"
          aria-label="删除此角色"
          onClick={onRemove}
          className="cursor-pointer rounded-sm p-1 text-ink-500 transition-colors hover:bg-paper-fold hover:text-vermilion"
        >
          <CloseIcon size={14} />
        </button>
      </div>

      {/* ── 基础信息 ── */}
      <FieldRow label="名字" onRandom={() => onRandomField('name')}>
        <input
          type="text"
          value={profile.name}
          placeholder="请赐一姓名"
          onChange={(e) => onChange({ name: e.target.value })}
          className={`w-full rounded-sm border px-2.5 py-1.5 font-body text-sm ${focusClass}`}
          style={inputStyle}
        />
      </FieldRow>

      <FieldRow label="性别">
        <div className="flex gap-2">
          {(['男', '女', '不限'] as const).map((g) => {
            const on = profile.gender === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => onChange({ gender: g })}
                className="cursor-pointer rounded-sm border px-3 py-1 font-caption text-xs transition-colors"
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
      </FieldRow>

      <FieldRow label="年龄" optional>
        <input
          type="text"
          value={profile.age ?? ''}
          placeholder="如：三十余"
          onChange={(e) => onChange({ age: e.target.value || undefined })}
          className={`w-full rounded-sm border px-2.5 py-1.5 font-body text-sm ${focusClass}`}
          style={inputStyle}
        />
      </FieldRow>

      {/* ── 性格特质 ── */}
      <FieldRow label="性格" onRandom={() => onRandomField('personality')}>
        <input
          type="text"
          value={profile.personality}
          placeholder="寡言、多疑、心细"
          onChange={(e) => onChange({ personality: e.target.value })}
          className={`w-full rounded-sm border px-2.5 py-1.5 font-body text-sm ${focusClass}`}
          style={inputStyle}
        />
      </FieldRow>

      <FieldRow label="怪癖" onRandom={() => onRandomField('quirk')}>
        <input
          type="text"
          value={profile.quirk}
          placeholder="一处与众不同的小癖好"
          onChange={(e) => onChange({ quirk: e.target.value })}
          className={`w-full rounded-sm border px-2.5 py-1.5 font-body text-sm ${focusClass}`}
          style={inputStyle}
        />
      </FieldRow>

      <FieldRow label="口头禅" optional onRandom={() => onRandomField('catchphrase')}>
        <input
          type="text"
          value={profile.catchphrase ?? ''}
          placeholder="常挂在嘴边的一句话"
          onChange={(e) => onChange({ catchphrase: e.target.value || undefined })}
          className={`w-full rounded-sm border px-2.5 py-1.5 font-body text-sm ${focusClass}`}
          style={inputStyle}
        />
      </FieldRow>

      {/* ── 内心世界 ── */}
      <FieldRow label="爱好" onRandom={() => onRandomField('hobbies')}>
        <input
          type="text"
          value={profile.hobbies}
          placeholder="苦茶、短刀、抄旧书"
          onChange={(e) => onChange({ hobbies: e.target.value })}
          className={`w-full rounded-sm border px-2.5 py-1.5 font-body text-sm ${focusClass}`}
          style={inputStyle}
        />
      </FieldRow>

      <FieldRow label="最讨厌的事" onRandom={() => onRandomField('dislikes')}>
        <input
          type="text"
          value={profile.dislikes}
          placeholder="甜食、吵闹酒席"
          onChange={(e) => onChange({ dislikes: e.target.value })}
          className={`w-full rounded-sm border px-2.5 py-1.5 font-body text-sm ${focusClass}`}
          style={inputStyle}
        />
      </FieldRow>

      <FieldRow label="最渴望的事" onRandom={() => onRandomField('desire')}>
        <input
          type="text"
          value={profile.desire}
          placeholder="此生念念不忘之事"
          onChange={(e) => onChange({ desire: e.target.value })}
          className={`w-full rounded-sm border px-2.5 py-1.5 font-body text-sm ${focusClass}`}
          style={inputStyle}
        />
      </FieldRow>

      <FieldRow label="隐藏秘密" optional hint="agent 参考，不公开显示" onRandom={() => onRandomField('secret')}>
        <input
          type="text"
          value={profile.secret ?? ''}
          placeholder="藏在心底、不欲人知之事"
          onChange={(e) => onChange({ secret: e.target.value || undefined })}
          className={`w-full rounded-sm border px-2.5 py-1.5 font-body text-sm ${focusClass}`}
          style={inputStyle}
        />
      </FieldRow>
    </div>
  );
}
