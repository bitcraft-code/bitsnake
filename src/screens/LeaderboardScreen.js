import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import RetroText from '../components/RetroText';

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

const LeaderboardScreen = ({ entries = [], onBack }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pt' ? 'pt-BR' : i18n.language;

  return (
    <View style={styles.container}>
      <RetroText style={styles.title}>{t('leaderboard.title')}</RetroText>
      <View style={styles.titleLine} />

      <View style={styles.tableHeader}>
        <RetroText style={[styles.th, styles.thRank]}>#</RetroText>
        <RetroText style={[styles.th, styles.thScore]}>{t('leaderboard.score')}</RetroText>
        <RetroText style={[styles.th, styles.thTime]}>{t('leaderboard.time')}</RetroText>
        <RetroText style={[styles.th, styles.thMoves]}>{t('leaderboard.moves')}</RetroText>
        <RetroText style={[styles.th, styles.thDate]}>{t('leaderboard.date')}</RetroText>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {entries.length === 0 ? (
          <View style={styles.emptyBlock}>
            <RetroText style={styles.empty}>{t('leaderboard.empty')}</RetroText>
            <RetroText style={styles.emptyEncourage}>{t('leaderboard.emptyEncourage')}</RetroText>
          </View>
        ) : (
          entries.map((entry, index) => (
            <View key={`${entry.date}-${index}`} style={styles.row}>
              <RetroText style={[styles.cell, styles.cellRank]}>{index + 1}</RetroText>
              <RetroText style={[styles.cell, styles.cellScore]}>{entry.score}</RetroText>
              <RetroText style={[styles.cell, styles.cellTime]}>{formatTime(entry.timeSeconds)}</RetroText>
              <RetroText style={[styles.cell, styles.cellMoves]}>{entry.moveCount ?? '—'}</RetroText>
              <RetroText style={[styles.cell, styles.cellDate]}>{formatDate(entry.date, locale)}</RetroText>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
        <RetroText style={styles.backButtonText}>{t('leaderboard.back')}</RetroText>
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
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3322',
    marginBottom: 4,
  },
  th: {
    fontSize: 9,
    color: '#4a6a4a',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  thRank: { width: '8%' },
  thScore: { width: '16%' },
  thTime: { width: '16%' },
  thMoves: { width: '16%' },
  thDate: { width: '44%' },
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
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#111a2a',
    alignItems: 'center',
  },
  cell: {
    fontSize: 11,
    color: '#00ff41',
  },
  cellRank: { width: '8%', color: '#5a7a5a' },
  cellScore: { width: '16%' },
  cellTime: { width: '16%' },
  cellMoves: { width: '16%' },
  cellDate: { width: '44%', color: '#5a7a5a', fontSize: 10 },
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
