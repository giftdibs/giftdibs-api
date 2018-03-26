function formatPrivacyRequest(req) {
  const privacyType = req.body.privacyType;
  const privacyAllow = req.body.privacyAllow;

  if (!privacyType) {
    return {
      type: 'followers',
      _allow: []
    };
  }

  // Format the privacy request into something the database can use.
  const privacy = {
    type: privacyType,
    _allow: []
  };

  if (privacyType === 'custom') {
    if (privacyAllow) {
      const allowedIds = privacyAllow.split(',').map((userId) => {
        return userId.trim();
      });

      if (allowedIds.length > 0) {
        privacy._allow = allowedIds;
      }
    }
  }

  return privacy;
}

module.exports = {
  formatPrivacyRequest
};
