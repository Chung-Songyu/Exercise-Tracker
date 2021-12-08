require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use("/api/users", bodyParser.urlencoded({"extended": false}));

const userSchema = new mongoose.Schema({
  username: {type: String, required: true, trim: true},
  log: [{description: {type: String, trim: true}, duration: {type: Number, required: true}, date: {type: Date, required: true}}]
});
const User = mongoose.model("User", userSchema);

app.post("/api/users", (req, res) => {
  const newUserDocument = new User({
    "username": req.body.username
  });
  newUserDocument.save((err, data) => {
    console.log("user saved");
    res.json({"username": req.body.username, "_id": data._id});
    return data;
  });
});

app.get("/api/users", (req, res) => {
  const findAllUsers = User.find({}, (err, data) => {
    res.json(data);
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const addExercise = User.findById({_id: req.params._id}, (err, data) => {
    let newDate = null;
    if(!req.body.date) {
      newDate = new Date();
    } else {
      newDate = new Date(req.body.date);
    };
    data.log.push({
      description: req.body.description,
      duration: req.body.duration,
      date: newDate
    });
    data.save((err, data) => {
      res.json({"_id": data._id, "username": data.username, "date": newDate.toDateString(), "duration": Number(req.body.duration), "description": req.body.description});
      console.log("exercise added");
      return data;
    });
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const getLog = User.findById({_id: req.params._id}).select("-__v").exec((err, data) => {
    const finalJson = {"_id": data._id, "username": data.username};
    const sortedDateLog = data.log.sort((a,b) => b.date - a.date);
    let fromLog = [];
    let toLog = [];

    if(req.query.from) {
      const fromDate = new Date(req.query.from);
      finalJson.from = fromDate.toDateString();
      for(i=0; i<sortedDateLog.length; i++) {
        if(sortedDateLog[i].date>=fromDate) {
          fromLog.push(sortedDateLog[i]);
        };
      };
    } else {
      fromLog = [...sortedDateLog];
    };

    if(req.query.to) {
      const toDate = new Date(req.query.to);
      finalJson.to = toDate.toDateString();
      for(i=0; i<fromLog.length; i++) {
        if(fromLog[i].date<=toDate) {
          toLog.push(fromLog[i]);
        };
      };
    } else {
      toLog = [...fromLog];
    };

    if(req.query.limit) {
      toLog.splice(req.query.limit);
    };

    let convertedDateLog = [];
    for(i=0; i<toLog.length; i++) {
      let exerciseObject = {
        description: toLog[i].description,
        duration: toLog[i].duration,
        date: toLog[i].date.toDateString()
      };
      convertedDateLog.push(exerciseObject);
    };
    finalJson.count = convertedDateLog.length;
    finalJson.log = convertedDateLog;
    res.json(finalJson);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
