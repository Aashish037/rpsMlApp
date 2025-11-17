import React, {useMemo, useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import CameraView, {CameraViewHandle} from '../components/CameraView';
import ResultCard from '../components/ResultCard';
import {predictGestureFromApi, warmupApi} from '../services/gestureApi';
import {getResult, GameResult} from '../utils/gameLogic';
import {compressImageForUpload} from '../utils/imageCompression';

const API_DISPLAY = 'rps-gesture-2.onrender.com/predict';
const VALID_GESTURES = ['rock', 'paper', 'scissors'] as const;

function normalizeConfidence(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  if (value > 1) {
    return Math.min(value / 100, 1);
  }
  if (value < 0) {
    return 0;
  }
  return value;
}

function getRandomAIMove() {
  const index = Math.floor(Math.random() * VALID_GESTURES.length);
  return VALID_GESTURES[index];
}

export default function GameScreen() {
  const cameraRef = useRef<CameraViewHandle | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    'Center your hand, keep lighting even, and tap capture to send a frame to the FastAPI model.',
  );
  const [gameResult, setGameResult] = useState<GameResult | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [playerGesture, setPlayerGesture] = useState<string | null>(null);
  const [aiGesture, setAiGesture] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiWarmedUp, setApiWarmedUp] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(true);
  const warmupAttemptedRef = useRef(false);

  // /* Warm up API on mount to wake up Render service (with retry) */
  useEffect(() => {
    let mounted = true;
    const attemptWarmup = async (retryCount = 0) => {
      if (warmupAttemptedRef.current && retryCount === 0) {
        return; 
      }
      warmupAttemptedRef.current = true;
      setIsWarmingUp(true);

      try {
        const success = await warmupApi();
        if (mounted) {
          setApiWarmedUp(success);
          setIsWarmingUp(false);
          if (success) {
            console.log('API warmed up successfully');
          } else if (retryCount < 2) {
            // Retry once after 3 seconds
            setTimeout(() => {
              if (mounted) {
                attemptWarmup(retryCount + 1);
              }
            }, 3000);
          } else {
            setIsWarmingUp(false);
          }
        }
      } catch (error) {
        if (mounted) {
          setApiWarmedUp(false);
          if (retryCount < 2) {
            // Retry once after 3 seconds
            setTimeout(() => {
              if (mounted) {
                attemptWarmup(retryCount + 1);
              }
            }, 3000);
          } else {
            setIsWarmingUp(false);
          }
        }
      }
    };

    attemptWarmup();

    return () => {
      mounted = false;
    };
  }, []);

  const runPrediction = useCallback(
    async ({
      uri,
      fileName,
      mimeType,
      origin,
    }: {
      uri: string;
      fileName?: string;
      mimeType?: string;
      origin: 'camera' | 'gallery';
    }) => {
      if (!uri) {
        setStatusMessage(
          'The selected image is unavailable. Please try again.',
        );
        return;
      }

      setIsProcessing(true);
      setStatusMessage('Compressing image for faster upload…');
      setErrorMessage(null);
      setGameResult(undefined);
      setPlayerGesture(null);
      setAiGesture(null);
      setConfidence(null);

      try {
        // Ensure API is warmed up before prediction
        if (!apiWarmedUp && !isWarmingUp) {
          setStatusMessage('Waking up the API server…');
          const warmed = await warmupApi();
          setApiWarmedUp(warmed);
          if (!warmed) {
            console.warn('Warmup failed, proceeding with prediction anyway');
          }
        }

        // Compress image before upload to reduce transfer time
        const compressed = await compressImageForUpload(uri);
        setStatusMessage(
          origin === 'gallery'
            ? 'Uploading gallery photo to FastAPI for classification…'
            : 'Uploading photo to FastAPI for classification…',
        );

        const prediction = await predictGestureFromApi(compressed.uri, {
          fileName,
          mimeType,
        });

        if (!prediction) {
          setStatusMessage(
            'The API could not recognize your hand. Try again with better lighting and a centered gesture.',
          );
          return;
        }

        const aiMove = getRandomAIMove();
        const resultInfo = getResult(prediction.gesture, aiMove);
        const normalizedConfidence = normalizeConfidence(prediction.confidence);

        setPlayerGesture(prediction.gesture);
        setAiGesture(aiMove);
        setGameResult(resultInfo.result);
        setStatusMessage(resultInfo.message);
        setConfidence(normalizedConfidence);
      } catch (error: any) {
        console.error('Prediction failed', error);
        const errorMessage = error?.message || 'Unknown error';

        if (errorMessage.includes('timeout')) {
          setErrorMessage(
            'API request timed out (60s). The Render service may be cold-starting. Please wait a moment and try again—subsequent requests will be faster once the service is awake.',
          );
          setStatusMessage(
            'Server is waking up. Please wait 10-15 seconds and try again.',
          );
        } else if (
          errorMessage.includes('Network') ||
          errorMessage.includes('fetch')
        ) {
          setErrorMessage(
            'Network connection error. Please check your internet connection and ensure the API endpoint is accessible.',
          );
          setStatusMessage(
            'Unable to connect to the API server. Check your network connection.',
          );
        } else if (errorMessage.includes('500')) {
          setErrorMessage(
            'Server error: The API encountered an internal error. This may indicate the model file is missing or the server needs to be redeployed.',
          );
          setStatusMessage(
            'Server error occurred. Please try again or contact support.',
          );
        } else {
          setErrorMessage(
            `Prediction failed: ${errorMessage}. Please try again.`,
          );
          setStatusMessage('An error occurred. Please try again.');
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [apiWarmedUp, isWarmingUp],
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) {
      setStatusMessage('Camera is still warming up. Give it a second.');
      return;
    }

    setStatusMessage('Capturing your gesture…');

    const photo = await cameraRef.current.capturePhoto();

    if (!photo || !photo.uri) {
      setStatusMessage('Unable to capture a photo. Please try again.');
      return;
    }

    runPrediction({
      uri: photo.uri,
      fileName: `capture-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      origin: 'camera',
    });
  }, [runPrediction]);

  const handleUploadFromGallery = useCallback(async () => {
    setStatusMessage('Opening gallery…');
    setErrorMessage(null);

    const response = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.9,
    });

    if (response.didCancel) {
      setStatusMessage('Gallery selection canceled.');
      return;
    }

    if (response.errorCode) {
      console.error('Gallery picker error', response.errorMessage);
      setErrorMessage('Unable to open gallery. Please try again.');
      setStatusMessage('Gallery access failed.');
      return;
    }

    const asset = response.assets?.[0];

    if (!asset?.uri) {
      setStatusMessage('No image selected. Please pick another photo.');
      return;
    }

    runPrediction({
      uri: asset.uri,
      fileName: asset.fileName ?? `gallery-${Date.now()}.jpg`,
      mimeType: asset.type ?? 'image/jpeg',
      origin: 'gallery',
    });
  }, [runPrediction]);

  const handlePlayAgain = useCallback(() => {
    setStatusMessage(
      'Line up your next move and tap capture to send it to the model.',
    );
    setGameResult(undefined);
    setPlayerGesture(null);
    setAiGesture(null);
    setConfidence(null);
    setErrorMessage(null);
  }, []);

  const headerHint = useMemo(() => {
    if (isWarmingUp) {
      return 'Initializing API connection… (this may take 30-60 seconds on first launch)';
    }
    if (!cameraReady) {
      return 'Initializing camera feed…';
    }
    if (isProcessing) {
      return 'Sending photo to the FastAPI model…';
    }
    if (gameResult === 'win') {
      return 'Nice! The AI did not see that coming.';
    }
    if (gameResult === 'lose') {
      return 'Tough luck. Switch up your timing and try again.';
    }
    if (gameResult === 'draw') {
      return 'Great minds think alike. Change it up for the next round.';
    }
    if (playerGesture) {
      return `Last detected gesture: ${playerGesture.toUpperCase()}`;
    }
    if (!apiWarmedUp) {
      return 'API ready. First prediction may take longer as the server wakes up.';
    }
    return 'Tip: keep your hand steady and fill the frame for best results.';
  }, [
    cameraReady,
    isProcessing,
    gameResult,
    playerGesture,
    isWarmingUp,
    apiWarmedUp,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView ref={cameraRef} onCameraReady={() => setCameraReady(true)} />

      <View style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.headerOverlay} pointerEvents="none">
          <Text style={styles.headerTitle}>Rock · Paper · Scissors</Text>
          <Text style={styles.headerSubtitle}>{headerHint}</Text>
          <View style={styles.apiBadge}>
            <Text style={styles.apiBadgeLabel}>API</Text>
            <Text style={styles.apiBadgeValue}>{API_DISPLAY}</Text>
            {isWarmingUp && (
              <ActivityIndicator
                size="small"
                color="#bae6fd"
                style={{marginLeft: 8}}
              />
            )}
            {!isWarmingUp && apiWarmedUp && (
              <Text style={styles.apiStatusIndicator}>✓</Text>
            )}
          </View>
        </View>

        {isProcessing && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBackdrop} />
            <ActivityIndicator size="large" color="#f8fafc" />
            <Text style={styles.loadingText}>Analyzing gesture…</Text>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
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

        <View style={styles.controlsContainer}>
          {!gameResult && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleUploadFromGallery}
                disabled={isProcessing}
                style={[
                  styles.iconButton,
                  isProcessing && styles.iconButtonDisabled,
                ]}>
                <Text style={styles.iconEmoji}>📁</Text>
                <Text style={styles.iconLabel}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCapture}
                style={[
                  styles.captureButton,
                  (!cameraReady || isProcessing) &&
                    styles.captureButtonDisabled,
                ]}
                disabled={!cameraReady || isProcessing}>
                <Text
                  style={[
                    styles.captureButtonText,
                    (!cameraReady || isProcessing) &&
                      styles.captureButtonTextDisabled,
                  ]}>
                  Capture
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {gameResult && (
            <TouchableOpacity
              onPress={handlePlayAgain}
              style={styles.captureButton}>
              <Text style={styles.captureButtonText}>Play Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    elevation: 1,
    pointerEvents: 'box-none',
  },
  headerOverlay: {
    position: 'absolute',
    top: 44,
    left: 24,
    right: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.35,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 16,
    elevation: 10,
    gap: 8,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(226,232,240,0.85)',
    fontSize: 13,
    lineHeight: 19,
  },
  apiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 8,
  },
  apiBadgeLabel: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.6,
  },
  apiBadgeValue: {
    color: '#bae6fd',
    fontSize: 12,
  },
  apiStatusIndicator: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
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
    elevation: 15,
    zIndex: 15,
  },
  loadingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
  },
  loadingText: {
    marginTop: 14,
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  errorBanner: {
    position: 'absolute',
    top: 170,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(185, 28, 28, 0.92)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    zIndex: 12,
  },
  errorText: {
    color: '#ffe4e6',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    elevation: 20,
    zIndex: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  iconEmoji: {
    fontSize: 20,
    color: '#f8fafc',
  },
  iconLabel: {
    color: '#f8fafc',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  captureButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 999,
    minWidth: 150,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.4,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 16,
    elevation: 20,
    zIndex: 20,
  },
  captureButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.6,
  },
  captureButtonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  captureButtonTextDisabled: {
    color: '#94a3b8',
  },
});
