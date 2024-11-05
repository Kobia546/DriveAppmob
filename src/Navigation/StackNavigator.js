import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../Screens/HomeScreen';
import RequestScreen from '../Screens/RequestScreen';
import DestinationScreen from '../Screens/Destination';
import NearbySearchMap from '../Screens/NearbySearchMap';
import Register from '../Screens/Register';
import Login from '../Screens/Login';
import PremierPage from '../Screens/PremierPage';
import DriverRegister from '../Screens/DriverRegister';
import DriverHomeScreen from '../Screens/DriverHomeScreen';
import AcceptOrderScreen from '../Screens/AcceptOrderScreen';
import OrdersScreen from '../Screens/OrderScreens';
import MapScreen from '../Screens/MapScreen';
import ClientConfirmationScreen from '../Screens/ClientConfirmationScreen';


const Home= createStackNavigator();
export default function HomeStack(){

    return(
        <Home.Navigator>
              <Home.Screen
           name='Premierpage'
           component={PremierPage}
           options={{headerShown:false}}
           />
            <Home.Screen
           name='DriverRegister'
           component={DriverRegister}
           options={{headerShown:false}}
           />
            <Home.Screen
           name='Register'
           component={Register}
           options={{headerShown:false}}
           />
            <Home.Screen
           name='Login'
           component={Login}
           options={{headerShown:false}}
           />
             <Home.Screen
           name='AcceptOrderScreen'
           component={AcceptOrderScreen}
           options={{headerShown:false}}
           />
            <Home.Screen
            name='HomeScreen'
            component={HomeScreen}
            options={{headerShown:false}}
            />
             <Home.Screen
            name='Driver'
            component={DriverHomeScreen}
            options={{headerShown:false}}
            />
             <Home.Screen
            name='DriverOrdersScreen'
            component={DriverHomeScreen}
            options={{headerShown:false}}
            />
              <Home.Screen
            name='ClientConfirmationScreen'
            component={ClientConfirmationScreen}
            options={{headerShown:false}}
            />
            
             <Home.Screen
            name='MapScreen'
            component={MapScreen}
            options={{headerShown:false}}
            />
            <Home.Screen
            name='RequestScreen'
            component={RequestScreen}
            options={{headerShown:false}}
            />
            <Home.Screen
            name='DestinationScreen'
            component={DestinationScreen}
            options={{headerShown:false}}
            />
              <Home.Screen
            name='Recherche'
            component={NearbySearchMap}
            options={{headerShown:false}}
            />

            

        </Home.Navigator>
    )
}