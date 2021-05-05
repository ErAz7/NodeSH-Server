import crypto from 'crypto';
import CONFIG from '../config/constants.js';

export default class KeyExchange {
    constructor(dataChannel, onEstablish) {
        this.prime = null;
        this.public = null;
        this.private = null;
        this.local = null;
        this.isInitiator = false;
        this.dataChannel = dataChannel;
        this.onEstablish = onEstablish;
    }

    listen() {
        this.dataChannel.addEventListener('message', message => {
            const { isKeyExchange, prime, public: remotePublic, isAck } = message;

            if (!isKeyExchange) {
                return;
            }

            if (isAck) {
                this.onEstablish && this.onEstablish(this.private);

                return;
            }

            this.establish(prime, remotePublic);
        });
    }

    exchange() {
        this.init();

        this.dataChannel.send({
            isKeyExchange: true,
            prime: this.prime,
            public: this.public
        });

        this.dataChannel.addEventListener('message', message => {
            const { isKeyExchange, public: remotePublic } = message;

            if (!isKeyExchange) {
                return;
            }

            this.establish(null, remotePublic);
        });
    }

    init(remotePrime) {
        const prime = remotePrime || crypto.createDiffieHellman(CONFIG.enc.primeLength).getPrime();
        const local = crypto.createDiffieHellman(prime);

        local.generateKeys();
        const localPublic = local.getPublicKey();

        !remotePrime && (this.isInitiator = true);
        this.prime = prime;
        this.public = localPublic;
        this.local = local;
    }

    establish(prime, remotePublic) {
        if (!this.isInitiator) {
            this.init(prime);
        }

        const localPrivate = this.local.computeSecret(remotePublic);

        this.private = localPrivate;

        this.isInitiator ? (
            this.dataChannel.send({
                isKeyExchange: true,
                isAck: true
            })
        ) : (
            this.dataChannel.send({
                isKeyExchange: true,
                public: this.public
            }
            ));

        if (this.isInitiator) {
            this.onEstablish && this.onEstablish(localPrivate);
        }
    }
}
