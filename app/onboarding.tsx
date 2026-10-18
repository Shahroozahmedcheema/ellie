import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlobField } from '@/components/BlobField';
import { Keypad, pressDigits } from '@/components/Keypad';
import {
  CatTile,
  Field,
  Glass,
  Grid,
  Press,
  PrimaryButton,
  Toggle,
  font,
  shadowOf,
} from '@/components/ui';
import {
  FEEL_LINES,
  KEEP_TARGETS,
  MASCOT,
  ONB_CHECKS,
  ONB_CTA,
  ONB_CURRENCIES,
  ONB_HABIT_STATS,
  ONB_NUDGES,
  ONB_PROMISES,
  ONB_STEPS,
  ONB_WEEKS,
  PAIN_LINES,
  QUIZ,
  WANT_LINES,
  type OnbStep,
} from '@/lib/content';
import { cycleDayLabel } from '@/lib/cycle';
import { money, symbolFor } from '@/lib/format';
import { Icon } from '@/lib/icons';
import { NUDGE_LEVELS, requestNudgePermission } from '@/lib/notifications';
import type {
  Cadence,
  NudgeLevel,
  Nudges,
  ThemeKey,
  WeekStart,
} from '@/lib/types';
import { useEllie } from '@/store/EllieStore';
import { useTheme } from '@/theme/ThemeContext';
import {
  ACCENTS,
  ACCENT_KEYS,
  CATEGORIES,
  type AccentKey,
  type CategoryKey,
} from '@/theme/tokens';

const WEEK_DAYS: WeekStart[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CADENCES: Cadence[] = ['Daily', 'Weekly', 'Monthly'];

export default function Onboarding() {
  const { t, dark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { finishOnboarding, setTheme, setAccent, state } = useEllie();

  const [i, setI] = useState(0);
  const kind: OnbStep = ONB_STEPS[i];

  // Answers collected along the way.
  const [name, setName] = useState(state.profile.name);
  const [age, setAge] = useState(state.profile.age);
  const [quizIdx, setQuizIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currency, setCurrency] = useState(state.currency);
  const [cadence, setCadence] = useState<Cadence>(state.cadence);
  const [cycleDay, setCycleDay] = useState(state.cycleDay);
  const [weekStart, setWeekStart] = useState<WeekStart>(state.weekStart);
  const [income, setIncome] = useState(state.income);
  const [cats, setCats] = useState<CategoryKey[]>(state.pickedCats);
  const [keepTarget, setKeepTarget] = useState<number | 'Custom'>(
    state.profile.keepTarget,
  );
  const [nudges, setNudges] = useState<Nudges>(state.nudges);
  const [nudgeLevel, setNudgeLevel] = useState<NudgeLevel>(state.nudgeLevel);
  const [themeKey, setThemeKey] = useState<ThemeKey>(state.theme);
  const [accentKey, setAccentKey] = useState<AccentKey>(state.accent);
  const [checkStep, setCheckStep] = useState(0);
  const [holding, setHolding] = useState(false);

  const sym = symbolFor(currency);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [i, enter]);

  const go = useCallback(
    async (next: number) => {
      if (kind === 'nudgeLevel' && nudges.daily) {
        // Ask here rather than on the toggle screen, so the system prompt
        // arrives once the user has actually said how often they want them.
        await requestNudgePermission();
      }
      if (next >= ONB_STEPS.length) {
        finishOnboarding({
          name,
          age,
          answers,
          income,
          currency,
          cadence,
          cycleDay,
          weekStart,
          cats,
          keepTarget,
          nudges,
          nudgeLevel,
          theme: themeKey,
          accent: accentKey,
        });
        router.replace('/home');
        return;
      }
      setI(Math.max(next, 0));
    },
    [
      finishOnboarding,
      router,
      name,
      age,
      answers,
      income,
      currency,
      cadence,
      cycleDay,
      weekStart,
      cats,
      keepTarget,
      nudges,
      nudgeLevel,
      themeKey,
      accentKey,
    ],
  );

  // The analysing step advances itself once its four checks land.
  useEffect(() => {
    if (kind !== 'analyzing') return;
    setCheckStep(0);
    let c = 0;
    const id = setInterval(() => {
      c += 1;
      setCheckStep(c);
      if (c >= 4) {
        clearInterval(id);
        setTimeout(() => go(i + 1), 620);
      }
    }, 640);
    return () => clearInterval(id);
    // `go` changes with every answer, but this step only ever runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  // Press-and-hold on the contract screen finishes setup.
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdFill = useRef(new Animated.Value(0)).current;

  const startHold = () => {
    setHolding(true);
    holdFill.setValue(0);
    Animated.timing(holdFill, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    holdTimer.current = setTimeout(() => {
      setHolding(false);
      go(i + 1);
    }, 1000);
  };

  const endHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
    holdFill.stopAnimation();
    Animated.timing(holdFill, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  useEffect(
    () => () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    },
    [],
  );

  const answer = (choice: number) => {
    const next = answers.slice();
    next[quizIdx] = choice;
    setAnswers(next);
    if (quizIdx < QUIZ.length - 1) setQuizIdx(quizIdx + 1);
    else go(i + 1);
  };

  const who = name.trim() || 'you';
  const painLine = PAIN_LINES[answers[1]] ?? 'losing track entirely';
  const feelLine = FEEL_LINES[answers[2]] ?? 'fine, mostly';
  const wantLine = WANT_LINES[answers[0]] ?? 'room to breathe';

  const nextShown =
    kind !== 'quiz' &&
    kind !== 'analyzing' &&
    kind !== 'contract' &&
    (kind !== 'categories' || cats.length > 0) &&
    (kind !== 'name' || name.trim().length > 0) &&
    (kind !== 'income' || income > 0);

  const centred = kind !== 'quiz' && kind !== 'habit' && kind !== 'contract';

  return (
    <View style={{ flex: 1, backgroundColor: t.ground, overflow: 'hidden' }}>
      <BlobField />

      <View
        style={{
          marginTop: insets.top + 10,
          marginHorizontal: 22,
          height: 5,
          borderRadius: 999,
          backgroundColor: t.track,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.round(((i + 1) / ONB_STEPS.length) * 100)}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: t.coral,
          }}
        />
      </View>

      <Animated.View
        style={{
          flex: 1,
          // See Screen.tsx: an opacity layer on Android draws every elevated
          // child's shadow as a hard box for the length of the animation.
          opacity: Platform.OS === 'android' ? 1 : enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 22,
            paddingTop: 8,
            paddingBottom: 12,
            justifyContent: 'center',
            alignItems: centred ? 'center' : 'stretch',
          }}
        >
          {kind === 'welcome' ? (
            <Centre>
              <View
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: 44,
                  backgroundColor: t.coral,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  shadowColor: t.coral,
                  shadowOpacity: 0.4,
                  shadowRadius: 40,
                  shadowOffset: { width: 0, height: 16 },
                  elevation: 12,
                }}
              >
                <Image
                  source={MASCOT.logo}
                  style={{ width: 104, height: 104, resizeMode: 'contain' }}
                />
              </View>
              <Title>Hi, I&apos;m Ellie 👋</Title>
              <SubText>A budget app you might actually keep.</SubText>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
                {[
                  { num: '🍩', label: 'One ring, one number' },
                  { num: '🌿', label: 'Never a telling-off' },
                ].map((s) => (
                  <Glass
                    key={s.label}
                    radius={20}
                    style={{ flex: 1, padding: 14, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 19 }}>{s.num}</Text>
                    <Text
                      style={{
                        fontFamily: font.regular,
                        fontSize: 11.5,
                        color: t.sub,
                        marginTop: 2,
                        textAlign: 'center',
                      }}
                    >
                      {s.label}
                    </Text>
                  </Glass>
                ))}
              </View>
            </Centre>
          ) : null}

          {kind === 'name' ? (
            <Centre>
              <Title>What should I call you? 😊</Title>
              <SubText>Just a first name is plenty.</SubText>
              <Field
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => name.trim() && go(i + 1)}
                height={60}
                radius={20}
                align="center"
                fontSize={22}
                weight="semibold"
                accentBorder
                containerStyle={{ marginTop: 26, width: '100%' }}
              />
            </Centre>
          ) : null}

          {kind === 'age' ? (
            <Centre>
              <Title>How old are you? 🎂</Title>
              <SubText>It helps me pitch the targets sensibly.</SubText>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 26,
                  marginTop: 26,
                }}
              >
                <StepDisc
                  label="−"
                  onPress={() => setAge((a) => Math.max(14, a - 1))}
                />
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      fontFamily: font.semibold,
                      fontSize: 52,
                      lineHeight: 56,
                      letterSpacing: -2,
                      color: t.ink,
                    }}
                  >
                    {age}
                  </Text>
                  <Text
                    style={{
                      fontFamily: font.regular,
                      fontSize: 13,
                      color: t.sub,
                    }}
                  >
                    years
                  </Text>
                </View>
                <StepDisc
                  label="+"
                  onPress={() => setAge((a) => Math.min(90, a + 1))}
                />
              </View>
            </Centre>
          ) : null}

          {kind === 'quiz' ? (
            <View style={{ gap: 0 }}>
              <Title style={{ textAlign: 'center' }}>
                A couple of questions 💬
              </Title>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  justifyContent: 'center',
                  marginTop: 16,
                  marginBottom: 22,
                }}
              >
                {QUIZ.map((_, qi) => (
                  <View
                    key={qi}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor:
                        qi < quizIdx
                          ? t.coral
                          : qi === quizIdx
                            ? t.coral + '2E'
                            : t.track,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 12.5,
                        color:
                          qi < quizIdx ? '#fff' : qi === quizIdx ? t.coral : t.lbl,
                      }}
                    >
                      {qi + 1}
                    </Text>
                  </View>
                ))}
              </View>
              <Text
                style={{
                  fontFamily: font.semibold,
                  fontSize: 17,
                  lineHeight: 23,
                  letterSpacing: -0.26,
                  color: t.ink,
                  textAlign: 'center',
                }}
              >
                {QUIZ[quizIdx].q}
              </Text>
              <View style={{ gap: 10, marginTop: 18 }}>
                {QUIZ[quizIdx].opts.map((opt, oi) => (
                  <Press
                    key={opt}
                    scale={0.98}
                    onPress={() => answer(oi)}
                  >
                    <Glass
                      radius={18}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 15,
                        paddingHorizontal: 16,
                      }}
                    >
                      <View
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 999,
                          backgroundColor: t.hue[QUIZ[quizIdx].hues[oi]],
                        }}
                      />
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: font.medium,
                          fontSize: 15,
                          color: t.ink,
                        }}
                      >
                        {opt}
                      </Text>
                    </Glass>
                  </Press>
                ))}
              </View>
            </View>
          ) : null}

          {kind === 'analyzing' ? (
            <Centre>
              <Analysing />
              <Title>Ellie&apos;s working it out 🧠</Title>
              <SubText>
                {name.trim()
                  ? `Reading ${name.trim()}'s answers and shaping the first cycle.`
                  : 'Reading your answers and shaping the first cycle.'}
              </SubText>
              <View style={{ gap: 12, marginTop: 26, width: '100%' }}>
                {ONB_CHECKS(
                  name.trim() ? `${name.trim()}'s` : 'your',
                ).map((text, ci) => {
                  const done = ci < checkStep;
                  const active = ci === checkStep;
                  return (
                    <View
                      key={text}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 11,
                      }}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: done
                            ? t.sage
                            : active
                              ? t.sage + '26'
                              : t.track,
                          // box-shadow: 0 0 0 3px sage22 on the active step
                          ...(active
                            ? {
                                borderWidth: 3,
                                borderColor: t.sage + '22',
                              }
                            : null),
                        }}
                      >
                        {done ? (
                          <Icon
                            name="check"
                            size={14}
                            strokeWidth={2.6}
                            color="#fff"
                          />
                        ) : null}
                      </View>
                      <Text
                        style={{
                          fontFamily: done || active ? font.semibold : font.medium,
                          fontSize: 15,
                          color: done ? t.ink : active ? t.sub : t.lbl,
                        }}
                      >
                        {text}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Centre>
          ) : null}

          {kind === 'standing' || kind === 'standing2' ? (
            <Centre>
              <Image
                source={MASCOT.peeking}
                style={{
                  height: 96,
                  width: 96,
                  resizeMode: 'contain',
                  marginBottom: 16,
                  opacity: t.mascotOpacity,
                }}
              />
              <Title>
                {kind === 'standing2'
                  ? 'And the good news 🌤'
                  : `Here's where ${who} stand${name.trim() ? 's' : ''} 📊`}
              </Title>
              <SubText>
                {kind === 'standing2'
                  ? `People who log for a month keep far more. ${
                      name.trim() ? `${name.trim()}, that` : 'That'
                    } is a habit, not a talent.`
                  : `At ${age}, people who feel ${feelLine} about money keep about 20% less. That is a starting line, not a verdict.`}
              </SubText>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 34,
                  marginTop: 30,
                }}
              >
                {[
                  {
                    label: 'You',
                    pct: kind === 'standing2' ? 86 : 30,
                    hue: kind === 'standing2' ? t.sage : t.ochre,
                  },
                  { label: 'Average', pct: 50, hue: t.inert },
                ].map((b) => (
                  <View key={b.label} style={{ alignItems: 'center', gap: 9 }}>
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 19,
                        color: t.ink,
                      }}
                    >
                      {b.pct}%
                    </Text>
                    <View
                      style={{
                        width: 80,
                        height: Math.round(b.pct * 1.5),
                        borderRadius: 18,
                        backgroundColor: b.hue,
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 13.5,
                        color: t.sub,
                      }}
                    >
                      {b.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Centre>
          ) : null}

          {kind === 'habit' ? (
            <View>
              <Title style={{ textAlign: 'center' }}>
                {name.trim()
                  ? `${name.trim()}, give it thirty days 📅`
                  : 'Give it thirty days 📅'}
              </Title>
              <SubText style={{ textAlign: 'center' }}>
                Built around {painLine} — the thing you told me goes wrong.
              </SubText>
              <View style={{ gap: 10, marginTop: 20 }}>
                {ONB_WEEKS.map((w) => (
                  <Glass
                    key={w.name}
                    radius={20}
                    style={{
                      padding: 14,
                      borderLeftWidth: 3,
                      borderLeftColor: t.hue[w.hue],
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 15,
                        color: t.ink,
                      }}
                    >
                      {w.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: font.regular,
                        fontSize: 12.5,
                        color: t.sub,
                        marginTop: 2,
                        marginBottom: 9,
                      }}
                    >
                      {w.sub}
                    </Text>
                    <View
                      style={{
                        height: 6,
                        borderRadius: 999,
                        backgroundColor: t.track,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          width: `${w.w}%`,
                          height: '100%',
                          borderRadius: 999,
                          backgroundColor: t.hue[w.hue],
                        }}
                      />
                    </View>
                  </Glass>
                ))}
              </View>
              <Glass
                radius={20}
                style={{ flexDirection: 'row', padding: 14, marginTop: 14 }}
              >
                {ONB_HABIT_STATS.map((s) => (
                  <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 17,
                        color: t.ink,
                      }}
                    >
                      {s.num}
                    </Text>
                    <Text
                      style={{
                        fontFamily: font.regular,
                        fontSize: 11,
                        color: t.sub,
                        marginTop: 2,
                        textAlign: 'center',
                      }}
                    >
                      {s.label}
                    </Text>
                  </View>
                ))}
              </Glass>
            </View>
          ) : null}

          {kind === 'currency' ? (
            <Centre>
              <Title>What money do you count in? 💱</Title>
              <SubText>You can change this later.</SubText>
              <View style={{ marginTop: 26, width: '100%' }}>
                <Grid
                  items={[...ONB_CURRENCIES]}
                  columns={4}
                  renderItem={(code) => {
                  const on = currency === code;
                  return (
                    <Press
                      key={code}
                      scale={0.94}
                      haptic="selection"
                      onPress={() => setCurrency(code)}
                      style={{
                        height: 48,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: on ? t.coral : t.glass,
                        borderWidth: on ? 1.5 : t.lipWidth,
                        borderColor: on ? t.coral : t.lipColor,
                        ...shadowOf(t),
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: font.semibold,
                          fontSize: 13.5,
                          letterSpacing: 0.54,
                          color: on ? '#fff' : t.ink,
                        }}
                      >
                        {code}
                      </Text>
                    </Press>
                  );
                  }}
                />
              </View>
            </Centre>
          ) : null}

          {kind === 'cadence' ? (
            <Centre>
              <Title>When does your cycle reset? 🗓</Title>
              <SubText>Most people follow their pay date.</SubText>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 9,
                  marginTop: 22,
                  width: '100%',
                }}
              >
                {CADENCES.map((c) => {
                  const on = cadence === c;
                  return (
                    <Press
                      key={c}
                      scale={0.96}
                      haptic="selection"
                      onPress={() => setCadence(c)}
                      style={{
                        flex: 1,
                        height: 48,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: on ? t.coral : t.glass,
                        borderWidth: on ? 1.5 : t.lipWidth,
                        borderColor: on ? t.coral : t.lipColor,
                        ...shadowOf(t),
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: font.semibold,
                          fontSize: 14.5,
                          color: on ? '#fff' : t.ink,
                        }}
                      >
                        {c}
                      </Text>
                    </Press>
                  );
                })}
              </View>

              {cadence === 'Monthly' ? (
                <Glass
                  radius={20}
                  style={{ padding: 14, marginTop: 16, width: '100%' }}
                >
                  <Text
                    style={{
                      fontFamily: font.semibold,
                      fontSize: 12,
                      letterSpacing: 0.72,
                      textTransform: 'uppercase',
                      color: t.lbl,
                      marginBottom: 10,
                    }}
                  >
                    {cycleDayLabel(cycleDay)}
                  </Text>
                  <Grid
                    items={Array.from({ length: 31 }, (_, k) => k + 1)}
                    columns={7}
                    gap={4}
                    renderItem={(day) => {
                      const on = cycleDay === day;
                      return (
                        <Pressable
                          key={day}
                          onPress={() => setCycleDay(day)}
                          style={{
                            height: 34,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: on ? t.coral : t.soft,
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
                        </Pressable>
                      );
                    }}
                  />
                </Glass>
              ) : null}

              {cadence === 'Weekly' ? (
                <Glass
                  radius={20}
                  style={{ padding: 14, marginTop: 16, width: '100%' }}
                >
                  <Text
                    style={{
                      fontFamily: font.semibold,
                      fontSize: 12,
                      letterSpacing: 0.72,
                      textTransform: 'uppercase',
                      color: t.lbl,
                      marginBottom: 10,
                    }}
                  >
                    Week starts on
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    {WEEK_DAYS.map((w) => {
                      const on = weekStart === w;
                      return (
                        <Pressable
                          key={w}
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
                        </Pressable>
                      );
                    })}
                  </View>
                </Glass>
              ) : null}
            </Centre>
          ) : null}

          {kind === 'income' ? (
            <Centre>
              <Title>What comes in each month? 💰</Title>
              <SubText>Roughly is fine — you can change it later.</SubText>
              <Text
                style={{
                  fontFamily: font.semibold,
                  fontSize: 40,
                  lineHeight: 44,
                  letterSpacing: -1.4,
                  color: t.ink,
                  marginTop: 22,
                }}
              >
                <Text style={{ fontSize: 18, opacity: 0.45 }}>{sym}</Text>
                {money(income)}
              </Text>
              <View style={{ marginTop: 20, width: '100%' }}>
                <Keypad
                  glass={false}
                  dimModifiers={false}
                  onPress={(k) =>
                    setIncome((v) =>
                      parseInt(pressDigits(String(v || ''), k) || '0', 10),
                    )
                  }
                />
              </View>
            </Centre>
          ) : null}

          {kind === 'categories' ? (
            <Centre>
              <Title>What do you spend on? 🧺</Title>
              <SubText>
                {cats.length
                  ? `${cats.length} picked — Ellie will pre-fill a cap for each`
                  : 'Pick at least one to carry on'}
              </SubText>
              <View style={{ marginTop: 24, width: '100%' }}>
                <Grid
                  items={[...CATEGORIES]}
                  columns={4}
                  gap={12}
                  renderItem={(c) => {
                  const on = cats.includes(c);
                  return (
                    <Press
                      key={c}
                      scale={0.92}
                      haptic="selection"
                      onPress={() =>
                        setCats((list) =>
                          list.includes(c)
                            ? list.filter((x) => x !== c)
                            : [...list, c],
                        )
                      }
                      style={{ alignItems: 'center', gap: 6 }}
                    >
                      <CatTile cat={c} size={62} selected={on} iconSize={22} />
                      <Text
                        style={{
                          fontFamily: on ? font.semibold : font.medium,
                          fontSize: 11,
                          color: on ? t.ink : t.sub,
                        }}
                      >
                        {c}
                      </Text>
                    </Press>
                  );
                  }}
                />
              </View>
            </Centre>
          ) : null}

          {kind === 'target' ? (
            <Centre>
              <Title>How much would you like to keep each month? 🐖</Title>
              <SubText>
                You are saving towards {wantLine}. Pick a number you could
                actually keep.
              </SubText>
              <View style={{ marginTop: 24, width: '100%' }}>
                <Grid
                  items={[...KEEP_TARGETS]}
                  columns={3}
                  renderItem={(v) => {
                  const on = keepTarget === v;
                  return (
                    <Press
                      key={String(v)}
                      scale={0.96}
                      haptic="selection"
                      onPress={() => setKeepTarget(v)}
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 8,
                        borderRadius: 18,
                        alignItems: 'center',
                        backgroundColor: on ? t.coral : t.glass,
                        borderWidth: on ? 1.5 : t.lipWidth,
                        borderColor: on ? t.coral : t.lipColor,
                        ...shadowOf(t),
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: font.semibold,
                          fontSize: 15,
                          letterSpacing: -0.3,
                          color: on ? '#fff' : t.ink,
                        }}
                      >
                        {typeof v === 'number' ? `${sym}${money(v)}` : 'Set'}
                      </Text>
                      <Text
                        style={{
                          fontFamily: font.regular,
                          fontSize: 11,
                          marginTop: 2,
                          color: on ? 'rgba(255,255,255,0.8)' : t.sub,
                        }}
                      >
                        {typeof v === 'number' ? 'a month' : 'your own'}
                      </Text>
                    </Press>
                  );
                  }}
                />
              </View>
            </Centre>
          ) : null}

          {kind === 'notify' ? (
            <Centre>
              <View
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: 999,
                  backgroundColor: t.coral + '1F',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <Text style={{ fontSize: 32 }}>🔔</Text>
              </View>
              <Title>
                {name.trim()
                  ? `Can I nudge you, ${name.trim()}? 🔔`
                  : 'Can Ellie nudge you? 🔔'}
              </Title>
              <SubText>Quiet reminders, never a telling-off.</SubText>
              <View style={{ gap: 10, marginTop: 22, width: '100%' }}>
                {ONB_NUDGES.map((n) => (
                  <Press
                    key={n.key}
                    scale={0.98}
                    onPress={() =>
                      setNudges((v) => ({ ...v, [n.key]: !v[n.key] }))
                    }
                  >
                    <Glass
                      radius={18}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                        padding: 14,
                        paddingHorizontal: 15,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: font.semibold,
                            fontSize: 14.5,
                            color: t.ink,
                          }}
                        >
                          {n.name}
                        </Text>
                        <Text
                          style={{
                            fontFamily: font.regular,
                            fontSize: 12,
                            color: t.sub,
                            marginTop: 2,
                          }}
                        >
                          {n.note}
                        </Text>
                      </View>
                      <Toggle
                        on={nudges[n.key]}
                        onPress={() =>
                          setNudges((v) => ({ ...v, [n.key]: !v[n.key] }))
                        }
                      />
                    </Glass>
                  </Press>
                ))}
              </View>
            </Centre>
          ) : null}

          {kind === 'nudgeLevel' ? (
            <Centre>
              <Title>How often should I speak up? 🔔</Title>
              <SubText>
                {nudges.daily
                  ? 'Pick the rhythm that suits you. You can change it in Settings.'
                  : 'Daily check-ins are off, so this only applies if you turn them back on.'}
              </SubText>
              <View style={{ gap: 10, marginTop: 22, width: '100%' }}>
                {NUDGE_LEVELS.map((n) => {
                  const on = nudgeLevel === n.level;
                  return (
                    <Press
                      key={n.level}
                      scale={0.98}
                      haptic="selection"
                      onPress={() => setNudgeLevel(n.level)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      style={{ width: '100%' }}
                    >
                      <Glass
                        radius={18}
                        style={{
                          padding: 15,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 14,
                          borderWidth: on ? 1.5 : t.lipWidth,
                          borderColor: on ? t.accent : t.lipColor,
                        }}
                      >
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: on ? t.accent : t.accent + '1F',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: font.semibold,
                              fontSize: 15,
                              color: on ? '#fff' : t.accent,
                            }}
                          >
                            {n.level}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontFamily: font.semibold,
                              fontSize: 15,
                              color: t.ink,
                            }}
                          >
                            {n.name}
                          </Text>
                          <Text
                            style={{
                              fontFamily: font.regular,
                              fontSize: 12.5,
                              color: t.sub,
                              marginTop: 2,
                            }}
                          >
                            {n.note}
                          </Text>
                        </View>
                      </Glass>
                    </Press>
                  );
                })}
              </View>
            </Centre>
          ) : null}

          {kind === 'theme' ? (
            <Centre>
              <Title>Light or dim? 🌗</Title>
              <SubText>
                Ellie in the dark is a warm room, not a black screen.
              </SubText>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 14,
                  marginTop: 26,
                  width: '100%',
                }}
              >
                {(
                  [
                    { label: 'Light', key: 'light' as ThemeKey },
                    { label: 'Dim', key: 'dark' as ThemeKey },
                  ]
                ).map((th) => {
                  const on = themeKey === th.key;
                  const isDark = th.key === 'dark';
                  return (
                    <Press
                      key={th.key}
                      scale={0.97}
                      onPress={() => {
                        setThemeKey(th.key);
                        setTheme(th.key);
                      }}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 22,
                        borderWidth: 1.5,
                        borderColor: on ? t.coral : t.hair,
                        backgroundColor: on ? t.coral + '1F' : 'transparent',
                      }}
                    >
                      <View
                        style={{
                          height: 118,
                          borderRadius: 16,
                          backgroundColor: isDark ? '#1A1613' : '#F7F5F2',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 7,
                        }}
                      >
                        <View
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 999,
                            borderWidth: 7,
                            borderColor: ACCENTS[accentKey][isDark ? 'dark' : 'light'],
                            borderRightColor: isDark
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(28,27,26,0.1)',
                          }}
                        />
                        <View
                          style={{
                            width: 56,
                            height: 6,
                            borderRadius: 999,
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.16)'
                              : 'rgba(28,27,26,0.13)',
                          }}
                        />
                        <View
                          style={{
                            width: 36,
                            height: 6,
                            borderRadius: 999,
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.09)'
                              : 'rgba(28,27,26,0.07)',
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          textAlign: 'center',
                          marginTop: 10,
                          fontFamily: font.semibold,
                          fontSize: 14,
                          color: on ? t.coral : t.sub,
                        }}
                      >
                        {th.label}
                      </Text>
                    </Press>
                  );
                })}
              </View>

              <View style={{ width: '100%', marginTop: 26, gap: 12 }}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontFamily: font.semibold,
                    fontSize: 13,
                    letterSpacing: 1.1,
                    textTransform: 'uppercase',
                    color: t.lbl,
                  }}
                >
                  And a colour
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {ACCENT_KEYS.map((key) => {
                    const on = accentKey === key;
                    const swatch =
                      ACCENTS[key][themeKey === 'dark' ? 'dark' : 'light'];
                    return (
                      <Press
                        key={key}
                        scale={0.92}
                        onPress={() => {
                          setAccentKey(key);
                          setAccent(key);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${ACCENTS[key].name} theme`}
                        accessibilityState={{ selected: on }}
                        style={{ flex: 1, alignItems: 'center', gap: 6 }}
                      >
                        <View
                          style={{
                            width: '100%',
                            height: 46,
                            borderRadius: 15,
                            backgroundColor: swatch,
                            borderWidth: on ? 2.5 : 0,
                            borderColor: t.ink,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {on ? (
                            <Icon
                              name="check"
                              size={19}
                              color="#fff"
                              strokeWidth={2.6}
                            />
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
            </Centre>
          ) : null}

          {kind === 'contract' ? (
            <View>
              <Title style={{ textAlign: 'center' }}>
                {name.trim()
                  ? `${name.trim()}, here's the deal 🤝`
                  : "Here's the deal 🤝"}
              </Title>
              <View style={{ gap: 9, marginTop: 20 }}>
                {ONB_PROMISES.map((p) => (
                  <View
                    key={p.text}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 11,
                      padding: 13,
                      paddingHorizontal: 15,
                      borderRadius: 16,
                      backgroundColor: t.hue[p.hue] + '1F',
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: t.hue[p.hue],
                      }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: font.medium,
                        fontSize: 13.5,
                        lineHeight: 18,
                        color: t.ink,
                      }}
                    >
                      {p.text}
                    </Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPressIn={startHold}
                onPressOut={endHold}
                style={{
                  alignSelf: 'center',
                  marginTop: 22,
                  width: 104,
                  height: 104,
                  borderRadius: 999,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: holding ? t.coral : t.coral + '16',
                  borderWidth: holding ? 0 : 1.5,
                  borderColor: t.coral + '44',
                }}
              >
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.28)',
                    // Follows the disc: older Android will not clip it to the
                    // circle, so it rounds its own lower corners.
                    borderBottomLeftRadius: 999,
                    borderBottomRightRadius: 999,
                    height: holdFill.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 104],
                    }),
                  }}
                />
                <Icon
                  name="fingerprint"
                  size={46}
                  height={52}
                  strokeWidth={1.7}
                  color={holding ? '#fff' : t.coral}
                />
              </Pressable>
              <Text
                style={{
                  textAlign: 'center',
                  marginTop: 14,
                  fontFamily: font.semibold,
                  fontSize: 13.5,
                  color: t.coral,
                }}
              >
                {holding
                  ? 'Keep holding… 🤝'
                  : 'Press and hold your thumb to agree 👍'}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </Animated.View>

      <View
        style={{
          paddingHorizontal: 22,
          paddingBottom: Math.max(insets.bottom, 12) + 12,
          gap: 12,
        }}
      >
        {nextShown ? (
          <PrimaryButton
            fontSize={16.5}
            label={ONB_CTA[kind] ?? 'Next'}
            onPress={() => go(i + 1)}
          />
        ) : null}
        {i > 0 && kind !== 'analyzing' ? (
          <Pressable
            onPress={() => {
              if (kind === 'quiz' && quizIdx > 0) return setQuizIdx(quizIdx - 1);
              go(i - 1);
            }}
            hitSlop={8}
          >
            <Text
              style={{
                textAlign: 'center',
                fontFamily: font.regular,
                fontSize: 14,
                color: t.lbl,
              }}
            >
              Back
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Centre({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', width: '100%' }}>{children}</View>
  );
}

function Title({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  const { t } = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: font.semibold,
          fontSize: 26,
          lineHeight: 32,
          letterSpacing: -0.78,
          color: t.ink,
          maxWidth: 320,
          textAlign: 'center',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

function SubText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  const { t } = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: font.regular,
          fontSize: 14.5,
          lineHeight: 20,
          color: t.sub,
          marginTop: 8,
          maxWidth: 300,
          textAlign: 'center',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

function StepDisc({ label, onPress }: { label: string; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Press
      scale={0.9}
      haptic="selection"
      onPress={onPress}
      style={{
        width: 56,
        height: 56,
        borderRadius: 999,
        backgroundColor: t.coral,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: t.coral,
        shadowOpacity: 0.24,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <Text style={{ fontFamily: font.medium, fontSize: 26, color: '#fff' }}>
        {label}
      </Text>
    </Press>
  );
}

/** The spinning ring, orbiting dots and bobbing mascot on the analysing step. */
function Analysing() {
  const { t } = useTheme();
  const spin = useRef(new Animated.Value(0)).current;
  const spinBack = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.timing(spinBack, {
          toValue: 1,
          duration: 5000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, {
            toValue: 1,
            duration: 950,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bob, {
            toValue: 0,
            duration: 950,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.timing(orbit, {
          toValue: 1,
          duration: 3200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [spin, spinBack, bob, orbit]);

  const orbitCats: CategoryKey[] = [
    'Food',
    'Transport',
    'Home',
    'Health',
    'Fun',
  ];

  return (
    <View
      style={{
        width: 172,
        height: 172,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 22,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: 172,
          height: 172,
          borderRadius: 999,
          borderWidth: 5,
          borderColor: t.sage + '26',
          borderTopColor: t.sage,
          borderRightColor: t.sage + '99',
          transform: [
            {
              rotate: spin.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: 999,
          borderWidth: 3,
          borderStyle: 'dashed',
          borderColor: t.sage + '44',
          transform: [
            {
              rotate: spinBack.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '-360deg'],
              }),
            },
          ],
        }}
      />
      {/* onbFigurePulse: inset 26px of the 172px figure, i.e. 120x120 */}
      <View
        style={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: 999,
          backgroundColor: t.sage + '1C',
        }}
      />
      {orbitCats.map((c, oi) => (
        <Animated.View
          key={c}
          style={{
            position: 'absolute',
            width: 11,
            height: 11,
            borderRadius: 999,
            backgroundColor: t.hue[c],
            shadowColor: t.hue[c],
            shadowOpacity: 0.53,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 0 },
            elevation: 6,
            transform: [
              {
                rotate: orbit.interpolate({
                  inputRange: [0, 1],
                  outputRange: [`${oi * 72}deg`, `${oi * 72 + 360}deg`],
                }),
              },
              { translateX: 64 },
            ],
          }}
        />
      ))}
      <Animated.Image
        source={MASCOT.peeking}
        style={{
          height: 92,
          width: 92,
          resizeMode: 'contain',
          opacity: t.mascotOpacity,
          transform: [
            {
              translateY: bob.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -7],
              }),
            },
          ],
        }}
      />
    </View>
  );
}
