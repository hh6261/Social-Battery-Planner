import { useState } from "react";
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
          "Photo access is off",
          "To use this, allow Social Battery to access your photos in your phone’s settings.",
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
      await Share.share({ title: "Social Battery data export", message: json });
    } catch {
      showMessage(
        "Couldn’t export your data",
        "Please check your connection and try again.",
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
      setDeleteError("We couldn’t delete your account. Please try again.");
    }
  };

  return (
    <Screen edges={["top"]}>
      <BackLink label="Profile" />
      <AppText variant="eyebrow" style={styles.eyebrow}>
        Privacy & Data
      </AppText>
      <AppText variant="title" accessibilityRole="header">
        Your data and plans are private
      </AppText>
      <AppText variant="body" color="muted" style={styles.intro}>
        You can choose what the app connects to and how your information is
        handled.
      </AppText>

      <SectionLabel>Connections</SectionLabel>
      <ListGroup>
        <ListRow
          title="Calendar"
          subtitle="Help you plan around upcoming events"
          right={
            <Toggle
              value={connections.calendar}
              onValueChange={(v) => setConnection("calendar", v)}
              accessibilityLabel="Calendar connection"
            />
          }
        />
        <ListRow
          title="Photos"
          subtitle="Let you choose a profile picture"
          right={
            <Toggle
              value={connections.photos}
              onValueChange={togglePhotos}
              accessibilityLabel="Photos connection"
            />
          }
        />
      </ListGroup>

      <SectionLabel>Privacy</SectionLabel>
      <ListGroup>
        <ListRow
          title="Terms & Conditions"
          emphasis={false}
          onPress={() =>
            openAppLink("terms", "Terms & Conditions", showMessage)
          }
        />
        <ListRow
          title="Help & FAQ"
          emphasis={false}
          onPress={() => openAppLink("helpFaq", "Help & FAQ", showMessage)}
        />
        <ListRow
          title={exporting ? "Preparing export…" : "Export data"}
          emphasis={false}
          disabled={exporting}
          onPress={exportData}
          accessibilityHint="Shares a copy of your data"
        />
      </ListGroup>

      <SectionLabel>Delete account</SectionLabel>
      <ListGroup style={styles.lastGroup}>
        <ListRow
          title="Delete account"
          emphasis={false}
          onPress={() => setDeleteOpen(true)}
        />
      </ListGroup>

      <AppDialog
        visible={deleteOpen}
        title="Delete your account?"
        message="This would remove your account, check-ins, plans, and preferences. Are you sure you’d like to continue?"
        primaryLabel="Delete account"
        onPrimary={confirmDelete}
        primaryLoading={deleting}
        secondaryLabel="Cancel"
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
