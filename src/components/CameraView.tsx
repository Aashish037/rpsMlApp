import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  PhotoFile,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

export type CameraViewHandle = {
  capturePhoto: () => Promise<{uri: string; path: string} | null>;
};

type CameraViewProps = {
  onCameraReady?: () => void;
};

const normalizePathToUri = (path: string) => {
  if (!path) {
    return path;
  }
  if (path.startsWith('file://')) {
    return path;
  }
  if (Platform.OS === 'android') {
    return `file://${path}`;
  }
  return path;
};

const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(
  ({onCameraReady}, ref) => {
    const cameraRef = useRef<Camera>(null);
    const device = useCameraDevice('back');
    const {hasPermission, requestPermission} = useCameraPermission();
    const [permissionRequested, setPermissionRequested] = useState(false);

    useEffect(() => {
      (async () => {
        if (!hasPermission && !permissionRequested) {
          setPermissionRequested(true);
          await requestPermission();
        }
      })();
    }, [hasPermission, permissionRequested, requestPermission]);

    useEffect(() => {
      if (hasPermission && device && onCameraReady) {
        onCameraReady();
      }
    }, [device, hasPermission, onCameraReady]);

    const capturePhoto = useCallback(async () => {
      if (!cameraRef.current || !hasPermission) {
        return null;
      }
      try {
        const photo: PhotoFile = await cameraRef.current.takePhoto({
          flash: 'off',
          qualityPrioritization: 'balanced',
        });

        return {
          uri: normalizePathToUri(photo.path),
          path: photo.path,
        };
      } catch (error) {
        console.warn('Unable to capture photo via VisionCamera', error);
        return null;
      }
    }, [hasPermission]);

    useImperativeHandle(
      ref,
      () => ({
        capturePhoto,
      }),
      [capturePhoto],
    );

    if (!hasPermission) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#e2e8f0" />
          <Text style={styles.text}>
            Grant camera permission in settings to continue.
          </Text>
          <Text style={styles.retry} onPress={requestPermission}>
            Tap to retry
          </Text>
        </View>
      );
    }

    if (!device) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#e2e8f0" />
          <Text style={styles.text}>Looking for the back camera…</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive
          photo
          audio={false}
        />
      </View>
    );
  },
);

export default CameraView;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'black',
    gap: 12,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  text: {
    color: '#f8fafc',
    textAlign: 'center',
    fontSize: 16,
  },
  retry: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '600',
  },
});
