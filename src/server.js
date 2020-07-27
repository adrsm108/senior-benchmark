const express = require('express');
const app = express();

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
      generated: (new Date()).toLocaleString(),
      number: Math.floor(Math.random() * (max - min + 1)) + min
    };
    console.log(response);
    res.json(response);
  }
});

// app.get('/', function (req, res) {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

const hostname = 'localhost'
const port = process.env.PORT || 8080;
app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
