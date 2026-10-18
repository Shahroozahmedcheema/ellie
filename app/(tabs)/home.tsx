import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { Donut } from '@/components/Donut';
import { TourAnchor } from '@/components/TourTargets';
import { Screen } from '@/components/Screen';
import {
  CatTile,
  Glass,
  Hairline,
  Label,
  Money,
  Press,
  StatPill,
  Sub,
  Track,
  font,
} from '@/components/ui';
import { MASCOT } from '@/lib/content';
import { money } from '@/lib/format';
import { Icon } from '@/lib/icons';
import { useEllie } from '@/store/EllieStore';
import { useDerived } from '@/store/derive';
import { useTheme } from '@/theme/ThemeContext';
import type { CategoryKey } from '@/theme/tokens';

export default function Home() {
  const router = useRouter();
  const { t } = useTheme();
  const { cycle, cycleIdx, cycles, setCycleIdx, toggleTheme, state } = useEllie();
  const d = useDerived();
  const [tapped, setTapped] = useState<CategoryKey | null>(null);

  const closed = cycle.daysLeft === 0;

  return (
    <Screen>
      {/* header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 52,
        }}
      >
        <Press
          scale={0.9}
          onPress={() => router.replace('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          style={{
            width: 52,
            height: 52,
            borderRadius: 17,
            backgroundColor: t.coral,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            shadowColor: t.coral,
            shadowOpacity: 0.32,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          }}
        >
          <Image
            source={MASCOT.logo}
            style={{ width: 44, height: 44, resizeMode: 'contain' }}
          />
        </Press>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Pressable
            hitSlop={8}
            disabled={cycleIdx === 0}
            onPress={() => setCycleIdx(cycleIdx - 1)}
            style={{ opacity: cycleIdx === 0 ? 0.25 : 1, padding: 4 }}
          >
            <Icon name="back" size={16} color={t.lbl} />
          </Pressable>
          <View style={{ alignItems: 'center', gap: 1, minWidth: 132 }}>
            <Text
              style={{
                fontFamily: font.semibold,
                fontSize: 16,
                letterSpacing: 0.16,
                color: t.ink,
              }}
            >
              {cycle.name}
            </Text>
            <Text
              style={{ fontFamily: font.regular, fontSize: 10.5, color: t.lbl }}
            >
              {cycle.label}
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            disabled={cycleIdx >= cycles.length - 1}
            onPress={() => setCycleIdx(cycleIdx + 1)}
            style={{
              opacity: cycleIdx >= cycles.length - 1 ? 0.25 : 1,
              padding: 4,
              transform: [{ rotate: '180deg' }],
            }}
          >
            <Icon name="back" size={16} color={t.lbl} />
          </Pressable>
        </View>

        <Press
          scale={0.9}
          onPress={toggleTheme}
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.glass,
            borderWidth: t.lipWidth,
            borderColor: t.lipColor,
          }}
        >
          <Icon
            name={state.theme === 'dark' ? 'moon' : 'sun'}
            size={18}
            strokeWidth={1.6}
            color={t.sub}
          />
        </Press>
      </View>

      {/* hero */}
      <Glass
        style={{
          padding: 18,
          paddingHorizontal: 20,
          paddingBottom: 20,
          gap: 14,
        }}
      >
        <TourAnchor tourKey="ring" style={{ alignSelf: 'center' }}>
        <Donut
          segments={d.segments}
          rest={d.rest}
          selected={tapped}
          onSelect={setTapped}
          sharePct={tapped ? d.pctOf(tapped) : null}
        >
          <Label style={{ fontSize: 10.5, letterSpacing: 0.84 }}>
            Left this cycle
          </Label>
          <Money
            value={d.left}
            size={31}
            style={{ lineHeight: 34 }}
          />
          <Text
            style={{
              fontFamily: font.regular,
              fontSize: 10.5,
              lineHeight: 13,
              color: t.sub,
              maxWidth: 118,
              textAlign: 'center',
            }}
          >
            of {d.sym}
            {money(d.income)} · {cycle.daysLeft} days to go
          </Text>
        </Donut>
        </TourAnchor>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <StatPill
            caption="Today"
            tone="neutral"
            value={
              closed
                ? 'Cycle closed'
                : `${d.sym}${money(d.dailyLeft)} a day`
            }
          />
          <StatPill
            caption="At this pace"
            tone={d.ahead ? 'good' : 'warn'}
            value={`${d.sym}${money(d.paceDelta)} ${d.ahead ? 'spare' : 'short'}`}
          />
        </View>
      </Glass>

      {/* breakdown */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Label>Where it went</Label>
        <Hairline />
      </View>

      {d.rows.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 24, gap: 0 }}>
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
          <Sub style={{ paddingTop: 8, color: t.lbl }}>
            Nothing logged in this cycle yet.
          </Sub>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {d.rows.map((row) => (
            <Press
              key={row.cat}
              scale={0.98}
              onPress={() => router.push(`/detail/${row.cat}`)}
            >
              <Glass style={{ padding: 14, paddingHorizontal: 18, gap: 11 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <CatTile cat={row.cat} size={40} iconSize={17} />
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 16,
                        color: t.ink,
                      }}
                    >
                      {row.cat}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: font.regular,
                        fontSize: 13,
                        color: row.over ? t.ochre : t.lbl,
                      }}
                    >
                      {row.uncapped
                        ? `${row.share}% of total`
                        : `${d.sym}${money(row.amount)} of ${d.sym}${money(row.cap)}`}
                    </Text>
                  </View>
                  <Money value={row.amount} size={16} />
                </View>
                {/* The bar has to mean what the line above it says: share of
                    total when there is no budget, progress against the cap
                    when there is. Always drawing capPct left every uncapped
                    row with a full label and an empty bar. */}
                <Track
                  pct={row.uncapped ? row.share : row.capPct}
                  color={row.over ? t.ochre : t.hue[row.cat]}
                  height={6}
                />
              </Glass>
            </Press>
          ))}
        </View>
      )}
    </Screen>
  );
}
