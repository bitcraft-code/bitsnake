import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import RetroText from '../components/RetroText';

const MOVES_REF = 80;
const TIME_REF_SEC = 90;
const BONUS_MAX = 0.5;

const GameOverScreen = ({ score, highScore, moveCount = 0, elapsedSeconds = 0, onRestart, onMenu, onLeaderboard }) => {
  const { t } = useTranslation();

  const moveBonus = BONUS_MAX * Math.max(0, 1 - moveCount / MOVES_REF);
  const timeBonus = BONUS_MAX * Math.max(0, 1 - elapsedSeconds / TIME_REF_SEC);
  const multiplier = 1 + moveBonus + timeBonus;
  const moveBonusPct = Math.round(moveBonus * 100);
  const timeBonusPct = Math.round(timeBonus * 100);
  const timeStr = `${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      <View style={styles.calcCard}>
        <RetroText style={styles.calcTitle}>{t('gameOver.calcTitle')}</RetroText>
        <RetroText style={styles.calcLine}>{t('gameOver.calcMoves', { count: moveCount })}</RetroText>
        <RetroText style={styles.calcLine}>{t('gameOver.calcTime', { time: timeStr })}</RetroText>
        <RetroText style={styles.calcLine}>{t('gameOver.calcBonusMoves', { pct: moveBonusPct })}</RetroText>
        <RetroText style={styles.calcLine}>{t('gameOver.calcBonusTime', { pct: timeBonusPct })}</RetroText>
        <RetroText style={styles.calcFormula}>
          {t('gameOver.calcMultiplier', { move: moveBonusPct, time: timeBonusPct, total: multiplier.toFixed(2) })}
        </RetroText>
      </View>

      <View style={styles.highScoreCard}>
        <RetroText style={styles.highScoreLabel}>{t('gameOver.highScore')}</RetroText>
        <RetroText style={styles.highScoreValue}>{highScore}</RetroText>
      </View>

      <TouchableOpacity onPress={onRestart} style={styles.restartButton} activeOpacity={0.7}>
        <RetroText style={styles.buttonText}>{t('gameOver.playAgain')}</RetroText>
      </TouchableOpacity>

      {onLeaderboard ? (
        <TouchableOpacity onPress={onLeaderboard} style={styles.leaderboardButton} activeOpacity={0.7}>
          <RetroText style={styles.leaderboardButtonText}>{t('gameOver.leaderboard')}</RetroText>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity onPress={onMenu} style={styles.menuButton} activeOpacity={0.7}>
        <RetroText style={styles.buttonTextSecondary}>{t('gameOver.backToMenu')}</RetroText>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0a0e1a',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 32,
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
  calcCard: {
    backgroundColor: '#0d1419',
    padding: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1a3322',
    width: '85%',
    marginBottom: 14,
    alignItems: 'center',
  },
  calcTitle: {
    fontSize: 9,
    color: '#4a6a4a',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  calcLine: {
    fontSize: 10,
    color: '#5a7a5a',
    marginBottom: 6,
    lineHeight: 22,
    textAlign: 'center',
  },
  calcFormula: {
    fontSize: 10,
    color: '#00ff41',
    marginTop: 12,
    letterSpacing: 1,
    lineHeight: 22,
    textAlign: 'center',
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
    marginBottom: 18,
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  leaderboardButton: {
    borderWidth: 1,
    borderColor: '#00aa33',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 4,
    marginBottom: 18,
  },
  leaderboardButtonText: {
    color: '#00aa33',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
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
