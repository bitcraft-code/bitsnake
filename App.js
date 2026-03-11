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
  StatusBar,
  useColorScheme,
} from 'react-native';
import { registerRootComponent } from 'expo';
import { useFonts } from '@expo-google-fonts/press-start-2p/useFonts';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import './src/i18n';
import { loadSavedLanguage, setSavedLanguage, supportedLngs } from './src/i18n';
import { useTranslation } from 'react-i18next';
import { FONT_FAMILY, THEMES } from './src/theme';
import GameBoard from './src/components/GameBoard';
import RetroText from './src/components/RetroText';
import Trackpad from './src/components/Trackpad';
import MenuScreen from './src/screens/MenuScreen';
import GameOverScreen from './src/screens/GameOverScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import InstructionsScreen from './src/screens/InstructionsScreen';
import {
  SPEED_LEVEL_MS,
  SPEED_LEVELS,
  POINTS_PER_SPEED_LEVEL,
  SPEED_LEVEL_MAX,
  FOOD_BLINK_START_MS,
  FOOD_EXPIRE_MS,
  FOOD_BLINK_INTERVAL_MS,
  NO_FOOD_SPAWN_MS,
  OBSTACLE_CHANGE_MS,
  OBSTACLE_COUNT_MIN,
  OBSTACLE_COUNT_MAX,
  OBSTACLE_MIN_SCORE,
  OBSTACLE_MIN_TIME_SEC,
  MOVES_REF,
  TIME_REF_SEC,
  BONUS_MAX,
} from './src/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LEADERBOARD_KEY = 'snakeLeaderboard';
const LEADERBOARD_MAX = 10;
const GAME_SETTINGS_KEY = 'snakeGameSettings';

const difficultySettings = {
  easy: { speed: 200, size: 15 },
  medium: { speed: 150, size: 20 },
  hard: { speed: 100, size: 20 },
  expert: { speed: 70, size: 20 },
};

const SPACING = 12;

const languageLabels = { en: 'EN', de: 'DE', fr: 'FR', es: 'ES', pt: 'PT' };

const OptionCheckbox = ({ value, onValueChange, style, themeColors }) => (
  <Pressable
    onPress={() => onValueChange(!value)}
    style={({ pressed }) => [
      styles.optionCheckbox,
      value && (themeColors
        ? { backgroundColor: themeColors.checkboxActiveBg, borderColor: themeColors.checkboxColor, shadowColor: themeColors.checkboxColor }
        : styles.optionCheckboxChecked),
      pressed && styles.btnPressed,
      style,
    ]}
  >
    {value ? (
      <RetroText style={[styles.optionCheckboxMark, themeColors && { color: themeColors.checkboxColor }]}>
        ✓
      </RetroText>
    ) : null}
  </Pressable>
);

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
  const [theme, setTheme] = useState('system'); // 'system' | 'dark' | 'light'
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
  const instructionsReturnToRef = useRef('playing');
  const drawerSlideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const gameSettingsLoadedRef = useRef(false);
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    loadHighScore();
    loadSavedLanguage();
    loadGameSettings();
  }, []);

  const loadGameSettings = async () => {
    try {
      const raw = await AsyncStorage.getItem(GAME_SETTINGS_KEY);
      const data = raw ? JSON.parse(raw) : {};
      if (data.wallMode === 'wrap' || data.wallMode === 'normal')
        setWallMode(data.wallMode);
      if (typeof data.obstaclesEnabled === 'boolean')
        setObstaclesEnabled(data.obstaclesEnabled);
      if (
        typeof data.speedLevel === 'number' &&
        data.speedLevel >= 1 &&
        data.speedLevel <= 5
      )
        setSpeedLevel(data.speedLevel);
      if (data.controlMode === 'dpad' || data.controlMode === 'trackpad')
        setControlMode(data.controlMode);
      if (data.theme === 'light' || data.theme === 'dark' || data.theme === 'system') setTheme(data.theme);
    } catch (error) {
      console.error('Failed to load game settings:', error);
    } finally {
      gameSettingsLoadedRef.current = true;
    }
  };

  const saveGameSettings = async () => {
    if (!gameSettingsLoadedRef.current) return;
    try {
      await AsyncStorage.setItem(
        GAME_SETTINGS_KEY,
        JSON.stringify({
          wallMode,
          obstaclesEnabled,
          speedLevel,
          controlMode,
          theme,
        }),
      );
    } catch (error) {
      console.error('Failed to save game settings:', error);
    }
  };

  useEffect(() => {
    saveGameSettings();
  }, [wallMode, obstaclesEnabled, speedLevel, controlMode, theme]);

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
    const initialFoods = generateFoods(initialSnake, false);
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
    setSpeedLevel(1);
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
        setFoods((prev) => {
          const next = prev.map((f) =>
            f.points >= 2 ? { ...f, spawnTime: Date.now() } : f,
          );
          foodsRef.current = next;
          return next;
        });
      }
    }, t);
    return () => clearTimeout(timer);
  }, [countdown]);

  const generateFoods = (currentSnake, startTimer = true) => {
    const r = Math.random();
    const count = r < 0.6 ? 1 : r < 0.88 ? 2 : 3;
    const result = [];
    const occupied = new Set(
      (currentSnake || []).map((s) => `${s.row},${s.col}`),
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
      if (points >= 2 && startTimer) item.spawnTime = Date.now();
      result.push(item);
    }

    return result;
  };

  const generateObstacles = (currentSnake, currentFoods) => {
    const count =
      OBSTACLE_COUNT_MIN +
      Math.floor(Math.random() * (OBSTACLE_COUNT_MAX - OBSTACLE_COUNT_MIN + 1));
    const head = currentSnake?.[0];
    const occupied = new Set([
      ...(currentSnake || []).map((s) => `${s.row},${s.col}`),
      ...(currentFoods || []).map((f) => `${f.row},${f.col}`),
    ]);
    if (head) {
      const minDist = 5;
      for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
          if (
            Math.max(Math.abs(r - head.row), Math.abs(c - head.col)) < minDist
          ) {
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
        (f) => !f.spawnTime || now - f.spawnTime < FOOD_EXPIRE_MS,
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
        (o) => o.row === head.row && o.col === head.col,
      );
      if (hitObstacle) {
        handleGameOver();
        return prevSnake;
      }

      const currentFoods = foodsRef.current || [];
      const eaten = currentFoods.find(
        (f) => f.row === head.row && f.col === head.col,
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

    const effectiveLevel = Math.min(
      speedLevel + Math.floor(score / POINTS_PER_SPEED_LEVEL),
      SPEED_LEVEL_MAX,
    );
    const intervalMs =
      SPEED_LEVEL_MS[effectiveLevel] ?? SPEED_LEVEL_MS[SPEED_LEVEL_MAX];

    const tick = () => {
      moveSnake();
      removeExpiredFoods();
    };
    gameLoopRef.current = setInterval(tick, intervalMs);

    return () => clearInterval(gameLoopRef.current);
  }, [gameState, paused, speedLevel, countdown, score]);

  useEffect(() => {
    if (gameState !== 'playing' || paused || countdown !== null) return;
    const hasExpirable = foods.some((f) => f.spawnTime != null);
    if (!hasExpirable) return;
    const blinkInterval = setInterval(
      () => setBlinkTick((t) => t + 1),
      FOOD_BLINK_INTERVAL_MS,
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
      const s = scoreRef.current;
      const t = elapsedSecondsRef.current;
      if (s < OBSTACLE_MIN_SCORE && t < OBSTACLE_MIN_TIME_SEC) return;
      const newObstacles = generateObstacles(
        snakeRef.current,
        foodsRef.current || [],
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
    instructionsReturnToRef.current = 'playing';
    closeOptions();
    setGameState('instructions');
  };

  const goBackFromInstructions = () => {
    setGameState(instructionsReturnToRef.current);
  };

  const goBackFromLeaderboard = () => {
    setGameState('menu');
  };

  const openOptions = () => {
    setPaused(true);
    setOptionsOpen(true);
  };

  const closeOptions = () => {
    Animated.timing(drawerSlideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(({ finished }) => {
      if (finished) {
        setOptionsOpen(false);
        drawerSlideAnim.setValue(SCREEN_WIDTH);
      }
    });
  };

  useEffect(() => {
    if (!optionsOpen) return;
    drawerSlideAnim.setValue(SCREEN_WIDTH);
    Animated.timing(drawerSlideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [optionsOpen, drawerSlideAnim]);

  if (!fontsLoaded && !fontError) return null;

  const effectiveTheme = theme === 'system'
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : theme;
  const themeColors = THEMES[effectiveTheme];
  const wrapWithSafeArea = (children) => (
    <SafeAreaProvider>
      <StatusBar
        barStyle={effectiveTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
        translucent={false}
      />
      <SafeAreaView style={[styles.safeAreaWrapper, { flex: 1, backgroundColor: themeColors.background }]}>
        {children}
      </SafeAreaView>
    </SafeAreaProvider>
  );

  // RENDERIZAÇÃO CONDICIONAL BASEADA NO ESTADO DO JOGO
  if (gameState === 'menu') {
    return wrapWithSafeArea(
      <MenuScreen
        theme={theme}
        effectiveTheme={effectiveTheme}
        setTheme={setTheme}
        onStart={initGame}
        wallMode={wallMode}
        setWallMode={setWallMode}
        obstaclesEnabled={obstaclesEnabled}
        setObstaclesEnabled={setObstaclesEnabled}
        speedLevel={speedLevel}
        setSpeedLevel={setSpeedLevel}
        controlMode={controlMode}
        setControlMode={setControlMode}
        setSavedLanguage={setSavedLanguage}
        i18n={i18n}
        supportedLngs={supportedLngs}
        languageLabels={languageLabels}
        speedLevels={SPEED_LEVELS}
        onOpenInstructions={() => {
          instructionsReturnToRef.current = 'menu';
          setGameState('instructions');
        }}
        onOpenLeaderboard={async () => {
          await loadLeaderboard();
          setGameState('leaderboard');
        }}
      />
    );
  }

  if (gameState === 'instructions') {
    return wrapWithSafeArea(<InstructionsScreen theme={effectiveTheme} onBack={goBackFromInstructions} />);
  }

  if (gameState === 'leaderboard') {
    return wrapWithSafeArea(
      <LeaderboardScreen
        theme={effectiveTheme}
        entries={leaderboardEntries}
        onBack={goBackFromLeaderboard}
      />
    );
  }

  if (gameState === 'gameOver') {
    return wrapWithSafeArea(
      <GameOverScreen
        theme={effectiveTheme}
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

  // Área jogável: quadro SEMPRE no tamanho máximo (nunca diminui); só o conteúdo (cobra, comidas, obstáculos) encolhe
  const gameBoardMaxWidth = Math.min(SCREEN_WIDTH - 30, 380);
  const baseCellSize = Math.floor((gameBoardMaxWidth - 4) / boardSize);
  const baseFixedBoardWidth = baseCellSize * boardSize + 4;
  const gameBoardWidth = gameBoardMaxWidth;
  const fixedBoardWidth = baseFixedBoardWidth;

  // Layout responsivo para mobile - estado 'playing'
  return wrapWithSafeArea(
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.header,
          { width: gameBoardWidth, backgroundColor: themeColors.surface, borderColor: themeColors.border },
        ]}
      >
        <View style={styles.headerBlock}>
          <RetroText style={[styles.scoreLabel, { color: themeColors.textMuted }]}>{t('game.score')}</RetroText>
          <RetroText style={[styles.score, { color: themeColors.primary }]}>{score}</RetroText>
        </View>
        <View style={styles.headerBlock}>
          <RetroText style={[styles.timeLabel, { color: themeColors.textMuted }]}>{t('game.time')}</RetroText>
          <RetroText style={[styles.timeValue, { color: themeColors.primary }]}>
            {Math.floor(elapsedSeconds / 60)}:
            {(elapsedSeconds % 60).toString().padStart(2, '0')}
          </RetroText>
        </View>
        <View style={styles.headerBlock}>
          <RetroText style={[styles.movesLabel, { color: themeColors.textMuted }]}>{t('game.moves')}</RetroText>
          <RetroText style={[styles.movesValue, { color: themeColors.primary }]}>{moveCount}</RetroText>
        </View>
        <View style={styles.headerBlock}>
          <RetroText style={[styles.highScoreLabel, { color: themeColors.textMuted }]}>
            {t('game.record')}
          </RetroText>
          <RetroText style={[styles.highScoreValue, { color: themeColors.primary }]}>{highScore}</RetroText>
        </View>
        <Pressable
          onPress={countdown ? undefined : openOptions}
          style={({ pressed }) => [
            styles.optionsButton,
            { borderColor: themeColors.secondary, shadowColor: themeColors.secondary },
            pressed && !countdown && styles.btnPressed,
            countdown && styles.buttonDisabled,
          ]}
        >
          <RetroText style={[styles.optionsButtonText, { color: themeColors.secondary }]}>⚙︎</RetroText>
        </Pressable>
      </View>

      <View
        style={[
          styles.gameBoardWrapper,
          { width: gameBoardWidth, height: gameBoardWidth },
        ]}
      >
        <GameBoard
          theme={effectiveTheme}
          snake={snake}
          foods={foods}
          obstacles={obstacles}
          boardSize={boardSize}
          wallMode={wallMode}
          blinkTick={blinkTick}
          blinkStartMs={FOOD_BLINK_START_MS}
          blinkIntervalMs={FOOD_BLINK_INTERVAL_MS}
          fixedBoardWidth={fixedBoardWidth}
          score={score}
          displayBoardWidth={gameBoardWidth}
        />
        {countdown !== null && (
          <View style={[styles.countdownOverlay, { backgroundColor: themeColors.background }]} pointerEvents="none">
            <Animated.View style={{ transform: [{ scale: countdownScale }] }}>
              <RetroText
                style={[
                  styles.countdownText,
                  { color: themeColors.primary, textShadowColor: themeColors.primary },
                ]}
              >
                {countdown === 'go' ? 'GO!' : countdown}
              </RetroText>
            </Animated.View>
          </View>
        )}
      </View>

      <Pressable
        onPress={countdown ? undefined : togglePause}
        style={({ pressed }) => [
          styles.playPauseButton,
          {
            backgroundColor: themeColors.buttonOrangeBg,
            borderColor: themeColors.secondary,
            shadowColor: themeColors.secondary,
          },
          paused && !countdown && {
            borderColor: themeColors.primary,
            backgroundColor: themeColors.buttonGreenBg,
            shadowColor: themeColors.primary,
          },
          pressed && !countdown && styles.btnPressed,
          countdown && styles.buttonDisabled,
        ]}
      >
        <View style={styles.playPauseButtonContent}>
          <RetroText
            style={[
              styles.playPauseButtonText,
              styles.playPauseButtonIcon,
              { color: themeColors.secondary },
              paused && !countdown && { color: themeColors.primary },
            ]}
          >
            {countdown ? '⏸︎' : paused ? '▶︎' : '⏸︎'}
          </RetroText>
          <RetroText
            style={[
              styles.playPauseButtonText,
              { color: themeColors.secondary },
              paused && !countdown && { color: themeColors.primary },
            ]}
          >
            {countdown ? t('game.pause') : paused ? t('game.play') : t('game.pause')}
          </RetroText>
        </View>
      </Pressable>

      {controlMode === 'dpad' ? (
        <View style={styles.dpadContainer}>
          <Pressable
            onPress={() => handleDirectionChange('up')}
            style={({ pressed }) => [
              styles.dpadBtn,
              pressed && styles.dpadBtnPressed,
            ]}
          >
            <RetroText style={[styles.arrow, { color: themeColors.primary }]}>▲</RetroText>
          </Pressable>

          <View style={styles.middleRow}>
            <Pressable
              onPress={() => handleDirectionChange('left')}
              style={({ pressed }) => [
                styles.dpadBtn,
                pressed && styles.dpadBtnPressed,
              ]}
            >
              <RetroText style={[styles.arrow, { color: themeColors.primary }]}>◀</RetroText>
            </Pressable>
            <View style={styles.dpadSpacer} />
            <Pressable
              onPress={() => handleDirectionChange('right')}
              style={({ pressed }) => [
                styles.dpadBtn,
                pressed && styles.dpadBtnPressed,
              ]}
            >
              <RetroText style={[styles.arrow, { color: themeColors.primary }]}>▶</RetroText>
            </Pressable>
          </View>

          <Pressable
            onPress={() => handleDirectionChange('down')}
            style={({ pressed }) => [
              styles.dpadBtn,
              pressed && styles.dpadBtnPressed,
            ]}
          >
            <RetroText style={[styles.arrow, { color: themeColors.primary }]}>▼</RetroText>
          </Pressable>
        </View>
      ) : (
        <Trackpad theme={effectiveTheme} onDirectionChange={handleDirectionChange} />
      )}

      <Modal
        visible={optionsOpen}
        transparent
        animationType="none"
        onRequestClose={closeOptions}
      >
        <View style={styles.drawerOverlay}>
          <Pressable style={[styles.drawerBackdrop, { backgroundColor: themeColors.overlay }]} onPress={closeOptions} />
          <Animated.View
            style={[
              styles.drawerPanel,
              {
                transform: [{ translateX: drawerSlideAnim }],
                backgroundColor: themeColors.surfaceAlt,
                borderLeftColor: themeColors.border,
              },
            ]}
          >
            <View style={[styles.drawerHeader, { borderBottomColor: themeColors.border }]}>
              <RetroText style={[styles.drawerTitle, { color: themeColors.primary }]}>
                {t('game.options')}
              </RetroText>
              <Pressable
                onPress={closeOptions}
                style={({ pressed }) => [
                  styles.drawerCloseBtn,
                  pressed && styles.btnPressed,
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <RetroText style={[styles.drawerCloseText, { color: themeColors.secondary }]}>✕</RetroText>
              </Pressable>
            </View>
            <ScrollView style={styles.drawerContent} scrollEnabled={false} showsVerticalScrollIndicator={false}>
              <View style={[styles.optionRow, { borderBottomColor: themeColors.border }]}>
                <RetroText style={[styles.optionLabel, { color: themeColors.text }]}>
                  {t('game.optionGhostWalls')}
                </RetroText>
                <OptionCheckbox
                  value={wallMode === 'wrap'}
                  onValueChange={(value) =>
                    setWallMode(value ? 'wrap' : 'normal')
                  }
                  themeColors={themeColors}
                />
              </View>
              <View style={[styles.optionRow, { borderBottomColor: themeColors.border }]}>
                <RetroText style={[styles.optionLabel, { color: themeColors.text }]}>
                  {t('game.optionObstacles')}
                </RetroText>
                <OptionCheckbox
                  value={obstaclesEnabled}
                  onValueChange={(value) => {
                    setObstaclesEnabled(value);
                    if (value) {
                      const next = generateObstacles(
                        snakeRef.current,
                        foodsRef.current || [],
                      );
                      setObstacles(next);
                      obstaclesRef.current = next;
                    } else {
                      setObstacles([]);
                      obstaclesRef.current = [];
                    }
                  }}
                  themeColors={themeColors}
                />
              </View>
              <View style={[styles.optionRow, { borderBottomColor: themeColors.border }]}>
                <RetroText
                  style={[styles.optionLabel, styles.optionLabelNoFlex, { color: themeColors.text }]}
                >
                  {t('game.optionSpeed')}
                </RetroText>
                <View style={styles.languageButtonsRow}>
                  {SPEED_LEVELS.map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => setSpeedLevel(level)}
                      style={({ pressed }) => [
                        styles.langBtn,
                        speedLevel === level && {
                          backgroundColor: themeColors.langBtnActiveBg,
                          borderColor: themeColors.langBtnActiveBorder,
                        },
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <RetroText
                        style={[
                          styles.langBtnText,
                          speedLevel === level && { color: themeColors.primary },
                        ]}
                      >
                        {level}
                      </RetroText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={[styles.optionRow, { borderBottomColor: themeColors.border }]}>
                <RetroText
                  style={[styles.optionLabel, styles.optionLabelNoFlex, { color: themeColors.text }]}
                >
                  {t('game.optionControls')}
                </RetroText>
                <View style={styles.languageButtonsRow}>
                  <Pressable
                    onPress={() => setControlMode('dpad')}
                    style={({ pressed }) => [
                      styles.langBtn,
                      controlMode === 'dpad' && {
                        backgroundColor: themeColors.langBtnActiveBg,
                        borderColor: themeColors.langBtnActiveBorder,
                      },
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <RetroText
                      style={[
                        styles.langBtnText,
                        controlMode === 'dpad' && { color: themeColors.primary },
                      ]}
                    >
                      {t('game.controlDpad')}
                    </RetroText>
                  </Pressable>
                  <Pressable
                    onPress={() => setControlMode('trackpad')}
                    style={({ pressed }) => [
                      styles.langBtn,
                      controlMode === 'trackpad' && {
                        backgroundColor: themeColors.langBtnActiveBg,
                        borderColor: themeColors.langBtnActiveBorder,
                      },
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <RetroText
                      style={[
                        styles.langBtnText,
                        controlMode === 'trackpad' && { color: themeColors.primary },
                      ]}
                    >
                      {t('game.controlTrackpad')}
                    </RetroText>
                  </Pressable>
                </View>
              </View>
              <View style={[styles.optionRow, { borderBottomColor: themeColors.border }]}>
                <RetroText
                  style={[styles.optionLabel, styles.optionLabelNoFlex, { color: themeColors.text }]}
                >
                  {t('menu.language')}
                </RetroText>
                <View style={styles.languageButtonsRow}>
                  {supportedLngs.map((lng) => (
                    <Pressable
                      key={lng}
                      onPress={() => setSavedLanguage(lng)}
                      style={({ pressed }) => [
                        styles.langBtn,
                        i18n.language === lng && {
                          backgroundColor: themeColors.langBtnActiveBg,
                          borderColor: themeColors.langBtnActiveBorder,
                        },
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <RetroText
                        style={[
                          styles.langBtnText,
                          i18n.language === lng && { color: themeColors.primary },
                        ]}
                      >
                        {languageLabels[lng]}
                      </RetroText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={[styles.optionRow, { borderBottomColor: themeColors.border }]}>
                <RetroText style={[styles.optionLabel, { color: themeColors.text }]}>
                  {t('game.optionTheme')}
                </RetroText>
                <View style={styles.languageButtonsRow}>
                  <Pressable
                    onPress={() => setTheme('system')}
                    style={({ pressed }) => [
                      styles.langBtn,
                      theme === 'system' && {
                        backgroundColor: themeColors.langBtnActiveBg,
                        borderColor: themeColors.langBtnActiveBorder,
                      },
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <RetroText
                      style={[styles.langBtnText, theme === 'system' && { color: themeColors.primary }]}
                    >
                      {t('game.themeSystem')}
                    </RetroText>
                  </Pressable>
                  <Pressable
                    onPress={() => setTheme('dark')}
                    style={({ pressed }) => [
                      styles.langBtn,
                      theme === 'dark' && {
                        backgroundColor: themeColors.langBtnActiveBg,
                        borderColor: themeColors.langBtnActiveBorder,
                      },
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <RetroText
                      style={[styles.langBtnText, theme === 'dark' && { color: themeColors.primary }]}
                    >
                      {t('game.themeDark')}
                    </RetroText>
                  </Pressable>
                  <Pressable
                    onPress={() => setTheme('light')}
                    style={({ pressed }) => [
                      styles.langBtn,
                      theme === 'light' && {
                        backgroundColor: themeColors.langBtnActiveBg,
                        borderColor: themeColors.langBtnActiveBorder,
                      },
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <RetroText
                      style={[styles.langBtnText, theme === 'light' && { color: themeColors.primary }]}
                    >
                      {t('game.themeLight')}
                    </RetroText>
                  </Pressable>
                </View>
              </View>
              <Pressable
                onPress={goInstructions}
                style={({ pressed }) => [
                  styles.optionRow,
                  styles.optionRowPressable,
                  { borderBottomColor: themeColors.border },
                  pressed && styles.btnPressed,
                ]}
              >
                <RetroText style={[styles.optionLabel, { color: themeColors.text }]}>
                  {t('menu.instructions')}
                </RetroText>
                <RetroText style={[styles.optionRowArrow, { color: themeColors.primary }]}>›</RetroText>
              </Pressable>
              <Pressable
                onPress={() => {
                  closeOptions();
                  goLeaderboard();
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  styles.optionRowPressable,
                  { borderBottomColor: themeColors.border },
                  pressed && styles.btnPressed,
                ]}
              >
                <RetroText style={[styles.optionLabel, { color: themeColors.text }]}>
                  {t('menu.leaderboard')}
                </RetroText>
                <RetroText style={[styles.optionRowArrow, { color: themeColors.primary }]}>›</RetroText>
              </Pressable>
            </ScrollView>
            <View style={[styles.drawerFooter, { borderTopColor: themeColors.border }]}>
              <Pressable
                onPress={closeOptions}
                style={({ pressed }) => [
                  styles.menuButtonGreen,
                  {
                    borderColor: themeColors.primary,
                    shadowColor: themeColors.primary,
                  },
                  pressed && styles.btnPressed,
                ]}
              >
                <RetroText style={[styles.menuButtonTextGreen, { color: themeColors.primary }]}>
                  {t('game.backToGame')}
                </RetroText>
              </Pressable>
              <Pressable
                onPress={() => {
                  closeOptions();
                  goMenu();
                }}
                style={({ pressed }) => [
                  styles.menuButton,
                  {
                    borderColor: themeColors.danger,
                    shadowColor: themeColors.danger,
                  },
                  pressed && styles.btnPressed,
                ]}
              >
                <RetroText style={[styles.menuButtonText, { color: themeColors.danger }]}>
                  {t('game.mainMenu')}
                </RetroText>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
  }

const styles = StyleSheet.create({
  safeAreaWrapper: {
    backgroundColor: '#0a0e1a',
  },
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
  buttonDisabled: {
    opacity: 0.5,
  },
  optionsButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 26,
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
    width: SCREEN_WIDTH,
    alignSelf: 'stretch',
    backgroundColor: '#0d1419',
    borderLeftWidth: 1,
    borderLeftColor: '#1a3322',
    paddingTop: SPACING * 6,
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
    flexDirection: 'column',
    gap: SPACING,
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
  playPauseButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playPauseButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: '#ff8800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  playPauseButtonIcon: {
    fontSize: 18,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    fontFamily: FONT_FAMILY,
    color: '#ff3333',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  menuButtonGreen: {
    borderWidth: 1,
    borderColor: '#00ff41',
    backgroundColor: 'transparent',
    paddingVertical: SPACING,
    paddingHorizontal: SPACING * 3,
    borderRadius: 4,
    marginTop: SPACING,
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonTextGreen: {
    fontFamily: FONT_FAMILY,
    color: '#00ff41',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

registerRootComponent(App);
