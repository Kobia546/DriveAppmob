import React, { useState, useContext, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image, TextInput, FlatList, ActivityIndicator, StatusBar, Animated, Modal } from "react-native";
import { Icon } from 'react-native-elements';
import { colors, parameters } from '../global/style';
import MapComponent from "../Compnents/MapComponent";
import { db, auth } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { OriginContext, DestinationContext } from '../Contexts/contexts';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { socketService } from '../../clientSocket';
import SearchingBottomSheet from '../../SearchingBottomSheet';



const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GOOGLE_MAPS_APIKEY = 'AIzaSyBFu_n9UIVYrbGWhl88xzQM5gtPTUk1bm8';

export default function RequestScreen({ navigation }) {
    const { origin, dispatchOrigin } = useContext(OriginContext);
    const { destination, dispatchDestination } = useContext(DestinationContext);

    const [activeInput, setActiveInput] = useState(null);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filteredLocations, setFilteredLocations] = useState([]);
    const [acceptedOrder, setAcceptedOrder] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [showAcceptanceNotification, setShowAcceptanceNotification] = useState(false);
    const [acceptedOrderInfo, setAcceptedOrderInfo] = useState(null);

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

    const initialRegion = {
        latitude: 5.3600,
        longitude: -4.0083,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
    };

    const originInputRef = useRef(null);
    const destinationInputRef = useRef(null);

    const fetchAbidjanLocations = async () => {
        setLoading(true);
        const googlePlacesUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

        try {
            const response = await axios.get(googlePlacesUrl, {
                params: {
                    location: '5.3600,-4.0083',
                    radius: 10000,
                    type: [
                        'restaurant',
                        'hotel',
                        'school',
                        'hospital',
                        'shopping_mall',
                        'bank',
                        'gas_station',
                        'point_of_interest'
                    ].join('|'),
                    key: GOOGLE_MAPS_APIKEY
                }
            });

            const allData = response.data.results.map((location) => ({
                id: location.place_id,
                name: location.name,
                type: location.types[0] || 'Lieu',
                lat: location.geometry.location.lat,
                lon: location.geometry.location.lng,
            }));

            setLocations(allData);
        } catch (error) {
            console.error("Erreur lors de la récupération des lieux:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            
            const setupSocket = async () => {
                try {
                    await socketService.connect();
                    
                    // Supprimer l'ancien listener pour éviter les doublons
                    socketService.socket.off('order:accepted');
                    
                    // Ajouter le nouveau listener
                    socketService.socket.on('order:accepted', (data) => {
                        console.log('Commande acceptée, données reçues:', data);
                        if (data.clientId === userId) {
                            setAcceptedOrderInfo({
                                driverName: data.driverInfo.driverName,
                                driverPhone: data.driverInfo.driverPhone,
                                driverId: data.driverInfo.driverId,
                                orderId: data.orderId
                            });
                            setShowAcceptanceNotification(true);
                        }
                    });
                } catch (error) {
                    console.error('Erreur connexion socket:', error);
                }
            };
    
            setupSocket();
    
            return () => {
                if (socketService.socket) {
                    socketService.socket.off('order:accepted');
                }
            };
        }
    }, []);
    
    // Ajouter la fonction de fermeture de notification
    const handleCloseNotification = () => {
        setShowAcceptanceNotification(false);
        setAcceptedOrderInfo(null);
    };

    useEffect(() => {
        fetchAbidjanLocations();
    }, []);

    const fetchPlaceDetails = async (placeId) => {
        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
                params: {
                    place_id: placeId,
                    key: GOOGLE_MAPS_APIKEY,
                    fields: 'geometry,name,formatted_address,types'
                }
            });

            const result = response.data.result;
            return {
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
                address: result.formatted_address || result.name,
                name: result.name,
                type: result.types[0] || 'Lieu'
            };
        } catch (error) {
            console.error("Erreur lors de la récupération des détails du lieu:", error);
            return null;
        }
    };

    const searchPlacesAutocomplete = async (query) => {
        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
                params: {
                    input: query,
                    location: '5.3600,-4.0083', // Coordonnées d'Abidjan
                    radius: 10000, // Rayon de recherche en mètres
                    key: GOOGLE_MAPS_APIKEY,
                    language: 'fr' // Pour obtenir les résultats en français
                }
            });

            const suggestions = response.data.predictions.map(prediction => ({
                id: prediction.place_id,
                name: prediction.description,
                type: 'Suggestion'
            }));

            setFilteredLocations(suggestions);
        } catch (error) {
            console.error("Erreur lors de la recherche de lieux:", error);
        }
    };

    useEffect(() => {
        fetchAbidjanLocations();
    }, []);

    const handleSearch = (text, type) => {
        if (text.length > 1) {
            searchPlacesAutocomplete(text);
        } else {
            setFilteredLocations([]);
        }

        if (type === 'origin') {
            setUserOrigin(prev => ({ ...prev, address: text }));
        } else {
            setUserDestination(prev => ({ ...prev, address: text }));
        }
    };

    const handleSelectLocation = async (item, type) => {
        setLoading(true);
        try {
            const placeDetails = await fetchPlaceDetails(item.id);

            if (placeDetails) {
                const mappedItem = {
                    latitude: placeDetails.latitude,
                    longitude: placeDetails.longitude,
                    address: placeDetails.address,
                };

                if (type === 'origin') {
                    setUserOrigin(mappedItem);
                    dispatchOrigin({
                        type: 'ADD_ORIGIN',
                        payload: {
                            ...mappedItem,
                            type: placeDetails.type,
                            name: placeDetails.name
                        },
                    });
                } else {
                    setUserDestination(mappedItem);
                    dispatchDestination({
                        type: 'ADD_DESTINATION',
                        payload: {
                            ...mappedItem,
                            type: placeDetails.type,
                            name: placeDetails.name
                        },
                    });
                }
            }
        } catch (error) {
            console.error("Erreur lors de la sélection du lieu:", error);
        } finally {
            setActiveInput(null);
            setFilteredLocations([]);
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                style={styles.headerContainer}
            >
                <Text style={styles.headerTitle}>Réservation de course</Text>

                <BlurView intensity={80} tint="light" style={styles.searchContainer}>
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputIconContainer}>
                            <Image
                                style={styles.transitIcon}
                                source={require("../../assets/transit.png")}
                            />
                            <View style={styles.verticalLine} />
                        </View>

                        <View style={styles.inputsContainer}>
                            <TouchableOpacity
                                onPress={() => setActiveInput('origin')}
                                style={styles.inputContainer}
                            >
                                <Icon
                                    name="circle"
                                    type="material-community"
                                    size={12}
                                    color={colors.blue}
                                />
                                <TextInput
                                    ref={originInputRef}
                                    style={styles.input}
                                    placeholder="Point de départ"
                                    placeholderTextColor="#666"
                                    value={userOrigin.address}
                                    onChangeText={(text) => handleSearch(text, 'origin')}
                                    onFocus={() => setActiveInput('origin')}
                                />
                            </TouchableOpacity>

                            <View style={styles.inputDivider} />

                            <TouchableOpacity
                                onPress={() => setActiveInput('destination')}
                                style={styles.inputContainer}
                            >
                                <Icon
                                    name="map-marker"
                                    type="material-community"
                                    size={12}
                                    color="#FF385C"
                                />
                                <TextInput
                                    ref={destinationInputRef}
                                    style={styles.input}
                                    placeholder="Destination"
                                    placeholderTextColor="#666"
                                    value={userDestination.address}
                                    onChangeText={(text) => handleSearch(text, 'destination')}
                                    onFocus={() => setActiveInput('destination')}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </LinearGradient>

            {activeInput && (
                <BlurView intensity={95} tint="light" style={styles.suggestionsContainer}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.blue} />
                            <Text style={styles.loadingText}>Recherche des lieux...</Text>
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
                                    <View style={styles.suggestionIconContainer}>
                                        <Icon
                                            name="map-marker"
                                            type="material-community"
                                            color={colors.blue}
                                            size={24}
                                        />
                                    </View>
                                    <View style={styles.suggestionTextContainer}>
                                        <Text style={styles.suggestionMainText}>{item.name}</Text>
                                        <Text style={styles.suggestionSubText}>{item.type}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </BlurView>
            )}

            <MapComponent
                userOrigin={userOrigin}
                userDestination={userDestination}
                navigation={navigation}
            />

            {/* <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Course acceptée!</Text>
                        <Text style={styles.modalText}>
                            Votre chauffeur {acceptedOrder?.driverName} arrive bientôt.
                            {'\n'}Téléphone: {acceptedOrder?.driverPhone}
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                setModalVisible(!modalVisible);
                                navigation.navigate('OrderTracking', { orderDetails: acceptedOrder });
                            }}
                        >
                            <Text style={styles.modalButtonText}>Voir les détails</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal> */}
          
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        paddingTop: parameters.statusBarHeight + 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        zIndex: 100,
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
    suggestionText: {
        fontSize: 16,
        color: colors.grey1
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    searchContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    inputIconContainer: {
        alignItems: 'center',
        marginRight: 15,
    },
    transitIcon: {
        height: 50,
        width: 20,
        marginBottom: 5,
    },
    verticalLine: {
        flex: 1,
        width: 1,
        backgroundColor: colors.grey4,
    },
    inputsContainer: {
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        padding: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    inputDivider: {
        height: 1,
        backgroundColor: colors.grey5,
        marginVertical: 8,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: parameters.statusBarHeight + 180,
        left: 20,
        right: 20,
        maxHeight: SCREEN_HEIGHT * 0.4,
        borderRadius: 16,
        zIndex: 99,
        overflow: 'hidden',
    },
    banner: {
        backgroundColor: colors.success,
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    bannerText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(200,200,200,0.3)',
    },
    suggestionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(100,150,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    suggestionMainText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    suggestionSubText: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    view1: {
        position: "absolute",
        top: 30,
        left: 12,
        height: 40,
        width: 40,
        backgroundColor: colors.white,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 19,
        zIndex: 10
    },
    view2: {
        backgroundColor: colors.white,
        zIndex: 4,
        paddingBottom: 10,
    },
    view3: {
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 10,
        paddingVertical: 18,
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
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      },
      modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%'
      },
      modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center'
      },
      modalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 24
      },
      modalButton: {
        backgroundColor: colors.blue,
        borderRadius: 10,
        padding: 15,
        elevation: 2,
        width: '100%'
      },
      modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16
      }
});