import React, { useState, useContext, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image, TextInput, FlatList, ActivityIndicator } from "react-native";
import { Avatar, Icon } from 'react-native-elements';
import { colors, parameters } from '../global/style';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapComponent from "../Compnents/MapComponent";
import MapViewDirections from 'react-native-maps-directions';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { db, auth } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import * as Device from 'expo-device';
import { OriginContext, DestinationContext } from '../Contexts/contexts';


const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GOOGLE_MAPS_APIKEY = 'YOUR_API_KEY'; // Remplacez par votre clé API

Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
  
export default function RequestScreen({ navigation }) {
    const { origin, dispatchOrigin } = useContext(OriginContext);
    const { destination, dispatchDestination } = useContext(DestinationContext);

    // États pour la recherche et les suggestions
    const [activeInput, setActiveInput] = useState(null);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filteredLocations, setFilteredLocations] = useState([]);

    const [userOrigin, setUserOrigin] = useState({
        latitude: origin?.latitude || null,
        longitude: origin?.longitude || null,
        address: ''
    });

    const [userDestination, setUserDestination] = useState({
        latitude: destination?.latitude || null,
        longitude: destination?.longitude || null,
        address: ''
    });

    // Centre initial de la carte (Abidjan)
    const initialRegion = {
        latitude: 5.3600,
        longitude: -4.0083,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
    };

    // Références pour les inputs
    const originInputRef = useRef(null);
    const destinationInputRef = useRef(null);

    // Fonction pour récupérer les lieux d'Abidjan
    const fetchAbidjanLocations = async () => {
        setLoading(true);
        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        const query = `
            [out:json];
            area["name"="Abidjan"]->.searchArea;
            (
                node["place"="suburb"](area.searchArea);
                node["place"="town"](area.searchArea);
                way["highway"](area.searchArea);
                node["highway"="junction"](area.searchArea);
                node["landuse"="park"](area.searchArea);
                node["amenity"="hotel"](area.searchArea);
                node["amenity"="restaurant"](area.searchArea);
                node["amenity"="cafe"](area.searchArea);
                node["amenity"="school"](area.searchArea);
                node["amenity"="hospital"](area.searchArea);
                node["amenity"="fuel"](area.searchArea);
                node["amenity"="bank"](area.searchArea);
                node["shop"](area.searchArea);
            );
            out body;
        `;

        try {
            const response = await axios.post(overpassUrl, query, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            const allData = response.data.elements
                .filter((element) => element.tags && element.tags.name)
                .map((location) => ({
                    id: location.id,
                    name: location.tags.name,
                    type: location.tags.place || location.tags.highway || location.tags.landuse || location.tags.amenity || 'Lieu',
                    lat: location.lat,
                    lon: location.lon,
                }));
            setLocations(allData);
        } catch (error) {
            console.error("Erreur lors de la récupération des lieux:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAbidjanLocations();
    }, []);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        registerForPushNotificationsAsync();
        setUpNotificationListeners();

        // Nettoyage lors du démontage du composant
        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    const registerForPushNotificationsAsync = async () => {
        if (!Device.isDevice) {
            Alert.alert('Notification non disponible', 'Les notifications ne fonctionnent pas sur l\'émulateur');
            return;
        }

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                Alert.alert('Erreur', 'Les notifications sont nécessaires pour recevoir les informations du chauffeur');
                return;
            }

            // Obtenir le token Expo
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: '57e70b0c-f485-44cc-bfb9-b6868dcbde3f', // Remplacer par votre ID de projet Expo
            });

            // Sauvegarder le token dans Firestore pour l'utilisateur actuel
            const userId = auth.currentUser?.uid;
            if (userId) {
                await updateDoc(doc(db, 'users', userId), {
                    token: tokenData.data,
                    lastUpdated: new Date()
                });
            }

        } catch (error) {
            console.error('Erreur lors de l\'enregistrement des notifications:', error);
        }
    };

    const setUpNotificationListeners = () => {
        // Écouteur pour les notifications reçues quand l'app est ouverte
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            const { title, body, data } = notification.request.content;
    
            console.log("Notification reçue:", { title, body, data });
    
            if (data?.type === 'ORDER_ACCEPTED') {
                // Afficher une alerte avec les informations du chauffeur
                Alert.alert(
                    title,
                    body,
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('OrderTracking', {
                                driverInfo: data.driverInfo,
                                orderDetails: data.orderDetails
                            })
                        }
                    ]
                );
            }
        });
    
        // Écouteur pour quand l'utilisateur clique sur la notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const { data } = response.notification.request.content;
    
            console.log("Notification cliquée:", { data });
    
            if (data?.type === 'ORDER_ACCEPTED') {
                // Naviguer vers l'écran de suivi de commande
                navigation.navigate('OrderTracking', {
                    driverInfo: data.driverInfo,
                    orderDetails: data.orderDetails
                });
            }
        });
    };
    

    const handleSearch = (text, type) => {
        if (text.length > 1) {
            const filtered = locations.filter((location) =>
                location.name.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredLocations(filtered);
        } else {
            setFilteredLocations([]);
        }

        if (type === 'origin') {
            setUserOrigin(prev => ({ ...prev, address: text }));
        } else {
            setUserDestination(prev => ({ ...prev, address: text }));
        }
    };

    const handleSelectLocation = (item, type) => {
        const mappedItem = {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            address: item.name,
        };

        if (type === 'origin') {
            setUserOrigin(mappedItem);
            dispatchOrigin({
                type: 'ADD_ORIGIN',
                payload: { ...mappedItem, type: item.type, name: item.name },
            });
        } else {
            setUserDestination(mappedItem);
            dispatchDestination({
                type: 'ADD_DESTINATION',
                payload: { ...mappedItem, type: item.type, name: item.name },
            });
        }
        setActiveInput(null);
        setFilteredLocations([]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.view1}>
                <Icon
                    type="material-community"
                    name="arrow-left"
                    color={colors.grey1}
                    size={32}
                    onPress={() => navigation.goBack()}
                />
            </View>

            <View style={styles.view2}>
                <TouchableOpacity>
                    <View style={styles.view3}>
                        
                        <Text style={{ marginLeft: "33%" }}>Services</Text>
                        <Icon
                            type="material-community"
                            name="chevron-down"
                            color={colors.grey1}
                            size={26}
                        />
                    </View>
                </TouchableOpacity>

                <View style={styles.view4}>
                    <View>
                        <Image
                            style={styles.image1}
                            source={require("../../assets/transit.png")}
                        />
                    </View>
                    <View>
                        <TouchableOpacity
                            onPress={() => setActiveInput('origin')}
                            style={styles.view6}
                        >
                            <TextInput
                                ref={originInputRef}
                                style={styles.text1}
                                placeholder="D'où?"
                                value={userOrigin.address}
                                onChangeText={(text) => handleSearch(text, 'origin')}
                                onFocus={() => setActiveInput('origin')}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setActiveInput('destination')}
                            style={styles.view5}
                        >
                            <TextInput
                                ref={destinationInputRef}
                                style={styles.text10}
                                placeholder="Où allez-vous?"
                                value={userDestination.address}
                                onChangeText={(text) => handleSearch(text, 'destination')}
                                onFocus={() => setActiveInput('destination')}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {activeInput && (
                <View style={styles.suggestionsContainer}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.blue} />
                            <Text style={styles.loadingText}>Chargement des lieux...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredLocations}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.suggestionItem}
                                    onPress={() => handleSelectLocation(item, activeInput)}
                                >
                                    <Icon
                                        name="map-marker"
                                        type="material-community"
                                        color={colors.blue}
                                        size={24}
                                        style={{ marginRight: 10 }}
                                    />
                                    <Text style={styles.suggestionText}>
                                        {item.name} - {item.type}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            )}
            <MapComponent
                userOrigin={userOrigin}
                userDestination={userDestination}
                navigation={navigation}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: parameters.statusBarHeight
    },
    mapContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    map: {
        width: SCREEN_WIDTH,
        height: '100%'
    },
    suggestionsContainer: {
        flex: 1,
        backgroundColor: colors.white,
        paddingHorizontal: 10,
        zIndex: 5
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: colors.grey2
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.grey5
    },
    suggestionText: {
        fontSize: 16,
        color: colors.grey1
    },
    view1: {
        position: "absolute",
        top: 10,
        left: 12,
        height: 40,
        width: 40,
        backgroundColor: colors.white,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        zIndex: 10
    },
    view2: {
        backgroundColor: colors.white,
        zIndex: 4,
        paddingBottom: 10
    },
    view3: {
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 10,
        paddingVertical: 5
    },
    view4: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 20,
        justifyContent: "space-between"
    },
    view5: {
        backgroundColor: colors.grey6,
        height: 40,
        width: SCREEN_WIDTH - 90,
        justifyContent: "center",
        marginTop: 15
    },
    view6: {
        backgroundColor: colors.grey6,
        height: 40,
        width: SCREEN_WIDTH - 90,
        justifyContent: "center",
        marginTop: 10
    },
    text1: {
        marginLeft: 10,
        fontSize: 16,
        color: colors.grey1
    },
    image1: {
        height: 70,
        width: 30,
        marginRight: 20,
        marginTop: 10
    },
    text10: {
        marginLeft: 10,
        fontSize: 16,
        color: colors.grey2
    }
});
