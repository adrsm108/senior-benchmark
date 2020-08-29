const env = require('./env.json');
const _ = require('lodash');

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

const express = require('express');
const app = express();

const path = require('path');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = mysql.createPool(env['pool']);
const sessionStore = new MySQLStore({}, pool);
const tabIds = _.mapValues(env['tables'], pool.escapeId);

// app.use(express.static('build'));
app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.use(session({
  key: 'session_cookie_name',
  secret: 'session_cookie_secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false
}));

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

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/auth', function(req, res) {
  let username = req.body.username;
  let password = req.body.password;
  pool.query('SELECT password FROM accounts WHERE username = ?', [username], function(error, results) {
    if (results.length === 0) {
      // username doesn't exist
      console.log('username doesn\'t exist')
      return res.status(401).send();
    }

    let hashedPassword = results[0].password;
    bcrypt.compare(password, hashedPassword)
      .then(function(isSame) {
        if (isSame) {
          if (username && password) {
            pool.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, hashedPassword], function(error, results) {
              if (results.length > 0) {
                req.session.loggedin = true;
                req.session.username = username;
                res.redirect('/home');
              } else {
                res.send('Incorrect Username and/or Password!');
              }
              res.end();
            });
          } else {
            res.send('Please enter Username and Password!');
            res.end();
          }
        }
      })
  })
});

app.get('/home', function(req, res) {
  if (req.session.loggedin) {
    res.send('Welcome back, ' + req.session.username + '!');
  } else {
    res.send('Please login to view this page!');
  }
  res.end();
});

app.post('/register', function(req, res) {
  let username = req.body.username;
  let password = req.body.password;
  console.log('Checking if U and P meet requirements')
  if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.length < 1 ||
      username.length > 20 ||
      password.length < 10 ||
      password.length > 36
  ) {
    // username and/or password invalid
    return res.status(401).send();
  }
  console.log('Requirements passed!')
  if (username && password) {
    pool.query('SELECT username FROM accounts WHERE username = ?', [username], function(error, results) {
      console.log('Checking if username is free')
      if (!results[0]) {
        //username is available
        console.log('Username is available and now attempting hashing password')
        bcrypt.hash(password, 10)
          .then(function(hashedPassword) {
            console.log('Password is hashed and trying to save in DB')
            pool.query('INSERT INTO accounts (username, password) VALUES (?, ?)',
              [username, hashedPassword], function(error) {
              console.log(error)

            })
          })
          .catch(function(error) {
            console.log('bcrypt error: ' + error);
          });
      } else {
        // username is taken/exists
        return res.status(401).send();
        // TODO Send client alert to user
      }
    });
  } else {
    res.send('Please enter Username and Password!');
    res.end();
  }
});

app.listen(port, host, () => {
  console.log(`Listening at: http://${host}:${port}`);
});
