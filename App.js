import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import FridgeScreen from './src/screens/FridgeScreen';
import FindAccountScreen from './src/screens/FindAccountScreen';
import AccountSettingsScreen from './src/screens/AccountSettingsScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import NameInputScreen from './src/screens/NameInputScreen';
import SavedRecipesScreen from './src/screens/SavedRecipesScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"

        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="FindAccount" component={FindAccountScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Fridge" component={FridgeScreen} />
        <Stack.Screen name="Settings" component={AccountSettingsScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="NameInput" component={NameInputScreen} />
        <Stack.Screen name="Favorites" component={SavedRecipesScreen} />
        <Stack.Screen name="Chatbot" component={ChatbotScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
