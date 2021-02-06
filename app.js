//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const port = 3000;

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));





mongoose.connect('mongodb://localhost:27017/lrdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
   email:String,
   password:String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET , encryptedFields: ["password"]});


const User = new mongoose.model("User", userSchema);
app.get("/", function(req, res){
  res.render("home");
})

app.get("/login", function(req, res){
  res.render("login");
})

app.get("/register", function(req, res){
  res.render("register");
})

app.post("/register", function(req, res){

  const user = new User({
    email: req.body.username,
    password: req.body.password
  });
  user.save(function(err){
    if(!err)
    res.render("secrets");
  });

})


app.post("/login", function(req, res){


  User.findOne({email: req.body.username},function(err, result){

    if(err)
    {res.send(err);}
    else{
      console.log(result);
     if(!result)
    {
      res.send("no such registered user");


    }
    else
    {
      if(result.password===req.body.password)
      {
            res.render("secrets");
      }
      else
      {res.send("wrong password"); }
    }
  }
  })


})


app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});