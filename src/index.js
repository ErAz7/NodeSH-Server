import 'colors';
import fs from 'fs';
import path from 'path';
import http from 'http';
import commandLine from 'child_process';
import screenshot from 'screenshot-desktop';
import DataChannel from './dataChannel/channel.js';
import CONFIG from './config/constants.js';

const __dirname = path.resolve(path.dirname(''));
const SCREEN_ADDRESS = `${__dirname}/src/tmp/screen.jpg`;
const TRAY_EJECT_SCRIPT_ADDRESS = `${__dirname}/src/files/cd_open.bat`;

let CHANNEL;
let childProcess;

// ----------------------main----------------------
console.clear();
console.log("Check 'src/config/contants.js' for port, host and other configurations".cyan.bold);
start();
// ------------------------------------------------

function start() {
    CHANNEL = new DataChannel();
    CHANNEL.addEventListener('connection', () => {
        CHANNEL.addEventListener('message', onMessage);
    });

    createStatusServer(CONFIG.ports.status);
}

function onMessage(data) {
    const { type, body } = data;

    switch (type) {
        case 'tray':
            switch (body) {
                case 'eject':
                    commandLine.exec(TRAY_EJECT_SCRIPT_ADDRESS, (error, stdout, stderr) => {
                        if (stderr) {
                            sendResponse(`An Error Occured: ${JSON.stringify(stderr)}`);

                            return;
                        }

                        sendResponse(stdout);
                    });
                    break;
                case 'close':
                    sendResponse('Command Not Availabel Yet');
                    break;
                default:
                    sendResponse('Tray Command Not Recognized');
                    break;
            }

            break;
        case 'cmd':
            if (childProcess) {
                childProcess.kill();
            }

            childProcess = commandLine.exec(body);

            childProcess.stdout.on('data', (data) => {
                sendResponse(data.toString());
            });
            childProcess.stderr.on('data', (data) => {
                sendResponse(data.toString());
            });
            break;
        case 'cmdIn':
            if (childProcess) {
                try {
                    childProcess.stdin.write(body + '\n');
                } catch (err) {
                    sendResponse('Invalid Input');
                }
            } else {
                sendResponse('No Child Process Is Started');
            }

            break;
        case 'screen':
            switch (body) {
                case 'shoot':
                    screenshot({ filename: SCREEN_ADDRESS }).then(imgPath => {
                        sendResponse(
                            fs.readFileSync(imgPath, 'binary')
                        );
                    }).catch((err) => {
                        sendResponse(`An Error Occured: ${err.message}`);
                    });
                    break;
                default:
                    sendResponse('Screen Command Not Recognized');
                    break;
            }

            break;
        default:
            sendResponse('Command Not Recognized');
            break;
    }
}

function sendResponse(data) {
    CHANNEL.send({
        body: data
    });
}

function createStatusServer(port) {
    console.log('Started status server on port '.cyan.bold + port.toString().magenta.bold);
    http.createServer((req, res) => {
        res.statusCode = 200;
        res.end('Hello World');
    }).listen(port);
}
