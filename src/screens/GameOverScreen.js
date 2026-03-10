import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const GameOverScreen = ({ score, highScore, onRestart, onMenu }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Over! 🐍</Text>

      <View style={styles.scoreContainer}>
        <Text style={styles.finalScoreLabel}>Pontuação Final:</Text>
        <Text style={styles.finalScore}>{score}</Text>

        {score >= highScore && score > 0 && (
          <View style={styles.newRecordBadge}>
            <Text style={styles.newRecordText}>🏆 Novo Recorde!</Text>
          </View>
        )}

        <Text style={styles.highScoreLabel}>Recorde: {highScore}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={onRestart}
      >
        <Text style={styles.buttonText}>Jogar Novamente</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={onMenu}
      >
        <Text style={styles.buttonText}>Menu Principal</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 30,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  finalScoreLabel: {
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 10,
  },
  finalScore: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 10,
  },
  newRecordBadge: {
    backgroundColor: '#FFD93D',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    marginTop: 10,
    marginBottom: 10,
  },
  newRecordText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  highScoreLabel: {
    fontSize: 24,
    color: '#FFD93D',
    marginTop: 5,
  },
  button: {
    width: 300,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
  },
  secondaryButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default GameOverScreen;
