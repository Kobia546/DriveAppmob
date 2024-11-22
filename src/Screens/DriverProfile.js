import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, Platform, Dimensions } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

 
const getDriverLevel = (totalRides) => {
    if (totalRides < 10) return { title: 'Débutant', color: '#4CAF50' };
    if (totalRides < 50) return { title: 'Novice', color: '#2196F3' };
    if (totalRides < 100) return { title: 'Intermédiaire', color: '#9C27B0' };
    if (totalRides < 200) return { title: 'Avancé', color: '#FF9800' };
    return { title: 'Expert', color: '#F44336' };
};


const calculateRating = (completedRides, totalRides, completionRate) => {
    let baseRating = 3.0;
    
   
    const ridesBonus = Math.min(completedRides / 100, 1) * 0.5;
    
    const completionBonus = (completionRate - 80) / 20 * 0.5;
    
    
    return Math.min(Math.round((baseRating + ridesBonus + completionBonus) * 10) / 10, 5.0);
};

const StatCard = ({ icon, label, value, gradient }) => (
    <LinearGradient
        colors={gradient}
        style={styles.statCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
    >
        <View style={styles.statIconContainer}>
            {icon}
        </View>
        <View style={styles.statContent}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    </LinearGradient>
);

const RatingStars = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
        <View style={styles.starsContainer}>
            {[...Array(5)].map((_, index) => (
                <FontAwesome5
                    key={index}
                    name={index < fullStars ? "star" : (hasHalfStar && index === fullStars ? "star-half-alt" : "star")}
                    size={16}
                    color={index < fullStars || (hasHalfStar && index === fullStars) ? "#FFD700" : "#D3D3D3"}
                    solid={index < fullStars}
                    style={{ marginRight: 2 }}
                />
            ))}
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
    );
};

const Achievement = ({ icon, title, description, color }) => (
    <View style={[styles.achievementCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
        <View style={styles.achievementHeader}>
            {icon}
            <Text style={[styles.achievementTitle, { color }]}>{title}</Text>
        </View>
        <Text style={styles.achievementDescription}>{description}</Text>
    </View>
);

const DriverProfile = () => {
    const [profileData, setProfileData] = useState({
        driverName: '',
        totalRides: 0,
        completedRides: 0,
        totalEarnings: 0,
        rating: 3.0,
        completionRate: 0
    });

    useEffect(() => {
        fetchDriverStats();
    }, []);

    const fetchDriverStats = async () => {
        try {
            const userId = auth.currentUser.uid;
            const ordersRef = collection(db, 'orders');
            
            // Requête pour toutes les commandes
            const allOrdersQuery = query(ordersRef, where('driverId', '==', userId));
            const allOrdersSnapshot = await getDocs(allOrdersQuery);
            
            // Requête pour les commandes complétées
            const completedOrdersQuery = query(
                ordersRef,
                where('driverId', '==', userId),
                where('status', '==', 'accepted')
            );
            const completedOrdersSnapshot = await getDocs(completedOrdersQuery);

            const totalRides = allOrdersSnapshot.size;
            const completedRides = completedOrdersSnapshot.size;
            const completionRate = totalRides > 0 ? (completedRides / totalRides) * 100 : 0;
            
            let totalEarnings = 0;
            completedOrdersSnapshot.forEach((doc) => {
                totalEarnings += doc.data().price || 0;
            });

            // Récupération des informations du chauffeur
            const driversRef = collection(db, 'drivers');
            const driverQuery = query(driversRef, where('uid', '==', userId));
            const driverSnapshot = await getDocs(driverQuery);
            
            let driverName = '';
            if (!driverSnapshot.empty) {
                driverName = driverSnapshot.docs[0].data().name;
            }

            const calculatedRating = calculateRating(completedRides, totalRides, completionRate);

            setProfileData({
                driverName,
                totalRides,
                completedRides,
                totalEarnings,
                rating: calculatedRating,
                completionRate
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
        }
    };

    const driverLevel = getDriverLevel(profileData.completedRides);
    
    const achievements = [
        {
            icon: <MaterialCommunityIcons name="car-multiple" size={24} color="#4CAF50" />,
            title: 'Courses Complétées',
            description: `${profileData.completedRides} courses réalisées`,
            color: '#4CAF50'
        },
        {
            icon: <MaterialCommunityIcons name="check-decagram" size={24} color="#2196F3" />,
            title: 'Taux de Complétion',
            description: `${profileData.completionRate.toFixed(1)}% de courses complétées`,
            color: '#2196F3'
        },
        {
            icon: <MaterialCommunityIcons name="medal" size={24} color={driverLevel.color} />,
            title: 'Niveau',
            description: `Chauffeur ${driverLevel.title}`,
            color: driverLevel.color
        }
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a73e8', '#0d47a1']}
                style={styles.headerGradient}
            >
                <View style={styles.profileHeader}>
                    <Image 
                        source={{ uri: 'https://via.placeholder.com/150' }} 
                        style={styles.profileImage} 
                    />
                    <View style={styles.headerInfo}>
                        <Text style={styles.profileName}>{profileData.driverName}</Text>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>{driverLevel.title}</Text>
                        </View>
                        <RatingStars rating={profileData.rating} />
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.statsGrid}>
                <StatCard 
                    icon={<FontAwesome5 name="car" size={24} color="#fff" />}
                    label="Courses"
                    value={profileData.totalRides}
                    gradient={['#FF6B6B', '#FF8E8E']}
                />
                <StatCard 
                    icon={<FontAwesome5 name="money-bill-wave" size={24} color="#fff" />}
                    label="Gains"
                    value={`${(profileData.totalEarnings/1000).toFixed(1)}k FCFA`}
                    gradient={['#4CAF50', '#66BB6A']}
                />
            </View>

            <View style={styles.achievementSection}>
                <Text style={styles.sectionTitle}>Réalisations</Text>
                <View style={styles.achievementsContainer}>
                    {achievements.map((achievement, index) => (
                        <Achievement key={index} {...achievement} />
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#fff',
    },
    headerInfo: {
        marginLeft: 20,
        flex: 1,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    levelBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    levelText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        alignSelf: 'flex-start',
    },
    ratingText: {
        color: '#fff',
        marginLeft: 5,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 15,
        marginTop: -30,
    },
    statCard: {
        width: (width - 45) / 2,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    achievementSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    achievementsContainer: {
        gap: 15,
    },
    achievementCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    achievementHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    achievementTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    achievementDescription: {
        fontSize: 14,
        color: '#666',
        marginLeft: 34,
    },
});

export default DriverProfile;