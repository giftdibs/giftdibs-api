const { db, sql } = require('../database');

module.exports = (req, res) => {
  db.any(sql.user.all.query)
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
