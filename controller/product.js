require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { validationResult } = require('express-validator');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Product = require('../models/ProductModel');
const JsBarcode = require('jsbarcode');
const { v4: uuidv4 } = require('uuid');

const imageFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        cb(null, true);
    }
    else {
        cb(new Error('Images Only!'), false);
    }
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './public/images/products/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: imageFilter
}).single('productImage');


exports.uploadImage = (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.json({ success: false, error: err.message })
        } else if (err) {
            return res.json({ success: false, error: 'Invalid image type' })
        }
        next()
    })
}

exports.showAddProductForm = async (req, res) => {
    res.render('product', { user: req.user })
}

exports.createProduct = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg
        return res.json({ success: false, error: firstError })
    }
    
    let barcode = uuidv4();
    let existingProduct = await Product.findOne({ barcode });
    while (existingProduct) {
        barcode = uuidv4();
        existingProduct = await Product.findOne({ barcode });
    }

    const { productName, importPrice, retailPrice, category } = req.body

    let productImage = "";

    if (req.file) {
        productImage = req.file.path.replace('public\\', '');
    } else {
        return res.json({ success: false, error: 'Image is required'})
    }

    const newProduct = new Product({
        barcode,
        name: productName,
        import_price: importPrice,
        retail_price: retailPrice,
        category,
        productImage
    });

    await newProduct.save();
    res.json({success: true})
};

exports.deleteProduct = async (req, res) => {
    await Product.deleteOne({ _id: req.params.id })
    res.redirect('/product')
}

exports.searchProduct = async (req, res) => {
    const keyword = req.query.keyword;
    const products = await Product.find({ name: { $regex: keyword, $options: 'i' } });
    res.json(products);
};

exports.showEditProductForm = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.render('edit', { product, user: req.user });
    } catch (err) {
        res.json({ message: err });
    }
};

exports.getProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);
    res.json(product);
};

exports.updateProductv2 = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg
        return res.status(400).json({ success: false, error: firstError })
    }

    const { productName, importPrice, retailPrice, category } = req.body;

    let productImage = ""

    if (req.file) {
        productImage = req.file.path.replace('public\\', '');
    } else {
        return res.status(400).json({ success: false, error: 'Please provide a image' })
    }

    const updatedProductData = {
        name: productName,
        import_price: parseInt(importPrice, 10),
        retail_price: parseInt(retailPrice, 10),
        category,
        productImage
    };

    

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updatedProductData },
            { new: true }
        )

        if (!updatedProduct) {
            return res.status(404).json({ success: false, error: "No changes were made to the product" });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred during the update process" });
    }
}

exports.showProducts = async (req, res) => {
    const user = req.user
    const products = await Product.find({});
    const message = req.session.message || ''
    delete req.session.message
    res.render('product', { products, user, message, error: req.flash('error') })
}