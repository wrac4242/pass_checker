const userAgent = "wrac passchecker";
const baseURL = "https://api.pwnedpasswords.com/range/";
const fs = require('fs');
var sha1 = require('sha1');

function store(password) {
	let hash = sha1(password);
	let fivChar = hash.substring(0, 6);
	return {
		hash: hash,
		fiv: fivChar,
		password: password
	}
};

const passwordFiles = fs.readdirSync('./passwords').filter(file => file.endsWith('.json'));

const passwords = [];

for (const file of passwordFiles) {
	const vault = require(`./passwords/${file}`);
	vaultProcess(vault);
}

function vaultProcess(vault) {
	for (const items of vault.items) {
		let pass = items.login.password;
		if (pass) {
			passwords.push(store(pass));
		}
	}
}

console.log(passwords);
