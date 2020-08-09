const hostname = 'localhost';
const port = process.env.PORT || 3001;
const env = require('./env.json');

const express = require('express');
const app = express();

const mariadb = require('mariadb');
const pool = mariadb.createPool(env['pool']);
const tables = env['tables'];

app.use(express.static('build'));
app.use(express.json());

app.get('/api/random-int', function (req, res) {
  const min = Math.trunc(req.query.min);
  const max = Math.trunc(req.query.max);
  let response;
  if (Number.isNaN(min) || Number.isNaN(max)) {
    console.log('Bad query parameters!');
    res.status(400).send('Bad query parameters!');
  } else {
    response = {
      message: `Random Integer in [${min}, ${max}]`,
      generated: new Date().toLocaleString(),
      number: Math.floor(Math.random() * (max - min + 1)) + min,
    };
    console.log(response);
    res.json(response);
  }
});

app.post('/api/reaction-time', (req, res) => {
  const {user, times} = req.body;
  if (times.length !== 5) {
    console.error('Invalid times: ', times);
    return res.status(400).send('Exactly 5 time points are expected.');
  }
  pool
    .getConnection()
    .then((conn) => {
      conn
        .query(
          `INSERT INTO ${
            /* I was thinking we could key table names by route for consistency. */
            pool.escapeId(tables['reaction-time'])} 
          (user, t1, t2, t3, t4, t5, avg) VALUE (?, ?, ?, ?, ?, ?, ?) 
          RETURNING *;`,
          [user, ...times, times.reduce((s, x) => s + x, 0) / times.length]
        )
        .then((queryRes) => {
          console.log(
            Array.from(queryRes) // Array.from strips metadata
          );
          res.json(queryRes);
          return conn.end();
        })
        .catch((error) => {
          console.error(error);
          res.sendStatus(500);
          return conn.end();
        });
    })
    .catch((error) => {
      console.error('Connection failed.');
      console.error(error);
      res.sendStatus(500);
    });
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
