import 'colors';
import SocketIO from 'socket.io-client';
import KeyExchange from '../encryption/keyExchange.js';
import * as encryption from '../encryption/encryption.js';
import CONFIG from '../config/constants.js';

export default class Channel {
    constructor() {
        this.socket = null;
        this.eventListeners = {
            connection: {},
            disconnection: {},
            message: {}
        };
        this.encryptionKey = null;

        this.init();
    }

    addEventListener(event, func) {
        this.eventListeners[event][func.name] = func;
    }

    removeEventListener(event, func) {
        if (!func.name) {
            throw new Error('Anonymus listener functions cant be removed, use a named function');
        }

        delete this.eventList[event][func.name];
    }

    callEventListeners(event, ...args) {
        const listeners = this.eventListeners[event];

        for (const listenerName in listeners) {
            const listener = listeners[listenerName];

            listener(...args);
        }
    }

    init() {
        const socket = SocketIO(`http://${CONFIG.host}:${CONFIG.ports.data}`);

        this.socket = socket;

        socket.on('connect', socket => {
            this.keyExchange();
        });

        socket.on('message', message => {
            const finalMessage = this.encryptionKey ? this.decrypt(message) : message;

            this.callEventListeners('message', finalMessage);
        });

        socket.on('disconnect', () => {
            this.callEventListeners('disconnection');
            this.reset();
        });

        console.log(`Trying to connect to ${CONFIG.host}${CONFIG.ports.data}...`.cyan.bold);
    }

    reset() {
        this.eventListeners = {
            connection: this.eventListeners.connection,
            disconnection: {},
            message: {}
        };
        this.encryptionKey = null;
    }

    send(message) {
        const finalMessage = this.encryptionKey ? this.encrypt(message) : message;

        this.socket.emit('message', finalMessage);
    }

    encrypt(data) {
        return encryption.encrypt(JSON.stringify(data), this.encryptionKey);
    }

    decrypt(data) {
        return JSON.parse(encryption.decrypt(data, this.encryptionKey));
    }

    keyExchange() {
        new KeyExchange(this, key => {
            console.log('Establihed secure conenction'.white.bold.bgGreen);
            this.encryptionKey = key;
            this.callEventListeners('connection');
        }).exchange();
    }
}
