/* eslint-disable */
const mongoose = require("mongoose");
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

mongoose.connect("mongodb://localhost:27017/natours-test")
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error);
    });




console.log(process.env);



const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`App running on port ${port}....`);
});
