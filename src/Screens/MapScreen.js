import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Text,
  Dimensions,
  Alert
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { Icon } from 'react-native-elements';
import axios from 'axios';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import VehicleInspectionChecklist from './VehicleInspectionChecklist ';
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const GOOGLE_MAPS_API_KEY = 'AIzaSyCb-grczxijjAbcC5WuvdwNwd6QUO69qbM';

const MapsScreen = ({ route, navigation }) => {
  const { orderDetails } = route.params;
  const [currentLocation, setCurrentLocation] = useState(null);
  const [ridePhase, setRidePhase] = useState('TO_PICKUP');
  const [routeInfo, setRouteInfo] = useState(null);
  const [showInspection, setShowInspection] = useState(false);
  const mapRef = useRef(null);
  const locationInterval = useRef(null);

  const pickupLocation = {
    latitude: orderDetails.pickupLocation.latitude,
    longitude: orderDetails.pickupLocation.longitude,
  };

  const destination = {
    latitude: orderDetails.dropoffLocation.latitude,
    longitude: orderDetails.dropoffLocation.longitude,
  };

  const getCurrentLocation = async () => {
    try {
      const response = await axios.post(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_MAPS_API_KEY}`,
        {
          considerIp: true,
          wifiAccessPoints: [] // Optionnel: ajouter des points d'accès WiFi pour plus de précision
        }
      );

      if (response.data && response.data.location) {
        const { lat, lng } = response.data.location;
        setCurrentLocation({
          latitude: lat,
          longitude: lng,
          accuracy: response.data.accuracy
        });
        return { latitude: lat, longitude: lng };
      }
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'obtenir votre position actuelle. Veuillez vérifier votre connexion.'
      );
    }
  };
  useEffect(() => {
    if (ridePhase === 'TO_PICKUP') {
      setShowInspection(true);
    }
  }, [ridePhase]);

  useEffect(() => {
    // Obtenir la position initiale
    getCurrentLocation();

    // Mettre à jour la position toutes les 10 secondes
    locationInterval.current = setInterval(async () => {
      const location = await getCurrentLocation();
      if (location) {
        // Mettre à jour la position dans Firestore
        try {
          const orderRef = doc(db, 'orders', orderDetails.id);
          await updateDoc(orderRef, {
            driverLocation: location,
            lastUpdated: new Date()
          });
        } catch (error) {
          console.error('Erreur mise à jour position:', error);
        }
      }
    }, 10000);

    return () => {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      // Ajuster la carte pour montrer le trajet complet
      const coordinates = [
        currentLocation,
        pickupLocation,
        ridePhase === 'IN_PROGRESS' ? destination : null
      ].filter(Boolean);

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true
      });
    }
  }, [currentLocation, ridePhase]);

  const handleClientPickup = async () => {
    try {
      const confirmed = await new Promise((resolve) => {
        Alert.alert(
          'Confirmation',
          'Avez-vous récupéré la voiture ?',
          [
            { text: 'Non', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Oui', onPress: () => resolve(true) }
          ]
        );
      });
  
      if (confirmed) {
        const orderRef = doc(db, 'orders', orderDetails.id);
        await updateDoc(orderRef, {
          status: 'inProgress',
          pickupTime: new Date()
        });
        setShowInspection(false); // Cacher l'inspection après confirmation
        setRidePhase('IN_PROGRESS');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut de la course');
    }
  };

  const handleRideCompletion = async () => {
    setShowInspection(true);
    try {
      const confirmed = await new Promise((resolve) => {
        Alert.alert(
          'Fin de course',
          'Confirmez-vous être arrivé à destination ?',
          [
            { text: 'Non', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Oui', onPress: () => resolve(true) }
          ]
        );
      });

      if (confirmed) {
        const orderRef = doc(db, 'orders', orderDetails.id);
        await updateDoc(orderRef, {
          status: 'completed',
          completionTime: new Date()
        });
        Alert.alert('Succès', 'Course terminée avec succès !');
        navigation.navigate('Driver');
      }
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      Alert.alert('Erreur', 'Impossible de terminer la course');
    }
  };

  if (!currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Icon type="material-community" name="car" size={50} color="#1a73e8" />
        <Text style={styles.loadingText}>Localisation en cours...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          ...currentLocation,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
      >
        {currentLocation && (
          <Marker 
            coordinate={currentLocation}
            title="Vous êtes ici"
          >
            <View style={styles.driverMarker}>
              <Icon type="material-community" name="car" size={24} color="#1a73e8" />
            </View>
          </Marker>
        )}

        <Marker 
          coordinate={pickupLocation}
          title="Point de récupération"
          opacity={ridePhase === 'TO_PICKUP' ? 1 : 0.5}
        >
          <View style={styles.pickupMarker}>
            <Icon 
              type="material-community" 
              name="map-marker" 
              size={30} 
              color={ridePhase === 'TO_PICKUP' ? '#4CAF50' : '#999'} 
            />
          </View>
        </Marker>

        <Marker 
          coordinate={destination}
          title="Destination"
          opacity={ridePhase === 'IN_PROGRESS' ? 1 : 0.5}
        >
          <View style={styles.destinationMarker}>
            <Icon 
              type="material-community" 
              name="flag-checkered" 
              size={30} 
              color={ridePhase === 'IN_PROGRESS' ? '#FF5252' : '#999'} 
            />
          </View>
        </Marker>

        <MapViewDirections
          origin={currentLocation}
          destination={ridePhase === 'TO_PICKUP' ? pickupLocation : destination}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={4}
          strokeColor="#1a73e8"
          onReady={result => setRouteInfo(result)}
        />
      </MapView>

      <View style={styles.infoPanel}>
        <View style={styles.phaseIndicator}>
          <Text style={styles.phaseText}>
            {ridePhase === 'TO_PICKUP' ? 'En route pour recuperer la voiture' : 'Course en cours'}
          </Text>
        </View>

        {routeInfo && (
          <View style={styles.routeInfoContainer}>
            <View style={styles.infoItem}>
              <Icon type="material-community" name="map-marker-distance" size={24} color="#1a73e8" />
              <Text style={styles.infoText}>{routeInfo.distance.toFixed(1)} km</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon type="material-community" name="clock-outline" size={24} color="#1a73e8" />
              <Text style={styles.infoText}>{Math.round(routeInfo.duration)} min</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { 
            backgroundColor: ridePhase === 'TO_PICKUP' ? '#4CAF50' : '#FF5252' 
          }]}
          onPress={ridePhase === 'TO_PICKUP' ? handleClientPickup : handleRideCompletion}
        >
          <Text style={styles.actionButtonText}>
            {ridePhase === 'TO_PICKUP' ? 'Voiture recupérée ' : 'Terminer la course'}
          </Text>
        </TouchableOpacity>
      </View>
      {showInspection && (
  <VehicleInspectionChecklist
    orderId={orderDetails.id}
    isDriver={ridePhase === 'TO_PICKUP'}
    onComplete={async () => {
      setShowInspection(false);
      if (ridePhase === 'TO_PICKUP') {
        const orderRef = doc(db, 'orders', orderDetails.id);
        await updateDoc(orderRef, {
          status: 'inProgress',
          pickupTime: new Date()
        });
        setRidePhase('IN_PROGRESS');
      } else {
        const orderRef = doc(db, 'orders', orderDetails.id);
        await updateDoc(orderRef, {
          status: 'completed',
          completionTime: new Date()
        });
        Alert.alert('Succès', 'Course terminée avec succès !');
        navigation.navigate('Driver');
      }
    }}
  />
)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  driverMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1a73e8',
    elevation: 5,
  },
  pickupMarker: {
    alignItems: 'center',
  },
  destinationMarker: {
    alignItems: 'center',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  phaseIndicator: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  routeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoText: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapsScreen;