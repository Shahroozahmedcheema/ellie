import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { money } from '@/lib/format';
import { CATEGORIES, type CategoryKey } from '@/theme/tokens';
import { useEllie } from '@/store/EllieStore';
import { useTheme } from '@/theme/ThemeContext';
import { Keypad, pressDigits } from './Keypad';
import { Sheet } from './Sheet';
import type { AmountConfig } from './SheetsProvider';
import {
  CatTile,
  H2,
  IconButton,
  Money,
  Press,
  PrimaryButton,
  Sub,
} from './ui';

/**
 * One sheet drives every number in the app: budgets, income, goal targets,
 * goal contributions and transaction amounts. The prototype does the same.
 */
export function AmountSheet({
  config,
  onClose,
}: {
  config: AmountConfig | null;
  onClose: () => void;
}) {
  const { t, sym } = useTheme();
  const {
    setCap,
    setIncome,
    addGoal,
    contribute,
    updateTx,
    removeTx,
    showPop,
    flash,
    state,
  } = useEllie();

  const [digits, setDigits] = useState('');
  const [cat, setCat] = useState<CategoryKey>('Other');

  useEffect(() => {
    if (!config) return;
    setDigits('');
    setCat(
      config.kind === 'budget' || config.kind === 'tx' ? config.cat : 'Other',
    );
  }, [config]);

  const value = parseInt(digits || '0', 10);
  const showTiles = config?.kind === 'tx';
  const canDelete = config?.kind === 'tx';

  const label = !value
    ? 'Enter an amount'
    : config?.kind === 'tx'
      ? `Update to ${sym}${money(value)}`
      : config?.kind === 'goalAdd'
        ? `Put ${sym}${money(value)} in`
        : `Save ${sym}${money(value)}`;

  const commit = () => {
    if (!config) return;
    if (!value) {
      flash('Enter an amount');
      return;
    }

    if (config.kind === 'budget') {
      setCap(config.cat, value);
      showPop(
        'budget',
        `${config.cat} set to ${sym}${money(value)}`,
        'Budget updated for this cycle',
        config.cat,
      );
    } else if (config.kind === 'income') {
      setIncome(value);
      showPop(
        'budget',
        `Income set to ${sym}${money(value)}`,
        'Ellie counts down from here',
        'Other',
      );
    } else if (config.kind === 'goalTarget') {
      addGoal(config.name, value);
      showPop(
        'add',
        `${config.name} added`,
        `Target ${sym}${money(value)}`,
        'Other',
      );
    } else if (config.kind === 'goalAdd') {
      const goal = state.goals.find((g) => g.id === config.goalId);
      if (!goal) return;
      const put = Math.min(value, goal.target - goal.saved);
      contribute(config.goalId, value);
      if (goal.saved + put < goal.target) {
        showPop(
          'add',
          `${sym}${money(put)} into ${goal.name}`,
          `${sym}${money(goal.target - goal.saved - put)} to go`,
          'Other',
        );
      }
    } else if (config.kind === 'tx') {
      const row = state.txs.find((x) => x.id === config.id);
      updateTx(config.id, { amount: value, cat });
      showPop(
        'edit',
        `${sym}${money(value)} updated`,
        `${row?.name ?? 'Transaction'} · ${cat}`,
        cat,
      );
    }
    onClose();
  };

  return (
    <Sheet open={!!config} onClose={onClose}>
      {config ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <CatTile cat={cat} size={44} iconSize={18} />
            <View style={{ flex: 1, gap: 2 }}>
              <H2 numberOfLines={1}>{config.title}</H2>
              <Sub numberOfLines={2}>{config.sub}</Sub>
            </View>
            {canDelete ? (
              <IconButton
                name="trash"
                tone="soft"
                size={38}
                iconSize={17}
                color={t.lbl}
                onPress={() => {
                  removeTx(config.id);
                  const row = state.txs.find((x) => x.id === config.id);
                  showPop(
                    'del',
                    'Transaction removed',
                    row ? `${row.name} · ${sym}${money(row.amount)}` : undefined,
                    row?.cat ?? 'Other',
                  );
                  onClose();
                }}
              />
            ) : null}
          </View>

          <View
            style={{
              height: 66,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Money
              value={value}
              size={50}
              color={value ? t.ink : t.inert}
              formatted={value ? money(value) : '0'}
            />
          </View>

          {showTiles ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'space-between',
              }}
            >
              {CATEGORIES.map((c) => (
                <Press
                  key={c}
                  scale={0.91}
                  haptic="selection"
                  onPress={() => setCat(c)}
                >
                  <CatTile cat={c} size={52} selected={cat === c} iconSize={22} />
                </Press>
              ))}
            </View>
          ) : null}

          <Keypad onPress={(k) => setDigits((d) => pressDigits(d, k))} />

          <PrimaryButton
            label={label}
            disabled={value === 0}
            onPress={commit}
          />
        </>
      ) : (
        <View />
      )}
    </Sheet>
  );
}
