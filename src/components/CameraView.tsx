import React, {useEffect, useState, useRef} from 'react';
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

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const image = await cameraRef.current.capture();
        if (image && image.uri) {
          onCapture(image.uri);
        }
      } catch (error) {
        console.error('Error capturing image:', error);
      }
    }
  };

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
      <TouchableOpacity onPress={takePicture} style={styles.button}>
        <Text style={styles.text}>📸 Capture</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center'
  },
  camera: {
    flex: 1
  },
  button: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  text: {
    color: 'white', 
    textAlign: 'center', 
    fontSize: 16,
  },
});
