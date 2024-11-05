import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import firebase from 'firebase/app';
import 'firebase/firestore';

export default function HistoryScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

 
  const fetchOrders = async () => {
    const userId = firebase.auth().currentUser.uid;
    const ordersRef = firebase.firestore().collection('orders').where('userId', '==', userId);
    
    try {
      const snapshot = await ordersRef.get();
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersList);
      setLoading(false);
    } catch (error) {
      console.log("Erreur lors de la récupération des commandes:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement des commandes...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Aucune commande trouvée.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList 
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.orderItem}>
            <Text style={styles.orderText}>Commande #{item.id}</Text>
            <Text style={styles.orderText}>Date: {new Date(item.date).toLocaleDateString()}</Text>
            <Text style={styles.orderText}>Montant: {item.amount} €</Text>
            <Text style={styles.orderText}>Statut: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  orderItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  orderText: {
    fontSize: 16,
    marginBottom: 5,
  },
});
