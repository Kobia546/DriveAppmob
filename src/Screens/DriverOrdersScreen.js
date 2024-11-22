import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

const DriverOrdersScreen = ({ route }) => {
  const { orders } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Toutes les courses</Text>
      {orders.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <Text style={styles.orderInfo}>Destination: {order.destination}</Text>
          <Text style={styles.orderInfo}>Prix: {order.price?.toLocaleString()} FCFA</Text>
          <Text style={styles.orderInfo}>Distance: {order.distance?.toFixed(2)} km</Text>
          <Text style={styles.orderInfo}>Durée: {order.duration} min</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#2c3e50',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  orderInfo: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 4,
  },
});

export default DriverOrdersScreen;

