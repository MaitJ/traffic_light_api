class TimeCalculations {
    start_time =  Date.now();
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

    constructor(cycle_length) {
        this.cycle_length = cycle_length;
    }

    calculateArduinoMillis = (board_id) => {
        const l_start_time = this.arduino_starts[board_id];

        console.log(`start_time: ${this.start_time}, l_start_time: ${l_start_time}`);
        const offset = this.start_time - l_start_time;
        if (offset != this.arduino_millis[board_id])
            this.arduino_millis[board_id] = offset;
        // arduino_starts.forEach((l_start_time, i) => {
        //     console.log('l_start_time: ', l_start_time);
        // })
    }

    updateCycleTime = async () => {
        console.log('updateCycleTime');
        let current_time = Date.now();
        console.log('cycle_length: ', this.cycle_length);

        if (current_time - this.start_time > 40000) {
            const new_cycle = current_time + this.cycle_length;
            this.start_time = new_cycle;
            console.log('set start_time > 40000');
            return;
        }

        if (current_time > this.start_time) {
            const new_cycle = this.start_time + this.cycle_length;
            this.start_time = new_cycle;
            console.log('set start_time');
        }
    }
    cycleUpdateMiddleware = async (req, res, next) => {
        await this.updateCycleTime();
        // await calculateArduinoMillis(board_id);
        console.log('calling next()');
        next();
    }

    getStartTime = () => {
        return this.start_time;
    }
    getArduinoMillis = () => {
        return this.arduino_millis;
    }
    getArduinoStarts = () => {
        return this.arduino_starts;
    }
    setArduinoStarts = (starts) => {
        this.arduino_starts = starts;
    }
    getCycleLength = () => {
        return this.cycleLength;
    }
    getYellowStates = () => {
        return this.yellow_states;
    }
    setCycleLength = (length) => {
        this.cycleLength = length;
    }
    setYellowState = (id, state) => {
        this.yellow_states[id] = state;
    }
    setGreenWave = (state) => {
        this.greenWaveToggle = state;
    }
}



exports.TimeCalculations = TimeCalculations;
