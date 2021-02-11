const express = require('express');
const cors = require('cors');
const logger = require('morgan');

const routes = require('./routes');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(logger('dev'));

app.use('/api', routes);

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

module.exports = app;
