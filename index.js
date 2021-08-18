const fs = require('fs');
var sha1 = require('sha1');
const https = require('https')

function store(password) {
	let hash = sha1(password);
	let fivChar = hash.substring(0, 5);
	return {
		hash: hash.substring(5),
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

// function returns a Promise
function getPromise(hash) {
	return new Promise((resolve, reject) => {
		let hash = hash;
		console.log(`https://api.pwnedpasswords.com/range/${hash}`);
		https.get(`https://api.pwnedpasswords.com/range/${hash}`, (response) => {
			let chunks_of_data = [];

			response.on('data', (fragments) => {
				chunks_of_data.push(fragments);
			});

			response.on('end', () => {
				let response_body = Buffer.concat(chunks_of_data);
				resolve(response_body.toString());
			});

			response.on('error', (error) => {
				reject(error);
			});
		});
	});
}

// async function to make http request
async function makeSynchronousRequest(obj) {
	try {
		let https_promise = getPromise(obj.fiv);
		let response_body = await https_promise;
		console.log(response_body);

		// holds response from server that is passed when Promise is resolved
		return response_body.includes(obj.hash)
	}
	catch(error) {
		// Promise rejected
		console.log(error);
	}
}

// for each password, send the request, and check if its in there

const breachedPasswords = [];

async function checkPasswd(pass_obj) {
	// returns if its there or not
	let result = await makeSynchronousRequest(pass_obj);
	if (result) {
		breachedPasswords.push(pass_obj);
	};
}

const promiseArray = [];

for (i in passwords) {
	promiseArray.push(checkPasswd(i));
}

(async () => await Promise.all(promiseArray))();

for (i in breachedPasswords) {
	console.log(i.password);
}
