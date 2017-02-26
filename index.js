const EventEmitter = require('events').EventEmitter;

class Probe extends EventEmitter {
    markAsConnected(details) {
        if (!this.connected) {
            this.emit('connected', details);
        }
        this.connected = true;
        this.details = details;
    }

    markAsDisconnected(details) {
        if (this.connected) {
            this.emit('disconnected', details);
        }
        this.connected = false;
        this.details = details;
    }

    as(name) {
        this.name = name;
        return this;
    }

    required() {
        this.isRequired = true;
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
    instance.on('connect', (event) => probe.markAsConnected(event));
    instance.on('reconnect', (event) => probe.markAsConnected(event));
    instance.on('close', (event) => probe.markAsDisconnected(event));
    return probe;
};

Probe.redis = function(instance) {
    let probe = new Probe();
    instance.on('ready', (event) => probe.markAsConnected(event));
    instance.on('connect', (event) => probe.markAsConnected(event));
    instance.on('reconnecting', (event) => probe.markAsDisconnected(event));
    instance.on('end', (event) => probe.markAsDisconnected(event));
    return probe;
};

Probe.instance = function(instance) {
    let probe = new Probe();
    instance.on('connect', (event) => probe.markAsConnected(event));
    instance.on('disconnect', (event) => probe.markAsDisconnected(event));
    return probe;
};

Probe.endpoint = function(instance) {
    let probe = new Probe();
    instance.on('available', (event) => probe.markAsConnected(event));
    instance.on('unavailable', (event) => probe.markAsDisconnected(event));
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
    redis(instance) {
        let probe = Probe.redis(instance);
        this.probes.push(probe);
        return probe;
    }
    endpoint(instance) {
        let probe = Probe.endpoint(instance);
        this.probes.push(probe);
        return probe;
    }
    on(instance) {
        let probe = Probe.instance(instance);
        this.probes.push(probe);
        return probe;
    }
};
