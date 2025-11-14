# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Keep TensorFlow / TensorFlow Lite classes (avoid stripping native JNI bindings)
-dontwarn org.tensorflow.**
-dontwarn org.tensorflow.lite.**
-dontwarn com.google.protobuf.**
-keep class org.tensorflow.** { *; }
-keep class org.tensorflow.lite.** { *; }

# Keep react-native-fs native module (avoid R8/ProGuard stripping native module/constants)
-dontwarn com.rnfs.**
-keep class com.rnfs.** { *; }
-keepclassmembers class com.rnfs.** { *; }

# Keep React Native and Hermes classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep React Native classes
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Keep model loading classes
-keep class * implements com.facebook.react.bridge.NativeModule { *; }

# Keep protobuf model helpers (some TF Java libs use reflection)
-keepclassmembers class com.google.protobuf.** { *; }

# If you use TensorFlow JNI native libraries, keep loadLibrary calls
-keepclassmembers class * {
    public static void loadLibrary(java.lang.String);
}
