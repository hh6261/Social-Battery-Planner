import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { AppDialog } from './AppDialog';
import { AppText } from './AppText';

export interface SelectOption<V extends string> {
  value: V;
  label: string;
}

interface Props<V extends string> {
  /** Used as the picker title and accessibility label, e.g. "Frequency". */
  title: string;
  value: V;
  options: readonly SelectOption<V>[];
  onChange(value: V): void;
  disabled?: boolean;
}

/** Compact dropdown ("Every day ⌃⌄") that opens a list in the app's dialog shape. */
export function SelectField<V extends string>({ title, value, options, onChange, disabled }: Props<V>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? '';

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${current}`}
        accessibilityHint={t('common.opensList')}
        style={({ pressed }) => [styles.field, pressed && styles.pressed, disabled && styles.disabled]}
      >
        <AppText variant="label" style={styles.value} numberOfLines={1}>
          {current}
        </AppText>
        <MaterialCommunityIcons name="unfold-more-horizontal" size={18} color={theme.colors.ink} />
      </Pressable>

      <AppDialog
        visible={open}
        title={title}
        secondaryLabel={t('common.cancel')}
        onSecondary={() => setOpen(false)}
      >
        <View accessibilityRole="radiogroup">
          {options.map((option, i) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={({ pressed }) => [styles.option, i > 0 && styles.optionDivider, pressed && styles.pressed]}
              >
                <AppText variant="body" weight={selected ? '600' : '400'}>
                  {option.label}
                </AppText>
                {selected ? <Feather name="check" size={20} color={theme.colors.ink} /> : null}
              </Pressable>
            );
          })}
        </View>
      </AppDialog>
    </>
  );
}

const useStyles = makeStyles((t) => ({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 140,
    minHeight: 36,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radius.sm,
    backgroundColor: t.colors.surface,
    paddingStart: t.spacing.sm,
    paddingEnd: t.spacing.xs,
  },
  value: { flex: 1, marginEnd: t.spacing.xs },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  optionDivider: { borderTopWidth: 1, borderTopColor: t.colors.line },
}));
