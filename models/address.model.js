const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    PsgcCode: Number,
    Name: String,
    CorrespondenceCode: Number,
    GeographicLevel: String,
    OldNames: String,
});

const address = mongoose.model('Address', addressSchema);
module.exports = address;
