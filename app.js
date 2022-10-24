//jshint esversion:6
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const express = require("express");
const encrypt = require("mongoose-encryption");


const app = express();

console.log(process.env.API_KEY);

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended:true
}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true});

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});



// this plugin for encryption must be added before creating a model using the mentioned schema
// use secret: secret* for a 'secret string'. * being a variable
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });


const User = new mongoose.model("User", userSchema);





//test



app.get("/", function(req, res) {
    res.render("home");
});






app.get("/login", function(req, res) {
    res.render("login");
});





app.get("/register", function(req, res) {
    res.render("register");
});




app.post("/register", function(req, res) {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    newUser.save(function(err) {
        if (!err) {
            res.render("secrets");
        } else {
            console.log(err);
        }
    });
});


app.post("/login", function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, function(err, foundUser) {
        if (foundUser) {
            if (foundUser.password === password) {
                res.render("secrets");
            };
        } else {
            console.log(err);
        };
    });
})






app.listen(3000, function() {
    console.log("Server is now running on port 3000")
})