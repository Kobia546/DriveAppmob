import React, { useState } from 'react';
import { StyleSheet, Image, View, SafeAreaView, KeyboardAvoidingView, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../firebaseConfig';
import { db } from '../../firebaseConfig';
import { Platform  } from 'react-native';
import { signInWithEmailAndPassword, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc,collection,query,where,getDocs } from 'firebase/firestore';
import { normalize } from 'react-native-elements';
import HomeScreen from './HomeScreen';
import { ScreenHeight } from 'react-native-elements/dist/helpers';
import { ScreenWidth } from 'react-native-elements/dist/helpers';


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
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          style={styles.logo} 
          source={require('../../assets/Logo.png')}
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView style={styles.mainContent} >
        <Text style={styles.title}>Connectez-vous</Text>

        <View style={styles.authMethodContainer}>
          <Pressable
            onPress={() => setAuthMethod('email')}
            style={[styles.authMethodButton, authMethod === 'email' && styles.selected]}
          >
            <Text style={[
              styles.authMethodText,
              authMethod === 'email' && styles.authMethodSelectedText
            ]}>Email</Text>
          </Pressable>
          <Pressable
            onPress={() => setAuthMethod('phone')}
            style={[styles.authMethodButton, authMethod === 'phone' && styles.selected]}
          >
            <Text style={[
              styles.authMethodText,
              authMethod === 'phone' && styles.authMethodSelectedText
            ]}>Téléphone</Text>
          </Pressable>
        </View>

        {authMethod === 'email' ? (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={normalize(24)} color="gray" style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder='Entrez votre email'
                style={styles.inputField}
              />
            </View>
            <View style={styles.inputContainer}>
              <AntDesign name="lock" size={normalize(24)} color="gray" style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                placeholder='Entrez votre mot de passe'
                style={styles.inputField}
              />
            </View>
            <Pressable onPress={handleLogin} style={styles.loginButton} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Se Connecter</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={normalize(24)} color="gray" style={styles.inputIcon} />
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
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
                <MaterialIcons name="verified-user" size={normalize(24)} color="gray" style={styles.inputIcon} />
                <TextInput
                  value={verificationCode}
                  onChangeText={setVerificationCode}
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
                <Text style={styles.buttonText}>Se Connecter</Text>
              )}
            </Pressable>
          </View>
        )}

        <Pressable onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
          <Text style={styles.registerText}>
            Vous n'avez pas de compte? Inscrivez-vous
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: normalize(20),
    height: ScreenHeight * 0.15,
  },
  logo: {
    width: ScreenWidth* 0.25,
    height: ScreenHeight* 0.15,
  },
  mainContent: {
    flex: 1,
    width: '100%',
    paddingHorizontal: ScreenWidth * 0.05,
  },
  title: {
    fontSize: normalize(17),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: normalize(25),
  },
  authMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: normalize(20),
  },
  authMethodButton: {
    flex: 1,
    padding: normalize(12),
    margin: ScreenWidth * 0.01,
    borderRadius: normalize(8),
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#1b5988',
  },
  authMethodText: {
    fontSize: normalize(16),
    fontWeight: '500',
  },
  authMethodSelectedText: {
    color: 'white',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
    gap: normalize(15),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D0D0D0D0',
    borderRadius: normalize(5),
    width: '100%',
    height: normalize(50),
  },
  inputIcon: {
    marginLeft: normalize(10),
  },
  inputField: {
    flex: 1,
    padding: normalize(10),
    fontSize: normalize(16),
  },
  loginButton: {
    backgroundColor: '#1b5988',
    borderRadius: normalize(6),
    width: '80%',
    padding: normalize(15),
    alignItems: 'center',
    marginTop: normalize(20),
  },
  verificationButton: {
    backgroundColor: '#1b5988',
    borderRadius: normalize(8),
    width: '100%',
    padding: normalize(12),
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: normalize(16),
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: normalize(20),
    alignItems: 'center',
  },
  registerText: {
    fontSize: normalize(15),
    color: 'gray',
  },
});

export default Login;