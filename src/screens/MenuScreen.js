import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import RetroText from '../components/RetroText';
import MenuBackgroundSnakes from '../components/MenuBackgroundSnakes';
import { FONT_FAMILY } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SPACING = 12;

const OptionCheckbox = ({ value, onValueChange }) => (
  <Pressable
    onPress={() => onValueChange(!value)}
    style={[styles.optionCheckbox, value && styles.optionCheckboxChecked]}
  >
    {value ? <RetroText style={styles.optionCheckboxMark}>✓</RetroText> : null}
  </Pressable>
);

const MenuScreen = ({
  onStart,
  wallMode,
  setWallMode,
  obstaclesEnabled,
  setObstaclesEnabled,
  speedLevel,
  setSpeedLevel,
  controlMode,
  setControlMode,
  setSavedLanguage,
  i18n,
  supportedLngs,
  languageLabels,
  speedLevels,
  onOpenInstructions,
  onOpenLeaderboard,
}) => {
  const { t } = useTranslation();
  const [optionsOpen, setOptionsOpen] = useState(false);

  return (
    <View style={styles.root}>
      <View style={styles.screenWrap}>
        <View style={styles.backgroundLayer} pointerEvents="none">
          <MenuBackgroundSnakes />
        </View>
        <ScrollView
          contentContainerStyle={styles.container}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          style={styles.scrollFill}
        >
        <View style={styles.contentBack} pointerEvents="box-none">
          <View style={styles.titleBox}>
            <RetroText style={styles.title}>BITSNAKE</RetroText>
            <View style={styles.titleGlow} />
          </View>
          <RetroText style={styles.subtitle}>{t('menu.subtitle')}</RetroText>

          <TouchableOpacity onPress={onStart} style={styles.startButton} activeOpacity={0.7}>
            <RetroText style={styles.buttonText}>{t('menu.startGame')}</RetroText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setOptionsOpen(true)}
            style={styles.optionsButton}
            activeOpacity={0.7}
          >
            <View style={styles.optionsButtonContent}>
              {t('menu.gameOptionsIcon') ? (
                <RetroText style={[styles.optionsButtonText, styles.optionsButtonIcon]}>{t('menu.gameOptionsIcon')}</RetroText>
              ) : null}
              <RetroText style={styles.optionsButtonText}>{t('menu.gameOptions')}</RetroText>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpacer} />
        <RetroText style={styles.footer}>BitCraft Team®</RetroText>
      </ScrollView>
      </View>

      <Modal
        visible={optionsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setOptionsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOptionsOpen(false)} />
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <RetroText style={styles.modalTitle}>{t('game.options')}</RetroText>
              <Pressable
                onPress={() => setOptionsOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <RetroText style={styles.modalCloseText}>✕</RetroText>
              </Pressable>
            </View>
            <ScrollView style={styles.modalContent} scrollEnabled={false} showsVerticalScrollIndicator={false}>
              <View style={styles.optionRow}>
                <RetroText style={styles.optionLabel}>{t('game.optionGhostWalls')}</RetroText>
                <OptionCheckbox
                  value={wallMode === 'wrap'}
                  onValueChange={(v) => setWallMode(v ? 'wrap' : 'normal')}
                />
              </View>
              <View style={styles.optionRow}>
                <RetroText style={styles.optionLabel}>{t('game.optionObstacles')}</RetroText>
                <OptionCheckbox value={obstaclesEnabled} onValueChange={setObstaclesEnabled} />
              </View>
              <View style={styles.optionRow}>
                <RetroText style={[styles.optionLabel, styles.optionLabelNoFlex]}>{t('game.optionSpeed')}</RetroText>
                <View style={styles.buttonsRow}>
                  {(speedLevels || [1, 2, 3, 4, 5]).map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => setSpeedLevel(level)}
                      style={[styles.langBtn, speedLevel === level && styles.langBtnActive]}
                    >
                      <RetroText style={[styles.langBtnText, speedLevel === level && styles.langBtnTextActive]}>
                        {level}
                      </RetroText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.optionRow}>
                <RetroText style={[styles.optionLabel, styles.optionLabelNoFlex]}>{t('game.optionControls')}</RetroText>
                <View style={styles.buttonsRow}>
                  <Pressable
                    onPress={() => setControlMode('dpad')}
                    style={[styles.langBtn, controlMode === 'dpad' && styles.langBtnActive]}
                  >
                    <RetroText style={[styles.langBtnText, controlMode === 'dpad' && styles.langBtnTextActive]}>
                      {t('game.controlDpad')}
                    </RetroText>
                  </Pressable>
                  <Pressable
                    onPress={() => setControlMode('trackpad')}
                    style={[styles.langBtn, controlMode === 'trackpad' && styles.langBtnActive]}
                  >
                    <RetroText style={[styles.langBtnText, controlMode === 'trackpad' && styles.langBtnTextActive]}>
                      {t('game.controlTrackpad')}
                    </RetroText>
                  </Pressable>
                </View>
              </View>
              <View style={styles.optionRow}>
                <RetroText style={[styles.optionLabel, styles.optionLabelNoFlex]}>{t('menu.language')}</RetroText>
                <View style={styles.buttonsRow}>
                  {(supportedLngs || []).map((lng) => (
                    <Pressable
                      key={lng}
                      onPress={() => setSavedLanguage(lng)}
                      style={[styles.langBtn, i18n?.language === lng && styles.langBtnActive]}
                    >
                      <RetroText style={[styles.langBtnText, i18n?.language === lng && styles.langBtnTextActive]}>
                        {languageLabels?.[lng] ?? lng}
                      </RetroText>
                    </Pressable>
                  ))}
                </View>
              </View>
              {onOpenInstructions ? (
                <Pressable
                  onPress={() => {
                    setOptionsOpen(false);
                    onOpenInstructions();
                  }}
                  style={({ pressed }) => [styles.optionRow, styles.optionRowPressable, pressed && styles.optionRowPressed]}
                >
                  <RetroText style={styles.optionLabel}>{t('menu.instructions')}</RetroText>
                  <RetroText style={styles.optionRowArrow}>›</RetroText>
                </Pressable>
              ) : null}
              {onOpenLeaderboard ? (
                <Pressable
                  onPress={() => {
                    setOptionsOpen(false);
                    onOpenLeaderboard();
                  }}
                  style={({ pressed }) => [styles.optionRow, styles.optionRowPressable, pressed && styles.optionRowPressed]}
                >
                  <RetroText style={styles.optionLabel}>{t('menu.leaderboard')}</RetroText>
                  <RetroText style={styles.optionRowArrow}>›</RetroText>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screenWrap: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  scrollFill: {
    flex: 1,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 32,
  },
  contentBack: {
    backgroundColor: '#0a0e1a',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  titleBox: {
    marginBottom: 4,
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH - 48,
  },
  title: {
    fontSize: 40,
    color: '#00ff41',
    letterSpacing: 6,
    textShadowColor: '#00ff41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    textAlign: 'center',
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
    textAlign: 'center',
    maxWidth: SCREEN_WIDTH - 48,
  },
  startButton: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00ff41',
    paddingVertical: 16,
    paddingHorizontal: 54,
    borderRadius: 4,
    marginBottom: 18,
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#00ff41',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  optionsButton: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff8800',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 4,
    shadowColor: '#ff8800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  optionsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionsButtonText: {
    color: '#ff8800',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: FONT_FAMILY,
  },
  optionsButtonIcon: {
    fontSize: 22,
    transform: [{ translateY: -2 }],
  },
  footerSpacer: {
    flex: 1,
    minHeight: 24,
  },
  footer: {
    fontSize: 9,
    color: '#00aa33',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalPanel: {
    width: SCREEN_WIDTH,
    alignSelf: 'stretch',
    backgroundColor: '#0d1419',
    borderLeftWidth: 1,
    borderLeftColor: '#1a3322',
    paddingTop: SPACING * 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING,
    paddingBottom: SPACING,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3322',
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: '#00ff41',
    letterSpacing: 2,
  },
  modalCloseBtn: {
    padding: SPACING / 2,
  },
  modalCloseText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: '#ff8800',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING,
    paddingTop: SPACING,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3322',
  },
  optionLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#e0e0e0',
    flex: 1,
    marginRight: SPACING,
  },
  optionLabelNoFlex: {
    flex: 0,
  },
  optionRowPressable: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a3322',
  },
  optionRowPressed: {
    opacity: 0.8,
  },
  optionRowArrow: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    color: '#00ff41',
  },
  optionCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#00ff41',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCheckboxChecked: {
    backgroundColor: 'rgba(0, 255, 65, 0.22)',
  },
  optionCheckboxMark: {
    fontFamily: FONT_FAMILY,
    color: '#00ff41',
    fontSize: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING / 2,
  },
  langBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1a3322',
    backgroundColor: '#0d1419',
  },
  langBtnActive: {
    borderColor: '#00ff41',
    backgroundColor: '#0a2a1a',
  },
  langBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    color: '#4a6a4a',
    letterSpacing: 1,
  },
  langBtnTextActive: {
    fontFamily: FONT_FAMILY,
    color: '#00ff41',
  },
});

export default MenuScreen;
