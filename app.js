//jshint esversion:6
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");





const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended:true
}));



app.use(session({
    secret: "Our little secret.",
    resave: false,
    // saveUninitialized: false, is useful for implementing logins and reducing server storage use.
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



// mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true});
mongoose.connect("mongodb://127.0.0.1/userDB", {useNewUrlParser:true});

// mongoose.set("useCreateIndex", true);


const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
    facebookId:String
});


const secretSchema = new mongoose.Schema ({
    secret: String
});




userSchema.plugin(passportLocalMongoose);
// this uses the plugin to make googleOAuth work
userSchema.plugin(findOrCreate);



const User = new mongoose.model("User", userSchema);

const Secret = new mongoose.model("Secret", secretSchema);


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
   
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });



// This must be in the proper location, after declaration of the variable and session. 
// This is for google auth
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// This must be in the proper location, after declaration of the variable and session. 
// This is for facebook auth
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));





// Render home page at root route
app.get("/", function(req, res) {
    res.render("home");
});


// Google login authentication
app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
});


// Facebook Login authentication
app.get("/auth/facebook", passport.authenticate("facebook"));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});


// render login page
app.get("/login", function(req, res) {
    res.render("login");
});

// render register page
app.get("/register", function(req, res) {
    res.render("register");
});


// render secrets page if user is authenticated
app.get("/secrets", function(req, res) {
    if (req.isAuthenticated()) {
        // Find all "Secret's" in the DB and display them as called in the secrets page through ejs
        Secret.find({}, function(err, secrets) {
            res.render("secrets", {
                Secrets: secrets
            });
        });
        // if they are not authenticated, redirect to login page
    } else {
        res.redirect("/login");
    };
});


// Log out our user
app.get("/logout", function(req, res) {
    req.logout(function(err) {
        if (err) {
            console.log(err)
        } else {
            res.redirect("/")
        };
    });
});


// if the user is authenticated, allow them to submit a secret
app.get("/submit", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    };
});




// allow a user to register using an email and password, saving them to a database
app.post("/register", function(req, res) {
    // If there is an error while registering, redirect to the register page
    //Otherwise authenticate them and display the secrets page
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets")
            })
        }
    })

});



// Run passport.authenticate in the post request so that it checks to see if the login is correct before displaying /secrets
// If this is done in the req.login, it can be bypassed by using websiteURL/secrets
app.post("/login", passport.authenticate("local"), function(req, res) {
    

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/secrets");
        };
    });


});




// Submits a new secret to the database and saves it if there is no err
app.post("/submit", function(req, res) {
    const secret = new Secret({
        secret: req.body.secret
    });

    secret.save(function(err) {
        if (!err) {
            res.redirect("/secrets")
        };
    });
});










app.listen(3000, function() {
    console.log("Server is now running on port 3000")
});