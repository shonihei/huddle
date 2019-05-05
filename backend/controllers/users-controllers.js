const User = require('../models/users');

const getUser = async (req, res) => {
  try {
    if (!req.params || !req.params.userId || !req.user || !req.user.sub) {
      res.status(400).json({
        message: 'missing user id',
      });
    } else {
      const user = await User.findById(req.params.userId).exec();
      if (!user) {
        res.status(404).json({
          message: 'user does not exist',
        });
      } else if (user.id !== req.user.sub) {
        res.status(401).json({
          message: 'not authorized to access this user',
        });
      } else {
        const {
          id, name, googleId, profileImgUrl, email, invites,
        } = user;
        res.status(200).json({
          id, name, googleId, profileImgUrl, email, invites,
        });
      }
    }
  } catch (e) {
    res.status(500).json({
      message: 'something went wrong on the server',
    });
  }
};

module.exports = {
  getUser,
};
