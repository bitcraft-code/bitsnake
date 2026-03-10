import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = '@bitsnake_language';

const resources = {
  en: { translation: require('./locales/en.json') },
  de: { translation: require('./locales/de.json') },
  fr: { translation: require('./locales/fr.json') },
  es: { translation: require('./locales/es.json') },
  pt: { translation: require('./locales/pt.json') },
};

const supportedLngs = ['en', 'de', 'fr', 'es', 'pt'];

const getDeviceLocale = () => {
  try {
    let locale = 'en';
    if (Platform.OS === 'ios' && NativeModules.SettingsManager?.settings?.AppleLocale) {
      locale = NativeModules.SettingsManager.settings.AppleLocale;
    } else if (NativeModules.I18nManager?.localeIdentifier) {
      locale = NativeModules.I18nManager.localeIdentifier;
    }
    const code = (locale || 'en').split(/[-_]/)[0];
    return supportedLngs.includes(code) ? code : 'en';
  } catch {
    return 'en';
  }
};

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  supportedLngs,
  lng: getDeviceLocale(),
  interpolation: { escapeValue: false },
});

export const loadSavedLanguage = async () => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && supportedLngs.includes(saved)) {
      await i18n.changeLanguage(saved);
      return saved;
    }
  } catch (e) {
    // ignore
  }
  return i18n.language;
};

export const setSavedLanguage = async (lng) => {
  if (!supportedLngs.includes(lng)) return;
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    await i18n.changeLanguage(lng);
  } catch (e) {
    // ignore
  }
};

export { supportedLngs };
export default i18n;
