const {getDatabase, ref, get} = require('firebase/database');
const {initializeApp} = require('firebase/app');

let start_time = 0;
let arduino_millis = [0, 0]
let arduino_starts = [0, 0]
let yellow_states = [0, 0, 0, 0];
// 1. Arduino 0, 2. Arduino 1, 3. Network light 0, 4. Network light 1
let cycleLength = 20000;

const firebaseConfig = {
    apiKey: "AIzaSyBt0s4jGLD1k3_p8SfGS4yhoil0BKmZgKE",
    authDomain: "budget-kahoot.firebaseapp.com",
    databaseURL: "https://budget-kahoot-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "budget-kahoot",
    storageBucket: "budget-kahoot.appspot.com",
    messagingSenderId: "332478696005",
    appId: "1:332478696005:web:2b6adcec8ceeb90b4c312c"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

const calculateArduinoMillis = async (board_id) => {
    console.log('start_time: ', start_time);
    console.log('brdId: ', board_id);
    const l_start_time = arduino_starts[board_id];
    const offset = start_time - l_start_time;
    if (offset != arduino_millis[i])
        arduino_millis[i] = offset;
    // arduino_starts.forEach((l_start_time, i) => {
    //     console.log('l_start_time: ', l_start_time);
    // })
}

const updateCycleTime = async () => {
    console.log('updateCycleTime');
    let current_time = Date.now();
    const db_cycle_length_ref = ref(db, 'traffic_lights/cycleLength');
    
    const cycle_length = (await get(db_cycle_length_ref)).val();
    console.log('cycle_length: ', cycle_length);

    if (current_time > (start_time - 1000)) {
        current_time = Date.now();
        const new_cycle = current_time + cycle_length;
        start_time = new_cycle;
    }
}

const cycleUpdateMiddleware = async (req, res, next, board_id) => {
    console.log("BoardId: " + board_id);
    await updateCycleTime();
    await calculateArduinoMillis(board_id);
    next();
}

const getStartTime = () => {
    return start_time;
}
const getArduinoMillis = () => {
    return arduino_millis;
}
const getArduinoStarts = () => {
    return arduino_starts;
}
const getCycleLength = () => {
    return cycleLength;
}
const getYellowStates = () => {
    return yellow_states;
}

const setCycleLength = (length) => {
    cycleLength = length;
}
const setYellowState = (id, state) => {
    yellow_states[id] = state;
}
exports.cycleUpdateMiddleware = cycleUpdateMiddleware;
exports.getStartTime = getStartTime;
exports.getArduinoMillis = getArduinoMillis;
exports.getArduinoStarts = getArduinoStarts;
exports.getCycleLength = getCycleLength;
exports.getYellowStates = getYellowStates;
exports.setCycleLength = setCycleLength;
exports.setYellowState = setYellowState;