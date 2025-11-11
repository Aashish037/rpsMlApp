import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GameScreen from './screens/GameScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
