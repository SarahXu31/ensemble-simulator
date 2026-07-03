import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ContactRecord, RELATION_DELTA_THRESHOLD } from '../../data/contacts';
import { ScrollIcon, CloseIcon } from '../icons';
// 改动3：接入真实 LLM 古风总结。
import { SummaryLLMAdapter, hasLLMApiKey } from '../../data/summaryAdapter';

const RECAP_KEY = 'fmc_last_recap_ts';

export type RecapEvent = { title: string; triggeredAt: number; kind: string };

type RecentHappeningsProps = {
  contacts: ContactRecord[];
  events: RecapEvent[];
};

function readLastTs(): number {
  try {
    return Number(localStorage.getItem(RECAP_KEY) ?? '0') || 0;
  } catch {
    return 0;
  }
}

function humanizeSpan(ms: number): string {
  if (ms <= 0) return '片刻';
  const min = Math.floor(ms / 60_000);
  if (min < 1) return '片刻';
  if (min < 60) return `${min} 分钟`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 个时辰`;
  return `${Math.floor(hr / 24)} 日`;
}

// 方案 B：模板化总结（不依赖 LLM）。
// TODO(Phase 3, 方案 A): 改调 Convex action summarizeRecent，用 convex/agent 的 LLM 客户端生成更自然的叙述。
function buildSummary(contacts: ContactRecord[], events: RecapEvent[], lastTs: number) {
  const since = lastTs || 0;
  const recentContacts = contacts.filter((c) => (c.endedAt ?? c.startedAt) > since);
  const recentEvents = events.filter((e) => e.triggeredAt > since);

  // 按参与者对聚合往来次数。
  const pairCount = new Map<string, number>();
  for (const c of recentContacts) {
    if (c.participantNames.length < 2) continue;
    const key = [...c.participantNames].sort().join(' 与 ');
    pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
  }

  const relationBreaks = recentContacts
    .filter(
      (c) =>
        c.relationshipDelta &&
        Math.abs(c.relationshipDelta.delta) > RELATION_DELTA_THRESHOLD,
    )
    .map((c) => ({
      pair: c.relationshipDelta!.pair.join(' 与 '),
      delta: c.relationshipDelta!.delta,
    }));

  const drifts = recentContacts
    .filter((c) => c.personaDrift)
    .map((c) => `${c.personaDrift!.role}（${c.personaDrift!.summary}）`);

  return {
    span: humanizeSpan(Date.now() - (since || Date.now())),
    contactCount: recentContacts.length,
    pairs: [...pairCount.entries()].map(([pair, n]) => ({ pair, n })),
    events: recentEvents.map((e) => e.title),
    relationBreaks,
    drifts,
    isFirst: since === 0,
  };
}

export default function RecentHappenings({ contacts, events }: RecentHappeningsProps) {
  const [open, setOpen] = useState(false);
  const [lastTs, setLastTs] = useState(0);
  // 没有配置 API Key 时直接不渲染按钮
  if (!hasLLMApiKey()) return null;
  // 改动3：真实 LLM 总结的加载/文本/错误态。
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmText, setLlmText] = useState('');
  const [llmError, setLlmError] = useState<string | null>(null);

  const summary = useMemo(
    () => (open ? buildSummary(contacts, events, lastTs) : null),
    [open, contacts, events, lastTs],
  );

  const onOpen = async () => {
    setLastTs(readLastTs());
    setOpen(true);

    // 取最近 20 条事件（按 triggeredAt 倒序），以 title 拼成一行一条的事件列表文本。
    const recentTitles = [...events]
      .sort((a, b) => b.triggeredAt - a.triggeredAt)
      .slice(0, 20)
      .map((e) => e.title);
    const eventsText = recentTitles.join('\n');
    // 严格使用约定的古风 prompt 文案。
    const prompt = `请用古风语气，以第三人称叙述口吻，用 100 字以内总结以下近期发生的事：\n${eventsText}`;

    setLlmLoading(true);
    setLlmText('');
    setLlmError(null);
    try {
      const text = await new SummaryLLMAdapter().complete(prompt);
      setLlmText(text);
    } catch (err: any) {
      setLlmError(err?.message ?? 'LLM 总结失败');
    } finally {
      setLlmLoading(false);
    }
  };
  const onClose = () => {
    setOpen(false);
    try {
      localStorage.setItem(RECAP_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-caption text-xs shadow-sm transition-colors hover:bg-paper-fold"
        style={{
          borderColor: 'var(--kraft-brown)',
          backgroundColor: 'var(--paper-warm)',
          color: 'var(--ink-700)',
        }}
      >
        <ScrollIcon size={15} />
        最近发生
      </button>

      {open && summary && (
        <div className="fixed inset-0 z-50" onClick={onClose}>
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(26,26,26,0.22)' }} />
          <div
            className="fmc-scroll absolute right-0 top-0 h-full w-[min(92vw,440px)] overflow-y-auto p-7 shadow-2xl"
            style={{
              borderLeft: '2px solid var(--kraft-brown)',
              backgroundColor: 'var(--paper-bg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                className="font-title text-3xl"
                style={{ color: 'var(--vermilion)', letterSpacing: '0.04em' }}
              >
                最近发生
              </h2>
              <button
                type="button"
                aria-label="关闭"
                onClick={onClose}
                className="cursor-pointer rounded-sm border border-kraft-brown p-1 text-ink-700 transition-colors hover:bg-paper-fold"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div
              className="space-y-4 font-body text-sm"
              style={{ color: 'var(--ink-700)', lineHeight: 1.9 }}
            >
              {/* 改动3：真实 LLM 古风总结（加载中 / 错误 / 结果） */}
              <div
                className="rounded-sm border px-4 py-3"
                style={{ borderColor: 'var(--kraft-brown)', backgroundColor: 'var(--paper-warm)' }}
              >
                <h3 className="mb-1 font-caption text-sm" style={{ color: 'var(--vermilion)' }}>
                  古风纪事
                </h3>
                {llmLoading ? (
                  <p className="text-ink-500">正在挥毫成文……</p>
                ) : llmError ? (
                  <p style={{ color: 'var(--vermilion)' }}>总结失败：{llmError}</p>
                ) : llmText ? (
                  <p style={{ whiteSpace: 'pre-wrap' }}>{llmText}</p>
                ) : (
                  <p className="text-ink-500">暂无可叙之事。</p>
                )}
              </div>

              <p>
                {summary.isFirst ? '自开卷以来' : `距上次翻阅，已过约 ${summary.span}`}，村中共有{' '}
                <span style={{ color: 'var(--vermilion)' }}>{summary.contactCount}</span> 次接触。
              </p>

              {summary.events.length > 0 && (
                <div>
                  <h3 className="mb-1 font-caption text-sm" style={{ color: 'var(--kraft-dark)' }}>
                    大事件
                  </h3>
                  <p>{summary.events.join('、')}。</p>
                </div>
              )}

              {summary.pairs.length > 0 && (
                <div>
                  <h3 className="mb-1 font-caption text-sm" style={{ color: 'var(--kraft-dark)' }}>
                    往来
                  </h3>
                  <ul className="list-disc space-y-0.5 pl-5">
                    {summary.pairs.slice(0, 8).map((p) => (
                      <li key={p.pair}>
                        {p.pair}，共 {p.n} 次交谈。
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.relationBreaks.length > 0 && (
                <div>
                  <h3 className="mb-1 font-caption text-sm" style={{ color: 'var(--kraft-dark)' }}>
                    感情巨变
                  </h3>
                  <ul className="list-disc space-y-0.5 pl-5">
                    {summary.relationBreaks.slice(0, 6).map((r) => (
                      <li key={r.pair}>
                        {r.pair}：关系{r.delta > 0 ? '骤然升温' : '急转直下'}（{r.delta > 0 ? '+' : ''}
                        {r.delta}）。
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.drifts.length > 0 && (
                <div>
                  <h3 className="mb-1 font-caption text-sm" style={{ color: 'var(--kraft-dark)' }}>
                    人设漂移
                  </h3>
                  <p>{summary.drifts.slice(0, 6).join('；')}。</p>
                </div>
              )}

              {summary.contactCount === 0 && summary.events.length === 0 && (
                <p className="text-ink-500">这段时日风平浪静，村中并无大事发生。</p>
              )}

              <p className="pt-2 font-caption text-[11px] text-ink-500">
                （本篇由模板汇总生成；接入 LLM 的自然叙述为 Phase 3 待办。）
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
