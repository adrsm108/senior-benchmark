const env = require('./env.json');
const _ = require('lodash');

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

const express = require('express');
const app = express();

const mariadb = require('mariadb');
const pool = mariadb.createPool({...env['pool'], multipleStatements: true});
const tabIds = _.mapValues(env['tables'], pool.escapeId);

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

app.get('/api/reaction-time', (req, res) => {
  const {id = null} = req.query;
  console.log('test got id', id);
  pool
    .query('CALL summarizeReactionTime(?);', [id])
    .then((results) => {
      /* results format
        [
          [ {mean, sd, min, q1, median, q3, max } ], // global summary statistics
          [ {bins, binWidth, binStart} ], // histogram stats
          [ {bin, freq} ... ],  // histogram data
          [ ?{id, t1, ..., t5, mean, sd, meanQuantile, sdQuantile } ] // empty if no id specified
          { query metadata },
        ]
      * */

      console.log('success: ', results);
      const [[globalSummary], [binStats], histData, [querySummary]] = results;
      const ret = {
        globalSummary,
        histogram: {
          ...binStats,
          data: histData,
        },
      };
      if (querySummary) {
        const {id, t1, t2, t3, t4, t5, ...rest} = querySummary;
        ret.query = {
          id,
          times: [t1, t2, t3, t4, t5],
          ...rest,
        };
      }
      res.json(ret);
    })
    .catch((error) => {
      console.error(error);
      res.sendStatus(500);
    });
});

app.post('/api/reaction-time', (req, res) => {
  const {user, times, resolution} = req.body;
  if (times.length !== 5) {
    console.error('Invalid times: ', times);
    return res.status(400).send('Exactly 5 time points are expected.');
  }
  pool
    .getConnection()
    .then((conn) => {
      // noinspection SqlResolve
      conn
        .query(
          `INSERT INTO ${tabIds['reaction-time']}
          (user, t1, t2, t3, t4, t5, resolution) VALUE (?, ?, ?, ?, ?, ?, ?);`,
          [user, ...times, resolution]
        )
        .then((queryRes) => {
          console.log(
            queryRes
            // Array.from(queryRes) // Array.from strips metadata
          );
          res.json({insertId: queryRes.insertId});
          return conn.end();
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send();
          return conn.end();
        });
    })
    .catch((error) => {
      console.error('Connection failed.');
      console.error(error);
      res.status(500).send();
    });
});

app.listen(port, host, () => {
  console.log(`Listening at: http://${host}:${port}`);
});
