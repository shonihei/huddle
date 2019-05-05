const { expect } = require('chai');
const mongoose = require('mongoose');
const sinon = require('sinon');
require('chai').use(require('sinon-chai'));
require('sinon-mongoose');
const { createNewInvite, updateInviteStatus } =
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
  const fakeUserA = new User({
    name: 'Joe Schmoe',
  });
  const fakeUserB = new User({
    name: 'Sally Schmoe',
    invites: [],
  });
  const fakeRoom = {
    id: 10,
    name: "joe's room",
    slug: 'joes-room',
    owner: fakeUserA,
    members: [],
  };
  const fakeInvite = new Invite({
    from: fakeUserA,
    to: fakeUserB,
    status: 'pending',
  });

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
        .withArgs({ path: 'invites', populate: { path: 'from room' } })
        .chain('exec')
        .resolves(fakeUserB);
      RoomMock.expects('findById').withArgs(req.body.room).chain('exec')
        .resolves(fakeRoom);
      const inviteSaveStub = sinon.stub(Invite.prototype, 'save');
      inviteSaveStub.resolves(fakeInvite);
      await createNewInvite(req, res);
      UserMock.verify();
      RoomMock.verify();
      expect(res.status).calledWith(200);
      expect(res.json).calledWith({});
      inviteSaveStub.restore();
    });

    it('should 400 if an invite already exists', async () => {
      const fakeUserC = {
        id: 3,
        name: 'David Schmoe',
        invites: [],
      };
      const fakeInviteToC = {
        from: fakeUserA,
        to: fakeUserC,
        room: fakeRoom,
        status: 'pending',
      };
      fakeUserC.invites.push(fakeInviteToC); // simulate invitation to C

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
        .withArgs({ path: 'invites', populate: { path: 'from room' } })
        .chain('exec')
        .resolves(fakeUserC);
      RoomMock.expects('findById').withArgs(req.body.room).chain('exec')
        .resolves(fakeRoom);
      await createNewInvite(req, res);

      UserMock.verify();
      RoomMock.verify();
      expect(res.status).calledWith(400);
      expect(res.json).calledWith({
        message: 'invite already exists',
      });
    });

    it('should 404 if user does not exist', async () => {
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
        .resolves(undefined);
      UserMock.expects('findById').withArgs(req.body.to).chain('populate')
        .withArgs({ path: 'invites', populate: { path: 'from room' } })
        .chain('exec')
        .resolves(undefined);
      await createNewInvite(req, res);

      UserMock.verify();
      InviteMock.verify();
      expect(res.status).calledWith(404);
      expect(res.json).calledWith({
        message: 'user does not exist',
      });
    });

    it('should 400 if parameters are missing', async () => {
      const req = {};
      const res = mockResponse();
      await createNewInvite(req, res);

      expect(res.status).calledWith(400);
      expect(res.json).calledWith({
        message: 'missing required parameters',
      });
    });

    it('should 500 if something goes wrong with db', async () => {
      const req = {
        user: {
          sub: 1,
        },
        body: {
          room: 10,
          to: 2,
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .rejects();
      await createNewInvite(req, res);

      UserMock.verify();
      expect(res.status).calledWith(500);
      expect(res.json).calledWith({
        message: 'something went wrong on the server',
      });
    });
  });

  describe('updateInviteStatus()', () => {
    it('should update the status of an invite', async () => {
      const fakeInviteToModify = new Invite({
        from: fakeUserA,
        to: fakeUserB,
        status: 'pending',
      });

      const req = {
        user: {
          sub: 1,
        },
        body: {
          status: 'rejected',
        },
        params: {
          inviteId: 20,
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .resolves(fakeUserB);
      InviteMock.expects('findById').withArgs(req.params.inviteId)
        .chain('populate')
        .withArgs({ path: 'to room' })
        .chain('exec')
        .resolves(fakeInviteToModify);
      const inviteSaveStub = sinon.stub(Invite.prototype, 'save');
      inviteSaveStub.resolves({});
      await updateInviteStatus(req, res);

      UserMock.verify();
      InviteMock.verify();
      expect(res.status).calledWith(200);
      expect(res.json).calledWith({});
      expect(inviteSaveStub.called).to.be.true;
      expect(fakeInviteToModify.status).to.equal('rejected');
      inviteSaveStub.restore();
    });

    it('should modify room membership if invite is accepted', async () => {
      const req = {
        user: {
          sub: 1,
        },
        body: {
          status: 'accepted',
        },
        params: {
          inviteId: 20,
        },
      };
      const res = mockResponse();
      const A = new User({
        googleId: '12345',
        email: 'hello@world.com',
      });
      const B = new User({
        googleId: '6789',
        email: 'goodbye@world.com',
      });
      const room = new Room({
        name: 'some room',
        slug: 'some-room',
        members: [],
      });
      const invite = new Invite({
        from: A,
        to: B,
        room,
        status: 'pending',
      });
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .resolves(B);
      InviteMock.expects('findById').withArgs(req.params.inviteId)
        .chain('populate')
        .withArgs({ path: 'to room' })
        .chain('exec')
        .resolves(invite);
      RoomMock.expects('findById').withArgs(invite.room.id).chain('exec')
        .resolves(room);
      const inviteSaveStub = sinon.stub(Invite.prototype, 'save');
      inviteSaveStub.resolves(invite);
      const roomSaveStub = sinon.stub(Room.prototype, 'save');
      roomSaveStub.resolves(room);
      await updateInviteStatus(req, res);

      UserMock.verify();
      InviteMock.verify();
      expect(res.status).calledWith(200);
      expect(res.json).calledWith({});
      expect(inviteSaveStub.called).to.be.true;
      expect(room.members.length).to.equal(1);
      inviteSaveStub.restore();
      roomSaveStub.restore();
    });

    it('should 400 if params are missing', async () => {
      const req = {
        user: {
          sub: 1,
        },
        body: { },
        params: {
          inviteId: 20,
        },
      };
      const res = mockResponse();
      await updateInviteStatus(req, res);
      expect(res.status).calledWith(400);
      expect(res.json).calledWith({
        message: 'missing required parameters',
      });
    });

    it('should 400 if status is malformed', async () => {
      const req = {
        user: {
          sub: 1,
        },
        body: {
          status: 'this-is-malformed',
        },
        params: {
          inviteId: 20,
        },
      };
      const res = mockResponse();
      await updateInviteStatus(req, res);

      expect(res.status).calledWith(400);
      expect(res.json).calledWith({
        message: 'status is malformed',
      });
    });

    it('should 401 if user is not the invitee', async () => {
      const req = {
        user: {
          sub: 1,
        },
        body: {
          status: 'accepted',
        },
        params: {
          inviteId: 20,
        },
      };
      const fakeInviteToC = new Invite({
        from: fakeUserB,
        to: fakeUserA,
        status: 'pending',
      });
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .resolves(fakeUserB);
      InviteMock.expects('findById').withArgs(req.params.inviteId)
        .chain('populate')
        .withArgs({ path: 'to room' })
        .chain('exec')
        .resolves(fakeInviteToC);
      await updateInviteStatus(req, res);

      UserMock.verify();
      InviteMock.verify();
      expect(res.status).calledWith(401);
      expect(res.json).calledWith({
        message: 'not authorized to update invitation status',
      });
    });

    it('should 400 if status is already set to the requested', async () => {
      const req = {
        user: {
          sub: 1,
        },
        body: {
          status: 'pending',
        },
        params: {
          inviteId: 20,
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .resolves(fakeUserB);
      InviteMock.expects('findById').withArgs(req.params.inviteId)
        .chain('populate')
        .withArgs({ path: 'to room' })
        .chain('exec')
        .resolves(fakeInvite);
      await updateInviteStatus(req, res);

      UserMock.verify();
      InviteMock.verify();
      expect(res.status).calledWith(400);
      expect(res.json).calledWith({
        message: `invitation status is already set to '${req.body.status}'`,
      });
    });

    it('should 500 if something goes wrong on the server', async () => {
      const req = {
        user: {
          sub: 1,
        },
        body: {
          status: 'pending',
        },
        params: {
          inviteId: 20,
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.user.sub).chain('exec')
        .rejects();
      await updateInviteStatus(req, res);

      UserMock.verify();
      expect(res.status).calledWith(500);
      expect(res.json).calledWith({
        message: 'something went wrong on the server',
      });
    });
  });
});
