import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { GOAL_IDEAS } from '@/lib/content';
import { useEllie } from '@/store/EllieStore';
import { useTheme } from '@/theme/ThemeContext';
import { Sheet } from './Sheet';
import { Chip, Field, H2, PrimaryButton, Sub, font } from './ui';

export function NewGoalSheet({
  open,
  onClose,
  onNameSet,
}: {
  open: boolean;
  onClose: () => void;
  /** Handing the name onward opens the amount sheet for the target. */
  onNameSet: (name: string) => void;
}) {
  const { t } = useTheme();
  const { flash } = useEllie();
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName('');
  }, [open]);

  const ready = name.trim().length > 0;

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ gap: 3 }}>
        <H2>What are you saving for?</H2>
        <Sub>Name it, then set the number.</Sub>
      </View>

      <Field
        value={name}
        onChangeText={setName}
        placeholder="A trip, a laptop, a rainy day…"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => ready && onNameSet(name.trim())}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {GOAL_IDEAS.map((idea) => (
          <Chip
            key={idea}
            label={idea}
            active={name === idea}
            onPress={() => setName(idea)}
            style={{ height: 36, paddingHorizontal: 14 }}
          />
        ))}
      </View>

      <PrimaryButton
        label={ready ? 'Set the target' : 'Name your goal'}
        disabled={!ready}
        onPress={() => {
          if (!ready) return flash('Name it first');
          onNameSet(name.trim());
        }}
      />
    </Sheet>
  );
}
