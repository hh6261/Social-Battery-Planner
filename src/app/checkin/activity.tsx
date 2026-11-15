import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Chip, ChipWrap } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { listPreviousActivities } from '@/db/checkIns';
import { getPreferences } from '@/db/preferences';
import { useCheckInDraft } from '@/features/checkin/CheckInDraft';
import StepScreen from '@/features/checkin/StepScreen';
import { makeStyles } from '@/theme/ThemeProvider';

const MAX_LENGTH = 80;
const MAX_SUGGESTIONS = 12;

type Suggestions = { yours: string[]; recent: string[] };

/** Case-insensitive duplicate check, so "Small talk" and "small talk" show up once. */
function unique(items: string[], seen = new Set<string>()): string[] {
  const out: string[] = [];
  for (const raw of items) {
    const label = raw.trim();
    const key = label.toLocaleLowerCase();
    if (label && !seen.has(key)) {
      seen.add(key);
      out.push(label);
    }
  }
  return out;
}

export default function ActivityStep() {
  const { t } = useTranslation();
  const styles = useStyles();
  const { draft, update } = useCheckInDraft();
  const [suggestions, setSuggestions] = useState<Suggestions>({ yours: [], recent: [] });

  // Suggestions come from the personalization list (onboarding / profile) and from earlier check-ins.
  // If loading fails, the text field below still works, so the error is not shown.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getPreferences(), listPreviousActivities(8)])
      .then(([prefs, previous]) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const yours = unique([...prefs.drains, ...prefs.recharges].map((s) => s.label), seen).slice(
          0,
          MAX_SUGGESTIONS
        );
        setSuggestions({ yours, recent: unique(previous, seen) });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const current = draft.activity.trim().toLocaleLowerCase();
  // Tapping the chosen chip again clears it.
  const choose = (label: string) => update({ activity: current === label.toLocaleLowerCase() ? '' : label });

  const next = () => {
    update({ activity: draft.activity.trim() });
    router.push('/checkin/attendees');
  };
  const skip = () => {
    update({ activity: '' });
    router.push('/checkin/attendees');
  };

  const group = (title: string, labels: string[]) =>
    labels.length === 0 ? null : (
      <View style={styles.group}>
        <AppText variant="eyebrow" accessibilityRole="header">
          {title}
        </AppText>
        <ChipWrap>
          {labels.map((label) => (
            <Chip
              key={label}
              label={label}
              selected={current === label.toLocaleLowerCase()}
              onPress={() => choose(label)}
            />
          ))}
        </ChipWrap>
      </View>
    );

  return (
    <StepScreen
      step={3}
      title={t('checkin.activity.question')}
      hint={t('checkin.activity.hint')}
      onNext={next}
      onSkip={skip}
    >
      {group(t('checkin.activity.yours'), suggestions.yours)}
      {group(t('checkin.activity.recent'), suggestions.recent)}

      <TextField
        label={t('checkin.activity.ownLabel')}
        placeholder={t('checkin.activity.ownPlaceholder')}
        value={draft.activity}
        onChangeText={(value: string) => update({ activity: value })}
        maxLength={MAX_LENGTH}
        returnKeyType="done"
      />
    </StepScreen>
  );
}

const useStyles = makeStyles((t) => ({
  group: { gap: t.spacing.xs },
}));
