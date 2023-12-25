const { check } = require('express-validator')

const registerValidator = [
    check('password').exists().withMessage('Please enter a password')
        .notEmpty().withMessage('Password cannot be empty')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

    check('confirmPassword').exists().withMessage('Please confirm your password')
        .notEmpty().withMessage('Password confirmation cannot be empty')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match')
            }
            return true
        })
]

const loginValidator = [
    check('username').exists().withMessage('Please enter username')
        .notEmpty().withMessage('Username cannot be empty'),


    check('password').exists().withMessage('Please enter a password')
        .notEmpty().withMessage('Password cannot be empty')
]

const changePasswordValidator = [
    check('currentPassword').exists().withMessage('Please enter current password')
        .notEmpty().withMessage('Current password cannot be empty'),
        
    check('newPassword').exists().withMessage('Please enter a new password')
        .notEmpty().withMessage('Password cannot be empty')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

    check('confirmPassword').exists().withMessage('Please confirm your password')
        .notEmpty().withMessage('Password confirmation cannot be empty')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
]

const resetPassword = [
    check('email').exists().withMessage('Please enter an email address')
        .notEmpty().withMessage('Email address cannot be empty')
        .isEmail().withMessage('Invalid email address'),
]

module.exports = {
    registerValidator,
    loginValidator,
    changePasswordValidator,
    resetPassword
}
