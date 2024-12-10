const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();

const port = 3000;

app.use(cors());
app.use(express.json());

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

// Categories CRUD ------------------------------------------------

// get all Categories
app.get("/categories", (req, res) => {
  let sql = "SELECT * FROM Categories";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// post a new Category
app.post("/categories", (req, res) => {
  let post = { name: req.body.name };
  let sql = "INSERT INTO Categories SET ?";
  db.query(sql, post, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// Subcategories CRUD ------------------------------------------------

// get all Subcategories
app.get("/subcategories", (req, res) => {
  let sql = "SELECT * FROM Subcategories";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// post a new Subcategory
app.post("/subcategories", (req, res) => {
  const { category_id } = req.body.id;
  const { sub_name } = req.body.name;
  if (!category_id) {
    return res.status(400).send("category_id is required");
  }

  let post = { name: sub_name, category_id };
  let sql = "INSERT INTO Subcategories SET ?";
  db.query(sql, post, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// Subsubcategories CRUD ------------------------------------------------

// get all Subsubcategories
app.get("/subsubcategories", (req, res) => {
  let sql = "SELECT * FROM Subsubcategories";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// get all Notes
app.get("/notes", (req, res) => {
  let sql = "SELECT * FROM Notes";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});