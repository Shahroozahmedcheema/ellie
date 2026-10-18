import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

import { MiniRing } from '@/components/Donut';
import { Screen } from '@/components/Screen';
import { useSheets } from '@/components/SheetsProvider';
import {
  CatTile,
  Glass,
  H1,
  Hairline,
  Label,
  Money,
  Press,
  Segmented,
  Sub,
  font,
  shadowOf,
} from '@/components/ui';
import { MASCOT } from '@/lib/content';
import { money } from '@/lib/format';
import { Icon } from '@/lib/icons';
import { useEllie } from '@/store/EllieStore';
import { useDerived } from '@/store/derive';
import { useTheme } from '@/theme/ThemeContext';

export default function Plan() {
  const { t } = useTheme();
  const { cycle, contribute, removeGoal, showPop, flash, state } = useEllie();
  const { openAmount, openNewGoal } = useSheets();
  const d = useDerived();
  const [tab, setTab] = useState('Budgets');

  const assignRemaining = () => {
    if (d.reconGap <= 0) return;
    const goal = state.goals.find((g) => g.saved < g.target);
    if (!goal) return flash('Every goal is already funded');
    contribute(goal.id, d.reconGap);
    if (goal.saved + Math.min(d.reconGap, goal.target - goal.saved) < goal.target) {
      flash(`${d.sym}${money(d.reconGap)} into ${goal.name}`);
    }
    setTab('Goals');
  };

  return (
    <Screen contentStyle={{ gap: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ gap: 5 }}>
          <H1>Plan</H1>
          <Sub>
            {cycle.label} · {cycle.daysLeft} days to go
          </Sub>
        </View>
        <Glass
          radius={999}
          style={{ height: 36, paddingHorizontal: 14, justifyContent: 'center' }}
        >
          <Text
            style={{ fontFamily: font.semibold, fontSize: 13, color: t.sub }}
          >
            {cycle.name}
          </Text>
        </Glass>
      </View>

      <Segmented
        options={['Budgets', 'Goals']}
        value={tab}
        onChange={setTab}
      />

      {tab === 'Budgets' ? (
        <View style={{ gap: 16 }}>
          <Glass style={{ paddingTop: 18, gap: 12, overflow: 'hidden' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
              }}
            >
              <View style={{ gap: 3 }}>
                <Label>Target</Label>
                <Money value={d.income} size={17} />
              </View>
              <View style={{ gap: 3, alignItems: 'flex-end' }}>
                <Label>Allocated</Label>
                <Money value={d.allocated} size={17} />
              </View>
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              <View
                style={{
                  height: 10,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor: t.track,
                }}
              >
                <View
                  style={{
                    width: `${Math.min(
                      Math.round((d.allocated / d.income) * 100),
                      100,
                    )}%`,
                    height: '100%',
                    borderRadius: 999,
                    opacity: 0.85,
                    backgroundColor: d.reconGap >= 0 ? t.coral : t.ochre,
                  }}
                />
              </View>
            </View>

            <Press
              scale={d.reconGap > 0 ? 0.99 : 1}
              haptic={d.reconGap > 0 ? 'medium' : false}
              onPress={assignRemaining}
              style={{
                paddingVertical: 11,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: d.reconGap >= 0 ? t.sageBg : t.ochreBg,
                // This strip sits flush in the card's bottom corners, which a
                // rounded parent will not clip it to on older Android.
                borderBottomLeftRadius: 22.5,
                borderBottomRightRadius: 22.5,
              }}
            >
              <Text
                style={{
                  fontFamily: font.semibold,
                  fontSize: 13.5,
                  color: d.reconGap >= 0 ? t.sageInk : t.ochre,
                }}
              >
                {d.reconGap >= 0 ? 'Remaining to allocate' : 'Over your income by'}
              </Text>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Money
                  value={Math.abs(d.reconGap)}
                  size={13.5}
                  color={d.reconGap >= 0 ? t.sageInk : t.ochre}
                />
                {d.reconGap > 0 ? (
                  <View
                    style={{
                      height: 24,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      justifyContent: 'center',
                      backgroundColor: t.sage,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 11.5,
                        color: t.dark ? '#1A1613' : '#fff',
                      }}
                    >
                      Give it a job
                    </Text>
                  </View>
                ) : null}
              </View>
            </Press>
          </Glass>

          <View style={{ gap: 10 }}>
            {d.ringRows.map((row) => (
              <Press
                key={row.cat}
                scale={0.98}
                onPress={() =>
                  openAmount({
                    kind: 'budget',
                    cat: row.cat,
                    title: `${row.cat} budget`,
                    sub: `${d.sym}${money(row.amount)} spent so far this cycle`,
                  })
                }
              >
                <Glass
                  style={{
                    padding: 14,
                    paddingHorizontal: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <CatTile cat={row.cat} size={40} iconSize={17} />
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 16,
                        color: t.ink,
                      }}
                    >
                      {row.cat}
                    </Text>
                    <Text
                      style={{
                        fontFamily: font.regular,
                        fontSize: 13,
                        color: row.over ? t.ochre : t.lbl,
                      }}
                    >
                      {row.uncapped
                        ? `${d.sym}${money(row.amount)} spent · tap to set a cap`
                        : `${d.sym}${money(row.amount)} of ${d.sym}${money(row.cap)}`}
                    </Text>
                  </View>
                  <MiniRing
                    pct={row.capPct}
                    color={row.over ? t.ochre : t.hue[row.cat]}
                  />
                </Glass>
              </Press>
            ))}

            {d.ringRows.length === 0 ? (
              <EmptyNote
                text="No budgets yet. Log an expense, or tap a category to set a cap."
              />
            ) : null}
          </View>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Label>
              {d.reachedCount
                ? `${d.reachedCount} reached · ${d.goals.length - d.reachedCount} in flight`
                : `${d.goals.length} in flight`}
            </Label>
            <Hairline />
            <Press
              scale={0.94}
              onPress={openNewGoal}
              style={{
                height: 34,
                paddingHorizontal: 13,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: t.coral,
                shadowColor: t.coral,
                shadowOpacity: 0.26,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 4,
              }}
            >
              <Icon name="plus" size={15} strokeWidth={2} color="#fff" />
              <Text
                style={{
                  fontFamily: font.semibold,
                  fontSize: 12.5,
                  color: '#fff',
                }}
              >
                New goal
              </Text>
            </Press>
          </View>

          <View style={{ gap: 14 }}>
            {d.goals.map((g) => (
              <Glass
                key={g.id}
                style={{ padding: 16, paddingHorizontal: 18, paddingBottom: 18, gap: 11 }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 9,
                    }}
                  >
                    {g.done ? (
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          backgroundColor: t.sage,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon
                          name="check"
                          size={14}
                          strokeWidth={2.6}
                          color={t.dark ? '#1A1613' : '#fff'}
                        />
                      </View>
                    ) : null}
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontFamily: font.semibold,
                        fontSize: 16,
                        color: t.ink,
                      }}
                    >
                      {g.name}
                    </Text>
                  </View>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  >
                    <View
                      style={{
                        height: 22,
                        paddingHorizontal: 9,
                        borderRadius: 999,
                        justifyContent: 'center',
                        backgroundColor: g.done ? t.sageBg : t.soft,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: font.semibold,
                          fontSize: 11.5,
                          color: g.done ? t.sageInk : t.sub,
                        }}
                      >
                        {g.done ? 'Reached' : g.due}
                      </Text>
                    </View>
                    <Press
                      scale={0.88}
                      onPress={() => {
                        removeGoal(g.id);
                        showPop(
                          'del',
                          'Goal removed',
                          `${g.name} · ${d.sym}${money(g.saved)} saved`,
                          'Other',
                        );
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: t.soft,
                        ...shadowOf(t),
                      }}
                    >
                      <Icon name="trash" size={15} color={t.lbl} />
                    </Press>
                  </View>
                </View>

                <View
                  style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}
                >
                  <Money value={g.saved} size={26} />
                  <Text
                    style={{
                      fontFamily: font.regular,
                      fontSize: 13,
                      color: t.sub,
                    }}
                  >
                    of <Money value={g.target} size={13} color={t.sub} />
                  </Text>
                </View>

                <GoalTrack pct={g.pct} hatchTo={g.hatchTo} done={g.done} />

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: font.regular,
                      fontSize: 13,
                      color: g.done ? t.sageInk : t.sub,
                    }}
                  >
                    {g.done
                      ? 'Every rupee of it.'
                      : `${d.sym}${money(g.target - g.saved)} to go`}
                  </Text>
                  <Press
                    scale={g.done ? 1 : 0.95}
                    haptic={g.done ? false : 'light'}
                    onPress={() => {
                      if (g.done) return;
                      openAmount({
                        kind: 'goalAdd',
                        goalId: g.id,
                        title: g.name,
                        sub: `${d.sym}${money(g.target - g.saved)} to go — how much are you putting in?`,
                      });
                    }}
                    style={{
                      height: 36,
                      paddingHorizontal: 15,
                      borderRadius: 999,
                      justifyContent: 'center',
                      backgroundColor: g.done ? t.soft : t.coral,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 13,
                        color: g.done ? t.lbl : '#fff',
                      }}
                    >
                      {g.done ? 'Reached' : 'Put money in'}
                    </Text>
                  </Press>
                </View>
              </Glass>
            ))}

            {d.goals.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 26 }}>
                <Image
                  source={MASCOT.peeking}
                  style={{
                    width: 112,
                    height: 112,
                    resizeMode: 'contain',
                    marginBottom: -17,
                    opacity: t.mascotOpacity,
                  }}
                />
                <Hairline style={{ width: '100%', flex: 0 }} />
                <Sub style={{ paddingTop: 10, textAlign: 'center' }}>
                  Nothing saved for yet. Tap New goal and name the thing.
                </Sub>
              </View>
            ) : null}
          </View>
        </View>
      )}
    </Screen>
  );
}

/** Quiet one-liner used where a list has nothing in it yet. */
function EmptyNote({ text }: { text: string }) {
  const { t } = useTheme();
  return (
    <View
      style={{
        paddingVertical: 22,
        paddingHorizontal: 18,
        borderRadius: 20,
        backgroundColor: t.soft,
      }}
    >
      <Sub style={{ textAlign: 'center' }}>{text}</Sub>
    </View>
  );
}

/**
 * Goal progress: solid fill for money actually saved, diagonal hatching for
 * where the plan says you should be, and a knob at the join.
 */
function GoalTrack({
  pct,
  hatchTo,
  done,
}: {
  pct: number;
  hatchTo: number;
  done: boolean;
}) {
  const { t } = useTheme();
  const [w, setW] = useState(0);
  const color = done ? t.sage : t.coral;

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ height: 16, justifyContent: 'center' }}
    >
      <View
        style={{
          height: 10,
          borderRadius: 999,
          backgroundColor: t.track,
          overflow: 'hidden',
        }}
      >
        {w > 0 ? (
          <Svg width={(w * hatchTo) / 100} height={10}>
            <Defs>
              <Pattern
                id="goalHatch"
                width={4.2}
                height={4.2}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <Line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={4.2}
                  stroke={color}
                  strokeOpacity={0.4}
                  strokeWidth={1.6}
                />
              </Pattern>
            </Defs>
            <Rect
              width={(w * hatchTo) / 100}
              height={10}
              // Rounds its own ends: a rounded parent does not clip this child
              // on older Android, so it would otherwise show square corners.
              rx={5}
              fill="url(#goalHatch)"
            />
          </Svg>
        ) : null}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            borderRadius: 999,
            backgroundColor: color,
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          left: `${pct}%`,
          marginLeft: -8,
          width: 16,
          height: 16,
          borderRadius: 999,
          backgroundColor: t.ground,
          borderWidth: 2.5,
          borderColor: color,
          ...shadowOf(t),
        }}
      />
    </View>
  );
}
