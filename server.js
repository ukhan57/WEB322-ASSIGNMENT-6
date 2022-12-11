// setup our requires
const express = require("express");
const app = express();
// const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const handlebars = require("express-handlebars");
const mongoose = require("mongoose");
const clientSessions = require("client-sessions");
const bcryptjs = require("bcryptjs");
const { log } = require("util");
const { read } = require("fs");



// MONGO DB
// DL2sc2of5EUdTzto - Password
const schema = mongoose.Schema;

const registration = mongoose.createConnection("mongodb+srv://Ukhan:DL2sc2of5EUdTzto@cluster0.qkcbfzy.mongodb.net/?retryWrites=true&w=majority");
const blog = mongoose.createConnection("mongodb+srv://Ukhan:DL2sc2of5EUdTzto@cluster0.qkcbfzy.mongodb.net/?retryWrites=true&w=majority");

const registrationSchema = new schema({
    "fName": String,
    "lName": String,
    "username": {
        "type": String,
        "unique": true
    },
    "email": {
        "type": String,
        "unique": true,
    },
    "Address": String,
    "postalCode": String,
    "country": String,
    "password": String
});

//Creating schemas for the database
const blogSchema = new schema({
    "title": String,
    "content": String,
    "date": String,
    "image": String
});

//Making connection with the database
const userInfo = registration.model("registration", registrationSchema);
const blogContent = blog.model("blogDB", blogSchema);

const HTTP_PORT = process.env.PORT || 8080;

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

app.use(clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "Assignment6_web322", // this should be a long un-guessable string.
    duration: 5 * 60 * 1000, // duration of the session in milliseconds (5 minutes)
    activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

// Register handlebars as the rendering engine for views
app.engine(".hbs", handlebars.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");
app.use(bodyParser.urlencoded({ extended: true}));

//Router function for '/' page
app.get("/", function(req,res){
    res.render("index", {layout : false});
});

app.get("/blog", function(req,res){
    blogContent.find().exec().then((data) => {
        let log = new Array;
        data.forEach(element => {
            log.push({
                title: element.title,
                content: element.content,
                date: element.date,
                image: element.image
            });
        });
        res.render("blog", {title: log, layout:false});
    });
});

app.get("/admin", function(req,res){
    res.render("admin", {layout:false});
});

app.post("/admin", function(req,res){
    console.log("req.body.img");
    let articelData = new blogContent({
        title: req.body.title,
        content: req.body.content,
        date: req.body.data,
        image: req.body.img
    }).save((e, data) => {
        if(e) {
            console.log(e);
        } else {
            console.log(data);
        }
    });
    res.redirect("/");
});

app.post("/read_more", function(req,res){
    blogContent.findOne({title: req.body.title}).exec().then((data) => {
        res.render("read_more", {image: data.image, id: data._id, read: data.content, title: data.title, date: data.date, layout:false});
    });
});

app.post("/update", (req, res) => {
    blogContent.updateOne({
        _id: req.body.ids
    }, {
        $set: {
            title: req.body.title,
            content: req.body.content,
            date: req.body.date,
            image: req.body.img
        }
    }).exec();
    res.redirect("/");
});

app.get("/login", function(req,res){
    res.sendFile(path.join(__dirname, "/login.html"));
});

//Router function for 'login' page
app.post("/login", function(req,res){
    var userdata = {
        user: req.body.username,
        pass: req.body.password,
        expression: /[~`!#@$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(req.body.username)
    }

    if (userdata.user == "" || userdata.pass == "") {

        res.render("login", { data: userdata, layout: false });
        return;
    }

    if (userdata.expression) {
        res.render("login", { data: userdata, layout: false });
        return;
    }
    
    userInfo.findOne({username: userdata.user}, ["fName", "lName", "username", "password"]).exec().then((data) => {
        bcryptjs.compare(userdata.pass, data.password).then((result) => {
            console.log(result);
            if (result){
                if(data.id = "63965055f783fc8d7f8883c2"){
                    req.sessions.adminData = {
                        username: userdata.user,
                        password: userdata.pass
                    }
                    console.log("Admin-session is created!");
                    res.render("Admin_Dashboard", {fName: data.fName, lName: data.lName, username: data.username, layout: false});
                    return;
                }
                else {
                    req.sessions.userdata = {
                        username: userdata.user,
                        password: userdata.pass
                    }
                    res.render("User_Dashboard", {fName: data.fName, lName: data.lName, username: data.username, layout: false});
                    return;
                }
            }
        })
    });

});

//Router function to logout from a session!
app.get("/logout", function(req,res){
    console.log("Logging Out...");
    req.sessions.reset();
    res.redirect("/login");
});

// This is a helper middleware function that checks if a user is logged in
// we can use it in any route that we want to protect against unauthenticated access.
// A more advanced version of this would include checks for authorization as well after
// checking if the user is authenticated
function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
  }

//Router function for 'registration' page
app.get("/registration", function(req,res){
    res.sendFile(path.join(__dirname, "/registration.html"));
});

app.post("/registration", function(req,res){

    var userdata = {
        fName: req.body.fName,
        lName: req.body.lName,
        username: req.body.username,
        email: req.body.email,
        Address: req.body.Address,
        postalCode: req.body.postalCode,
        postaltest: /^[AaBbCcEeGgHiJjKkLlMmNnPpRrSsTtVvXxYy]\d[A-Za-z] \d[A-Za-z]\d$/.test(req.body.postalCode),
        country: req.body.country,
        password: req.body.password,
        passwordtest: /^[0-9a-zA-Z]{6,12}$/.test(req.body.password),
        confirmpassword: req.body.confirmpassword,
    }

    var checkpass = function() {
        if (userdata.password == userdata.confirmpassword) {
            return true;
        }
        return false;
    }

    userdata.checkpassword = checkpass;

    if (userdata.fName == "" ||
        userdata.lName == "" ||
        userdata.username == "" ||
        userdata.email == "" ||
        userdata.Address == "" ||
        userdata.postalCode == "" ||
        userdata.country == "" ||
        userdata.password == "" ||
        userdata.confirmpassword == "") 

    {
        res.render("registration", { data: userdata, layout: false });
        return;
    }

     else if (!userdata.postaltest) {
        res.render("registration", { data: userdata, layout: false });
        return;
    }
     else if (!userdata.passwordtest) {
        res.render("registration", { data: userdata, layout: false });
        return;
    }
     else if (!userdata.checkpassword) {
        res.render("registration", { data: userdata, layout: false });
        return;
    }

    var username = "";
    for (let index = 0; index < userdata.email.length; index++) {
        const element = userdata.email[index];
        if (element != '@') {
            username += element
        }
        if (element == '@') {
            break;
        }
    }

    //This is to hash the password using a salt whcih was generated using 15 times/rounds
    //To store the resulting hash value in the database
    bcryptjs.hash(userdata.password, 10).then(hash => {

        let accinfo = new userInfo({
            fName: userdata.fName,
            lName: userdata.lName,
            username: username,
            email:userdata.email,
            Address: userdata.Address,
            postalCode: userdata.postalCode,
            country: userdata.country,
            password: hash
        }).save((e,data)=>{
            if(e){
                console.log(e);
            } else {
                console.log(data);
            }
        }); 
        console.log(hash);
    });

    res.render("dashboard", {layout:false});
});

//Router function for page not found
app.get("/error", function(req,res){
    res.sendFile(path.join(__dirname, "/error.html"));
});

//Router to using images in .html giles
app.use(express.static("img"));

// start the server to listen on HTTP_PORT
app.listen(HTTP_PORT, onHttpStart);