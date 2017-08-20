const cheerio = require('cheerio');
const Browser = require('zombie');
const Fetch = require('zombie/lib/fetch');

// browser.debug();

// How to ignore certain resources:
// browser.pipeline.addHandler(function (browser, request) {
//   const blocked = [
//     'images-na.ssl-images-amazon.com',
//     'm.media-amazon.com',
//     's.amazon-adsystem.com'
//   ];
//   let doAbort = false;

//   blocked.forEach(function (domain) {
//     if (request.url.indexOf(domain) > -1) {
//       doAbort = true;
//     }
//   });

//   if (doAbort) {
//     return new Fetch.Response('empty', { status: 204 });
//   } else {
//     console.log('Continue with request...', request.url);
//   }
// });

// browser.on('event', (event) => {
//   console.log('[url scraper] browser.event', event);
// });

// browser.on('request', function (request) {
//   // console.log('[url scraper] browser.request', request);
// });

// browser.on('response', function (request, response) {
//   // console.log('[url scraper] browser.response', request, response);
// });

// browser.on('error', function (err) {
//   console.log('[url scraper] browser.error', err.message);
// });

// browser.on('done', function (done) {
//   console.log('[url scraper] browser.done', done);
// });

// browser.on('console', function (type, eh) {
//   console.log('[url scraper] browser.console', type, eh);
// });

const cheerioOptions = {
  lowerCaseTags: false,
  lowerCaseAttributeNames: false,
  decodeEntities: false
};

const getPageContents = (url) => {
  const scraperConfigUtil = require('./scraper-config-util');
  const config = scraperConfigUtil.getConfig(url);
  const browser = new Browser();

  browser.silent = true;
  browser.waitDuration = '30s';

  let numResources = 0;
  browser.on('request', () => ++numResources);
  browser.on('response', () => --numResources);

  // Ignore certain resource requests.
  browser.pipeline.addHandler((browser, request) => {
    let doAbort = false;

    config.ignoredResources.forEach((domain) => {
      if (request.url.includes(domain)) {
        doAbort = true;
      }
    });

    if (doAbort) {
      return new Fetch.Response('', { status: 200 });
    }
  });

  return new Promise((resolve, reject) => {
    const onBrowserLoaded = () => {
      const content = browser.html();
      const $ = cheerio.load(content, cheerioOptions);

      const name = $(config.nameSelector).text().trim();

      let price = $(config.priceSelector)
        .text()
        .trim()
        .replace('$', '')
        .replace(/ /g, '');
      price = parseFloat(price);
      price = Math.round(price);
      if (isNaN(price)) {
        price = 0;
      }

      let thumbnailSrc = $(config.thumbnailSelector).first().attr('src') || '';
      thumbnailSrc = thumbnailSrc.trim();

      const productInfo = {
        name,
        price,
        thumbnailSrc,
        url
      };

      console.log('Product info:', productInfo);

      resolve(productInfo);
    };

    function onVisit() {
      browser.wait();

      const max = 20; // 10 seconds
      let counter = 0;

      const interval = setInterval(() => {
        const maximumChecksReached = (++counter > max);
        console.log('num resources?', numResources);

        if (numResources === 0 || maximumChecksReached) {
          if (maximumChecksReached) {
            console.log('Maximum checks reached!');
          }

          clearInterval(interval);
          onBrowserLoaded();
        }
      }, 500);

      // browser
      //   .wait({ element: config.readySelector })
      //   .then(() => {
      //     console.log('done!');
      //   });
        // .wait((e) => {
        //   console.log('Waiting...');
        //   onBrowserLoaded();
        //   // const max = 100000;
        //   // let counter = 0;

        //   // const interval = setInterval(() => {
        //   //   const element = browser.document.querySelector(config.readySelector);
        //   //   const maxIterationsReached = (++counter > max);

        //   //   if (element || maxIterationsReached) {
        //   //     clearInterval(interval);

        //   //     if (maxIterationsReached) {
        //   //       console.log('Max iterations reached! Ready element not found.');
        //   //     }

        //   //     onBrowserLoaded();
        //   //   }
        //   // }, 10);
        // });
    };

    browser.visit(url, {
      runScripts: true,
      loadCSS: false,
      silent: true
    }, onVisit);
  });
};

module.exports = {
  getPageContents
};

// const phantom = require('phantom');
// const cheerio = require('cheerio');

// const cheerioOptions = {
//   lowerCaseTags: false,
//   lowerCaseAttributeNames: false,
//   decodeEntities: false
// };

// const getPageContents = (url) => {
//   console.log('request url:', url);
//   let _instance;
//   let _page;

//   return phantom
//     .create()
//     .then((instance) => {
//       console.log('instance created.');
//       _instance = instance;
//       return instance.createPage();
//     })
//     .then((page) => {
//       console.log('page created');
//       _page = page;
//       return _page;
//     })
//     .then(() => {
//       // 1. Create a list of resources that will be loaded.
//       // 2. Once the number of resources is received, fire the check.
//       // 3. (Also handle resources that take too long to load!)

//       _page.on('onResourceReceived', function (response) {
//         if (response.stage === 'end') {
//           console.log('onResourceReceived', response.url);
//         }
//       });

//       _page.on('onResourceRequested', true, function (requestData, request) {
//         const blocked = [
//           'vmss.boldchat.com',
//           'js-agent.newrelic.com',
//           'google-analytics.com',
//           'facebook.com',
//           'cdns.brsrvr.com',
//           'powerreviews.com',
//           'bing.com',
//           'res-x.com',
//           'bounceexchange.com',
//           'googletagmanager.com',
//           'Layout/MakeBreadCrumb'
//         ];

//         blocked.forEach(function (domain) {
//           if (requestData.url.indexOf(domain) > -1) {
//             request.abort();
//             console.log('aborting:', requestData.url);
//           }
//         });
//       });
//     })
//     .then(() => {
//       return _page.open(url.trim());
//     })
//     .then(() => {
//       console.log('page opened');
//       return _page.property('content');
//     })
//     .then((content) => {
//       console.log('content loaded');

//       try {
//         const $ = cheerio.load(content, cheerioOptions);
//         const name = $('#h1Title').text();
//         console.log('title?', name);
//         // const price = Math.round(parseFloat($('#ItemPrice').text().replace('$', '')));
//         _instance.exit();
//         return {
//           name
//           // price
//         };
//       } catch (err) {
//         console.log('try err:', err);
//         throw err;
//       }
//     })
//     .catch((error) => {
//       console.log('errrrrror?', error);
//       _instance.exit();
//     });
// };

// module.exports = {
//   getPageContents
// };

// // const phantom = require('phantom');
// // // const request = require('request-promise');
// // const cheerio = require('cheerio');

// // const cheerioOptions = {
// //   lowerCaseTags: false,
// //   lowerCaseAttributeNames: false,
// //   decodeEntities: false
// // };

// // const getProductDetails = (url) => {
// //   console.log('request url:', url);
// //   let _instance;
// //   let _page;
// //   return phantom
// //     .create()
// //     .then((instance) => {
// //       console.log('instance created.');
// //       _instance = instance;
// //       return instance.createPage();
// //     })
// //     .then((page) => {
// //       console.log('page created');
// //       _page = page;
// //       page.on('onResourceTimeout', (a) => {
// //         console.log('onResourceTimeout', a);
// //       });
// //       page.on('onResourceRequested', true, function (requestData, request) {
// //         const blocked = [
// //           'vmss.boldchat.com',
// //           'js-agent.newrelic.com',
// //           'google-analytics.com',
// //           'facebook.com',
// //           'cdns.brsrvr.com',
// //           'powerreviews.com',
// //           'bing.com',
// //           'curalate.com',
// //           'res-x.com',
// //           'googletagmanager.com'
// //         ];
// //         blocked.forEach(function (domain) {
// //           if (requestData.url.indexOf(domain) > -1) {
// //             request.abort();
// //             console.log('aborting:', requestData.url);
// //           }
// //         });

// //         console.log('onResourceRequested?', requestData.url);
// //       });
// //       return page.setting('resourceTimeout', 3000);
// //     })
// //     .then(() => {
// //       return _page.setting('loadImages', false);
// //     })
// //     .then(() => {
// //       return _page.open(url);
// //     })
// //     .then(() => {
// //       console.log('page opened');
// //       return _page.property('content');
// //     })
// //     .then((content) => {
// //       console.log('content loaded');
// //       const $ = cheerio.load(content, cheerioOptions);
// //       const name = $('title').text();
// //       console.log('title?', name);
// //       _instance.exit();
// //       return {
// //         name
// //       };
// //     })
// //     .catch((error) => {
// //       console.log('errrrrror?', error);
// //       _instance.exit();
// //     });
// //   // const requestOptions = {
// //   //   method: 'get',
// //   //   uri,
// //   //   transform(body) {
// //   //     return cheerio.load(body, cheerioOptions);
// //   //   },
// //   //   resolveWithFullResponse: true
// //   // };

// //   // return request(requestOptions)
// //   //   .then(($) => {
// //   //     console.log('data loaded!');
// //   //     console.log('title?', $('title').text());
// //   //     // const name = $('title').text();
// //   //     const name = $('h1').children().first().text().trim();
// //   //     // console.log('name?', name);
// //   //     return {
// //   //       name
// //   //     };
// //   //   })
// //   //   .catch((err) => {
// //   //     console.log('err?', err);
// //   //   });
// // };

// // module.exports = {
// //   getProductDetails
// // };

// const jsdom = require('jsdom');
// // jsdom.defaultDocumentFeatures = {
// //   FetchExternalResources: ['script'],
// //   ProcessExternalResources: ['script'],
// //   MutationEvents: false,
// //   QuerySelector: false
// // };
// const { JSDOM } = jsdom;
// // const { document } = jsdom;
// const request = require('request');
// // const jsdom = require('jsdom/lib/old-api.js');
// // jsdom.defaultDocumentFeatures = {
// //   FetchExternalResources: ['script'],
// //   ProcessExternalResources: ['script'],
// //   MutationEvents: '2.0',
// //   QuerySelector: false
// // };

// const getPageContents = (url) => {
//   // const options = {};
//   console.log('url?', url);

//   // return new Promise((resolve, reject) => {
//   //   request({ uri: url }, (err, response, body) => {
//   //     console.log('err?', err);
//   //     // console.log('response?', response);
//   //     // console.log('body?', body);

//   //     jsdom.env({
//   //       html: body,
//   //       resourceLoader: function (resource, callback) {
//   //         console.log('resource?', resource.url.hostname);
//   //       },
//   //       scripts: ['http://code.jquery.com/jquery-1.6.min.js'],
//   //       done: function (err, window) {
//   //         if (err) {
//   //           console.log('jsdom err?', err);
//   //         }

//   //         // Use jQuery just as in a regular HTML page
//   //         const $ = window.jQuery;

//   //         console.log('Looking for element...');

//   //         const interval = window.setInterval(() => {
//   //           console.log('elem?', $('#h1Title'));
//   //           const title = $('#h1Title').text();
//   //           console.log('title?', title);

//   //           if (title) {
//   //             window.clearInterval(interval);
//   //             resolve(body);
//   //           }
//   //         }, 500);
//   //       }
//   //     });
//   //   });
//   // });

//   return new Promise((resolve, reject) => {
//     request({ uri: url }, (err, response, body) => {
//       console.log('request err?', err);

//       // const document = jsdom.jsdom(body);
//       // const window = document.createWindow();
//       // console.log('title?', document.getElementById('h1Title').textContent);

//       // jsdom.env({
//       //   url,
//       //   html: body,
//       //   // resourceLoader: function (resource, callback) {
//       //   //   console.log('resource?', resource.url.hostname);
//       //   //   return resource.defaultFetch((err, body) => {
//       //   //     console.log('fetch err?', err);
//       //   //     callback(null, body);
//       //   //   });
//       //   // },
//       //   done: function (err, window) {
//       //     console.log('jsdom err?', err);
//       //     console.log('title?', window.document.getElementById('h1Title').textContent);
//       //   }
//       // });

//       const dom = new JSDOM(body, {
//         url: url,
//         resources: 'usable',
//         runScripts: 'dangerously'
//       });

//       let counter = 0;
//       const interval = dom.window.setInterval(() => {
//         const title = dom.window.document.getElementById('h1Title').textContent;
//         // console.log('title?', title);
//         counter++;

//         if (title) {
//           console.log('Title found, but it took ' + 10 * counter);
//           dom.window.clearInterval(interval);
//           resolve(body);
//         }
//       }, 10);

//       // console.log('response?', response);
//       // console.log('body?', body);

//       // jsdom.env({
//       //   html: body,
//       //   resourceLoader: function (resource, callback) {
//       //     console.log('resource?', resource.url.hostname);
//       //   },
//       //   scripts: ['http://code.jquery.com/jquery-1.6.min.js'],
//       //   done: function (err, window) {
//       //     if (err) {
//       //       console.log('jsdom err?', err);
//       //     }

//       //     // Use jQuery just as in a regular HTML page
//       //     const $ = window.jQuery;

//       //     console.log('Looking for element...');

//       //     const interval = window.setInterval(() => {
//       //       console.log('elem?', $('#h1Title'));
//       //       const title = $('#h1Title').text();
//       //       console.log('title?', title);

//       //       if (title) {
//       //         window.clearInterval(interval);
//       //         resolve(body);
//       //       }
//       //     }, 500);
//       //   }
//       // });
//     });
//   });

//   // return JSDOM
//   //   .fromURL(url, options)
//   //   .then(dom => {
//   //     const serialized = dom.serialize();
//   //     return serialized;
//   //   });
// };

// module.exports = {
//   getPageContents
// };

// // // const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/535.20 (KHTML, like Gecko) Chrome/19.0.1036.7 Safari/535.20';
// // const Browser = require('zombie');
// // // Browser.localhost('localhost', 3000);
// // // {
// // //   userAgent: userAgent,
// // //   debug: true,
// // //   waitDuration: '30s'
// // // }
// // const browser = new Browser();
// // const cheerio = require('cheerio');
// // const cheerioOptions = {
// //   lowerCaseTags: false,
// //   lowerCaseAttributeNames: false,
// //   decodeEntities: false
// // };

// // const getPageContents = (url) => {
// //   console.log('url?', url);
// //   return new Promise((resolve, reject) => {
// //     browser.visit(url, function () {
// //       // console.log('xpath?', browser.xpath('/html')._value.nodes[0]);

// //       // console.log('contents?', content);
// //       // console.log('title?', $('#h1Title').text());

// //       const interval = setInterval(() => {
// //         const content = browser.html();
// //         const $ = cheerio.load(content, cheerioOptions);
// //         const title = $('#h1Title').text();
// //         console.log('title?', title, $('title').text());

// //         if (title) {
// //           clearInterval(interval);
// //           resolve();
// //         }
// //       }, 500);
// //     });
// //   });
// // };

// // module.exports = {
// //   getPageContents
// // };
