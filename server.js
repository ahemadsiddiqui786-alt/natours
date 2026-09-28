/* eslint-disable */
const mongoose = require("mongoose");
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name , err.message);
    process.exit(1);
});

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
const server =app.listen(port, () => {
    console.log(`App running on port ${port}....`);
});

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name , err.message);
    server.close(() => {
        process.exit(1);
    });
});

