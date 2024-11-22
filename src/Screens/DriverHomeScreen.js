import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { StatusBar } from "expo-status-bar";
import * as Location from 'expo-location';
import { auth, db } from '../../firebaseConfig';
import { doc } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

const SCREEN_WIDTH = Dimensions.get('window').width;

const DailyEarningsCard = ({ totalEarnings, completedRides }) => (
  <View style={styles.earningsCard}>
    <View style={styles.earningsHeader}>
      <Text style={styles.earningsTitle}>Gains du jour</Text>
      <Text style={styles.earningsAmount}>{totalEarnings?.toLocaleString() || '0'} FCFA</Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{completedRides || 0}</Text>
        <Text style={styles.statLabel}>Courses</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>
          {completedRides ? (totalEarnings / completedRides).toLocaleString() : '0'}
        </Text>
        <Text style={styles.statLabel}>Moy/Course</Text>
      </View>
    </View>
  </View>
);

const AcceptedRidesSection = ({ acceptedRides, onRidePress }) => (
  <View style={styles.acceptedRidesContainer}>
    <Text style={styles.sectionTitle}>Mes courses du jour</Text>
    <View style={styles.ridesGrid}>
      {acceptedRides.map((ride) => (
        <TouchableOpacity
          key={ride.id}
          style={styles.rideCard}
          onPress={() => onRidePress(ride)}
        >
          <Text style={styles.rideDestination}>{ride.pickupLocation.address} - {ride.dropoffLocation.address}</Text>
          <View style={styles.rideDetails}>
            <Text style={styles.rideTime}>{ride.estimatedTime} min</Text>
            <Text style={styles.ridePrice}>{ride.price?.toLocaleString()} FCFA</Text>
          </View>
          <View style={[styles.rideStatus, { backgroundColor: ride.status === 'enCours' ? '#ffd700' : '#4CAF50' }]}>
            <Text style={styles.rideStatusText}>
              {ride.status === 'enCours' ? 'En cours' : 'Terminé'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const DriverHomeScreen = ({ navigation }) => {
  const [latlng, setLatLng] = useState({});
  const [orders, setOrders] = useState([]);
  const [driverName, setDriverName] = useState('');
  const [dailyStats, setDailyStats] = useState({ totalEarnings: 0, completedRides: 0 });
  const [acceptedRides, setAcceptedRides] = useState([]);
  const _map = useRef(null);

  useEffect(() => {
    const initializeApp = async () => {
      await Promise.all([
        getLocation(),
        registerForPushNotificationsAsync(),
        fetchDriverName(),
        fetchDriverOrders()
      ]);
    };

    initializeApp();
  }, []);

  const getLocation = async () => {
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return;

      const { coords: { latitude, longitude } } = await Location.getCurrentPositionAsync();
      setLatLng({ latitude, longitude });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const fetchDriverName = async () => {
    try {
      const userId = auth.currentUser.uid;
      const driverDocRef = doc(db, 'drivers', userId);
      const driverDoc = await getDoc(driverDocRef);

      if (driverDoc.exists()) {
        setDriverName(driverDoc.data().name);
      }
    } catch (error) {
      console.error('Error fetching driver name:', error);
    }
  };

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: '57e70b0c-f485-44cc-bfb9-b6868dcbde3f'
      })).data;

      const userId = auth.currentUser.uid;
      const driverRef = doc(db, 'drivers', userId);
      await updateDoc(driverRef, { token });
    } catch (error) {
      console.error('Error registering for notifications:', error);
    }
  };

  const fetchDriverOrders = async () => {
    try {
      const userId = auth.currentUser.uid;
      const ordersCollection = collection(db, 'orders');
      const q = query(ordersCollection, where('driverId', '==', userId));
      const querySnapshot = await getDocs(q);

      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrer et organiser les courses
      const today = new Date().setHours(0, 0, 0, 0);

      const todayOrders = ordersData.filter(order => {
        const orderDate = new Date(order.acceptedAt?.toDate()).setHours(0, 0, 0, 0);
        return orderDate === today;
      });

      const accepted = todayOrders.filter(order =>
        ['accepted', 'inProgress'].includes(order.status)
      ).map(order => ({
        ...order,
        estimatedTime: 15, 
        status: order.status === 'inProgress' ? 'enCours' : 'attente'
      }));

      const completed = todayOrders.filter(order =>
        order.status === 'accepted'
      ).map(order => ({
        ...order,
        completedAt: new Date(order.completedAt?.toDate()).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        duration: Math.round((order.completedAt?.toDate() - order.startTime?.toDate()) / 60000) || 0
      }));

      // Calculer les statistiques
      const totalEarnings = completed.reduce((sum, order) => sum + (order.price || 0), 0);

      setAcceptedRides(accepted);
      setDailyStats({
        totalEarnings,
        completedRides: completed.length
      });
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      navigation.navigate('AcceptOrderScreen', {
        orderDetails: notification.request.content.data.orderDetails,
      });
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#1a73e8" translucent={true} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bienvenue, {driverName}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <DailyEarningsCard
          totalEarnings={dailyStats.totalEarnings}
          completedRides={dailyStats.completedRides}
        />

        <View style={styles.mapContainer}>
          <MapView
            ref={_map}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            showsUserLocation
            followsUserLocation
            initialRegion={{
              latitude: latlng.latitude || 37.78825,
              longitude: latlng.longitude || -122.4324,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
          />
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate("DriverOrdersScreen", { orders })}
          >
            <Text style={styles.buttonText}>Voir mes courses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate("ProfileScreen")}
          >
            <Text style={styles.buttonText}>Mon Profil</Text>
          </TouchableOpacity>
        </View>

        <AcceptedRidesSection acceptedRides={acceptedRides} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a73e8',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2c3e50',
  },
  earningsCard: {
    backgroundColor: '#1a73e8',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 20,
  },
  earningsHeader: {
    marginBottom: 15,
  },
  earningsTitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: '#ffffff',
    opacity: 0.2,
    marginVertical: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#1a73e8',
  },
  secondaryButton: {
    backgroundColor: '#34495e',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  acceptedRidesContainer: {
    marginBottom: 20,
  },
  ridesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: SCREEN_WIDTH -44 ,
  },
  rideDestination: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rideTime: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  ridePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  rideStatus: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  rideStatusText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
});

export default DriverHomeScreen;
