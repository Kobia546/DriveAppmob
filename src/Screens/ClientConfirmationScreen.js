import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../global/style';

const ClientConfirmationScreen = ({ route }) => {
    const { message } = route.params;

    return (
        <View style={styles.container}>
            <Text style={styles.message}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    message: {
        fontSize: 20,
        color: colors.primary,
        textAlign: 'center',
    },
});

export default ClientConfirmationScreen;
