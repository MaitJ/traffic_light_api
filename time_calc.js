const {initializeApp} = require('firebase/app');
const {getDatabase, get, ref, update} = require('firebase/database');

class TimeCalculations {
    start_time = Date.now();
    arduino_millis = [0, 0]
    arduino_starts = [0, 0]
    yellow_states = [0, 0, 0, 0];
    // 1. Arduino 0, 2. Arduino 1, 3. Network light 0, 4. Network light 1
    cycle_length = 20000;
    greenWaveToggle = false;
    greenWaveLength = 1;
// Kordaja, millega korrutatakse läbi, et rohelise laine pikkust määrata.
    greenWaveStartPos = 0;
// Ehk laine järjekord, määratakse esimene foor.

    constructor() {
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
        this.db = getDatabase(firebaseApp);

        this.cycle_length = 20000;
        const db_cycle_length_ref = ref(this.db, 'traffic_lights/cycleLength');
        get(db_cycle_length_ref).then(snapshot => {
            const cycle_length = snapshot.val();
            this.cycle_length = cycle_length
        })
    }

    calculateArduinoMillis = async (board_id) => {
        const f_start_time = await this.getStartTime();
        const f_arduino_starts = await this.getArduinoStarts();
        const f_arduino_millis = await this.getArduinoMillis();


        this.start_time = f_start_time;
        this.arduino_millis = f_arduino_millis;
        this.arduino_starts = f_arduino_starts;

        console.log('f_start_time: ', this.start_time);
        console.log('f_arduino_starts: ', this.arduino_millis);
        console.log('f_arduino_millis: ', this.arduino_starts);

        const l_start_time = this.arduino_starts[board_id];

        console.log(`start_time: ${this.start_time}, l_start_time: ${l_start_time}`);
        const offset = this.start_time - l_start_time;
        if (offset != this.arduino_millis[board_id])
            this.arduino_millis[board_id] = offset;
        // arduino_starts.forEach((l_start_time, i) => {
        //     console.log('l_start_time: ', l_start_time);
        // })

        const new_millis = {
            arduinoNextOffsets: this.arduino_millis
        }
        console.log('after updating: ', this.arduino_millis);
        await this.setArduinoMillis(new_millis);
    }

    updateCycleTime = async () => {
        const start_time = (await get(ref(this.db, 'traffic_lights/startTime/time'))).val();

        console.log('fetched_start_time: ', start_time);
        this.start_time = start_time;

        console.log('updateCycleTime');
        let current_time = Date.now();
        console.log('cycle_length: ', this.cycle_length);


        if (current_time > this.start_time) {
            const new_cycle = this.start_time + this.cycle_length;
            this.start_time = new_cycle;
            console.log('set start_time');
        }

        if (current_time - this.start_time > 40000) {
            const new_cycle = current_time + this.cycle_length;
            this.start_time = new_cycle;
            console.log('set start_time > 40000');
        }

        const new_time = {
            time: this.start_time
        }
        await update(ref(this.db, 'traffic_lights/startTime'), new_time).catch((e) => console.error('update err: ', e));
    }
    cycleUpdateMiddleware = async (req, res, next) => {
        await this.updateCycleTime();
        // await calculateArduinoMillis(board_id);
        console.log('calling next()');
        next();
    }

    getStartTime = async () => {
        const start_time = (await get(ref(this.db, 'traffic_lights/startTime/time'))).val();
        return start_time;
    }
    getArduinoMillis = async () => {
        const arduino_millis = (await get(ref(this.db, 'traffic_lights/arduinoNextOffsets'))).val();
        return arduino_millis;
    }
    getArduinoStarts = async () => {
        const arduino_starts = (await get(ref(this.db, 'traffic_lights/arduinoStarts'))).val();
        return arduino_starts;
    }
    setArduinoStarts = async (starts) => {
        console.log('starts: ', starts);
        await update(ref(this.db, 'traffic_lights'), starts);
        this.arduino_starts = starts;
    }
    setArduinoMillis = async (millis) => {
        console.log('millis: ', millis);
        await update(ref(this.db, 'traffic_lights'), millis);
        this.arduino_millis = millis;
    }
    getCycleLength = () => {
        return this.cycle_length;
    }
    getYellowStates = () => {
        return this.yellow_states;
    }
    setCycleLength = (length) => {
        this.cycle_length = length;
    }
    setYellowState = (id, state) => {
        this.yellow_states[id] = state;
    }
    setGreenWave = (state) => {
        this.greenWaveToggle = state;
    }
}



exports.TimeCalculations = TimeCalculations;
