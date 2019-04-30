const slugify = require('slugify');
const Room = require('../models/rooms');
const User = require('../models/users');

/**
 * Gets a list of rooms that the user is registered in
 */
const getRooms = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).exec();
    if (!user) {
      res.status(404).json({
        message: 'user does not exist',
      });
    } else {
      try {
        const rooms = await Room.find({ members: user._id }).populate().exec();
        res.status(200).json({
          rooms,
        });
      } catch (e) {
        res.status(500).json({
          message: 'something went wrong on the server',
        });
      }
    }
  } catch (e) {
    res.status(500).json({
      message: 'something went wrong on the server',
    });
  }
};

const createNewRoom = async (req, res) => {
  if (!req.body || !req.body.name) {
    res.status(400).json({
      message: 'missing required parameters',
    });
  } else {
    try {
      const user = await User.findById(req.user.sub).exec();
      if (!user) {
        res.status(404).json({
          message: 'user does not exist',
        });
      } else {
        try {
          const slug = slugify(req.body.name, { remove: /[*+~.()'"!:@]/g });
          const existingRoom =
            await Room.find({ owner: user, slug }).exec();
          if (existingRoom.length !== 0) {
            res.status(400).json({
              message: 'room with this name already exists',
            });
          } else {
            const room = new Room({
              name: req.body.name,
              slug,
              owner: user,
              members: [user],
            });
            try {
              const newRoom = await room.save();
              res.status(201).json({
                name: newRoom.name,
                slug: newRoom.slug,
                owner: newRoom.owner.id,
                members: newRoom.members.map(member => member.id),
              });
            } catch (e) {
              res.status(500).json({
                message: 'something went wrong on the server',
              });
            }
          }
        } catch (e) {
          res.status(500).json({
            message: 'something went wrong on the server',
          });
        }
      }
    } catch (e) {
      res.status(500).json({
        message: 'something went wrong on the server',
      });
    }
  }
};

module.exports = {
  getRooms,
  createNewRoom,
};
