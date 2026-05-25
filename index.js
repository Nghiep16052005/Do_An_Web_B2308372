const express = require('express');
// cai dot env, dung de bao mat code
require("dotenv").config();

// tao ra 1 bien database 
const database = require("./config/database");
const app = express();
const port = process.env.PORT;

// nhung file index.route.js ben be import ,fe require 
const route = require("./router/client/index.route")
database.connect();
// b2 cai dat pug 
app.set("views", "./views");
app.set("view engine", "pug");

// them file tinh 
app.use(express.static("public"));

// app.get('/', (req, res) => {
//   res.render("client/pages/home/index");
// });

// app.get('/products', (req, res) => {
//     res.render("client/pages/products/index");

// });
route(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
