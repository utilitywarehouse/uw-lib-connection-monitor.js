const EventEmitter = require('events').EventEmitter;

class Probe extends EventEmitter {
    markAsConnected(details) {
        this.connected = true;
        this.details = details;
        this.emit('connected', details);
    }

    markAsDisconnected(details) {
        this.connected = false;
        this.details = details;
        this.emit('disconnected', details);
    }

    as(name) {
        this.name = name;
        return this;
    }

    required() {
        this.isrequired = true;
        return this;
    }

    initiallyConnected() {
        this.isInitiallyConnected = true;
    }

    init() {
        if (this.isInitiallyConnected) {
            this.markAsConnected();
        }
    }
}

Probe.mongo = function(instance) {
    let probe = new Probe();
    probe.markAsConnected();
    instance.on('connect', (event) => probe.markAsConnected(event));
    instance.on('reconnect', (event) => probe.markAsConnected(event));
    instance.on('close', (event) => probe.markAsDisconnected(event));
    return probe;
};

Probe.instance = function(instance) {
    let probe = new Probe();
    instance.on('connect', (event) => probe.markAsConnected(event));
    instance.on('disconnect', (event) => probe.markAsDisconnected(event));
    return probe;
}

module.exports = class Monitor {
    constructor() {
        this.probes = [];
    }
    mongo(instance) {
        let probe = Probe.mongo(instance);
        this.probes.push(probe);
        return probe;
    }
    on(instance) {
        let probe = Probe.instance(instance);
        this.probes.push(probe);
        return probe;
    }
};
