const { check } = require('express-validator')

const productValidator = [
    check('productName')
        .exists().withMessage('Please provide a product name')
        .notEmpty().withMessage('Product name cannot be empty'),

    check('importPrice')
        .exists().withMessage('Please provide an import price')
        .notEmpty().withMessage('Import price cannot be empty')
        .isNumeric().withMessage('Import price must be a number'),

    check('retailPrice')
        .exists().withMessage('Please provide a retail price')
        .notEmpty().withMessage('Retail price cannot be empty')
        .isNumeric().withMessage('Retail price must be a number'),

    check('category')
        .exists().withMessage('Please provide a category')
        .notEmpty().withMessage('Category cannot be empty'),
]

module.exports = {
    productValidator,
}