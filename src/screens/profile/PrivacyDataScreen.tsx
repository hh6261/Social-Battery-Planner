import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Share } from "react-native";
import {
  AppDialog,
  AppText,
  BackLink,
  ListGroup,
  ListRow,
  Screen,
  SectionLabel,
  Toggle,
  useDialog,
} from "../../components";
import { useAuth, useCurrentUser } from "../../context/AuthContext";
import { useSaveSettings } from "../../hooks/useSaveSettings";
import { dataService } from "../../services";
import { makeStyles } from "../../theme/ThemeProvider";
import { openAppLink } from "../../utils/links";
import { requestPhotoPermission } from "../../utils/photoPicker";

/** Screen 30 · Privacy & Data (includes the Delete account dialog) */
export function PrivacyDataScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const user = useCurrentUser();
  const { deleteAccount } = useAuth();
  const { showMessage } = useDialog();
  const { settings, save } = useSaveSettings();
  const { connections } = settings;

  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const setConnection = (key: keyof typeof connections, value: boolean) =>
    save((s) => ({ ...s, connections: { ...s.connections, [key]: value } }));

  const togglePhotos = async (value: boolean) => {
    if (value) {
      const granted = await requestPhotoPermission();
      if (!granted) {
        showMessage(
          t("privacy.photoOffTitle"),
          t("privacy.photoOffMessage"),
        );
        return;
      }
    }
    setConnection("photos", value);
  };

  const exportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const json = await dataService.exportData(user.id);
      await Share.share({ title: t("privacy.exportTitle"), message: json });
    } catch {
      showMessage(
        t("privacy.exportErrorTitle"),
        t("privacy.exportErrorMessage"),
      );
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      // RootNavigator swaps back to the Splash screen.
    } catch {
      setDeleting(false);
      setDeleteError(t("privacy.deleteError"));
    }
  };

  return (
    <Screen edges={["top"]}>
      <BackLink label={t("tabs.profile")} />
      <AppText variant="eyebrow" style={styles.eyebrow}>
        {t("privacy.eyebrow")}
      </AppText>
      <AppText variant="title" accessibilityRole="header">
        {t("privacy.title")}
      </AppText>
      <AppText variant="body" color="muted" style={styles.intro}>
        {t("privacy.intro")}
      </AppText>

      <SectionLabel>{t("privacy.connections")}</SectionLabel>
      <ListGroup>
        <ListRow
          title={t("privacy.calendar")}
          subtitle={t("privacy.calendarHint")}
          right={
            <Toggle
              value={connections.calendar}
              onValueChange={(v) => setConnection("calendar", v)}
              accessibilityLabel={t("privacy.calendarLabel")}
            />
          }
        />
        <ListRow
          title={t("privacy.photos")}
          subtitle={t("privacy.photosHint")}
          right={
            <Toggle
              value={connections.photos}
              onValueChange={togglePhotos}
              accessibilityLabel={t("privacy.photosLabel")}
            />
          }
        />
      </ListGroup>

      <SectionLabel>{t("privacy.section")}</SectionLabel>
      <ListGroup>
        <ListRow
          title={t("privacy.terms")}
          emphasis={false}
          onPress={() => openAppLink("terms", t("privacy.terms"), showMessage)}
        />
        <ListRow
          title={t("privacy.help")}
          emphasis={false}
          onPress={() => openAppLink("helpFaq", t("privacy.help"), showMessage)}
        />
        <ListRow
          title={exporting ? t("privacy.exporting") : t("privacy.export")}
          emphasis={false}
          disabled={exporting}
          onPress={exportData}
          accessibilityHint={t("privacy.exportHint")}
        />
      </ListGroup>

      <SectionLabel>{t("privacy.deleteSection")}</SectionLabel>
      <ListGroup style={styles.lastGroup}>
        <ListRow
          title={t("privacy.deleteAccount")}
          emphasis={false}
          onPress={() => setDeleteOpen(true)}
        />
      </ListGroup>

      <AppDialog
        visible={deleteOpen}
        title={t("privacy.deleteTitle")}
        message={t("privacy.deleteMessage")}
        primaryLabel={t("privacy.deleteAccount")}
        onPrimary={confirmDelete}
        primaryLoading={deleting}
        secondaryLabel={t("common.cancel")}
        secondaryVariant="outline"
        onSecondary={() => {
          setDeleteOpen(false);
          setDeleteError(null);
        }}
      >
        {deleteError ? (
          <AppText variant="bodySmall" color="error">
            {deleteError}
          </AppText>
        ) : null}
      </AppDialog>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  eyebrow: { marginTop: t.spacing.lg, marginBottom: t.spacing.xs },
  intro: { marginTop: t.spacing.sm },
  lastGroup: { marginBottom: t.spacing.md },
}));
