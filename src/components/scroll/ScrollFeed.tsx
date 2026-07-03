import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { GameId } from '../../../convex/aiTown/ids';
import { ServerGame } from '../../hooks/serverGame';
import { sampleEvents } from '../../data/sampleEvents';
import {
  ContactRecord,
  ContactStatus,
  inferLocation,
  mockRelationshipDelta,
  mockPersonaDrift,
} from '../../data/contacts';
import EventBlock from './EventBlock';
import ContactCard from './ContactCard';
import ContactDrawer, { DrawerTarget } from './ContactDrawer';
import RecentHappenings, { RecapEvent } from './RecentHappenings';
import { BoltIcon, ChevronRightIcon, MapPinIcon } from '../icons';

type ScrollFeedProps = {
  worldId: Id<'worlds'>;
  game: ServerGame;
  onSelectPlayer: (playerId: GameId<'players'>) => void;
};

const kindLabel: Record<string, string> = {
  big_event: '大事件',
  narration: '旁白',
  encounter: '相遇',
};

export default function ScrollFeed({ worldId, game, onSelectPlayer }: ScrollFeedProps) {
  const [drawer, setDrawer] = useState<DrawerTarget | null>(null);

  // 姓名 → playerId 映射，供点击说话人跳转人物簿。
  const nameToPlayerId = useMemo(() => {
    const map = new Map<string, GameId<'players'>>();
    for (const [pid, desc] of game.playerDescriptions) {
      map.set(desc.name, pid);
    }
    return map;
  }, [game.playerDescriptions]);

  const onActorClick = (name: string) => {
    const pid = nameToPlayerId.get(name);
    if (pid) onSelectPlayer(pid);
  };

  // 世界大事件（已触发）。
  const worldEvents = useQuery(api.worldEvents.listWorldEvents, { worldId });
  // 已结束的对话（归档）。
  const archived = useQuery(api.contacts.listArchivedContacts, { worldId, limit: 20 });

  // 活跃对话 → ContactRecord。
  const activeContacts: ContactRecord[] = useMemo(() => {
    const out: ContactRecord[] = [];
    for (const c of game.world.conversations.values()) {
      const memberships = [...c.participants.values()];
      const names = [...c.participants.keys()]
        .map((pid) => game.playerDescriptions.get(pid)?.name)
        .filter((n): n is string => !!n);
      const anyParticipating = memberships.some((m) => m.status.kind === 'participating');
      const status: ContactStatus = anyParticipating ? '正在对话' : '相遇';
      // 地点：取第一位参与者的坐标推断。
      const firstPid = [...c.participants.keys()][0];
      const pos = firstPid ? game.world.players.get(firstPid)?.position : undefined;
      out.push({
        id: c.id,
        participantNames: names,
        status,
        location: inferLocation(pos),
        startedAt: c.created,
        messageCount: c.numMessages,
        relationshipDelta: mockRelationshipDelta(c.id, names),
        personaDrift: mockPersonaDrift(c.id, names),
      });
    }
    return out.sort((a, b) => b.startedAt - a.startedAt);
  }, [game.world.conversations, game.world.players, game.playerDescriptions]);

  // 归档对话 → ContactRecord（对话结束）。
  const archivedContacts: ContactRecord[] = useMemo(() => {
    if (!archived) return [];
    return archived.map((c) => ({
      id: c.id,
      participantNames: c.participantNames,
      status: '对话结束' as ContactStatus,
      location: '村中某处',
      startedAt: c.created,
      endedAt: c.ended,
      messageCount: c.numMessages,
      relationshipDelta: mockRelationshipDelta(c.id, c.participantNames),
      personaDrift: mockPersonaDrift(c.id, c.participantNames),
    }));
  }, [archived]);

  // 合并所有接触记录（供「最近发生」汇总）。
  const allContacts = useMemo(
    () => [...activeContacts, ...archivedContacts],
    [activeContacts, archivedContacts],
  );

  const recapEvents: RecapEvent[] = useMemo(
    () =>
      (worldEvents?.triggered ?? []).map((e) => ({
        title: e.title,
        triggeredAt: e.triggeredAt ?? 0,
        kind: e.kind,
      })),
    [worldEvents],
  );

  // 开局氛围：只保留章节页眉 + 旁白，避免密集对话。
  const openingEvents = useMemo(
    () => sampleEvents.filter((e) => e.type === 'chapter' || e.type === 'narration').slice(0, 3),
    [],
  );

  const triggered = worldEvents?.triggered ?? [];

  const openContact = (rec: ContactRecord) =>
    setDrawer({
      title: rec.participantNames.join(' 与 ') || '一段交谈',
      subtitle: `${rec.status} · ${rec.location ?? '村中某处'}`,
      participantNames: rec.participantNames,
      conversationId: rec.id,
    });

  return (
    <div className="fmc-scroll h-full overflow-y-auto px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-[720px]">
        {/* 顶部工具条：接触状态卷 + 最近发生 */}
        <div className="mb-4 flex items-center justify-between">
          <span className="font-caption text-xs text-ink-500">村中接触 · 事件卷</span>
          <RecentHappenings contacts={allContacts} events={recapEvents} />
        </div>

        {/* 开局氛围（章节 + 旁白） */}
        {openingEvents.map((ev) => (
          <EventBlock key={ev.id} event={ev} onActorClick={onActorClick} />
        ))}

        {/* 世界大事件（已触发） */}
        {triggered.length > 0 && (
          <section className="mt-6">
            {triggered.map((ev) => {
              const isBig = ev.kind === 'big_event';
              return (
                <button
                  key={ev._id}
                  type="button"
                  onClick={() =>
                    setDrawer({
                      title: ev.title,
                      subtitle: kindLabel[ev.kind],
                      participantNames: ev.affectedRoles,
                      eventText: ev.description,
                      isBigEvent: isBig,
                    })
                  }
                  className="fmc-enter group my-2.5 flex w-full cursor-pointer items-start gap-3 rounded-sm px-4 py-3 text-left transition-colors hover:bg-paper-fold"
                  style={{
                    backgroundColor: 'var(--paper-warm)',
                    border: '1px solid var(--kraft-brown)',
                    borderLeft: isBig
                      ? '4px solid var(--vermilion)'
                      : '1px solid var(--kraft-brown)',
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-caption text-[11px]"
                        style={
                          isBig
                            ? { backgroundColor: 'rgba(184,58,58,0.08)', color: 'var(--vermilion)' }
                            : { backgroundColor: 'var(--paper-fold)', color: 'var(--kraft-dark)' }
                        }
                      >
                        {isBig && <BoltIcon size={12} />}
                        {kindLabel[ev.kind]}
                      </span>
                      <span
                        className="font-body text-[15px]"
                        style={{ color: 'var(--ink-900)' }}
                      >
                        {ev.title}
                      </span>
                    </div>
                    <p
                      className="line-clamp-2 font-body text-[13px]"
                      style={{ color: 'var(--ink-700)', lineHeight: 1.7 }}
                    >
                      {ev.description}
                    </p>
                    {ev.affectedRoles.length > 0 && (
                      <div className="mt-1 flex items-center gap-1 font-caption text-[11px] text-ink-500">
                        <MapPinIcon size={11} />
                        {ev.affectedRoles.join(' · ')}
                      </div>
                    )}
                  </div>
                  <span className="mt-0.5 shrink-0 text-ink-500 transition-colors group-hover:text-ink-700">
                    <ChevronRightIcon size={16} />
                  </span>
                </button>
              );
            })}
          </section>
        )}

        {/* 接触状态卡：正在进行 */}
        {activeContacts.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-1.5 font-caption text-xs text-ink-500">此刻村中</h3>
            {activeContacts.map((rec) => (
              <ContactCard key={rec.id} record={rec} onOpen={openContact} />
            ))}
          </section>
        )}

        {/* 接触状态卡：已经结束 */}
        {archivedContacts.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-1.5 font-caption text-xs text-ink-500">往事一览</h3>
            {archivedContacts.map((rec) => (
              <ContactCard key={rec.id} record={rec} onOpen={openContact} />
            ))}
          </section>
        )}

        {activeContacts.length === 0 && archivedContacts.length === 0 && (
          <p className="mt-8 text-center font-caption text-sm text-ink-500">
            村中一时无人交谈，且看下回分解……
          </p>
        )}

        <div className="h-16" />
      </div>

      {drawer && (
        <ContactDrawer
          worldId={worldId}
          target={drawer}
          onClose={() => setDrawer(null)}
          onActorClick={onActorClick}
        />
      )}
    </div>
  );
}
