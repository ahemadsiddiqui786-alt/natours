/* eslint-disable */
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');


const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user: user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password!', 401));
    }

    // 3) If everything  ok, send token to client
    createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
    console.log("PROTECT");
    //1) Getting token and check of it's there
    
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please login to get access.', 401));
    }
    //2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser) {
       return next(
         new AppError(
            'The user belonging to this token does no longer exist',
             401
            )
        );
    }   

    //4) Check if user changed password after the token was issued
    if(currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                'User recently changed password! Please log in again.',
                401
            )
        );
    };

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles = ['admin', 'lead-guide']. role='user'
        if(!roles.includes(req.user.role)) {
            return next(new AppError(`You do not have permission to perform this action`, 403)
        );
     }
        next();
   };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  console.log('=== FORGOT PASSWORD START ===');
  console.log('Email:', req.body.email);
  
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  console.log('User found:', user ? 'YES' : 'NO');
  if (!user) {
    console.log('No user found, returning 404');
    return next(new AppError('There is no user with that email address.', 404));
  }

  // 2) Generate the random reset token
  console.log('Generating reset token...');
  const resetToken = user.createPasswordResetToken();
  console.log('Reset token generated:', resetToken);
  console.log('Hashed token in user:', user.resetPasswordToken);
  console.log('Expires:', user.resetPasswordExpires);
  
  console.log('Saving user...');
  try {
    await user.save({ validateBeforeSave: false });
    console.log('User saved successfully');
    
    // Verify it was saved
    const savedUser = await User.findById(user._id);
    console.log('After save - Hashed token in DB:', savedUser.resetPasswordToken);
    console.log('After save - Expires:', savedUser.resetPasswordExpires);
  } catch (saveErr) {
    console.error('SAVE ERROR:', saveErr);
    throw saveErr;
  }

  // 3) Send it to user's email
  const resetURl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and
    passwordConfirm to : ${resetURl}.\n If you didn't forget your password, please ignore this
    email!`;

  console.log('Sending email to:', user.email);
  console.log('Reset URL:', resetURl);
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });
    console.log('Email sent successfully');

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch(err) {
    console.error('Email error:', err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!',
        500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    console.log('=== RESET PASSWORD START ===');
    console.log('Token from params:', req.params.token);
    console.log('Body:', req.body);
    
    //1) Get token based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    console.log('Hashed token:', hashedToken);
    
    // First, check what's in the DB without expiration filter
    const userWithToken = await User.findOne({ resetPasswordToken: hashedToken });
    console.log('User with matching token (no expiry check):', userWithToken ? 'YES' : 'NO');
    if (userWithToken) {
        console.log('Token expires:', userWithToken.resetPasswordExpires);
        console.log('Now:', new Date());
        console.log('Expired?', userWithToken.resetPasswordExpires < Date.now());
    }
    
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() } 
    });
    console.log('User found (with expiry):', user ? 'YES' : 'NO');
    
    //2) If token has not expired, and there is user, set the new password
    if(!user) {
        console.log('No user found, returning 400');
        return next(new AppError('Token is invalid or has expired', 400));
    }
    console.log('Setting new password...');
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    console.log('User saved successfully');
  
    //3) Update changedPasswordAt property for the user (handled by pre-save middleware)

    //4) Log the user in, send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong', 401));
    }
    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
});