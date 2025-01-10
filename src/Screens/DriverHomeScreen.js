import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView 
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from 'expo-location';
import { updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { doc } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { useRef } from "react";
import { 
  Wallet, 
  Car, 
  MapPin, 
  Clock, 
  User, 
  DollarSign, 
  Navigation 
} from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  SlideInRight 
} from 'react-native-reanimated';
import { socketService } from "../../clientSocket";

const SCREEN_WIDTH = Dimensions.get('window').width;

const StatCard = ({ icon: Icon, value, label, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color }]}>
      <Icon color="white" size={20} />
    </View>
    <View style={styles.statTextContainer}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const DailyEarningsCard = ({ totalEarnings, completedRides }) => {
  const averageEarningsPerRide = completedRides 
    ? (totalEarnings / completedRides).toFixed(0)
    : '0';

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTextContainer}>
          <Wallet color="#1a73e8" size={24} />
          <Text style={styles.headerText}>Rapport Journalier</Text>
        </View>
        <Text style={styles.totalEarningsText}>
          {totalEarnings?.toLocaleString() || '0'} XOF
        </Text>
      </View>
      
      <View style={styles.statsContainer}>
        <StatCard 
          icon={Car}
          value={completedRides || '0'}
          label="Courses"
          color="#4CAF50"
        />
        <StatCard 
          icon={DollarSign}
          value={averageEarningsPerRide}
          label="Moy/Course"
          color="#FF9800"
        />
      </View>
    </View>
  );
};
const AcceptedRidesSection = ({ acceptedRides, onRidePress }) => (
  <View style={styles.acceptedRidesContainer}>
    <Text style={styles.sectionTitle}>Mes courses du jour</Text>
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.ridesScrollView}
    >
      {acceptedRides.map((ride, index) => (
        <View
          key={ride.id}
          style={styles.rideCard}
        >
          <View style={styles.rideCardHeader}>
            <MapPin color="#2c3e50" size={20} />
            <Text style={styles.rideDestination} numberOfLines={2}>
              {ride.pickupLocation.address} - {ride.dropoffLocation.address}
            </Text>
          </View>
          <View style={styles.rideDetails}>
            <View style={styles.rideDetailItem}>
              <Clock color="#7f8c8d" size={16} />
              <Text style={styles.rideTime}>{ride.estimatedTime} min</Text>
            </View>
            <View style={styles.rideDetailItem}>
              <DollarSign color="#2c3e50" size={16} />
              <Text style={styles.ridePrice}>{ride.price?.toLocaleString()} FCFA</Text>
            </View>
          </View>
          <View 
            style={[
              styles.rideStatus, 
              { 
                backgroundColor: ride.status === 'enCours' 
                  ? 'rgba(255, 215, 0, 0.2)' 
                  : 'rgba(76, 175, 80, 0.2)' 
              }
            ]}
          >
            <Text style={styles.rideStatusText}>
              {ride.status === 'enCours' ? 'En cours' : 'Terminé'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
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
      try {
        await Promise.all([
          getLocation(),
          fetchDriverName(),
          fetchDriverOrders()
        ]);
  
        // Initialize socket connection
        socketService.connect();
  
        // Add delay before connecting as driver
        setTimeout(() => {
          const driverId = auth.currentUser?.uid;
          if (driverId) {
            if (socketService.isConnected) {
              socketService.connectAsDriver(driverId);
              console.log('Connected as driver:', driverId);
            } else {
              console.error('Cannot connect as driver: Socket not connected');
            }
          }
        }, 1000);
  
        // Listen for new orders
        socketService.onNewOrder((orderDetails) => {
          console.log('New order received in driver screen:', orderDetails);
          navigation.navigate('AcceptOrderScreen', { orderDetails });
        });
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
  
    initializeApp();
  
    return () => {
      socketService.disconnect();
    };
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
        <View style={styles.headerContent}>
          <User color="white" size={28} />
          <Text style={styles.headerTitle}>Bienvenue, {driverName}</Text>
        </View>
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

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate("DriverOrdersScreen", { orders })}
          >
            <Navigation color="white" size={20} />
            <Text style={styles.buttonText}>Voir mes courses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate("ProfileScreen")}
          >
            <User color="white" size={20} />
            <Text style={styles.buttonText}>Mon Profil</Text>
          </TouchableOpacity>
        </View>

        <AcceptedRidesSection 
          acceptedRides={acceptedRides} 
          onRidePress={(ride) => {/* navigation logic */}} 
        />
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalEarningsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    width: '48%',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  earningsCard: {
    backgroundColor: '#1a73e8', // Replaced LinearGradient with solid color
    borderRadius: 16,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    padding: 20, // Added padding here
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
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  earningsCardGradient: {
    padding: 20,
  },
  earningsHeader: {
    marginBottom: 15,
  },
  earningsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
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
    gap: 6,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
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
  ridesScrollView: {
    gap: 12,
  },
  rideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: SCREEN_WIDTH - 44,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginRight: 12,
  },
  rideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rideDestination: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    flex: 1,
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rideDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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