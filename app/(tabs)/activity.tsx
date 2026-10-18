import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useSheets } from '@/components/SheetsProvider';
import {
  CardTitle,
  CatTile,
  Chip,
  Glass,
  H1,
  Hairline,
  Label,
  Money,
  Press,
  Segmented,
  Sub,
  font,
} from '@/components/ui';
import { MASCOT } from '@/lib/content';
import { money } from '@/lib/format';
import { Icon } from '@/lib/icons';
import { useEllie } from '@/store/EllieStore';
import { groupByDay, useDerived } from '@/store/derive';
import { useTheme } from '@/theme/ThemeContext';
import type { CategoryKey } from '@/theme/tokens';

export default function Activity() {
  const { t } = useTheme();
  const router = useRouter();
  const { cycle, removeTx, showPop } = useEllie();
  const { openAmount } = useSheets();
  const d = useDerived();

  const [tab, setTab] = useState('Overview');
  const [filter, setFilter] = useState<string>('All');
  const [tappedBar, setTappedBar] = useState<CategoryKey | null>(null);

  const active = d.filterCats.includes(filter) ? filter : 'All';
  const listed = useMemo(
    () => (active === 'All' ? d.txs : d.txs.filter((x) => x.cat === active)),
    [active, d.txs],
  );
  const groups = useMemo(() => groupByDay(listed), [listed]);
  const listTotal = listed.reduce((a, b) => a + b.amount, 0);

  return (
    <Screen contentStyle={{ gap: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <H1>Activity</H1>
        <Glass
          flat
          radius={999}
          style={{
            height: 36,
            paddingHorizontal: 14,
            justifyContent: 'center',
          }}
        >
          <Text
            style={{ fontFamily: font.semibold, fontSize: 13, color: t.sub }}
          >
            {cycle.name}
          </Text>
        </Glass>
      </View>

      <Segmented
        options={['Overview', 'Transactions']}
        value={tab}
        onChange={setTab}
      />

      {tab === 'Overview' ? (
        <View style={{ gap: 16 }}>
          <Glass style={{ padding: 18, paddingHorizontal: 20, gap: 14 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <CardTitle>All expenses</CardTitle>
              <Money value={d.spent} size={17} />
            </View>

            {d.bars.length === 0 ? (
              <Sub style={{ paddingVertical: 28, textAlign: 'center' }}>
                Nothing logged in this cycle yet.
              </Sub>
            ) : (
              <>
                <View
                  style={{
                    height: 172,
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    paddingHorizontal: 2,
                  }}
                >
                  {d.bars.map((b) => {
                    const on = tappedBar === b.cat;
                    return (
                      <Pressable
                        key={b.cat}
                        onPress={() => setTappedBar(on ? null : b.cat)}
                        style={{ width: 44, alignItems: 'center', gap: 7 }}
                      >
                        <View
                          style={{
                            height: 24,
                            paddingHorizontal: on ? 10 : 0,
                            borderRadius: 999,
                            justifyContent: 'center',
                            backgroundColor: on ? t.ink : 'transparent',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: font.semibold,
                              fontSize: 12,
                              color: on ? t.ground : t.sub,
                            }}
                          >
                            {b.pct}%
                          </Text>
                        </View>
                        <View
                          style={{
                            width: 44,
                            height: Math.max(b.height, 6),
                            borderRadius: 14,
                            backgroundColor: t.hue[b.cat],
                          }}
                        />
                      </Pressable>
                    );
                  })}
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingHorizontal: 2,
                  }}
                >
                  {d.bars.map((b) => (
                    <View
                      key={b.cat}
                      style={{ width: 44, alignItems: 'center' }}
                    >
                      <CatTile cat={b.cat} size={30} iconSize={16} />
                    </View>
                  ))}
                </View>
              </>
            )}
          </Glass>

          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <Label>Against last cycle</Label>
            <Hairline />
          </View>

          <View style={{ gap: 10 }}>
            {d.movers.map((m) => {
              const up = m.delta !== null && m.delta > 0;
              return (
                <Press
                  key={m.cat}
                  scale={0.98}
                  onPress={() => router.push(`/detail/${m.cat}`)}
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
                    <CatTile cat={m.cat} size={40} iconSize={17} />
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Text
                        style={{
                          fontFamily: font.semibold,
                          fontSize: 16,
                          color: t.ink,
                        }}
                      >
                        {m.cat}
                      </Text>
                      <Text
                        style={{
                          fontFamily: font.regular,
                          fontSize: 13,
                          color: t.lbl,
                        }}
                      >
                        {m.share}% of total
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Money value={m.amount} size={16} />
                      <View
                        style={{
                          height: 20,
                          paddingHorizontal: 8,
                          borderRadius: 999,
                          justifyContent: 'center',
                          backgroundColor: up ? t.ochreBg : t.sageBg,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: font.semibold,
                            fontSize: 11.5,
                            color: up ? t.ochre : t.sageInk,
                          }}
                        >
                          {m.delta === null
                            ? 'new'
                            : `${m.delta > 0 ? '+' : ''}${m.delta}%`}
                        </Text>
                      </View>
                    </View>
                  </Glass>
                </Press>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {d.filterCats.slice(0, 5).map((f) => (
              <Chip
                key={f}
                label={f}
                active={active === f}
                onPress={() => setFilter(f)}
              />
            ))}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              paddingHorizontal: 4,
            }}
          >
            <Sub>
              {listed.length}{' '}
              {listed.length === 1 ? 'transaction' : 'transactions'}
              {active === 'All' ? '' : ` in ${active}`}
            </Sub>
            <Money value={listTotal} size={17} />
          </View>

          {listed.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
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
              <Sub style={{ paddingTop: 8, fontSize: 12, color: t.lbl }}>
                Nothing logged here yet.
              </Sub>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {groups.map((grp) => (
                <View key={grp.day} style={{ gap: 9 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <Label>{grp.day}</Label>
                    <Hairline />
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 12.5,
                        color: t.lbl,
                      }}
                    >
                      {d.sym}
                      {money(grp.total)}
                    </Text>
                  </View>

                  {grp.items.map((item) => (
                    <Press
                      key={item.id}
                      scale={0.98}
                      onPress={() =>
                        openAmount({
                          kind: 'tx',
                          id: item.id,
                          cat: item.cat,
                          title: item.name,
                          sub: `${item.when} · was ${d.sym}${money(item.amount)}`,
                        })
                      }
                    >
                      <Glass
                        style={{
                          paddingVertical: 11,
                          paddingLeft: 16,
                          paddingRight: 14,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 13,
                        }}
                      >
                        <CatTile cat={item.cat} size={36} iconSize={16} />
                        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              fontFamily: font.semibold,
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
                            {item.cat} · {item.src}
                          </Text>
                        </View>
                        <Money value={item.amount} size={16} />
                        <Press
                          scale={0.88}
                          onPress={() => {
                            removeTx(item.id);
                            showPop(
                              'del',
                              'Transaction removed',
                              `${item.name} · ${d.sym}${money(item.amount)}`,
                              item.cat,
                            );
                          }}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 999,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: t.soft,
                          }}
                        >
                          <Icon name="trash" size={15} color={t.lbl} />
                        </Press>
                      </Glass>
                    </Press>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}
