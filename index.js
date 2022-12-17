const express = require('express')
const fs = require('fs');
const parser = require('body-parser');
const cors = require('cors');
const {getDatabase} = require('firebase/database');
const {cycleUpdateMiddleware, getStartTime, getArduinoMillis, getArduinoStarts} = require('./time_calc')


const app = express()
app.use(cors());
app.use(parser.urlencoded({extended: false}));
app.use(parser.json());
const port = process.env.PORT || 3000;


app.get('/arduino_start/:board_id', async (req, res) => {
    const current_time = Date.now();

    const arduino_millis = getArduinoMillis();
    const arduino_starts = getArduinoStarts();

    const board_id = req.params.board_id;
    arduino_millis[board_id] = 0;
    arduino_starts[board_id] = current_time;

    console.log(arduino_starts);
    return res.status(200).send();
})


app.listen(port, () => {
    console.log('Started app on :%d', port);
})

app.get('/get_arduino_start/:light_id', cycleUpdateMiddleware, (req, res) => {
    const arduino_millis = getArduinoMillis();
    console.log('arduino_millis (get): ', arduino_millis);

    res.status(200).json({
        start: arduino_millis[Number(req.params.light_id)]
    });
})

app.get('/get_start_time', (req, res) => {
    res.status(200).json({
        start: getStartTime()
    });
})

app.get('/set_start_time', cycleUpdateMiddleware, (req, res) => {
    res.status(200).json({
        status: "Time set!"
    });
})