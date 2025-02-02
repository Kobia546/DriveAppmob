import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Clock, DollarSign, Navigation, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const DriverOrdersScreen = ({ route }) => {
  const { orders } = route.params;

  return (
    <LinearGradient colors={['#f5f5f5', '#e0e0e0']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Toutes les courses</Text>
        {orders.map((order, index) => (
          <Animated.View
            key={order.id}
            style={styles.orderCard}
            entering={FadeInDown.delay(index * 100).springify()}
          >
            {/* Adresse de départ */}
            <View style={styles.orderHeader}>
              <MapPin color="#1a73e8" size={20} />
              <Text style={styles.orderAddress}>{order.pickupLocation.address}</Text>
            </View>

            {/* Icône de flèche pour indiquer la destination */}
            <View style={styles.arrowContainer}>
              <ChevronRight color="#666" size={16} />
            </View>

            {/* Adresse de destination */}
            <View style={styles.orderHeader}>
              <MapPin color="#FF9800" size={20} />
              <Text style={styles.orderAddress}>{order.dropoffLocation.address}</Text>
            </View>

            {/* Détails de la course */}
            <View style={styles.orderDetails}>
              <View style={styles.orderDetailItem}>
                <DollarSign color="#4CAF50" size={16} />
                <Text style={styles.orderInfo}>{order.price?.toLocaleString()} FCFA</Text>
              </View>
              <View style={styles.orderDetailItem}>
                <Navigation color="#FF9800" size={16} />
                <Text style={styles.orderInfo}>{order.distance?.toFixed(2)} km</Text>
              </View>
              <View style={styles.orderDetailItem}>
                <Clock color="#2196F3" size={16} />
                <Text style={styles.orderInfo}>{order.estimatedTime} min</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 29,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 39,
    color: '#2c3e50',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  orderDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderInfo: {
    fontSize: 14,
    color: '#555',
  },
});

export default DriverOrdersScreen;