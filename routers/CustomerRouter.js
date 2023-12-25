const express = require('express')
const router = express.Router()
const controller = require('../controller/customer')
const { cookieJwtAuth } = require('../middlewares/jwtAuth')

router.get('/', cookieJwtAuth, controller.customer)
router.get('/check-customer/:phone', controller.checkCustomer)
module.exports = router