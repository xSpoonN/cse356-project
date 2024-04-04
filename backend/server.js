const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const app = express();
const port = 3000;

// @todo: FIX THIS
const clientPromise = mongoose
  .connect('mongodb://root:password@mongo:27017/user')
  .then(m => m.connection.getClient());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: 'verysecretsecretphrase',
    cookie: { maxAge: 300000 }, //session expires after 5 minutes
    store: MongoStore.create({ clientPromise, dbName: 'test' }),
  })
);

// Import routes
const searchRouter = require('./routes/search');
const tileRouter = require('./routes/tile');
const routingRouter = require('./routes/routing');
const userRouter = require('./routes/user');

// Use routes
app.use('/api', searchRouter);
app.use('/api', userRouter);
app.use(tileRouter);
app.use(routingRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
