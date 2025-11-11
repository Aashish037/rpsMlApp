import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import {loadModel} from './ml/gestureModel';
import AppNavigator from './AppNavigator';

export default function App() {
  useEffect(() => {
    // Initialize TensorFlow.js and preload model
    const initTF = async () => {
      try {
        await tf.ready();
        console.log('TensorFlow.js initialized');
        // Preload model in background
        loadModel().catch(err => {
          console.warn('Model preload failed, will load on first use:', err);
        });
      } catch (error) {
        console.error('Error initializing TensorFlow.js:', error);
      }
    };
    initTF();
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
