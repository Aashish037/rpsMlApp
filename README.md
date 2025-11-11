# Rock Paper Scissors ML App 🎮🤖

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

## 🧠 Model Training Process

The machine learning model is trained using **Google Teachable Machine**, a no-code ML platform. Here's the complete process:

### Step 1: Create Dataset 📸

1. **Open Google Teachable Machine**

   - Go to [teachablemachine.withgoogle.com](https://teachablemachine.withgoogle.com/)
   - Click **"Get Started"** → **"Image Project"**

2. **Set Up Classes**

   - You'll see three default classes: "Class 1", "Class 2", "Class 3"
   - Rename them:
     - **Class 1** → **Rock** ✊
     - **Class 2** → **Paper** ✋
     - **Class 3** → **Scissors** ✌️

3. **Capture Training Samples**
   - Click **"Webcam"** for each class
   - Capture approximately **30-50 samples per class**
   - Tips for better accuracy:
     - Try slightly different angles
     - Vary lighting conditions
     - Include different hand positions
     - Make sure your hand is clearly visible
   - ✅ That's your gesture dataset!

### Step 2: Train the Model 🎓

1. Once you've added samples for all three classes:

   - Click **"Train Model"**
   - Wait for training to complete (~30 seconds)
   - The model will train automatically using transfer learning

2. **Test the Model**
   - Test it live in the browser
   - Show your hand to the webcam
   - Verify it recognizes gestures correctly
   - If accuracy is low, add more training samples

### Step 3: Export for TensorFlow.js 📤

1. Click **"Export Model"**
2. Choose **"TensorFlow.js"** format
3. Click **"Download"**
4. You'll get a ZIP file containing:
   - `model.json` - Model architecture and metadata
   - `weights.bin` - Model weights
   - `metadata.json` - Class labels and additional info

### Step 4: Integrate into App 📱

1. Extract the downloaded ZIP file
2. Place the model files in `assests/models/` directory:
   ```
   assests/
     models/
       ├── model.json
       ├── weights.bin
       └── metadata.json
   ```
3. The app will automatically load the model on startup

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
