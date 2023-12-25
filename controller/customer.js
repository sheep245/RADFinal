require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { validationResult } = require('express-validator')
const Customer = require('../models/CustomerModel');

exports.customer = async (req, res) => {
    try {
        const customers = await Customer.find()        
        res.render('customer', { customers, user: req.user });
    } catch (err) {
        console.log(JSON.stringify(err));
    }
};

exports.checkCustomer = async (req, res) => {
    const phone = req.params.phone
    const customer = await Customer.findOne({ phone: phone })
    if (customer) {
        res.json({ exists: true, customer: customer })
    }
}