import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, View } from "react-native";
import {
  AddChip,
  AddSituationDialog,
  AppDialog,
  AppText,
  Button,
  Card,
  Chip,
  ChipWrap,
  ListGroup,
  ListRow,
  Screen,
  TextField,
  useDialog,
} from "../../components";
import { makeSituation } from "../../constants/situations";
import { useAuth, useCurrentUser } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { usePreferences } from "../../hooks/usePreferences";
import { ServiceError, Situation, SituationKind } from "../../services";
import { makeStyles, useTheme } from "../../theme/ThemeProvider";
import { pickProfilePhoto } from "../../utils/photoPicker";
import { validateUsername } from "../../utils/validation";

/** Screen 27 · Profile */
export function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const user = useCurrentUser();
  const { showMessage } = useDialog();
  const { prefs, error, reload, update } = usePreferences(user.id);
  const [adding, setAdding] = useState<SituationKind | null>(null);
  const [editing, setEditing] = useState(false);

  const remove = async (kind: SituationKind, item: Situation) => {
    const key = kind === "drain" ? "drains" : "recharges";
    try {
      await update((p) => ({
        ...p,
        [key]: p[key].filter((s) => s.id !== item.id),
      }));
    } catch {
      showMessage(t("profile.removeErrorTitle"), t("profile.removeErrorMessage"));
    }
  };

  const add = async (label: string, level: Situation["level"]) => {
    if (!adding) return;
    const kind = adding;
    const key = kind === "drain" ? "drains" : "recharges";
    await update((p) => ({
      ...p,
      [key]: [...p[key], makeSituation(label, level, kind, true)],
    }));
  };

  const renderList = (
    kind: SituationKind,
    title: string,
    subtitle: string,
    items: Situation[],
  ) => (
    <Card style={styles.card}>
      <AppText variant="subheading" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="bodySmall" color="muted" style={styles.cardSubtitle}>
        {subtitle}
      </AppText>
      <ChipWrap>
        {items.map((item) => (
          <Chip
            key={item.id}
            size="sm"
            label={item.label}
            onRemove={() => remove(kind, item)}
          />
        ))}
        <AddChip size="sm" label={t("profile.addChip")} onPress={() => setAdding(kind)} />
      </ChipWrap>
      {items.length === 0 ? (
        <AppText variant="caption" color="muted" style={styles.empty}>
          {t("profile.empty")}
        </AppText>
      ) : null}
    </Card>
  );

  return (
    <Screen edges={["top"]}>
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        {t("tabs.profile")}
      </AppText>

      <Card style={styles.card} contentStyle={styles.profileCard}>
        <Pressable
          onPress={() => setEditing(true)}
          accessibilityRole="button"
          accessibilityLabel={t("profile.edit")}
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
        >
          {user.photoUri ? (
            <Image source={{ uri: user.photoUri }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Feather name="user" size={26} color={theme.colors.ink} />
          )}
          <View style={styles.editBadge}>
            <Feather name="edit-2" size={11} color={theme.colors.onPrimary} />
          </View>
        </Pressable>
        <View style={styles.profileText}>
          <AppText variant="eyebrow">{t("profile.yourProfile")}</AppText>
          <AppText variant="heading" numberOfLines={1}>
            {user.username}
          </AppText>
        </View>
      </Card>

      {!prefs && !error ? (
        <ActivityIndicator color={theme.colors.ink} style={styles.loading} />
      ) : error ? (
        <Card style={styles.card}>
          <AppText variant="body">{error}</AppText>
          <Button
            label={t("common.tryAgain")}
            size="md"
            variant="outline"
            onPress={reload}
            style={styles.retry}
          />
        </Card>
      ) : prefs ? (
        <>
          {renderList(
            "drain",
            t("profile.stressors"),
            t("profile.stressorsHint"),
            prefs.drains,
          )}
          {renderList(
            "recharge",
            t("profile.relaxers"),
            t("profile.relaxersHint"),
            prefs.recharges,
          )}
        </>
      ) : null}

      <ListGroup style={styles.links}>
        <ListRow
          title={t("settings.title")}
          emphasis={false}
          onPress={() => router.push("/profile/settings")}
        />
        <ListRow
          title={t("profile.privacy")}
          emphasis={false}
          onPress={() => router.push("/profile/privacy")}
        />
      </ListGroup>

      <AddSituationDialog
        visible={!!adding}
        kind={adding ?? "drain"}
        existing={
          prefs && adding
            ? (adding === "drain" ? prefs.drains : prefs.recharges).map(
                (s) => s.label,
              )
            : []
        }
        onSubmit={add}
        onClose={() => setAdding(null)}
      />
      <EditProfileDialog
        visible={editing}
        onClose={() => setEditing(false)}
        onOpenPrivacy={() => {
          setEditing(false);
          router.push("/profile/privacy");
        }}
      />
    </Screen>
  );
}

/** Change name and photo. Uses the shared dialog shape. */
function EditProfileDialog({
  visible,
  onClose,
  onOpenPrivacy,
}: {
  visible: boolean;
  onClose(): void;
  onOpenPrivacy(): void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const user = useCurrentUser();
  const { updateUser } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [name, setName] = useState(user.username);
  const [photoUri, setPhotoUri] = useState(user.photoUri);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fill the form with the current profile every time the dialog opens (state adjusted while rendering, no effect).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setName(user.username);
      setPhotoUri(user.photoUri);
      setError(null);
      setNotice(null);
      setSaving(false);
    }
  }

  const changePhoto = async () => {
    setNotice(null);
    const result = await pickProfilePhoto();
    if (result.status === "picked") {
      setPhotoUri(result.uri);
      // Choosing a photo yourself means you're happy for the app to use one,
      // so switch on the Photos connection in Privacy & Data to match.
      if (!settings.connections.photos) {
        updateSettings((s) => ({ ...s, connections: { ...s.connections, photos: true } })).catch(() => {});
      }
    }
    if (result.status === "denied")
      setNotice(t("profile.photoDenied"));
  };

  const save = async () => {
    const nameError = validateUsername(name);
    if (nameError) {
      setError(nameError);
      return;
    }
    setSaving(true);
    try {
      await updateUser({ username: name.trim(), photoUri });
      onClose();
    } catch (e) {
      setError(
        e instanceof ServiceError
          ? e.message
          : t("profile.saveError"),
      );
      setSaving(false);
    }
  };

  return (
    <AppDialog
      visible={visible}
      title={t("profile.edit")}
      primaryLabel={t("common.save")}
      onPrimary={save}
      primaryLoading={saving}
      secondaryLabel={t("common.cancel")}
      onSecondary={onClose}
    >
      <View style={styles.editPhotoRow}>
        <View style={styles.avatar}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Feather name="user" size={26} color={theme.colors.ink} />
          )}
        </View>
        <View style={styles.editPhotoActions}>
          <AppText
            variant="body"
            weight="600"
            style={styles.underline}
            onPress={changePhoto}
            accessibilityRole="button"
          >
            {t("profile.changePhoto")}
          </AppText>
          {photoUri ? (
            <AppText
              variant="bodySmall"
              color="muted"
              style={[styles.underline, styles.removePhoto]}
              onPress={() => setPhotoUri(null)}
              accessibilityRole="button"
            >
              {t("profile.removePhoto")}
            </AppText>
          ) : null}
        </View>
      </View>
      {notice ? (
        <AppText variant="caption" color="muted" style={styles.notice}>
          {notice}{" "}
          {!settings.connections.photos ? (
            <AppText
              variant="caption"
              weight="600"
              style={styles.underline}
              onPress={onOpenPrivacy}
              accessibilityRole="link"
            >
              {t("profile.openPrivacy")}
            </AppText>
          ) : null}
        </AppText>
      ) : null}
      <TextField
        label={t("register.username")}
        value={name}
        onChangeText={(v) => {
          setName(v);
          setError(null);
        }}
        maxLength={30}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={save}
        error={error}
      />
    </AppDialog>
  );
}

const AVATAR = 64;

const useStyles = makeStyles((t) => ({
  title: { marginTop: t.spacing.md, marginBottom: t.spacing.xl },
  card: { marginBottom: t.spacing.xl },
  cardSubtitle: { marginTop: t.spacing.xxs, marginBottom: t.spacing.md },
  profileCard: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: AVATAR - 4,
    height: AVATAR - 4,
    borderRadius: (AVATAR - 4) / 2,
  },
  editBadge: {
    position: "absolute",
    end: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: t.colors.primary,
    borderWidth: t.borderWidth,
    borderColor: t.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  profileText: { flex: 1, marginStart: t.spacing.md },
  loading: { marginVertical: t.spacing.xl },
  retry: { marginTop: t.spacing.md },
  empty: { marginTop: t.spacing.sm },
  links: { marginBottom: t.spacing.md },
  editPhotoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: t.spacing.md,
  },
  editPhotoActions: { marginStart: t.spacing.md },
  removePhoto: { marginTop: t.spacing.xxs },
  underline: { textDecorationLine: "underline" },
  notice: { marginBottom: t.spacing.md },
}));
