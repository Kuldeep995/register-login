//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const port = 3000;

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'my biggest secret',
  resave: false,
  saveUninitialized: true,
  cookie:{}
}))

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect('mongodb://localhost:27017/lrdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});



const userSchema = new mongoose.Schema({
   username:String,
   password:String,
   googleId:String,
   secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
app.get("/", function(req, res){
  res.render("home");
})

passport.use(User.createStrategy());
//
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/login", function(req, res){
  res.render("login");
})

app.get("/register", function(req, res){
  res.render("register");
})

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
})

app.get("/secrets", function(req, res){

  if(req.isAuthenticated())
  {
    User.find({secret: {$ne: null}}, function(err, re){
        res.render("secrets", {fu:re});
    })

  }
  else{
    res.redirect("/login");
  }

})

app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
   console.log(req.user);
   User.findById(req.user.id, function(err, fuser){
     if(err)
     {console.log(err);}
     else
     {
       if(fuser)
       {
         fuser.secret=req.body.secret;
         fuser.save(function(){
           res.redirect("/secrets");
         });

       }
     }
   })
})

app.post("/register", function(req, res){

  User.register({username:req.body.username}, req.body.password, function(err, user) {
    if (err) { console.log(err); res.render("register");}
    else {

    passport.authenticate("local")(req, res, function() {
      res.redirect("/secrets");
    });
  }
  });

})
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

  app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect("/secrets");
    });
// app.post("/login", function(req, res){
//
//   const user = new User({
//         username: req.body.username,
//         password: req.body.password
//       });
//             req.login(user, function(err){
//
//               if(err)
//               {
//                 console.log(err);
//               }
//               else
//               {
//                 passport.authenticate("local")(req, res, function() {
//                   res.redirect("/secrets");
//               })
//             }
//           })
//
//
// });

app.post("/login", passport.authenticate("local"), function(req, res){
    res.redirect("/secrets");
});


app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
