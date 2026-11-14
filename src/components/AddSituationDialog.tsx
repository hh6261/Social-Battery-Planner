import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { LEVEL_LABELS } from '../constants/situations';
import type { EnergyLevel, SituationKind } from '../services/types';
import { makeStyles } from '../theme/ThemeProvider';
import { AppDialog } from './AppDialog';
import { AppText } from './AppText';
import { Chip, ChipWrap } from './Chip';
import { TextField } from './TextField';

interface Props {
  visible: boolean;
  kind: SituationKind;
  /** When set, the level picker is hidden (personalization adds per group). */
  fixedLevel?: EnergyLevel;
  /** Labels already in the list, to block duplicates (case-insensitive). */
  existing: string[];
  onSubmit(label: string, level: EnergyLevel): Promise<void> | void;
  onClose(): void;
}

const MAX_LENGTH = 40;
const LEVELS: EnergyLevel[] = ['low', 'moderate', 'strong'];

export function AddSituationDialog({ visible, kind, fixedLevel, existing, onSubmit, onClose }: Props) {
  const styles = useStyles();
  const [label, setLabel] = useState('');
  const [level, setLevel] = useState<EnergyLevel>(fixedLevel ?? 'moderate');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setLabel('');
      setLevel(fixedLevel ?? 'moderate');
      setError(null);
      setSaving(false);
    }
  }, [visible, fixedLevel]);

  const submit = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setError('Please describe the situation.');
      return;
    }
    if (existing.some((e) => e.toLowerCase() === trimmed.toLowerCase())) {
      setError('That one is already on your list.');
      return;
    }
    try {
      setSaving(true);
      await onSubmit(trimmed, level);
      onClose();
    } catch {
      setError('We couldn’t save that. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isDrain = kind === 'drain';
  return (
    <AppDialog
      visible={visible}
      title={isDrain ? 'Add a stressor' : 'Add a relaxer'}
      message={
        isDrain
          ? 'What’s a situation that tends to use your social energy?'
          : 'What’s something that helps you feel recharged?'
      }
      primaryLabel="Add"
      onPrimary={submit}
      primaryLoading={saving}
      secondaryLabel="Cancel"
      onSecondary={onClose}
    >
      <TextField
        value={label}
        onChangeText={(t) => {
          setLabel(t);
          if (error) setError(null);
        }}
        placeholder={isDrain ? 'e.g. Video calls' : 'e.g. Cooking'}
        accessibilityLabel="Situation"
        maxLength={MAX_LENGTH}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={submit}
        error={error}
        containerStyle={styles.field}
      />
      {!fixedLevel && (
        <View style={styles.levels}>
          <AppText variant="label" style={styles.levelsLabel}>
            {isDrain ? 'How much energy does it use?' : 'How restoring is it?'}
          </AppText>
          <ChipWrap>
            {LEVELS.map((l) => (
              <Chip key={l} size="sm" label={LEVEL_LABELS[kind][l]} selected={level === l} onPress={() => setLevel(l)} />
            ))}
          </ChipWrap>
        </View>
      )}
    </AppDialog>
  );
}

const useStyles = makeStyles((t) => ({
  field: { marginTop: t.spacing.sm },
  levels: { marginTop: t.spacing.md },
  levelsLabel: { marginBottom: t.spacing.xs },
}));
