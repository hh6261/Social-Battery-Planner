import { Button, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type Props = {
  onNext: () => void;
  nextDisabled?: boolean;
  onSkip?: () => void; // if given, a Skip button appears on the left
};

export default function StepFooter({ onNext, nextDisabled = false, onSkip }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.footer}>
      {onSkip ? <Button title={t('checkin.skip')} onPress={onSkip} /> : <View />}
      <Button title={t('checkin.next')} onPress={onNext} disabled={nextDisabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#98A2B3',
  },
});