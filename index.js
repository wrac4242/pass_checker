const fs = require('fs');
var sha1 = require('sha1');
const https = require('https')

function store(password) {
	let hash = sha1(password);
	let fivChar = hash.substring(0, 6);
	return {
		hash: hash.substring(6),
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

		// holds response from server that is passed when Promise is resolved
		return response_body.includes(obj.hash)
	}
	catch(error) {
		// Promise rejected
		console.log(error);
	}
}

// for each password, send the request, and check if its in there

async function checkPasswd(pass_obj) {
	// returns if its there or not
	let result = await makeSynchronousRequest(pass_obj);
	return result;
}

let log = await checkPasswd({
	fiv: "21BD1",
	hash: "00D4F6E8FA6EECAD2A3AA415EEC418D38EC",
	password: "test"
});
