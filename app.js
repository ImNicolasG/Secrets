//jshint esversion:6
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const express = require("express");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));


// mongoose.connect("mongodb://localhost:27017/secretsLogin", {useNewUrlParser:true});


app.get("/", function(req, res) {
    res.render("home");
});


app.get("/login", function(req, res) {
    res.render("login");
});


app.get("/register", function(req, res) {
    res.render("register");
});


app.get("/secrets", function(req, res) {
    res.render("secrets");
});










app.listen(3000, function() {
    console.log("Server is now running on port 3000")
})