import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { registerRootComponent } from 'expo';
import { useFonts } from '@expo-google-fonts/press-start-2p/useFonts';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './src/i18n';
import { loadSavedLanguage, setSavedLanguage, supportedLngs } from './src/i18n';
import { useTranslation } from 'react-i18next';
import { FONT_FAMILY } from './src/theme';
import GameBoard from './src/components/GameBoard';
import RetroText from './src/components/RetroText';
import Trackpad from './src/components/Trackpad';
import MenuScreen from './src/screens/MenuScreen';
import GameOverScreen from './src/screens/GameOverScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import InstructionsScreen from './src/screens/InstructionsScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LEADERBOARD_KEY = 'snakeLeaderboard';
const LEADERBOARD_MAX = 10;

const difficultySettings = {
  easy: { speed: 200, size: 15 },
  medium: { speed: 150, size: 20 },
  hard: { speed: 100, size: 20 },
  expert: { speed: 70, size: 20 },
};

const SPACING = 12;

const languageLabels = { en: 'EN', de: 'DE', fr: 'FR', es: 'ES', pt: 'PT' };

const OptionCheckbox = ({ value, onValueChange, style }) => (
  <Pressable
    onPress={() => onValueChange(!value)}
    style={({ pressed }) => [
      styles.optionCheckbox,
      value && styles.optionCheckboxChecked,
      pressed && styles.btnPressed,
      style,
    ]}
  >
    {value ? <RetroText style={styles.optionCheckboxMark}>✓</RetroText> : null}
  </Pressable>
);

// Velocidade premium: 1 = mais lento, 5 = mais rápido (intervalo em ms)
const SPEED_LEVEL_MS = { 1: 250, 2: 200, 3: 150, 4: 100, 5: 70 };
const SPEED_LEVELS = [1, 2, 3, 4, 5];

// Comidas 2 e 3 pontos: piscam após X s e expiram após Y s
const FOOD_BLINK_START_MS = 4000;
const FOOD_EXPIRE_MS = 8000;
const FOOD_BLINK_INTERVAL_MS = 200;

// Se ficar X s sem nenhuma comida visível, gera novas (sem pontuar)
const NO_FOOD_SPAWN_MS = 5000;

// Obstáculos: renovam a cada X s; quantidade aleatória entre min e max
const OBSTACLE_CHANGE_MS = 8000;
const OBSTACLE_COUNT_MIN = 3;
const OBSTACLE_COUNT_MAX = 7;

// Multiplicador: referências para bônus por poucos movimentos e pouco tempo
const MOVES_REF = 80;
const TIME_REF_SEC = 90;
const BONUS_MAX = 0.5;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ PressStart2P_400Regular });
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
  const [obstaclesEnabled, setObstaclesEnabled] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [controlMode, setControlMode] = useState('dpad'); // 'dpad' | 'trackpad'
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [countdown, setCountdown] = useState(null); // 3 | 2 | 1 | 'go' | null
  const countdownScale = useRef(new Animated.Value(0.3)).current;

  const gameLoopRef = useRef(null);
  const nextDirectionRef = useRef('right');
  const foodsRef = useRef([]);
  const snakeRef = useRef([]);
  const obstaclesRef = useRef([]);
  const scoreRef = useRef(0);
  const elapsedSecondsRef = useRef(0);
  const moveCountRef = useRef(0);

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

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    moveCountRef.current = moveCount;
  }, [moveCount]);

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

  const loadLeaderboard = async () => {
    try {
      const raw = await AsyncStorage.getItem(LEADERBOARD_KEY);
      const list = raw ? JSON.parse(raw) : [];
      setLeaderboardEntries(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLeaderboardEntries([]);
    }
  };

  const saveToLeaderboard = async (finalScore, timeSeconds, moveCount = 0) => {
    if (finalScore == null || finalScore < 0) return;
    try {
      const raw = await AsyncStorage.getItem(LEADERBOARD_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const entries = Array.isArray(list) ? list : [];
      const newEntry = {
        score: finalScore,
        timeSeconds: timeSeconds ?? 0,
        moveCount: moveCount ?? 0,
        date: new Date().toISOString(),
      };
      const next = [...entries, newEntry]
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (a.timeSeconds ?? 0) - (b.timeSeconds ?? 0);
        })
        .slice(0, LEADERBOARD_MAX);
      await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Failed to save leaderboard:', error);
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
    if (obstaclesEnabled) {
      const initialObstacles = generateObstacles(initialSnake, initialFoods);
      setObstacles(initialObstacles);
      obstaclesRef.current = initialObstacles;
    } else {
      setObstacles([]);
      obstaclesRef.current = [];
    }
    setScore(0);
    setElapsedSeconds(0);
    setMoveCount(0);
    setDirection('right');
    setNextDirection('right');
    nextDirectionRef.current = 'right';
    moveCountRef.current = 0;
    setPaused(true);
    setOptionsOpen(false);
    setGameState('playing');
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    countdownScale.setValue(0.3);
    Animated.timing(countdownScale, {
      toValue: 1.2,
      duration: 700,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [countdown, countdownScale]);

  useEffect(() => {
    if (countdown === null) return;
    const t = countdown === 'go' ? 500 : 1000;
    const timer = setTimeout(() => {
      if (countdown === 3) setCountdown(2);
      else if (countdown === 2) setCountdown(1);
      else if (countdown === 1) setCountdown('go');
      else if (countdown === 'go') {
        setCountdown(null);
        setPaused(false);
      }
    }, t);
    return () => clearTimeout(timer);
  }, [countdown]);

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

  const generateObstacles = (currentSnake, currentFoods) => {
    const count =
      OBSTACLE_COUNT_MIN +
      Math.floor(Math.random() * (OBSTACLE_COUNT_MAX - OBSTACLE_COUNT_MIN + 1));
    const head = currentSnake?.[0];
    const occupied = new Set(
      [
        ...(currentSnake || []).map((s) => `${s.row},${s.col}`),
        ...(currentFoods || []).map((f) => `${f.row},${f.col}`),
      ]
    );
    if (head) {
      const minDist = 5;
      for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
          if (Math.max(Math.abs(r - head.row), Math.abs(c - head.col)) < minDist) {
            occupied.add(`${r},${c}`);
          }
        }
      }
    }
    const result = [];
    for (let i = 0; i < count; i++) {
      let row, col;
      let attempts = 0;
      do {
        row = Math.floor(Math.random() * boardSize);
        col = Math.floor(Math.random() * boardSize);
        attempts++;
        if (attempts > 300) break;
      } while (occupied.has(`${row},${col}`));
      if (attempts > 300) break;
      occupied.add(`${row},${col}`);
      result.push({ row, col });
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

      const currentObstacles = obstaclesRef.current || [];
      const hitObstacle = currentObstacles.some(
        (o) => o.row === head.row && o.col === head.col
      );
      if (hitObstacle) {
        handleGameOver();
        return prevSnake;
      }

      const currentFoods = foodsRef.current || [];
      const eaten = currentFoods.find(
        (f) => f.row === head.row && f.col === head.col
      );
      if (eaten) {
        const moves = moveCountRef.current;
        const secs = elapsedSecondsRef.current;
        const moveBonus = BONUS_MAX * Math.max(0, 1 - moves / MOVES_REF);
        const timeBonus = BONUS_MAX * Math.max(0, 1 - secs / TIME_REF_SEC);
        const multiplier = 1 + moveBonus + timeBonus;
        const points = Math.max(1, Math.round(eaten.points * multiplier));
        setScore((s) => s + points);
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

    const finalScore = scoreRef.current;
    const finalTime = elapsedSecondsRef.current;

    if (finalScore > highScore) {
      setHighScore(finalScore);
      saveHighScore();
    }

    saveToLeaderboard(finalScore, finalTime, moveCountRef.current);
    setGameState('gameOver');
  };

  useEffect(() => {
    if (gameState !== 'playing' || paused || countdown !== null) return;

    const tick = () => {
      moveSnake();
      removeExpiredFoods();
    };
    gameLoopRef.current = setInterval(tick, SPEED_LEVEL_MS[speedLevel]);

    return () => clearInterval(gameLoopRef.current);
  }, [gameState, paused, speedLevel, countdown]);

  useEffect(() => {
    if (gameState !== 'playing' || paused || countdown !== null) return;
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

  useEffect(() => {
    if (gameState !== 'playing' || paused || !obstaclesEnabled) return;
    const interval = setInterval(() => {
      const newObstacles = generateObstacles(
        snakeRef.current,
        foodsRef.current || []
      );
      setObstacles(newObstacles);
      obstaclesRef.current = newObstacles;
    }, OBSTACLE_CHANGE_MS);
    return () => clearInterval(interval);
  }, [gameState, paused, obstaclesEnabled]);

  useEffect(() => {
    if (gameState !== 'playing' || paused || countdown !== null) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState, paused]);

  const handleDirectionChange = (newDir) => {
    if (!['up', 'down', 'left', 'right'].includes(newDir)) return;
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (direction !== opposites[newDir]) {
      nextDirectionRef.current = newDir;
      setNextDirection(newDir);
      setMoveCount((m) => m + 1);
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

  const goLeaderboard = async () => {
    await loadLeaderboard();
    setGameState('leaderboard');
  };

  const goInstructions = () => {
    closeOptions();
    setGameState('instructions');
  };

  const goBackFromInstructions = () => {
    setGameState('playing');
  };

  const goBackFromLeaderboard = () => {
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

  if (!fontsLoaded && !fontError) return null;

  // RENDERIZAÇÃO CONDICIONAL BASEADA NO ESTADO DO JOGO
  if (gameState === 'menu') {
    return <MenuScreen onStart={initGame} />;
  }

  if (gameState === 'instructions') {
    return (
      <InstructionsScreen onBack={goBackFromInstructions} />
    );
  }

  if (gameState === 'leaderboard') {
    return (
      <LeaderboardScreen
        entries={leaderboardEntries}
        onBack={goBackFromLeaderboard}
      />
    );
  }

  if (gameState === 'gameOver') {
    return (
      <GameOverScreen
        score={score}
        highScore={highScore}
        moveCount={moveCount}
        elapsedSeconds={elapsedSeconds}
        onRestart={restartGame}
        onMenu={goMenu}
        onLeaderboard={goLeaderboard}
      />
    );
  }

  // Largura do grid (mesma fórmula do GameBoard) para alinhar o header
  const gameBoardMaxWidth = Math.min(SCREEN_WIDTH - 30, 380);
  const gameBoardCellSize = Math.floor((gameBoardMaxWidth - 4) / boardSize);
  const gameBoardWidth = gameBoardCellSize * boardSize + 4;

  // Layout responsivo para mobile - estado 'playing'
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.header, { width: gameBoardWidth }]}>
        <View style={styles.headerBlock}>
          <RetroText style={styles.scoreLabel}>{t('game.score')}</RetroText>
          <RetroText style={styles.score}>{score}</RetroText>
        </View>
        <View style={styles.headerBlock}>
          <RetroText style={styles.timeLabel}>{t('game.time')}</RetroText>
          <RetroText style={styles.timeValue}>
            {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
          </RetroText>
        </View>
        <View style={styles.headerBlock}>
          <RetroText style={styles.movesLabel}>{t('game.moves')}</RetroText>
          <RetroText style={styles.movesValue}>{moveCount}</RetroText>
        </View>
        <View style={styles.headerBlock}>
          <RetroText style={styles.highScoreLabel}>{t('game.record')}</RetroText>
          <RetroText style={styles.highScoreValue}>{highScore}</RetroText>
        </View>
        <Pressable
          onPress={openOptions}
          style={({ pressed }) => [styles.optionsButton, pressed && styles.btnPressed]}
        >
          <RetroText style={styles.optionsButtonText}>⚙</RetroText>
        </Pressable>
      </View>

      <View style={[styles.gameBoardWrapper, { width: gameBoardWidth, height: gameBoardWidth }]}>
        <GameBoard
          snake={snake}
          foods={foods}
          obstacles={obstacles}
          boardSize={boardSize}
          wallMode={wallMode}
          blinkTick={blinkTick}
          blinkStartMs={FOOD_BLINK_START_MS}
          blinkIntervalMs={FOOD_BLINK_INTERVAL_MS}
        />
        {countdown !== null && (
          <View style={styles.countdownOverlay} pointerEvents="none">
            <Animated.View style={{ transform: [{ scale: countdownScale }] }}>
              <RetroText style={styles.countdownText}>
                {countdown === 'go' ? 'GO!' : countdown}
              </RetroText>
            </Animated.View>
          </View>
        )}
      </View>

      <Pressable
        onPress={togglePause}
        style={({ pressed }) => [
          styles.playPauseButton,
          paused && styles.playPauseButtonPaused,
          pressed && styles.btnPressed,
        ]}
      >
        <RetroText style={[styles.playPauseButtonText, paused && styles.playPauseButtonTextPaused]}>
          {paused ? t('game.play') : t('game.pause')}
        </RetroText>
      </Pressable>

      {controlMode === 'dpad' ? (
        <View style={styles.dpadContainer}>
          <Pressable
            onPress={() => handleDirectionChange('up')}
            style={({ pressed }) => [styles.dpadBtn, pressed && styles.dpadBtnPressed]}
          >
            <RetroText style={styles.arrow}>▲</RetroText>
          </Pressable>

          <View style={styles.middleRow}>
            <Pressable
              onPress={() => handleDirectionChange('left')}
              style={({ pressed }) => [styles.dpadBtn, pressed && styles.dpadBtnPressed]}
            >
              <RetroText style={styles.arrow}>◀</RetroText>
            </Pressable>
            <View style={styles.dpadSpacer} />
            <Pressable
              onPress={() => handleDirectionChange('right')}
              style={({ pressed }) => [styles.dpadBtn, pressed && styles.dpadBtnPressed]}
            >
              <RetroText style={styles.arrow}>▶</RetroText>
            </Pressable>
          </View>

          <Pressable
            onPress={() => handleDirectionChange('down')}
            style={({ pressed }) => [styles.dpadBtn, pressed && styles.dpadBtnPressed]}
          >
            <RetroText style={styles.arrow}>▼</RetroText>
          </Pressable>
        </View>
      ) : (
        <Trackpad onDirectionChange={handleDirectionChange} />
      )}

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
              <RetroText style={styles.drawerTitle}>{t('game.options')}</RetroText>
              <Pressable
                onPress={closeOptions}
                style={({ pressed }) => [styles.drawerCloseBtn, pressed && styles.btnPressed]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <RetroText style={styles.drawerCloseText}>✕</RetroText>
              </Pressable>
            </View>
            <ScrollView style={styles.drawerContent}>
              <View style={styles.optionRow}>
                <RetroText style={styles.optionLabel}>{t('game.optionGhostWalls')}</RetroText>
                <OptionCheckbox
                  value={wallMode === 'wrap'}
                  onValueChange={(value) => setWallMode(value ? 'wrap' : 'normal')}
                />
              </View>
              <View style={styles.optionRow}>
                <RetroText style={styles.optionLabel}>{t('game.optionObstacles')}</RetroText>
                <OptionCheckbox
                  value={obstaclesEnabled}
                  onValueChange={(value) => {
                    setObstaclesEnabled(value);
                    if (value) {
                      const next = generateObstacles(
                        snakeRef.current,
                        foodsRef.current || []
                      );
                      setObstacles(next);
                      obstaclesRef.current = next;
                    } else {
                      setObstacles([]);
                      obstaclesRef.current = [];
                    }
                  }}
                />
              </View>
              <View style={styles.optionRow}>
                <RetroText style={[styles.optionLabel, styles.optionLabelNoFlex]}>{t('game.optionSpeed')}</RetroText>
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
                      <RetroText style={[styles.langBtnText, speedLevel === level && styles.langBtnTextActive]}>
                        {level}
                      </RetroText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.optionRow}>
                <RetroText style={[styles.optionLabel, styles.optionLabelNoFlex]}>{t('game.optionControls')}</RetroText>
                <View style={styles.languageButtonsRow}>
                  <Pressable
                    onPress={() => setControlMode('dpad')}
                    style={({ pressed }) => [
                      styles.langBtn,
                      controlMode === 'dpad' && styles.langBtnActive,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <RetroText style={[styles.langBtnText, controlMode === 'dpad' && styles.langBtnTextActive]}>
                      {t('game.controlDpad')}
                    </RetroText>
                  </Pressable>
                  <Pressable
                    onPress={() => setControlMode('trackpad')}
                    style={({ pressed }) => [
                      styles.langBtn,
                      controlMode === 'trackpad' && styles.langBtnActive,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <RetroText style={[styles.langBtnText, controlMode === 'trackpad' && styles.langBtnTextActive]}>
                      {t('game.controlTrackpad')}
                    </RetroText>
                  </Pressable>
                </View>
              </View>
              <View style={styles.optionRow}>
                <RetroText style={[styles.optionLabel, styles.optionLabelNoFlex]}>{t('menu.language')}</RetroText>
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
                      <RetroText style={[styles.langBtnText, i18n.language === lng && styles.langBtnTextActive]}>
                        {languageLabels[lng]}
                      </RetroText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Pressable
                onPress={goInstructions}
                style={({ pressed }) => [styles.optionRow, styles.optionRowPressable, pressed && styles.btnPressed]}
              >
                <RetroText style={styles.optionLabel}>{t('menu.instructions')}</RetroText>
                <RetroText style={styles.optionRowArrow}>›</RetroText>
              </Pressable>
              <Pressable
                onPress={() => {
                  closeOptions();
                  goLeaderboard();
                }}
                style={({ pressed }) => [styles.optionRow, styles.optionRowPressable, pressed && styles.btnPressed]}
              >
                <RetroText style={styles.optionLabel}>{t('menu.leaderboard')}</RetroText>
                <RetroText style={styles.optionRowArrow}>›</RetroText>
              </Pressable>
            </ScrollView>
            <View style={styles.drawerFooter}>
              <Pressable
                onPress={() => {
                  closeOptions();
                  goMenu();
                }}
                style={({ pressed }) => [styles.menuButton, pressed && styles.btnPressed]}
              >
                <RetroText style={styles.menuButtonText}>{t('game.mainMenu')}</RetroText>
              </Pressable>
            </View>
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
  gameBoardWrapper: {
    position: 'relative',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0e1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontFamily: FONT_FAMILY,
    fontSize: 72,
    color: '#00ff41',
    textShadowColor: '#00ff41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
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
    fontFamily: FONT_FAMILY,
    fontSize: 18,
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
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: '#00ff41',
    letterSpacing: 2,
  },
  drawerCloseBtn: {
    padding: SPACING / 2,
  },
  drawerCloseText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: '#ff8800',
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: SPACING,
    paddingTop: SPACING,
  },
  drawerFooter: {
    marginTop: 'auto',
    paddingHorizontal: SPACING,
    paddingTop: SPACING,
    paddingBottom: SPACING * 4,
    borderTopWidth: 1,
    borderTopColor: '#1a3322',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3322',
  },
  optionRowPressable: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a3322',
  },
  optionRowArrow: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    color: '#00ff41',
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
  optionCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00ff41',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCheckboxChecked: {
    backgroundColor: 'rgba(0, 255, 65, 0.22)',
  },
  optionCheckboxMark: {
    fontFamily: FONT_FAMILY,
    color: '#00ff41',
    fontSize: 12,
    textShadowColor: 'rgba(0, 255, 65, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
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
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    color: '#4a6a4a',
    letterSpacing: 1,
  },
  langBtnTextActive: {
    fontFamily: FONT_FAMILY,
    color: '#00ff41',
  },
  scoreLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    color: '#4a6a4a',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  score: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    color: '#00ff41',
    textShadowColor: '#00ff41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  timeLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    color: '#4a4a6a',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  timeValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    color: '#4488ff',
    textShadowColor: '#4488ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  movesLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    color: '#4a6a4a',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  movesValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    color: '#00ff41',
    textShadowColor: '#00ff41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  highScoreLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    color: '#5a4a2a',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  highScoreValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
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
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: '#ff8800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  playPauseButtonTextPaused: {
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    color: '#00ff41',
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
    fontFamily: FONT_FAMILY,
    color: '#ff3333',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

registerRootComponent(App);
