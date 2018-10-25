const request = require('request-promise');
const env = require('../shared/environment');

const verifyUserAccessToken = (userAccessToken) => {
  // First, get an app access token.
  // https://developers.facebook.com/docs/facebook-login/access-tokens/
  const requestOptions = {
    method: 'GET',
    uri: 'https://graph.facebook.com/oauth/access_token',
    qs: {
      client_id: env.get('FACEBOOK_CLIENT_ID'),
      client_secret: env.get('FACEBOOK_CLIENT_SECRET'),
      grant_type: 'client_credentials'
    },
    json: true
  };

  return request(requestOptions)
    .then((response) => {
      // Then, use the app access token to verify that the user access token
      // and ID is valid.
      // https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#checktoken
      return request({
        method: 'GET',
        uri: 'https://graph.facebook.com/debug_token',
        qs: {
          input_token: userAccessToken,
          access_token: response.access_token
        },
        json: true
      });
    });
};

const getProfile = (userAccessToken) => {
  return request({
    method: 'GET',
    url: 'https://graph.facebook.com/me',
    qs: {
      fields: 'email,first_name,last_name',
      access_token: userAccessToken
    },
    json: true
  });
};

module.exports = {
  verifyUserAccessToken,
  getProfile
};
