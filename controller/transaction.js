require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { validationResult, body } = require('express-validator');
const Product = require('../models/ProductModel');
const Customer = require('../models/CustomerModel');
const SalesTransaction = require('../models/SalesTransactionModel');
exports.transaction = async (req, res) => {
    try {
        const products = await Product.find().select('name productImage retail_price'); // Lấy tên, hình ảnh và giá bán lẻ của sản phẩm
        res.render('transaction', { products: products, user: req.user });
    } catch (err) {
        console.log(JSON.stringify(err));
    }
};

exports.saveCustomer = async (req, res) => {
    const { phone, name, address } = req.body;
    let customer = await Customer.findOne({ phone: phone });
    if (!customer) {
        customer = new Customer({ phone: phone, name: name, address: address });
    } else {
        customer.name = name;
        customer.address = address;
    }
    await customer.save();
    res.json({ success: true, customer: customer });
};

exports.savePurchase = async (req, res) => {
    const { total, phone, name, address, customerGave, remaining, products } = req.body;
    // console.log(req.user);
    let customer = await Customer.findOne({ phone: phone });

    const salesTransaction = new SalesTransaction({
        transaction_date: new Date(),
        products: products,
        // salesperson_id: req.user._id,
        customer_id: customer._id,
        total_cost: total,
        customerGave,
        remaining
    });

    const savedSalesTransaction = await salesTransaction.save();

    customer.purchaseHistory.push(savedSalesTransaction._id);

    await customer.save();

    res.json({
        success: true, data: { transaction: savedSalesTransaction, user: customer },
    });
};


exports.search = async (req, res) => {
    const keyword = req.query.keyword;
    const regex = new RegExp(keyword, 'i');

    const products = await Product.find({
        $or: [
            { name: regex },
            { barcode: regex }
        ]
    });
    res.json(products);
}