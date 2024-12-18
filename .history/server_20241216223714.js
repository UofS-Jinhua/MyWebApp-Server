const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const cookieParser = require("cookie-parser");

const dotenv = require("dotenv");
dotenv.config();

const port = 3000;

const db_host = process.env.DB_HOST;
const db_user = process.env.DB_USER;
const db_password = process.env.DB_PASS;
const secretKey = process.env.SECRET_KEY;
const origin_url = process.env.ORIGIN_URL;

// console.log(db_host);
// console.log(db_user);
// console.log(db_password);
// console.log(secretKey);

app.use(
  cors({
    origin: origin_url, // 替换为你的前端应用的URL
    // origin: `http://4.174.176.140`,
    credentials: true,
  })
);
app.use(express.json({ limit: "1000mb" }));
app.use(cookieParser());

const db = mysql.createConnection({
  host: db_host,
  user: db_user,
  password: db_password,
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

// User login -------------------------------------------------------
app.post(
  "/login",
  [
    body("username").isLength({ min: 3 }),
    body("password").isLength({ min: 6 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    let sql = "SELECT * FROM Users WHERE username = ?";
    db.query(sql, [username], async (err, result) => {
      if (err) {
        console.log(err);
        throw err;
      }
      if (result.length === 0) {
        console.log(result, "1 - Invalid username or password");
        return res.status(400).send("Invalid username or password");
      }

      const user = result[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).send("Invalid username or password");
      }

      const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: "1h" });

      // res.cookie("token", token, {
      //   httpOnly: true,
      //   secure: true,
      //   sameSite: "None",
      // });
      res.json({ token, message: "Login Sucessful" });
    });
  }
);

// Middleware to authenticate token
// const authenticateToken = (req, res, next) => {
//   const token = req.cookies.token;
//   if (!token) {
//     return res.status(401).send("Access denied");
//   }

//   try {
//     const verified = jwt.verify(token, secretKey);
//     req.user = verified;
//     next();
//   } catch (err) {
//     res.status(400).send("Invalid token");
//   }
// };
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send("Access denied");
  }
  try {
    const verified = jwt.verify(token, secretKey);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send("Invalid token");
  }
};

// check if the user is authenticated
app.get("/check-auth", authenticateToken, (req, res) => {
  res.send("Authenticated");
});

// Protected route example
app.get("/protected", authenticateToken, (req, res) => {
  res.send("This is a protected route");
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

// update a category's name with given ID
app.put("/categories/:id", (req, res) => {
  let sql = `UPDATE Categories SET name = ? WHERE id = ?`;
  let values = [req.body.name, req.params.id];
  db.query(sql, values, (err, result) => {
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
    "SELECT id, title, category_id, subcategory_id, subsubcategory_id, created_at, contain_text, contain_file, contain_image, last_modify_date FROM Notes";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// get all Notes contains given keyword
app.get("/notes/search/:keyword", (req, res) => {
  // console.log(req.params.keyword);
  let sql = `SELECT * FROM Notes WHERE title LIKE '%${req.params.keyword}%' OR content LIKE '%${req.params.keyword}%'`;
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

// get a Note by the given ID
app.get("/note/:id", (req, res) => {
  let sql = `SELECT * FROM Notes WHERE id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    // console.log(result);
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
    contain_text: content ? true : false,
    contain_image: images && images.length > 0 ? true : false,
    contain_file: files && files.length > 0 ? true : false,
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

  let contain_text = content ? true : false;
  let contain_image = images && images.length > 0 ? true : false;
  let contain_file = files && files.length > 0 ? true : false;
  let last_modify_date = new Date();

  let sql = `UPDATE Notes SET title = ?, content = ?, images = ?, files = ?, contain_text = ?, contain_image = ?, contain_file = ?, last_modify_date = ? WHERE id = ?`;
  let values = [
    title || null,
    content || null,
    images ? JSON.stringify(images) : null,
    files ? JSON.stringify(files) : null,
    contain_text,
    contain_image,
    contain_file,
    last_modify_date,
    req.params.id,
  ];

  db.query(sql, values, (err, result) => {
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
