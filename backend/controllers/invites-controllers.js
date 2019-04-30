const Room = require('../models/rooms');
const User = require('../models/users');
const Invite = require('../models/invites');

const createNewInvite = async (req, res) => {
  try {
    if (!req.body || !req.body.room || !req.body.to) {
      res.status(400).json({
        message: 'missing required parameters',
      });
    } else {
      const fromUser = await User.findById(req.user.sub).exec();
      const toUser = await User.findById(req.body.to)
        .populate('invites').exec();
      if (!fromUser || !toUser) {
        res.status(404).json({
          message: 'user does not exist',
        });
      } else {
        const room = await Room.findById(req.body.room).exec();
        if (room.owner.id !== fromUser.id) {
          res.status(401).json({
            message: 'not authorized to send invites',
          });
        } else {
          const filteredInvites = toUser.invites.filter(
            invite => invite.from.toString() === fromUser.id &&
                      invite.room.toString() === room.id,
          );
          if (filteredInvites.length !== 0) {
            res.status(400).json({
              message: 'invite already exists',
            });
          } else {
            const newInvite = new Invite({
              from: fromUser,
              to: toUser,
              room,
            });
            await newInvite.save();
            res.status(201).json({});
          }
        }
      }
    }
  } catch (e) {
    res.status(500).json({
      message: 'something went wrong on the server',
    });
  }
};

module.exports = {
  createNewInvite,
};
