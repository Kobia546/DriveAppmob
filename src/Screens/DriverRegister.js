import React, { useState,useEffect } from 'react';
import { StyleSheet, Image, View, SafeAreaView, KeyboardAvoidingView, Text, TextInput, Pressable, ScrollView, Platform, Dimensions } from 'react-native';
import { MaterialIcons, AntDesign, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../firebaseConfig'; 
import { createUserWithEmailAndPassword, getIdToken } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
import LoadingModal from './LoadingModal';

const DriverRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [licenseImage, setLicenseImage] = useState(null);
  const [idCardImage, setIdCardImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const navigation = useNavigation();

  // Fonction pour afficher les messages toast
const showToast = (type, text1, text2) => {
  Toast.show({
    type: type,
    position: 'bottom',
    text1: text1,
    text2: text2,
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 30,
  });
};

// Fonction pour sélectionner une image depuis la galerie
const handlePickImage = async (setImage) => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled) {
    setImage(result.assets[0].uri);
    console.log('Image URI:', result.assets[0].uri);
  }
};

// Fonction pour uploader une image vers Firebase Storage
const uploadImage = async (uri, name) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storage = getStorage();
    const storageRef = ref(storage, `drivers/${name}`);

    console.log('Uploading image...');
    await uploadBytes(storageRef, blob);
    console.log('Image uploaded successfully');

    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Error uploading image');
  }
};

// Fonction principale pour gérer l'inscription
const handleRegister = async () => {
  // Vérification que tous les champs sont remplis
  if (!name || !email || !phoneNumber || !password || !licenseImage || !idCardImage || !profileImage) {
    showToast('error', 'Erreur', 'Veuillez remplir tous les champs et ajouter toutes les photos requises');
    return;
  }

  try {
    // Création du compte utilisateur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Upload des images et récupération des URLs
    const licenseImageUrl = await uploadImage(licenseImage, `license_${userId}.jpg`);
    const idCardImageUrl = await uploadImage(idCardImage, `idCard_${userId}.jpg`);
    const profileImageUrl = await uploadImage(profileImage, `profile_${userId}.jpg`);
    
    // Récupération du token d'authentification
    const token = await getIdToken(auth.currentUser);

    // Préparation des données du chauffeur
    const driverData = {
      uid: userId,
      email: email,
      name: name,
      phone: phoneNumber,
      licenseImage: licenseImageUrl,
      idCardImage: idCardImageUrl,
      profileImage: profileImageUrl,
      token: token,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    
    // Affichage du loader
    setLoading(true);

    // Enregistrement dans Firestore
    await setDoc(doc(db, 'drivers', userId), driverData);
    
    // Petit délai pour assurer que les données sont bien enregistrées
    await new Promise(resolve => setTimeout(resolve, 500));

    // Affichage du message de succès
    showToast('success', 'Inscription réussie !');
    
    // Navigation vers la page Driver
    navigation.navigate("Driver");

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    showToast('error', 'Erreur lors de l\'inscription : ' + error.message);
  } finally {
    // Masquer le loader dans tous les cas
    setLoading(false);
  }
};

// Fonction pour vérifier et demander les permissions (à ajouter au useEffect)
const checkPermissions = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    showToast('error', 'Permission refusée', 'Nous avons besoin d\'accéder à votre galerie pour les photos');
  }
};

// Vous pouvez ajouter ceci dans un useEffect
useEffect(() => {
  checkPermissions();
}, []);
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.innerContainer}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/Logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Inscription Chauffeur</Text>

            <View style={styles.formContainer}>
              {/* Section de la photo de profil */}
              <View style={styles.profileImageSection}>
                <Pressable 
                  onPress={() => handlePickImage(setProfileImage)} 
                  style={styles.profileImageButton}
                >
                  {profileImage ? (
                    <Image 
                      source={{ uri: profileImage }} 
                      style={styles.profilePreview} 
                    />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <Ionicons name="person-add" size={40} color="#1b5988" />
                    </View>
                  )}
                </Pressable>
                <Text style={styles.profileImageText}>
                  {profileImage ? 'Modifier la photo' : 'Ajouter une photo'}
                </Text>
              </View>

              {/* Champs de saisie */}
              <View style={styles.formFields}>
                <View style={styles.inputContainer}>
                  <AntDesign name="user" size={24} color="#1b5988" />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Nom"
                    style={styles.inputField}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={24} color="#1b5988" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    style={styles.inputField}
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <AntDesign name="lock" size={24} color="#1b5988" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    placeholder="Mot de passe"
                    style={styles.inputField}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <AntDesign name="phone" size={24} color="#1b5988" />
                  <TextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Numéro de téléphone"
                    style={styles.inputField}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Section des documents */}
              <View style={styles.documentsSection}>
                <Text style={styles.sectionTitle}>Documents requis</Text>
                
                {/* License */}
                <Pressable 
                  onPress={() => handlePickImage(setLicenseImage)} 
                  style={[styles.documentButton, licenseImage && styles.documentButtonActive]}
                >
                  <View style={styles.documentContent}>
                    <MaterialIcons 
                      name={licenseImage ? "check-circle" : "add-circle-outline"} 
                      size={24} 
                      color={licenseImage ? "#4CAF50" : "#1b5988"} 
                    />
                    <View style={styles.documentTextContainer}>
                      <Text style={styles.documentTitle}>Permis de conduire</Text>
                      <Text style={styles.documentSubtitle}>
                        {licenseImage ? 'Document ajouté' : 'Ajouter le document'}
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {licenseImage && (
                  <View style={styles.previewContainer}>
                    <Image 
                      source={{ uri: licenseImage }} 
                      style={styles.documentPreview}
                      resizeMode="cover"
                    />
                    <Pressable 
                      style={styles.editButton}
                      onPress={() => handlePickImage(setLicenseImage)}
                    >
                      <Text style={styles.editButtonText}>Modifier</Text>
                    </Pressable>
                  </View>
                )}

                {/* ID Card */}
                <Pressable 
                  onPress={() => handlePickImage(setIdCardImage)} 
                  style={[styles.documentButton, idCardImage && styles.documentButtonActive]}
                >
                  <View style={styles.documentContent}>
                    <MaterialIcons 
                      name={idCardImage ? "check-circle" : "add-circle-outline"} 
                      size={24} 
                      color={idCardImage ? "#4CAF50" : "#1b5988"} 
                    />
                    <View style={styles.documentTextContainer}>
                      <Text style={styles.documentTitle}>Carte d'identité</Text>
                      <Text style={styles.documentSubtitle}>
                        {idCardImage ? 'Document ajouté' : 'Ajouter le document'}
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {idCardImage && (
                  <View style={styles.previewContainer}>
                    <Image 
                      source={{ uri: idCardImage }} 
                      style={styles.documentPreview}
                      resizeMode="cover"
                    />
                    <Pressable 
                      style={styles.editButton}
                      onPress={() => handlePickImage(setIdCardImage)}
                    >
                      <Text style={styles.editButtonText}>Modifier</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <Pressable 
                onPress={handleRegister} 
                style={styles.registerButton}
              >
                <Text style={styles.registerButtonText}>S'inscrire</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
        <LoadingModal 
          visible={loading} 
          message="Création de votre compte chauffeur..."
        />
      </SafeAreaView>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContainer: {
    paddingHorizontal: windowWidth * 0.05,
    paddingBottom: windowHeight * 0.05,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: windowHeight * 0.03,
  },
  logo: {
    width: windowWidth * 0.4,
    height: windowHeight * 0.1,
    maxWidth: 200,
    maxHeight: 100,
  },
  title: {
    fontSize: Math.min(windowWidth * 0.06, 24),
    fontWeight: '700',
    marginBottom: windowHeight * 0.03,
    color: '#1b5988',
  },
  formContainer: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: windowHeight * 0.03,
  },
  profileImageButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePreview: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  profileImageText: {
    fontSize: 16,
    color: '#1b5988',
    marginTop: 8,
  },
  formFields: {
    width: '100%',
    marginBottom: windowHeight * 0.02,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: windowHeight * 0.02,
    paddingHorizontal: windowWidth * 0.04,
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputField: {
    flex: 1,
    marginLeft: windowWidth * 0.02,
    fontSize: 16,
    color: '#333',
  },
  documentsSection: {
    width: '100%',
    marginVertical: windowHeight * 0.02,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  documentButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  documentButtonActive: {
    backgroundColor: '#F5F5F5',
    borderColor: '#1b5988',
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentTextContainer: {
    marginLeft: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  documentSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  previewContainer: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  documentPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  editButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#1b5988',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: 'black',
    borderRadius: 12,
    width: '100%',
    padding: windowWidth * 0.04,
    alignItems: 'center',
    marginTop: windowHeight * 0.03,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DriverRegister;