const { expect } = require('chai');
const sinon = require('sinon');
require('chai').use(require('sinon-chai'));
require('sinon-mongoose');
const User = require('../../models/users');
const { getUser } = require('../../controllers/users-controllers');

const fakeUserA = new User({
  email: 'hello@world.com',
  googleId: '1234',
});

const fakeUserB = new User({
  email: 'bye@world.com',
  googleId: '5678',
});

const mockResponse = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('users-controllers', () => {
  let UserMock;
  beforeEach(() => {
    UserMock = sinon.mock(User);
  });

  afterEach(() => {
    UserMock.restore();
  });

  describe('getUser()', () => {
    it('should fetch user data and return', async () => {
      const req = {
        params: {
          userId: fakeUserA.id,
        },
        user: {
          sub: fakeUserA.id,
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.params.userId).chain('exec')
        .resolves(fakeUserA);
      await getUser(req, res);

      UserMock.verify();
      expect(res.status).calledWith(200);
      expect(res.json).calledWith({
        id: fakeUserA.id,
        name: fakeUserA.name,
        googleId: fakeUserA.googleId,
        profileImgUrl: fakeUserA.profileImgUrl,
        email: fakeUserA.email,
        invites: fakeUserA.invites,
      });
    });

    it('should 400 if missing user id', async () => {
      const req = {
        params: {},
      };
      const res = mockResponse();
      await getUser(req, res);

      expect(res.status).calledWith(400);
      expect(res.json).calledWith({
        message: 'missing user id',
      });
    });

    it('should 404 if user does not exist', async () => {
      const req = {
        params: {
          userId: '293319023102',
        },
        user: {
          sub: fakeUserA.id,
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.params.userId).chain('exec')
        .resolves(undefined);
      await getUser(req, res);

      expect(res.status).calledWith(404);
      expect(res.json).calledWith({
        message: 'user does not exist',
      });
    });

    it('should 401 if the user is not authorized', async () => {
      const req = {
        params: {
          userId: fakeUserB.id,
        },
        user: {
          sub: fakeUserA.id,
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.params.userId).chain('exec')
        .resolves(fakeUserB);
      await getUser(req, res);

      expect(res.status).calledWith(401);
      expect(res.json).calledWith({
        message: 'not authorized to access this user',
      });
    });

    it('should 500 if something goes wrong on the server', async () => {
      const req = {
        params: {
          userId: fakeUserA.id,
        },
        user: {
          sub: fakeUserA.id,
        },
      };
      const res = mockResponse();
      UserMock.expects('findById').withArgs(req.params.userId).chain('exec')
        .rejects();
      await getUser(req, res);

      expect(res.status).calledWith(500);
      expect(res.json).calledWith({
        message: 'something went wrong on the server',
      });
    });
  });
});
