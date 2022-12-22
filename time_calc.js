const {initializeApp} = require('firebase/app');
const {getDatabase, get, ref, update} = require('firebase/database');

class TimeCalculations {
    start_time = Date.now();
    arduino_millis = [0, 0]
    arduino_starts = [0, 0]
    yellow_states = [0, 0, 0, 0];
    cycle_length = 20000;

    constructor() {
        //Tuleks anda parameetriks firebaseConfig, mille saab Firebase lehelt App loomisel.
        const firebaseConfig = {
            apiKey: "{API_KEY}",
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
            this.cycle_length = cycle_length;
        })
    }

    //Arvutab teatud arduinole (board_id'ga) järgmise tsükli algus aja
    //Kasutab arduino_start route'lt salvestatud aega, et teha arduino jaoks uus aeg arusaadavaks
    calculateArduinoMillis = async (board_id) => {
        const f_start_time = await this.getStartTime();

        const f_arduino_starts = await this.getArduinoStarts();
        const f_arduino_millis = await this.getArduinoMillis();

        this.start_time = f_start_time;
        this.arduino_millis = f_arduino_millis;
        this.arduino_starts = f_arduino_starts;

        const l_start_time = this.arduino_starts[board_id];

        const offset = this.start_time - l_start_time;
        if (offset != this.arduino_millis[board_id])
            this.arduino_millis[board_id] = offset;

        const new_millis = {
            arduinoNextOffsets: this.arduino_millis
        }
        await this.setArduinoMillis(new_millis);
    }

    //Arvutatkse välja uus tsükli aeg, kui praegune aeg on suurem kui vana stardi aeg
    updateCycleTime = async (req) => {
        const light_offsets = await this.getTrafficLightOffsets();
        const start_time = (await get(ref(this.db, 'traffic_lights/startTime/time'))).val();
        const cycle_length = this.getCycleLength();

        this.cycle_length = cycle_length;
        this.start_time = start_time;

        let current_time = Date.now();

        if (current_time > this.start_time) {
            const new_cycle = this.start_time + this.cycle_length;
            this.start_time = new_cycle;
        }

        //Juhul kui ei ole teatud aega arvutatud uut tsüklit siis arvutatakse praegusest ajast uus
        if (current_time - this.start_time > 40000) {
            const new_cycle = current_time + this.cycle_length;
            this.start_time = new_cycle;
        }

        const new_time = {
            time: Number(this.start_time)
        }
        req.light_offsets = light_offsets;
        await update(ref(this.db, 'traffic_lights/startTime'), new_time).catch((e) => console.error('update err: ', e));
    }

    //Saab panna route külge, et enne route'i funktsiooni kutsumist juba uus stardi aeg oleks arvutatud
    cycleUpdateMiddleware = async (req, res, next) => {
        await this.updateCycleTime(req);
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
    getCycleLength = async () => {
        const cycle_length = (await get(ref(this.db, 'traffic_lights/cycleLength'))).val();
        return cycle_length;
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
    getTrafficLightOffsets = async () => {
        const traffic_light_offsets = (await get(ref(this.db, 'traffic_lights/offset'))).val();
        return traffic_light_offsets;
    }
}



exports.TimeCalculations = TimeCalculations;
