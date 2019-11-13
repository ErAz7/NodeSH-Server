exports.ports = {
	keyExchange: 3705,
	command: 3701,
	download: 3702,
	upload: 3703,
	status: 3704,
	screen: 3700,
	localScreen: 80
}

exports.host = "127.0.0.1";

exports.enc = {
	algorithm: "aes256",
	primeLength: 128
}

exports.cred = {
	user: 'you@node',
	pass: '12345'
}

exports.defaultPath = {
	download: "D:/",
	upload: "D:/"
}

