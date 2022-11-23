const { findSimilar } = require('../../shared/product-search');

const authResponse = require('../../middleware/auth-response');

function findSimilarProductsByAsin(req, res, next) {
  const asin = (req.query.asin + '').trim();

  if (!asin) {
    authResponse({
      data: {
        results: [],
      },
    })(req, res, next);
    return;
  }

  findSimilar(asin)
    .then((results) => {
      authResponse({
        data: {
          results,
        },
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  findSimilarProductsByAsin,
};
