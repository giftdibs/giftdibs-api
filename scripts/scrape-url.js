const urlScraper = require('../src/utils/url-scraper');

process.on('message', (message) => {
  const url = message.url;
  console.log('scrape url: ', url);

  urlScraper
    .getProductDetails([ url ])
    .then((productInfoArray) => {
      console.log('product info scraped. done.', productInfoArray[0].name);
      process.send(productInfoArray);
      process.exit();
    })
    .catch(() => {
      process.exit();
    });
});
// const authResponse = require('../src/middleware/auth-response');
// const authenticateJwt = require('../src/middleware/authenticate-jwt');
// const WishList = require('../src/database/models/wish-list');
// const { confirmUserOwnsWishList } = require('../src/middleware/confirm-user-owns-wish-list');
// const { ExternalUrlNotFoundError } = require('../src/shared/errors');
// const urlScraper = require('../src/utils/url-scraper');

// function handleError(err, next) {
//   if (err.name === 'ValidationError') {
//     err.code = 501;
//     err.status = 400;
//     err.message = 'External URL update validation failed.';
//   }

//   next(err);
// }

// process.on('message', (message) => {
//   const req = message.req;
//   let _wishList;

//   WishList
//     .getGiftById(req.params.wishListId, req.params.giftId)
//     .then((result) => {
//       console.log('getting wishlist....');
//       _wishList = result.wishList;

//       const externalUrl = result.gift.externalUrls.id(req.params.externalUrlId);

//       if (externalUrl) {
//         return externalUrl;
//       }

//       return Promise.reject(new ExternalUrlNotFoundError());
//     })
//     .then((externalUrl) => {
//       externalUrl.update(req.body);

//       // Check if the user wants to scrape the product url.
//       if (req.query.scrapeUrl === undefined) {
//         return externalUrl;
//       }

//       urlScraper
//         .getProductDetails([ externalUrl.url ])
//         .then((productInfoArray) => {
//           process.send(productInfoArray);
//           process.exit();
//         });
//     });
// });

// // process.send({ foo: 'bar' });
