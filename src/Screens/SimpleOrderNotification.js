import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';

const SimpleOrderNotification = ({ isVisible, driverInfo, onClose }) => {
  if (!isVisible || !driverInfo) return null;

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
        />
        
        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 48, height: 4, backgroundColor: '#E5E7EB', borderRadius: 9999, marginBottom: 16 }} />
            <View style={{ backgroundColor: '#DEF7EC', borderRadius: 9999, padding: 12, marginBottom: 16 }}>
              <Icon
                name="check-circle"
                type="material-community"
                size={32}
                color="#059669"
              />
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
              Commande acceptée !
            </Text>
            <Text style={{ fontSize: 16, color: '#4B5563', textAlign: 'center', marginBottom: 16 }}>
              Votre chauffeur arrive bientôt
            </Text>
          </View>
          
          <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
              {driverInfo.driverName}
            </Text>
            <Text style={{ color: '#4B5563' }}>
              {driverInfo.driverPhone}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={onClose}
            style={{ backgroundColor: '#2563EB', borderRadius: 12, padding: 16, alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
              OK
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SimpleOrderNotification;