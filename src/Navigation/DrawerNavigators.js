import * as React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Icon } from 'react-native-elements';
import HomeStack from './StackNavigator.js';
import { colors } from "../global/style";
import { auth } from '../../firebaseConfig.js';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const user = auth.currentUser;

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View style={styles.profileContainer}>
          <Image
            source={
              user?.photoURL 
                ? { uri: user.photoURL }
                : require('../../assets/blankProfilePic.jpg')
            }
            style={styles.profileImage}
          />
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>
              {user?.username || 'Utilisateur'}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || 'Email non disponible'}
            </Text>
          </View>
        </View>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.logoutContainer}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            // Implement logout logic
            auth.signOut();
            props.navigation.navigate('Login');
          }}
        >
          <Icon 
            type="material-community" 
            name="logout" 
            color="#FF0000" 
            size={24} 
          />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: colors.grey5,
        drawerActiveTintColor: colors.blue,
        drawerInactiveTintColor: colors.grey2,
      }}
    >
      <Drawer.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          title: "Accueil",
          drawerIcon: ({focused, size}) => (
            <Icon 
              type="material-community"
              name="home"
              color={focused ? colors.blue : colors.grey2}
              size={size}
            />
          ),
        }}
      />
      {/* Add more drawer screens as needed */}
    </Drawer.Navigator>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    bottom:3.9,
    backgroundColor: colors.blue,
    marginBottom: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileTextContainer: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.grey5,
    paddingVertical: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoutText: {
    color: '#FF0000',
    marginLeft: 10,
    fontSize: 16,
  },
};