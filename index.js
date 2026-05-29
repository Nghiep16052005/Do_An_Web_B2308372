require("dotenv").config();

const express = require("express");
const app = express();

const database = require("./config/database");

database.connect();

app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.static("public"));

const clientRoutes = require("./router/client/index.route");

clientRoutes(app);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});