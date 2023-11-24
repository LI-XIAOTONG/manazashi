'use strict';


const express = require('express');
const app = express();

// ?置静?文件?
app.use(express.static('public'));

// ?置路由
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/eyetracking.html');
});

// ?听端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log(`Server running on port ${PORT}`);
});

