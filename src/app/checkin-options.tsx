import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useDialog } from '@/components/DialogProvider';
import { HardShadow } from '@/components/HardShadow';
import { deleteCheckIn, getCheckIn } from '@/db/checkIns';
import type { CheckIn } from '@/db/types';
import BatteryIcon from '@/features/checkin/BatteryIcon';
import { formatDate, formatTime } from '@/i18n/format';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

type Status = 'loading' | 'ready' | 'missing';

/**
 * Screen 17, the edit/delete dialog. Open it from the daily log (16) or the Daily Timeline (20):
 *   router.push({ pathname: '/checkin-options', params: { id: String(checkIn.id) } })
 */
export default function CheckInOptions() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const { showDialog, showMessage } = useDialog();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Number(params.id);

  const [status, setStatus] = useState<Status>('loading');
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = Number.isInteger(id) ? getCheckIn(id) : Promise.resolve(null);
    load
      .then((c) => {
        if (cancelled) return;
        setCheckIn(c);
        setStatus(c ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setStatus('missing');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const close = () => router.back();

  // Editing reuses the confirmation screen (14); it loads the check-in itself from the id.
  const edit = () => router.replace({ pathname: '/checkin/confirm', params: { editId: String(id) } });

  const remove = async () => {
    if (busy) return;
    const sure = await showDialog({
      title: t('checkin.options.confirmTitle'),
      message: t('checkin.options.confirmBody'),
      primaryLabel: t('checkin.options.delete'),
      secondaryLabel: t('checkin.options.cancel'),
      secondaryVariant: 'outline',
    });
    if (!sure) return;

    setBusy(true);
    try {
      await deleteCheckIn(id);
      router.back(); // the daily log reloads on focus, so the deleted check-in is gone
    } catch (e) {
      console.error('Deleting check-in failed', e);
      setBusy(false);
      void showMessage(t('checkin.options.errorTitle'), t('checkin.options.deleteError'));
    }
  };

  const when = checkIn ? new Date(checkIn.createdAtUtc) : null;

  return (
    <View style={styles.overlay}>
      {/* Tapping outside closes the dialog */}
      <Pressable
        style={styles.backdrop}
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel={t('checkin.options.cancel')}
      />
      <View style={styles.center}>
        <HardShadow radius={theme.radius.xxl}>
          <View style={styles.card} accessibilityViewIsModal>
            {status === 'loading' && <AppText accessibilityLiveRegion="polite">{t('app.loading')}</AppText>}

            {status === 'missing' && (
              <>
                <AppText variant="title" accessibilityRole="header">
                  {t('checkin.options.notFound')}
                </AppText>
                <View style={styles.actions}>
                  <Button label={t('checkin.options.close')} onPress={close} style={styles.action} />
                </View>
              </>
            )}

            {status === 'ready' && checkIn && when && (
              <>
                <AppText variant="title" accessibilityRole="header">
                  {t('checkin.options.heading')}
                </AppText>
                <View style={styles.rule} />

                <View style={styles.summary}>
                  <BatteryIcon level={checkIn.batteryLevel} size="small" />
                  <View style={styles.summaryText}>
                    <AppText variant="label">{`${formatDate(when)}, ${formatTime(when)}`}</AppText>
                    {checkIn.activity ? (
                      <AppText variant="bodySmall" color="muted" numberOfLines={2}>
                        {checkIn.activity}
                      </AppText>
                    ) : null}
                  </View>
                </View>

                <AppText variant="body">{t('checkin.options.warning')}</AppText>

                <View style={styles.actions}>
                  <Button
                    variant="secondary"
                    label={t('checkin.options.cancel')}
                    onPress={close}
                    disabled={busy}
                    style={styles.action}
                  />
                  <Button
                    variant="outline"
                    label={t('checkin.options.delete')}
                    onPress={remove}
                    loading={busy}
                    style={styles.action}
                  />
                </View>
                <Button label={t('checkin.options.edit')} onPress={edit} disabled={busy} style={styles.edit} />
              </>
            )}
          </View>
        </HardShadow>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  overlay: { flex: 1, justifyContent: 'center', padding: t.spacing.lg, backgroundColor: t.colors.overlay },
  backdrop: { ...({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const) },
  center: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.xxl,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    padding: t.spacing.xl,
    gap: t.spacing.md,
  },
  rule: { height: t.borderWidth, backgroundColor: t.colors.line },
  summary: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  summaryText: { flex: 1, gap: t.spacing.xxs },
  actions: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.xs },
  action: { flex: 1 },
  edit: { marginTop: t.spacing.xs },
}));
