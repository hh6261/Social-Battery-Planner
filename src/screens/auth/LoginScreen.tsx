import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { View, type TextInputInstance } from "react-native";
import { useTranslation } from "react-i18next";
import {
  AppDialog,
  AppText,
  BackLink,
  Button,
  Checkbox,
  DashedDivider,
  Logo,
  Screen,
  TextField,
  useDialog,
} from "../../components";
import { useAuth } from "../../context/AuthContext";
import { dataService, ServiceError } from "../../services";
import { makeStyles } from "../../theme/ThemeProvider";
import {
  parseBirthday,
  validateEmail,
  validateNewPassword,
} from "../../utils/validation";

/** Screen 2 · Log in */
export function LoginScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);
  const { showDialog } = useDialog();

  // Development builds only: wipe the local account so you can register again.
  const resetDevice = async () => {
    const confirmed = await showDialog({
      title: t("auth.resetDeviceTitle"),
      message: t("auth.resetDeviceMessage"),
      primaryLabel: t("auth.reset"),
      secondaryLabel: t("common.cancel"),
      secondaryVariant: "outline",
    });
    if (!confirmed) return;
    await dataService.deleteAccount("local");
    router.replace("/");
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{
    email?: string | null;
    password?: string | null;
    form?: string | null;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const submit = async () => {
    const emailError = validateEmail(email);
    const passwordError = password ? null : t("validation.passwordEnter");
    setErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    setSubmitting(true);
    try {
      await signIn(email.trim(), password, remember);
      // RootNavigator switches to the app (or onboarding) automatically.
    } catch (e) {
      setErrors({
        form:
          e instanceof ServiceError
            ? e.message
            : t("common.genericError"),
      });
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <BackLink
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
      />

      <View style={styles.header}>
        <Logo size={52} />
        <View style={styles.headerText}>
          <AppText variant="eyebrow" color="ink">
            {t("app.name")}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {t("auth.welcomeBack")}
          </AppText>
        </View>
      </View>

      <TextField
        label={t("auth.email")}
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (errors.email || errors.form) setErrors({});
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
        containerStyle={styles.field}
      />
      <TextField
        ref={passwordRef}
        label={t("auth.password")}
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          if (errors.password || errors.form) setErrors({});
        }}
        placeholder={t("auth.passwordPlaceholder")}
        password
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={errors.password}
        containerStyle={styles.field}
      />

      <Checkbox
        checked={remember}
        onChange={setRemember}
        label={t("auth.remember")}
        style={styles.remember}
      />

      {errors.form ? (
        <AppText
          variant="bodySmall"
          color="error"
          style={styles.formError}
          accessibilityLiveRegion="assertive"
        >
          {errors.form}
        </AppText>
      ) : null}

      <Button
        label={t("auth.logIn")}
        onPress={submit}
        loading={submitting}
        style={styles.submit}
      />

      <AppText
        variant="body"
        weight="600"
        align="center"
        style={styles.link}
        onPress={() => setResetOpen(true)}
        accessibilityRole="link"
      >
        {t("auth.forgot")}
      </AppText>

      <DashedDivider style={styles.dashed} />

      <View style={styles.signupRow}>
        <AppText variant="bodySmall" color="muted">
          {t("auth.newHere")}{" "}
        </AppText>
        <AppText
          variant="bodySmall"
          weight="600"
          style={styles.underline}
          onPress={() => router.replace("/register")}
          accessibilityRole="link"
        >
          {t("auth.signUp")}
        </AppText>
      </View>

      {__DEV__ && (
        <Button
          label={t("auth.resetDev")}
          variant="outline"
          size="md"
          onPress={resetDevice}
          style={styles.devReset}
        />
      )}
      <ForgotPasswordDialog
        visible={resetOpen}
        initialEmail={email}
        onClose={() => setResetOpen(false)}
        onReset={(resetEmail) => {
          setEmail(resetEmail);
          setPassword("");
          setErrors({});
          passwordRef.current?.focus();
        }}
      />
    </Screen>
  );
}

/**
 * The account lives only on this device, so there's no reset email. The user
 * confirms their email + birthday (both saved at registration) and picks a new password.
 */
function ForgotPasswordDialog({
  visible,
  initialEmail,
  onClose,
  onReset,
}: {
  visible: boolean;
  initialEmail: string;
  onClose(): void;
  /** Called with the email after a successful reset, to prefill the log-in form. */
  onReset(email: string): void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const [email, setEmail] = useState(initialEmail);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string | null;
    birthday?: string | null;
    password?: string | null;
    form?: string | null;
  }>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Start from an empty form every time the dialog opens (state adjusted while rendering, no effect).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setEmail(initialEmail);
      setDay("");
      setMonth("");
      setYear("");
      setPassword("");
      setErrors({});
      setDone(false);
      setSaving(false);
    }
  }

  const digits = (value: string, max: number, set: (v: string) => void) => {
    set(value.replace(/\D/g, "").slice(0, max));
    setErrors((e) => ({ ...e, birthday: null, form: null }));
  };

  const submit = async () => {
    const birthday = parseBirthday(day, month, year);
    const next = {
      email: validateEmail(email),
      birthday: birthday.error,
      password: validateNewPassword(password),
    };
    setErrors(next);
    if (next.email || next.password || !birthday.iso) return;

    setSaving(true);
    try {
      await dataService.resetPassword(email.trim(), birthday.iso, password);
      setDone(true);
    } catch (e) {
      setErrors({
        form:
          e instanceof ServiceError
            ? e.message
            : t("common.genericError"),
      });
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <AppDialog
        visible={visible}
        title={t("auth.passwordUpdated")}
        message={t("auth.passwordUpdatedMessage")}
        primaryLabel={t("auth.logIn")}
        onPrimary={() => {
          onReset(email.trim());
          onClose();
        }}
        onRequestClose={onClose}
      />
    );
  }

  return (
    <AppDialog
      visible={visible}
      title={t("auth.resetTitle")}
      message={t("auth.resetMessage")}
      primaryLabel={t("common.save")}
      onPrimary={submit}
      primaryLoading={saving}
      secondaryLabel={t("common.cancel")}
      onSecondary={onClose}
    >
      <TextField
        label={t("auth.email")}
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setErrors((e) => ({ ...e, email: null, form: null }));
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.email}
        containerStyle={styles.dialogField}
      />
      <AppText variant="label" style={styles.dialogBirthdayLabel}>
        {t("auth.birthday")}
      </AppText>
      <View style={styles.dialogBirthdayRow}>
        <TextField
          value={day}
          onChangeText={(v) => digits(v, 2, setDay)}
          placeholder={t("auth.dayPlaceholder")}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel={t("auth.birthdayDay")}
          containerStyle={styles.flex1}
        />
        <TextField
          value={month}
          onChangeText={(v) => digits(v, 2, setMonth)}
          placeholder={t("auth.monthPlaceholder")}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel={t("auth.birthdayMonth")}
          containerStyle={styles.flex1}
        />
        <TextField
          value={year}
          onChangeText={(v) => digits(v, 4, setYear)}
          placeholder={t("auth.yearPlaceholder")}
          keyboardType="number-pad"
          maxLength={4}
          accessibilityLabel={t("auth.birthdayYear")}
          containerStyle={styles.flex13}
        />
      </View>
      {errors.birthday ? (
        <AppText
          variant="caption"
          color="error"
          style={styles.dialogInlineError}
        >
          {errors.birthday}
        </AppText>
      ) : null}
      <TextField
        label={t("auth.newPassword")}
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setErrors((e) => ({ ...e, password: null, form: null }));
        }}
        placeholder={t("auth.createPasswordPlaceholder")}
        password
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={submit}
        error={errors.password}
        containerStyle={styles.dialogField}
      />
      {errors.form ? (
        <AppText
          variant="bodySmall"
          color="error"
          style={styles.dialogInlineError}
          accessibilityLiveRegion="assertive"
        >
          {errors.form}
        </AppText>
      ) : null}
    </AppDialog>
  );
}

const useStyles = makeStyles((t) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: t.spacing.xxl,
    marginBottom: t.spacing.xxl,
  },
  headerText: { marginStart: t.spacing.md, flex: 1 },
  field: { marginBottom: t.spacing.lg },
  remember: { marginBottom: t.spacing.xl },
  formError: { marginBottom: t.spacing.md },
  submit: { marginTop: t.spacing.sm },
  link: {
    textDecorationLine: "underline",
    marginTop: t.spacing.lg,
    paddingVertical: t.spacing.xs,
  },
  dashed: { marginTop: t.spacing.xl },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: t.spacing.lg,
    flexWrap: "wrap",
  },
  underline: { textDecorationLine: "underline", paddingVertical: t.spacing.xs },
  dialogField: { marginTop: t.spacing.md },
  devReset: { marginTop: t.spacing.xxl },
  dialogBirthdayLabel: { marginTop: t.spacing.md, marginBottom: t.spacing.xs },
  dialogBirthdayRow: { flexDirection: "row", gap: t.spacing.xs },
  dialogInlineError: { marginTop: t.spacing.xxs },
  flex1: { flex: 1 },
  flex13: { flex: 1.3 },
}));
