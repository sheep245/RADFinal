const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SalesTransactionSchema = new Schema({
    transaction_date: {
        type: Date,
        required: true
    },
    products: [{
        product_id: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        name: {
            type: String,
            required: true
        },
        price_per_unit: {
            type: Number,
            required: true
        }
    }],
    salesperson_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    customer_id: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    total_cost: {
        type: Number,
        required: true
    },
    customerGave: {
        type: Number,
        default: 0
    },
    remaining: {
        type: Number,
        default: 0
    }

})

const SalesTransaction = mongoose.model('SalesTransaction', SalesTransactionSchema)

module.exports = SalesTransaction
