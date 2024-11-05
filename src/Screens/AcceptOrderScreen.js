import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../global/style'; 
import { auth } from '../../firebaseConfig';
import { doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { updateDoc } from 'firebase/firestore';
import {  getDoc  } from 'firebase/firestore';


const AcceptOrderScreen = ({ route, navigation }) => {
    const { orderDetails } = route.params;
    const [pickupLocationName, setPickupLocationName] = useState('');
    const [dropoffLocationName, setDropoffLocationName] = useState('');

    
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
    const getUserPushToken = async (uid) => {
        const userDocRef = doc(db, 'users', uid);  // Assurez-vous que 'users' est la bonne collection
        const userDoc = await getDoc(userDocRef);
      
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.token;  // Assurez-vous que le token est bien stocké sous 'token'
        } else {
            console.warn("Utilisateur non trouvé !");
            return null;
        }
    };
    

   
    useEffect(() => {
        const getLocationNames = async () => {
            const pickupName = await fetchLocationName(orderDetails.pickupLocation.latitude, orderDetails.pickupLocation.longitude);
            const dropoffName = await fetchLocationName(orderDetails.dropoffLocation.latitude, orderDetails.dropoffLocation.longitude);
            setPickupLocationName(pickupName);
            setDropoffLocationName(dropoffName);
        };

        getLocationNames();
    }, [orderDetails]);
    const handleAccept = async () => {
        const { orderDetails } = route.params;
        const driverId = auth.currentUser ? auth.currentUser.uid : null;

        if (!driverId) {
            alert("Vous devez être connecté pour accepter une course.");
            return;
        }

        try {
            const orderDocRef = doc(db, 'orders', orderDetails.id);
            await updateDoc(orderDocRef, {
                status: 'accepted',
                driverId: driverId,
                acceptedAt: new Date(),
            });

            console.log("Commande mise à jour avec succès");

            sendNotificationToClient(orderDetails.userId, driverId);

          
     

            navigation.navigate("MapScreen", { orderDetails });

        } catch (error) {
            console.error("Erreur lors de la mise à jour de la commande:", error);
            alert("Une erreur s'est produite lors de la mise à jour de la commande.");
        }
    };

    const sendNotificationToClient = async (clientId, driverId) => {
        const clientToken = await getUserPushToken(clientId);
        const driverData = await getDoc(doc(db, 'drivers', driverId));
    
        if (clientToken && driverData.exists()) {
            const { name, phone } = driverData.data();  
            sendNotification(
                clientToken,
                'Commande acceptée !',
                message
            );
        } else {
            console.warn("Impossible de récupérer les informations du client ou du chauffeur.");
        }
    };
    
    const sendNotification = async (token, title, body) => {
        const message = {
            to: token,
            notification: {
                title: title,
                body: body,
            },
        };
    
        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });
    
            const data = await response.json();
            if (response.ok) {
                console.log("Notification envoyée au client avec succès:", data);
            } else {
                console.error("Erreur lors de l'envoi de la notification:", data);
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi de la notification:", error.message);
        }
    };

    const handleReject = () => {
        navigation.goBack();
    };

    return(
        <View style={styles.container}>
            <Text style={styles.title}>Détails de la course</Text>
           
            <View style={styles.detailsContainer}>
            <Text style={styles.detailText}> Départ : {pickupLocationName || 'Chargement...'} </Text>
            <Text style={styles.detailText}> Destination :  {dropoffLocationName|| 'Chargement...'} </Text>
            <Text style={styles.detailText}>Distance : {orderDetails.distance} km     </Text>
            <Text style={styles.detailText}>Prix : {orderDetails.price} CFA      </Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.buttonAccept} onPress={handleAccept}>
                    <Text style={styles.buttonText}>Accepter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonReject} onPress={handleReject}>
                    <Text style={styles.buttonText}>Refuser</Text>
                </TouchableOpacity>
            </View>
        </View>
         
        );   
    
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: colors.primary, 
    },
    detailsContainer: {
        backgroundColor: colors.lightGray, 
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 20,
        width: '100%',
    },
    detailText: {
        fontSize: 18,
        marginVertical: 5,
        color: colors.darkGray, // Couleur pour le texte des détails
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    buttonAccept: {
        flex: 1,
        backgroundColor: colors.success, // Couleur pour le bouton Accepter
        padding: 15,
        borderRadius: 10,
        backgroundColor:'blue',
        alignItems: 'center',
        marginRight: 10,
    },
    buttonReject: {
        flex: 1,
        backgroundColor: 'red',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginLeft: 10,
    },
    buttonText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AcceptOrderScreen;
