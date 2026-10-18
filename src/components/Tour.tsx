import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { TOUR } from '@/lib/content';
import { useEllie } from '@/store/EllieStore';
import { useTheme } from '@/theme/ThemeContext';
import { measureTarget, type TargetRect } from './TourTargets';
import { Press, font } from './ui';

const CARD_GAP = 18;
const CARD_ESTIMATE = 196;

/** The six coach marks that run once, right after setup. */
export function Tour() {
  const { tourStep, nextTour, skipTour } = useEllie();
  const { t, dark } = useTheme();
  const [target, setTarget] = useState<TargetRect | null>(null);
  const stepTarget = tourStep == null ? null : TOUR[Math.min(tourStep, TOUR.length - 1)].target;

  // Measure the element this step points at. A second pass one beat later
  // catches anything still settling when the step first appears.
  useEffect(() => {
    if (!stepTarget) return;
    let alive = true;
    setTarget(null);
    const run = () => {
      measureTarget(stepTarget).then((r) => {
        if (alive && r) setTarget(r);
      });
    };
    run();
    const id = setTimeout(run, 140);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [stepTarget, tourStep]);

  // The overlay's own window offset, so measured targets can be placed inside
  // it regardless of status bar or window chrome.
  const ref = useRef<View>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const onLayout = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) =>
      setOrigin((o) =>
        o.x === x && o.y === y && o.width === width && o.height === height
          ? o
          : { x, y, width, height },
      ),
    );
  }, []);

  if (tourStep == null) return null;

  const step = TOUR[Math.min(tourStep, TOUR.length - 1)];
  const hue = t.hue[step.hue];
  const last = tourStep === TOUR.length - 1;

  const spot = target ? spotFor(target, origin, step) : null;
  // Below the target when it sits high on screen, above it when it sits low.
  const below = spot ? spot.cy < origin.height * 0.5 : true;
  const cardTop = spot
    ? below
      ? spot.cy + spot.r + CARD_GAP
      : Math.max(spot.cy - spot.r - CARD_GAP - CARD_ESTIMATE, 24)
    : Math.max(origin.height * 0.4, 24);

  return (
    <View
      ref={ref}
      onLayout={onLayout}
      {...(Platform.OS === 'web' ? null : { collapsable: false })}
      style={[StyleSheet.absoluteFill, { zIndex: 48 }]}
    >
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: `rgba(28,27,26,${dark ? 0.62 : 0.42})` },
        ]}
        onPress={nextTour}
      />

      {spot ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: spot.cx - spot.r,
            top: spot.cy - spot.r,
            width: spot.r * 2,
            height: spot.r * 2,
            borderRadius: 999,
            borderWidth: 3,
            borderColor: hue,
            backgroundColor: hue + '2E',
            shadowColor: hue,
            shadowOpacity: 0.55,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 0 },
            elevation: 14,
          }}
        />
      ) : null}

      <View
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: cardTop,
          padding: 22,
          paddingBottom: 18,
          borderRadius: 24,
          backgroundColor: dark ? '#241F1B' : '#fff',
          shadowColor: '#000',
          shadowOpacity: 0.24,
          shadowRadius: 44,
          shadowOffset: { width: 0, height: 18 },
          elevation: 20,
        }}
      >
        <View
          style={{
            position: 'absolute',
            right: 18,
            top: 16,
            height: 22,
            paddingHorizontal: 9,
            borderRadius: 999,
            backgroundColor: t.soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{ fontFamily: font.semibold, fontSize: 11.5, color: t.sub }}
          >
            {tourStep + 1}/{TOUR.length}
          </Text>
        </View>

        <Text
          style={{
            fontFamily: font.semibold,
            fontSize: 19,
            lineHeight: 25,
            letterSpacing: -0.38,
            color: t.ink,
            maxWidth: '82%',
          }}
        >
          {step.title}
        </Text>
        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 13.5,
            lineHeight: 19,
            color: t.sub,
            marginTop: 6,
          }}
        >
          {step.body}
        </Text>

        <View
          style={{
            height: 4,
            borderRadius: 999,
            backgroundColor: t.track,
            marginTop: 16,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.round(((tourStep + 1) / TOUR.length) * 100)}%`,
              height: '100%',
              borderRadius: 999,
              backgroundColor: hue,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
          }}
        >
          <Pressable onPress={skipTour} hitSlop={10}>
            <Text
              style={{ fontFamily: font.regular, fontSize: 14, color: t.lbl }}
            >
              Skip tour
            </Text>
          </Pressable>
          <Press
            scale={0.96}
            onPress={nextTour}
            style={{
              height: 44,
              paddingHorizontal: 24,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: hue,
            }}
          >
            <Text
              style={{ fontFamily: font.semibold, fontSize: 15, color: '#fff' }}
            >
              {last ? 'Got it' : 'Next'}
            </Text>
          </Press>
        </View>
      </View>
    </View>
  );
}

/** Circle that hugs a measured element, in overlay-local coordinates. */
function spotFor(
  target: TargetRect,
  origin: { x: number; y: number },
  step: (typeof TOUR)[number],
) {
  const pad = step.pad ?? 8;
  const cx = target.x - origin.x + target.width / 2;
  const top = target.y - origin.y;

  if (step.anchor === 'top') {
    // The untouched arc rides the ring's upper edge — sit on the stroke itself
    // rather than the middle of the donut.
    const r = Math.min(target.width, target.height) / 2;
    const band = Math.min(34, r * 0.62);
    return { cx, cy: top + band, r: band + pad };
  }

  const r = Math.max(target.width, target.height) / 2 + pad;
  return { cx, cy: top + target.height / 2, r };
}
