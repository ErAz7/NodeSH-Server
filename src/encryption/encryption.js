import fs from 'fs';
import zlib from 'zlib';
import colors from 'colors';
import crypto from 'crypto';
import { Transform } from 'stream';
import CONFIG from '../config/constants.js';

export const encrypt = function(data, key) {
    data = data.toString();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(CONFIG.enc.algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(data);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + encrypted.toString('hex');
};

export const decrypt = function(data, key) {
    const iv = Buffer.from(data.substr(0, 32), 'hex');
    const encryptedText = Buffer.from(data.substr(32), 'hex');
    const decipher = crypto.createDecipheriv(CONFIG.enc.algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
};

export const encryptFile = (fileIn, fileOut, key, ccb, ecb) => {
    const initVect = crypto.randomBytes(16);

    const readStream = fs.createReadStream(fileIn);
    const gzip = zlib.createGzip();
    const cipher = crypto.createCipheriv(CONFIG.enc.algorithm, key, initVect);
    const appendInitVect = new AppendInitVect(initVect);

    const writeStream = fs.createWriteStream(fileOut);

    readStream
        .pipe(gzip)
        .pipe(cipher)
        .pipe(appendInitVect)
        .pipe(writeStream)
        .on('error', (err) => {
            if (ecb) {
                ecb(err);
            }
        })
        .on('close', () => {
            if (ccb) {
                ccb();
            }
        });
};

export const decryptFile = (fileIn, fileOut, key, ccb, ecb) => {
    const readInitVect = fs.createReadStream(fileIn, { end: 15 });

    let initVect;

    readInitVect.on('data', (chunk) => {
        initVect = chunk;
    });

    readInitVect.on('close', () => {
        const readStream = fs.createReadStream(fileIn, { start: 16 });
        const decipher = crypto.createDecipheriv(CONFIG.enc.algorithm, key, initVect);
        const unzip = zlib.createUnzip();
        const writeStream = fs.createWriteStream(fileOut);

        readStream
            .pipe(decipher)
            .pipe(unzip)
            .pipe(writeStream)
            .on('error', (err) => {
                if (ecb) {
                    ecb(err);
                }
            })
            .on('close', () => {
                if (ccb) {
                    ccb();
                }
            });
    });
};

class AppendInitVect extends Transform {
    constructor(initVect, opts) {
        super(opts);
        this.initVect = initVect;
        this.appended = false;
    }

    _transform(chunk, encoding, cb) {
        if (!this.appended) {
            this.push(this.initVect);
            this.appended = true;
        }

        this.push(chunk);
        cb();
    }
}
