const express = require('express');

const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const WishList = require('../database/models/wish-list');
const { confirmUserOwnsWishList } = require('../middleware/confirm-user-owns-wish-list');
const { ExternalUrlNotFoundError } = require('../shared/errors');
const urlScraper = require('../utils/url-scraper');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    err.code = 501;
    err.status = 400;
    err.message = 'External URL update validation failed.';
  }

  next(err);
}

const updateExternalUrl = [
  confirmUserOwnsWishList,

  (req, res, next) => {
    let _wishList;
    WishList
      .getGiftById(req.params.wishListId, req.params.giftId)
      .then((result) => {
        _wishList = result.wishList;

        const externalUrl = result.gift.externalUrls.id(req.params.externalUrlId);

        if (externalUrl) {
          return externalUrl;
        }

        return Promise.reject(new ExternalUrlNotFoundError());
      })
      .then((externalUrl) => {
        // First, update the external url document.
        externalUrl.update(req.body);

        // Check if the user wants to scrape the product url.
        if (req.query.scrapeUrl === undefined) {
          return externalUrl;
        }

        // const isUrlCurrent = (
        //   externalUrl.dateScraped &&
        //   externalUrl.dateScraped.getTime() > urlScraper.dateScrapedRecommended
        // );

        // If the url doesn't need to be scraped, short-circuit.
        // if (isUrlCurrent) {
        //   return externalUrl;
        // }


        // TRY THIS:
        // https://stackoverflow.com/questions/13371113/how-can-i-execute-a-node-js-module-as-a-child-process-of-a-node-js-program

        const cp = require('child_process');
        const child = cp.fork('./scripts/scrape-url');

        return new Promise((resolve) => {
          child.on('message', (message) => {
            console.log('received:', message);
            resolve(message);
          });
      
          child.send({ externalUrl });
        });
    
        // child.on('exit', () => {
        //   console.log('child exit');
        //   next();
        // });
    
        // child.on('message', (message) => {
        //   console.log('received:', message);
        //   next();
        // });
    
        // child.stdout.on('data', (data) => {
        //   console.log('stdout', data.toString());
        // });
    
        // child.stderr.on('data', (data) => {
        //   console.log('stderr: ' + data);
        // });
    
        // Send child process some work
        // child.send({ req });

        // Attempt to call with another process.
        // const { exec } = require('child_process');
        // return new Promise((resolve) => {
        //   exec(`node ./scripts/scrape-url.js --url=${externalUrl.url}`, (error, stdout, stderr) => {
        //     if (error) {
        //       console.error(`exec error: ${error}`);
        //       return;
        //     }
        //     console.log(`stdout: ${stdout}`);
        //     console.log(`stderr: ${stderr}`);
        //     resolve(externalUrl);
        //   });
        // });

        // Scrape the url's contents and update.
        // return urlScraper
        //   .getProductDetails([
        //     externalUrl.url
        //   ])
        //   .then((productInfoArray) => {
        //     const productInfo = productInfoArray[0];

        //     // Only update the external url if a price was found.
        //     if (productInfo.price) {
        //       externalUrl.price = productInfo.price;
        //       externalUrl.dateScraped = new Date();
        //     }

        //     return externalUrl;
        //   });
      })
      .then((externalUrl) => {
        return _wishList
          .save()
          .then(() => externalUrl);
      })
      .then((externalUrl) => {
        authResponse({
          externalUrl: externalUrl,
          message: 'External URL successfully updated.'
        })(req, res, next);
      })
      .catch((err) => handleError(err, next));
  }
];

const router = express.Router();
router.use(authenticateJwt);
router.route('/wish-lists/:wishListId/gifts/:giftId/external-urls/:externalUrlId')
  .patch(updateExternalUrl);

module.exports = {
  middleware: {
    updateExternalUrl
  },
  router
};
