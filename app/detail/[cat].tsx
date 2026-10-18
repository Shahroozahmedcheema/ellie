import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useSheets } from '@/components/SheetsProvider';
import {
  CatTile,
  Glass,
  GhostButton,
  H2,
  Hairline,
  IconButton,
  Label,
  Money,
  Press,
  Sub,
  Track,
  font,
} from '@/components/ui';
import { money, whenLabel } from '@/lib/format';
import { useEllie } from '@/store/EllieStore';
import { useDerived } from '@/store/derive';
import { useTheme } from '@/theme/ThemeContext';
import { CATEGORIES, type CategoryKey } from '@/theme/tokens';

export default function CategoryDetail() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ cat: string }>();
  const { cycle, state } = useEllie();
  const { openAmount } = useSheets();
  const d = useDerived();

  const cat = (
    CATEGORIES.includes(params.cat as CategoryKey) ? params.cat : 'Food'
  ) as CategoryKey;

  const spent = d.by[cat] ?? 0;
  // A category the user never budgeted has a cap of 0. Substituting 1 to dodge
  // the division invented a ₨1 budget and reported them wildly overspent.
  const cap = state.caps[cat] ?? 0;
  const uncapped = cap <= 0;
  const pct = uncapped ? 0 : Math.round((spent / cap) * 100);
  const over = !uncapped && pct > 100;
  const items = d.txs.filter((x) => x.cat === cat);

  return (
    <Screen contentStyle={{ gap: 18 }} padBottom={40}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <IconButton name="back" onPress={() => router.back()} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <CatTile cat={cat} size={36} iconSize={18} />
          <H2>{cat}</H2>
        </View>
      </View>

      <Glass style={{ padding: 18, paddingHorizontal: 20, gap: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ gap: 4 }}>
            <Label>Spent</Label>
            <Money value={spent} size={40} style={{ lineHeight: 44 }} />
          </View>
          {uncapped ? (
            <Sub>no cap set</Sub>
          ) : (
            <View
              style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}
            >
              <Sub>of</Sub>
              <Money value={cap} size={12.5} color={t.sub} />
            </View>
          )}
        </View>

        <Track
          pct={pct}
          height={10}
          color={over ? t.ochre : t.hue[cat]}
        />

        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 13,
            color: over ? t.ochre : t.sub,
          }}
        >
          {uncapped
            ? `No budget for ${cat} yet — set one to track it.`
            : over
              ? `${d.sym}${money(spent - cap)} over, with ${cycle.daysLeft} days to go.`
              : `${d.sym}${money(cap - spent)} left, with ${cycle.daysLeft} days to go.`}
        </Text>

        <GhostButton
          label="Adjust this budget"
          onPress={() =>
            openAmount({
              kind: 'budget',
              cat,
              title: `${cat} budget`,
              sub: `${d.sym}${money(spent)} spent so far this cycle`,
            })
          }
        />
      </Glass>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Label>This cycle</Label>
        <Hairline />
      </View>

      {items.length === 0 ? (
        <Sub style={{ textAlign: 'center', paddingVertical: 24 }}>
          Nothing in {cat} this cycle.
        </Sub>
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((item) => (
            <Press
              key={item.id}
              scale={0.98}
              onPress={() =>
                openAmount({
                  kind: 'tx',
                  id: item.id,
                  cat: item.cat,
                  title: item.name,
                  sub: `${whenLabel(item.ts)} · was ${d.sym}${money(item.amount)}`,
                })
              }
            >
              <Glass
                style={{
                  paddingVertical: 11,
                  paddingHorizontal: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <CatTile cat={cat} size={36} iconSize={16} />
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: font.medium,
                      fontSize: 15,
                      color: t.ink,
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: font.regular,
                      fontSize: 12,
                      color: t.lbl,
                    }}
                  >
                    {whenLabel(item.ts)}
                  </Text>
                </View>
                <Money value={item.amount} size={16} />
              </Glass>
            </Press>
          ))}
        </View>
      )}
    </Screen>
  );
}
