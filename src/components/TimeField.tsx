import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeStyles, useTheme } from '../theme/ThemeProvider';

interface Props {
  value: string; // HH:MM
  onChange(value: string): void;
  accessibilityLabel: string;
  disabled?: boolean;
}

export function isValidTime(value: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return false;
  return Number(m[1]) < 24 && Number(m[2]) < 60;
}

/** Formats raw digits as HH:MM while typing. */
function formatDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/**
 * 24h time input (21:00). Commits on blur only when valid; otherwise it
 * snaps back to the last saved value.
 */
export function TimeField({ value, onChange, accessibilityLabel, disabled }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const [draft, setDraft] = useState(value);
  // When the saved value changes from outside, show it (state adjusted while rendering, no effect).
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    setDraft(value);
  }

  const commit = () => {
    // Accept "9:30" / "930" → 09:30
    let candidate = draft;
    const digits = draft.replace(/\D/g, '');
    if (digits.length === 3) candidate = `0${digits[0]}:${digits.slice(1)}`;
    if (isValidTime(candidate) && candidate !== value) onChange(candidate);
    else setDraft(isValidTime(candidate) ? candidate : value);
  };

  return (
    <TextInput
      value={draft}
      onChangeText={(text) => setDraft(formatDigits(text))}
      onBlur={commit}
      onSubmitEditing={commit}
      editable={!disabled}
      keyboardType="number-pad"
      returnKeyType="done"
      maxLength={5}
      placeholder={t('timeField.placeholder')}
      placeholderTextColor={theme.colors.subtle}
      accessibilityLabel={t('timeField.label', { label: accessibilityLabel })}
      style={[styles.input, { fontSize: theme.font(16) }, disabled && styles.disabled]}
    />
  );
}

const useStyles = makeStyles((t) => ({
  input: {
    width: 140,
    minHeight: 48,
    borderWidth: t.borderWidth,
    borderColor: t.colors.muted,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
    paddingHorizontal: t.spacing.md,
    color: t.colors.ink,
    fontWeight: '600',
    letterSpacing: 1,
  },
  disabled: { opacity: 0.4 },
}));
