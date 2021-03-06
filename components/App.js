/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

 import React, { Component } from 'react';

 import { Screen, Spinner, Examples } from '@shoutem/ui';
 import { stringify as queryString } from 'query-string';

 import styles from './styles';
 import RecommendationsMap from './RecommendationsMap';
 import { OverlayTopics, BottomTopics } from './Topics';

 const CLIENT_ID = 'HRCVSNE35EQBBGJXWOMGBYZIVBJT5A0SJJZO3GZTK1Q3I25G';
 const CLIENT_SECRET = 'NUWM0W1OYN0HRTXRPDMUP1DXUZQK4DZ22OA4MNGMX0ZJZMLV';
 const FOURSQUARE_ENDPOINT = 'https://api.foursquare.com/v2/venues/explore';
 const API_DEBOUNCE_TIME = 2000;

 class App extends Component {
    // initial
     state = {
         mapRegion: null,
         gpsAccuracy: null,
         recommendations: [],
         lookingFor: null,
         headerLocation: null,
         last4sqCall: null
     }
     watchID = null

     // observe geolocation when app renders and stop and unmounts
     componentWillMount() {
         this.watchID = navigator.geolocation.watchPosition((position) => {
             let region = {
                 latitude: position.coords.latitude,
                 longitude: position.coords.longitude,
                 latitudeDelta: 0.00922*1.5,
                 longitudeDelta: 0.00421*1.5
             }

             this.onRegionChange(region, position.coords.accuracy);
         });
     }
     // cleanup
     componentWillUnmount() {
         navigator.geolocation.clearWatch(this.watchID);
     }
     // mapview callback for zoom/pans
     onRegionChange(region, gpsAccuracy) {
         this.fetchVenues(region);
    // change region &  movement
         this.setState({
             mapRegion: region,
             gpsAccuracy: gpsAccuracy || this.state.gpsAccuracy
         });
     }

     fetchVenues(region, lookingFor) {
         if (!this.shouldFetchVenues(lookingFor)) return;

         const query = this.venuesQuery(region, lookingFor);

         fetch(`${FOURSQUARE_ENDPOINT}?${query}`)
             .then(fetch.throwErrors)
             .then(res => res.json())
             .then(json => {
                 if (json.response.groups) {
                     this.setState({
                         recommendations: json.response.groups.reduce(
                             (all, g) => all.concat(g ? g.items : []), []
                         ),
                         headerLocation: json.response.headerLocation,
                         last4sqCall: new Date()
                     });
                 }
             })
             .catch(err => console.log(err));
     }

     shouldFetchVenues(lookingFor) {
         return lookingFor != this.state.lookingFor
              || this.state.last4sqCall === null
              || new Date() - this.state.last4sqCall > API_DEBOUNCE_TIME;
     }

     venuesQuery({ latitude, longitude }, lookingFor) {
         return queryString({
             client_id: CLIENT_ID,
             client_secret: CLIENT_SECRET,
             v: 20180323,
             ll: `${latitude}, ${longitude}`,
             llAcc: this.state.gpsAccuracy,
             section: lookingFor || this.state.lookingFor || 'food',
             limit: 10,
             openNow: 1,
             venuePhotos: 1
         });
     }

     onTopicSelect(lookingFor) {
         this.fetchVenues(this.state.mapRegion, lookingFor);

         this.setState({
             lookingFor: lookingFor
         });
     }

     render() {
         const { mapRegion, lookingFor } = this.state;

         if (mapRegion) { // find a location and rerender
             return (
                 <Screen>
                     <RecommendationsMap {...this.state}
                       onRegionChange={this.onRegionChange.bind(this)} />

                     {!lookingFor ? <OverlayTopics onTopicSelect={this.onTopicSelect.bind(this)} />
                                  : <BottomTopics onTopicSelect={this.onTopicSelect.bind(this)} />}
                 </Screen>
             );
         }else{ //spinner image
             return (
                 <Screen style={styles.centered}> //view in shoutem
                     <Spinner styleName="large" />
                 </Screen>
             );
         }
     }
 }



 export default App;
