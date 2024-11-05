import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { colors, parameters } from '../global/style';

const OrdersScreen = ({ route, navigation }) => {
    const { orders } = route.params; // Récupérer les commandes passées en paramètres

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>{item.destination}</Text>
            <Text style={styles.cardTime}>{item.time}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mes Commandes</Text>
            </View>
            <FlatList
                data={orders}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};
export default OrdersScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
        paddingTop: parameters.statusBarHeight,
    },
    header: {
        backgroundColor: colors.blue,
        height: parameters.headerHeight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: colors.white,
        fontSize: 22,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 20,
    },
    card: {
        backgroundColor: colors.lightGrey,
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        color: colors.black,
    },
    cardTime: {
        color: colors.grey,
    },
});

