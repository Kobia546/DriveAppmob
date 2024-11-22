import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Image,
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import {
  auth,
  db
} from '../../firebaseConfig';
import {
  PhoneAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword
} from 'firebase/auth';

import { doc, setDoc } from 'firebase/firestore';
import User from '../../user';
import * as Notifications from 'expo-notifications';
const VONAGE_API_KEY = '870c797f';
const VONAGE_API_SECRET = 'qbnoTNmc9SpKlkf8';
const VONAGE_BRAND_NAME = 'ValetService';

const formatPhoneNumber = (phone) => {
  // Enlever tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');
  
  // Si le numéro commence par 225, on le garde
  if (cleaned.startsWith('225')) {
    return '+' + cleaned;
  }
  
  // Si le numéro commence par 0, on l'enlève avant d'ajouter 225
  if (cleaned.startsWith('0')) {
    return '+225' + cleaned.substring(1);
  }
  
  // Sinon on ajoute simplement 225
  return '+225' + cleaned;
};
const Register = () => {
  const recaptchaVerifier = React.useRef(null);
  const [authMethod, setAuthMethod] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [verificationRequestId, setVerificationRequestId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [cars, setCars] = useState([{ carType: '', carPhoto: null }]);
  const navigation = useNavigation();
  
  const showToast = (type, text1, text2) => {
    Toast.show({
      type,
      position: 'bottom',
      text1,
      text2,
      visibilityTime: 3000
    });
  };
 
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Code à 6 chiffres
  };

  const handleSendVerificationCode = async () => {
    try {
      setLoading(true);
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      const code = generateVerificationCode();

      const response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: VONAGE_API_KEY,
          api_secret: VONAGE_API_SECRET,
          to: formattedPhoneNumber,
          from: VONAGE_BRAND_NAME.substring(0, 11),
          text: `Votre code de vérification est : ${code}`,
        }),
      });

      const data = await response.json();
      if (data.messages[0].status === '0') {
        console.log('SMS envoyé avec succès');
        setVerificationRequestId(code);
        setVerificationSent(true);
        showToast('success', 'Succès', 'Code de vérification envoyé');
      } else {
        console.error('Erreur SMS:', data.messages[0]['error-text']);
        showToast('error', 'Erreur', `Erreur lors de l'envoi du code: ${data.messages[0]['error-text']}`);
      }
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      showToast('error', 'Erreur', "Erreur lors de l'envoi du code: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = () => {
    if (verificationCode === verificationRequestId) {
      console.log('Code vérifié avec succès');
      showToast('success', 'Succès', 'Vérification réussie');
      // Procédez à la suite de votre logique d'authentification
    } else {
      console.log('Code incorrect');
      showToast('error', 'Erreur', 'Code de vérification incorrect');
    }
  };
  const handlePickImage = async (index) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const updatedCars = [...cars];
        updatedCars[index].carPhoto = result.assets[0].uri;
        setCars(updatedCars);
      }
    } catch (error) {
      showToast('error', 'Erreur', "Erreur lors de la sélection de l'image");
    }
  };

  const handleCarTypeChange = (index, type) => {
    const updatedCars = [...cars];
    updatedCars[index].carType = type;
    setCars(updatedCars);
  };

  const handleAddCar = () => {
    setCars([...cars, { carType: '', carPhoto: null }]);
  };

  const handleRemoveCar = (index) => {
    if (cars.length > 1) {
      setCars(cars.filter((_, i) => i !== index));
    } else {
      showToast('error', 'Erreur', 'Vous devez avoir au moins un véhicule');
    }
  };

  const uploadImage = async (uri, userId, carIndex) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `users/${userId}/cars/car_${carIndex}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Erreur d'upload de l'image:", error);
      return null;
    }
  };

  const validateForm = () => {
    if (!username.trim()) {
      showToast('error', 'Erreur', "Le nom d'utilisateur est requis");
      return false;
    }

    if (cars.some(car => !car.carType)) {
      showToast('error', 'Erreur', 'Veuillez sélectionner un type pour chaque véhicule');
      return false;
    }

    if (cars.some(car => !car.carPhoto)) {
      showToast('error', 'Erreur', 'Veuillez ajouter une photo pour chaque véhicule');
      return false;
    }

    if (authMethod === 'email') {
      if (!email.trim() || !password || !confirmPassword) {
        showToast('error', 'Erreur', 'Tous les champs sont requis');
        return false;
      }
      if (password !== confirmPassword) {
        showToast('error', 'Erreur', 'Les mots de passe ne correspondent pas');
        return false;
      }
      if (password.length < 6) {
        showToast('error', 'Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
        return false;
      }
    }

    return true;
  };

  const handleRegister = async () =>  {
    if (!validateForm()) return;
  
    try {
      setLoading(true);
      let userId;
  
      if (authMethod === 'phone') {
        if (!verificationRequestId || !verificationCode) {
          showToast('error', 'Erreur', 'Veuillez compléter la vérification du téléphone');
          return;
        }

        // Vérifier le code
        await verifyCode();
        
        // Créer un utilisateur Firebase sans authentification par téléphone
        const tempEmail = `${phoneNumber.replace(/[^0-9]/g, '')}@temp.com`;
        const tempPassword = Math.random().toString(36).slice(-8);
        
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          tempEmail,
          tempPassword
        );
        userId = userCredential.user.uid;
        userContact = phoneNumber;
      }  else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        userId = userCredential.user.uid;
        userContact = email; // L'email sera stocké
      }
  
      const token = (await Notifications.getExpoPushTokenAsync()).data;
  
      const carData = await Promise.all(
        cars.map(async (car, index) => {
          const carPhotoURL = car.carPhoto ? await uploadImage(car.carPhoto, userId, index) : null;
          return {
            carType: car.carType,
            carPhoto: carPhotoURL
          };
        })
      );
  
      const newUser = new User(
        userId,
        userContact, // Ceci sera soit l'email soit le numéro de téléphone
        username,
        carData,
        token
      );
  
      await setDoc(doc(db, 'users', userId), newUser.toFirestore());
      showToast('success', 'Succès', 'Inscription réussie');
      navigation.navigate('HomeScreen');
    } catch (error) {
      console.error('Erreur:', error);
      showToast('error', 'Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
    
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Image 
            style={styles.logo} 
            source={require('../../assets/Logo.png')} 
            resizeMode="contain"
          />
          
          <Text style={styles.title}>Inscription Client</Text>

          <View style={styles.authMethodContainer}>
            <Pressable
              onPress={() => setAuthMethod('phone')}
              style={[styles.authMethodButton, authMethod === 'phone' && styles.selected]}
            >
              <Text style={styles.authMethodText}>Téléphone</Text>
            </Pressable>
            <Pressable
              onPress={() => setAuthMethod('email')}
              style={[styles.authMethodButton, authMethod === 'email' && styles.selected]}
            >
              <Text style={styles.authMethodText}>Email</Text>
            </Pressable>
          </View>

          {authMethod === 'phone' ? (
            <>
              <View style={styles.inputContainer}>
                <MaterialIcons name="phone" size={24} color="gray" />
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Numéro de téléphone"
                  keyboardType="phone-pad"
                  style={styles.inputField}
                  editable={!verificationSent}
                />
              </View>

              {!verificationSent ? (
                <Pressable 
                  onPress={handleSendVerificationCode} 
                  style={styles.verificationButton}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Envoyer le code</Text>
                  )}
                </Pressable>
              ) : (
                <View style={styles.inputContainer}>
                  <MaterialIcons name="verified-user" size={24} color="gray" />
                  <TextInput
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    placeholder="Code de vérification"
                    keyboardType="number-pad"
                    style={styles.inputField}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={24} color="gray" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.inputField}
                />
              </View>

              <View style={styles.inputContainer}>
                <AntDesign name="lock" size={24} color="gray" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Mot de passe"
                  style={styles.inputField}
                />
              </View>

              <View style={styles.inputContainer}>
                <AntDesign name="lock" size={24} color="gray" />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Confirmer le mot de passe"
                  style={styles.inputField}
                />
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <FontAwesome name="user" size={24} color="gray" />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Nom utilisateur"
              style={styles.inputField}
            />
          </View>

          {cars.map((car, index) => (
            <View key={index} style={styles.carContainer}>
              <Text style={styles.carTitle}>Véhicule {index + 1}</Text>

              {cars.length > 1 && (
                <Pressable
                  onPress={() => handleRemoveCar(index)}
                  style={styles.crossButton}
                >
                  <FontAwesome name="close" size={24} color="gray" />
                </Pressable>
              )}

              <View style={styles.toggleContainer}>
                {['Eco', 'Confort', 'Luxe'].map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => handleCarTypeChange(index, type)}
                    style={[
                      styles.toggleButton,
                      car.carType === type && styles.selected
                    ]}
                  >
                    <Text style={[
                      styles.toggleButtonText,
                      car.carType === type && styles.selectedText
                    ]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={() => handlePickImage(index)}
                style={styles.photoButton}
              >
                <Text style={styles.photoButtonText}>
                  {car.carPhoto ? 'Photo sélectionnée' : 'Ajouter une photo'}
                </Text>
              </Pressable>
              </View>
          ))}

          <Pressable onPress={handleAddCar} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Ajouter un véhicule</Text>
          </Pressable>

          <Pressable 
            onPress={handleRegister} 
            style={styles.registerButton}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerButtonText}>S'inscrire</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  logo: {
    width: 150,
    height: 100,
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  authMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
    width: '90%',
  },
  authMethodButton: {
    flex: 1,
    padding: 12,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  authMethodText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selected: {
    backgroundColor: '#1b5988',
  },
  selectedText: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginVertical: 8,
    width: '90%',
    paddingHorizontal: 12,
    height: 50,
  },
  inputField: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  verificationButton: {
    backgroundColor: '#1b5988',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    width: '90%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  carContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    width: '90%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  carTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  crossButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  toggleButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    width: 90,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontWeight: '600',
  },
  photoButton: {
    backgroundColor: '#1b5988',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    marginVertical: 15,
  },
  addButtonText: {
    color: '#1b5988',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#1b5988',
    padding: 15,
    borderRadius: 8,
    width: '90%',
    marginTop: 10,
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Register;