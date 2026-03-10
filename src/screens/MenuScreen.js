import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const MenuScreen = ({ onStart }) => {
  const [difficulty, setDifficulty] = useState('medium');
  const [boardSize, setBoardSize] = useState(20);
  const [wallMode, setWallMode] = useState('normal');

  const difficultyOptions = [
    { value: 'easy', label: 'Fácil', speed: 200 },
    { value: 'medium', label: 'Médio', speed: 150 },
    { value: 'hard', label: 'Difícil', speed: 100 },
    { value: 'expert', label: 'Expert', speed: 70 },
  ];

  const sizeOptions = [
    { value: 15, label: 'Pequeno (15x15)' },
    { value: 20, label: 'Médio (20x20)' },
    { value: 25, label: 'Grande (25x25)' },
  ];

  const wallOptions = [
    { value: 'normal', label: 'Normal - Game Over ao bater' },
    { value: 'teleport', label: 'Teleporte - Passa pelas paredes' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🐍 Jogo Snake</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dificuldade:</Text>
        {difficultyOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              difficulty === option.value && styles.activeOption,
            ]}
            onPress={() => setDifficulty(option.value)}
          >
            <Text
              style={
                difficulty === option.value
                  ? styles.activeText
                  : styles.optionText
              }
            >
              {option.label} ({option.speed}ms)
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tamanho do Tabuleiro:</Text>
        {sizeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              boardSize === option.value && styles.activeOption,
            ]}
            onPress={() => setBoardSize(option.value)}
          >
            <Text
              style={
                boardSize === option.value
                  ? styles.activeText
                  : styles.optionText
              }
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modo de Parede:</Text>
        {wallOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              wallMode === option.value && styles.activeOption,
            ]}
            onPress={() => setWallMode(option.value)}
          >
            <Text
              style={
                wallMode === option.value
                  ? styles.activeText
                  : styles.optionText
              }
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, styles.startButton]}
        onPress={() => onStart()}
      >
        <Text style={styles.buttonText}>🎮 INICIAR JOGO</Text>
      </TouchableOpacity>

      <Text style={styles.instructions}>
        Use os controles na tela ou teclado para controlar a cobra.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4ECDC4',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeOption: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  optionText: {
    color: '#333',
    fontSize: 16,
  },
  activeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  startButton: {
    backgroundColor: '#FF6B6B',
    width: '80%',
    alignSelf: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  instructions: {
    textAlign: 'center',
    color: '#666',
    marginTop: 30,
    paddingHorizontal: 20,
  },
});

export default MenuScreen;
