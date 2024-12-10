class EventEmitter {
    _events;

    constructor() {
        this._events = new Map();
    }

    /**
     * Registers a listener for the specified event.
     * @param {string} event - The event name.
     * @param {Function} listener - The callback function to invoke when the event is emitted.
     */
    on(event, listener) {
        if (!this._events.has(event)) {
            this._events.set(event, []);
        }
        this._events.get(event).push(listener);
    }

    /**
     * Emits an event, invoking all registered listeners with the provided arguments.
     * @param {string} event - The event name.
     * @param {...any} args - The arguments to pass to the listeners.
     * @returns {boolean} - Returns true if the event had listeners, false otherwise.
     */
    emit(event, ...args) {
        if (!this._events.has(event)) {
            return false;
        }
        for (const listener of this._events.get(event)) {
            listener(...args);
        }
        return true;
    }

    /**
     * Removes a specific listener for the specified event.
     * If no listener is provided, removes all listeners for the event.
     * @param {string} event - The event name.
     * @param {Function} [listener] - The listener to remove.
     */
    off(event, listener) {
        if (!this._events.has(event)) {
            return;
        }
        if (!listener) {
            this._events.delete(event);
        } else {
            const listeners = this._events.get(event);
            const filteredListeners = listeners.filter(l => l !== listener);
            if (filteredListeners.length > 0) {
                this._events.set(event, filteredListeners);
            } else {
                this._events.delete(event);
            }
        }
    }

    /**
     * Removes all events and their listeners.
     */
    clear() {
        this._events.clear();
    }
}

class EventSignal {
    _value;
    _listeners;

    /**
     * @private
     * Notifies all registered listeners of a value change.
     */
    _notify() {
        for (const listener of this._listeners) {
            listener(this._value);
        }
    }

    constructor(value) {
        this._listeners = new Set();
        this._value = value;
    }

    /**
     * Gets the current value of the signal.
     * @returns {any} The current value.
     */
    getValue() {
        return this._value;
    }

    /**
     * Sets a new value and notifies listeners if it changes.
     * @param {any} value - The new value.
     */
    setValue(value) {
        if (this._value !== value) {
            this._value = value;
            this._notify();
        }
    }

    /**
     * Subscribes a listener to value changes.
     * @param {Function} listener - The function to invoke when the value changes.
     * @returns {Function} A function to unsubscribe the listener.
     */
    subscribe(listener) {
        this._listeners.add(listener);

        return () => this._listeners.delete(listener);
    }
}

class InteractionTimer {
    /**
     * Formats a duration in milliseconds into a MM:SS string.
     * @param {number} milliseconds - The duration to format.
     * @returns {string} The formatted time.
     */
    static format(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    _threshold;
    _start;
    _duration;
    _paused;

    constructor(threshold = 250) {
        this._threshold = threshold;
        this._start = 0;
        this._duration = 0;
        this._paused = false;
    }

    /**
     * Starts the timer or resumes from a paused state.
     */
    start() {
        // Resume from paused state
        if (this._paused) {
            this._start = Date.now();
            this._paused = false;
        }
        // Start fresh
        else {
            this._start = Date.now();
            this._duration = 0;
        }
    }

    /**
     * Ends the timer, recording the duration if not paused.
     */
    end() {
        if (!this._paused) {
            this._duration = Date.now() - this._start;
        }
    }

    /**
     * Pauses the timer, preserving the current duration.
     */
    pause() {
        if (!this._paused && this._start > 0) {
            this._duration = Date.now() - this._start;
            this._paused = true;
        }
    }

    /**
     * Determines if the interaction was a click (short duration).
     * @returns {boolean} True if the interaction was a click, false otherwise.
     */
    isClick() {
        return !this.isHold();
    }

    /**
     * Determines if the interaction was a hold (long duration).
     * @returns {boolean} True if the interaction was a hold, false otherwise.
     */
    isHold() {
        return this._duration >= this._threshold;
    }
}