const { check } = require('express-validator')

module.exports = [
    check('totalPrice')
        .exists().withMessage('Vui lòng cup cấp tên sản phẩm')
        .notEmpty().withMessage('Tên sản phẩm không được để trống')
        .isFloat({ gt: 0 }).withMessage('Số tiền không hợp lệ')
]