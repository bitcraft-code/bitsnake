import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setSavedLanguage, supportedLngs } from '../i18n';

const languageLabels = { en: 'EN', de: 'DE', fr: 'FR', es: 'ES', pt: 'PT' };

const MenuScreen = ({ onStart }) => {
  const { t, i18n } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.titleBox}>
        <Text style={styles.title}>BITSNAKE</Text>
        <View style={styles.titleGlow} />
      </View>
      <Text style={styles.subtitle}>{t('menu.subtitle')}</Text>

      <TouchableOpacity onPress={onStart} style={styles.startButton} activeOpacity={0.7}>
        <Text style={styles.buttonText}>{t('menu.startGame')}</Text>
      </TouchableOpacity>

      <View style={styles.languageRow}>
        <Text style={styles.languageLabel}>{t('menu.language')}</Text>
        <View style={styles.languageButtons}>
          {supportedLngs.map((lng) => (
            <TouchableOpacity
              key={lng}
              onPress={() => setSavedLanguage(lng)}
              style={[styles.langBtn, i18n.language === lng && styles.langBtnActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.langBtnText, i18n.language === lng && styles.langBtnTextActive]}>
                {languageLabels[lng]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>{t('menu.howToPlay')}</Text>
        <Text style={styles.instructionsText}>
          {t('menu.instruction1')}{'\n'}
          {t('menu.instruction2')}{'\n'}
          {t('menu.instruction3')}
        </Text>
      </View>

      <Text style={styles.footer}>BitCraft Team</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0a0e1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  titleBox: {
    marginBottom: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#00ff41',
    letterSpacing: 6,
    textShadowColor: '#00ff41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleGlow: {
    width: 220,
    height: 3,
    backgroundColor: '#00ff41',
    borderRadius: 2,
    marginTop: 6,
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4a6a4a',
    marginBottom: 36,
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  startButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00ff41',
    paddingVertical: 16,
    paddingHorizontal: 54,
    borderRadius: 4,
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#00ff41',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 8,
  },
  languageLabel: {
    fontSize: 12,
    color: '#4a6a4a',
    marginRight: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  langBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#1a3a1a',
    backgroundColor: '#0d1a0d',
  },
  langBtnActive: {
    borderColor: '#00ff41',
    backgroundColor: '#0a2a0a',
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2a4a2a',
    letterSpacing: 1,
  },
  langBtnTextActive: {
    color: '#00ff41',
  },
  instructions: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#111a2a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1a3322',
    width: '90%',
  },
  instructionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00ff41',
    marginBottom: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  instructionsText: {
    fontSize: 13,
    color: '#5a7a5a',
    lineHeight: 22,
  },
  footer: {
    marginTop: 32,
    fontSize: 10,
    color: '#1a2a1a',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});

export default MenuScreen;
