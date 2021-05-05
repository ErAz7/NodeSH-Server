export default {
    ports: {
        data: 3700,
        status: 3704,
        localScreen: 80
    },

    name: 'ErAz7',

    host: '127.0.0.1',

    enc: {
        algorithm: 'aes256',
        primeLength: 256
    },

    cred: {
        user: 'you@node',
        pass: '12345'
    },

    defaultPath: {
        download: 'D:/',
        upload: 'D:/'
    }

};
