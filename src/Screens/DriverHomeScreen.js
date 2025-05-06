import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { doc } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import {
  Wallet,
  Car,
  MapPin,
  Clock,
  User,
  Navigation,
  ChevronRight,
  Calendar,
  Menu,
  Bell,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  FadeIn,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { socketService } from "../../clientSocket";
import { useFocusEffect } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get("window").width;

const StatCard = ({ icon: Icon, value, label, color, delay = 200 }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).springify()}
    style={[styles.statCard, { backgroundColor: color }]}
  >
    <View style={styles.statIconContainer}>
      <Icon color="white" size={20} />
    </View>
    <View style={styles.statTextContainer}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </Animated.View>
);

const DailyEarningsCard = ({ totalEarnings, completedRides }) => {
  const averageEarningsPerRide = completedRides
  ? (totalEarnings / completedRides).toFixed(0)
  : "0";

  const formatMoney = (amount) => {
    return amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") || "0";
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(100).springify()}
      style={styles.earningsCard}
    >
      <LinearGradient
        colors={["#1a73e8", "#4a90e2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.earningsCardGradient}
      >
        <View style={styles.cardDecoration}>
          <View style={styles.cardDecorationCircle} />
          <View style={[styles.cardDecorationCircle, styles.cardDecorationCircle2]} />
        </View>

        <View style={styles.earningsHeader}>
          <View style={styles.earningsHeaderContent}>
            <View style={styles.iconBubble}>
              <Wallet color="white" size={22} />
            </View>
            <Text style={styles.earningsTitle}>Rapport Journalier</Text>
          </View>
         
          <Text style={styles.earningsAmount}>
          {formatMoney(totalEarnings.toFixed(0))} <Text style={styles.currencyText}>FCFA</Text>
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsContainer}>
          <StatCard
            icon={Car}
            value={completedRides || "0"}
            label="Courses"
            color="#4CAF50"
            delay={250}
          />
          <StatCard
            icon={() => <Text style={{color: "white", fontSize: 16, fontWeight: "bold"}}>CFA</Text>}
            value={formatMoney(averageEarningsPerRide)}
            label="Moy/Course"
            color="#FF9800"
            delay={300}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};
// Composant pour afficher les commandes en attente
const PendingOrdersNotification = ({ orders, onSelectOrder }) => {
  if (orders.length === 0) return null;

  return (
    <View style={styles.pendingOrdersContainer}>
      <Text style={styles.pendingOrdersTitle}>
        {orders.length} {orders.length === 1 ? 'commande' : 'commandes'} disponible{orders.length > 1 ? 's' : ''}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {orders.map((order, index) => (
          <TouchableOpacity 
            key={order.id || index}
            style={styles.pendingOrderCard}
            onPress={() => onSelectOrder(order)}
          >
            <View style={styles.locationContainer}>
              <View style={styles.locationDots}>
                <View style={[styles.locationDot, { backgroundColor: "#1a73e8" }]} />
                <View style={styles.locationLine} />
                <View style={[styles.locationDot, { backgroundColor: "#FF9800" }]} />
              </View>
              <View style={styles.addressesContainer}>
                <Text style={styles.addressText} numberOfLines={1}>
                  {order.pickupLocation.address}
                </Text>
                <Text style={styles.addressText} numberOfLines={1}>
                  {order.dropoffLocation.address}
                </Text>
              </View>
            </View>
            <View style={styles.orderDetailsRow}>
              <View style={styles.detailItem}>
                <View style={[styles.detailIcon, { backgroundColor: "#E8F5E9" }]}>
                  <Text style={styles.moneyIcon}>CFA</Text>
                </View>
                <Text style={styles.priceText}>{order.price.toFixed(0)}</Text>
              </View>
              <View style={styles.detailItem}>
                <View style={[styles.detailIcon, { backgroundColor: "#E3F2FD" }]}>
                  <Clock color="#1a73e8" size={14} />
                </View>
                <Text style={styles.timeText}>{order.estimatedTime || "15 min"}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => onSelectOrder(order)}
            >
              <Text style={styles.selectButtonText}>Voir détails</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const AcceptedRidesSection = ({ acceptedRides, onRidePress, isLoading }) => {
  const formatMoney = (amount) => {
    return amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") || "0";
  };

  const getCardGradient = (index) => {
    const gradients = [
      ['#FFFFFF', '#F8F9FA'],
      ['#F8F9FA', '#FFFFFF'],
      ['#FFFFFF', '#F5F5F5'],
    ];
    return gradients[index % gradients.length];
  };

  return (
    <Animated.View
      entering={SlideInRight.delay(300).springify()}
      style={styles.acceptedRidesContainer}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes courses du jour</Text>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>Voir tout</Text>
          <ChevronRight color="#1a73e8" size={16} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#1a73e8" size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ridesScrollView}
        >
          {acceptedRides.length > 0 ? (
            acceptedRides.map((ride, index) => (
              <TouchableOpacity
                key={ride.id}
                style={[
                  styles.rideCard,
                  { borderLeftColor: ride.status === "enCours" ? "#FF9800" : "#4CAF50", borderLeftWidth: 4 }
                ]}
                onPress={() => ride.status === "enCours" ? onRidePress(ride) : null}
                disabled={ride.status !== "enCours"}
              >
                <View style={styles.rideCardHeader}>
                  <View style={styles.locationContainer}>
                    <View style={styles.locationDots}>
                      <View style={[styles.locationDot, { backgroundColor: "#1a73e8" }]} />
                      <View style={styles.locationLine} />
                      <View style={[styles.locationDot, { backgroundColor: "#FF9800" }]} />
                    </View>

                    <View style={styles.addressesContainer}>
                      <Text style={styles.addressText} numberOfLines={1}>
                        {ride.pickupLocation.address}
                      </Text>
                      <Text style={styles.addressText} numberOfLines={1}>
                        {ride.dropoffLocation.address}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.rideDetails}>
                  <View style={styles.rideDetailItem}>
                    <View style={[styles.detailIcon, { backgroundColor: "#E3F2FD" }]}>
                      <Clock color="#1a73e8" size={14} />
                    </View>
                    <Text style={styles.rideTime}>{ride.estimatedTime} min</Text>
                  </View>

                  <View style={styles.rideDetailItem}>
                    <View style={[styles.detailIcon, { backgroundColor: "#E8F5E9" }]}>
                      <Text style={styles.moneyIcon}>CFA</Text>
                    </View>
                    <Text style={styles.ridePrice}>{formatMoney(ride.price?.toFixed(0))}</Text>
                  </View>
                  <View
  style={[
    styles.rideStatus,
    {
      backgroundColor:
        ride.status === "accepted" || ride.status === "enCours"
          ? "rgba(255, 152, 0, 0.15)" // orange clair
          : ride.status === "completed"
          ? "rgba(76, 175, 80, 0.15)" // vert clair
          : "transparent", // autre
    },
  ]}
>
  <Text
    style={[
      styles.rideStatusText,
      {
        color:
          ride.status === "accepted" || ride.status === "enCours"
            ? "#FF9800" // orange
            : ride.status === "completed"
            ? "#4CAF50" // vert
            : "#000", // noir par défaut
      },
    ]}
  >
    {ride.status === "accepted" || ride.status === "enCours"
      ? "En cours"
      : ride.status === "completed"
      ? "Terminé"
      : ""}
  </Text>
</View>


                  
                  
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Car color="#BDBDBD" size={40} />
              <Text style={styles.noRidesText}>Aucune course aujourd'hui</Text>
              <Text style={styles.emptyStateSubtext}>
                Les courses acceptées apparaîtront ici
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const ActiveRideBanner = ({ activeRide, onPress }) => {
  if (!activeRide || activeRide.status !== "accepted") return null;

  return (
    <TouchableOpacity
      style={styles.activeRideBanner}
      onPress={onPress}
    >
      <LinearGradient
        colors={["#FF9800", "#F57C00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.activeRideBannerGradient}
      >
        <View style={styles.activeRideBannerContent}>
          <View style={styles.activeRideIconContainer}>
            <Car color="white" size={24} />
          </View>
          <View style={styles.activeRideTextContainer}>
            <Text style={styles.activeRideTitle}>Course en cours</Text>
            <Text style={styles.activeRideSubtitle}>
              Appuyez pour reprendre votre course
            </Text>
          </View>
          <ChevronRight color="white" size={24} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const DriverHomeScreen = ({ navigation }) => {
  const [latlng, setLatLng] = useState({});
  const [orders, setOrders] = useState([]);
  const [driverName, setDriverName] = useState("");
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [dailyStats, setDailyStats] = useState({
    totalEarnings: 0,
    completedRides: 0,
  });
  const [acceptedRides, setAcceptedRides] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const _map = useRef(null);
  
  // Nouvelle référence pour suivre l'état de la connexion socket
  const socketConnected = useRef(false);
  const socketInitialized = useRef(false);
  
  const getDriverId = () => {
    return auth.currentUser?.uid;
  };

  const checkForActiveRides = async () => {
    try {
      console.log("Vérification des courses actives...");
      const userId = getDriverId();
      if (!userId) return;
      
      const ordersCollection = collection(db, "orders");
      const q = query(
        ordersCollection,
        where("driverId", "==", userId),
        where("status", "in", ["accepted", "inProgress"])
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const activeOrder = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
        console.log("Course active trouvée:", activeOrder.id);
        setActiveRide(activeOrder);
      } else {
        setActiveRide(null);
      }
    } catch (error) {
      console.error("Error checking for active rides:", error);
    }
  };

  const getLocation = async () => {
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return;

      const {
        coords: { latitude, longitude },
      } = await Location.getCurrentPositionAsync();
      setLatLng({ latitude, longitude });
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const fetchDriverName = async () => {
    try {
      const userId = getDriverId();
      if (!userId) return;
      
      const driverDocRef = doc(db, "drivers", userId);
      const driverDoc = await getDoc(driverDocRef);

      if (driverDoc.exists()) {
        setDriverName(driverDoc.data().name);
      }
    } catch (error) {
      console.error("Error fetching driver name:", error);
    }
  };

  const fetchDriverOrders = async () => {
    try {
      setIsRefreshing(true);
      const userId = getDriverId();
      if (!userId) return;
      
      const ordersCollection = collection(db, "orders");
      const q = query(ordersCollection, where("driverId", "==", userId));
      const querySnapshot = await getDocs(q);

      const ordersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const today = new Date().setHours(0, 0, 0, 0);
      const todayOrders = ordersData.filter((order) => {
        const orderDate = order.acceptedAt?.toDate();
        return orderDate && new Date(orderDate).setHours(0, 0, 0, 0) === today;
      });

      const activeRides = todayOrders
        .filter(
          (order) =>
            order.status === "completed" ||
            order.status === "accepted" ||
            order.status === "inProgress"
        )
        .map((order) => ({
          ...order,
          estimatedTime: order.estimatedTime || 15,
          status: order.status,
        }));

      const completedRides = todayOrders
        .filter((order) => order.status === "completed")
        .map((order) => ({
          ...order,
          completedAt: order.completedAt
            ?.toDate()
            .toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          duration:
            order.completedAt && order.startTime
              ? Math.round(
                  (order.completedAt.toDate() - order.startTime.toDate()) / 60000
                )
              : 0,
        }));

      const totalEarnings = completedRides.reduce(
        (sum, order) => sum + (order.price || 0),
        0
      );

      setAcceptedRides(activeRides);
      setDailyStats({
        totalEarnings,
        completedRides: completedRides.length,
      });
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Complètement refactorisé pour simplifier et rendre la connexion plus robuste
  const setupSocketConnection = async () => {
    try {
      if (socketInitialized.current && socketConnected.current) {
        console.log("Socket already connected and initialized, skipping");
        return;
      }
      
      setIsConnecting(true);
      const driverId = getDriverId();
  
      if (!driverId) {
        console.error("No driver ID available");
        setIsConnecting(false);
        return;
      }
  
      // Déconnexion préalable au cas où
      if (socketService.isConnected) {
        await socketService.disconnect();
        console.log("Socket déconnecté avant reconnexion");
      }
  
      // Initialiser le service de socket
      if (!socketInitialized.current) {
        await socketService.initialize();
        socketInitialized.current = true;
        console.log("Socket service initialized");
      }
  
      // Connecter le socket
      await socketService.connect();
      
      // Vérifier la connexion
      if (!socketService.isConnected) {
        console.error("Failed to connect socket");
        setIsConnecting(false);
        socketConnected.current = false;
        return;
      }
      
      console.log("Socket successfully connected, authenticating driver...");
      
      // Authentifier le conducteur
      await socketService.authenticateDriver(driverId);
      console.log("Driver successfully authenticated:", driverId);
      
      // Configurer les écouteurs d'événements une seule fois
      socketService.onNewOrder((orderDetails) => {
        console.log("New order received:", orderDetails);
        // Au lieu de naviguer directement, ajouter à la liste
        setPendingOrders(currentOrders => [...currentOrders, orderDetails]);
      });
      // Configurer l'écouteur de déconnexion
      socketService.onDisconnect(() => {
        console.log("Socket disconnected, will reconnect automatically");
        socketConnected.current = false;
        
        // Reconnexion automatique après un délai
        setTimeout(() => {
          if (!socketConnected.current) {
            console.log("Attempting to reconnect...");
            setupSocketConnection();
          }
        }, 3000);
      });
      
      socketConnected.current = true;
      setIsConnecting(false);
      
    } catch (error) {
      console.error("Socket connection error:", error);
      socketConnected.current = false;
      setIsConnecting(false);
      
      // Tentative de reconnexion après un délai en cas d'erreur
      setTimeout(() => {
        setupSocketConnection();
      }, 5000);
    }
  };
  const handleOrderSelection = (orderDetails) => {
    // Supprimer la commande sélectionnée de la liste
    setPendingOrders(currentOrders => 
      currentOrders.filter(order => order.id !== orderDetails.id)
    );
    // Naviguer vers l'écran d'acceptation
    navigation.navigate("AcceptOrderScreen", { orderDetails });
  };
  const addOrderWithExpiration = (orderDetails) => {
    // Ajouter la commande à la liste
    setPendingOrders(currentOrders => [...currentOrders, orderDetails]);
    
    // Définir un délai d'expiration (par exemple 60 secondes)
    setTimeout(() => {
      // Supprimer la commande après expiration
      setPendingOrders(currentOrders => 
        currentOrders.filter(order => order.id !== orderDetails.id)
      );
    }, 60000); // 60 secondes
  };
  
  // Utiliser cette fonction au lieu de setPendingOrders directement
  socketService.onNewOrder((orderDetails) => {
    console.log("New order received:", orderDetails);
    addOrderWithExpiration(orderDetails);
  });

  // Initialisation principale de l'application
  const initializeApp = async () => {
    try {
      await Promise.all([
        getLocation(),
        fetchDriverName(),
        fetchDriverOrders(),
        checkForActiveRides()
      ]);
      
      // Configurer le socket séparément
      await setupSocketConnection();
    } catch (error) {
      console.error("Error initializing app:", error);
    }
  };

  // Effet lors du focus sur cet écran
  useFocusEffect(
    React.useCallback(() => {
      console.log("DriverHomeScreen est maintenant actif, actualisation des données...");
      
      const refreshData = async () => {
        await fetchDriverOrders();
        await checkForActiveRides();
        
        // Vérifier l'état du socket et reconnecter si nécessaire
        if (!socketConnected.current || !socketService.isConnected) {
          console.log("Socket non connecté, reconnexion en cours...");
          await setupSocketConnection();
        } else {
          console.log("Socket déjà connecté, skip reconnexion");
        }
      };
      
      refreshData();

      // Fonction appelée quand le composant perd le focus
      return () => {
        console.log("DriverHomeScreen n'est plus actif");
        // NE PAS déconnecter le socket ici pour maintenir la connexion
      };
    }, [])
  );

  // Effet initial au montage du composant
  useEffect(() => {
    console.log("DriverHomeScreen monté, initialisation complète...");
    initializeApp();

    // Nettoyage au démontage complet
    return () => {
      console.log("DriverHomeScreen démonté complètement, nettoyage...");
      // On déconnecte uniquement lors du démontage complet, pas lors des changements d'écran
      if (socketService.isConnected) {
        socketService.disconnect();
        socketConnected.current = false;
      }
    };
  }, []);

  // Configuration des notifications
  useEffect(() => {
    // Configuration des notifications
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const newOrder = notification.request.content.data.orderDetails;
        // Au lieu de naviguer directement, ajouter à la liste
        setPendingOrders(currentOrders => [...currentOrders, newOrder]);
      }
    );
  
    return () => subscription.remove();
  }, []);

  const getFormattedCurrentDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date().toLocaleDateString('fr-FR', options);
  };

  const handleRidePress = (ride) => {
    console.log("Course sélectionnée:", ride.id);
    navigation.navigate("MapScreen", { orderDetails: ride });
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#1a73e8" translucent={true} />

      <LinearGradient
        colors={["#1a73e8", "#4a90e2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTopSection}>
          <TouchableOpacity style={styles.menuButton}>
            <Menu color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.notificationButton}>
            <Bell color="white" size={24} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <User color="white" size={24} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Bienvenue,</Text>
            <Text style={styles.headerTitle}>{driverName}</Text>
          </View>
        </View>

        <View style={styles.dateContainer}>
          <Calendar color="white" size={14} />
          <Text style={styles.dateText}>{getFormattedCurrentDate()}</Text>
        </View>
      </LinearGradient>

      <ActiveRideBanner
        activeRide={activeRide}
        onPress={() => navigation.navigate("MapScreen", { orderDetails: activeRide })}
      />
        <PendingOrdersNotification 
      orders={pendingOrders}
      onSelectOrder={handleOrderSelection}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          activeOpacity={activeRide ? 0.7 : 1}
          onPress={() => {
            if (activeRide) {
              navigation.navigate("MapScreen", { orderDetails: activeRide });
            }
          }}
        >
          <DailyEarningsCard
            totalEarnings={dailyStats.totalEarnings}
            completedRides={dailyStats.completedRides}
          />
          {activeRide && (
            <View style={styles.activeRideIndicator}>
              <Text style={styles.activeRideIndicatorText}>Cliquez pour reprendre votre course</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.actionButtonsContainer}>
          <Animated.Text
            entering={FadeIn.delay(200)}
            style={styles.actionTitle}
          >
            Actions rapides
          </Animated.Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigation.navigate("DriverOrdersScreen", { orders })}
            >
              <View style={styles.actionButtonIcon}>
                <Navigation color="white" size={20} />
              </View>
              <Text style={styles.buttonText}>Mes courses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => navigation.navigate("ProfileScreen")}
            >
              <View style={styles.actionButtonIcon}>
                <User color="white" size={20} />
              </View>
              <Text style={styles.buttonText}>Mon Profil</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AcceptedRidesSection
          acceptedRides={acceptedRides}
          onRidePress={handleRidePress}
          isLoading={isRefreshing}
        />
        
      </ScrollView>
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 6,
    shadowColor: "#1a73e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerTopSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 29,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10, // Déplacer vers le bas
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10, // Déplacer vers le bas
  },
  notificationBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5252",
    position: "absolute",
    top: 10,
    right: 10,
  },
  pendingOrdersContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pendingOrdersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a73e8',
  },
  pendingOrderCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    width: 250,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  orderDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  selectButton: {
    backgroundColor: '#1a73e8',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
  },
  welcomeText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 20,
    marginBottom: 4,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginLeft: 5,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  dateText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginLeft: 6,
    textTransform: "capitalize",
  },
  earningsCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 6,
    shadowColor: "#1a73e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  cardDecoration: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },
  cardDecorationCircle: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -75,
    right: -75,
  },
  cardDecorationCircle2: {
    width: 100,
    height: 100,
    borderRadius: 50,
    top: 50,
    right: 50,
    bottom: -50,
    left: -50,
  },
  earningsCardGradient: {
    padding: 20,
    position: "relative",
  },
  earningsHeader: {
    marginBottom: 15,
    alignItems: "center",
  },
  earningsHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  earningsTitle: {
    fontSize: 16,
    marginRight: 100,
    fontWeight: "500",
    color: "#ffffff",
    opacity: 0.9,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center", // Centrer le texte
  },
  currencyText: {
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: "#ffffff",
    opacity: 0.2,
    marginVertical: 15,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 10,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    flex: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#ffffff",
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 30,
  },
  actionButtonsContainer: {
    marginBottom: 20,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#1a73e8",
  },
  secondaryButton: {
    backgroundColor: "#34495e",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: 14,
    color: "#1a73e8",
    marginRight: 4,
  },
  acceptedRidesContainer: {
    marginBottom: 20,
  },
  ridesScrollView: {
    gap: 12,
  },
  rideCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rideCardHeader: {
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: "row",
  },
  locationDots: {
    width: 20,
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 10,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locationLine: {
    width: 2,
    height: 24,
    backgroundColor: "#E0E0E0",
  },
  addressesContainer: {
    flex: 1,
    justifyContent: "space-between",
    height: 44,
  },
  addressText: {
    fontSize: 14,
    color: "#2c3e50",
  },
  rideDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
  },
  rideDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  moneyIcon: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  rideTime: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  ridePrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  rideStatus: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  rideStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  noRidesText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2c3e50",
    textAlign: "center",
    marginTop: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#757575",
    marginTop: 8,
    textAlign: "center",
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  activeRideBanner: {
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 10,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  activeRideBannerGradient: {
    width: "100%",
  },
  activeRideBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  activeRideIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  activeRideTextContainer: {
    flex: 1,
  },
  activeRideTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  activeRideSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
  },
  activeRideIndicator: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  activeRideIndicatorText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  }
});

export default DriverHomeScreen;
