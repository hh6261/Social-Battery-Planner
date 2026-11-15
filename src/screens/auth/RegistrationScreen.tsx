import { Feather } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type TextInputInstance } from 'react-native';
import {
  AppText,
  BackLink,
  Button,
  Checkbox,
  Screen,
  TextField,
  useDialog,
} from '../../components';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { ServiceError } from '../../services';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { openAppLink } from '../../utils/links';
import { pickProfilePhoto } from '../../utils/photoPicker';
import {
  parseBirthday,
  validateEmail,
  validateNewPassword,
  validateUsername,
} from '../../utils/validation';

type Field = 'username' | 'email' | 'password' | 'birthday' | 'terms' | 'form';
type Errors = Partial<Record<Field, string | null>>;

/** Screen 3 · Registration */
export function RegistrationScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const { register } = useAuth();
  const { showMessage } = useDialog();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const dayRef = useRef<TextInputInstance>(null);
  const monthRef = useRef<TextInputInstance>(null);
  const yearRef = useRef<TextInputInstance>(null);

  const clear = (field: Field) => {
    if (errors[field] || errors.form) setErrors((e) => ({ ...e, [field]: null, form: null }));
  };

  const choosePhoto = async () => {
    const result = await pickProfilePhoto();
    if (result.status === 'picked') setPhotoUri(result.uri);
    if (result.status === 'denied') {
      showMessage(
        t('privacy.photoOffTitle'),
        t('register.photoOffMessage'),
      );
    }
  };

  /** Moves focus to the next birthday box once a box is full. */
  const onDigits = (value: string, max: number, set: (v: string) => void, next?: React.RefObject<TextInputInstance | null>) => {
    const digits = value.replace(/\D/g, '').slice(0, max);
    set(digits);
    clear('birthday');
    if (digits.length === max) next?.current?.focus();
  };

  const submit = async () => {
    const birthday = parseBirthday(day, month, year);
    const next: Errors = {
      username: validateUsername(username),
      email: validateEmail(email),
      password: validateNewPassword(password),
      birthday: birthday.error,
      terms: agreed ? null : t('register.termsRequired'),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean) || !birthday.iso) return;

    setSubmitting(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        birthday: birthday.iso,
        photoUri,
      });
      // RootNavigator moves on to Onboarding.
    } catch (e) {
      setSubmitting(false);
      if (e instanceof ServiceError && e.code === 'email_taken') setErrors({ email: e.message });
      else if (e instanceof ServiceError && e.code === 'username_taken') setErrors({ username: e.message });
      else if (e instanceof ServiceError && e.code === 'account_exists') setErrors({ form: e.message });
      else setErrors({ form: t('register.genericError') });
    }
  };

  return (
    <Screen>
      <BackLink />
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        {t('register.title')}
      </AppText>

      <View style={styles.photoRow}>
        <View>
          <AppText variant="label" style={styles.photoLabel}>
            {t('register.photo')}
          </AppText>
          <Pressable
            onPress={choosePhoto}
            accessibilityRole="button"
            accessibilityLabel={photoUri ? t('register.changePhoto') : t('register.addPhoto')}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Feather name="user" size={26} color={theme.colors.subtle} />
            )}
            <View style={styles.avatarBadge}>
              <Feather name="plus" size={12} color={theme.colors.ink} />
            </View>
          </Pressable>
        </View>
        <TextField
          label={t('register.username')}
          value={username}
          onChangeText={(v) => {
            setUsername(v);
            clear('username');
          }}
          placeholder={t('register.usernamePlaceholder')}
          autoCapitalize="words"
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          maxLength={30}
          error={errors.username}
          containerStyle={styles.usernameField}
        />
      </View>

      <TextField
        ref={emailRef}
        label={t('auth.email')}
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          clear('email');
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
        label={t('auth.password')}
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          clear('password');
        }}
        placeholder={t('auth.createPasswordPlaceholder')}
        password
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => dayRef.current?.focus()}
        error={errors.password}
        containerStyle={styles.field}
      />

      <AppText variant="label" style={styles.birthdayLabel} accessibilityRole="header">
        {t('auth.birthday')}
      </AppText>
      <View style={styles.birthdayRow}>
        <TextField
          ref={dayRef}
          sublabel={t('register.day')}
          value={day}
          onChangeText={(v) => onDigits(v, 2, setDay, monthRef)}
          placeholder={t('auth.dayPlaceholder')}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel={t('auth.birthdayDay')}
          containerStyle={styles.dayField}
        />
        <TextField
          ref={monthRef}
          sublabel={t('register.month')}
          value={month}
          onChangeText={(v) => onDigits(v, 2, setMonth, yearRef)}
          placeholder={t('auth.monthPlaceholder')}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel={t('auth.birthdayMonth')}
          containerStyle={styles.monthField}
        />
        <TextField
          ref={yearRef}
          sublabel={t('register.year')}
          value={year}
          onChangeText={(v) => onDigits(v, 4, setYear)}
          placeholder={t('auth.yearPlaceholder')}
          keyboardType="number-pad"
          maxLength={4}
          accessibilityLabel={t('auth.birthdayYear')}
          containerStyle={styles.yearField}
        />
      </View>
      {errors.birthday ? (
        <AppText variant="caption" color="error" style={styles.inlineError}>
          {errors.birthday}
        </AppText>
      ) : null}

      <Checkbox
        checked={agreed}
        onChange={(v) => {
          setAgreed(v);
          clear('terms');
        }}
        accessibilityLabel={t('register.agreeLabel')}
        error={errors.terms}
        style={styles.terms}
      >
        <AppText variant="bodySmall">
          {t('register.agreePrefix')}{' '}
          <AppText
            variant="bodySmall"
            weight="600"
            style={styles.underline}
            onPress={() => openAppLink('terms', t('privacy.terms'), showMessage)}
            accessibilityRole="link"
          >
            {t('register.agreeLink')}
          </AppText>
          {t('register.agreeSuffix')}
        </AppText>
      </Checkbox>

      {errors.form ? (
        <AppText variant="bodySmall" color="error" style={styles.formError} accessibilityLiveRegion="assertive">
          {errors.form}
        </AppText>
      ) : null}

      <Button label={t('register.create')} onPress={submit} loading={submitting} style={styles.submit} />

      <View style={styles.loginRow}>
        <AppText variant="bodySmall" color="muted">
          {t('register.haveAccount')}{' '}
        </AppText>
        <AppText
          variant="bodySmall"
          weight="600"
          style={styles.underline}
          onPress={() => router.replace('/login')}
          accessibilityRole="link"
        >
          {t('auth.logIn')}
        </AppText>
      </View>
    </Screen>
  );
}

const AVATAR = 64;

const useStyles = makeStyles((t) => ({
  title: { marginTop: t.spacing.xl, marginBottom: t.spacing.xl },
  photoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: t.spacing.lg },
  photoLabel: { marginBottom: t.spacing.xs },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: t.borderWidth,
    borderStyle: 'dashed',
    borderColor: t.colors.muted,
    backgroundColor: t.colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: AVATAR - 4, height: AVATAR - 4, borderRadius: (AVATAR - 4) / 2 },
  avatarBadge: {
    position: 'absolute',
    end: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: t.borderWidth,
    borderColor: t.colors.ink,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  usernameField: { flex: 1, marginStart: t.spacing.md, marginTop: t.spacing.xs },
  field: { marginBottom: t.spacing.lg },
  birthdayLabel: { marginBottom: t.spacing.xs },
  birthdayRow: { flexDirection: 'row', gap: t.spacing.sm },
  dayField: { flex: 1 },
  monthField: { flex: 1.3 },
  yearField: { flex: 1.3 },
  inlineError: { marginTop: t.spacing.xxs },
  terms: { marginTop: t.spacing.xl, marginBottom: t.spacing.lg },
  underline: { textDecorationLine: 'underline' },
  formError: { marginBottom: t.spacing.md },
  submit: { marginTop: t.spacing.xs },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: t.spacing.lg,
    flexWrap: 'wrap',
  },
}));
