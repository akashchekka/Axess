var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var fs = require('fs');
var sha256 = require('sha256');
var request = require('request');
var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
var sgmail = require('@sendgrid/mail');
sgmail.setApiKey("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");
var ipfsAPI = require('ipfs-http-client');
var ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'});

var User = require('../models/user');

// Register
router.get('/register', function (req, res) {
	res.render('register');
});

// Login
router.get('/login', function (req, res) {
	res.render('login');
});

// Upload
router.get('/upload', function (req, res) {
	res.render('upload');
});

// Transfer
router.get('/transfer', function (req, res) {
	res.render('transfer');
});

// Fetch
router.get('/fetch', function (req, res) {
	res.render('fetch');
});

// addid
router.get('/addid', function (req, res) {
	res.render('addid');
});

// Addid ID
router.post('/addid', function(req, res) {
	var id = req.body.id;

	req.checkBody('id', 'Name of Id is required').notEmpty();
	var errors = req.validationErrors();

	if(errors) {
		res.render('addid', {
			errors: errors
		});
	} else {

		var fabric_client = new Fabric_Client();
		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);

		//
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
			// assign the store to the fabric client
			fabric_client.setStateStore(state_store);
			var crypto_suite = Fabric_Client.newCryptoSuite();
			// use the same location for the state store (where the users' certificate are kept)
			// and the crypto store (where the users' keys are kept)
			var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
			crypto_suite.setCryptoKeyStore(crypto_store);
			fabric_client.setCryptoSuite(crypto_suite);

			// get the enrolled user from persistence, this user will sign all requests
			return fabric_client.getUserContext('user1', true);
		}).then((user_from_store) => {
			if (user_from_store && user_from_store.isEnrolled()) {
				console.log('Successfully loaded user1 from persistence');
				member_user = user_from_store;
			} else {
				throw new Error('Failed to get user1.... run registerUser.js');
			}

			// queryTuna - requires 1 argument, ex: args: ['4'],
			const request = {
				chaincodeId: 'axess',
				fcn: 'ownerEnroll',
				args: [id],
				chainId: 'mychannel',
				txId: tx_id
			};

			// send the query proposal to the peer
			return channel.queryByChaincode(request);
		}).then((query_responses) => {
			console.log("Query has completed, checking results");
			// query_responses could have more than one  results if there multiple peers were used as targets
			if (query_responses && query_responses.length == 1) {
				if (query_responses[0] instanceof Error) {
					console.error("error from query = ", query_responses[0]);
				} else {
					console.log("Response is ", query_responses[0].toString());
					console.log(query_responses[0].toString())
				}
			} else {
				console.log("No payloads were returned from query");
			}
		}).catch((err) => {
			console.error('Failed to query successfully :: ' + err);
		});
	}
	var ok = 1
	res.render('addid', {
		ok: ok
	});
});


// Fetching file
router.post('/fetch', function(req, res) {
	var id = req.body.id;
	var file = req.body.file;
	var Name = req.body.Name;

	req.checkBody('id', 'Account Id is required').notEmpty();
	req.checkBody('file', 'Hash of file is required').notEmpty();
	req.checkBody('Name', 'Name of file is required').notEmpty();

	var errors = req.validationErrors();

	if(errors) {
		res.render('fetch', {
			errors: errors
		});
	} else {

		var fabric_client = new Fabric_Client();
		// setup the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);

		//
		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
			// assign the store to the fabric client
			fabric_client.setStateStore(state_store);
			var crypto_suite = Fabric_Client.newCryptoSuite();
			// use the same location for the state store (where the users' certificate are kept)
			// and the crypto store (where the users' keys are kept)
			var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
			crypto_suite.setCryptoKeyStore(crypto_store);
			fabric_client.setCryptoSuite(crypto_suite);

			// get the enrolled user from persistence, this user will sign all requests
			return fabric_client.getUserContext('user1', true);
		}).then((user_from_store) => {
			if (user_from_store && user_from_store.isEnrolled()) {
				console.log('Successfully loaded user1 from persistence');
				member_user = user_from_store;
			} else {
				throw new Error('Failed to get user1.... run registerUser.js');
			}

			// queryTuna - requires 1 argument, ex: args: ['4'],
			const request = {
				chaincodeId: 'axess',
				txId: tx_id,
				fcn: 'getHashByName',
				args: [id, file]
			};

			// send the query proposal to the peer
			return channel.queryByChaincode(request);
		}).then((query_responses) => {
			console.log("Query has completed, checking results");
			// query_responses could have more than one  results if there multiple peers were used as targets
			if (query_responses && query_responses.length == 1) {
				if (query_responses[0] instanceof Error) {
					console.error("error from query = ", query_responses[0]);
				} else {
					console.log("Response is ", query_responses[0].toString());
					console.log(query_responses[0].toString())
					var fileHash = query_responses[0].toString();
					request({
						url: "https://ipfs.io/ipfs/" + fileHash,
						json: false
					}, function(error, res, body) {
						var path = '/home/akash/Downloads/' + Name +'.txt';
						fs.writeFile(path, body, function(err){
							console.log("File fetched successfully");
							console.log(body);
						});
					});
				}
			} else {
				console.log("No payloads were returned from query");
			}
		}).catch((err) => {
			console.error('Failed to query successfully :: ' + err);
		});
	}
	var get = 1
	res.render('fetch', {
		get: get
	});
});

// Submitting Transfer
router.post('/transfer', function(req, res) {
	var id = req.body.id;
	var did = req.body.did;
	var Name = req.body.Name;
	var email = req.body.email;

	req.checkBody('id', 'Your ID is required').notEmpty();
	req.checkBody('did', 'Destination ID is required').notEmpty();
	req.checkBody('Name', 'Name of file is required').notEmpty();

	var errors = req.validationErrors();

	if(errors) {
		res.render('transfer', {
			errors: errors
		});
	} else {
		
		var fabric_client = new Fabric_Client();
		// setting up the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
		Fabric_Client.newDefaultKeyValueStore({ path: store_path
		}).then((state_store) => {
			// assign the store to the fabric client
			fabric_client.setStateStore(state_store);
			var crypto_suite = Fabric_Client.newCryptoSuite();
			// use the same location for the state store (where the users' certificate are kept)
			// and the crypto store (where the users' keys are kept)
			var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
			crypto_suite.setCryptoKeyStore(crypto_store);
			fabric_client.setCryptoSuite(crypto_suite);

			// get the enrolled user from persistence, this user will sign all requests
			return fabric_client.getUserContext('user1', true);
		}).then((user_from_store) => {
			if (user_from_store && user_from_store.isEnrolled()) {
				console.log('Successfully loaded user1 from persistence');
				member_user = user_from_store;
			} else {
				throw new Error('Failed to get user1.... run registerUser.js');
			}

			// get a transaction id object based on the current user assigned to fabric client
			tx_id = fabric_client.newTransactionID();
			console.log("Assigning transaction_id: ", tx_id._transaction_id);

			const request = {
				//targets : --- letting this default to the peers assigned to the channel
				chaincodeId: 'axess',
				fcn: 'transferHash',
				args: [id, did, Name],
				chainId: 'mychannel',
				txId: tx_id
			};

			// send the transaction proposal to the peers
			return channel.sendTransactionProposal(request);
		}).then((results) => {
			var proposalResponses = results[0];
			var proposal = results[1];
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));

				// build up the request for the orderer to have the transaction committed
				var request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};

				// set the transaction listener and set a timeout of 30 sec
				// if the transaction did not get committed within the timeout period,
				// report a TIMEOUT status
				var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
				var promises = [];

				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

				// get an eventhub once the fabric client has a user assigned. The user
				// is required bacause the event registration must be signed
				let event_hub = channel.newChannelEventHub(peer);

				// using resolve the promise so that result status may be processed
				// under the then clause rather than having the catch clause process
				// the status
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						event_hub.disconnect();
						resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
					}, 3000);
					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
						// this is the callback for transaction event status
						// first some clean up of event listener
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();

						// now let the application know what happened
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
						} else {
							console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
							resolve(return_status);
						}
					}, (err) => {
						//this is the callback if something goes wrong with the event registration or processing
						reject(new Error('There was a problem with the eventhub ::'+err));
					});
				});
				promises.push(txPromise);

				return Promise.all(promises);
			} else {
				console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
			}
		}).then((results) => {
			console.log('Send transaction promise and event listener promise have completed');
			// check the results in the order the promises were added to the promise all list
			if (results && results[0] && results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
				console.log(tx_id.getTransactionID());
			} else {
				console.error('Failed to order the transaction. Error code: ' + response.status);
			}

			if(results && results[1] && results[1].event_status === 'VALID') {
				console.log('Successfully committed the change to the ledger by the peer');
				console.log(tx_id.getTransactionID());
			} else {
				console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
			}
		}).catch((err) => {
			console.error('Failed to invoke successfully :: ' + err);
		});

		sgmail.send({
			to: email,
			from: 'team@axess.com',
			subject: 'File received',
			text: 'You have received a confidential file with name: ' + Name + 'from Account ' + id +'. Please check...Team Axess'
		});
		console.log("Mail sent!");
	}
	var test = 1
	res.render('transfer', {
		test: test
	});
});

// Submitting upload
router.post('/upload', function(req, res) {
	var id = req.body.id;
	var nme = req.body.nme;
	var path1 = req.body.path;

	req.checkBody('id', 'Your ID is required').notEmpty();
	req.checkBody('nme', 'Name is required').notEmpty();

	var errors = req.validationErrors();

	if(errors) {
		res.render('upload', {
			errors: errors
		});
	} else {

		var fabric_client = new Fabric_Client();
		// setting up the fabric network
		var channel = fabric_client.newChannel('mychannel');
		var peer = fabric_client.newPeer('grpc://localhost:7051');
		channel.addPeer(peer);
		var order = fabric_client.newOrderer('grpc://localhost:7050')
		channel.addOrderer(order);

		var member_user = null;
		var store_path = path.join(os.homedir(), '.hfc-key-store');
		console.log('Store path:'+store_path);
		var tx_id = null;

		ipfs.addFromFs(path1, {recursive: true}, (err, res) => {
			if (err) {throw err;}
			console.log(res[(res.length)-1].hash + " is the hash of your file");
		
			var acthash = res[(res.length)-1].hash
		
			Fabric_Client.newDefaultKeyValueStore({ path: store_path
			}).then((state_store) => {
				// assign the store to the fabric client
				fabric_client.setStateStore(state_store);
				var crypto_suite = Fabric_Client.newCryptoSuite();
				// use the same location for the state store (where the users' certificate are kept)
				// and the crypto store (where the users' keys are kept)
				var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
				crypto_suite.setCryptoKeyStore(crypto_store);
				fabric_client.setCryptoSuite(crypto_suite);
			
				// get the enrolled user from persistence, this user will sign all requests
				return fabric_client.getUserContext('user1', true);
			}).then((user_from_store) => {
				if (user_from_store && user_from_store.isEnrolled()) {
					console.log('Successfully loaded user1 from persistence');
					member_user = user_from_store;
				} else {
					throw new Error('Failed to get user1.... run registerUser.js');
				}
			
				// get a transaction id object based on the current user assigned to fabric client
				tx_id = fabric_client.newTransactionID();
				console.log("Assigning transaction_id: ", tx_id._transaction_id);
			
				// recordTuna - requires 5 args, ID, vessel, location, timestamp,holder - ex: args: ['10', 'Hound', '-12.021, 28.012', '1504054225', 'Hansel'], 
				// send proposal to endorser
				const request = {
					//targets : --- letting this default to the peers assigned to the channel
					chaincodeId: 'axess',
					fcn: 'addhash',
					args: [id, nme, acthash],
					chainId: 'mychannel',
					txId: tx_id
				};
			
				// send the transaction proposal to the peers
				return channel.sendTransactionProposal(request);
			}).then((results) => {
				var proposalResponses = results[0];
				var proposal = results[1];
				let isProposalGood = false;
				if (proposalResponses && proposalResponses[0].response &&
					proposalResponses[0].response.status === 200) {
						isProposalGood = true;
						console.log('Transaction proposal was good');
					} else {
						console.error('Transaction proposal was bad');
					}
				if (isProposalGood) {
					console.log(util.format(
						'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
						proposalResponses[0].response.status, proposalResponses[0].response.message));
			
					// build up the request for the orderer to have the transaction committed
					var request = {
						proposalResponses: proposalResponses,
						proposal: proposal
					};
			
					// set the transaction listener and set a timeout of 30 sec
					// if the transaction did not get committed within the timeout period,
					// report a TIMEOUT status
					var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
					var promises = [];
			
					var sendPromise = channel.sendTransaction(request);
					promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
			
					// get an eventhub once the fabric client has a user assigned. The user
					// is required bacause the event registration must be signed
					let event_hub = channel.newChannelEventHub(peer);
			
					// using resolve the promise so that result status may be processed
					// under the then clause rather than having the catch clause process
					// the status
					let txPromise = new Promise((resolve, reject) => {
						let handle = setTimeout(() => {
							event_hub.disconnect();
							resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
						}, 3000);
						event_hub.connect();
						event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
							// this is the callback for transaction event status
							// first some clean up of event listener
							clearTimeout(handle);
							event_hub.unregisterTxEvent(transaction_id_string);
							event_hub.disconnect();
			
							// now let the application know what happened
							var return_status = {event_status : code, tx_id : transaction_id_string};
							if (code !== 'VALID') {
								console.error('The transaction was invalid, code = ' + code);
								resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
							} else {
								console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
								resolve(return_status);
							}
						}, (err) => {
							//this is the callback if something goes wrong with the event registration or processing
							reject(new Error('There was a problem with the eventhub ::'+err));
						});
					});
					promises.push(txPromise);
			
					return Promise.all(promises);
				} else {
					console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
					throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				}
			}).then((results) => {
				console.log('Send transaction promise and event listener promise have completed');
				// check the results in the order the promises were added to the promise all list
				if (results && results[0] && results[0].status === 'SUCCESS') {
					console.log('Successfully sent transaction to the orderer.');
					console.log(tx_id.getTransactionID());
				} else {
					console.error('Failed to order the transaction. Error code: ' + response.status);
				}
			
				if(results && results[1] && results[1].event_status === 'VALID') {
					console.log('Successfully committed the change to the ledger by the peer');
					console.log(tx_id.getTransactionID());
				} else {
					console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
				}
			}).catch((err) => {
				console.error('Failed to invoke successfully :: ' + err);
			});
		});
	}
	var test = 1
	res.render('upload', {
		test: test
	});
});

// Register User
router.post('/register', function (req, res) {
	var firstname = req.body.firstname;
	var lastname = req.body.lastname;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation
	req.checkBody('firstname', 'FirstName is required').notEmpty();
	req.checkBody('lastname', 'LastName is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		res.render('register', {
			errors: errors
		});
	}
	else {
		//checking for email and username are already taken
		User.findOne({ username: { 
			"$regex": "^" + username + "\\b", "$options": "i"
	}}, function (err, user) {
			User.findOne({ email: { 
				"$regex": "^" + email + "\\b", "$options": "i"
		}}, function (err, mail) {
				if (user || mail) {
					res.render('register', {
						user: user,
						mail: mail
					});
				}
				else {
					var newUser = new User({
						name: firstname,
						email: email,
						username: username,
						password: password
					});						

					User.createUser(newUser, function (err, user) {
						if (err) throw err;
						console.log(user);
					});

         			req.flash('success_msg', 'You are registered and can now login');
					res.redirect('/users/login');
				}
			});
		});
	}
});

passport.use(new LocalStrategy(
	function (username, password, done) {
		User.getUserByUsername(username, function (err, user) {
			if (err) throw err;
			if (!user) {
				return done(null, false, { message: 'Unknown User' });
			}

			User.comparePassword(password, user.password, function (err, isMatch) {
				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, { message: 'Invalid password' });
				}
			});
		});
	}));

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.getUserById(id, function (err, user) {
		done(err, user);
	});
});

router.post('/login',
	passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
	function (req, res) {
		res.redirect('/');
	});

router.get('/logout', function (req, res) {
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/login');
});

module.exports = router;
