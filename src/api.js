const express = require("express");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    "ok": "hi!"
  });
});

var geocoder = require('local-reverse-geocoder');
var point = {latitude: 42.083333, longitude: 3.1};
geocoder.lookUp(point, function(err, res) {
    console.log(JSON.stringify(res, null, 2));
});
router.get("/geo", (req, res) => {
    res.json({
        "hello": "hi!"
    });
});


app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);