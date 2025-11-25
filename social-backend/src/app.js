const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: "API ok" });
});


const postsRouter = require('./routes/posts');

app.use('/api/posts', postsRouter);

module.exports = app;
