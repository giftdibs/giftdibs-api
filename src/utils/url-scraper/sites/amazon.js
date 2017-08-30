const getConfig = (url) => {
  if (!/amazon\.com/.test(url)) {
    return;
  }

  return {
    nameSelector: '#productTitle',
    priceSelector: '#buybox .offer-price, #newPrice .buyingPrice, #priceblock_ourprice',
    thumbnailSelector: '#landingImage',
    ignoredResources: [
      'images-na.ssl-images-amazon.com',
      'm.media-amazon.com',
      's.amazon-adsystem.com'
    ]
  };
};

module.exports = {
  getConfig
};
