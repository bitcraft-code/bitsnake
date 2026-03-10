import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import RetroText from '../components/RetroText';

const MenuScreen = ({ onStart }) => {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.titleBox}>
        <RetroText style={styles.title}>BITSNAKE</RetroText>
        <View style={styles.titleGlow} />
      </View>
      <RetroText style={styles.subtitle}>{t('menu.subtitle')}</RetroText>

      <TouchableOpacity onPress={onStart} style={styles.startButton} activeOpacity={0.7}>
        <RetroText style={styles.buttonText}>{t('menu.startGame')}</RetroText>
      </TouchableOpacity>

      <View style={styles.instructions}>
        <RetroText style={styles.instructionTitle}>{t('menu.howToPlay')}</RetroText>
        <RetroText style={styles.instructionsText}>
          {t('menu.instruction1')}{'\n'}
          {t('menu.instruction2')}{'\n'}
          {t('menu.instruction3')}
        </RetroText>
      </View>

      <RetroText style={styles.footer}>BitCraft Team</RetroText>
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
    fontSize: 40,
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
    fontSize: 11,
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
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
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
    fontSize: 11,
    color: '#00ff41',
    marginBottom: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  instructionsText: {
    fontSize: 11,
    color: '#5a7a5a',
    lineHeight: 18,
  },
  footer: {
    marginTop: 32,
    fontSize: 9,
    color: '#1a2a1a',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});

export default MenuScreen;
