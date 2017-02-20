const { db } = require('../database');

module.exports = (req, res) => {
  db.any('select * from users')
    .then((data) => {
      res.json({
        message: 'Success!',
        data
      });
    })
    .catch(error => {
      res.status(400).json({
        message: 'Bad request',
        error
      });
    });
};
