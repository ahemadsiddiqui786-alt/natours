/* eslint-disable */
const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal then 40 characters'],
        minlength: [10, 'A tour name must have more or equal then 10 characters']
        // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size'],
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                // this only points to current doc on NEW document creation
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description'],
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function(val) {
            return Array.isArray(val) && val.length === 2;
          },
          message: 'Coordinates must be [longitude, latitude]'
        }
      },
      address: String,
      description: String
    },
    locatins: [
        {
          type: {
            type: String,
            default: 'Point',
            enum: ['Point']
          },
          coordinates: [Number],
          address: String,
          description: String,
          day: Number
        }
    ],
    guides: [
     {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
     }
    ]
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: run before .save() and .create()
tourSchema.pre('save', function () {
    this.slug = slugify(this.name, { lower: true });

    // Remove startLocation if no valid coordinates (prevents MongoDB geo index error)
    if (this.startLocation && (!this.startLocation.coordinates || this.startLocation.coordinates.length !== 2)) {
        this.startLocation = undefined;
    }
});

// tourSchema.pre('save', async function () {
//     if (!this.guides || !this.guides.length) return;
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
// })

// tourSchema.post('save', function(doc,next){
//     console.log('Will save document...');
//     next();
// });

// tourSchema.post('save', function(doc,next){
//     console.log(doc);
//     next();
// });
//QUERY MIDDLEWARE
// tourSchema.pre('find', function(next){
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } })

    this.start = Date.now();
    // next();
});

tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    // next();
})

tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`)
    next();
});

//AGGRESSION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    console.log(this.pipeline());
    next();
});

// Create 2dsphere index for GeoJSON (sparse - only index valid points)
// tourSchema.index({ startLocation: '2dsphere' }, { sparse: true });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
