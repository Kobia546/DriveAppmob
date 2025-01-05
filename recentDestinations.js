import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Icon } from 'react-native-elements';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { colors } from './src/global/style';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RecentDestinations = () => {
    const [recentDestinations, setRecentDestinations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentDestinations();
    }, []);

    const fetchRecentDestinations = async () => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) return;

            const ordersRef = collection(db, 'orders');
            const q = query(
                ordersRef,
                where('userId', '==', userId),
                orderBy('acceptedAt', 'desc'),
                limit(3)
            );

            const querySnapshot = await getDocs(q);
            const destinations = querySnapshot.docs.map(doc => ({
                id: doc.id,
                pickup: doc.data().pickupLocation.address,
                dropoff: doc.data().dropoffLocation.address,
                price: doc.data().price,
                distance: doc.data().distance,
                date: doc.data().acceptedAt?.toDate(),
                status: doc.data().status
            }));

            setRecentDestinations(destinations);
        } catch (error) {
            console.error('Error fetching destinations:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return `${Math.round(price).toLocaleString('fr-FR')} CFA`;
    };

    const formatDistance = (distance) => {
        return `${distance.toFixed(1)} km`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#4CAF50';
            case 'accepted': return '#2196F3';
            case 'cancelled': return '#F44336';
            default: return '#FFA000';
        }
    };

    const renderDestination = ({ item, index }) => (
        <TouchableOpacity
            style={[styles.destinationCard, { marginBottom: index === recentDestinations.length - 1 ? 0 : 15 }]}
            activeOpacity={0.7}
        >
            {/* Date */}
            <Text style={styles.dateText}>
                {item.date ? format(item.date, "d MMMM yyyy 'à' HH:mm", { locale: fr }) : ''}
            </Text>

            {/* Trajet */}
            <View style={styles.routeContainer}>
                <View style={styles.locationPoints}>
                    <View style={styles.pointLine}>
                        <View style={[styles.dot, styles.greenDot]} />
                        <View style={styles.line} />
                        <View style={[styles.dot, styles.redDot]} />
                    </View>
                </View>
                
                <View style={styles.addressContainer}>
                    <Text style={styles.addressText} numberOfLines={1}>{item.pickup}</Text>
                    <Text style={styles.addressText} numberOfLines={1}>{item.dropoff}</Text>
                </View>
            </View>

            {/* Détails */}
            <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                    <Icon type="material-community" name="map-marker-distance" size={16} color={colors.grey3} />
                    <Text style={styles.detailText}>{formatDistance(item.distance)}</Text>
                </View>

                <View style={styles.detailItem}>
                    <Icon type="material-community" name="cash" size={16} color={colors.grey3} />
                    <Text style={styles.detailText}>{formatPrice(item.price)}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.blue} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Destinations récentes</Text>
            {recentDestinations.length > 0 ? (
                <FlatList
                    data={recentDestinations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDestination}
                    contentContainerStyle={styles.destinationList}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Icon
                        type="material-community"
                        name="map-marker-off"
                        color={colors.grey3}
                        size={48}
                    />
                    <Text style={styles.emptyText}>Aucune destination récente</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginLeft: 20,
        marginTop: 20,
        marginBottom: 20,
        color: colors.black,
    },
    destinationList: {
        paddingHorizontal: 20,
    },
    destinationCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    dateText: {
        fontSize: 12,
        color: colors.grey3,
        marginBottom: 12,
    },
    routeContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    locationPoints: {
        width: 20,
        marginRight: 12,
    },
    pointLine: {
        height: 40,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: '#E0E0E0',
        position: 'absolute',
        top: 8,
        bottom: 8,
        left: 3,
    },
    greenDot: {
        backgroundColor: '#4CAF50',
    },
    redDot: {
        backgroundColor: '#F44336',
    },
    addressContainer: {
        flex: 1,
        justifyContent: 'space-between',
        height: 40,
    },
    addressText: {
        fontSize: 14,
        color: colors.black,
    },
    detailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        marginLeft: 4,
        fontSize: 13,
        color: colors.grey3,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: colors.grey3,
        marginTop: 12,
    },
});

export default RecentDestinations;