const express = require('express')
const fs = require('fs');
const parser = require('body-parser');
const cors = require('cors');
const {initializeApp} = require('firebase/app');
const {getDatabase, get, ref} = require('firebase/database');
const {TimeCalculations} = require('./time_calc')


const app = express()
app.use(cors());
app.use(parser.urlencoded({extended: false}));
app.use(parser.json());
const port = process.env.PORT || 3000;

const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "budget-kahoot.firebaseapp.com",
    databaseURL: "https://budget-kahoot-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "budget-kahoot",
    storageBucket: "budget-kahoot.appspot.com",
    messagingSenderId: "332478696005",
    appId: "1:332478696005:web:2b6adcec8ceeb90b4c312c"
};

//const firebaseApp = initializeApp(firebaseConfig);
//const db = getDatabase(firebaseApp);

//const db_cycle_length_ref = ref(db, 'traffic_lights/cycleLength');
//const cycle_length = (await get(db_cycle_length_ref)).val();
const timeCalculations = new TimeCalculations(20000);



app.get('/arduino_start/:board_id', async (req, res) => {
    const current_time = Date.now();

    const arduino_millis = timeCalculations.getArduinoMillis();
    const arduino_starts = timeCalculations.getArduinoStarts();

    const board_id = req.params.board_id;
    arduino_millis[board_id] = 0;
    arduino_starts[board_id] = current_time;
    setArduinoStarts(arduino_starts);

    console.log("arduino_start: " + arduino_starts + "with id: " + board_id);
    return res.status(200).send();
})


app.listen(port, () => {
    console.log('Started app on :%d', port);
})

app.get('/get_arduino_start/:light_id', timeCalculations.cycleUpdateMiddleware, async (req, res) => {
    const board_id = req.params.light_id;
    calculateArduinoMillis(board_id);
    const arduino_millis = getArduinoMillis();
    console.log('arduino_millis (' + board_id + ') : ' + arduino_millis);

    res.status(200).json({
        start: arduino_millis[Number(req.params.light_id)]
    });
})

app.get('/get_start_time/:board_id', timeCalculations.cycleUpdateMiddleware, (req, res) => {
    const board_id = req.params.board_id;
    timeCalculations.calculateArduinoMillis(board_id);
    const rand = Math.random() * 1000;
    console.log('random time: ', rand);
    setTimeout(() => {
        console.log('sent start_time');
        res.status(200).json({
            start: timeCalculations.getStartTime()
        });
    }, rand);
})

app.get('/get_cycle_length', (req, res) => {
    res.status(200).json({
        cycleLength: timeCalculations.getCycleLength()
    });
})

app.get('/set_cycle_length/:length', (req, res) => {
    const length = req.params.length;
    timeCalculations.setCycleLength(Number(length));
    res.status(200).send("Cycle length set!");
})

app.get('/set_green_wave/:state', (req, res) => {
    const state = req.params.state;
    setGreenWave(Number(state));
    res.status(200).send("Green wave set!");
})

app.get('/set_yellow_state/:board_id/:state', (req, res) => {
    const board_id = req.params.board_id;
    const state = req.params.state;
    timeCalculations.setYellowState(board_id, state)
    res.status(200).send("Board " + board_id + " state set!");
})

app.get('/get_yellow_state/:board_id', (req, res) => {
    const board_id = req.params.board_id;
    const states = timeCalculations.getYellowStates();
    res.status(200).json({
        state: states[Number(board_id)]
    });
})