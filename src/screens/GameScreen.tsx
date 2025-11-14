import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import CameraView from '../components/CameraView';
import ResultCard from '../components/ResultCard';
import {predictGesture} from '../ml/gestureModel';
import {getResult, GameResult} from '../utils/gameLogic';

export default function GameScreen() {
  const [statusMessage, setStatusMessage] = useState(
    'Align your hand inside the frame and tap capture to challenge the AI.',
  );
  const [gameResult, setGameResult] = useState<GameResult | undefined>(
    undefined,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [playerGesture, setPlayerGesture] = useState<string | null>(null);
  const [aiGesture, setAiGesture] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  const handleCapture = async (uri: string) => {
    if (!uri) {
      console.warn('No image URI provided');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Analyzing your gesture… Hold steady.');
    setGameResult(undefined);
    setPlayerGesture(null);
    setAiGesture(null);
    setConfidence(null);

    try {
      const prediction = await predictGesture(uri);
      // Validate prediction result
      if (!prediction || !prediction.gesture) {
        console.warn('Invalid prediction result');
        setStatusMessage('Could not detect gesture. Please try again.');
        setGameResult(undefined);
        setIsProcessing(false);
        return;
      }

      const playerGesture = prediction.gesture;

      // Ensure gesture is one of the valid options
      const validGestures = ['rock', 'paper', 'scissors'];
      if (!validGestures.includes(playerGesture.toLowerCase())) {
        console.warn('Invalid gesture detected:', playerGesture);
        setStatusMessage('Gesture not recognized. Please try again.');
        setGameResult(undefined);
        setIsProcessing(false);
        return;
      }

      const aiGesture = validGestures[Math.floor(Math.random() * 3)];
      const resultInfo = getResult(playerGesture.toLowerCase(), aiGesture);
      setGameResult(resultInfo.result);
      setPlayerGesture(playerGesture.toLowerCase());
      setAiGesture(aiGesture);
      setConfidence(prediction.confidence ?? null);
      setStatusMessage(resultInfo.message);
    } catch (error) {
      console.error('Error processing gesture:', error);
      setStatusMessage('Something went wrong. Please try again.');
      setGameResult(undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  const headerHint = useMemo(() => {
    if (isProcessing) {
      return 'Please keep your hand in view while we analyze the frame.';
    }
    if (gameResult === 'win') {
      return 'Nice reflexes! The AI did not see that one coming.';
    }
    if (gameResult === 'lose') {
      return 'The AI got lucky. Adjust your timing and try again.';
    }
    if (gameResult === 'draw') {
      return 'Same move, same mind. Switch it up for the next round.';
    }
    return 'Tip: keep your hand close to the camera and ensure good lighting.';
  }, [gameResult, isProcessing]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.backgroundOverlay} />
      <CameraView onCapture={handleCapture} />

      <View style={styles.headerOverlay} pointerEvents="none">
        <Text style={styles.headerTitle}>Rock · Paper · Scissors</Text>
        <Text style={styles.headerSubtitle}>{headerHint}</Text>
      </View>

      {isProcessing && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBackdrop} />
          <ActivityIndicator size="large" color="#f8fafc" />
          <Text style={styles.loadingText}>Analyzing gesture...</Text>
        </View>
      )}

      <ResultCard
        gameResult={gameResult}
        playerGesture={playerGesture}
        aiGesture={aiGesture}
        confidence={confidence}
        message={statusMessage}
        isProcessing={isProcessing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.35)',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 120,
  },
  loadingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
  },
  headerOverlay: {
    position: 'absolute',
    top: 44,
    left: 24,
    right: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.35,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 16,
    elevation: 8,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(226,232,240,0.78)',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },
  loadingText: {
    marginTop: 14,
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
