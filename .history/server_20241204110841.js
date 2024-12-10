const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();

const port = 3000;

app.use(cors());
app.use(express.json({ limit: "1000mb" }));

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

// delete a Category with given ID
app.delete("/categories/:id", (req, res) => {
  const category_id = req.params.id;

  let sql = `DELETE FROM Notes WHERE category_id = ?`;
  db.query(sql, [category_id], (err, result) => {
    if (err) throw err;

    sql = `DELETE FROM Subsubcategories WHERE category_id = ?`;
    db.query(sql, [category_id], (err, result) => {
      if (err) throw err;

      sql = `DELETE FROM Subcategories WHERE category_id = ?`;
      db.query(sql, [category_id], (err, result) => {
        if (err) throw err;

        sql = `DELETE FROM Categories WHERE id = ?`;
        db.query(sql, [category_id], (err, result) => {
          if (err) throw err;
          res.send(result);
        });
      });
    });
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

// get all Subcategories by the given Category ID
app.get("/subcategories/:id", (req, res) => {
  let sql = `SELECT * FROM Subcategories WHERE category_id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// post a new Subcategory
app.post("/subcategories", (req, res) => {
  const { id: category_id, name: sub_name } = req.body;
  if (!category_id || !sub_name) {
    return res.status(400).send("category_id and Sub name are required");
  }
  let post = { name: sub_name, category_id: category_id };
  let sql = "INSERT INTO Subcategories SET ?";
  db.query(sql, post, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// delete a Subcategory by given ID
app.delete("/subcategories/:id", (req, res) => {
  const subcategory_id = req.params.id;

  let sql = `DELETE FROM Notes WHERE subcategory_id = ?`;
  db.query(sql, [subcategory_id], (err, result) => {
    if (err) throw err;

    sql = `DELETE FROM Subsubcategories WHERE subcategory_id = ?`;
    db.query(sql, [subcategory_id], (err, result) => {
      if (err) throw err;

      sql = `DELETE FROM Subcategories WHERE id = ?`;
      db.query(sql, [subcategory_id], (err, result) => {
        if (err) throw err;
        res.send(result);
      });
    });
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

// get all Subsubcategories by the given Subcategory ID
app.get("/subsubcategories/:id", (req, res) => {
  let sql = `SELECT * FROM Subsubcategories WHERE subcategory_id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// post a new Subsubcategory
app.post("/subsubcategories", (req, res) => {
  const { category_id, subcategory_id, subsub_name } = req.body;
  if (!category_id || !subcategory_id || !subsub_name) {
    return res
      .status(400)
      .send("category_id, subcategory_id, and subsub_name are required");
  }

  let post = {
    name: subsub_name,
    category_id: category_id,
    subcategory_id: subcategory_id,
  };

  let sql = "INSERT INTO Subsubcategories SET ?";
  db.query(sql, post, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// delete a Subsubcategory by given ID
app.delete("/subsubcategories/:id", (req, res) => {
  const subsubcategory_id = req.params.id;

  let sql = `DELETE FROM Notes WHERE subsubcategory_id = ?`;
  db.query(sql, [subsubcategory_id], (err, result) => {
    if (err) throw err;

    sql = `DELETE FROM Subsubcategories WHERE id = ?`;
    db.query(sql, [subsubcategory_id], (err, result) => {
      if (err) throw err;
      res.send(result);
    });
  });
});

// Notes CRUD ------------------------------------------------

// get all Notes
app.get("/notes", (req, res) => {
  let sql = "SELECT * FROM Notes";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// get all Notes without content, images, and files
app.get("/notes_without_contents", (req, res) => {
  let sql =
    "SELECT id, title, category_id, subcategory_id, subsubcategory_id, created_at FROM Notes";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// get Notes by the given Subsubcategory ID
app.get("/notes/:id", (req, res) => {
  let sql = `SELECT * FROM Notes WHERE subsubcategory_id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// post a new Note
app.post("/notes", (req, res) => {
  const {
    title,
    content,
    images,
    files,
    category_id,
    subcategory_id,
    subsubcategory_id,
  } = req.body;

  if (!category_id || !subcategory_id || !subsubcategory_id) {
    return res
      .status(400)
      .send("category_id, subcategory_id, and subsubcategory_id are required");
  }

  let post = {
    title: title || null,
    content: content || null,
    images: images ? JSON.stringify(images) : null,
    files: files ? JSON.stringify(files) : null,
    category_id,
    subcategory_id,
    subsubcategory_id,
  };

  let sql = "INSERT INTO Notes SET ?";
  db.query(sql, post, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// update a note with given ID
app.put("/notes/:id", (req, res) => {
  const { title, content, images, files } = req.body;
  let sql = `UPDATE Notes SET title = '${title}', content = '${content}', images = '${JSON.stringify(
    images
  )}', files = '${JSON.stringify(files)}' WHERE id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// delete a note with given ID
app.delete("/notes/:id", (req, res) => {
  let sql = `DELETE FROM Notes WHERE id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
