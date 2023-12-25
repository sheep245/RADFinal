const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ProductSchema = mongoose.Schema({
    barcode: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    import_price: {
        type: Number,
        required: true
    },
    retail_price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    productImage: {
        type: String,
        required: true
    }
})

const Product = mongoose.model('Products', ProductSchema)

module.exports = Product;
