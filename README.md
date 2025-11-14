# Rock Paper Scissors ML App 🎮🤖

Video demo: [Add link here — I'll insert the demo URL later]

A React Native mobile application that uses machine learning to play Rock Paper Scissors. The app uses TensorFlow.js to recognize hand gestures (rock, paper, scissors) from camera images and plays against an AI opponent.

## 📋 Table of Contents

- [Overview](#overview)
- [Model Training Process](#model-training-process)
- [Project Structure](#project-structure)
- [Files and Modules](#files-and-modules)
- [Dependencies](#dependencies)
- [Setup and Installation](#setup-and-installation)
- [How It Works](#how-it-works)
- [Usage](#usage)

## 🎯 Overview

This app combines computer vision and machine learning to create an interactive Rock Paper Scissors game. Users show their hand gesture to the camera, and the app uses a TensorFlow.js model to recognize whether it's rock, paper, or scissors. The AI then randomly selects its move, and the game determines the winner.

**Key Features:**

- Real-time gesture recognition using TensorFlow.js
- Camera integration for capturing hand gestures
- AI opponent with random move selection
- Visual feedback with color-coded results
- Confidence scores for predictions

## 🧠 Model Testing in Google Colab (Recommended)

This project includes a TensorFlow.js model (files under `assests/models/`). If you prefer to test or validate the model in Google Colab (the workflow used by the author), follow these steps. Two approaches are shown: a Node.js-based test (recommended) and a short note about converting for Python.

### Option A — Quick test using Node.js in Colab (recommended)

1. Open a new Colab notebook: https://colab.research.google.com/

2. Mount your Google Drive (if your model files are stored there) and copy the model files into the Colab workspace, or upload them directly via the Colab file browser.

```python
from google.colab import drive
drive.mount('/content/drive')
# Example: copy files from Drive to notebook dir
!mkdir -p /content/model
!cp -r /content/drive/MyDrive/path-to-model/* /content/model/
```

3. Install Node.js and `npm`, then install the TensorFlow.js Node bindings. Run these in a Colab cell:

```bash
# Install Node.js (if not already present) and npm
apt-get update -y && apt-get install -y nodejs npm

# Create a working folder and install tfjs-node
cd /content
mkdir -p tfjs-test && cd tfjs-test
npm init -y
npm install @tensorflow/tfjs @tensorflow/tfjs-node
```

4. Copy your model files inside `/content/tfjs-test/model/` (or point to where you placed them). Example using files copied earlier:

```bash
cp -r /content/model/* /content/tfjs-test/model/
```

5. Create a simple Node.js test script (e.g. `model_test.js`) that loads the `model.json`, preprocesses a JPEG/PNG sample, and prints predictions.

Example `model_test.js` (adapt input preprocessing shape as needed):

```javascript
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');

async function main() {
  // Load model from local filesystem
  const model = await tf.loadLayersModel('file://./model/model.json');

  // Read an example image (place sample.jpg in the folder)
  const imageBuffer = fs.readFileSync('./sample.jpg');
  let img = tf.node.decodeImage(imageBuffer, 3);

  // Resize & normalize to model input (example 224x224, change if different)
  img = tf.image
    .resizeBilinear(img, [224, 224])
    .expandDims(0)
    .toFloat()
    .div(255.0);

  // Run prediction
  const preds = model.predict(img);
  preds.print();
}

main().catch(err => console.error(err));
```

6. Upload a test image (e.g. `sample.jpg`) to the Colab working folder or copy it from Drive, then run the Node test:

```bash
# from /content/tfjs-test
node model_test.js
```

The script will print the raw model output (logits or probabilities depending on model). Use the `metadata.json` or the expected class index order to map outputs to `rock`, `paper`, and `scissors`.

### Option B — Convert / run in Python (optional)

- If you prefer pure Python in Colab, you can convert the TFJS model to a Keras/TensorFlow SavedModel using the `tensorflowjs` pip package, but conversion paths vary and may require an original Keras model. Converting TFJS -> SavedModel is possible in some cases but is more involved; the Node.js approach above is simpler for validating TFJS artifacts.

### Integrating the model into the app (unchanged)

After validating the model in Colab, place the final `model.json`, `weights.bin` and `metadata.json` into the project `assests/models/` directory so the app can load them at runtime. For release builds ensure the files are packaged into the Android app assets under `android/app/src/main/assets/models/`.

Quick copy command (from repo root, works in Bash on Windows):

```bash
mkdir -p android/app/src/main/assets/models
cp -r assests/models/* android/app/src/main/assets/models/
```

Notes:

- The app loads the TensorFlow.js model at startup via a React Native IO handler and expects the model input size (e.g. `224x224`) used in the app preprocessing pipeline.
- If your model uses a different input resolution or normalization, update `src/ml/gestureModel.ts` preprocessing to match.

## 📁 Project Structure

```
rpsMlApp/
├── android/                    # Android native code
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/        # Model files bundled for Android
│   │   │   ├── AndroidManifest.xml
│   │   │   └── java/          # Kotlin/Java source files
│   │   └── build.gradle
│   └── build.gradle
│
├── ios/                        # iOS native code
│   ├── rpsMlApp/
│   │   ├── AppDelegate.swift
│   │   └── Info.plist
│   └── Podfile
│
├── assests/                    # Model assets (source)
│   └── models/
│       ├── model.json
│       ├── weights.bin
│       └── metadata.json
│
├── src/                        # React Native source code
│   ├── App.tsx                 # Main app component
│   ├── AppNavigator.tsx        # Navigation setup
│   │
│   ├── components/             # Reusable UI components
│   │   ├── CameraView.tsx      # Camera component
│   │   └── ResultCard.tsx      # Game result display
│   │
│   ├── screens/                # Screen components
│   │   └── GameScreen.tsx      # Main game screen
│   │
│   ├── ml/                     # Machine learning logic
│   │   └── gestureModel.ts     # Model loading & prediction
│   │
│   └── utils/                  # Utility functions
│       └── gameLogic.ts        # Game rules & logic
│
├── __tests__/                  # Test files
│   └── App.test.tsx
│
├── metro.config.js             # Metro bundler config
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── README.md                   # This file
```

## 📄 Files and Modules

### Core Application Files

#### `src/App.tsx`

- **Purpose**: Main application entry point
- **Responsibilities**:
  - Initializes TensorFlow.js
  - Preloads the ML model in the background
  - Sets up navigation container
- **Key Features**:
  - Calls `tf.ready()` to initialize TensorFlow.js
  - Preloads model using `loadModel()` for faster first prediction

#### `src/AppNavigator.tsx`

- **Purpose**: Navigation configuration
- **Responsibilities**:
  - Sets up React Navigation stack
  - Defines app screens and routes
- **Current Setup**: Single screen (GameScreen) with no header

### Screen Components

#### `src/screens/GameScreen.tsx`

- **Purpose**: Main game interface
- **Responsibilities**:
  - Manages game state (result, loading, game outcome)
  - Handles image capture from camera
  - Processes gestures through ML model
  - Generates AI opponent move
  - Displays game results
- **Key Features**:
  - Loading indicator during prediction
  - Confidence score display
  - Game result calculation

### UI Components

#### `src/components/CameraView.tsx`

- **Purpose**: Camera interface component
- **Responsibilities**:
  - Requests camera permissions
  - Displays camera preview
  - Captures images on button press
  - Uses back camera (no flip functionality)
- **Key Features**:
  - Permission handling for iOS and Android
  - Image capture functionality
  - Simple, clean UI with capture button

#### `src/components/ResultCard.tsx`

- **Purpose**: Displays game results
- **Responsibilities**:
  - Shows prediction results
  - Displays confidence scores
  - Color-coded feedback (green=win, red=lose, orange=draw)
- **Key Features**:
  - Dynamic styling based on game outcome
  - Positioned overlay on camera view

### Machine Learning

#### `src/ml/gestureModel.ts`

- **Purpose**: ML model management and predictions
- **Responsibilities**:
  - Loads TensorFlow.js model from bundled assets
  - Preprocesses images (resize, normalize)
  - Runs predictions on captured images
  - Returns gesture classification with confidence
- **Key Functions**:
  - `loadModel()`: Loads model from assets
  - `preprocessImage()`: Resizes image to 224x224 and normalizes
  - `predictGesture()`: Main prediction function
- **Model Details**:
  - Input size: 224x224 pixels
  - Output: 3 classes (rock, paper, scissors)
  - Uses custom IO handler for React Native asset loading

### Utilities

#### `src/utils/gameLogic.ts`

- **Purpose**: Game rules and logic
- **Responsibilities**:
  - Determines winner based on Rock Paper Scissors rules
  - Returns game result (win/lose/draw) and message
- **Game Rules**:
  - Rock beats Scissors
  - Paper beats Rock
  - Scissors beats Paper
  - Same gesture = Draw

### Configuration Files

#### `metro.config.js`

- **Purpose**: Metro bundler configuration
- **Key Configuration**:
  - Adds `.bin` extension to asset extensions
  - Allows bundling of model weights file

#### `package.json`

- **Purpose**: Project dependencies and scripts
- **Scripts**:
  - `npm start`: Start Metro bundler
  - `npm run android`: Run on Android
  - `npm run ios`: Run on iOS

## 📦 Dependencies

### Core Dependencies

#### Machine Learning

- **`@tensorflow/tfjs`** (^4.22.0)
  - TensorFlow.js core library
  - Provides ML model loading and inference
- **`@tensorflow/tfjs-react-native`** (^1.0.0)
  - React Native bindings for TensorFlow.js
  - Handles platform-specific optimizations
  - Provides `decodeJpeg` and `bundleResourceIO` utilities

#### Camera & Permissions

- **`react-native-camera-kit`** (^16.1.3)
  - Camera component for React Native
  - Handles image capture
  - Supports front/back camera switching
- **`react-native-permissions`** (^5.4.2)
  - Cross-platform permission handling
  - Requests camera permissions for iOS and Android

#### Navigation

- **`@react-navigation/native`** (^7.1.19)
  - Core navigation library
- **`@react-navigation/native-stack`** (^7.6.2)
  - Stack navigator implementation
- **`react-native-screens`** (^4.18.0)
  - Native screen components
- **`react-native-safe-area-context`** (^5.6.2)
  - Safe area handling for notched devices
- **`react-native-gesture-handler`** (^2.29.1)
  - Native gesture handling

#### React Native

- **`react`** (19.0.0)
- **`react-native`** (0.78.0)

### Development Dependencies

- **TypeScript** (5.0.4) - Type safety
- **ESLint** - Code linting
- **Jest** - Testing framework
- **Babel** - JavaScript transpilation

## 🔧 Setup and Installation

### Prerequisites

- **Node.js** >= 18
- **React Native development environment** set up
  - For Android: Android Studio, JDK
  - For iOS: Xcode, CocoaPods (macOS only)
- **Physical device or emulator/simulator**

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd rpsMlApp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install iOS dependencies** (iOS only)

   ```bash
   cd ios
   bundle install
   bundle exec pod install
   cd ..
   ```

4. **Add model files**

   - Ensure model files are in `assests/models/`:
     - `model.json`
     - `weights.bin`
     - `metadata.json`

5. **Start Metro bundler**

   ```bash
   npm start
   ```

6. **Run the app**

   ```bash
   # Android
   npm run android

   # iOS
   npm run ios
   ```

## 📦 Release APK (including TensorFlow model assets)

When building a release APK you must ensure the TensorFlow model files are bundled into the final APK under `assets/models/` so the app can load them via the React Native IO handler.

Steps to create a signed release APK that includes the model assets:

1. Copy model files into the Android app assets directory (see commands above).
2. Ensure the ProGuard rules include TensorFlow/TFLite keeps to avoid stripping runtime classes. The project `android/app/proguard-rules.pro` has been updated with recommended rules for TensorFlow/TFLite and protobuf.
3. Build the release APK from the `android` folder:

```bash
cd android
./gradlew assembleRelease
```

4. The unsigned release APK will be at:

```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

If you use a signing config (recommended), your signed APK will be in the same folder as `app-release.apk` or `app-release.aab` depending on the task you run.

5. Verify that the model files are present in the generated APK (you can inspect the APK as a zip file):

```bash
unzip -l android/app/build/outputs/apk/release/app-release.apk | grep models
```

If you see `assets/models/model.json` and `assets/models/weights.bin` listed, the model files are included.

Troubleshooting:

- If your model files are missing, double-check you copied them to `android/app/src/main/assets/models/` or configured `assets.srcDirs` in `build.gradle`.
- If runtime errors complain about missing TensorFlow classes, make sure `android/app/proguard-rules.pro` is present and you have `minifyEnabled` properly configured for release builds (or temporarily disable minification while debugging).

## ⚙️ How It Works

### Application Flow

1. **App Initialization**

   - `App.tsx` initializes TensorFlow.js
   - Model is preloaded in the background
   - Navigation is set up

2. **Camera View**

   - User sees camera preview
   - Camera uses back camera (no flip)
   - User positions hand in frame

3. **Image Capture**

   - User taps "Capture" button
   - Image is captured as JPEG
   - Image URI is passed to processing

4. **Image Preprocessing**

   - Image is loaded from URI
   - Decoded from JPEG format
   - Resized to 224x224 pixels (model input size)
   - Normalized to [0, 1] range
   - Batched for model input

5. **Model Prediction**

   - Preprocessed image is fed to model
   - Model outputs probabilities for 3 classes
   - Highest probability class is selected
   - Confidence score is calculated

6. **Game Logic**

   - AI randomly selects rock, paper, or scissors
   - Game rules determine winner
   - Result is displayed with color-coded feedback

7. **Result Display**
   - Shows user's gesture and confidence
   - Shows AI's gesture
   - Displays win/lose/draw message
   - Color-coded card (green/red/orange)

### Model Architecture

The model is a **transfer learning** model from Teachable Machine:

- Base: MobileNet or similar lightweight architecture
- Input: 224x224 RGB images
- Output: 3-class softmax (rock, paper, scissors probabilities)
- Optimized for mobile inference

### Image Processing Pipeline

```
Camera Image (JPEG)
    ↓
Decode JPEG → Tensor3D [H, W, 3]
    ↓
Resize to 224x224
    ↓
Normalize [0, 255] → [0, 1]
    ↓
Add batch dimension → [1, 224, 224, 3]
    ↓
Model Prediction → [1, 3] probabilities
    ↓
Argmax → Gesture class
```

## 🎮 Usage

1. **Launch the app**

   - Grant camera permissions when prompted

2. **Position your hand**

   - Hold your hand in front of the back camera
   - Make a clear rock, paper, or scissors gesture
   - Ensure good lighting

3. **Capture gesture**

   - Tap the "📸 Capture" button
   - Wait for processing (shows "Analyzing gesture...")

4. **View results**

   - See your gesture prediction with confidence
   - See AI's random choice
   - View win/lose/draw result
   - Color-coded feedback appears

5. **Play again**
   - Capture another gesture to play again

### Tips for Better Accuracy

- **Good lighting**: Ensure your hand is well-lit
- **Clear background**: Use a contrasting background
- **Full hand visible**: Make sure entire hand is in frame
- **Consistent gestures**: Use similar hand positions as training data
- **Steady hand**: Hold still when capturing

## 🐛 Troubleshooting

### Model not loading

- Ensure model files are in `assests/models/`
- Restart Metro with `npm start -- --reset-cache`
- Rebuild the app

### Camera not working

- Check camera permissions in device settings
- Ensure camera is not being used by another app
- Try restarting the app

### Low prediction accuracy

- Retrain model with more diverse samples
- Ensure good lighting conditions
- Check that hand is clearly visible in frame

### Build errors

- Clear build cache: `cd android && ./gradlew clean` (Android)
- Reinstall pods: `cd ios && pod install` (iOS)
- Clear Metro cache: `npm start -- --reset-cache`

## 📝 Notes

- The app uses the **back camera only** (no front camera or flip functionality)
- Model is trained for specific hand orientations - ensure consistent positioning
- AI opponent uses random selection (not ML-based)
- Model files are bundled with the app for offline use

## 🔮 Future Enhancements

- Add front camera support with proper model training
- Implement gesture history/statistics
- Add multiplayer mode
- Improve model with more training data
- Add gesture animation/feedback
- Implement best-of-N rounds mode

**Built with ❤️ using React Native and TensorFlow.js By Asish Kumar Singh**
