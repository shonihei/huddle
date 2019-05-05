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
        .populate({ path: 'invites', populate: { path: 'from room' } }).exec();
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
            invite => invite.from.id === fromUser.id &&
                      invite.room.id === room.id,
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
            res.status(200).json({});
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

const updateInviteStatus = async (req, res) => {
  try {
    if (!req.body || !req.params.inviteId || !req.body.status) {
      res.status(400).json({
        message: 'missing required parameters',
      });
    } else if (req.body.status !== 'pending' &&
               req.body.status !== 'accepted' &&
               req.body.status !== 'rejected') {
      res.status(400).json({
        message: 'status is malformed',
      });
    } else {
      const user = await User.findById(req.user.sub).exec();
      const invite = await Invite.findById(req.params.inviteId)
        .populate({ path: 'to room' }).exec();
      if (invite.to.id !== user.id) {
        res.status(401).json({
          message: 'not authorized to update invitation status',
        });
      } else if (invite.status === req.body.status) {
        res.status(400).json({
          message: `invitation status is already set to '${req.body.status}'`,
        });
      } else {
        if (req.body.status === 'accepted') {
          const room = await Room.findById(invite.room.id).exec();
          room.members.push(user);
          await room.save();
        }
        invite.status = req.body.status;
        await invite.save();
        res.status(200).json({});
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
  updateInviteStatus,
};
