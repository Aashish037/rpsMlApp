import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {GameResult} from '../utils/gameLogic';

type StatusState = 'idle' | 'processing' | GameResult;

interface ResultCardProps {
  gameResult?: GameResult;
  playerGesture?: string | null;
  aiGesture?: string | null;
  message: string;
  confidence?: number | null;
  isProcessing: boolean;
}

const gestureMeta: Record<
  string,
  {label: string; emoji: string; hint: string; color: string}
> = {
  rock: {
    label: 'Rock',
    emoji: '✊',
    hint: 'Crushes scissors',
    color: '#f97316',
  },
  paper: {
    label: 'Paper',
    emoji: '✋',
    hint: 'Covers rock',
    color: '#22d3ee',
  },
  scissors: {
    label: 'Scissors',
    emoji: '✌️',
    hint: 'Cut paper',
    color: '#a855f7',
  },
};

const statusPalette: Record<
  StatusState,
  {title: string; subtitle: string; background: string; accent: string}
> = {
  idle: {
    title: 'Ready when you are',
    subtitle: 'Align your hand with the frame and tap capture.',
    background: 'rgba(17, 24, 39, 0.88)',
    accent: '#334155',
  },
  processing: {
    title: 'Analyzing gesture…',
    subtitle: 'Hold steady while we inspect your hand pose.',
    background: 'rgba(30, 64, 175, 0.92)',
    accent: '#60a5fa',
  },
  win: {
    title: 'You win!',
    subtitle: 'Nice move. Ready for another round?',
    background: 'rgba(21, 128, 61, 0.94)',
    accent: '#4ade80',
  },
  lose: {
    title: 'Defeated this time',
    subtitle: 'Shake it off and try a different gesture.',
    background: 'rgba(185, 28, 28, 0.94)',
    accent: '#f87171',
  },
  draw: {
    title: 'It’s a draw',
    subtitle: 'Great minds think alike. Try again!',
    background: 'rgba(202, 138, 4, 0.94)',
    accent: '#facc15',
  },
};

function formatGesture(value?: string | null) {
  if (!value) {
    return undefined;
  }
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function resolveGestureMeta(value?: string | null) {
  const formatted = formatGesture(value);
  if (!formatted) {
    return undefined;
  }
  return (
    gestureMeta[formatted.toLowerCase()] ?? {
      label: formatted,
      emoji: '🤖',
      hint: 'Unrecognized move',
      color: '#94a3b8',
    }
  );
}

export default function ResultCard({
  gameResult,
  playerGesture,
  aiGesture,
  message,
  confidence,
  isProcessing,
}: ResultCardProps) {
  const status: StatusState = useMemo(() => {
    if (isProcessing) {
      return 'processing';
    }
    if (gameResult) {
      return gameResult;
    }
    return 'idle';
  }, [gameResult, isProcessing]);

  const palette = statusPalette[status];
  const player = resolveGestureMeta(playerGesture);
  const ai = resolveGestureMeta(aiGesture);
  const confidencePercent =
    typeof confidence === 'number'
      ? Math.round(Math.min(Math.max(confidence * 100, 0), 100))
      : null;

  const showGestures = !!(player || ai);

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <View style={[styles.card, {backgroundColor: palette.background}]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.statusTitle}>{palette.title}</Text>
            <Text style={styles.statusSubtitle}>{palette.subtitle}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${palette.accent}22`,
                borderColor: palette.accent,
              },
            ]}>
            <Text style={[styles.statusBadgeText, {color: palette.accent}]}>
              {status === 'processing'
                ? 'Processing'
                : status === 'idle'
                ? 'Ready'
                : status === 'win'
                ? 'Victory'
                : status === 'lose'
                ? 'Retry'
                : 'Draw'}
            </Text>
          </View>
        </View>

        {showGestures && (
          <View style={styles.gestureRow}>
            <View style={styles.gestureColumn}>
              <Text style={styles.gestureLabel}>You</Text>
              <View
                style={[
                  styles.gestureBadge,
                  {borderColor: player?.color ?? '#38bdf8'},
                ]}>
                <Text style={styles.gestureEmoji}>{player?.emoji ?? '🫵'}</Text>
              </View>
              <Text style={styles.gestureName}>{player?.label ?? '—'}</Text>
              <Text style={styles.gestureHint}>
                {player?.hint ?? 'Awaiting gesture'}
              </Text>
            </View>

            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.gestureColumn}>
              <Text style={styles.gestureLabel}>AI</Text>
              <View
                style={[
                  styles.gestureBadge,
                  {borderColor: ai?.color ?? '#6366f1'},
                ]}>
                <Text style={styles.gestureEmoji}>{ai?.emoji ?? '🤖'}</Text>
              </View>
              <Text style={styles.gestureName}>{ai?.label ?? '—'}</Text>
              <Text style={styles.gestureHint}>
                {ai?.hint ?? 'Watching closely'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.messagePanel}>
          <Text style={styles.messageText}>{message}</Text>
        </View>

        {typeof confidencePercent === 'number' && (
          <View style={styles.confidenceContainer}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>Model confidence</Text>
              <Text style={styles.confidenceValue}>
                {confidencePercent}
                <Text style={styles.confidenceValueSuffix}>%</Text>
              </Text>
            </View>
            <View style={styles.confidenceTrack}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: `${confidencePercent}%`,
                    backgroundColor: palette.accent,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 16,
  },
  statusTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  statusSubtitle: {
    color: 'rgba(248,250,252,0.78)',
    marginTop: 4,
    fontSize: 13.5,
    lineHeight: 18,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  gestureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gestureColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  gestureLabel: {
    color: 'rgba(248,250,252,0.64)',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  gestureBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  gestureEmoji: {
    fontSize: 30,
  },
  gestureName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  gestureHint: {
    color: 'rgba(226,232,240,0.75)',
    fontSize: 12.5,
    textAlign: 'center',
  },
  vsBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  vsText: {
    color: '#f8fafc',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  messagePanel: {
    backgroundColor: 'rgba(15,23,42,0.24)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  messageText: {
    color: '#e2e8f0',
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  confidenceContainer: {
    gap: 10,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceLabel: {
    color: 'rgba(226,232,240,0.75)',
    fontSize: 12.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  confidenceValue: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
  confidenceValueSuffix: {
    fontSize: 13,
    fontWeight: '500',
  },
  confidenceTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 999,
  },
});
