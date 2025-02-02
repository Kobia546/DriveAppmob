import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  SafeAreaView,
  FlatList,
  Platform,
  Dimensions,
  Pressable,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: "Bienvenue dans l'application qui révolutionne la manière de faire vos courses",
    subtitle: "Une nouvelle façon de faire vos courses",
    image: require("../../assets/Bienvenue.png")
  },
  {
    id: 2,
    title: "Fatigué ? Occupé ? Laissez nous  conduire",
    subtitle: "Détendez-vous nous sommes là pour vous servir ",
    image: require("../../assets/First.png")
  },
  {
    id: 3,
    title: "Vous avez du travail , vous êtes en reunion , Votre temps est précieux, Confiez nous vos courses ",
    subtitle: "Concentrez-vous sur l'essentiel, on s'occupe de vos courses",
    image: require("../../assets/Busy.png"),
  },
  {
    id: 4,
    title: "N'ayez craintes,nous avons des chauffeurs professionels certifiés ",
    subtitle: "Vous êtes avec une equipe de confiance",
    image: require("../../assets/verification.png"),
    isLastSlide: true,
  },
];

const SlideItem = ({ item, scrollX, index, handleStartAdventure }) => {
  const inputRange = [(index - 1) * WINDOW_WIDTH, index * WINDOW_WIDTH, (index + 1) * WINDOW_WIDTH];
  
  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.8, 1, 0.8],
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.4, 1, 0.4],
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.imageContainer, { transform: [{ scale }], opacity }]}>
        <Image source={item.image} style={styles.image} />
      </Animated.View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
      {item.isLastSlide && (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={handleStartAdventure}
        >
          <LinearGradient
            colors={['#1b5988', '#2980b9']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Commencer l'aventure</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
};

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  const navigation = useNavigation();

  const handleStartAdventure = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Login');
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * WINDOW_WIDTH, i * WINDOW_WIDTH, (i + 1) * WINDOW_WIDTH];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { width: dotWidth, opacity },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    return <SlideItem item={item} scrollX={scrollX} index={index} handleStartAdventure={handleStartAdventure} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <BlurView intensity={100} style={styles.logoContainer}>
        <Image
          style={styles.logo}
          source={require('../../assets/Logo.png')}
        />
      </BlurView>
      <Animated.FlatList
        ref={slidesRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / WINDOW_WIDTH);
          setActiveIndex(newIndex);
        }}
        scrollEventThrottle={16}
      />
      {renderPagination()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: 20,
    alignItems: 'center',
  },
  logo: {
    width: WINDOW_WIDTH * 0.15,
    height: WINDOW_WIDTH * 0.15,
    resizeMode: 'contain',
  },
  slide: {
    width: WINDOW_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: WINDOW_WIDTH * 0.8,
    height: WINDOW_HEIGHT * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 150,
  },
  title: {
    fontSize: WINDOW_WIDTH * 0.06,
    fontWeight: 'bold',
    color: '#1b5988',
    textAlign: 'center',
    marginBottom: 19,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: WINDOW_WIDTH * 0.04,
    color: '#666',
    textAlign: 'center',
    lineHeight: WINDOW_WIDTH * 0.06,
    paddingHorizontal: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1b5988',
    marginHorizontal: 5,
  },
  button: {
    width: WINDOW_WIDTH * 0.8,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: WINDOW_WIDTH * 0.045,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});