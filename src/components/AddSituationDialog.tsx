import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { levelLabel } from '../constants/situations';
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
  const { t } = useTranslation();
  const styles = useStyles();
  const [label, setLabel] = useState('');
  const [level, setLevel] = useState<EnergyLevel>(fixedLevel ?? 'moderate');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Start from an empty form every time the dialog opens (state adjusted while rendering, no effect).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setLabel('');
      setLevel(fixedLevel ?? 'moderate');
      setError(null);
      setSaving(false);
    }
  }

  const submit = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setError(t('situation.errorEmpty'));
      return;
    }
    if (existing.some((e) => e.toLowerCase() === trimmed.toLowerCase())) {
      setError(t('situation.errorDuplicate'));
      return;
    }
    try {
      setSaving(true);
      await onSubmit(trimmed, level);
      onClose();
    } catch {
      setError(t('situation.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const isDrain = kind === 'drain';
  return (
    <AppDialog
      visible={visible}
      title={t(isDrain ? 'situation.addStressor' : 'situation.addRelaxer')}
      message={t(isDrain ? 'situation.stressorMessage' : 'situation.relaxerMessage')}
      primaryLabel={t('common.add')}
      onPrimary={submit}
      primaryLoading={saving}
      secondaryLabel={t('common.cancel')}
      onSecondary={onClose}
    >
      <TextField
        value={label}
        onChangeText={(text) => {
          setLabel(text);
          if (error) setError(null);
        }}
        placeholder={t(isDrain ? 'situation.stressorPlaceholder' : 'situation.relaxerPlaceholder')}
        accessibilityLabel={t('situation.fieldLabel')}
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
            {t(isDrain ? 'situation.stressorLevel' : 'situation.relaxerLevel')}
          </AppText>
          <ChipWrap>
            {LEVELS.map((l) => (
              <Chip key={l} size="sm" label={levelLabel(kind, l)} selected={level === l} onPress={() => setLevel(l)} />
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
