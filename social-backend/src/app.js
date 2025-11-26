const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: "API ok" });
});


const postsRouter = require('./routes/posts');
const usersRouter = require('./routes/users');
const barsRouter = require('./routes/bars');
const roastersRouter = require('./routes/roasters');
const searchRouter = require('./routes/search');

app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);
app.use('/api/bars', barsRouter);
app.use('/api/roasters', roastersRouter);
app.use('/api/search', searchRouter);
app.use('/api/comments', require('./routes/comments'));

module.exports = app;
