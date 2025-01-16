import * as React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { Icon } from 'react-native-elements';
import HomeStack from './StackNavigator.js';
import { colors } from "../global/style";
import { auth } from '../../firebaseConfig.js';
import { LinearGradient } from 'expo-linear-gradient';

const Drawer = createDrawerNavigator();
const { width } = Dimensions.get('window');

function CustomDrawerContent(props) {
  const user = auth.currentUser;
  const [activeSection, setActiveSection] = React.useState('main');

  const MenuSection = ({ title, items }) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={() => props.navigation.navigate(item.route)}
        >
          <View style={styles.menuItemContent}>
            <View style={styles.iconContainer}>
              <Icon
                type="material-community"
                name={item.icon}
                color={colors.blue}
                size={24}
              />
            </View>
            <View style={styles.menuItemTextContainer}>
              <Text style={styles.menuItemText}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.menuItemSubtext}>{item.subtitle}</Text>
              )}
            </View>
          </View>
          <Icon
            type="material-community"
            name="chevron-right"
            color={colors.grey3}
            size={20}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const mainMenuItems = [
    { title: 'Accueil', subtitle: 'Tableau de bord', icon: 'home', route: 'HomeStack' },
    { title: 'Mes courses', subtitle: 'Historique et actif', icon: 'car', route: 'Rides' },
    { title: 'Paiements', subtitle: 'Méthodes et transactions', icon: 'credit-card', route: 'Payments' },
  ];

  const supportMenuItems = [
    { title: 'Centre d\'aide', icon: 'help-circle', route: 'Help' },
    { title: 'Paramètres', icon: 'cog', route: 'Settings' },
    { title: 'Nous contacter', icon: 'message-text', route: 'Contact' },
  ];

  const accountMenuItems = [
    { title: 'Mon profil', subtitle: 'Informations personnelles', icon: 'account', route: 'Profile' },
    { title: 'Favoris', subtitle: 'Adresses sauvegardées', icon: 'heart', route: 'Favorites' },
    { title: 'Sécurité', subtitle: 'Confidentialité et données', icon: 'shield-check', route: 'Security' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.blue, colors.now]}
        style={styles.profileContainer}
      >
        <View style={styles.profileHeader}>
          <Image
            source={
              user?.photoURL
                ? { uri: user.photoURL }
                : require('../../assets/blankProfilePic.jpg')
            }
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.username || 'Utilisateur'}
            </Text>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileButtonText}>Voir le profil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        <MenuSection title="Principal" items={mainMenuItems} />
        <MenuSection title="Mon Compte" items={accountMenuItems} />
        <MenuSection title="Support & Aide" items={supportMenuItems} />
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            auth.signOut();
            props.navigation.navigate('Login');
          }}
        >
          <Icon
            type="material-community"
            name="logout"
            color={colors.grey2}
            size={24}
          />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileContainer: {
    padding: 20,
    paddingTop: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileButton: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  scrollContent: {
    paddingTop: 10,
  },
  menuSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 13,
    color: colors.grey3,
    marginLeft: 20,
    marginBottom: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingLeft: 20,
    justifyContent: 'space-between',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.grey1,
    fontWeight: '500',
  },
  menuItemSubtext: {
    fontSize: 12,
    color: colors.grey3,
    marginTop: 2,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    padding: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutText: {
    marginLeft: 15,
    color: colors.grey2,
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    color: colors.grey3,
    fontSize: 12,
    marginTop: 10,
  },
});

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: width * 0.85,
        },
      }}
    >
      <Drawer.Screen name="HomeStack" component={HomeStack} />
      
    </Drawer.Navigator>
  );
}