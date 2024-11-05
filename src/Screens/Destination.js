import React, { useRef, useContext, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Avatar, Icon } from 'react-native-elements';
import { colors } from '../global/style';
import MapComponent from '../Compnents/MapComponent';
import { OriginContext, DestinationContext } from '../Contexts/contexts';
import axios from 'axios';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const DestinationScreen = ({ navigation }) => {
  const { dispatchOrigin } = useContext(OriginContext);
  const { dispatchDestination } = useContext(DestinationContext);
  const [selectedOriginName, setSelectedOriginName] = useState('');
const [selectedDestinationName, setSelectedDestinationName] = useState('');

  const [destination, setDestination] = useState(false);
  const [locations, setLocations] = useState([]); // Stocker les lieux d'Abidjan
  const [originQuery, setOriginQuery] = useState(''); // Texte de recherche pour l'origine
  const [destinationQuery, setDestinationQuery] = useState(''); // Texte de recherche pour la destination
  const [filteredOriginLocations, setFilteredOriginLocations] = useState([]); // Résultats filtrés pour l'origine
  const [filteredDestinationLocations, setFilteredDestinationLocations] = useState([]); // Résultats filtrés pour la destination
  const [loading, setLoading] = useState(true);

  const textInput1 = useRef(4);
  const textInput2 = useRef(5);

  // Fonction pour récupérer les lieux d'Abidjan via l'Overpass API
  const fetchAbidjanLocations = () => {
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const query = `
      [out:json];
      area["name"="Abidjan"]->.searchArea;
      (
        node["place"="suburb"](area.searchArea);
        node["place"="town"](area.searchArea);
        way["highway"](area.searchArea);
        node["highway"="junction"](area.searchArea);
        node["landuse"="park"](area.searchArea);
        node["amenity"="hotel"](area.searchArea);
        node["amenity"="restaurant"](area.searchArea);
        node["amenity"="cafe"](area.searchArea);
        node["amenity"="school"](area.searchArea);
        node["amenity"="hospital"](area.searchArea);
        node["amenity"="fuel"](area.searchArea);
        node["amenity"="bank"](area.searchArea);
        node["shop"](area.searchArea);
      );
      out body;
    `;

    axios
      .post(overpassUrl, query, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .then((response) => {
       
        const allData = response.data.elements
          .filter((element) => element.tags && element.tags.name)
          .map((location) => ({
            id: location.id,
            name: location.tags.name,
            type: location.tags.place || location.tags.highway || location.tags.landuse || location.tags.amenity || 'Lieu',
            lat: location.lat,
            lon: location.lon,
  
          }));
        setLocations(allData);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAbidjanLocations();
  }, []);

  const handleSearchOrigin = (text) => {
    setOriginQuery(text);
    if (text.length > 1) {
      const filtered = locations.filter((location) =>
        location.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredOriginLocations(filtered);
    } else {
      setFilteredOriginLocations([]);
    }
  };

  const handleSearchDestination = (text) => {
    setDestinationQuery(text);
    if (text.length > 1) {
      const filtered = locations.filter((location) =>
        location.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredDestinationLocations(filtered);
    } else {
      setFilteredDestinationLocations([]);
    }
  };

  const handleSelectOrigin = (item) => {
    const mappedItem = {
      latitude: item.lat,    // On convertit lat en latitude
      longitude: item.lon,   // On convertit lon en longitude
      type: item.type,
      name: item.name,
    };
  
    // Appel à dispatch avec les propriétés corrigées
    setOriginQuery(item.name);
    setFilteredOriginLocations([]);
    dispatchOrigin({
      type: 'ADD_ORIGIN',
      payload: mappedItem,
    });
    setSelectedOriginName(item.name); 
    setDestination(true);
  };

  const handleSelectDestination = (item) => {
    const mappedItem = {
      latitude: item.lat,    // On convertit lat en latitude
      longitude: item.lon,   // On convertit lon en longitude
      type: item.type,
      name: item.name,
    };
    setDestinationQuery(item.name);
    setFilteredDestinationLocations([]);
    dispatchDestination({
      type: 'ADD_DESTINATION',
      payload: mappedItem,
    });
    setSelectedDestinationName(item.name);
    navigation.navigate('RequestScreen',{state:0});
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement des données...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.view2}>
        <View style={styles.view1}>
          <Icon
            type="material-community"
            name="arrow-left"
            color={colors.grey1}
            size={32}
            onPress={() => navigation.goBack()}
          />
        </View>
        <TouchableOpacity>
          <View style={{ top: 40, alignItems: 'center' }}>
            <View style={styles.view3}>
              <Avatar
                rounded
                size={30}
                source={require('../../assets/blankProfilePic.jpg')}
              />
              <Text style={{ marginLeft: 5 }}>Pour quelqu'un</Text>
              <Icon
                type="material-community"
                name="chevron-down"
                color={colors.grey1}
                size={26}
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {destination === false && (
        <View>
          <TextInput
            style={styles.textInput}
            placeholder="De..."
            value={originQuery}
            onChangeText={handleSearchOrigin}
            ref={textInput1}
          />
          <FlatList
            data={filteredOriginLocations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
             
              <TouchableOpacity onPress={() => handleSelectOrigin(item)}>
                
                <Text style={styles.suggestionText}>
                  {item.name} - {item.type}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {destination === true && (
        <View>
          <TextInput
            style={styles.textInput}
            placeholder="Vers..."
            value={destinationQuery}
            onChangeText={handleSearchDestination}
            ref={textInput2}
          />
          <FlatList
            data={filteredDestinationLocations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelectDestination(item)}>
                <Text style={styles.suggestionText}>
                  {item.name} - {item.type}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  view2: {
    backgroundColor: colors.grey5,
    height: SCREEN_HEIGHT / 10,
    paddingBottom: 20,
  },
  view1:{
    position:"absolute",
    top:40,
    left:12,
    backgroundColor:colors.white,
    height:30,
    width:35,
    borderRadius:20,
    justifyContent:"center",
    alignItems:"center",
    marginTop:2, 
    zIndex: 10
    
  },
  view3:{
    flexDirection:"row",
    alignItems:"center",
    marginTop:2,   
    marginBottom:10,
    backgroundColor: colors.white,
    height:30,
    zIndex: 10
  },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    marginHorizontal: 10,
  },
  suggestionText: {
    padding: 10,
    borderBottomColor: colors.grey4,
    borderBottomWidth: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DestinationScreen;
