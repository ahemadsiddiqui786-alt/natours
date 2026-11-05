/* eslint-disable */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/TourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: path.join(__dirname, '../../config.env') });

const DB = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/natours-test';

const tours = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'tours.json'), 'utf-8')
);
const users = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'users.json'), 'utf-8')
);
const reviews = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'reviews.json'), 'utf-8')
);

const importData = async () => {
    try {
        // Import in order: users -> tours -> reviews (due to references)
        // Use bulkWrite with upsert to bypass User model middleware (pre-save password hashing)
        // Convert _id strings to ObjectIds
        const { ObjectId } = mongoose.Types;
        await User.collection.bulkWrite(
            users.map((user) => ({
                replaceOne: {
                    filter: { _id: new ObjectId(user._id) },
                    replacement: { ...user, _id: new ObjectId(user._id) },
                    upsert: true,
                },
            }))
        );
        console.log('Users imported successfully');

        await Tour.bulkWrite(
            tours.map((tour) => ({
                replaceOne: {
                    filter: { name: tour.name },
                    replacement: tour,
                    upsert: true,
                },
            }))
        );
        console.log('Tours imported successfully');

        await Review.bulkWrite(
            reviews.map((review) => ({
                replaceOne: {
                    filter: { _id: review._id },
                    replacement: review,
                    upsert: true,
                },
            }))
        );
        console.log('Reviews imported successfully');

        console.log('All data successfully loaded!');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
};

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('All data successfully deleted');
        process.exit();
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
};

mongoose
    .connect(DB)
    .then(() => {
        console.log('MongoDB connected successfully');

        if (process.argv.includes('--import')) {
            return importData();
        }

        if (process.argv.includes('--delete')) {
            return deleteData();
        }

        console.log('Use --import or --delete');
        return mongoose.connection.close();
    })
    .catch((error) => {
        console.error('MongoDB connection failed:', error);
        process.exitCode = 1;
    });

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}