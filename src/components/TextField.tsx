import { Feather } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import { Pressable, StyleProp, TextInput, TextInputProps, View, ViewStyle, type TextInputInstance } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Small label above the input, e.g. "Day" / "Month" / "Year". */
  sublabel?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
  /** Shows an eye button that reveals the text. */
  password?: boolean;
}

export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { label, sublabel, error, containerStyle, password, onFocus, onBlur, ...inputProps },
  ref,
) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={containerStyle}>
      {label ? (
        <AppText variant="label" style={styles.label} nativeID={inputProps.nativeID ? `${inputProps.nativeID}-label` : undefined}>
          {label}
        </AppText>
      ) : null}
      {sublabel ? (
        <AppText variant="caption" color="muted" style={styles.sublabel}>
          {sublabel}
        </AppText>
      ) : null}
      <View
        style={[
          styles.box,
          focused && styles.boxFocused,
          !!error && styles.boxError,
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.subtle}
          accessibilityLabel={label ?? sublabel ?? inputProps.placeholder}
          {...inputProps}
          secureTextEntry={password ? !revealed : inputProps.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { fontSize: theme.font(16) }]}
        />
        {password ? (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={revealed ? t('common.hidePassword') : t('common.showPassword')}
            style={styles.eye}
          >
            <Feather name={revealed ? 'eye-off' : 'eye'} size={18} color={theme.colors.detail} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color="error" style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  label: { marginBottom: t.spacing.xs },
  sublabel: { marginBottom: t.spacing.xxs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: t.radius.md,
    borderWidth: t.borderWidth,
    borderColor: t.colors.muted,
    backgroundColor: t.colors.surface,
    paddingHorizontal: t.spacing.md,
  },
  boxFocused: { borderColor: t.colors.ink },
  boxError: { borderColor: t.colors.error },
  input: {
    flex: 1,
    color: t.colors.ink,
    paddingVertical: t.spacing.sm,
  },
  eye: { paddingStart: t.spacing.xs },
  error: { marginTop: t.spacing.xxs },
}));
