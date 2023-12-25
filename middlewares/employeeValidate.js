const { check } = require('express-validator');

const addEmployeeValidator = [
    check('fullname').exists().withMessage('Please enter the full name')
        .notEmpty().withMessage('Full name cannot be empty'),

    check('email').exists().withMessage('Please enter an email address')
        .notEmpty().withMessage('Email address cannot be empty')
        .isEmail().withMessage('Invalid email address'),

    check('gender').exists().withMessage('Please select a gender')
        .notEmpty().withMessage('Gender cannot be empty'),

    check('dob').exists().withMessage('Please enter the date of birth')
        .notEmpty().withMessage('Date of birth cannot be empty')
        .custom((value, { req }) => {
            const dob = new Date(value);
            const currentDate = new Date();

            const age = currentDate.getFullYear() - dob.getFullYear();

            if (age < 16) {
                throw new Error('Age must be above 16 years old');
            } else if (age > 100) {
                throw new Error('Age must below 100 years old');
            } else {
                return true
            }
        }),

    check('phone').exists().withMessage('Please enter a phone number')
        .notEmpty().withMessage('Phone number cannot be empty')
        .isMobilePhone().withMessage('Please enter a valid mobile phone number')
        .custom((value, { req }) => {
            if (value && value.charAt(0) === '0' && value.length === 10) {
                return true
            } else {
                throw new Error('Please enter a valid mobile phone number')
            }
        }),


    check('address').exists().withMessage('Please enter an address')
        .notEmpty().withMessage('Address cannot be empty'),

    // check('role').exists().withMessage('Please select a role')
    //     .notEmpty().withMessage('Role cannot be empty')
]

const editEmployeeValidator = [
    check('fullname').exists().withMessage('Please enter the full name')
        .notEmpty().withMessage('Full name cannot be empty'),

    check('email').exists().withMessage('Please enter an email address')
        .notEmpty().withMessage('Email address cannot be empty')
        .isEmail().withMessage('Invalid email address'),

    check('gender').exists().withMessage('Please select a gender')
        .notEmpty().withMessage('Gender cannot be empty'),

    check('dob').exists().withMessage('Please enter the date of birth')
        .notEmpty().withMessage('Date of birth cannot be empty'),

    check('phone').exists().withMessage('Please enter a phone number')
        .notEmpty().withMessage('Phone number cannot be empty'),

    check('address').exists().withMessage('Please enter an address')
        .notEmpty().withMessage('Address cannot be empty'),

    check('role').exists().withMessage('Please select a role')
        .notEmpty().withMessage('Role cannot be empty')
]

module.exports = {
    addEmployeeValidator,
    editEmployeeValidator
}