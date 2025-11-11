import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import {bundleResourceIO, decodeJpeg} from '@tensorflow/tfjs-react-native';

let model: tf.LayersModel | null = null;
const MODEL_IMAGE_SIZE = 224;
// Labels from the trained model (lowercase to match Teachable Machine output)
const LABELS = ['rock', 'paper', 'scissors'];

// Custom IO handler to load model from bundled assets
function createCustomModelIOHandler(): tf.io.IOHandler {
  return {
    load: async (): Promise<tf.io.ModelArtifacts> => {
      try {
        // Load model JSON
        const modelJson = require('../../assests/models/model.json');
        console.log('Model JSON loaded');

        // Extract model topology and weights manifest
        const modelTopology = modelJson.modelTopology || modelJson;
        const weightsManifest = modelJson.weightsManifest || [
          {paths: ['weights.bin'], weights: []},
        ];

        let weightData: ArrayBuffer;

        try {
          // First, try to get the asset ID
          const weightsModule = require('../../assests/models/weights.bin');
          console.log('Weights module type:', typeof weightsModule);
          console.log('Weights module keys:', Object.keys(weightsModule || {}));

          if (
            typeof weightsModule === 'object' &&
            weightsModule.bundleResourceIO
          ) {
            throw new Error(
              'weights.bin resolved to wrong module. Please restart Metro with --reset-cache and rebuild the app.',
            );
          }

        
          if (typeof weightsModule === 'number') {
            const ioHandler = bundleResourceIO(modelJson, weightsModule);
            if (ioHandler.load) {
              const artifacts = await ioHandler.load();
              return artifacts;
            } else {
              throw new Error(
                'bundleResourceIO handler does not have load method',
              );
            }
          }

          if (weightsModule instanceof ArrayBuffer) {
            weightData = weightsModule;
          } else if (weightsModule instanceof Uint8Array) {
            // Convert Uint8Array to ArrayBuffer
            weightData = new ArrayBuffer(weightsModule.byteLength);
            new Uint8Array(weightData).set(weightsModule);
          } else if (
            typeof weightsModule === 'object' &&
            weightsModule.default
          ) {
            // Sometimes it's wrapped in { default: ... }
            const data = weightsModule.default;
            if (data instanceof ArrayBuffer) {
              weightData = data;
            } else if (data instanceof Uint8Array) {
              weightData = new ArrayBuffer(data.byteLength);
              new Uint8Array(weightData).set(data);
            } else {
              throw new Error('Unexpected weights data format in default');
            }
          } else {
            // Try to convert to Uint8Array and then ArrayBuffer
            const uint8Array = new Uint8Array(weightsModule);
            weightData = new ArrayBuffer(uint8Array.byteLength);
            new Uint8Array(weightData).set(uint8Array);
          }

          console.log(
            `Weights loaded! Size: ${(
              weightData.byteLength /
              1024 /
              1024
            ).toFixed(2)} MB`,
          );
        } catch (weightsError: any) {
          console.error('Error loading weights:', weightsError);
          throw new Error(
            `Could not load weights: ${weightsError.message}. Make sure to restart Metro with --reset-cache`,
          );
        }

        return {
          modelTopology,
          weightSpecs: weightsManifest[0]?.weights || [],
          weightData: [weightData],
        };
      } catch (error: any) {
        console.error('Error in custom IO handler:', error);
        throw error;
      }
    },
  };
}

export async function loadModel() {
  await tf.ready();
  if (!model) {
    try {
      console.log('Starting model load using custom IO handler...');
      const customIOHandler = createCustomModelIOHandler();
      model = await tf.loadLayersModel(customIOHandler);
      console.log('✅ Model loaded successfully!');
      console.log('Model input shape:', model.inputs[0].shape);
      console.log('Model output shape:', model.outputs[0].shape);
    } catch (error) {
      console.error('Error loading model:', error);
      // For now, we'll let it fail gracefully and use fallback in predictGesture
      console.warn(
        'Model loading failed. The app will use random predictions as fallback.',
      );
    }
  }
  return model;
}

// Preprocess image: resize to 224x224 and normalize (optimized)
async function preprocessImage(imageUri: string): Promise<tf.Tensor3D> {
  try {
    // Load image
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(
        `Failed to load image: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = new Uint8Array(arrayBuffer);

    // Decode JPEG image
    const imageTensor = decodeJpeg(imageBuffer);

    // Resize and normalize in one chain (more efficient)
    const resized = tf.image.resizeBilinear(imageTensor, [
      MODEL_IMAGE_SIZE,
      MODEL_IMAGE_SIZE,
    ]);
    imageTensor.dispose(); // Dispose after resize

    // Normalize and batch in one operation
    const normalized = resized.div(255.0);
    resized.dispose();

    const batched = normalized.expandDims(0);
    normalized.dispose();

    return batched as tf.Tensor3D;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    throw error;
  }
}

// Predict gesture from image (optimized)
export async function predictGesture(
  imageUri: string,
): Promise<{gesture: string; confidence: number; allProbabilities: number[]}> {
  try {
    const startTime = Date.now();
    const loadedModel = await loadModel();
    if (!loadedModel) {
      console.warn('Model not loaded, using fallback');
      return {
        gesture: LABELS[Math.floor(Math.random() * LABELS.length)],
        confidence: 0,
        allProbabilities: [],
      };
    }

    // Preprocess image
    const preprocessedImage = await preprocessImage(imageUri);

    // Run prediction
    const prediction = loadedModel.predict(preprocessedImage) as tf.Tensor;
    const probabilities = await prediction.data();

    // Clean up
    preprocessedImage.dispose();
    prediction.dispose();

    // Find the class with highest probability
    let maxIndex = 0;
    let maxProb = probabilities[0];
    const allProbs = Array.from(probabilities);
    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIndex = i;
      }
    }

    const predictedGesture = LABELS[maxIndex];
    const confidence = maxProb;
    const elapsedTime = Date.now() - startTime;

    // Log detailed prediction info
    console.log(`Prediction (${elapsedTime}ms):`, {
      gesture: predictedGesture,
      confidence: `${(confidence * 100).toFixed(1)}%`,
      probabilities: LABELS.map(
        (label, idx) => `${label}: ${(allProbs[idx] * 100).toFixed(1)}%`,
      ),
    });

    return {
      gesture: predictedGesture,
      confidence,
      allProbabilities: allProbs,
    };
  } catch (error) {
    console.error('Error predicting gesture:', error);
    return {
      gesture: LABELS[Math.floor(Math.random() * LABELS.length)],
      confidence: 0,
      allProbabilities: [],
    };
  }
}
