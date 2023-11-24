'use strict';


const express = require('express');
const app = express();

// ?�u��?����?
app.use(express.static('public'));

// ?�u�H�R
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/eyetracking.html');
});

// ?�ߒ[��
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log(`Server running on port ${PORT}`);
});

