import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  AddChip,
  AddSituationDialog,
  AppText,
  Button,
  Card,
  Chip,
  ChipWrap,
  Screen,
  useDialog,
} from '../../components';
import { DRAIN_GROUPS, makeSituation, RECHARGE_GROUPS, SituationGroup } from '../../constants/situations';
import { useAuth } from '../../context/AuthContext';
import { dataService, EnergyLevel, Situation, SituationKind } from '../../services';
import { makeStyles } from '../../theme/ThemeProvider';

/** A chip option plus whether the user typed it in. */
interface Option {
  label: string;
  level: EnergyLevel;
  custom: boolean;
}

const toOptions = (groups: SituationGroup[]): Option[] =>
  groups.flatMap((g) => g.options.map((label) => ({ label, level: g.level, custom: false })));

/** Screen 5 · App personalization */
export function PersonalizationScreen() {
  const styles = useStyles();
  const { user, finishOnboarding } = useAuth();
  const { showMessage } = useDialog();

  const [options, setOptions] = useState<Record<SituationKind, Option[]>>({
    drain: toOptions(DRAIN_GROUPS),
    recharge: toOptions(RECHARGE_GROUPS),
  });
  const [selected, setSelected] = useState<Record<SituationKind, Set<string>>>({
    drain: new Set(),
    recharge: new Set(),
  });
  const [adding, setAdding] = useState<{ kind: SituationKind; level: EnergyLevel } | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (kind: SituationKind, label: string) =>
    setSelected((prev) => {
      const nextSet = new Set(prev[kind]);
      if (nextSet.has(label)) nextSet.delete(label);
      else nextSet.add(label);
      return { ...prev, [kind]: nextSet };
    });

  const addCustom = (label: string, level: EnergyLevel) => {
    if (!adding) return;
    const { kind } = adding;
    setOptions((prev) => ({ ...prev, [kind]: [...prev[kind], { label, level, custom: true }] }));
    // Something you took the time to type in is something that applies to you.
    setSelected((prev) => ({ ...prev, [kind]: new Set(prev[kind]).add(label) }));
  };

  const finish = async () => {
    if (!user) return;
    const build = (kind: SituationKind): Situation[] =>
      options[kind]
        .filter((o) => selected[kind].has(o.label))
        .map((o) => makeSituation(o.label, o.level, kind, o.custom));

    setSaving(true);
    try {
      await dataService.savePreferences(user.id, { drains: build('drain'), recharges: build('recharge') });
      await finishOnboarding();
      // RootNavigator swaps to the tab navigator and lands on Home.
    } catch {
      setSaving(false);
      showMessage('Couldn’t save your choices', 'Please check your connection and try again.');
    }
  };

  const existingForDialog = useMemo(
    () => (adding ? options[adding.kind].map((o) => o.label) : []),
    [adding, options],
  );

  const renderStep = (kind: SituationKind, step: number, title: string, subtitle: string, groups: SituationGroup[]) => (
    <Card style={styles.card}>
      <AppText variant="eyebrow">{`Step ${step}`}</AppText>
      <AppText variant="heading" style={styles.cardTitle} accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="bodySmall" color="muted" style={styles.cardSubtitle}>
        {subtitle}
      </AppText>

      {groups.map((group) => (
        <View key={group.level} style={styles.group}>
          <View style={styles.groupHeader}>
            <AppText variant="label">{group.title}</AppText>
            <AppText variant="caption" color="muted">
              {group.hint}
            </AppText>
          </View>
          <ChipWrap>
            {options[kind]
              .filter((o) => o.level === group.level)
              .map((o) => (
                <Chip
                  key={o.label}
                  label={o.label}
                  selected={selected[kind].has(o.label)}
                  onPress={() => toggle(kind, o.label)}
                />
              ))}
            <AddChip onPress={() => setAdding({ kind, level: group.level })} />
          </ChipWrap>
        </View>
      ))}
    </Card>
  );

  return (
    <Screen>
      <AppText variant="eyebrow" style={styles.eyebrow}>
        Almost there
      </AppText>
      <AppText variant="title" accessibilityRole="header">
        You’re getting started
      </AppText>
      <AppText variant="body" color="muted" style={styles.intro}>
        A few choices can help shape suggestions around what feels right for you.
      </AppText>

      {renderStep('drain', 1, 'What tends to drain you?', 'Choose any situations that may use your social energy.', DRAIN_GROUPS)}
      {renderStep('recharge', 2, 'What helps you recharge?', 'Choose the moments that may help your energy return.', RECHARGE_GROUPS)}

      <AppText variant="caption" color="muted" align="center" style={styles.note}>
        These choices aren’t permanent. You can adjust them at any time from your profile.
      </AppText>
      <Button label="Finish" onPress={finish} loading={saving} />

      <AddSituationDialog
        visible={!!adding}
        kind={adding?.kind ?? 'drain'}
        fixedLevel={adding?.level}
        existing={existingForDialog}
        onSubmit={addCustom}
        onClose={() => setAdding(null)}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  eyebrow: { marginTop: t.spacing.md, marginBottom: t.spacing.xs },
  intro: { marginTop: t.spacing.xs, marginBottom: t.spacing.xl },
  card: { marginBottom: t.spacing.xl },
  cardTitle: { marginTop: t.spacing.xs },
  cardSubtitle: { marginTop: t.spacing.xs },
  group: { marginTop: t.spacing.lg },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: t.spacing.sm,
  },
  note: { marginBottom: t.spacing.md, paddingHorizontal: t.spacing.md },
}));
