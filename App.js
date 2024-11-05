import React from "react";
import { StyleSheet, Dimensions } from "react-native";


import RootNavigator from './src/Navigation/RootNavigator.js';
import { NativeBaseProvider } from "native-base";
const SCREEN_WIDTH=Dimensions.get('window').width;
import { OriginContextProvider,DestinationContextProvider } from "./src/Contexts/contexts";

const App=()=>(
  <DestinationContextProvider>

    <OriginContextProvider>
      <RootNavigator />

    </OriginContextProvider>
  </DestinationContextProvider>
)
const styles=StyleSheet.create({
  
  container:{
    flex:1,
  
  },


})
  export default App;