//// Import modules/packages/files
require('dotenv').config();
const express = require('express');
const app = express();

// (Netlify deployment) - Routing
const router = express.Router();

const mongoose = require('mongoose');
const path = require('path');

//// Listen is needed or Node.js will just exit silently i.e. app shut down
// (Netlify deployment) - Not required
// const listener = app.listen(process.env.PORT, () => {
//     console.log('Your app is listening on port ' + listener.address().port);
// });

//// Serve static files
app.use(express.static('public'));

//// Routing
// (Netlify deployment) - Routing
//app.get('/', (req, res) => {
// app.get('/', (req, res) => {
//    res.sendFile(path.join(__dirname, "../../public/index.html"));
//});

//// Netlify test
app.use("/", router);
router.get("/hello", (req, res) => res.send("Hello World!"));

//// Netlify working config
/*
app.use("/server", router);
router.get("/hello", (req, res) => res.send("Hello World!"));
*/

/*
//// Connect to database
// Fix for Node.js bug. Refer to https://stackoverflow.com/questions/79873598
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

// Sample code provided by MongoDB (modified)
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
async function run() {
    try {
        // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
        await mongoose.connect(process.env.MONGO_URI, clientOptions);
        // Test connection by pinging "admin" database
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

    } finally {
        // Ensures that the client will close when you finish/error
        //await mongoose.disconnect();
    }
}
run().catch(console.error);

//// Define DB Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50, "Username should be 50 characters or less."]
    },
    // Exercise log
    log: [{
        description: {
            type: String,
            default: '',
            required: true,
            trim: true,
            maxlength: [200, "Description should be 200 characters or less."]
        },
        duration: {
            type: Number,
            required: true,
            trim: true,
            min: [1, "Duration should be 1 or more."],
            max: [1440, "Duration should be 1440 or less."]
        },
        date: {
            type: Date,
            default: Date.now,
            required: true
        }
    }]
});

//// Create model (model name, schema, DB collection name)
const User = mongoose.model("User", userSchema, "Users");

//// Parse JSON requests from endpoint
// (Netlify deployment) - Routing
app.use("/api/users", express.json());
//app.use("/api/users", express.json());

//// Create new user
// (Netlify deployment) - Routing
router.post("/api/users", async (req, res) => {
// app.post("/api/users", async (req, res) => {
    try {
        console.log("Create new user: " + req.body.username);

        const user = await User.create({
            username: req.body.username
        });

        console.log(
            "Create new user successful: " + user.username + "\n" +
            "_id: " + user._id
        );
        res.status(201).json(user);

    } catch (err) {
        console.log("Create new user unsuccessful: " + err.message);
        res.status(400).json({ error: "Create new user unsuccessful" });
    }
});

//// Enable indented JSON
app.set("json spaces", 4);

//// Get all users
// (Netlify deployment) - Routing
router.get("/api/users", async (req, res) => {
// app.get("/api/users", async (req, res) => {
    try {
        console.log("Get all users");

        const findAllUsers = await User.find({});

        console.log("Get all users successful");
        res.status(200).json(findAllUsers);

    } catch (err) {
        console.log("Get all users unsuccessful: " + err.message);
        res.status(500).json({ error: "Get all users unsuccessful" });
    }
});

//// Parse URL encoded requests from endpoint
app.use("/api/users/:_id/exercises", express.urlencoded({ extended: false }));

//// Add new exercise
// (Netlify deployment) - Routing
router.post("/api/users/:_id/exercises", async (req, res) => {
// app.post("/api/users/:_id/exercises", async (req, res) => {
    try {
        console.log(
            "Add new exercise:" + "\n" +
            "{_id: " + req.params._id + "\n" +
            "description: " + req.body.description + "\n" +
            "duration: " + req.body.duration + "\n" +
            "date: " + req.body.date + "}"
        );

        const user = await User.findById(req.params._id);
        
        // User not found
        if (!user) {
            console.log("Add new exercise unsuccessful. User not found: " + req.params._id);
            return res.status(404).json({ error: "User not found" });
        }

        // Set exercise date
        let exerciseDate = null;
        if (!req.body.date) {
            exerciseDate = new Date();
        } else {
            exerciseDate = new Date(req.body.date);
        };

        user.log.push({
            description: req.body.description,
            duration: req.body.duration,
            date: exerciseDate
        });
        
        await user.save()
            .then(savedUser => {
                res.status(201).json({
                    "_id": savedUser._id,
                    "username": savedUser.username,
                    "description": req.body.description,
                    "duration": Number(req.body.duration),
                    "date": exerciseDate.toDateString()
                });
                console.log("Add new exercise successful for user " + savedUser._id);
                return;
            })
    } catch (err) {
        console.log("Add new exercise unsuccessful: " + err.message);
        res.status(400).json({ error: "Add new exercise unsuccessful" });
    }
});

//// Get logs for user
// (Netlify deployment) - Routing
router.get("/api/users/:_id/logs", async (req, res) => {
// app.get("/api/users/:_id/logs", async (req, res) => {
    try {
        console.log("Get logs for user " + req.params._id);

        // Check valid "from" date
        if (req.query.from && new Date(req.query.from) =="Invalid Date") {
            return res.status(400).json({ error: "Invalid from date" });
        }

        // Check valid "to" date
        if (req.query.to && new Date(req.query.to) == "Invalid Date") {
            return res.status(400).json({ error: "Invalid to date" });
        }

        // Check valid limit
        const regexNum = /^[0-9]+$/;
        if (req.query.limit && !regexNum.test(req.query.limit)) {
            return res.status(400).json({ error: "Invalid limit" });
        }

        // Exclude __v field in response
        const user = await User.findById(req.params._id).select("-__v");

        // User not found
        if (!user) {
            console.log("Get logs for user unsuccessful. User not found: " + req.params._id);
            return res.status(404).json({ error: "User not found" });
        }
        
        const finalJson = {
            "_id": user._id,
            "username": user.username
        };

        // Sort retrieved logs from latest to earliest
        const sortedDateLog = user.log.sort((a, b) => b.date - a.date);
        let fromLog = [];
        let toLog = [];
        
        // Exclude logs that are earlier than "from" date
        if (req.query.from) {
            const fromDate = new Date(req.query.from);
            finalJson.from = fromDate.toDateString();
            for (i = 0; i < sortedDateLog.length; i++) {
                if (sortedDateLog[i].date >= fromDate) {
                    fromLog.push(sortedDateLog[i]);
                };
            };
        } else {
            fromLog = [...sortedDateLog];
        };

        // Exclude logs that are later than "to" date
        if (req.query.to) {
            const toDate = new Date(req.query.to);
            finalJson.to = toDate.toDateString();
            for (i = 0; i < fromLog.length; i++) {
                if (fromLog[i].date <= toDate) {
                    toLog.push(fromLog[i]);
                };
            };
        } else {
            toLog = [...fromLog];
        };
        
        // Reduce number of logs returned to the "limit"
        if (req.query.limit) {
            toLog.splice(req.query.limit);
        };

        // Format JSON response
        let requestedLogs = [];
        for (i = 0; i < toLog.length; i++) {
            let exerciseObject = {
                description: toLog[i].description,
                duration: toLog[i].duration,
                date: toLog[i].date.toDateString()
            };
            requestedLogs.push(exerciseObject);
        };
        finalJson.count = requestedLogs.length;
        finalJson.log = requestedLogs;

        console.log("Get logs for user " + req.params._id + "successful");
        res.status(200).json(finalJson);

    } catch (err) {
        console.log("Get logs for user " + req.params._id + "unsuccessful: " + err.message);
        res.status(500).json({ error: "Get logs for user unsuccessful" });
    }
});

//// Error page
app.use((req, res) => {
    if (req.path.startsWith("/api")) {
        return res.status(404).json({
            error: "Page not found"
        });
    }

    res.status(404).sendFile(path.join(__dirname, "../../public/error.html"));
});*/

//// (Netlify deployment) - Export the wrapped app handler
const serverless = require('serverless-http');
export const handler = serverless(app);