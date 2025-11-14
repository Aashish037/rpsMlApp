import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {loadModel} from './ml/gestureModel';
import AppNavigator from './AppNavigator';

export default function App() {
  useEffect(() => {
    let originalPromiseRejectionHandler: any = null;
    try {
      const {ErrorUtils} = require('react-native');
      if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === 'function') {
        const originalHandler = ErrorUtils.getGlobalHandler
          ? ErrorUtils.getGlobalHandler()
          : null;
        ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
          console.error('Global error handler:', error, isFatal);
          if (originalHandler) {
            originalHandler(error, isFatal);
          }
        });
      }
    } catch (err) {
      console.warn('ErrorUtils not available:', err);
    }

    try {
      const rejectionHandler = (event: any) => {
        console.error('Unhandled promise rejection:', event.reason);
        if (event.preventDefault) {
          event.preventDefault();
        }
      };

      originalPromiseRejectionHandler = (global as any).onunhandledrejection;
      (global as any).onunhandledrejection = rejectionHandler;
    } catch (err) {
      console.warn('Promise rejection handler not available:', err);
    }

    const initGestureDetection = async () => {
      try {
        console.log('Initializing gesture detection...');
        await loadModel();
        console.log('Gesture detection ready');
      } catch (error) {
        console.error('Error initializing gesture detection:', error);
        if (__DEV__) {
          console.error('Full error details:', error);
        }
      }
    };
    initGestureDetection();

    // Cleanup
    return () => {
      if (originalPromiseRejectionHandler !== null) {
        (global as any).onunhandledrejection = originalPromiseRejectionHandler;
      }
    };
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
