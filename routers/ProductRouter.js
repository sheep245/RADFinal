const express = require('express');
const router = express.Router();
const productController = require('../controller/product');
const { productValidator } = require('../middlewares/productValidator');
const { cookieJwtAuth } = require('../middlewares/jwtAuth')

router.get('/', cookieJwtAuth, productController.showProducts);

router.get('/add', cookieJwtAuth, productController.showAddProductForm);

router.post('/add', cookieJwtAuth, productController.uploadImage, productValidator, productController.createProduct);

router.post('/delete/:id', cookieJwtAuth, productController.deleteProduct);

router.get('/search', cookieJwtAuth, productController.searchProduct);

router.get('/edit/:id', cookieJwtAuth, productController.getProduct);

router.post('/edit/:id', cookieJwtAuth, productController.uploadImage, productValidator, productController.updateProductv2);

module.exports = router
