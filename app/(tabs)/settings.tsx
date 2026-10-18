import React from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useSheets } from '@/components/SheetsProvider';
import {
  CardTitle,
  Glass,
  GhostButton,
  Grid,
  H1,
  H2,
  Hairline,
  Money,
  Press,
  RowTitle,
  Sub,
  Toggle,
  font,
} from '@/components/ui';
import { MASCOT, SETTINGS_CURRENCIES, SETTINGS_NUDGES } from '@/lib/content';
import { NUDGE_LEVELS } from '@/lib/notifications';
import { cadenceNote, cycleDayLabel } from '@/lib/cycle';
import { money } from '@/lib/format';
import { Icon } from '@/lib/icons';
import { useEllie } from '@/store/EllieStore';
import { useDerived } from '@/store/derive';
import { useTheme } from '@/theme/ThemeContext';
import { ACCENTS, ACCENT_KEYS } from '@/theme/tokens';
import type { Cadence, WeekStart } from '@/lib/types';

const WEEK_HEADS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEK_DAYS: WeekStart[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CADENCES: Cadence[] = ['Daily', 'Weekly', 'Monthly'];

export default function Settings() {
  const { t, dark } = useTheme();
  const {
    state,
    setTheme,
    setCadence,
    setCycleDay,
    setWeekStart,
    setCurrency,
    setNudge,
    setNudgeLevel,
    setAccent,
    eraseData,
  } = useEllie();
  const { openAmount } = useSheets();
  const d = useDerived();

  const name = state.profile.name || 'You';

  return (
    <Screen contentStyle={{ gap: 18 }}>
      <H1>Settings</H1>

      <View style={{ gap: 3 }}>
        <H2>{name}</H2>
        <Sub>Everything you log stays on this device.</Sub>
      </View>

      {/* The cards are their own 14px group; only H1 / name / this list sit at
          the screen column's 18px. */}
      <View style={{ gap: 14 }}>
      {/* appearance + cycle */}
      <Glass style={{ padding: 18, paddingHorizontal: 20, gap: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <CardTitle>Appearance</CardTitle>
          <View
            style={{
              flexDirection: 'row',
              padding: 3,
              borderRadius: 999,
              backgroundColor: t.soft,
            }}
          >
            {(['light', 'dark'] as const).map((key) => {
              const on = state.theme === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTheme(key)}
                  style={{
                    height: 30,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    justifyContent: 'center',
                    backgroundColor: on ? t.ink : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: font.semibold,
                      fontSize: 12.5,
                      color: on ? t.ground : t.lbl,
                    }}
                  >
                    {key === 'light' ? 'Light' : 'Dark'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Hairline style={{ flex: 0 }} />

        <View style={{ gap: 10 }}>
          <RowTitle>Colour</RowTitle>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {ACCENT_KEYS.map((key) => {
              const on = state.accent === key;
              const swatch = ACCENTS[key][dark ? 'dark' : 'light'];
              return (
                <Press
                  key={key}
                  scale={0.92}
                  onPress={() => setAccent(key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${ACCENTS[key].name} theme`}
                  accessibilityState={{ selected: on }}
                  style={{ flex: 1, alignItems: 'center', gap: 6 }}
                >
                  <View
                    style={{
                      width: '100%',
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: swatch,
                      borderWidth: on ? 2.5 : 0,
                      borderColor: t.ink,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {on ? (
                      <Icon name="check" size={18} color="#fff" strokeWidth={2.6} />
                    ) : null}
                  </View>
                  <Text
                    style={{
                      fontFamily: on ? font.semibold : font.regular,
                      fontSize: 11.5,
                      color: on ? t.ink : t.sub,
                    }}
                  >
                    {ACCENTS[key].name}
                  </Text>
                </Press>
              );
            })}
          </View>
        </View>

        <Hairline style={{ flex: 0 }} />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <RowTitle>Monthly income</RowTitle>
            <Sub>What Ellie counts down from</Sub>
          </View>
          <Press
            scale={0.95}
            onPress={() =>
              openAmount({
                kind: 'income',
                title: 'Monthly income',
                sub: `Now ${d.sym}${money(state.income)}`,
              })
            }
            style={{
              height: 40,
              paddingHorizontal: 14,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: t.soft,
            }}
          >
            <Money
              value={state.income}
              size={17}
              // The prototype reserves an 86px centred column so the chip
              // does not resize as the income changes.
              style={{ minWidth: 86, textAlign: 'center' }}
            />
            <Icon name="pencil" size={15} strokeWidth={1.8} color={t.sub} />
          </Press>
        </View>

        <Hairline style={{ flex: 0 }} />

        <View style={{ gap: 10 }}>
          <RowTitle>How often does it reset?</RowTitle>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CADENCES.map((c) => {
              const on = state.cadence === c;
              return (
                <Press
                  key={c}
                  scale={0.91}
                  haptic="selection"
                  onPress={() => setCadence(c)}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? t.ink : t.soft,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: font.semibold,
                      fontSize: 13,
                      color: on ? t.ground : t.sub,
                    }}
                  >
                    {c}
                  </Text>
                </Press>
              );
            })}
          </View>
          <Sub>{cadenceNote(state.cadence)}</Sub>
        </View>

        {state.cadence === 'Monthly' ? (
          <View style={{ gap: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <RowTitle>Cycle starts on</RowTitle>
              <Sub>{cycleDayLabel(state.cycleDay)}</Sub>
            </View>
            <View style={{ gap: 4 }}>
              <Grid
                items={WEEK_HEADS}
                columns={7}
                gap={4}
                renderItem={(w) => (
                  <View
                    style={{
                      height: 22,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 10.5,
                        color: t.lbl,
                      }}
                    >
                      {w}
                    </Text>
                  </View>
                )}
              />
              <Grid
                items={Array.from({ length: 31 }, (_, i) => i + 1)}
                columns={7}
                gap={4}
                renderItem={(day) => {
                  const on = state.cycleDay === day;
                  return (
                    <Press
                      scale={0.91}
                      haptic="selection"
                      onPress={() => setCycleDay(day)}
                      style={{
                        height: 34,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: on ? t.coral : t.soft,
                        transform: [{ scale: on ? 1.06 : 1 }],
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: font.semibold,
                          fontSize: 12.5,
                          color: on ? '#fff' : t.sub,
                        }}
                      >
                        {day}
                      </Text>
                    </Press>
                  );
                }}
              />
            </View>
          </View>
        ) : null}

        {state.cadence === 'Weekly' ? (
          <View style={{ gap: 10 }}>
            <RowTitle>Week starts on</RowTitle>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {WEEK_DAYS.map((w) => {
                const on = state.weekStart === w;
                return (
                  <Press
                    key={w}
                    scale={0.91}
                    haptic="selection"
                    onPress={() => setWeekStart(w)}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? t.coral : t.soft,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 12,
                        color: on ? '#fff' : t.sub,
                      }}
                    >
                      {w.slice(0, 2)}
                    </Text>
                  </Press>
                );
              })}
            </View>
          </View>
        ) : null}

        <Hairline style={{ flex: 0 }} />

        <View style={{ gap: 9 }}>
          <RowTitle>Currency</RowTitle>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {SETTINGS_CURRENCIES.map((c) => {
              const on = state.currency === c;
              return (
                <Press
                  key={c}
                  scale={0.91}
                  haptic="selection"
                  onPress={() => setCurrency(c)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? t.coral : t.soft,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: font.semibold,
                      fontSize: 13,
                      color: on ? '#fff' : t.sub,
                    }}
                  >
                    {c}
                  </Text>
                </Press>
              );
            })}
          </View>
        </View>
      </Glass>

      {/* nudges */}
      <Glass style={{ padding: 18, paddingHorizontal: 20, gap: 14 }}>
        <CardTitle>Nudges</CardTitle>
        {SETTINGS_NUDGES.map((n) => (
          <View
            key={n.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <RowTitle>{n.name}</RowTitle>
              <Sub>{n.note}</Sub>
            </View>
            <Toggle
              on={state.nudges[n.key]}
              onPress={() => setNudge(n.key, !state.nudges[n.key])}
            />
          </View>
        ))}

        <Hairline style={{ flex: 0 }} />

        <View style={{ gap: 10 }}>
          <View style={{ gap: 2 }}>
            <RowTitle>How often</RowTitle>
            <Sub>{NUDGE_LEVELS[state.nudgeLevel - 1].note}</Sub>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {NUDGE_LEVELS.map((n) => {
              const on = state.nudgeLevel === n.level;
              return (
                <Press
                  key={n.level}
                  scale={0.94}
                  haptic="selection"
                  onPress={() => setNudgeLevel(n.level)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={{ flex: 1 }}
                >
                  <View
                    style={{
                      height: 40,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? t.accent : t.soft,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 13,
                        color: on ? '#fff' : t.sub,
                      }}
                    >
                      {n.name.replace(/ .*$/, '')}
                    </Text>
                  </View>
                </Press>
              );
            })}
          </View>
        </View>
      </Glass>

      {/* this cycle */}
      <Glass style={{ padding: 18, paddingHorizontal: 20, gap: 14 }}>
        <CardTitle>This cycle</CardTitle>
        <Hairline style={{ flex: 0 }} />
        <SummaryRow label="Logged" value={String(d.txs.length)} plain />
        <SummaryRow label="Spent" value={d.spent} />
        {d.goalSpend > 0 ? (
          <SummaryRow label="Into goals" value={d.goalSpend} />
        ) : null}
        <SummaryRow label="Left" value={d.left} />
      </Glass>

      <GhostButton
        label="Delete data"
        onPress={() =>
          Alert.alert(
            'Delete your data?',
            'Every transaction and goal on this device is deleted. Your currency, cycle, budgets and appearance stay as they are. This cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: eraseData },
            ],
          )
        }
      />

      <View style={{ alignItems: 'center', paddingTop: 2 }}>
        <Image
          source={MASCOT.peeking}
          style={{
            width: 96,
            height: 96,
            resizeMode: 'contain',
            marginBottom: -15,
            opacity: t.mascotOpacity,
          }}
        />
        <Hairline style={{ width: '100%', flex: 0 }} />
        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 12,
            color: t.lbl,
            paddingTop: 8,
          }}
        >
          Ellie v1.0 · made for people who quit budget apps
        </Text>
      </View>
      </View>
    </Screen>
  );
}

function SummaryRow({
  label,
  value,
  plain,
}: {
  label: string;
  value: number | string;
  plain?: boolean;
}) {
  const { t } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
      }}
    >
      <Sub>{label}</Sub>
      {plain ? (
        <Text
          style={{ fontFamily: font.semibold, fontSize: 17, color: t.ink }}
        >
          {value}
        </Text>
      ) : (
        <Money value={value as number} size={17} />
      )}
    </View>
  );
}
