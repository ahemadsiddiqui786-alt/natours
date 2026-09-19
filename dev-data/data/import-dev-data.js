/* eslint-disable */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/TourModel');

dotenv.config({ path: path.join(__dirname, '../../config.env') });

const DB = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/natours-test';
const tours = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'tours-simple.json'), 'utf-8')
);
const requiredFields = [
    'name',
    'duration',
    'maxGroupSize',
    'difficulty',
    'price',
    'summary',
    'imageCover',
];

const validTours = tours.filter((tour) =>
    requiredFields.every((field) => tour[field] !== undefined)
);
const invalidTours = tours.filter((tour) =>
    requiredFields.some((field) => tour[field] === undefined)
);

const importData = async () => {
    try {
        if (invalidTours.length > 0) {
            console.warn(
                `Skipping ${invalidTours.length} invalid tour record(s): ${invalidTours
                    .map((tour) => tour.name || tour.id || 'unknown')
                    .join(', ')}`
            );
        }

        await Tour.bulkWrite(
            validTours.map((tour) => ({
                replaceOne: {
                    filter: { name: tour.name },
                    replacement: tour,
                    upsert: true,
                },
            }))
        );
        console.log('Data successfully loaded');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
};

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        console.log('Data successfully deleted');
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

