#!/usr/bin/env node
const mapValues = (obj, f) =>
  Object.fromEntries(Object.entries(obj).map(([key, val]) => [key, f(val)]));

const env = require('./env.json');
const https = require('https');
const fs = require('fs');

const express = require('express');
const app = express();

const mariadb = require('mariadb');
const pool = mariadb.createPool({...env.pool, multipleStatements: true});
const escapedTables = mapValues(env.tables, pool.escapeId); // escape table ids so we can directly embed them in queries
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;

const {production} = env;

if (production) app.use(redirectToHTTPS([], []));
app.use(express.static('build'));
app.use(express.json());

// ----------- Routes -----------

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
  const {user, times, resolution} = req.body;
  if (times.length !== 5) {
    console.error('Invalid times: ', times);
    return res.status(400).send('Exactly 5 time points are expected.');
  }
  // noinspection SqlResolve
  pool
    .query(
      `INSERT INTO ${escapedTables['reaction-time']}
          (user, t1, t2, t3, t4, t5, resolution) VALUE (?, ?, ?, ?, ?, ?, ?);`,
      [user, ...times, resolution]
    )
    .then((queryRes) => {
      if (!production) console.log(queryRes);
      res.json({insertId: queryRes.insertId});
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send();
    });
});

app.get('/api/reaction-time', (req, res) => {
  const {id = null} = req.query;
  if (!production) console.log('test got id', id);
  pool
    .query('CALL summarizeReactionTime(?);', [id])
    .then((results) => {
      /* results format
        [
          [ {n, mean, sd, min, q1, median, q3, max} ], // global summary statistics
          [ {bins, binWidth, binStart} ], // histogram stats
          [ {bin, freq} ... ],  // histogram data
          [ ?{id, t1, ..., t5, sd, mean, meanQuantile} ] // id query data (empty when id is missing or invalid)
          { response metadata },
        ]
      * */
      const [[globalSummary], [binStats], histData, [querySummary]] = results;
      const ret = {
        globalSummary,
        histogram: {
          ...binStats,
          data: histData,
        },
      };
      if (querySummary) {
        const {t1, t2, t3, t4, t5, ...rest} = querySummary;
        ret.query = {
          ...rest,
          data: [t1, t2, t3, t4, t5],
        };
      }
      if (!production) console.log('Returning: ', ret);
      res.json(ret);
    })
    .catch((error) => {
      console.error(error);
      res.sendStatus(500);
    });
});

app.post('/api/aim-test', (req, res) => {
  // const {user, testLog, resolution, screenSize, testStart, testEnd} = req.body;
  const {user, data, timerResolution, testAreaWidth, targetRadius} = req.body;
  // noinspection SqlResolve
  pool
    .query(
      `INSERT INTO ${escapedTables['aim-test-summary']} 
        (user, timer_resolution, screen_width, target_radius, rounds, mean_time, mean_error) 
        VALUE (?, ?, ?, ?, ?, ?, ?);`,
      [
        user,
        timerResolution,
        testAreaWidth,
        targetRadius,
        data.length,
        ...data
          .reduce(([T, E], {time, relError}) => [T + time, E + relError], [
            0,
            0,
          ])
          .map((x) => x / data.length),
      ]
    )
    .then((queryRes) => {
      if (!production) console.log(queryRes);
      const {insertId: testId} = queryRes;
      // noinspection SqlResolve
      pool
        .batch(
          {
            namedPlaceholders: true,
            sql: `INSERT INTO ${escapedTables['aim-test']} 
             (testid, round, time, target_distance, rel_error, tX, tY, cX, cY)
             VALUES (${pool.escape(
               testId
             )}, :round, :time, :targetDist, :relError, :tX, :tY, :cX, :cY);`,
          },
          data
        )
        .then(() => res.json({testId}))
        .catch((error) => {
          console.error(error);
          res.status(500).send('Failed to insert data.');
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Failed to insert metadata.');
    });
});

app.get('/api/aim-test', (req, res) => {
  const {id = null} = req.query;
  pool
    .query('CALL summarizeAimTest(?);', [id])
    .then((results) => {
      /* results format
        [
          [ {bin, freq}, ... ] // time histogram data
          [ {bin, freq}, ... ] // relative error histogram data
          [ // Summary statistics
            {stat: "time", n, mean, sd, min, q1, median, q3, max, bins, binStart, binWidth}
            {stat: "error", n, mean, sd, min, q1, median, q3, max, bins, binStart, binWidth}
          ],
          [ {round, tX, tY, cX, cY, time, target_distance, rel_error} ... ] // rounds associated with testid (empty if no id given)
          { response metadata },
        ]
      * */
      const [timeHist, errorHist, summaries, query] = results;
      const [
        {
          bins: timeBins,
          binStart: timeBinStart,
          binWidth: timeBinWidth,
          ...timeSummary
        },
        {
          bins: errorBins,
          binStart: errorBinStart,
          binWidth: errorBinWidth,
          ...errorSummary
        },
      ] = summaries[0].stat === 'time' ? summaries : summaries.reverse();
      const ret = {
        time: {
          ...timeSummary,
          histogram: {
            bins: timeBins,
            binStart: timeBinStart,
            binWidth: timeBinWidth,
            data: timeHist,
          },
        },
        error: {
          ...errorSummary,
          histogram: {
            bins: errorBins,
            binStart: errorBinStart,
            binWidth: errorBinWidth,
            data: errorHist,
          },
        },
        query: query.map(({tX, tY, cX, cY, ...rest}) => ({
          targetPos: [tX, tY],
          clickPos: [cX, cY],
          ...rest,
        })),
      };
      res.json(ret);
    })
    .catch((error) => {
      console.error(error);
      res.sendStatus(500);
    });
});

// ----------- Start server -----------

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || (production ? 443 : 3000);
if (production) {
  https
    .createServer(mapValues(env.httpsServer, fs.readFileSync), app)
    .listen(port, () => {
      console.log(`Listening on https at port ${port}`);
    });
  app.listen(80, () => {
    console.log(`Listening on http at port 80`);
  });
} else {
  app.listen(port, host, () => {
    console.log(`Listening at: http://${host}:${port}`);
  });
}
