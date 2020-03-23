import HelpApi from '@services/http';
import AsyncStorage from '@react-native-community/async-storage';
import {ThunkAction, ThunkDispatch} from 'redux-thunk';
import {check, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import {getUniqueId} from 'react-native-device-info';

export const initialApp: () => ThunkAction<any, any, any, any> = () => async (
  dispatch: ThunkDispatch<any, any, any>,
): Promise<void> => {
  try {
    dispatch({
      type: '@INIT_APP/LOADING',
    });
    const item = await AsyncStorage.getItem('@USER_LOGIN');
    // Geolocation.requestAuthorization();
    const result = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    console.log(result);
    switch (result) {
      case RESULTS.DENIED:
        console.log(
          'The permission has not been requested / is denied but requestable',
        );
        break;
      case RESULTS.GRANTED:
        console.log('The permission is granted');
        break;
      case RESULTS.BLOCKED:
        console.log('The permission is denied and not requestable anymore');
        break;
    }
    if (item) {
      const user = JSON.parse(item);
      HelpApi.interceptors.request.use(
        config => {
          config.headers.Authorization = `Bearer ${user.token}`;
          return config;
        },
        () => {},
      );
      Messaging()
        .getToken()
        .then(token => {
          HelpApi.post('/users/devices', {
            device_type: Platform.OS,
            fcm_token: token,
            device_id: getUniqueId(),
          });
        });
      const response = await HelpApi.get('/posts/types');
      console.log(response);
      dispatch({
        type: '@POST_UTILS/ADD_TYPES',
        payload: response.data.data,
      });
      dispatch({
        type: '@LOGIN/USER',
        payload: user,
      });
    }
    dispatch({
      type: '@INIT_APP/DONE',
    });
  } catch (e) {
    console.log(e.response || e);
    dispatch({
      type: '@INIT_APP/DONE',
    });
  }
};