#!/usr/bin/env node
const mapValues = (obj, f) =>
  Object.fromEntries(Object.entries(obj).map(([key, val]) => [key, f(val)]));

const env = require('./env.json');
const https = require('https');
const fs = require('fs');

const express = require('express');
const app = express();

const path = require('path');
const mysql = require('mysql');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = mysql.createPool(env['pool']);
const sessionStore = new MySQLStore({}, pool);
const escapedTables = mapValues(env.tables, pool.escapeId); // escape table ids so we can directly embed them in queries
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;

const {production} = env;

if (production) app.use(redirectToHTTPS([], []));
app.use(express.static('build'));
// app.use(express.static('build'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(
  session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
  })
);

// ----------- Routes -----------

app.post('/api/reaction-time', (req, res) => {
  const {user, times, resolution} = req.body;
  if (times.length !== 5) {
    console.error('Invalid times: ', times);
    return res.status(400).send('Exactly 5 time points are expected.');
  }
  // noinspection SqlResolve
  pool.query(
    `INSERT INTO ${escapedTables['reaction-time']}
          (user, t1, t2, t3, t4, t5, resolution) VALUE (?, ?, ?, ?, ?, ?, ?);`,
    [user, ...times, resolution],
    (error, results, fields) => {
      console.log(results);
      console.log(fields);
      if (error) {
        console.error(error);
        return res.status(500).send();
      }
      res.json({insertId: results.insertId});
    }
  );
});

app.get('/api/reaction-time', (req, res) => {
  const {id = null} = req.query;
  if (!production) console.log('test got id', id);
  pool.query(
    'CALL summarizeReactionTime(?);',
    [id],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        return res.status(500).return();
      }
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
    }
  );
});

app.post('/api/aim-test', (req, res) => {
  // const {user, testLog, resolution, screenSize, testStart, testEnd} = req.body;
  const {user, data, timerResolution, testAreaWidth, targetRadius} = req.body;
  // noinspection SqlResolve
  pool.query(
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
        .reduce(([T, E], {time, relError}) => [T + time, E + relError], [0, 0])
        .map((x) => x / data.length),
    ],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Failed to insert metadata.');
      }
      if (!production) console.log(results);
      const {insertId: testId} = results;
      // noinspection SqlResolve
      pool.query(
        `INSERT INTO ${escapedTables['aim-test']} 
             (testid, round, time, target_distance, rel_error, tX, tY, cX, cY)
             VALUES ?;`,
        [
          data.map((d) => [
            testId,
            d.round,
            d.time,
            d.targetDist,
            d.relError,
            d.tX,
            d.tY,
            d.cX,
            d.cY,
          ]),
        ],
        (error) => {
          if (error) {
            console.error(error);
            return res.status(500).send('Failed to insert data.');
          }
          res.json({testId});
        }
      );
    }
  );
});

app.get('/api/aim-test', (req, res) => {
  const {id = null} = req.query;
  pool.query('CALL summarizeAimTest(?);', [id], (error, results, fields) => {
    if (error) {
      console.error(error);
      return res.status(500).send();
    }
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
  });
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/auth', function (req, res) {
  let username = req.body.username;
  let password = req.body.password;
  console.log(req.body);
  if (username && password) {
    pool.query(
      'SELECT * FROM accounts WHERE username = ? AND password = ?',
      [username, password],
      function (error, results) {
        if (error) {
          console.error(error);
          res.status(500).send('internal error');
        }
        if (results.length > 0) {
          req.session.loggedin = true;
          req.session.username = username;
          res.redirect('/home');
        } else {
          res.status(401).send('Incorrect Username and/or Password!');
        }
      }
    );
  } else {
    res.status(401).send('Please enter Username and Password!');
  }
});

app.get('/home', function (req, res) {
  if (req.session.loggedin) {
    res.send('Welcome back, ' + req.session.username + '!');
  } else {
    res.send('Please login to view this page!');
  }
  res.end();
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
