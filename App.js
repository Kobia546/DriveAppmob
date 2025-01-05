import React from "react";
import { StyleSheet, Dimensions, View, Text } from "react-native";
import Toast from 'react-native-toast-message';

import RootNavigator from './src/Navigation/RootNavigator.js';
import { NativeBaseProvider } from "native-base";
const SCREEN_WIDTH = Dimensions.get('window').width;
import { OriginContextProvider, DestinationContextProvider } from "./src/Contexts/contexts";

const App = () => (
  <DestinationContextProvider>
    <OriginContextProvider>
      <RootNavigator />
    </OriginContextProvider>
    <Toast config={toastConfig} />
  </DestinationContextProvider>
);

// Configuration du toast personnalisé
const toastConfig = {
  customPriceAlert: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <Text style={styles.toastTitle}>{text1}</Text>
      <Text style={styles.toastMessage}>{text2}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastContainer: {
    height: 60,
    width: '90%',
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  toastTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toastMessage: {
    color: '#ecf0f1',
    fontSize: 16,
  },
});

export default App;
