const express = require('express');
const router = express.Router();
const controller = require('../controller/transaction')
const { cookieJwtAuth } = require('../middlewares/jwtAuth')

router.get('/', cookieJwtAuth, controller.transaction);

router.post('/save-customer',  controller.saveCustomer);
router.post('/save-transaction' , controller.savePurchase);
router.get('/search', controller.search);
module.exports = router;
