import { Linking } from 'react-native';
import { LINKS } from '../constants/config';
import i18n from '../i18n';

type ShowMessage = (title: string, message: string) => Promise<boolean>;

/** Opens a configured link, or explains that the page isn't ready yet. */
export async function openAppLink(key: keyof typeof LINKS, title: string, showMessage: ShowMessage) {
  const url = LINKS[key];
  if (!url) {
    await showMessage(title, i18n.t('links.unavailable'));
    return;
  }
  try {
    await Linking.openURL(url);
  } catch {
    await showMessage(title, i18n.t('links.failed'));
  }
}
