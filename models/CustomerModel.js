const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSchema = new Schema({
    phone: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    purchaseHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'SalesTransaction'
    }]
});

const Customer = mongoose.model('Customers', CustomerSchema);

module.exports = Customer;