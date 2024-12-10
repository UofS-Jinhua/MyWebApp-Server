const express = require("express");
const mysql = require("mysql");
const app = express();
const port = 3306;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "H@ppyF@ce9527",
  database: "Notes",
});

// connect db
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("MySQL connected...");
});

// simple get request for testing
app.get("/", (req, res) => {
  res.send("Hello World!");
});

//
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
