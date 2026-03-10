import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { registerRootComponent } from 'expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './src/i18n';
import { loadSavedLanguage } from './src/i18n';
import { useTranslation } from 'react-i18next';
import GameBoard from './src/components/GameBoard';
import MenuScreen from './src/screens/MenuScreen';
import GameOverScreen from './src/screens/GameOverScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const difficultySettings = {
  easy: { speed: 200, size: 15 },
  medium: { speed: 150, size: 20 },
  hard: { speed: 100, size: 20 },
  expert: { speed: 70, size: 20 },
};

export default function App() {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState('menu');
  const [difficulty, setDifficulty] = useState('medium');
  const [boardSize, setBoardSize] = useState(20);
  const [wallMode, setWallMode] = useState('normal');

  const [snake, setSnake] = useState([]);
  const [food, setFood] = useState(null);
  const [direction, setDirection] = useState('right');
  const [nextDirection, setNextDirection] = useState('right');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const gameLoopRef = useRef(null);
  const nextDirectionRef = useRef('right');

  useEffect(() => {
    loadHighScore();
    loadSavedLanguage();
  }, []);

  const loadHighScore = async () => {
    try {
      const saved = await AsyncStorage.getItem('snakeHighScore');
      if (saved) setHighScore(parseInt(saved, 10));
    } catch (error) {
      console.error('Failed to load high score:', error);
      setHighScore(0);
    }
  };

  const saveHighScore = async () => {
    try {
      await AsyncStorage.setItem('snakeHighScore', highScore.toString());
    } catch (error) {
      console.error('Failed to save high score:', error);
    }
  };

  const initGame = () => {
    const startRow = Math.floor(boardSize / 2);
    const startCol = Math.floor(boardSize / 2);

    const initialSnake = [
      { row: startRow, col: startCol },
      { row: startRow, col: startCol - 1 },
      { row: startRow, col: startCol - 2 },
    ];

    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setScore(0);
    setDirection('right');
    setNextDirection('right');
    nextDirectionRef.current = 'right';
    setPaused(false);
    setOptionsOpen(false);
    setGameState('playing');
  };

  const generateFood = (currentSnake) => {
    let newFood;
    let onSnake;

    do {
      onSnake = false;
      newFood = {
        row: Math.floor(Math.random() * boardSize),
        col: Math.floor(Math.random() * boardSize),
      };

      for (let segment of currentSnake || []) {
        if (segment.row === newFood.row && segment.col === newFood.col) {
          onSnake = true;
          break;
        }
      }
    } while (onSnake);

    return newFood;
  };

  const moveSnake = () => {
    const currentDirection = nextDirectionRef.current;
    setDirection(currentDirection);
    setSnake((prevSnake) => {
      const head = { ...prevSnake[0] };

      switch (currentDirection) {
        case 'up':
          head.row--;
          break;
        case 'down':
          head.row++;
          break;
        case 'left':
          head.col--;
          break;
        case 'right':
          head.col++;
          break;
      }

      if (wallMode === 'normal') {
        if (
          head.row < 0 ||
          head.row >= boardSize ||
          head.col < 0 ||
          head.col >= boardSize
        ) {
          handleGameOver();
          return prevSnake;
        }
      } else {
        if (head.row < 0) head.row = boardSize - 1;
        if (head.row >= boardSize) head.row = 0;
        if (head.col < 0) head.col = boardSize - 1;
        if (head.col >= boardSize) head.col = 0;
      }

      const ateFood = food && head.row === food.row && head.col === food.col;
      if (ateFood) {
        setScore((s) => s + 10);
        const newSnake = [head, ...prevSnake];
        setFood(generateFood(newSnake));
        return newSnake;
      } else {
        return [head, ...prevSnake.slice(0, -1)];
      }
    });

    // Verificar colisão com próprio corpo (após mover)
    setSnake((prevSnake) => {
      const newHead = prevSnake[0];
      for (let i = 1; i < prevSnake.length; i++) {
        if (
          newHead.row === prevSnake[i].row &&
          newHead.col === prevSnake[i].col
        ) {
          handleGameOver();
          return prevSnake;
        }
      }
      return prevSnake;
    });
  };

  const handleGameOver = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    if (score > highScore) {
      setHighScore(score);
      saveHighScore();
    }

    setGameState('gameOver');
  };

  useEffect(() => {
    if (gameState !== 'playing' || paused) return;

    gameLoopRef.current = setInterval(
      moveSnake,
      difficultySettings[difficulty].speed,
    );

    return () => clearInterval(gameLoopRef.current);
  }, [gameState, paused]);

  const handleDirectionChange = (newDir) => {
    if (!['up', 'down', 'left', 'right'].includes(newDir)) return;
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (direction !== opposites[newDir]) {
      nextDirectionRef.current = newDir;
      setNextDirection(newDir);
    }
  };

  const togglePause = () => {
    setPaused((prev) => !prev);
  };

  const restartGame = () => initGame();

  const goMenu = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    setOptionsOpen(false);
    setGameState('menu');
  };

  const openOptions = () => {
    setPaused(true);
    setOptionsOpen(true);
  };

  const closeOptions = () => {
    setOptionsOpen(false);
    // Jogo permanece em pausa; o usuário retoma pelo botão ▶/❚❚ do D-pad
  };

  // RENDERIZAÇÃO CONDICIONAL BASEADA NO ESTADO DO JOGO
  if (gameState === 'menu') {
    return <MenuScreen onStart={initGame} />;
  }

  if (gameState === 'gameOver') {
    return (
      <GameOverScreen
        score={score}
        highScore={highScore}
        onRestart={restartGame}
        onMenu={goMenu}
      />
    );
  }

  // Layout responsivo para mobile - estado 'playing'
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBlock}>
          <Text style={styles.scoreLabel}>{t('game.score')}</Text>
          <Text style={styles.score}>{score}</Text>
        </View>
        <View style={styles.headerBlock}>
          <Text style={styles.highScoreLabel}>{t('game.record')}</Text>
          <Text style={styles.highScoreValue}>{highScore}</Text>
        </View>
        <TouchableOpacity
          onPress={openOptions}
          style={styles.optionsButton}
          activeOpacity={0.7}
        >
          <Text style={styles.optionsButtonText}>⚙</Text>
        </TouchableOpacity>
      </View>

      <GameBoard snake={snake} food={food} boardSize={boardSize} />

      <View style={styles.dpadContainer}>
        <TouchableOpacity
          onPress={() => handleDirectionChange('up')}
          activeOpacity={0.7}
          style={styles.dpadBtn}
        >
          <Text style={styles.arrow}>▲</Text>
        </TouchableOpacity>

        <View style={styles.middleRow}>
          <TouchableOpacity
            onPress={() => handleDirectionChange('left')}
            activeOpacity={0.7}
            style={styles.dpadBtn}
          >
            <Text style={styles.arrow}>◀</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePause}
            activeOpacity={0.7}
            style={[
              styles.dpadCenter,
              paused && styles.dpadCenterPaused,
            ]}
          >
            <Text style={styles.centerIcon}>{paused ? '▶' : '❚❚'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDirectionChange('right')}
            activeOpacity={0.7}
            style={styles.dpadBtn}
          >
            <Text style={styles.arrow}>▶</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => handleDirectionChange('down')}
          activeOpacity={0.7}
          style={styles.dpadBtn}
        >
          <Text style={styles.arrow}>▼</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={goMenu} style={styles.menuButton} activeOpacity={0.7}>
        <Text style={styles.menuButtonText}>{t('game.mainMenu')}</Text>
      </TouchableOpacity>

      <Modal
        visible={optionsOpen}
        transparent
        animationType="slide"
        onRequestClose={closeOptions}
      >
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerBackdrop} onPress={closeOptions} />
          <View style={styles.drawerPanel}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{t('game.options')}</Text>
              <TouchableOpacity
                onPress={closeOptions}
                style={styles.drawerCloseBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.drawerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.drawerContent}>
              {/* Opções serão adicionadas em commits futuros */}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0a0e1a',
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT > 800 ? 20 : 40,
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '92%',
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#111a2a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1a3322',
  },
  headerBlock: {
    alignItems: 'center',
  },
  optionsButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsButtonText: {
    fontSize: 22,
    color: '#ff8800',
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerPanel: {
    width: Math.min(SCREEN_WIDTH * 0.85, 320),
    alignSelf: 'stretch',
    backgroundColor: '#0d1419',
    borderLeftWidth: 1,
    borderLeftColor: '#1a3322',
    paddingTop: 48,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3322',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00ff41',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  drawerCloseBtn: {
    padding: 4,
  },
  drawerCloseText: {
    fontSize: 20,
    color: '#ff8800',
    fontWeight: 'bold',
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4a6a4a',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  score: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00ff41',
    textShadowColor: '#00ff41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  highScoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5a4a2a',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  highScoreValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ff8800',
    textShadowColor: '#ff8800',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  dpadContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  middleRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  dpadBtn: {
    width: 62,
    height: 62,
    backgroundColor: '#0d1a14',
    borderWidth: 1,
    borderColor: '#00ff41',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  dpadCenter: {
    width: 58,
    height: 58,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ff8800',
    backgroundColor: '#1a1200',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#ff8800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  dpadCenterPaused: {
    borderColor: '#00ff41',
    backgroundColor: '#0a1a0a',
    shadowColor: '#00ff41',
  },
  arrow: {
    fontSize: 24,
    color: '#00ff41',
    fontWeight: 'bold',
  },
  centerIcon: {
    fontSize: 14,
    color: '#ff8800',
    fontWeight: 'bold',
  },

  menuButton: {
    borderWidth: 1,
    borderColor: '#ff3333',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 4,
    shadowColor: '#ff3333',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  menuButtonText: {
    color: '#ff3333',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

registerRootComponent(App);
