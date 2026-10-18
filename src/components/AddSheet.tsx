import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  ADD_STEP_HINTS,
  ADD_STEP_QUESTIONS,
  DATE_CHIPS,
  type DateChip,
} from '@/lib/content';
import { DAY_MS, money } from '@/lib/format';
import { Icon } from '@/lib/icons';
import { useEllie } from '@/store/EllieStore';
import { useTheme } from '@/theme/ThemeContext';
import { CATEGORIES, type CategoryKey } from '@/theme/tokens';
import { Keypad, pressDigits } from './Keypad';
import { Sheet } from './Sheet';
import {
  CatTile,
  Field,
  GhostButton,
  H2,
  Label,
  Money,
  Press,
  PrimaryButton,
  Soft,
  Sub,
  font,
  shadowOf,
} from './ui';

export type AddMode = 'manual' | 'voice' | 'scan';

/** Timestamp for the three date chips the manual flow offers. */
const tsForChip = (chip: DateChip) => {
  const now = Date.now();
  if (chip === 'Today') return now;
  if (chip === 'Yesterday') return now - DAY_MS;
  return now - 3 * DAY_MS;
};

export function AddSheet({
  mode,
  onClose,
  onModeChange,
}: {
  mode: AddMode | null;
  onClose: () => void;
  onModeChange: (m: AddMode) => void;
}) {
  const { t, dark, sym } = useTheme();
  const { addTx, showPop, flash } = useEllie();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [digits, setDigits] = useState('');
  const [cat, setCat] = useState<CategoryKey>('Food');
  const [when, setWhen] = useState<DateChip>('Today');

  const amount = parseInt(digits || '0', 10);
  const nameOk = name.trim().length > 0;

  const reset = useCallback(() => {
    setStep(0);
    setName('');
    setDigits('');
    setCat('Food');
    setWhen('Today');
  }, []);

  useEffect(() => {
    if (mode === null) reset();
  }, [mode, reset]);

  const close = () => onClose();

  const commit = (src: 'Typed') => {
    if (!amount) {
      flash('Add an amount');
      return;
    }
    addTx({
      cat,
      name: name.trim() || 'Untitled',
      amount,
      ts: tsForChip(when),
      src,
    });
    showPop(
      'add',
      `${sym}${money(amount)} logged`,
      `${name.trim() || 'Untitled'} · ${cat}`,
      cat,
    );
    close();
  };

  const stepReady = step === 0 ? nameOk : step === 1 ? amount > 0 : amount > 0 && nameOk;

  return (
    <Sheet open={mode !== null} onClose={close} scroll>
      {mode === null ? (
        <View />
      ) : (
        <>
          <ModeSwitch
            mode={mode}
            onPick={(m) => {
              if (m === 'manual') setStep(0);
              else {
                setDigits('');
                setName('');
              }
              onModeChange(m);
            }}
          />

          {mode === 'manual' ? (
            <View style={{ gap: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <H2>{ADD_STEP_QUESTIONS[step]}</H2>
                  <Sub>
                    {step === 2
                      ? `${name.trim() || 'This expense'} · ${sym}${money(amount)}`
                      : ADD_STEP_HINTS[step]}
                  </Sub>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: i === step ? 18 : 7,
                        height: 7,
                        borderRadius: 999,
                        backgroundColor: i <= step ? t.coral : t.track,
                      }}
                    />
                  ))}
                </View>
              </View>

              {step === 0 ? (
                <Field
                  value={name}
                  onChangeText={setName}
                  placeholder="Coffee, groceries, taxi…"
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => nameOk && setStep(1)}
                />
              ) : null}

              {step === 1 ? (
                <View style={{ gap: 14 }}>
                  <View
                    style={{
                      height: 64,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Money
                      size={52}
                      color={amount ? t.ink : t.inert}
                      formatted={amount ? money(amount) : '0'}
                    />
                  </View>
                  <Keypad onPress={(k) => setDigits((d) => pressDigits(d, k))} />
                </View>
              ) : null}

              {step === 2 ? (
                <View style={{ gap: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {DATE_CHIPS.map((d) => {
                      const active = when === d;
                      return (
                        <Press
                          key={d}
                          scale={0.91}
                          haptic="selection"
                          onPress={() => setWhen(d)}
                          style={{
                            flex: 1,
                            height: 44,
                            borderRadius: 999,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 10,
                            backgroundColor: active ? t.ink : t.soft,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: font.semibold,
                              fontSize: 13,
                              textAlign: 'center',
                              color: active ? t.ground : t.sub,
                            }}
                          >
                            {d}
                          </Text>
                        </Press>
                      );
                    })}
                  </View>

                  <Label>And what kind of spend</Label>
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
                        <CatTile
                          cat={c}
                          size={56}
                          selected={cat === c}
                          iconSize={24}
                        />
                      </Press>
                    ))}
                  </View>

                  <Soft
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      padding: 12,
                      paddingHorizontal: 16,
                    }}
                  >
                    <Sub numberOfLines={1} style={{ flex: 1 }}>
                      {name.trim() || 'Untitled'} · {cat} · {when}
                    </Sub>
                    <Money value={amount} size={17} />
                  </Soft>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {step > 0 ? (
                  <Press
                    scale={0.97}
                    onPress={() => setStep((s) => Math.max(s - 1, 0))}
                    style={{
                      width: 96,
                      height: 56,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: t.faint,
                      borderWidth: t.lipWidth,
                      borderColor: t.lipColor,
                      ...shadowOf(t),
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 15,
                        color: t.sub,
                      }}
                    >
                      Back
                    </Text>
                  </Press>
                ) : null}
                <PrimaryButton
                  style={{ flex: 1 }}
                  disabled={!stepReady}
                  label={
                    step === 2
                      ? amount
                        ? `Log ${sym}${money(amount)}`
                        : 'Enter an amount'
                      : 'Next'
                  }
                  onPress={() => {
                    if (step === 0) {
                      if (!nameOk) return flash('Give it a name first');
                      return setStep(1);
                    }
                    if (step === 1) {
                      if (!amount) return flash('Add an amount');
                      return setStep(2);
                    }
                    commit('Typed');
                  }}
                />
              </View>
            </View>
          ) : null}

          {mode === 'voice' || mode === 'scan' ? (
            <ComingSoon kind={mode} onType={() => onModeChange('manual')} />
          ) : null}
        </>
      )}
    </Sheet>
  );
}

function ModeSwitch({
  mode,
  onPick,
}: {
  mode: AddMode;
  onPick: (m: AddMode) => void;
}) {
  const { t } = useTheme();
  const items: { key: AddMode; label: string }[] = [
    { key: 'manual', label: 'Type' },
    { key: 'voice', label: 'Say' },
    { key: 'scan', label: 'Scan' },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 4,
        borderRadius: 999,
        backgroundColor: t.soft,
      }}
    >
      {items.map((it) => {
        const active = mode === it.key;
        return (
          <Pressable
            key={it.key}
            onPress={() => onPick(it.key)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? t.ink : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: font.semibold,
                fontSize: 13.5,
                color: active ? t.ground : t.sub,
              }}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ComingSoon({
  kind,
  onType,
}: {
  kind: 'voice' | 'scan';
  onType: () => void;
}) {
  const { t } = useTheme();
  const voice = kind === 'voice';
  return (
    <View style={{ alignItems: 'center', gap: 14, paddingVertical: 18 }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 999,
          backgroundColor: t.coral + '1F',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          name={voice ? 'mic' : 'camera'}
          size={38}
          strokeWidth={1.7}
          color={t.coral}
        />
      </View>

      <View
        style={{
          height: 24,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: t.soft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: font.semibold,
            fontSize: 11,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: t.sub,
          }}
        >
          Coming soon
        </Text>
      </View>

      <View style={{ alignItems: 'center', gap: 6, paddingHorizontal: 8 }}>
        <Text
          style={{
            fontFamily: font.semibold,
            fontSize: 18,
            letterSpacing: -0.2,
            color: t.ink,
          }}
        >
          {voice ? 'Say it out loud' : 'Snap the receipt'}
        </Text>
        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 13.5,
            lineHeight: 19,
            textAlign: 'center',
            color: t.sub,
          }}
        >
          {voice
            ? 'Speaking an expense straight into Ellie is on the way. For now, typing it takes about five seconds.'
            : 'Reading a receipt with the camera is on the way. For now, typing it takes about five seconds.'}
        </Text>
      </View>

      <GhostButton
        label="Type it instead"
        onPress={onType}
        style={{ alignSelf: 'stretch' }}
      />
    </View>
  );
}
