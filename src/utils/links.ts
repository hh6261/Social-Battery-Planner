import { Linking } from 'react-native';
import { LINKS } from '../constants/config';

type ShowMessage = (title: string, message: string) => Promise<boolean>;

/** Opens a configured link, or explains that the page isn't ready yet. */
export async function openAppLink(key: keyof typeof LINKS, title: string, showMessage: ShowMessage) {
  const url = LINKS[key];
  if (!url) {
    await showMessage(title, 'This page isn’t available yet. Please check back soon.');
    return;
  }
  try {
    await Linking.openURL(url);
  } catch {
    await showMessage(title, 'We couldn’t open this page. Please try again later.');
  }
}
