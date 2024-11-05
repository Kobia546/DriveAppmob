import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, Dimensions, ScrollView, FlatList, TouchableOpacity } from "react-native";
import { colors, parameters } from "../global/style";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import {  updateDoc } from 'firebase/firestore';
import { StatusBar } from "expo-status-bar";
import * as Location from 'expo-location';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import * as Notifications from 'expo-notifications';

const SCREEN_WIDTH = Dimensions.get('window').width;

const DriverHomeScreen = ({ navigation }) => {
    const [latlng, setLatLng] = useState({});
    const [orders, setOrders] = useState([]);
    const _map = useRef(null);

    const getLocation = async () => {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted) return;
        const { coords: { latitude, longitude } } = await Location.getCurrentPositionAsync();
        setLatLng({ latitude, longitude });
    };

    useEffect(() => {
        getLocation();
        registerForPushNotificationsAsync();
    }, []);

    const registerForPushNotificationsAsync = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            console.log('Permission not granted for notifications');
            return;
        }

        const token = (await Notifications.getExpoPushTokenAsync({ projectId: '57e70b0c-f485-44cc-bfb9-b6868dcbde3f' })).data;
        console.log('Push Notification Token:', token);
        const userId = auth.currentUser.uid; 
        const driverRef = doc(db, 'drivers', userId);
        await updateDoc(driverRef, { token: token });
        // setOrders(prevOrders => [
        //     ...prevOrders,
        //     notification.request.content.data.orderDetails,
        // ]);
        // Envoie le token à ton backend si nécessaire
    };

    useEffect(() => {
        const subscription = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification reçue:', notification);
            // Redirige vers AcceptOrderScreen avec les détails de la course
            navigation.navigate('AcceptOrderScreen', {
                orderDetails: notification.request.content.data.orderDetails,
            });
        });

        return () => subscription.remove();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bienvenue, Chauffeur</Text>
            </View>
            <ScrollView bounces={false}>
                <View style={styles.home}>
                    <Text style={styles.text1}>Vos courses en attente</Text>
                    <FlatList 
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={[{ id: '1', destination: 'Aéroport', time: '5 min' }, { id: '2', destination: 'Centre-ville', time: '10 min' }]}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.card}>
                                <Text style={styles.cardTitle}>{item.destination}</Text>
                                <Text style={styles.cardTime}>{item.time}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

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
                    >
                        {/* Ajoute des marqueurs ici si besoin */}
                    </MapView>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("DriverOrdersScreen", { orders })}>
                        <Text style={styles.footerButtonText}>Voir mes courses</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("ProfileScreen")}>
                        <Text style={styles.footerButtonText}>Mon Profil</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <StatusBar style="light" backgroundColor={colors.blue} translucent={true} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
        paddingBottom: 30,
        paddingTop: parameters.statusBarHeight,
    },
    header: {
        backgroundColor: colors.blue,
        height: parameters.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    headerTitle: {
        color: colors.white,
        fontSize: 20,
        marginLeft: 10,
    },
    home: {
        backgroundColor: colors.blue,
        padding: 20,
    },
    text1: {
        color: colors.white,
        fontSize: 22,
        marginBottom: 10,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 10,
        padding: 15,
        marginRight: 10,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        color: colors.black,
    },
    cardTime: {
        color: colors.grey,
    },
    mapContainer: {
        marginVertical: 20,
        alignItems: 'center',
    },
    map: {
        width: SCREEN_WIDTH * 0.9,
        height: 200,
        borderRadius: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 20,
    },
    footerButton: {
        backgroundColor: colors.black,
        padding: 15,
        borderRadius: 20,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    footerButtonText: {
        color: colors.white,
        fontSize: 16,
    },
});

export default DriverHomeScreen;
