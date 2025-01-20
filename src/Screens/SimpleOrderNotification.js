import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { Icon } from 'react-native-elements';

const SimpleOrderNotification = ({ isVisible, driverInfo, onClose }) => {
  if (!isVisible || !driverInfo) return null;

  const handlePhonePress = () => {
    if (driverInfo.driverPhone) {
      Linking.openURL(`tel:${driverInfo.driverPhone}`);
    }
  };

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
          {/* En-tête de la notification */}
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
          
          {/* Carte d'information du chauffeur */}
          <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            {/* Photo et nom du chauffeur */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              {driverInfo.profileImage ? (
                <Image
                  source={{ uri: driverInfo.profileImage }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    marginBottom: 12,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: '#E5E7EB',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <Icon name="person" size={50} color="#9CA3AF" />
                </View>
              )}
              
              {/* Nom du chauffeur */}
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 }}>
                {driverInfo.driverName || 'Nom du chauffeur'}
              </Text>
              
              <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 16 }}>
                Votre chauffeur
              </Text>
            </View>

            {/* Numéro de téléphone cliquable */}
            <TouchableOpacity
              onPress={handlePhonePress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#EFF6FF',
                padding: 12,
                borderRadius: 12,
                marginBottom: 8
              }}>
              <Icon
                name="phone"
                type="material"
                size={24}
                color="#2563EB"
                style={{ marginRight: 8 }}
              />
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#2563EB' }}>
                {driverInfo.driverPhone || 'Numéro de téléphone'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Bouton OK */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: '#2563EB',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4
            }}
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