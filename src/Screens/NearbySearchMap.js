import React, { Component } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location'; 

const { width, height } = Dimensions.get('window');

export default class NearbySearchMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userLocation: null,
      isSearching: true,
      circleRadius: new Animated.Value(0),
    };
  }

  componentDidMount() {
    this.getUserLocation();
  }

  // Fonction pour obtenir la position actuelle de l'utilisateur
  getUserLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const userLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01, // Delta réduit pour un zoom plus proche
      longitudeDelta: 0.01,
    };
    this.setState({ userLocation }, this.startSearchAnimation);
  };

  // Démarre l'effet d'animation de recherche
  startSearchAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.state.circleRadius, {
          toValue: 10000, // Rayon maximum plus grand pour mieux voir l'effet
          duration: 30, // Durée de l'animation plus longue pour un effet fluide
          useNativeDriver: false,
        }),
        Animated.timing(this.state.circleRadius, {
          toValue: 0, // Revenir à zéro
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  render() {
    const { userLocation, isSearching, circleRadius } = this.state;

    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          region={userLocation} // Utilise la région définie par la position de l'utilisateur
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Affichage du marqueur si la position de l'utilisateur est connue */}
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="Votre position"
            />
          )}

          {/* Affichage de l'effet de recherche */}
          {userLocation && (
            <Circle
              center={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              radius={circleRadius._value}
              strokeColor="rgba(255, 0, 0, 0.8)" // Rouge avec plus d'opacité pour plus de visibilité
              fillColor="rgba(255, 0, 0, 0.3)"
            />
          )}
        </MapView>

        {/* Message "Recherche à proximité" */}
        {isSearching && (
          <View style={styles.searchingOverlay}>
            <Text style={styles.searchingText}>Recherche à proximité...</Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    height: '100%',
    width: '100%',
  },
  searchingOverlay: {
    position: 'absolute',
    top: height * 0.4, // Centré verticalement
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  searchingText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 5,
  },
});
