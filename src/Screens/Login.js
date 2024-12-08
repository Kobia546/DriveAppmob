import React, { useState } from 'react';
import { StyleSheet, Image, View, SafeAreaView, KeyboardAvoidingView, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../firebaseConfig';
import { db } from '../../firebaseConfig';
import { signInWithEmailAndPassword, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc,collection,query,where,getDocs } from 'firebase/firestore';
import HomeScreen from './HomeScreen';

const VONAGE_API_KEY = 'c2f40403';
const VONAGE_API_SECRET = 'X5JTqlKo0cpbIWnX';
const VONAGE_BRAND_NAME = 'ValetServices';

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

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Code à 6 chiffres
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [storedVerificationCode, setStoredVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState('email');
  const navigation = useNavigation();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const showToast = (type, text1, text2) => {
    Toast.show({
      type,
      position: 'bottom',
      text1,
      text2,
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 30,
    });
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
        setStoredVerificationCode(code);
        setVerificationSent(true);
        showToast('success', 'Succès', 'Code de vérification envoyé');
      } else {
        showToast('error', 'Erreur', `Erreur lors de l'envoi du code: ${data.messages[0]['error-text']}`);
      }
    } catch (error) {
      showToast('error', 'Erreur', "Erreur lors de l'envoi du code: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      
      // Verify the OTP
      if (verificationCode !== storedVerificationCode) {
        showToast('error', 'Erreur', 'Code de vérification incorrect');
        return;
      }

      // Search for phone number in users and drivers collections
      const usersRef = collection(db, 'users');
      const driversRef = collection(db, 'drivers');

      const userQuery = query(usersRef, where('phone', '==', formatPhoneNumber(phoneNumber)));
      const driverQuery = query(driversRef, where('phone', '==', formatPhoneNumber(phoneNumber)));

      const userSnapshot = await getDocs(userQuery);
      const driverSnapshot = await getDocs(driverQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        navigation.navigate('HomeScreen', { userId: userDoc.id });
      } else if (!driverSnapshot.empty) {
        const driverDoc = driverSnapshot.docs[0];
        navigation.navigate('Driver', { driverId: driverDoc.id });
      } else {
        showToast('error', 'Erreur', 'Aucun compte trouvé avec ce numéro');
      }
    } catch (error) {
      showToast('error', 'Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (authMethod === 'email') {
      if (!emailPattern.test(email)) {
        showToast('error', 'Erreur', 'Adresse email invalide');
        return;
      }

      if (password.length < 6) {
        showToast('error', 'Erreur', 'Mot de passe trop court');
        return;
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Vérifiez d'abord dans la collection des chauffeurs
        const driverDoc = await getDoc(doc(db, 'drivers', user.uid));

        if (driverDoc.exists()) {
          navigation.navigate('Driver'); // Si c'est un chauffeur
        } else {
          // Ensuite, vérifiez dans la collection des utilisateurs
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            navigation.navigate('HomeScreen'); // Si c'est un utilisateur
          } else {
            showToast('error', 'Erreur', 'Utilisateur introuvable');
          }
        }
      } catch (error) {
        showToast('error', 'Erreur', error.message);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white', alignItems: 'center' }}>
      <View>
        <Image style={{ width: 100, height: 100, top: 45, }} source={require('../../assets/Logo.png')} />
      </View>
      <KeyboardAvoidingView>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', top: 80 }}>Connectez-vous</Text>
        </View>
        <View style={styles.authMethodContainer}>
          <Pressable
            onPress={() => setAuthMethod('email')}
            style={[styles.authMethodButton, authMethod === 'email' && styles.selected]}
          >
            <Text style={ styles.authMethodText,
        authMethod === 'email' && styles.authMethodSelectedText}>Email</Text>
          </Pressable>
          <Pressable
            onPress={() => setAuthMethod('phone')}
            style={[styles.authMethodButton, authMethod === 'phone' && styles.selected]}
          >
            <Text style={ styles.authMethodText,
        authMethod === 'phone' && styles.authMethodSelectedText}>Téléphone</Text>
          </Pressable>
        </View>
        {authMethod === 'email' ? (
          <>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color="gray" marginLeft={10} />
              <TextInput
                value={email}
                onChangeText={(text) => setEmail(text)}
                placeholder='Entrez votre email'
                style={styles.inputField}
              />
            </View>
            <View style={styles.inputContainer}>
              <AntDesign name="lock" size={24} color="gray" marginLeft={10} />
              <TextInput
                value={password}
                onChangeText={(text) => setPassword(text)}
                secureTextEntry={true}
                placeholder='Entrez votre mot de passe'
                style={styles.inputField}
              />
            </View>
            <Pressable onPress={handleLogin} style={styles.loginButton} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Se Connecter</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={24} color="gray" marginLeft={10} />
              <TextInput
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(text)}
                placeholder='Entrez votre numéro de téléphone'
                keyboardType="phone-pad"
                style={styles.inputField}
              />
            </View>
            {!verificationSent ? (
              <Pressable onPress={handleSendVerificationCode} style={styles.verificationButton} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Envoyer le code</Text>
                )}
              </Pressable>
            ) : (
              <View style={styles.inputContainer}>
                <MaterialIcons name="verified-user" size={24} color="gray" marginLeft={10} />
                <TextInput
                  value={verificationCode}
                  onChangeText={(text) => setVerificationCode(text)}
                  placeholder='Entrez le code de vérification'
                  keyboardType="number-pad"
                  style={styles.inputField}
                />
              </View>
            )}
            <Pressable onPress={handleVerifyCode} style={styles.loginButton} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>Se Connecter</Text>
              )}
            </Pressable>
          </>
        )}
        <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: 10 }}>
          <Text style={{ textAlign: 'center', fontSize: 15, color: 'gray' }}>Vous n'avez  pas de compte? Inscrivez-vous</Text>
        </Pressable>
      </KeyboardAvoidingView>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    marginVertical: 90,
    position:'static',
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
    color:'white'
    
    
  },
  selectedText: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
    bottom: 90,
    marginTop: 20,
    paddingVertical: 'center',
    alignItems: 'center',
    backgroundColor: '#D0D0D0D0',
    
    borderRadius: 5,
  },
  inputField: {
    padding: 10,
    width: 300,
    height: 50,
    fontSize: 18,
  },
  verificationButton: {
    backgroundColor: '#1b5988',
    padding: 12,
    borderRadius: 8,
    marginVertical: 2,
    bottom:85,
    width: '90%',
    alignItems: 'center',
  },
  authMethodSelectedText: {
    color: 'white',
  },
  buttonText:{
    color:'white'
  },
  loginButton: {
    marginTop: 140,
    backgroundColor: '#1b5988',
    marginLeft: 'auto',
    marginRight: 'auto',
    borderRadius: 6,
    width: 200,
    padding: 15,
  },
});

export default Login;
