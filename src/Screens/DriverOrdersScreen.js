import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig'; // Assure-toi d'importer 'auth' pour obtenir l'utilisateur connecté
import { colors } from "../global/style";

const SCREEN_WIDTH = Dimensions.get('window').width;

const DriverOrdersScreen = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchAcceptedOrders();
  }, []);

  const fetchAcceptedOrders = async () => {
    const userId = auth.currentUser.uid; // Récupère l'ID du chauffeur connecté
    const q = query(
      collection(db, 'orders'), 
      where('status', '==', 'accepted'), 
      where('driverId', '==', userId) // Filtre par ID du chauffeur
    );
    
    const querySnapshot = await getDocs(q);
    const acceptedOrders = [];
    querySnapshot.forEach((doc) => {
      acceptedOrders.push({ id: doc.id, ...doc.data() });
    });
    setOrders(acceptedOrders);
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderDetails}>
        <Text style={styles.orderDestination}>{item.destination}</Text>
        <Text style={styles.orderTime}>Durée estimée: {item.time}</Text>
        <Text style={styles.orderPrice}>Prix: {item.price}€</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Commandes acceptées</Text>
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.ordersList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune commande acceptée pour l'instant.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    textAlign: 'center',
    marginBottom: 20,
  },
  ordersList: {
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  orderDetails: {
    justifyContent: 'center',
  },
  orderDestination: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.blue,
    marginBottom: 5,
  },
  orderTime: {
    fontSize: 16,
    color: colors.grey,
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: colors.grey,
  },
});

export default DriverOrdersScreen;
