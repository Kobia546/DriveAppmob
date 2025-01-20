import React from 'react';
import { StyleSheet, View, Text, Modal, Dimensions, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const LoadingModal = ({ visible, message = "Création de votre compte en cours..." }) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <BlurView
        intensity={60}
        tint="dark"
        style={styles.container}
      >
        <View style={styles.content}>
          <LottieView
            source={require('../../assets/loading-car.json')}
            autoPlay
            loop
            style={styles.animation}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1b5988" />
            <View style={styles.dotsContainer}>
              {[0, 1, 2].map((dot) => (
                <View
                  key={dot}
                  style={[
                    styles.dot,
                    {
                      animationDelay: `${dot * 0.3}s`,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.submessage}>Veuillez patienter un instant</Text>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: WINDOW_WIDTH * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  animation: {
    width: WINDOW_WIDTH * 0.6,
    maxWidth: 300,
    height: WINDOW_WIDTH * 0.6,
    maxHeight: 300,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1b5988',
    marginHorizontal: 2,
    opacity: 0.3,
    animation: 'pulse 1s infinite',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  submessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default LoadingModal;