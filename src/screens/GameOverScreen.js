import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import RetroText from '../components/RetroText';

const GameOverScreen = ({ score, highScore, onRestart, onMenu }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <RetroText style={styles.title}>GAME OVER</RetroText>
      <View style={styles.titleLine} />

      <View style={styles.scoreCard}>
        <RetroText style={styles.scoreLabel}>{t('gameOver.yourScore')}</RetroText>
        <RetroText style={styles.scoreValue}>{score}</RetroText>

        {score >= highScore && score > 0 && (
          <View style={styles.newRecordBadge}>
            <RetroText style={styles.newRecordText}>{t('gameOver.newRecord')}</RetroText>
          </View>
        )}
      </View>

      <View style={styles.highScoreCard}>
        <RetroText style={styles.highScoreLabel}>{t('gameOver.highScore')}</RetroText>
        <RetroText style={styles.highScoreValue}>{highScore}</RetroText>
      </View>

      <TouchableOpacity onPress={onRestart} style={styles.restartButton} activeOpacity={0.7}>
        <RetroText style={styles.buttonText}>{t('gameOver.playAgain')}</RetroText>
      </TouchableOpacity>

      <TouchableOpacity onPress={onMenu} style={styles.menuButton} activeOpacity={0.7}>
        <RetroText style={styles.buttonTextSecondary}>{t('gameOver.backToMenu')}</RetroText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 34,
    color: '#ff3333',
    letterSpacing: 4,
    textShadowColor: '#ff3333',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  titleLine: {
    width: 180,
    height: 3,
    backgroundColor: '#ff3333',
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 30,
    shadowColor: '#ff3333',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  scoreCard: {
    backgroundColor: '#111a2a',
    padding: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1a3322',
    alignItems: 'center',
    width: '85%',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#4a6a4a',
    marginBottom: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 40,
    color: '#00ff41',
    textShadowColor: '#00ff41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  newRecordBadge: {
    borderWidth: 1,
    borderColor: '#ff8800',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 3,
    marginTop: 12,
    shadowColor: '#ff8800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  newRecordText: {
    color: '#ff8800',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  highScoreCard: {
    backgroundColor: '#111a2a',
    padding: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1a2233',
    alignItems: 'center',
    width: '85%',
    marginBottom: 30,
  },
  highScoreLabel: {
    fontSize: 10,
    color: '#4a5a6a',
    marginBottom: 6,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  highScoreValue: {
    fontSize: 24,
    color: '#ff8800',
    textShadowColor: '#ff8800',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  restartButton: {
    borderWidth: 2,
    borderColor: '#00ff41',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 44,
    borderRadius: 4,
    marginBottom: 14,
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  menuButton: {
    borderWidth: 2,
    borderColor: '#ff3333',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 44,
    borderRadius: 4,
    shadowColor: '#ff3333',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#00ff41',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  buttonTextSecondary: {
    color: '#ff3333',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default GameOverScreen;
