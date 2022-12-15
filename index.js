const express = require('express')
const fs = require('fs');
const parser = require('body-parser');
const cors = require('cors');
const {initializeApp} = require('firebase/app');
const {getDatabase, update, ref, child, get} = require('firebase/database');

const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "budget-kahoot.firebaseapp.com",
    databaseURL: "https://budget-kahoot-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "budget-kahoot",
    storageBucket: "budget-kahoot.appspot.com",
    messagingSenderId: "332478696005",
    appId: "1:332478696005:web:2b6adcec8ceeb90b4c312c"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

const app = express()
app.use(cors());
app.use(parser.urlencoded({extended: false}));
app.use(parser.json());
const port = process.env.PORT || 3000;

app.get('/arduino_start/:board_id', async (req, res) => {
    const current_time = Date.now();
    const base_ref = ref(db, "traffic_lights/");

    const data = (await get(base_ref)).val();
    /*
    const data = {};
    data[req.params.board_id] = current_time;

    const ref = ref(db, 'traffic_lights');
    */
    /*
    const data = {
        arduinoNextOffsets: {},
        arduinoStarts: {}
    };
    */

    const board_id = req.params.board_id;
    data.arduinoNextOffsets[board_id] = 0;
    data.arduinoStarts[board_id] = current_time;
    update(base_ref, data);
    console.log(data);
    return res.status(200).send();
})


app.listen(port, () => {
    console.log('Started app on :%d', port);
})

const calculateArduinoMillis = async () => {
    console.log('calculateArduinoMillis');
    
    //const arduino_starts = (await get(ref(db, 'traffic_lights/arduinoStarts'))).val();
    //const next_start_time = (await get(ref(db, 'traffic_lights/startTime/time'))).val();
    const traffic_lights = (await get(ref(db, 'traffic_lights'))).val();

    const arduino_starts = traffic_lights.arduinoStarts;
    const next_start_time = traffic_lights.startTime.time;
    const arduino_offsets = traffic_lights.arduinoNextOffsets;

    let arduino_starts_millis = {};

    arduino_starts.forEach((start_time, i) => {
        const offset = next_start_time - start_time;
        if (offset != arduino_offsets[i])
            arduino_starts_millis[i] = offset;
    })

    update(ref(db, 'traffic_lights/arduinoNextOffsets'), arduino_starts_millis);
    console.log(arduino_starts_millis);
}

const updateCycleTime = () => {
    console.log('updateCycleTime');
    let current_time = Date.now();
    const cycle_time = 10 * 1000;
    
    const db_start_time_ref = ref(db, 'traffic_lights/startTime');
    get(db_start_time_ref).then((snapshot) => {
        if (snapshot.exists()) {
            const db_time = snapshot.val();
            console.log('db_time: ', db_time.time);
            if (current_time > (db_time.time - 1000)) {
                current_time = Date.now();
                const new_cycle = current_time + cycle_time;
                const time_ref = ref(db, 'traffic_lights/startTime');
                const data = {time: new_cycle};

                update(time_ref, data);
                //console.log('updated: ', data);
            }
        }
    })
}

setInterval(updateCycleTime, 1000);
setInterval(calculateArduinoMillis, 1000);