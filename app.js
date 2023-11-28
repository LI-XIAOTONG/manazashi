'use strict';


const express = require('express'); 
const path = require('path');
const app = express();

// set static webpage
app.use(express.static(path.join(__dirname, 'public')));

// set route
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'eyetracking.html'));
});

// list port
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log(`Server running on port ${PORT}`);
});

