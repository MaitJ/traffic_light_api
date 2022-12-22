const express = require('express')
const parser = require('body-parser');
const cors = require('cors');
const {TimeCalculations} = require('./time_calc')


const app = express()
app.use(cors());
app.use(parser.urlencoded({extended: false}));
app.use(parser.json());
const port = process.env.PORT || 3000;


const timeCalculations = new TimeCalculations(20000);

//Salvestab aja, millal arduino tööle läks
//Tuleks kutsuda kui arduino tööle läheb
app.get('/arduino_start/:board_id', async (req, res) => {
    const millis_from_start = req.query.start_millis;
    const current_time = Date.now();
    const arduino_start = current_time - millis_from_start;

    const arduino_millis = await timeCalculations.getArduinoMillis();
    const arduino_starts = await timeCalculations.getArduinoStarts();

    const board_id = req.params.board_id;
    arduino_millis[board_id] = 0;
    arduino_starts[board_id] = arduino_start;

    const new_starts = {
        arduinoStarts: arduino_starts
    };
    timeCalculations.setArduinoStarts(new_starts);

    return res.status(200).send();
})


app.listen(port, () => {
    console.log('Started app on :%d', port);
})

//Kui on kutsutud arduino_start route'i, siis selle route'iga saaks järgmise tsükli aja konkreetsele arduinole
app.get('/get_arduino_start/:light_id', timeCalculations.cycleUpdateMiddleware, async (req, res) => {
    const board_id = req.params.light_id;
    await timeCalculations.calculateArduinoMillis(board_id);
    const arduino_millis = await timeCalculations.getArduinoMillis();

    res.status(200).json({
        //Adding 2 because 0 and 1 are used by web traffic_lights
        start: arduino_millis[Number(req.params.light_id)]
    });
})

app.get('/cycle_length', async (req, res) => {
    const cycle_length = await timeCalculations.getCycleLength();
    res.status(200).json({
        cycle_length
    });
})

//Konkreetse netifoori järgmine stardi aeg
//Kasutab ka foori nihkeid andmebaasist
app.get('/get_start_time/:board_id', timeCalculations.cycleUpdateMiddleware, async (req, res) => {
    const light_offsets = req.light_offsets;
    const board_id = req.params.board_id;

    res.status(200).json({
        start: await timeCalculations.getStartTime() + light_offsets[board_id]
    });
})

app.get('/get_cycle_length', async (req, res) => {
    res.status(200).json({
        cycleLength: await timeCalculations.getCycleLength()
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