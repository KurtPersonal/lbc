const mongoose = require('mongoose');

const unmapSchema = new mongoose.Schema({
    TrackingNumber: String,
    SourceAddress: String,
    Label: String,
    Barangay: String,
    Region: String,
    Province: String,
    City: String,
});

const Unmap = mongoose.model('Unmap', unmapSchema);
module.exports = Unmap;
