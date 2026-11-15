import { TextInput } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { TextField } from '@/components/TextField';
import { useCheckInDraft } from '@/features/checkin/CheckInDraft';
import StepScreen from '@/features/checkin/StepScreen';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

const MAX_TITLE = 80;
const MAX_NOTE = 1000;

export default function NotesStep() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const { draft, update } = useCheckInDraft();

  const next = () => {
    update({ noteTitle: draft.noteTitle.trim(), notes: draft.notes.trim() });
    router.push('/checkin/confirm');
  };
  const skip = () => {
    update({ noteTitle: '', notes: '' });
    router.push('/checkin/confirm');
  };

  return (
    <StepScreen step={6} title={t('checkin.notes.title')} onNext={next} onSkip={skip}>
      <TextField
        label={t('checkin.notes.titleLabel')}
        placeholder={t('checkin.notes.titlePlaceholder')}
        value={draft.noteTitle}
        onChangeText={(value: string) => update({ noteTitle: value })}
        maxLength={MAX_TITLE}
        returnKeyType="next"
      />
      <TextInput
        style={[styles.body, { fontSize: theme.font(16) }]}
        value={draft.notes}
        onChangeText={(value: string) => update({ notes: value })}
        placeholder={t('checkin.notes.bodyPlaceholder')}
        placeholderTextColor={theme.colors.subtle}
        accessibilityLabel={t('checkin.notes.bodyLabel')}
        maxLength={MAX_NOTE}
        multiline
        textAlignVertical="top"
      />
    </StepScreen>
  );
}

const useStyles = makeStyles((t) => ({
  body: {
    minHeight: 200,
    borderRadius: t.radius.md,
    borderWidth: t.borderWidth,
    borderColor: t.colors.muted,
    backgroundColor: t.colors.surface,
    color: t.colors.ink,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.md,
  },
}));
