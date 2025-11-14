import React, {useEffect, useState, useRef, useCallback} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';

export default function CameraView({
  onCapture,
}: {
  onCapture: (uri: string) => void;
}) {
  const [hasPermission, setHasPermission] = useState(false);
  const cameraRef = useRef<any>(null);
  const [isCaptureDisabled, setIsCaptureDisabled] = useState<boolean>(false);
  const disableTimerRef = useRef<any>(null);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) {
      console.warn('Camera ref not available');
      return;
    }

    try {
      const image = await cameraRef.current.capture();
      if (image && image.uri) {
        try {
          onCapture(image.uri);
          try {
            setIsCaptureDisabled(true);
            if (disableTimerRef.current) {
              clearTimeout(disableTimerRef.current);
            }
            disableTimerRef.current = setTimeout(() => {
              setIsCaptureDisabled(false);
              disableTimerRef.current = null;
            }, 2000);
          } catch (e) {
            console.warn('Error scheduling capture re-enable:', e);
          }
        } catch (callbackError) {
          console.error('Error in onCapture callback:', callbackError);
        }
      } else {
        console.warn('No image URI returned from camera');
      }
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  }, [onCapture]);

  useEffect(() => {
    (async () => {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;

      const result = await request(permission);
      setHasPermission(result === RESULTS.GRANTED);
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (disableTimerRef.current) {
        clearTimeout(disableTimerRef.current);
        disableTimerRef.current = null;
      }
    };
  }, []);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        cameraType={CameraType.Back}
      />
      {!isCaptureDisabled && (
        <TouchableOpacity onPress={takePicture} style={styles.button}>
          <Text style={styles.buttonText}>Capture</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  button: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    minWidth: 170,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.35,
    shadowOffset: {width: 0, height: 10},
    shadowRadius: 18,
    elevation: 12,
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.25,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
});
