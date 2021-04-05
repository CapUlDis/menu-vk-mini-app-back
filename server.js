const express = require('express');
const cors = require('cors');
const bearerToken = require('express-bearer-token');
const logger = require('morgan');
const { exec } = require('child_process');

const routes = require('./routes');

const PORT = process.env.PORT || 3000;

const args = process.argv.slice(2);

const app = express();
app.use(cors());
app.use(bearerToken());
app.use(express.json());
app.use(logger('dev'));

app.use('/api', routes);

switch(args[0]) {
  case 'http':
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
    break;
  case 'migrate':
    new Promise((resolve, reject) => {
      const migrate = exec(
        'npx sequelize-cli db:migrate',
        { env: process.env },
        err => (err ? reject(err): resolve())
      );
    
      // Forward stdout+stderr to this process
      migrate.stdout.pipe(process.stdout);
      migrate.stderr.pipe(process.stderr);
    });
    break;
}


module.exports = app;
