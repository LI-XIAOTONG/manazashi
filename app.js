'use strict';


const express = require('express'); 
const path = require('path');
const app = express();

// ?�u��?����?
app.use(express.static(path.join(__dirname, 'public')));

// ?�u�H�R
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'eyetracking.html'));
});

// ?�ߒ[��
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log(`Server running on port ${PORT}`);
});

