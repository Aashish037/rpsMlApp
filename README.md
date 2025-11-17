# Rock Paper Scissors ML App 🎮🤖

Apk link: https://drive.google.com/file/d/1lyulOcYomZXMVmk_Gt9R8SdRQTahsSZW/view?usp=sharing
Api github: https://github.com/Aashish037/rps-gesture
Api link: https://rps-gesture-2.onrender.com
Dataset link: https://www.kaggle.com/datasets/drgfreeman/rockpaperscissors
Video Link: https://drive.google.com/file/d/1ka85urAjW7XsdTkDGj392m4VGp8gjX68/view?usp=sharing


A React Native mobile application that uses machine learning to play Rock Paper Scissors. The app now uploads each captured frame to a hosted FastAPI service (`https://rps-gesture-2.onrender.com/predict`) which returns `rock`, `paper`, or `scissors` classifications and confidence scores for the in-app AI opponent. (A legacy TensorFlow.js pipeline still exists in `assests/models/` for offline experimentation, but it is no longer part of the runtime experience.)

> **⚠️ Warm-up notice (Render free tier):** The hosted API on Render may be sleeping on first access. On the very first app launch you may need to wait ~30–60 seconds for the backend to warm up before predictions become available. Please be patient for the initial request.

## 📋 Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Files and Modules](#files-and-modules)
- [Dependencies](#dependencies)
- [FastAPI Backend Overview](#-fastapi-backend-overview)
- [Setup and Installation](#-setup-and-installation)
- [How It Works](#how-it-works)
- [Usage](#usage)

## 🎯 Overview

This app combines computer vision and machine learning to create an interactive Rock Paper Scissors game. Users can snap a live photo (Vision Camera) or upload an existing image, and the mobile client uploads that frame to a hosted FastAPI service. The Python service (PyTorch) classifies the gesture (rock, paper, scissors), the React Native UI compares it against an AI move, and the result is rendered instantly.

**Key Features:**

- Gesture recognition powered by a FastAPI service (Render-hosted)
- High-quality captures using `react-native-vision-camera`
- Optional gallery upload button so you can test saved photos
- AI opponent with random move selection
- Visual feedback with color-coded results
- Confidence scores for predictions

> Legacy note: the repo still contains a historical TensorFlow.js model under `assests/models/`, but the active app no longer loads it. All inference now happens via the FastAPI service linked above. Keep the files only if you plan offline experiments.

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
├── assests/                    # Legacy TFJS assets (unused at runtime)
│   └── models/
│       ├── model.json
│       ├── weights.bin
│       └── metadata.json
│
├── src/                        # React Native source code
│   ├── App.tsx
│   ├── AppNavigator.tsx
│   ├── components/
│   │   ├── CameraView.tsx
│   │   └── ResultCard.tsx
│   ├── screens/
│   │   └── GameScreen.tsx
│   ├── services/
│   │   └── gestureApi.ts
│   ├── types/
│   └── utils/
│       └── gameLogic.ts
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
  - Sets up navigation container
  - Provides global error guards for promise rejections
- **Key Features**:
  - Lightweight shell; all capture and prediction logic lives in the screen layer

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
  - Requests Vision Camera permissions
  - Displays a full-screen preview
  - Captures high-quality JPEGs on demand
- **Key Features**:
  - Uses `react-native-vision-camera` with imperative capture handle
  - Graceful states for permission prompts and missing hardware

#### `src/components/ResultCard.tsx`

- **Purpose**: Displays game results
- **Responsibilities**:
  - Shows prediction results
  - Displays confidence scores
  - Color-coded feedback (green=win, red=lose, orange=draw)
- **Key Features**:
  - Dynamic styling based on game outcome
  - Positioned overlay on camera view

### Networking & ML

#### `src/services/gestureApi.ts`

- **Purpose**: FastAPI prediction client
- **Responsibilities**:
  - Wraps the `/predict` endpoint request
  - Normalizes file URIs (`file://`, `content://`) and MIME metadata
  - Parses gesture/confidence values from API responses
- **Key Functions**:
  - `predictGestureFromApi(uri, options)`: uploads any JPEG/PNG and returns `{gesture, confidence}`
- **Model Details**:
  - Inference happens on the server (PyTorch). The mobile app simply streams frames.

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

- **FastAPI gesture model** (`https://rps-gesture-2.onrender.com/predict`)
  - Receives JPEG uploads from the mobile app
  - Runs the PyTorch model on the server and returns `rock/paper/scissors`
  - Keeps the React Native bundle light while allowing server-side updates

#### Camera & Permissions

- **`react-native-vision-camera`** (^4.1.1)
  - High-performance camera module with manual control over capture quality
  - Returns real JPEG file paths that can be forwarded to FastAPI
  - Supports frame processors for future on-device inference
- **`react-native-permissions`** (^5.4.2)
  - Cross-platform permission handling (Vision Camera uses it internally)
  - Requests camera permissions for iOS and Android
- **`react-native-image-picker`** (^7.1.2)
  - Provides the gallery upload shortcut beside the capture button
  - Handles scoped storage differences across Android versions
- **`@bam.tech/react-native-image-resizer`** (^2.0.0)
  - Compresses images to ~200KB before upload for faster transfers
  - Resizes to max 800×800px while maintaining aspect ratio

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

#### Animation

- **`react-native-reanimated`** (^3.16.1)
  - Required peer dependency for Vision Camera
  - Adds the Reanimated Babel plugin (`react-native-reanimated/plugin`)

#### React Native

- **`react`** (19.0.0)
- **`react-native`** (0.78.0)

### Development Dependencies

- **TypeScript** (5.0.4) - Type safety
- **ESLint** - Code linting
- **Jest** - Testing framework
- **Babel** - JavaScript transpilation

## 🧠 FastAPI Backend Overview

The mobile app talks to a separate repository (see links at the top) that exposes `/predict`. Its structure:

```
api/
├── __init__.py
├── app.py               # FastAPI routes (health + /predict)
└── requirements.txt
model/
├── dataset/             # (optional) training samples grouped by class
├── saved_model/
│   └── model.pth        # PyTorch weights loaded at startup
├── __init__.py
├── inference.py         # Builds model + exposes predict() helper
└── train.py             # Training script (offline)
```

Key points:

- `app.py` imports `model.inference` lazily so the server fails fast if `model.pth` is missing.
- `/predict` expects `multipart/form-data` with a `file` field (JPEG/PNG). That’s exactly what the React Native app sends from both camera and gallery.
- Any time you retrain the model, drop the new `model.pth` into `model/saved_model/` and redeploy Render.

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

3. **Configure native dependencies**

   ```bash
   # Vision Camera native setup
   npx react-native-vision-camera install

   # Image Resizer native setup (Android/iOS)
   cd android && ./gradlew clean && cd ..  # Android
   cd ios && pod install && cd ..          # iOS only
   ```

4. **Install iOS dependencies** (iOS only)

   ```bash
   cd ios
   bundle install
   bundle exec pod install
   cd ..
   ```

5. **Configure API endpoint (optional)**

   - By default the app points to `https://rps-gesture-2.onrender.com/predict`.
   - To target your own server, edit `API_BASE_URL` (and `PREDICT_PATH` if needed) in `src/services/gestureApi.ts`.

6. **Start Metro bundler**

   ```bash
   npm start
   ```

7. **Run the app**

   ```bash
   # Android
   npm run android

   # iOS
   npm run ios
   ```

## 📦 Release Builds

1. **Android**

   ```bash
   cd android
   ./gradlew assembleRelease
   ```

   The APK/AAB appears under `android/app/build/outputs/...`. No on-device ML assets are required because inference happens on the FastAPI server. Just ensure the release build has network access to your deployed endpoint (update `API_BASE_URL` if needed).

2. **iOS**
   ```bash
   cd ios
   xcodebuild -workspace rpsMlApp.xcworkspace \
     -scheme rpsMlApp \
     -configuration Release \
     -sdk iphoneos \
     -archivePath build/rpsMlApp.xcarchive archive
   ```
   Then export/sign within Xcode or via `xcodebuild -exportArchive`.

### Performance Optimizations

The app includes several optimizations to reduce upload time and improve responsiveness:

- **Image Compression**: All images are automatically compressed to max 800×800px at 80% JPEG quality before upload, reducing file size from several MB to ~200KB.
- **Request Timeout**: API calls have a 30-second timeout with clear error messages if the server is slow or cold-starting.
- **Render Cold Starts**: Free tier Render services spin down after inactivity. The first request may take 30-60 seconds to wake up; subsequent requests are much faster.

Troubleshooting tips:

- If Vision Camera complains about permissions, confirm you added the necessary usage descriptions to `Info.plist` and Android `AndroidManifest`.
- If `/predict` returns 500 in production, redeploy the FastAPI service with the correct `model.pth`.
- If uploads are slow, check your network connection. The compression step should make transfers much faster than uploading full-resolution images.
- If you see timeout errors, wait a moment and try again—Render free tier cold starts can take up to a minute.

## ⚙️ How It Works

### Application Flow

1. **App Initialization**

   - `App.tsx` wires up navigation and global error handlers.
   - No ML artifacts are loaded on-device.

2. **Camera / Gallery Input**

   - Vision Camera renders the preview and exposes `capturePhoto`.
   - The 📁 icon opens the gallery via Image Picker.

3. **Image Capture**

   - User taps Capture or Upload.
   - The resulting URI (e.g., `file://` or `content://`) is sent to `predictGestureFromApi`.

4. **Server Upload**

   - The app builds `FormData` with `file=@gesture.jpg`.
   - FastAPI receives the multipart request and stores it temporarily.

5. **Model Prediction (FastAPI)**

   - `model/inference.py` loads the PyTorch weights (`model/saved_model/model.pth`).
   - The server preprocesses the image, runs inference, and responds with `{gesture, confidence}`.

6. **Game Logic**

   - AI randomly selects rock, paper, or scissors.
   - `getResult` compares both moves and produces the message/result.

7. **Result Display**
   - `ResultCard` shows player move, AI move, confidence, and contextual copy.

### Data Flow Diagram

```
Vision Camera / Gallery
        ↓
React Native FormData upload
        ↓
FastAPI (/predict) → PyTorch model
        ↓
JSON response { gesture, confidence }
        ↓
getResult + ResultCard UI
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
   - The frame is compressed and uploaded to the FastAPI `/predict` endpoint
   - Wait for processing (shows "Analyzing gesture...")
   - Alternatively, tap the 📁 icon to upload a photo from your gallery and send it to the same API

4. **View results**

   - See your gesture prediction with confidence
   - See AI's random choice
   - View win/lose/draw result
   - Color-coded feedback appears

5. **Play again**
   - Capture another gesture to play again

### FastAPI endpoint

- The app sends every capture to `https://rps-gesture-2.onrender.com/predict`.
- If you deploy your own FastAPI server, update `API_BASE_URL` (and optionally `PREDICT_PATH`) inside `src/services/gestureApi.ts`.
- Ensure the device can reach the API over the network (same Wi-Fi, tunnel, or HTTPS).
- The endpoint must accept `multipart/form-data` with a `file` field containing a JPEG/PNG.

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

**Built with ❤️ using React Native and FastApi By Asish Kumar Singh**
