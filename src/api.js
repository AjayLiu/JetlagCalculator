const express = require("express");
const serverless = require("serverless-http");
const moment = require('moment');

const app = express();
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    "ok": "hi!"
  });
});


router.get("/moment-timezone-with-data.js", (req, res) => {
  res.send(moment().format());
});


app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);