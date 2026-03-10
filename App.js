import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import { registerRootComponent } from 'expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './src/i18n';
import { loadSavedLanguage, setSavedLanguage, supportedLngs } from './src/i18n';
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

const SPACING = 12;

const languageLabels = { en: 'EN', de: 'DE', fr: 'FR', es: 'ES', pt: 'PT' };

// Velocidade premium: 1 = mais lento, 5 = mais rápido (intervalo em ms)
const SPEED_LEVEL_MS = { 1: 250, 2: 200, 3: 150, 4: 100, 5: 70 };
const SPEED_LEVELS = [1, 2, 3, 4, 5];

// Comidas 2 e 3 pontos: piscam após X s e expiram após Y s
const FOOD_BLINK_START_MS = 4000;
const FOOD_EXPIRE_MS = 8000;
const FOOD_BLINK_INTERVAL_MS = 200;

// Se ficar X s sem nenhuma comida visível, gera novas (sem pontuar)
const NO_FOOD_SPAWN_MS = 5000;

export default function App() {
  const { t, i18n } = useTranslation();
  const [gameState, setGameState] = useState('menu');
  const [difficulty, setDifficulty] = useState('medium');
  const [boardSize, setBoardSize] = useState(20);
  const [wallMode, setWallMode] = useState('normal');

  const [snake, setSnake] = useState([]);
  const [foods, setFoods] = useState([]);
  const [direction, setDirection] = useState('right');
  const [nextDirection, setNextDirection] = useState('right');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [speedLevel, setSpeedLevel] = useState(3);
  const [blinkTick, setBlinkTick] = useState(0);

  const gameLoopRef = useRef(null);
  const nextDirectionRef = useRef('right');
  const foodsRef = useRef([]);
  const snakeRef = useRef([]);

  useEffect(() => {
    loadHighScore();
    loadSavedLanguage();
  }, []);

  useEffect(() => {
    foodsRef.current = foods;
  }, [foods]);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

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
    const initialFoods = generateFoods(initialSnake);
    setFoods(initialFoods);
    foodsRef.current = initialFoods;
    setScore(0);
    setDirection('right');
    setNextDirection('right');
    nextDirectionRef.current = 'right';
    setPaused(true);
    setOptionsOpen(false);
    setGameState('playing');
  };

  const generateFoods = (currentSnake) => {
    const r = Math.random();
    const count = r < 0.6 ? 1 : r < 0.88 ? 2 : 3;
    const result = [];
    const occupied = new Set(
      (currentSnake || []).map((s) => `${s.row},${s.col}`)
    );

    for (let i = 0; i < count; i++) {
      let row, col;
      let attempts = 0;
      do {
        row = Math.floor(Math.random() * boardSize);
        col = Math.floor(Math.random() * boardSize);
        attempts++;
        if (attempts > 200) break;
      } while (occupied.has(`${row},${col}`));
      if (attempts > 200) continue;
      occupied.add(`${row},${col}`);
      const points = 1 + Math.floor(Math.random() * 3);
      const item = { row, col, points };
      if (points >= 2) item.spawnTime = Date.now();
      result.push(item);
    }

    return result;
  };

  const removeExpiredFoods = () => {
    const now = Date.now();
    setFoods((prev) => {
      const next = prev.filter(
        (f) => !f.spawnTime || now - f.spawnTime < FOOD_EXPIRE_MS
      );
      foodsRef.current = next;
      return next;
    });
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

      const currentFoods = foodsRef.current || [];
      const eaten = currentFoods.find(
        (f) => f.row === head.row && f.col === head.col
      );
      if (eaten) {
        setScore((s) => s + eaten.points);
        const newSnake = [head, ...prevSnake];
        const nextFoods = generateFoods(newSnake);
        foodsRef.current = nextFoods;
        setFoods(nextFoods);
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

    const tick = () => {
      moveSnake();
      removeExpiredFoods();
    };
    gameLoopRef.current = setInterval(tick, SPEED_LEVEL_MS[speedLevel]);

    return () => clearInterval(gameLoopRef.current);
  }, [gameState, paused, speedLevel]);

  useEffect(() => {
    if (gameState !== 'playing' || paused) return;
    const hasExpirable = foods.some((f) => f.spawnTime != null);
    if (!hasExpirable) return;
    const blinkInterval = setInterval(
      () => setBlinkTick((t) => t + 1),
      FOOD_BLINK_INTERVAL_MS
    );
    return () => clearInterval(blinkInterval);
  }, [gameState, paused, foods]);

  useEffect(() => {
    if (gameState !== 'playing' || paused || foods.length > 0) return;
    const timer = setTimeout(() => {
      const newFoods = generateFoods(snakeRef.current);
      setFoods(newFoods);
      foodsRef.current = newFoods;
    }, NO_FOOD_SPAWN_MS);
    return () => clearTimeout(timer);
  }, [gameState, paused, foods.length]);

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
        <Pressable
          onPress={openOptions}
          style={({ pressed }) => [styles.optionsButton, pressed && styles.btnPressed]}
        >
          <Text style={styles.optionsButtonText}>⚙</Text>
        </Pressable>
      </View>

      <GameBoard
        snake={snake}
        foods={foods}
        boardSize={boardSize}
        wallMode={wallMode}
        blinkTick={blinkTick}
        blinkStartMs={FOOD_BLINK_START_MS}
        blinkIntervalMs={FOOD_BLINK_INTERVAL_MS}
      />

      <Pressable
        onPress={togglePause}
        style={({ pressed }) => [
          styles.playPauseButton,
          paused && styles.playPauseButtonPaused,
          pressed && styles.btnPressed,
        ]}
      >
        <Text style={[styles.playPauseButtonText, paused && styles.playPauseButtonTextPaused]}>
          {paused ? t('game.play') : t('game.pause')}
        </Text>
      </Pressable>

      <View style={styles.dpadContainer}>
        <Pressable
          onPress={() => handleDirectionChange('up')}
          style={({ pressed }) => [styles.dpadBtn, pressed && styles.dpadBtnPressed]}
        >
          <Text style={styles.arrow}>▲</Text>
        </Pressable>

        <View style={styles.middleRow}>
          <Pressable
            onPress={() => handleDirectionChange('left')}
            style={({ pressed }) => [styles.dpadBtn, pressed && styles.dpadBtnPressed]}
          >
            <Text style={styles.arrow}>◀</Text>
          </Pressable>
          <View style={styles.dpadSpacer} />
          <Pressable
            onPress={() => handleDirectionChange('right')}
            style={({ pressed }) => [styles.dpadBtn, pressed && styles.dpadBtnPressed]}
          >
            <Text style={styles.arrow}>▶</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => handleDirectionChange('down')}
          style={({ pressed }) => [styles.dpadBtn, pressed && styles.dpadBtnPressed]}
        >
          <Text style={styles.arrow}>▼</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={goMenu}
        style={({ pressed }) => [styles.menuButton, pressed && styles.btnPressed]}
      >
        <Text style={styles.menuButtonText}>{t('game.mainMenu')}</Text>
      </Pressable>

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
              <Pressable
                onPress={closeOptions}
                style={({ pressed }) => [styles.drawerCloseBtn, pressed && styles.btnPressed]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.drawerCloseText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.drawerContent}>
              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>{t('game.optionGhostWalls')}</Text>
                <Switch
                  value={wallMode === 'wrap'}
                  onValueChange={(value) => setWallMode(value ? 'wrap' : 'normal')}
                  trackColor={{ false: '#1a3322', true: '#0a2a1a' }}
                  thumbColor={wallMode === 'wrap' ? '#00ff41' : '#4a6a4a'}
                />
              </View>
              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, styles.optionLabelNoFlex]}>{t('game.optionSpeed')}</Text>
                <View style={styles.languageButtonsRow}>
                  {SPEED_LEVELS.map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => setSpeedLevel(level)}
                      style={({ pressed }) => [
                        styles.langBtn,
                        speedLevel === level && styles.langBtnActive,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Text style={[styles.langBtnText, speedLevel === level && styles.langBtnTextActive]}>
                        {level}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, styles.optionLabelNoFlex]}>{t('menu.language')}</Text>
                <View style={styles.languageButtonsRow}>
                  {supportedLngs.map((lng) => (
                    <Pressable
                      key={lng}
                      onPress={() => setSavedLanguage(lng)}
                      style={({ pressed }) => [
                        styles.langBtn,
                        i18n.language === lng && styles.langBtnActive,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Text style={[styles.langBtnText, i18n.language === lng && styles.langBtnTextActive]}>
                        {languageLabels[lng]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
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
    paddingTop: SCREEN_HEIGHT > 800 ? SPACING * 2 : SPACING * 3,
    paddingHorizontal: SPACING,
    paddingBottom: SPACING * 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '92%',
    marginBottom: SPACING,
    paddingVertical: SPACING,
    paddingHorizontal: SPACING,
    backgroundColor: '#111a2a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1a3322',
  },
  headerBlock: {
    alignItems: 'center',
  },
  optionsButton: {
    padding: SPACING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPressed: {
    transform: [{ translateY: 2 }],
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    paddingTop: SPACING * 4,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING,
    paddingBottom: SPACING,
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
    padding: SPACING / 2,
  },
  drawerCloseText: {
    fontSize: 20,
    color: '#ff8800',
    fontWeight: 'bold',
  },
  drawerContent: {
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
    fontSize: 14,
    color: '#e0e0e0',
    flex: 1,
    marginRight: SPACING,
  },
  optionLabelNoFlex: {
    flex: 0,
  },
  languageButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING / 2,
  },
  langBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#1a3322',
    backgroundColor: '#0d1419',
  },
  langBtnActive: {
    borderColor: '#00ff41',
    backgroundColor: '#0a2a1a',
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4a6a4a',
    letterSpacing: 1,
  },
  langBtnTextActive: {
    color: '#00ff41',
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

  playPauseButton: {
    width: '92%',
    paddingVertical: SPACING,
    marginTop: SPACING,
    marginBottom: SPACING,
    backgroundColor: '#1a1200',
    borderWidth: 1,
    borderColor: '#ff8800',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff8800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  playPauseButtonPaused: {
    borderColor: '#00ff41',
    backgroundColor: '#0a1a0a',
    shadowColor: '#00ff41',
  },
  playPauseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff8800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  playPauseButtonTextPaused: {
    color: '#00ff41',
  },
  dpadContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: SPACING,
  },
  middleRow: {
    flexDirection: 'row',
    marginVertical: SPACING,
    alignItems: 'center',
  },
  dpadSpacer: {
    width: 62,
    marginHorizontal: 0,
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
    marginHorizontal: SPACING,
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  dpadBtnPressed: {
    transform: [{ translateY: 2 }],
    backgroundColor: '#061008',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  arrow: {
    fontSize: 24,
    color: '#00ff41',
    fontWeight: 'bold',
  },
  menuButton: {
    borderWidth: 1,
    borderColor: '#ff3333',
    backgroundColor: 'transparent',
    paddingVertical: SPACING,
    paddingHorizontal: SPACING * 3,
    borderRadius: 4,
    marginTop: SPACING,
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
