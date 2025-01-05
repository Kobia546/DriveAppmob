import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ScrollView,
  Image,
  FlatList,
  TouchableOpacity,
  Platform,
  Animated,
  SafeAreaView,
  ActivityIndicator
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Icon } from "react-native-elements";
import { StatusBar } from "expo-status-bar";
import * as Location from 'expo-location';
import { mapStyle } from '../global/mapStyle';
import { colors } from "../global/style";
import { auth, db } from '../../firebaseConfig'; // Assurez-vous que vous avez importé auth et db
import { doc, getDoc } from 'firebase/firestore';
import RecentDestinations from "../../recentDestinations";

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const ASPECT_RATIO = SCREEN_WIDTH / SCREEN_HEIGHT;
const LATITUDE_DELTA = 0.008;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const HomeScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const mapRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.5], // Reduit l'échelle pour simuler une diminution de hauteur
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setLocation(location);

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
          });
        }

        // Récupérer le nom de l'utilisateur connecté
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.username); 
          }
        }
      } catch (error) {
        setErrorMsg('Error getting location');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const renderHeader = () => (
    <Animated.View style={[styles.header]}>
      <SafeAreaView style={styles.headerContent}>
        <View style={styles.headerTop}>
          <TouchableOpacity>
            <Icon
              type="material-community"
              name="menu"
              color="#fff"
              size={40}
              style={styles.menuIcon}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Bonjour, {userName || 'Utilisateur'}</Text>
      </SafeAreaView>
    </Animated.View>
  );

  // const renderSearchButton = () => (
  //   <TouchableOpacity
  //     style={styles.searchButton}
  //     onPress={() => navigation.navigate("RequestScreen", { state: 0 })}
  //     activeOpacity={0.8}
  //   >
  //     <Text style={styles.searchButtonText}>Rechercher chauffeur</Text>
  //   </TouchableOpacity>
  // );

  const renderServiceCard = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate(item.screen)}
    >
      <View style={styles.serviceImageContainer}>
        <Image source={item.image} style={styles.serviceImage} />
      </View>
      <Text style={styles.serviceName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderLocationCard = ({ title, subtitle, icon = "map-marker" }) => (
    <TouchableOpacity
      style={styles.locationCard}
      activeOpacity={0.7}
    >
      <View style={styles.locationIcon}>
        <Icon
          type="material-community"
          name={icon}
          color={colors.blue}
          size={24}
        />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationTitle}>{title}</Text>
        <Text style={styles.locationSubtitle}>{subtitle}</Text>
      </View>
      <Icon
        type="material-community"
        name="chevron-right"
        color={colors.grey}
        size={24}
      />
    </TouchableOpacity>
  );

  const filterData = [
    { name: "Services", image: require("../../assets/food.png"), id: "1", screen: "RequestScreen" },
    { name: "Parking", image: require('../../assets/Wavy_Bus-42_Single-05.jpg'), id: "0", screen: "Parking" },
    { name: "Conciergeries", image: require("../../assets/reserve.png"), id: "2", screen: "Conciergerie" }
  ];
  const [carsAround, setCarsAround] = useState([
    { id: '1', latitude: 5.345, longitude: -4.028 },
    { id: '2', latitude: 5.347, longitude: -4.030 },
    // Ajoutez d'autres voitures ici
  ]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.now} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <View style={styles.heroSection}>
            <View style={styles.heroContent}>
              <Text style={styles.heroText}>
                Votre Temps est precieux;
                Reservez votre chauffeur privé pour s'occuper de vos courses
              </Text>
              {/* {renderSearchButton()} */}
            </View>
            {/* <Image
              source={require('../../assets/driver.png')}
              style={styles.heroImage}
            /> */}
          </View>

          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Services disponibles</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={filterData}
              keyExtractor={(item) => item.id}
              renderItem={renderServiceCard}
              contentContainerStyle={styles.servicesList}
            />
          </View>

          {/* <View style={styles.locationSection}>
            <View style={styles.searchBar}>
              <Icon
                type="material-community"
                name="clock-time-four"
                color={colors.grey}
                size={24}
              />
              <Text style={styles.searchBarText}>Où allez-vous?</Text>
              <Icon
                type="material-community"
                name="chevron-down"
                color={colors.grey}
                size={24}
              />
            </View>

            {renderLocationCard({
              title: "2 plateaux",
              subtitle: "Rue des Jardins"
            })}
            {renderLocationCard({
              title: "Yopougon",
              subtitle: "Bel-Air"
            })}
          </View> */}
          
          <RecentDestinations/> 
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Vous êtes ici </Text>
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={mapStyle}
                showsUserLocation
                followsUserLocation
                initialRegion={{
                  latitude: location?.coords.latitude || 0,
                  longitude: location?.coords.longitude || 0,
                  latitudeDelta: LATITUDE_DELTA,
                  longitudeDelta: LONGITUDE_DELTA,
                }}
              >
                {carsAround.map((item, index) => (
                  <Marker
                    key={index.toString()}
                    coordinate={item}
                    tracksViewChanges={false}
                  >
                    <Image
                      source={require('../../assets/carMarker.png')}
                      style={styles.markerImage}
                      resizeMode="contain"
                    />
                  </Marker>
                ))}
              </MapView>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
      <StatusBar style="light" backgroundColor={colors.now} translucent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.now,
    zIndex: 100,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
   
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  content: {
    paddingTop: 140,
  },
  heroSection: {
    backgroundColor: colors.now,
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomRightRadius:300,
    
  },
  heroContent: {
    flex: 1,
    marginRight: 20,
  },
  heroText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  heroImage: {
    width: 120,
    height: 120,
    top: 30,
    left: 50,
  
  },
  searchButton: {
    backgroundColor: colors.black,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  servicesSection: {
    paddingVertical: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 20,
    marginBottom: 15,
    color: colors.black,
  },
  servicesList: {
    paddingHorizontal: 40,
  
   
  },
  serviceCard: {
    alignItems: 'center',
    marginHorizontal: 10,
   
  },
  serviceImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  serviceImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  serviceName: {
    fontSize: 14,
    color: colors.grey1,
    fontWeight: '500',
  },
  locationSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 30,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchBarText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: colors.grey1,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  locationSubtitle: {
    fontSize: 14,
    color: colors.grey3,
  },
  mapSection: {
    paddingVertical: 20,
  },
  mapContainer: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  map: {
    height: 200,
    width: '100%',
  },
  markerImage: {
    width: 28,
    height: 14,
  },
});

export default HomeScreen;
