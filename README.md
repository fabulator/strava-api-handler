# Strava API handler

[![npm version](https://badge.fury.io/js/strava-api-handler.svg)](https://badge.fury.io/js/strava-api-handler)
[![renovate-app](https://img.shields.io/badge/renovate-app-blue.svg)](https://renovateapp.com/) 
[![Known Vulnerabilities](https://snyk.io/test/github/fabulator/strava-api-handler/badge.svg)](https://snyk.io/test/github/fabulator/strava-api-handler)
[![codecov](https://codecov.io/gh/fabulator/strava-api-handler/branch/master/graph/badge.svg)](https://codecov.io/gh/fabulator/strava-api-handler) 
[![travis](https://travis-ci.org/fabulator/strava-api-handler.svg?branch=master)](https://travis-ci.org/fabulator/strava-api-handler)


This an unofficial handler for Strava API. Methods for getting, creating and filtering activities are incorporated in API class, other endpoints can be called manually. 

## How it works
It uses a library for handling REST API request - [rest-api-handler](https://github.com/fabulator/rest-api-handler). It is based on browser fetch feature so it needs polyfill.

## How to use

Install npm library:

```
npm install strava-api-handler --save
```

Include fetch polyfill. I recommend cross-fetch:

```javascript
import 'cross-fetch/polyfill';
```

### Authentize

You need to use oAuth. First get login url and then autentize through the code.

```javascript
const { Api, ApiScope } = require('./../dist');

(async () => {
    const api = new Api('CLIENT_ID', 'CLIENT_SECRET');

    // generate login link
    console.log(api.getLoginUrl('http://developers.strava.com', [ApiScope.READ_ALL]));

    // use it and get code
    const token = await api.requestToken({ code: 'AUTH_CODE', grant_type: 'authorization_code' });

    // this is token
    console.log(token);

    // later

    // save it and use later
    api.setAccessToken(token.access_token);
})();

```

### Getting workout/s
To get single activity use getActivity method:

```javascript
const activity = await api.getActivity(775131509);
```

Search for activities:

```javascript
const { DateTime } = require('luxon');

const activities = await api.getActivities({
    after: DateTime.fromObject({
        year: 2018,
        month: 3,
        day: 1,
    }),
    per_page: 2,
});
console.log(activities);
```
