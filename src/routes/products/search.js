const {
  productSearch
} = require('../../shared/product-search');

const authResponse = require('../../middleware/auth-response');

function searchProductsByKeyword(req, res, next) {
  const query = (req.query.query + '').trim();

  if (!query) {
    authResponse({
      data: {
        results: []
      }
    })(req, res, next);
    return;
  }

  productSearch(query)
    .then((results) => {
      authResponse({
        data: {
          results
        }
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  searchProductsByKeyword
};
