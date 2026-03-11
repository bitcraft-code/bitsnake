import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import RetroText from '../components/RetroText';
import { THEMES } from '../theme';

const SORT_POSITION = 'position';
const SORT_TIME = 'time';
const SORT_MOVES = 'moves';
const CELL_GAP = 8;
const ARROW_UP = '▲';
const ARROW_DOWN = '▼';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (dateISO, locale) => {
  try {
    const d = new Date(dateISO);
    return d.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  } catch {
    return dateISO || '—';
  }
};

const isSameEntry = (a, b) =>
  a && b && a.date === b.date && a.score === b.score && (a.timeSeconds ?? 0) === (b.timeSeconds ?? 0);

const NEON_PULSE_MIN = 0.72;
const NEON_PULSE_MAX = 1;
const NEON_PULSE_MS = 1200;

const LeaderboardScreen = ({ theme = 'dark', entries = [], lastGameEntry, onBack }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pt' ? 'pt-BR' : i18n.language;
  const themeColors = THEMES[theme] || THEMES.dark;
  const neonPulse = useRef(new Animated.Value(NEON_PULSE_MAX)).current;
  const [sortBy, setSortBy] = useState(SORT_POSITION);
  const [sortAsc, setSortAsc] = useState(false);

  const defaultSortAsc = (key) => {
    if (key === SORT_POSITION) return false;
    if (key === SORT_TIME || key === SORT_MOVES) return true;
    return true;
  };

  const handleSortPress = useCallback(
    (sortKey) => {
      if (sortBy === sortKey) {
        setSortAsc((a) => !a);
      } else {
        setSortBy(sortKey);
        setSortAsc(defaultSortAsc(sortKey));
      }
    },
    [sortBy],
  );

  const sortedEntries = useMemo(() => {
    const list = [...entries];
    const dir = sortAsc ? 1 : -1;
    if (sortBy === SORT_POSITION) {
      list.sort((a, b) => {
        if (b.score !== a.score) return dir * (a.score - b.score);
        return dir * ((a.timeSeconds ?? 0) - (b.timeSeconds ?? 0));
      });
    } else if (sortBy === SORT_TIME) {
      list.sort((a, b) => dir * ((a.timeSeconds ?? 0) - (b.timeSeconds ?? 0)));
    } else if (sortBy === SORT_MOVES) {
      list.sort((a, b) => dir * ((a.moveCount ?? 0) - (b.moveCount ?? 0)));
    }
    return list;
  }, [entries, sortBy, sortAsc]);

  const getSortArrow = (key) => {
    if (sortBy !== key) return null;
    return sortAsc ? ARROW_UP : ARROW_DOWN;
  };

  const HeaderCell = ({ label, sortKey, style }) => {
    const isActive = sortKey && sortBy === sortKey;
    const arrow = getSortArrow(sortKey);
    const isSortable = Boolean(sortKey);
    return (
      <View style={[styles.thCell, style]} collapsable={false}>
        {isSortable ? (
          <Pressable
            onPress={() => handleSortPress(sortKey)}
            style={styles.thPressable}
            hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
            android_ripple={null}
          >
            <View style={styles.thContent}>
              <RetroText
                style={[styles.th, { color: isActive ? themeColors.primary : themeColors.textMuted, textAlign: 'left' }]}
              >
                {label}
              </RetroText>
              {arrow != null && (
                <RetroText style={[styles.thArrow, { color: themeColors.primary }]}>{arrow}</RetroText>
              )}
            </View>
          </Pressable>
        ) : (
          <View style={styles.thContent}>
            <RetroText
              style={[styles.th, { color: themeColors.textMuted, textAlign: 'left' }]}
            >
              {label}
            </RetroText>
          </View>
        )}
      </View>
    );
  };

  useEffect(() => {
    if (!lastGameEntry) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(neonPulse, {
          toValue: NEON_PULSE_MIN,
          duration: NEON_PULSE_MS / 2,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(neonPulse, {
          toValue: NEON_PULSE_MAX,
          duration: NEON_PULSE_MS / 2,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [lastGameEntry, neonPulse]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <RetroText
        style={[
          styles.title,
          { color: themeColors.primary, textShadowColor: themeColors.primary },
        ]}
      >
        {t('leaderboard.title')}
      </RetroText>
      <View style={[styles.titleLine, { backgroundColor: themeColors.primary }]} />

      <View style={[styles.tableHeader, { borderBottomColor: themeColors.border }]}>
        <HeaderCell label="#" sortKey={SORT_POSITION} style={styles.thRank} />
        <HeaderCell label={t('leaderboard.score')} style={styles.thScore} />
        <HeaderCell label={t('leaderboard.time')} sortKey={SORT_TIME} style={styles.thTime} />
        <HeaderCell label={t('leaderboard.moves')} sortKey={SORT_MOVES} style={styles.thMoves} />
        <HeaderCell label={t('leaderboard.date')} style={styles.thDate} />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} scrollEnabled={false} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <View style={styles.emptyBlock}>
            <RetroText style={[styles.empty, { color: themeColors.textMuted }]}>
              {t('leaderboard.empty')}
            </RetroText>
            <RetroText style={[styles.emptyEncourage, { color: themeColors.primary }]}>
              {t('leaderboard.emptyEncourage')}
            </RetroText>
          </View>
        ) : (
          sortedEntries.map((entry, index) => {
            const isLastGame = isSameEntry(entry, lastGameEntry);
            const rowColor = isLastGame ? themeColors.secondary : themeColors.primary;
            const mutedColor = isLastGame ? themeColors.secondary : themeColors.textMuted2;
            const glowStyle = isLastGame
              ? {
                  textShadowColor: themeColors.secondary,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 2,
                }
              : {};
            const rowContent = (
              <>
                <View style={[styles.cellWrap, styles.cellRank]}>
                  <RetroText style={[styles.cell, { color: mutedColor, textAlign: 'left' }, glowStyle]}>
                    {index + 1}
                  </RetroText>
                </View>
                <View style={[styles.cellWrap, styles.cellScore]}>
                  <RetroText style={[styles.cell, { color: rowColor, textAlign: 'left' }, glowStyle]}>
                    {entry.score}
                  </RetroText>
                </View>
                <View style={[styles.cellWrap, styles.cellTime]}>
                  <RetroText style={[styles.cell, { color: rowColor, textAlign: 'left' }, glowStyle]}>
                    {formatTime(entry.timeSeconds)}
                  </RetroText>
                </View>
                <View style={[styles.cellWrap, styles.cellMoves]}>
                  <RetroText style={[styles.cell, { color: rowColor, textAlign: 'left' }, glowStyle]}>
                    {entry.moveCount ?? '—'}
                  </RetroText>
                </View>
                <View style={[styles.cellWrap, styles.cellDate]}>
                  <RetroText
                    style={[styles.cell, styles.cellDateText, { color: mutedColor, textAlign: 'left' }, glowStyle]}
                  >
                    {formatDate(entry.date, locale)}
                  </RetroText>
                </View>
              </>
            );
            const rowStyle = [
              styles.row,
              { borderBottomColor: themeColors.border },
              isLastGame && { backgroundColor: themeColors.surfaceAlt },
            ];
            if (isLastGame) {
              return (
                <Animated.View key={`${entry.date}-${index}`} style={[rowStyle, { opacity: neonPulse }]}>
                  {rowContent}
                </Animated.View>
              );
            }
            return (
              <View key={`${entry.date}-${index}`} style={rowStyle}>
                {rowContent}
              </View>
            );
          })
        )}
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
          {t('leaderboard.back')}
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
    fontSize: 28,
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
  tableHeader: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3322',
    marginBottom: 4,
    gap: CELL_GAP,
  },
  thCell: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    minHeight: 44,
    justifyContent: 'center',
  },
  thPressable: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  thContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  th: {
    fontSize: 9,
    color: '#4a6a4a',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'left',
  },
  thArrow: {
    fontSize: 8,
  },
  thRank: { flex: 0.5 },
  thScore: { flex: 1 },
  thTime: { flex: 1 },
  thMoves: { flex: 1 },
  thDate: { flex: 1.2 },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#111a2a',
    alignItems: 'center',
    gap: CELL_GAP,
  },
  cellWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  cell: {
    fontSize: 11,
    color: '#00ff41',
    textAlign: 'left',
  },
  cellRank: { flex: 0.5 },
  cellScore: { flex: 1 },
  cellTime: { flex: 1 },
  cellMoves: { flex: 1 },
  cellDate: { flex: 1.2 },
  cellDateText: { color: '#5a7a5a', fontSize: 10 },
  emptyBlock: {
    marginTop: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    fontSize: 12,
    color: '#4a6a4a',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyEncourage: {
    fontSize: 11,
    color: '#00ff41',
    textAlign: 'center',
    letterSpacing: 1,
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

export default LeaderboardScreen;
