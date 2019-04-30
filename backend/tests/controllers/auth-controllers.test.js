const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const sinon = require('sinon');
require('chai').use(require('sinon-chai'));
require('sinon-mongoose');
const { google } = require('googleapis');
const { getAuthStatus, exchangeAuthorization } =
  require('../../controllers/auth-controllers');

const mockResponse = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

const mockRequest = () => ({
  user: {
    sub: 1,
  },
});

describe('auth-controllers', () => {
  describe('exachangeAuthorization()', () => {
    const fakeTokens = {
      tokens: {
        id_token: 'this-is-an-id-token',
      },
    };
    const fakePayload = {
      name: 'joe schmoe',
      family_name: 'schmoe',
      given_name: 'joe',
      sub: '1',
      picture: 'https//picture.com/joe',
      email: 'joeschmoe@joe.com',
      email_verified: true,
    };
    const fakeUpdate = {
      name: {
        displayName: fakePayload.name,
        familyName: fakePayload.family_name,
        givenName: fakePayload.given_name,
      },
      googleId: fakePayload.sub,
      profileImgUrl: fakePayload.picture,
      email: fakePayload.email,
      emailVerified: fakePayload.email_verified,
      tokens: fakeTokens.tokens,
    };
    const queryOpts = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    };

    let UserMock;
    let jwtStub;
    beforeEach(() => {
      const User = mongoose.model('User');
      UserMock = sinon.mock(User);
      jwtStub = sinon.stub(jwt, 'sign');
    });

    afterEach(() => {
      UserMock.restore();
      jwtStub.restore();
    });

    it('should return 400 if authorization is missing', async () => {
      const req = {
        body: {},
      };
      const res = mockResponse();
      await exchangeAuthorization(req, res);
      expect(res.status).calledWith(400);
      expect(res.json).calledWith({
        message: 'missing authorization code',
      });
    });

    it('should exchange code and create a new user', async () => {
      const req = {
        body: {
          authorization_code: 'this-is-an-authorization-code',
        },
      };
      const res = mockResponse();

      UserMock.expects('findOneAndUpdate')
        .withArgs({ googleId: fakePayload.sub }, fakeUpdate, queryOpts)
        .chain('exec').resolves({
          name: 'Joe Schmoe',
        });
      jwtStub.returns('this is a signed jwt');

      const getTokenStub = sinon.stub(google.auth.OAuth2.prototype, 'getToken')
        .resolves(fakeTokens);
      const verifyIdTokenStub =
        sinon.stub(google.auth.OAuth2.prototype, 'verifyIdToken')
          .resolves({ payload: fakePayload });

      await exchangeAuthorization(req, res);

      expect(getTokenStub).calledWith(req.body.authorization_code);
      expect(verifyIdTokenStub)
        .calledWith({ idToken: fakeTokens.tokens.id_token });
      expect(res.status).calledWith(200);
      expect(res.json).calledWith({
        expiresIn: 3 * (24 * 60 * 60),
        user: {
          email: 'joeschmoe@joe.com',
          name: 'Joe Schmoe',
          profileImgUrl: 'https//picture.com/joe',
          token: 'this is a signed jwt',
        },
      });

      getTokenStub.restore();
      verifyIdTokenStub.restore();
    });
  });

  describe('getAuthStatus()', () => {
    const fakeUser = {
      id: 1,
      name: 'Joe Schmoe',
      email: 'joeschmoe@joe.com',
      profileImgUrl: 'http://joejoe.com/pic/smile.jpg',
    };
    const fakeToken = 'this is a signed jwt';

    let UserMock;
    let jwtStub;
    beforeEach(() => {
      const User = mongoose.model('User');
      UserMock = sinon.mock(User);
      jwtStub = sinon.stub(jwt, 'sign');
    });

    afterEach(() => {
      UserMock.restore();
      jwtStub.restore();
    });

    it('should return an authorized user JSON on success', async () => {
      UserMock.expects('findById').withArgs(1).chain('exec').resolves(fakeUser);
      jwtStub.returns('this is a signed jwt');

      const req = mockRequest();
      const res = mockResponse();
      await getAuthStatus(req, res);
      expect(res.status).calledWith(200);
      expect(res.json).calledWith({
        expiresIn: 3 * (24 * 60 * 60),
        user: {
          email: fakeUser.email,
          name: fakeUser.name,
          profileImgUrl: fakeUser.profileImgUrl,
          token: fakeToken,
        },
      });
    });

    it('should return 404 if user does not exist', async () => {
      UserMock.expects('findById').withArgs(1).chain('exec')
        .resolves(undefined);
      const req = mockRequest();
      const res = mockResponse();
      await getAuthStatus(req, res);
      expect(res.status).calledWith(404);
      expect(res.json).calledWith({
        message: 'user does not exist',
      });
    });

    it('should return 500 if an error is thrown', async () => {
      UserMock.expects('findById').withArgs(1).chain('exec').rejects();

      // mongoose error
      const req = mockRequest();
      const res = mockResponse();
      await getAuthStatus(req, res);
      expect(res.status).calledWith(500);
      expect(res.json).calledWith({
        message: 'something went wrong on the server',
      });

      // jwt error
      UserMock.restore();
      UserMock.expects('findById').withArgs(1).chain('exec').resolves(fakeUser);
      jwtStub.throws();
      await getAuthStatus(req, res);
      expect(res.status).calledWith(500);
      expect(res.json).calledWith({
        message: 'something went wrong on the server',
      });
    });
  });
});
