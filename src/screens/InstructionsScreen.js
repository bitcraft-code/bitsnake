import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import RetroText from '../components/RetroText';
import { THEMES } from '../theme';

const InstructionsScreen = ({ theme = 'dark', onBack }) => {
  const { t } = useTranslation();
  const themeColors = THEMES[theme] || THEMES.dark;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <RetroText
        style={[
          styles.title,
          { color: themeColors.primary, textShadowColor: themeColors.primary },
        ]}
      >
        {t('instructions.title')}
      </RetroText>
      <View
        style={[
          styles.titleLine,
          { backgroundColor: themeColors.primary },
        ]}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        <View
          style={[
            styles.section,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <RetroText style={[styles.sectionTitle, { color: themeColors.primary }]}>
            {t('instructions.howToPlay')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('menu.instruction1')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('menu.instruction2')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('menu.instruction3')}
          </RetroText>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <RetroText style={[styles.sectionTitle, { color: themeColors.primary }]}>
            {t('instructions.rewards')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('instructions.rewardsIntro')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('instructions.rewards1')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('instructions.rewards2')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('instructions.rewards3')}
          </RetroText>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <RetroText style={[styles.sectionTitle, { color: themeColors.primary }]}>
            {t('instructions.variations')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('instructions.walls')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('instructions.obstacles')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('instructions.speed')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('instructions.controls')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('instructions.theme')}
          </RetroText>
          <RetroText style={[styles.paragraph, { color: themeColors.textMuted2 }]}>
            {t('instructions.zoom')}
          </RetroText>
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={onBack}
        style={[
          styles.backButton,
          {
            borderColor: themeColors.primary,
            shadowColor: themeColors.primary,
          },
        ]}
        activeOpacity={0.7}
      >
        <RetroText style={[styles.backButtonText, { color: themeColors.primary }]}>
          {t('instructions.back')}
        </RetroText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    color: '#00ff41',
    letterSpacing: 4,
    textShadowColor: '#00ff41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  titleLine: {
    width: 140,
    height: 2,
    backgroundColor: '#00ff41',
    borderRadius: 1,
    marginTop: 6,
    marginBottom: 16,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#111a2a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1a3322',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 11,
    color: '#00ff41',
    marginBottom: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  paragraph: {
    fontSize: 11,
    color: '#5a7a5a',
    lineHeight: 20,
    marginBottom: 8,
  },
  backButton: {
    borderWidth: 2,
    borderColor: '#00ff41',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#00ff41',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default InstructionsScreen;
