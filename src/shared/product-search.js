// Credit: https://github.com/t3chnoboy/amazon-product-api

const crypto = require('crypto');
const request = require('request-promise');
const parseXML = require('xml2js').parseString;

const env = require('./environment');

function generateSignature(stringToSign, awsSecret) {
  const hmac = crypto.createHmac('sha256', awsSecret);
  const signature = hmac.update(stringToSign).digest('base64');

  return signature;
}

function sortParams(object) {
  const sorted = {};
  const keys = Object.keys(object).sort();

  for (let i = 0; i < keys.length; i++) {
    sorted[keys[i]] = object[keys[i]];
  }

  return sorted;
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function setDefaultParams(params, defaultParams) {
  for (let param in defaultParams) {
    if (typeof params[param] === 'undefined') {
      params[param] = defaultParams[param];
    }
  }

  return params;
}

function formatQueryParams(query, method, credentials) {
  let params = {};

  // Format query keys.
  for (let param in query) {
    const capitalized = capitalize(param);
    params[capitalized] = query[param];
  }

  switch (method) {
    case 'ItemSearch':
      params = setDefaultParams(params, {
        SearchIndex: 'All',
        Condition: 'All',
        ResponseGroup: 'ItemAttributes',
        Keywords: '',
        ItemPage: '1',
      });
      break;

    case 'ItemLookup':
      params = setDefaultParams(params, {
        SearchIndex: 'All',
        Condition: 'All',
        ResponseGroup: 'ItemAttributes',
        IdType: 'ASIN',
        IncludeReviewsSummary: 'True',
        TruncateReviewsAt: '1000',
        VariationPage: 'All',
      });

      // Constraints
      // If ItemId is an ASIN (specified by IdType), a search index
      // cannot be specified in the request.
      if (params['IdType'] === 'ASIN') {
        delete params['SearchIndex'];
      }

      break;

    case 'BrowseNodeLookup':
      params = setDefaultParams(params, {
        BrowseNodeId: '',
        ResponseGroup: 'BrowseNodeInfo',
      });
      break;

    case 'SimilarityLookup':
      params = setDefaultParams(params, {
        SimilarityType: 'Intersection',
        ResponseGroup: 'ItemAttributes',
      });
      break;
  }

  params['Version'] = '2013-08-01';

  params['AWSAccessKeyId'] = credentials.awsId;

  // awsTag is associated with domain, so it ought to be defineable in query.
  params['AssociateTag'] = query.awsTag || credentials.awsTag;

  params['Timestamp'] = new Date().toISOString();
  params['Service'] = 'AWSECommerceService';
  params['Operation'] = method;

  // sort
  params = sortParams(params);

  return params;
}

function generateQueryString(query, method, credentials) {
  const domain = query.domain || 'webservices.amazon.com';
  const params = formatQueryParams(query, method, credentials);

  const unsignedString = Object.keys(params)
    .map((key) => {
      return (
        key +
        '=' +
        encodeURIComponent(params[key]).replace(/[!'()*]/g, (c) => {
          return '%' + c.charCodeAt(0).toString(16);
        })
      );
    })
    .join('&');

  const signature = encodeURIComponent(
    generateSignature(
      'GET\n' + domain + '\n/onca/xml\n' + unsignedString,
      credentials.awsSecret
    )
  ).replace(/\+/g, '%2B');

  const queryString = `https://${domain}/onca/xml?${unsignedString}&Signature=${signature}`;

  return queryString;
}

function formatNumber(num) {
  return `${num}`.slice(0, -2) * 1;
}

function getPrice(item) {
  if (
    item.OfferSummary &&
    item.OfferSummary[0].LowestNewPrice &&
    item.OfferSummary[0].LowestNewPrice[0].Amount
  ) {
    return formatNumber(item.OfferSummary[0].LowestNewPrice[0].Amount[0]);
  }

  if (item.Offers && item.Offers[0].Offer && item.Offers[0].Offer[0].Amount) {
    return formatNumber(item.Offers[0].Offer[0].Amount[0]);
  }

  // No offers available. Return list price.
  if (item.ItemAttributes[0].ListPrice) {
    return formatNumber(item.ItemAttributes[0].ListPrice[0].Amount[0]);
  }

  return 0;
}

function getImage(item) {
  if (item.LargeImage) {
    return item.LargeImage[0].URL[0];
  }

  return '';
}

async function runQuery(type, query, credentials) {
  const url = generateQueryString(query, type, credentials);

  return request(url).then((body) => {
    return new Promise((resolve, reject) => {
      parseXML(body, (err, parsed) => {
        if (err) {
          reject(err);
          return;
        }

        const results = parsed[`${type}Response`];
        const itemResults = results.Items[0].Item;

        let items;
        if (itemResults) {
          items = itemResults
            .map((item) => {
              return {
                name: item.ItemAttributes[0].Title[0],
                imageUrl: getImage(item),
                price: getPrice(item),
                url: item.DetailPageURL[0],
              };
            })
            .filter((item) => item.price && item.imageUrl);
        }

        resolve(items || []);
      });
    });
  });
}

function productSearch(keywords) {
  return runQuery(
    'ItemSearch',
    {
      // condition: 'New',
      availability: 'Available',
      keywords,
      includeReviewsSummary: false,
      responseGroup: 'ItemAttributes,Images,Offers',
    },
    {
      awsId: env.get('AWS_ADVERTISING_API_ACCESS_KEY'),
      awsSecret: env.get('AWS_ADVERTISING_API_SECRET'),
      awsTag: env.get('AWS_ADVERTISING_API_ASSOCIATE_TAG'),
    }
  );
}

function findSimilar(asin) {
  return runQuery(
    'SimilarityLookup',
    {
      itemId: asin,
      responseGroup: 'ItemAttributes,Images,Offers',
    },
    {
      awsId: env.get('AWS_ADVERTISING_API_ACCESS_KEY'),
      awsSecret: env.get('AWS_ADVERTISING_API_SECRET'),
      awsTag: env.get('AWS_ADVERTISING_API_ASSOCIATE_TAG'),
    }
  );
}

module.exports = {
  findSimilar,
  productSearch,
};
