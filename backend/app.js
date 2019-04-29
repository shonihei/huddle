require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const { handleUnauthorizedError } = require('./middlewares/auth-middleware');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);

app.use(handleUnauthorizedError);

const { DB_USER, DB_PASSWORD, DB_HOST } = process.env;

const baseUri = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}`;
const mongoUri = `${baseUri}/test?retryWrites=true`;
mongoose.set('useFindAndModify', false);
mongoose.connect(mongoUri, { useNewUrlParser: true })
  .then(() => console.log('connected to database'));

module.exports = app;
