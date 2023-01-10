const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();

app.use('/', require('./routes/address.router'));
app.use('/', require('./routes/unmap.router'));

app.use((err, req, res, next) => {
    const { message, statusCode } = err;
    return res.json({ message });
});

const start = async () => {
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log(`db started`);
    await app.listen(process.env.PORT);
    console.log(`app started on port ${process.env.PORT}`);
};

start();
