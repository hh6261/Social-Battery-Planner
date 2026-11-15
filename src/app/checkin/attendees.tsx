import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Segmented, type SegmentedOption } from '@/components/Segmented';
import type { GroupSize } from '@/db/types';
import { useCheckInDraft } from '@/features/checkin/CheckInDraft';
import StepScreen from '@/features/checkin/StepScreen';
import StepSlider from '@/features/checkin/StepSlider';
import { formatNumber } from '@/i18n/format';
import { makeStyles } from '@/theme/ThemeProvider';

const GROUP_SIZES: GroupSize[] = ['lt5', 'lt10', 'lt15', 'more'];
const SHORT: Record<GroupSize, string> = { lt5: '< 5', lt10: '< 10', lt15: '< 15', more: '15+' };
const MAX_COUNT = 20;

type YesNo = 'yes' | 'no';

export default function AttendeesStep() {
  const { t } = useTranslation();
  const styles = useStyles();
  const { draft, update } = useCheckInDraft();

  const groupSize = draft.groupSize;
  const oneOnOne = draft.oneOnOne ?? false;
  const strangers = draft.strangerCount ?? 0;
  const friends = draft.friendsMade ?? 0;

  const groupOptions: SegmentedOption<GroupSize>[] = GROUP_SIZES.map((key) => ({
    key,
    label: SHORT[key],
    accessibilityLabel: t(`checkin.attendees.group.${key}`),
  }));
  const yesNoOptions: SegmentedOption<YesNo>[] = [
    { key: 'no', label: t('checkin.attendees.no') },
    { key: 'yes', label: t('checkin.attendees.yes') },
  ];

  // Choosing a group size means it was not one-on-one, and the other way round.
  const chooseGroup = (key: GroupSize) =>
    update({ groupSize: groupSize === key ? null : key, oneOnOne: false });
  const chooseOneOnOne = (key: YesNo) =>
    update(key === 'yes' ? { oneOnOne: true, groupSize: null } : { oneOnOne: false });

  const next = () => {
    update({ oneOnOne, strangerCount: strangers, friendsMade: friends });
    router.push('/checkin/impact');
  };
  const skip = () => {
    update({ groupSize: null, oneOnOne: null, strangerCount: null, friendsMade: null });
    router.push('/checkin/impact');
  };

  const counter = (label: string, value: number, key: 'strangerCount' | 'friendsMade') => (
    <View style={styles.block}>
      <View style={styles.labelRow}>
        <AppText variant="subheading">{label}</AppText>
        <AppText
          variant="subheading"
          accessibilityLiveRegion="polite"
          accessibilityLabel={t('checkin.attendees.value', { label, value: formatNumber(value) })}
        >
          {formatNumber(value)}
        </AppText>
      </View>
      <StepSlider
        value={value}
        min={0}
        max={MAX_COUNT}
        step={1}
        onChange={(v) => update(key === 'strangerCount' ? { strangerCount: v } : { friendsMade: v })}
        sliderLabel={label}
        decreaseLabel={t('checkin.attendees.decrease', { what: label })}
        increaseLabel={t('checkin.attendees.increase', { what: label })}
      />
    </View>
  );

  return (
    <StepScreen step={4} title={t('checkin.attendees.title')} onNext={next} onSkip={skip}>
      <View style={styles.block}>
        <AppText variant="subheading">{t('checkin.attendees.groupLabel')}</AppText>
        <Segmented
          options={groupOptions}
          value={groupSize}
          onChange={chooseGroup}
          accessibilityLabel={t('checkin.attendees.groupLabel')}
        />
      </View>

      <View style={styles.block}>
        <AppText variant="subheading">{t('checkin.attendees.oneOnOneLabel')}</AppText>
        <Segmented
          options={yesNoOptions}
          value={oneOnOne ? 'yes' : 'no'}
          onChange={chooseOneOnOne}
          accessibilityLabel={t('checkin.attendees.oneOnOneLabel')}
        />
      </View>

      {counter(t('checkin.attendees.strangers'), strangers, 'strangerCount')}
      {counter(t('checkin.attendees.friends'), friends, 'friendsMade')}
    </StepScreen>
  );
}

const useStyles = makeStyles((t) => ({
  block: { gap: t.spacing.xs },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
}));
