const { expect } = require('chai');
const sinon = require('sinon');
require('chai').use(require('sinon-chai'));
require('sinon-mongoose');
const mongoose = require('mongoose');
const { createNewRoom, getRooms } =
  require('../../controllers/rooms-controllers');

const mockResponse = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('room-controllers', () => {
  const fakeUser = {
    _id: 1,
    id: 1,
    name: 'Joe Schmoe',
  };
  const fakeRoom = {
    id: 10,
    name: "joe's room",
    slug: 'joes-room',
    owner: fakeUser,
    members: [fakeUser],
  };

  let UserMock;
  let RoomMock;
  let roomSaveStub;
  beforeEach(() => {
    const User = mongoose.model('User');
    UserMock = sinon.mock(User);
    const Room = mongoose.model('Room');
    RoomMock = sinon.mock(Room);
    roomSaveStub = sinon.stub(Room.prototype, 'save');
  });

  afterEach(() => {
    UserMock.restore();
    RoomMock.restore();
    roomSaveStub.restore();
  });

  describe('createNewRoom()', () => {
    it('should create a new room', async () => {
      const req = {
        user: {
          sub: 1,
        },
        body: {
          name: "joe's room",
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub)
        .chain('exec').resolves(fakeUser);
      RoomMock.expects('find')
        .withArgs({ owner: fakeUser, slug: 'joes-room' }).chain('exec')
        .resolves([]);
      roomSaveStub.resolves(fakeRoom);

      await createNewRoom(req, res);
      expect(res.status).calledWith(201);
      expect(res.json).calledWith({
        name: fakeRoom.name,
        slug: 'joes-room',
        owner: fakeRoom.owner.id,
        members: fakeRoom.members.map(member => member.id),
      });
    });

    it('should 400 if room already exists', async () => {
      const req = {
        user: {
          sub: 1,
        },
        body: {
          name: "joe's room",
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .resolves(fakeUser);
      RoomMock.expects('find')
        .withArgs({ owner: fakeUser, slug: 'joes-room' }).chain('exec')
        .resolves([fakeRoom]);
      await createNewRoom(req, res);
      expect(res.status).calledWith(400);
      expect(res.json).calledWith({
        message: 'room with this name already exists',
      });
    });

    it('should 400 if params are missing', async () => {
      const req = {
        user: {
          sub: 1,
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub)
        .chain('exec').resolves(fakeUser);
      await createNewRoom(req, res);
      expect(res.status).calledWith(400);
      expect(res.json).calledWith({
        message: 'missing required parameters',
      });
    });

    it('should 404 if user does not exist', async () => {
      const req = {
        user: {
          sub: 1,
        },
        body: {
          name: "joe's room",
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .resolves(undefined);
      await createNewRoom(req, res);
      expect(res.status).calledWith(404);
      expect(res.json).calledWith({
        message: 'user does not exist',
      });
    });

    it('should 500 if save fails', async () => {
      const req = {
        user: {
          sub: 1,
        },
        body: {
          name: "joe's room",
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .resolves(fakeUser);
      RoomMock.expects('find')
        .withArgs({ owner: fakeUser, name: req.body.name }).chain('exec')
        .resolves(undefined);
      roomSaveStub.rejects();
      await createNewRoom(req, res);

      expect(res.status).calledWith(500);
      expect(res.json).calledWith({
        message: 'something went wrong on the server',
      });
    });
  });

  describe('getRooms()', () => {
    it('should get a list of rooms', async () => {
      const req = {
        user: {
          sub: 1,
        },
      };
      const res = mockResponse();
      const rooms = [
        {
          id: 1, name: 'room 1', slug: 'room-1', owner: fakeUser,
        },
        {
          id: 2, name: 'room 2', slug: 'room-2', owner: fakeUser,
        },
        {
          id: 3, name: 'room 3', slug: 'room-3', owner: fakeUser,
        },
      ];

      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .resolves(fakeUser);
      RoomMock.expects('find').withArgs({ members: fakeUser._id }).chain('exec')
        .resolves(rooms);
      await getRooms(req, res);
      expect(res.status).calledWith(200);
      expect(res.json).calledWith({ rooms });
    });

    it('should 404 if the user does not exist', async () => {
      const req = {
        user: {
          sub: 1,
        },
      };

      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .resolves(undefined);
      await getRooms(req, res);
      expect(res.status).calledWith(404);
      expect(res.json).calledWith({
        message: 'user does not exist',
      });
    });

    it('should 500 if find fails', async () => {
      const req = {
        user: {
          sub: 1,
        },
      };
      let res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .rejects();
      await getRooms(req, res);
      expect(res.status).calledWith(500);
      expect(res.json).calledWith({
        message: 'something went wrong on the server',
      });

      UserMock.restore();
      res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .resolves(fakeUser);
      RoomMock.expects('find').withArgs({ owner: fakeUser }).chain('exec')
        .rejects();
      await getRooms(req, res);
      expect(res.status).calledWith(500);
      expect(res.json).calledWith({
        message: 'something went wrong on the server',
      });
    });
  });
});
