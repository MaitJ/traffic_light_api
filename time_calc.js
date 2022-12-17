const {getDatabase, ref, get} = require('firebase/database');
const {initializeApp} = require('firebase/app');

let start_time = 0;
let arduino_millis = [0, 0]
let arduino_starts = [0, 0]


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

const calculateArduinoMillis = async () => {
    console.log('start_time: ', start_time);
    arduino_starts.forEach((l_start_time, i) => {
        console.log('l_start_time: ', l_start_time);
        const offset = start_time - l_start_time;
        if (offset != arduino_millis[i])
            arduino_millis[i] = offset;
    })
}

const updateCycleTime = async () => {
    console.log('updateCycleTime');
    let current_time = Date.now();
    const db_cycle_length_ref = ref(db, 'traffic_lights/cycleLength');
    
    const cycle_length = (await get(db_cycle_length_ref)).val();
    console.log('cycle_length: ', cycle_length);

    // if (current_time > (start_time - 1000)) {
    current_time = Date.now();
    const new_cycle = current_time + cycle_length + 5000;
    start_time = new_cycle;
    // }
}

const cycleUpdateMiddleware = async (req, res, next) => {
    await updateCycleTime();
    await calculateArduinoMillis();
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
exports.cycleUpdateMiddleware = cycleUpdateMiddleware;
exports.updateCycleTime = updateCycleTime;
exports.getStartTime = getStartTime;
exports.getArduinoMillis = getArduinoMillis;
exports.getArduinoStarts = getArduinoStarts;