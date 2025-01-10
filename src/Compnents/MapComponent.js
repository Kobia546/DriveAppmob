import React, { Component } from 'react';
import { Marker,Callout } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { View, Image, Text, Switch, TouchableOpacity, StyleSheet, TextInput, Platform, ScrollView } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { colors } from '../global/style';
import { mapStyle } from '../global/mapStyle';
import AcceptOrder from '../Screens/AcceptOrderScreen';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import { socketService } from '../../clientSocket';
import SearchingBottomSheet from '../../SearchingBottomSheet';

const GOOGLE_MAPS_APIKEY = 'AIzaSyBFu_n9UIVYrbGWhl88xzQM5gtPTUk1bm8';

const fetchLocationName = async (latitude, longitude) => {
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:10,${latitude},${longitude});out;`;
  
  try {
      const response = await fetch(overpassUrl);
      const data = await response.json();
      const name = data.elements[0]?.tags?.name || 'Inconnu';
      return name;
  } catch (error) {
      console.error("Erreur lors de la récupération du nom de lieu:", error);
      return 'Inconnu';
  }
};
const getTravelTime = async (origin, destination) => {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${GOOGLE_MAPS_APIKEY}`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data.status === 'OK') {
            const duration = data.rows[0].elements[0].duration.text;
            const distance = data.rows[0].elements[0].distance.text;
            console.log(duration)
            return { duration, distance };
        } else {
            throw new Error('Erreur lors de la récupération des informations de distance');
        }
    } catch (error) {
        console.error("Erreur lors de la requête à l'API Google Maps Distance Matrix:", error);
        return null;
    }
};
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';



export default class MapComponent extends Component {
    constructor(props) {
        super(props);
        this._map = React.createRef();
        this.state = {
            distance: 0,
            travelTime: '',
            isRoundTrip: false, // État pour le type de trajet
            isReserveLater: false,
            departureDate: null,
            returnDate: null,
            showDepartureDatePicker: false,
            showReturnDatePicker: false,
            isSearchingDrivers: false
            
        };
    }
    calculateDistance = (origin, destination) => {
        const toRadians = (value) => (value * Math.PI) / 180;

        const lat1 = origin.latitude;
        const lon1 = origin.longitude;
        const lat2 = destination.latitude;
        const lon2 = destination.longitude;

        const R = 6371; // Rayon de la Terre en kilomètres
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    }
   
    
    calculatePrice = (distance) => {
        const pricePerKm = 2000;
        return distance * pricePerKm * (this.state.isRoundTrip ? 2 : 1); // Multiplie par 2 si aller-retour
    }

    componentDidUpdate(prevProps) {
        const { userOrigin, userDestination } = this.props;

        if (userDestination && userDestination !== prevProps.userDestination) {
            this.setState({ destinationSelected: true });
        }

        if (
            userOrigin &&
            userDestination &&
            (userOrigin.latitude !== prevProps.userOrigin.latitude ||
                userDestination.latitude !== prevProps.userDestination.latitude)
        ) {
            const distance = this.calculateDistance(userOrigin, userDestination);
            this.setState({ distance });
            const price = this.calculatePrice(distance);
            console.log("Distance:", distance.toFixed(2), "km", "Price:", price.toFixed(2), "CFA");

            getTravelTime(`${userOrigin.latitude},${userOrigin.longitude}`, `${userDestination.latitude},${userDestination.longitude}`)
            .then(result => {
                if (result) {
                    this.setState({ travelTime: result.duration });
                }
            });
        }

        if (userOrigin && userDestination && userDestination.latitude !== null) {
            setTimeout(() => {
                this._map.current.fitToCoordinates(
                    [this.props.userOrigin, this.props.userDestination],
                    {
                        edgePadding: { top: 450, right: 50, left: 50, bottom: 350 },
                        animated: true,
                    }
                );
            }, 500);
        }
    }

    toggleSwitch = () => {
        this.setState({ isRoundTrip: !this.state.isRoundTrip });
    }
    handleContinue = async () => {
        const { userOrigin, userDestination } = this.props;
        const { distance, isRoundTrip } = this.state;
        const userId = auth.currentUser?.uid;
      
        if (!userId) {
          alert("Vous devez être connecté pour passer une commande.");
          return;
        }
      
        this.setState({ isSearchingDrivers: true });
      
        try {
          // Créer l'objet orderData
          const orderData = {
            userId,
            distance,
            isRoundTrip,
            pickupLocation:userOrigin,
            dropoffLocation: userDestination,
            price: this.calculatePrice(distance),
            status: 'pending',
            createdAt: new Date(),
            estimatedTime: this.state.travelTime
          };
      
          // Ajouter à Firestore
          const orderRef = await addDoc(collection(db, 'orders'), orderData);
          const orderDataWithId = { ...orderData, id: orderRef.id };
      
          // Vérifier la connexion socket
          if (!socketService.isConnected) {
            await socketService.connect();
          }
      
          // Envoyer la commande via socket
          await socketService.sendNewOrder(orderDataWithId);
          console.log('Commande envoyée avec succès');
          
          // Ici vous pouvez naviguer vers un écran de suivi
          
      
        } catch (error) {
          console.error("Erreur lors de l'envoi de la commande:", error);
          alert("Une erreur s'est produite lors de l'envoi de la commande.");
        } finally {
          this.setState({ isSearchingDrivers: false });
        }
      };
    getAllDriverTokens = async () => {
        const tokens = [];
        try {
            const driversSnapshot = await getDocs(collection(db, 'drivers'));

            if (driversSnapshot.empty) {
                console.log('Aucun chauffeur trouvé dans la collection drivers.');
                return tokens;
            }

            driversSnapshot.forEach((doc) => {
                const driverData = doc.data();
                if (driverData.token) {
                    tokens.push(driverData.token); // Récupérer le token
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des tokens des chauffeurs:', error);
        }
        return tokens;
    }

    
 
    // sendPushNotification = async (token, orderDetails) => {
    //     if (!token || typeof token !== 'string') {
    //         console.error("Aucun token valide disponible pour envoyer la notification.");
    //         return;
    //     }

    //     try {
    //         // Obtenir le nom de l'adresse de départ
           

    //         const message = {
    //             to: token,
    //             notification: {
    //                 title: 'Nouvelle course disponible!',
    //                 body: `Une nouvelle course vous attend à ${orderDetails.pickupLocation.address}.`
    //             },
    //             data: {
    //                 orderDetails: JSON.stringify(orderDetails),
    //                 type: 'NEW_ORDER'
    //             }
    //         };

    //         console.log("Données de la notification:", message);

    //         // Envoyer la notification via FCM
    //         await fetch('https://fcm.googleapis.com/fcm/send', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `key=${YOUR_FCM_SERVER_KEY}`
                    
    //             },
    //             body: JSON.stringify(message)
    //         });

    //         console.log("Notification envoyée avec succès");
    //     } catch (error) {
    //         console.error("Erreur lors de l'envoi de la notification:", error);
    //         throw error;
    //     }
    // };

    toggleReserveLater = () => {
        this.setState((prevState) => ({
            isReserveLater: !prevState.isReserveLater
        }));
    };

    setReturnDate = (event, selectedDate) => {
        const currentDate = selectedDate || this.state.returnDate;
        this.setState({ showReturnDatePicker: Platform.OS === 'ios', returnDate: currentDate });
    };

    toggleDepartureDatePicker = () => {
        this.setState({ showDepartureDatePicker: true });
    };

    toggleReturnDatePicker = () => {
        this.setState({ showReturnDatePicker: true });
    };

    setDepartureDate = (event, selectedDate) => {
        const currentDate = selectedDate || this.state.departureDate;
        this.setState({ showDepartureDatePicker: Platform.OS === 'ios', departureDate: currentDate });
    };

    render() {
        const { userOrigin, userDestination } = this.props;
        const { distance, isRoundTrip, isReserveLater, departureDate, returnDate, showDepartureDatePicker, showReturnDatePicker,destinationSelected, travelTime   } = this.state;
        const price = this.calculatePrice(distance);

        return (
            <View style={{ flex: 1 }}>
                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={{ height: '98%', width: '95%',margin:10 }}
                    customMapStyle={mapStyle}
                    ref={this._map}
                >
                    {userOrigin && userOrigin.latitude !== null && (
                        <Marker coordinate={userOrigin} anchor={{ x: 0.5, y: 0.5 }}>
                            <Image
                                source={require('../../assets/position.png')}
                                style={{ height: 35, width: 35 }}
                                resizeMode="cover"
                            />
                        </Marker>
                    )}
                    {userDestination && userDestination.latitude !== null && (
                        <Marker coordinate={userDestination} anchor={{ x: 0.5, y: 0.5 }}>
                            <Image
                                source={require('../../assets/checkered-flag.png')}
                                style={{ height: 35, width: 35 }}
                                resizeMode="cover"
                            />
                              
                                <View style={styles.callout}>
                                    <Text style={styles.calloutText}>Durée: {travelTime}</Text>
                                </View>
                            
                        </Marker>
                    )} 

                    {userOrigin && userDestination && (
                        <MapViewDirections
                            origin={userOrigin}
                            destination={userDestination}
                            apikey={'AIzaSyBFu_n9UIVYrbGWhl88xzQM5gtPTUk1bm8'}
                           
                                     
                                    
                                    
                            strokeWidth={4}
                            strokeColor={colors.now}
                        />
                    )}
                </MapView>

                {destinationSelected && userDestination && userDestination.latitude !== null &&(
                    <View style={styles.bottomSheetContainer}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.bottomSheetHeader}>
                                <View style={styles.bottomSheetIndicator} />
                                <Text style={styles.bottomSheetTitle}>Détails du trajet</Text>
                            </View>

                            <View style={styles.switchContainer}>
                                <TouchableOpacity
                                    style={[styles.switchButton, !isRoundTrip ? styles.switchButtonActive : styles.switchButtonInactive]}
                                    onPress={() => this.setState({ isRoundTrip: false })}
                                >
                                    <Text style={!isRoundTrip ? styles.switchButtonTextActive : styles.switchButtonTextInactive}>
                                        Aller simple
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.switchButton, isRoundTrip ? styles.switchButtonActive : styles.switchButtonInactive]}
                                    onPress={() => this.setState({ isRoundTrip: true })}
                                >
                                    <Text style={isRoundTrip ? styles.switchButtonTextActive : styles.switchButtonTextInactive}>
                                        Aller-retour
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.detailsContainer}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Distance</Text>
                                    <Text style={styles.detailValue}>{distance.toFixed(2)} km</Text>
                                </View>

                                <View style={styles.detailItem}>
                                    <Text style={{ fontSize: 14, color: '#666', marginLeft: 200 }}>Prix</Text>
                                    <Text style={styles.priceValue}>{price.toFixed(0)}F </Text>
                                </View>
                            </View>

                            {isReserveLater && (
                                <View style={styles.dateContainer}>
                                    <TouchableOpacity
                                        style={styles.dateInput}
                                        onPress={this.toggleDepartureDatePicker}
                                    >
                                        <Text style={styles.dateLabel}>Date de départ</Text>
                                        <Text style={styles.dateValue}>
                                            {departureDate ? departureDate.toLocaleDateString() : 'Sélectionner'}
                                        </Text>
                                    </TouchableOpacity>

                                    {isRoundTrip && (
                                        <TouchableOpacity
                                            style={styles.dateInput}
                                            onPress={this.toggleReturnDatePicker}
                                        >
                                            <Text style={styles.dateLabel}>Date de retour</Text>
                                            <Text style={styles.dateValue}>
                                                {returnDate ? returnDate.toLocaleDateString() : 'Sélectionner'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            <TouchableOpacity style={styles.continueButton} onPress={this.handleContinue}>
                                <Text style={styles.continueButtonText}>Continuer</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.reserveLaterButton} onPress={this.toggleReserveLater}>
                                <Text style={styles.reserveLaterButtonText}>
                                    {isReserveLater ? 'Réserver maintenant' : 'Réserver plus tard'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}

                {showDepartureDatePicker && (
                    <DateTimePicker
                        value={departureDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={this.setDepartureDate}
                    />
                )}

                {showReturnDatePicker && (
                    <DateTimePicker
                        value={returnDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={this.setReturnDate}
                    />
                )}
                <SearchingBottomSheet
    isVisible={this.state.isSearchingDrivers}
    origin={userOrigin.address}
    destination={userDestination.address}
/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    map: {
        height: "100%",
        width: "100%"
    },

    markerWrapOrigin: {
        //  alignItems: "center",
        // justifyContent: "center",
        width: 40,
        height: 20,
        // marginTop:0
    },
    markerOrigin: {
        width: 16,
        height: 16,
        borderRadius: 8
    },

    destination: {
        width: 20,
        height: 20,
        backgroundColor: colors.black,
        alignItems: "center",
        justifyContent: "center"
    },

    view1: {
        width: 7,
        height: 7,
        backgroundColor: colors.white
    },

    markerDestination: {
        width: 16,
        height: 16,

    },
    reserveLaterButton: {
        backgroundColor: colors.black,
        padding: 10,
        marginVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    dateInput: {
        borderWidth: 1,
        borderColor: colors.black,
        padding: 10,
        marginVertical: 5,
        borderRadius: 5,
    },
    callout: {
        backgroundColor: 'white',
        borderRadius: 5,
        padding: 2,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    calloutText: {
        fontSize: 10,
        color: 'black',
    },

    markerOrigin2: {
        width: 20,
        height: 20,
        borderRadius: 10
    },

    car: {
        paddingTop: 0,
        width: 40,
        height: 20,
    },

    view2: {
        position: "absolute",
        top: 10,
        right: 12,
        backgroundColor: colors.white,
        height: 40,
        width: 180,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 2,
        zIndex: 8

    },

    view3: { flexDirection: "row",
        alignItems: "center",

        paddingVertical: 2,

    },

    view4: {
        position: "absolute",
        top: 50,
        left: 12,
        backgroundColor: colors.white,
        height: 40,
        width: 140,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 2,
        zIndex: 8

    },

    location: {
        width: 20,
        height: 20,
        borderRadius: 9,
        backgroundColor: colors.black,
        alignItems: "center",
        justifyContent: "center"

    },
    bottomSheetContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        height: 320, // Hauteur du BottomSheet
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 5,
    },
    bottomSheetTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    switchButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
        marginHorizontal: 5,
    },
    bottomSheetContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingHorizontal: 20,
        paddingBottom: 30,
        maxHeight: '70%',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },

    bottomSheetHeader: {
        alignItems: 'center',
        paddingVertical: 15,
    },

    bottomSheetIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#DEDEDE',
        borderRadius: 2,
        marginBottom: 10,
    },

    bottomSheetTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 20,
    },

    switchContainer: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },

    switchButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        margin: 10,
    },

    switchButtonActive: {
        backgroundColor: colors.black,
    },

    switchButtonInactive: {
        backgroundColor: 'transparent',
    },

    switchButtonTextActive: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },

    switchButtonTextInactive: {
        color: '#666',
        fontWeight: '600',
        fontSize: 16,
    },

    detailsContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        flexDirection: 'row',

    },

    detailItem: {
        marginBottom: 15,
        margin: 1,
    },

    detailLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        marginLeft: 1,
    },

    detailValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
    },

    priceValue: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.blue,
        marginLeft: 160,
    },

    dateContainer: {
        marginBottom: 20,
    },

    dateInput: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },

    dateLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },

    dateValue: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },

    continueButton: {
        backgroundColor: colors.blue,
        
        borderRadius: 12,
        alignItems: 'center',
      margin:10,

    },

    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',

    },

    reserveLaterButton: {
        backgroundColor: colors.black,
        padding:10,
        marginTop:10,
       
        borderRadius: 12,
        alignItems: 'center',
       

        
    },

    reserveLaterButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    switchButtonActive: {
        backgroundColor: colors.black,
    },
    switchButtonInactive: {
        backgroundColor: colors.blue,
    },
    switchButtonTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    switchButtonTextInactive: {
        color: 'white',
        fontWeight: 'bold',
    },
    continueButton: {
        backgroundColor: colors.blue,
        marginTop: 10,
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
    },

    view9: { width: 6,
        height: 6,
        borderRadius: 4,
        backgroundColor: "white"
    }
})