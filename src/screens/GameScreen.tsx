import React, {useState} from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import CameraView from '../components/CameraView';
import ResultCard from '../components/ResultCard';
import {predictGesture} from '../ml/gestureModel';
import {getResult, GameResult} from '../utils/gameLogic';

export default function GameScreen() {
  const [result, setResult] = useState('Show your hand to play!');
  const [gameResult, setGameResult] = useState<GameResult | undefined>(
    undefined,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (uri: string) => {
    setIsProcessing(true);
    setResult('Processing gesture...');
    setGameResult(undefined);

    try {
      const prediction = await predictGesture(uri);
      const playerGesture = prediction.gesture;
      const confidence = prediction.confidence;

      const aiGesture = ['rock', 'paper', 'scissors'][
        Math.floor(Math.random() * 3)
      ];
      const resultInfo = getResult(playerGesture, aiGesture);
      setGameResult(resultInfo.result);

      // Show confidence in result
      const confidenceText = `(${(confidence * 100).toFixed(0)}% confidence)`;
      setResult(
        `You: ${playerGesture} ${confidenceText} | AI: ${aiGesture}\n${resultInfo.message}`,
      );
    } catch (error) {
      console.error('Error processing gesture:', error);
      setResult('Error processing gesture. Please try again.');
      setGameResult(undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView onCapture={handleCapture} />
      {isProcessing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Analyzing gesture...</Text>
        </View>
      )}
      <ResultCard result={result} gameResult={gameResult} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#000'
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});
