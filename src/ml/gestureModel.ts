import * as tf from '@tensorflow/tfjs';
import {decodeJpeg, bundleResourceIO} from '@tensorflow/tfjs-react-native';
import RNFS from 'react-native-fs';

const LABELS = ['paper', 'rock', 'scissors'];
const MODEL_INPUT_SIZE = 224;

let model: tf.LayersModel | null = null;
let isModelLoading = false;

const modelJson = require('../../assests/models/rps_tfjs_model/model.json');
const modelWeights = [
  require('../../assests/models/rps_tfjs_model/group1-shard1of11.bin'),
  require('../../assests/models/rps_tfjs_model/group1-shard2of11.bin'),
  require('../../assests/models/rps_tfjs_model/group1-shard3of11.bin'),
  require('../../assests/models/rps_tfjs_model/group1-shard4of11.bin'),
  require('../../assests/models/rps_tfjs_model/group1-shard5of11.bin'),
  require('../../assests/models/rps_tfjs_model/group1-shard6of11.bin'),
  require('../../assests/models/rps_tfjs_model/group1-shard7of11.bin'),
  require('../../assests/models/rps_tfjs_model/group1-shard8of11.bin'),
  require('../../assests/models/rps_tfjs_model/group1-shard9of11.bin'),
  require('../../assests/models/rps_tfjs_model/group1-shard10of11.bin'),
  require('../../assests/models/rps_tfjs_model/group1-shard11of11.bin'),
];

export async function loadModel(): Promise<boolean> {
  if (model) {
    console.log('Model already loaded');
    return true;
  }

  if (isModelLoading) {
    console.log('Model is already loading, waiting...');
    while (isModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return model !== null;
  }

  isModelLoading = true;

  try {
    console.log('Initializing TensorFlow.js...');
    await tf.ready();
    console.log('TensorFlow.js ready');

    console.log('Loading model using bundleResourceIO...');
    console.log('Model JSON loaded:', !!modelJson);
    console.log('Model weights loaded:', modelWeights.length, 'shards');

    // Load model using bundleResourceIO - the recommended way for React Native
    model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));

    console.log('Model loaded successfully');
    console.log('Model input shape:', model.inputs[0].shape);
    console.log('Model output shape:', model.outputs[0].shape);

    return true;
  } catch (error) {
    console.error('Error loading model:', error);
    model = null;
    return false;
  } finally {
    isModelLoading = false;
  }
}

async function preprocessImage(imageUri: string): Promise<tf.Tensor4D> {
  try {
    // Read image file as base64
    // Handle both file:// and content:// URIs
    let filePath = imageUri;
    if (imageUri.startsWith('file://')) {
      filePath = imageUri.replace('file://', '');
    } else if (imageUri.startsWith('content://')) {
      filePath = imageUri;
    }

    const imageBase64 = await RNFS.readFile(filePath, 'base64');

    // Convert base64 string to Uint8Array for decodeJpeg
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decode JPEG
    const imageTensor = decodeJpeg(bytes);

    // Resize to model input size (224x224)
    const resized = tf.image.resizeBilinear(imageTensor, [
      MODEL_INPUT_SIZE,
      MODEL_INPUT_SIZE,
    ]);

    // Normalize to [0, 1] range (divide by 255)
    const normalized = resized.div(255.0);

    // Add batch dimension [1, 224, 224, 3]
    const batched = normalized.expandDims(0);

    // Clean up intermediate tensors
    imageTensor.dispose();
    resized.dispose();
    normalized.dispose();

    return batched as tf.Tensor4D;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    throw error;
  }
}

// Function to predict gesture from image URI
export async function predictGesture(
  imageUri: string,
): Promise<{gesture: string; confidence: number; allProbabilities: number[]}> {
  try {
    if (!model) {
      console.log('Model not loaded, loading now...');
      const loaded = await loadModel();
      if (!loaded || !model) {
        throw new Error('Failed to load model');
      }
    }

    const startTime = Date.now();

    // Preprocess image
    const preprocessedImage = await preprocessImage(imageUri);

    // Run prediction
    const prediction = model.predict(preprocessedImage) as tf.Tensor;
    const probabilities = await prediction.data();

    // Clean up tensors
    preprocessedImage.dispose();
    prediction.dispose();

    // Find the class with highest probability
    let maxIndex = 0;
    let maxProb = probabilities[0];
    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIndex = i;
      }
    }

    const gesture = LABELS[maxIndex];
    const confidence = maxProb;
    const allProbabilities = Array.from(probabilities);

    const elapsedTime = Date.now() - startTime;

    // Log detailed prediction info
    console.log(`Prediction (${elapsedTime}ms):`, {
      gesture,
      confidence: `${(confidence * 100).toFixed(1)}%`,
      probabilities: LABELS.map(
        (label, idx) =>
          `${label}: ${(allProbabilities[idx] * 100).toFixed(1)}%`,
      ),
    });

    return {
      gesture,
      confidence,
      allProbabilities,
    };
  } catch (error) {
    console.error('Error predicting gesture:', error);
    // Return fallback prediction
    return {
      gesture: LABELS[Math.floor(Math.random() * LABELS.length)],
      confidence: 0,
      allProbabilities: [0.33, 0.33, 0.34],
    };
  }
}
