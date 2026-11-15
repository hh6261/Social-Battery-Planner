import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Button, ButtonVariant } from './Button';
import { HardShadow } from './HardShadow';

export interface AppDialogProps {
  visible: boolean;
  title: string;
  message?: React.ReactNode;
  /** Extra content under the message (inputs, option lists). */
  children?: React.ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** 'secondary' (grey, log-out dialog) or 'outline' (white, delete dialog). */
  secondaryVariant?: ButtonVariant;
  /** Back button / tapping outside. Defaults to onSecondary. */
  onRequestClose?: () => void;
}

/**
 * The one dialog shape used across the app (per the wireframe notes):
 * big bold title, a rule, body copy, then a dark primary + light secondary button.
 */
export function AppDialog({
  visible,
  title,
  message,
  children,
  primaryLabel,
  onPrimary,
  primaryLoading,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  secondaryVariant = 'secondary',
  onRequestClose,
}: AppDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const close = onRequestClose ?? onSecondary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!primaryLoading) close?.();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => {
            if (!primaryLoading) close?.();
          }}
          accessibilityLabel={t('common.closeDialog')}
          accessibilityRole="button"
        >
          {/* Inner Pressable swallows taps so they don't close the dialog. */}
          <Pressable style={styles.center} onPress={() => {}} accessible={false}>
            <HardShadow radius={theme.radius.xxl}>
              <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
                <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
                  <AppText variant="title" accessibilityRole="header">
                    {title}
                  </AppText>
                  <View style={styles.rule} />
                  {typeof message === 'string' ? (
                    <AppText variant="body" color="ink" style={styles.message}>
                      {message}
                    </AppText>
                  ) : (
                    message
                  )}
                  {children}
                  {(primaryLabel || secondaryLabel) && (
                    <View style={styles.actions}>
                      {primaryLabel ? (
                        <Button
                          label={primaryLabel}
                          onPress={onPrimary}
                          loading={primaryLoading}
                          disabled={primaryDisabled}
                          style={styles.action}
                        />
                      ) : null}
                      {secondaryLabel ? (
                        <Button
                          label={secondaryLabel}
                          onPress={onSecondary}
                          variant={secondaryVariant}
                          disabled={primaryLoading}
                          style={styles.action}
                        />
                      ) : null}
                    </View>
                  )}
                </ScrollView>
              </View>
            </HardShadow>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: t.colors.overlay,
    justifyContent: 'center',
    padding: t.spacing.lg,
  },
  center: { width: '100%', maxWidth: 440, alignSelf: 'center', maxHeight: '90%' },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.xxl,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    padding: t.spacing.xl,
  },
  rule: {
    height: t.borderWidth,
    backgroundColor: t.colors.line,
    marginTop: t.spacing.md,
    marginBottom: t.spacing.lg,
  },
  message: { marginBottom: t.spacing.xs },
  actions: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.lg },
  action: { flex: 1 },
}));
