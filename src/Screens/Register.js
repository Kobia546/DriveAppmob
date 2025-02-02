import React, { useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, getIdToken } from 'firebase/auth';
import LoadingModal from './LoadingModal';

import { doc, setDoc } from 'firebase/firestore';
import User from '../../user';
import { apiKeys } from '../../config/keys';







const VONAGE_API_KEY = '870c797f';
const VONAGE_API_SECRET = 'qbnoTNmc9SpKlkf8';
const VONAGE_BRAND_NAME = 'ValetService';
const sendVerificationEmail = async (email, username, verificationCode) => {
  try {
   

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKeys.brevo,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'ValetService',
          email: 'mambochristian2018@gmail.com'
        },
        to: [{
          email: email,
          name: username
        }],
        subject: 'Code de vérification - ValetService',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1b5988; color: white; padding: 20px; text-align: center;">
              <h1>🚗 Validation de votre compte ValetService</h1>
            </div>
            <div style="padding: 20px;">
              <h2>Bonjour ${username},</h2>
              <p>Voici votre code de vérification pour activer votre compte ValetService :</p>
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; margin: 20px 0; color: #1b5988; border: 2px dashed #1b5988; border-radius: 5px;">
                ${verificationCode}
              </div>
              <p><strong>Ce code est valable pendant 10 minutes.</strong></p>
              <p>Si vous n'avez pas créé de compte sur ValetService, veuillez ignorer cet email.</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
              <p>© 2024 ValetService - Tous droits réservés</p>
            </div>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erreur lors de l'envoi de l'email");
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur envoi email:', error);
    throw new Error("Échec de l'envoi de l'email");
  }
};
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('225')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+225' + cleaned.substring(1);
  }
  return '+225' + cleaned;
};

const Register = () => {
  const [authMethod, setAuthMethod] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationRequestId, setVerificationRequestId] = useState('');
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
      visibilityTime: 3000,
    });
  };

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
        setVerificationRequestId(code);
        setVerificationSent(true);
        showToast('success', 'Succès', 'Le code de vérification a été envoyé à votre numéro.');
      } else {
        showToast('error', 'Erreur', `Échec de l'envoi du code : ${data.messages[0]['error-text']}`);
      }
    } catch (error) {
      showToast('error', 'Erreur', "Une erreur s'est produite lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = () => {
    if (verificationCode === verificationRequestId) {
      showToast('success', 'Succès', 'Votre code a été vérifié avec succès.');
    } else {
      showToast('error', 'Erreur', 'Le code de vérification est incorrect.');
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
      showToast('error', 'Erreur', "Erreur lors de la sélection de l'image.");
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
      showToast('error', 'Erreur', 'Vous devez avoir au moins un véhicule.');
    }
  };

  const uploadImage = async (uri, userId, carIndex) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `users/${userId}/cars/car_${carIndex}.jpg`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Erreur d'upload de l'image:", error);
      return null;
    }
  };

  const validateForm = () => {
    if (!username.trim()) {
      showToast('error', 'Erreur', "Le nom d'utilisateur est requis.");
      return false;
    }

    if (cars.some((car) => !car.carType)) {
      showToast('error', 'Erreur', 'Veuillez sélectionner un type pour chaque véhicule.');
      return false;
    }

    if (cars.some((car) => !car.carPhoto)) {
      showToast('error', 'Erreur', 'Veuillez ajouter une photo pour chaque véhicule.');
      return false;
    }

    if (authMethod === 'email') {
      if (!email.trim() || !password || !confirmPassword) {
        showToast('error', 'Erreur', 'Tous les champs sont requis.');
        return false;
      }
      if (password !== confirmPassword) {
        showToast('error', 'Erreur', 'Les mots de passe ne correspondent pas.');
        return false;
      }
      if (password.length < 6) {
        showToast('error', 'Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
        return false;
      }
    }

    return true;
  };
  const handleRegister = async () => {
    if (!validateForm()) return;
  
    try {
      setLoading(true);
      let userId;
      let userContact;
  
      if (authMethod === 'phone') {
        if (!verificationRequestId || !verificationCode) {
          showToast('error', 'Erreur', 'Veuillez compléter la vérification du téléphone.');
          return;
        }
  
        await verifyCode();
  
        const tempEmail = `${phoneNumber.replace(/[^0-9]/g, '')}@temp.com`;
        const tempPassword = Math.random().toString(36).slice(-8);
  
        const userCredential = await createUserWithEmailAndPassword(auth, tempEmail, tempPassword);
        userId = userCredential.user.uid;
        userContact = phoneNumber;
      } else {
        // Vérification email
        if (!verificationSent) {
          // Première étape : envoi du code de vérification
          const verificationCode = generateVerificationCode();
          setVerificationRequestId(verificationCode);
          
          try {
            await sendVerificationEmail(email, username, verificationCode);
            setVerificationSent(true);
            showToast('success', 'Succès', 'Le code de vérification a été envoyé à votre email.');
            setLoading(false);
            return;
          } catch (emailError) {
            throw new Error("Erreur lors de l'envoi de l'email de vérification");
          }
        }
  
        // Vérification du code
        if (verificationCode !== verificationRequestId) {
          showToast('error', 'Erreur', 'Code de vérification incorrect');
          setLoading(false);
          return;
        }
  
        // Si le code est correct, création du compte
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        userId = userCredential.user.uid;
        userContact = email;
      }
  
      const token = await getIdToken(auth.currentUser);
  
      const carData = await Promise.all(
        cars.map(async (car, index) => {
          const carPhotoURL = car.carPhoto ? await uploadImage(car.carPhoto, userId, index) : null;
          return {
            carType: car.carType,
            carPhoto: carPhotoURL,
          };
        })
      );
  
      const newUser = new User(userId, userContact, username, carData, token);
      await setDoc(doc(db, 'users', userId), newUser.toFirestore());
  
      showToast('success', 'Succès', 'Votre inscription a été effectuée avec succès.');
      navigation.navigate('HomeScreen');
    } catch (error) {
      showToast('error', 'Erreur', `Échec de l'inscription : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const SelectedCar = ({ car, index }) => {
    return (
      <View style={styles.selectedCarContainer}>
        <Text style={styles.selectedCarTitle}>Véhicule {index + 1}</Text>
        <View style={styles.selectedCarContent}>
          <Text style={styles.selectedCarType}>Type: {car.carType}</Text>
          {car.carPhoto && (
            <Image source={{ uri: car.carPhoto }} style={styles.selectedCarImage} resizeMode="cover" />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Image style={styles.logo} source={require('../../assets/Logo.png')} resizeMode="contain" />
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
                <Pressable onPress={handleSendVerificationCode} style={styles.verificationButton} disabled={loading}>
                  {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Envoyer le code</Text>}
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
                  editable={!verificationSent}
                />
              </View>
              {verificationSent && (
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
                <Pressable onPress={() => handleRemoveCar(index)} style={styles.crossButton}>
                  <FontAwesome name="close" size={24} color="gray" />
                </Pressable>
              )}

              <View style={styles.toggleContainer}>
                {['Eco', 'Confort', 'Luxe'].map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => handleCarTypeChange(index, type)}
                    style={[styles.toggleButton, car.carType === type && styles.selected]}
                  >
                    <Text style={[styles.toggleButtonText, car.carType === type && styles.selectedText]}>{type}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={() => handlePickImage(index)} style={styles.photoButton}>
                <Text style={styles.photoButtonText}>
                  {car.carPhoto ? 'Photo sélectionnée' : 'Ajouter une photo'}
                </Text>
              </Pressable>
            </View>
          ))}

          <Pressable onPress={handleAddCar} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Ajouter un véhicule</Text>
          </Pressable>

          {/* Section des voitures sélectionnées */}
          <View style={styles.selectedCarsSection}>
            <Text style={styles.selectedCarsTitle}>Vos véhicules sélectionnés</Text>
            {cars.map((car, index) => (
              <SelectedCar key={index} car={car} index={index} />
            ))}
          </View>

          <Pressable onPress={handleRegister} style={styles.registerButton} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.registerButtonText}>S'inscrire</Text>}
          </Pressable>

          <Pressable onPress={() => navigation.navigate('DriverRegister')} style={styles.registerLink}>
            <Text style={styles.registerText}>Je suis chauffeur</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingModal visible={loading} message="Création de votre compte client..." />
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
  selectedCarsSection: {
    width: '90%',
    marginTop: 20,
    marginBottom: 10,
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCarsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1b5988',
  },
  selectedCarContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCarTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#1b5988',
  },
  selectedCarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCarType: {
    fontSize: 14,
    color: '#555',
  },
  selectedCarImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  registerButton: {
    backgroundColor: '#1b5988',
    padding: 15,
    borderRadius: 8,
    width: '90%',
    marginTop: 10,
    alignItems: 'center',
  },
  registerLink: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 8,
    width: '90%',
    marginTop: '2%',
    alignItems: 'center',
  },
  registerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Register;