const { expect } = require('chai');
const mongoose = require('mongoose');
const sinon = require('sinon');
require('chai').use(require('sinon-chai'));
require('sinon-mongoose');
const { createNewInvite } =
  require('../../controllers/invites-controllers');

const mockResponse = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

const User = mongoose.model('User');
const Room = mongoose.model('Room');
const Invite = mongoose.model('Invite');

describe('invites-controllers', () => {
  const fakeUserA = {
    id: 1,
    name: 'Joe Schmoe',
  };
  const fakeUserB = {
    id: 2,
    name: 'Sally Schmoe',
    invites: [],
  };
  const fakeRoom = {
    id: 10,
    name: "joe's room",
    slug: 'joes-room',
    owner: fakeUserA,
    members: [],
  };
  const fakeInvite = {
    from: fakeUserA,
    to: fakeUserB,
    status: 'pending',
  };

  let UserMock;
  let RoomMock;
  let InviteMock;
  beforeEach(() => {
    UserMock = sinon.mock(User);
    RoomMock = sinon.mock(Room);
    InviteMock = sinon.mock(Invite);
  });

  afterEach(() => {
    UserMock.restore();
    RoomMock.restore();
    InviteMock.restore();
  });

  describe('createNewInvite()', () => {
    it('should create a new invite and set it to pending', async () => {
      const req = {
        user: {
          sub: 1,
        },
        body: {
          room: 10, // room with id of 10
          to: 2, // user with id of 3
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .resolves(fakeUserA);
      UserMock.expects('findById').withArgs(req.body.to).chain('populate')
        .withArgs('invites')
        .chain('exec')
        .resolves(fakeUserB);
      RoomMock.expects('findById').withArgs(req.body.room).chain('exec')
        .resolves(fakeRoom);
      const inviteSaveStub = sinon.stub(Invite.prototype, 'save');
      inviteSaveStub.resolves(fakeInvite);
      await createNewInvite(req, res);
      UserMock.verify();
      RoomMock.verify();
      expect(res.status).calledWith(201);
      expect(res.json).calledWith({});
    });

    it('should 400 if an invite already exists', async () => {
      throw new Error('not implemented');
    });

    it('should 404 if user does not exist', async () => {
      throw new Error('not implemented');
    });

    it('should 500 if something goes wrong with db', async () => {
      throw new Error('not implemented');
    });
  });
});
