
import React from 'react';
import { StyleSheet, View, Button, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

const MapScreen = ({ route }) => {
    const { orderDetails } = route.params;

    const origin = {
        latitude: orderDetails.pickupLocation.latitude,
        longitude: orderDetails.pickupLocation.longitude,
    };

    const destination = {
        latitude: orderDetails.dropoffLocation.latitude,
        longitude: orderDetails.dropoffLocation.longitude,
    };

    const handleStartNavigation = () => {
        const url = `google.navigation:q=${destination.latitude},${destination.longitude}&mode=d`;
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    ...origin,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                <Marker coordinate={origin} title="Départ" />
                <Marker coordinate={destination} title="Destination" />

                <MapViewDirections
                    origin={origin}
                    destination={destination}
                    apikey="AIzaSyBQivdVNxU7quHhWARw2VuXKmHVwXhNMk" 
                    strokeWidth={5}
                    strokeColor="#000000"
                    optimizeWaypoints={true}
                    onReady={(result) => {
                        
                    }}
                    onError={(errorMessage) => {
                        console.error(errorMessage);
                    }}
                />
            </MapView>
            <View style={styles.buttonContainer}>
                <Button title="Start" onPress={handleStartNavigation} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 10,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 20,
        elevation:3,
        left: '50%',
       
        margin:50,
        width: 100,
    },
});

export default MapScreen;
