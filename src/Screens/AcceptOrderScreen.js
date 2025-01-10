import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../global/style';
import { auth, db } from '../../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { socketService } from '../../clientSocket';

const AcceptOrderScreen = ({ route, navigation }) => {
    const { orderDetails } = route.params;
    const [pickupLocationName, setPickupLocationName] = useState('');
    const [dropoffLocationName, setDropoffLocationName] = useState('');
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [clientName, setClientName] = useState('');

    const fetchDriverName = async () => {
        try {
            const userId = auth.currentUser.uid;
            const driverDocRef = doc(db, 'drivers', userId);
            const driverDoc = await getDoc(driverDocRef);

            if (driverDoc.exists()) {
                setDriverName(driverDoc.data().name);
                setDriverPhone(driverDoc.data().phone);
            }
        } catch (error) {
            console.error('Error fetching driver name and phone:', error);
        }
    };

    const fetchClientName = async () => {
        try {
            const clientDocRef = doc(db, 'users', orderDetails.userId);
            const clientDoc = await getDoc(clientDocRef);

            if (clientDoc.exists()) {
                setClientName(clientDoc.data().username);
            }
        } catch (error) {
            console.error('Error fetching client name:', error);
        }
    };

    useEffect(() => {
        fetchDriverName();
        fetchClientName();
    }, []);

    useEffect(() => {
        console.log('driverName:', driverName);
        console.log('driverPhone:', driverPhone);
    }, [driverName, driverPhone]);

    const handleAccept = async () => {
        console.log('handleAccept called', orderDetails);
        const driverId = auth.currentUser?.uid;

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
                driverName: driverName,
                driverPhone: driverPhone,
            });
            console.log('Order updated successfully');

            if (!socketService.socket?.connected) {
                await socketService.connect();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const acceptanceData = {
                orderId: orderDetails.id,
                driverId: driverId,
                clientId: orderDetails.userId,
                driverInfo: {
                    driverName,
                    driverPhone,
                    driverId,
                },
                orderDetails: {
                    pickupLocation: orderDetails.pickupLocation,
                    dropoffLocation: orderDetails.dropoffLocation,
                    price: orderDetails.price,
                    distance: orderDetails.distance
                }
            };

            socketService.socket.emit('order:accept', acceptanceData);
            console.log('Order acceptance emitted via socket:', acceptanceData);
            navigation.navigate("MapScreen", { orderDetails: { ...orderDetails, driverInfo: acceptanceData.driverInfo } });

            socketService.socket.once('order:accept:confirmed', (response) => {
                console.log('Server confirmed order acceptance:', response);
            });

        } catch (error) {
            console.error("Erreur lors de la mise à jour de la commande:", error);
            alert("Une erreur s'est produite lors de la mise à jour de la commande.");
        }
    };

    useEffect(() => {
        if (auth.currentUser) {
            const userId = auth.currentUser.uid;

            const setupSocketConnection = async () => {
                try {
                    await socketService.connect();

                    socketService.socket.off('order:accepted');

                    socketService.socket.on('order:accepted', (data) => {
                        console.log('Commande acceptée, données reçues:', data);
                        if (data.clientId === userId) {
                            setAcceptedOrderInfo({
                                driverName: data.driverInfo.driverName,
                                driverPhone: data.driverInfo.driverPhone,
                                driverId: data.driverInfo.driverId,
                                orderId: data.orderId,
                                orderDetails: data.orderDetails
                            });
                            setShowAcceptanceNotification(true);
                        }
                    });
                } catch (error) {
                    console.error('Erreur lors de la configuration du socket:', error);
                }
            };

            setupSocketConnection();

            return () => {
                if (socketService.socket) {
                    socketService.socket.off('order:accepted');
                    socketService.disconnect();
                }
            };
        }
    }, []);

    const handleReject = () => {
        navigation.goBack();
    };

 
    return (
        <View style={styles.container}>
            {/* Client Circle */}
            <View style={styles.circleContainer}>
                <View style={styles.circle} />
                <Text style={styles.usernameText}>{clientName || 'Client'}</Text>
            </View>

            {/* Modern Card */}
            <View style={styles.card}>
                {/* Starting Point */}
                <View style={styles.locationSection}>
                    <View style={styles.dotContainer}>
                        <View style={[styles.dot, styles.greenDot]} />
                        <View style={styles.verticalLine} />
                    </View>
                    <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>DÉPART</Text>
                        <Text style={styles.locationText} numberOfLines={2}>
                            {orderDetails.pickupLocation.address || 'Chargement...'}
                        </Text>
                    </View>
                </View>

                {/* Destination */}
                <View style={styles.locationSection}>
                    <View style={styles.dotContainer}>
                        <View style={[styles.dot, styles.redDot]} />
                    </View>
                    <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>ARRIVÉE</Text>
                        <Text style={styles.locationText} numberOfLines={2}>
                            {orderDetails.dropoffLocation.address || 'Chargement...'}
                        </Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Price Section */}
                <View style={styles.priceSection}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Prix de la course</Text>
                        <Text style={styles.priceText}>{orderDetails.price.toFixed(0)} CFA</Text>
                    </View>
                </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={styles.acceptButton} 
                    onPress={handleAccept}
                >
                    <Text style={styles.buttonText}>ACCEPTER</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.rejectButton} 
                    onPress={handleReject}
                >
                    <Text style={styles.buttonText}>REFUSER</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        padding: 20,
    },
    circleContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    circle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E0E0E0',
        marginBottom: 10,
    },
    usernameText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginVertical: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    locationSection: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    dotContainer: {
        width: 20,
        alignItems: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    greenDot: {
        backgroundColor: '#4CAF50',
    },
    redDot: {
        backgroundColor: '#F44336',
    },
    verticalLine: {
        width: 2,
        height: '100%',
        backgroundColor: '#E0E0E0',
        position: 'absolute',
        top: 15,
        left: 5,
    },
    locationInfo: {
        flex: 1,
        marginLeft: 15,
    },
    locationLabel: {
        fontSize: 12,
        color: '#9E9E9E',
        marginBottom: 4,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    locationText: {
        fontSize: 16,
        color: '#333333',
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEEEEE',
        marginVertical: 15,
    },
    priceSection: {
        marginTop: 10,
    },
    priceContainer: {
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 14,
        color: '#9E9E9E',
        marginBottom: 8,
        fontWeight: '500',
    },
    priceText: {
        fontSize: 24,
        color: '#2196F3',
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
    },
    acceptButton: {
        flex: 1,
        backgroundColor: '#4CAF50',
        padding: 18,
        borderRadius: 12,
        marginRight: 10,
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    rejectButton: {
        flex: 1,
        backgroundColor: '#F44336',
        padding: 18,
        borderRadius: 12,
        marginLeft: 10,
        alignItems: 'center',
        shadowColor: '#F44336',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AcceptOrderScreen;