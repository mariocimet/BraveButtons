let chai = require('chai');
let SessionState = require('../SessionState.js');
const STATES = require('../SessionStateEnum.js');
let app;
let fs = require('fs');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
require('dotenv').load();
let Datastore = require('nedb')



describe('Chatbot server', () => {

	let baseUrl = "https://chatbot.brave.coop";

	//TODO: replace with database file
	let stateFilename = "buttonPressesTest";

	let defaultRequest = {
		'UUID': '111',
		'Type': 'click'
	};

	let defaultRequestDouble = {
		'UUID': '111',
		'Type': 'double_click'
	};

	let defaultRequestHold = {
		'UUID': '111',
		'Type': 'hold'
	};

	let defaultRequest2 = {
		'UUID': '222',
		'Type': 'click'
	};


	let defaultBody = {
		'UUID': '111',
		'Unit': '123',
		'PhoneNumber': '+16664206969',
		'Type': 'click'
	};

	let defaultBody2 = {
		'UUID': '222',
		'Unit': '222',
		'PhoneNumber': '+17774106868',
		'Type': 'click'
	};

	let twilioMessageBody = {
		'From': process.env.RESPONDER_PHONE_TEST,
		'Body': 'Please answer "Ok" to this message when you have responded to the alert.',
		'To': '+16664206969'
	};

	describe('POST request: button press', () => {

		let currentState;

		beforeEach(() => {
			if(fs.existsSync('buttonsTest.db')){
				fs.unlinkSync('buttonsTest.db');
			}

			if(fs.existsSync('serverTest.db')){
				fs.unlinkSync('serverTest.db');
			}
			  delete require.cache[require.resolve('../server.js')];
  			app = require('../server.js');

				//Create database on teardown
			fs.writeFileSync('./' + stateFilename + '.json', '{}');

		});

		 afterEach(function () {
		    app.close();
		 });


		it('should return 400 to a request with an empty body', async () => {
			let response = await chai.request(app).post('/') .send({});
			expect(response).to.have.status(400);
		});

		it('should return 400 to a request with an unregistered button', async () => {
			let response = await chai.request(app).post('/') .send({'UUID': '666','Type': 'click'});
			expect(response).to.have.status(400);
		});

		it('should return ok to a valid request', async () => {
			let response = await chai.request(app).post('/') .send(defaultRequest);
			expect(response).to.have.status(200);
		});

		it('should update the session state for a valid request', async () => {

			let currentState = null;

			let response = await chai.request(app).post('/').send(defaultRequest);



			//TODO: Replace with database table
			let sessions = new Datastore({filename: `./serverTest.db`, });
			sessions.loadDatabase();

			sessions.findOne({'phoneNumber':defaultBody.PhoneNumber}, (err,session) => {

			currentState = new SessionState(session.uuid, session.unit, session.phoneNumber, session.state, session.numPresses);
			expect(currentState).to.not.be.null;
			expect(currentState).to.have.property('uuid');
			expect(currentState).to.have.property('unit');
			expect(currentState).to.have.property('completed');
			expect(currentState).to.have.property('state');
			expect(currentState).to.have.property('numPresses');
			expect(currentState.uuid).to.deep.equal(defaultBody.UUID);
			expect(currentState.unit).to.deep.equal(defaultBody.Unit);
			expect(currentState.completed).to.be.false;
			expect(currentState.numPresses).to.deep.equal(2);
			})
		});

		it('should ignore requests from different uuid if session not completed', async () => {

			let currentState = null;

			let response = await chai.request(app).post('/').send(defaultRequest);
			response = await chai.request(app).post('/').send(defaultRequest2);

			sessions.findOne({'phoneNumber':defaultBody.PhoneNumber}, (err,session) => {
		  currentState = new SessionState(session.uuid, session.unit, session.phoneNumber, session.state, session.numPresses);
			expect(currentState).to.not.be.null;
			expect(currentState).to.have.property('uuid');
			expect(currentState).to.have.property('unit');
			expect(currentState).to.have.property('completed');
			expect(currentState).to.have.property('numPresses');
			expect(currentState.uuid).to.deep.equal(defaultBody.UUID);
			expect(currentState.unit).to.deep.equal(defaultBody.Unit);
			expect(currentState.completed).to.be.false;
			expect(currentState.numPresses).to.deep.equal(3);
    })
		});

		it('should increment button presses when requests from same uuid if session not completed', async () => {

			let currentState = null;

			let response = await chai.request(app).post('/').send(defaultRequest);
		    response = await chai.request(app).post('/').send(defaultRequestDouble);
			response = await chai.request(app).post('/').send(defaultRequestHold);
			//TODO: REPLACE WITH DATABASE
			let allStateData = JSON.parse(fs.readFileSync('./' + stateFilename + '.json'));
			let stateData = allStateData[defaultBody.PhoneNumber];
			currentState = new SessionState(stateData.uuid, stateData.unit, stateData.phoneNumber, stateData.state, stateData.numPresses);

			expect(currentState).to.not.be.null;
			expect(currentState).to.have.property('uuid');
			expect(currentState).to.have.property('unit');
			expect(currentState).to.have.property('completed');
			expect(currentState).to.have.property('state');
			expect(currentState).to.have.property('numPresses');
			expect(currentState.uuid).to.deep.equal(defaultBody.UUID);
			expect(currentState.unit).to.deep.equal(defaultBody.Unit);
			expect(currentState.completed).to.be.false;
			expect(currentState.numPresses).to.deep.equal(7);
		});

	});

	describe('POST request: twilio message', () => {

		beforeEach(() => {
			if(fs.existsSync('buttonsTest.db')){
				fs.unlinkSync('buttonsTest.db');
			}

			//TODO: REPLACE WITH DATABASE IN TEARDOWNS
				delete require.cache[require.resolve('../server.js')];
  			app = require('../server.js');
			fs.writeFileSync('./' + stateFilename + '.json', '{}');
		});

		it('should return ok to a valid request', async () => {
			let response = await chai.request(app).post('/message').send(twilioMessageBody);
			expect(response).to.have.status(200);
		});

		it('should return 400 to a request with an incomplete body', async () => {
			let response = await chai.request(app).post('/message').send({'Body': 'hi'});
			expect(response).to.have.status(400);
		});

		it('should return 400 to a request from an invalid phone number', async () => {
			let response = await chai.request(app).post('/message').send({'Body': 'hi', 'From': '+16664206969'});
			expect(response).to.have.status(400);
		});

		it('should return ok to a valid request and advance session appropriately', async () => {
		    let response = await chai.request(app).post('/').send(defaultBody);
				//TODO: REPLACE WITH DATABASE REFERENCE
		    let allStateData = JSON.parse(fs.readFileSync('./' + stateFilename + '.json'));
let stateData = allStateData[defaultBody.PhoneNumber];
			currentState = new SessionState(stateData.uuid, stateData.unit, stateData.phoneNumber, stateData.state, stateData.numPresses);

			expect(currentState.state).to.deep.equal(STATES.STARTED);
			response = await chai.request(app).post('/message').send(twilioMessageBody);
			expect(response).to.have.status(200);

			allStateData = JSON.parse(fs.readFileSync('./' + stateFilename + '.json'));
stateData = allStateData[defaultBody.PhoneNumber];
			currentState = new SessionState(stateData.uuid, stateData.unit, stateData.phoneNumber, stateData.state, stateData.numPresses);
			expect(currentState.state).to.deep.equal(STATES.WAITING_FOR_CATEGORY);

		});

		it('should be able to advance a session to completion and accept new requests', async () => {
		    let response = await chai.request(app).post('/').send(defaultBody);
		    let allStateData = JSON.parse(fs.readFileSync('./' + stateFilename + '.json'));
let stateData = allStateData[defaultBody.PhoneNumber];
			currentState = new SessionState(stateData.uuid, stateData.unit, stateData.phoneNumber, stateData.state, stateData.numPresses);

			expect(currentState.state).to.deep.equal(STATES.STARTED);
			response = await chai.request(app).post('/message').send(twilioMessageBody); // => category
			response = await chai.request(app).post('/message').send({'From': process.env.RESPONDER_PHONE_TEST, 'Body': '0', 'To': defaultBody.PhoneNumber}); // => details
			response = await chai.request(app).post('/message').send(twilioMessageBody);  // complete

			expect(response).to.have.status(200);

			allStateData = JSON.parse(fs.readFileSync('./' + stateFilename + '.json'));
            stateData = allStateData[defaultBody.PhoneNumber];
			currentState = new SessionState(stateData.uuid, stateData.unit, stateData.phoneNumber, stateData.state, stateData.numPresses);
			expect(currentState.state).to.deep.equal(STATES.COMPLETED);
			expect(currentState.completed).to.be.true;

			// now send a different request
			response = await chai.request(app).post('/').send(defaultBody2);

			allStateData = JSON.parse(fs.readFileSync('./' + stateFilename + '.json'));
            stateData = allStateData[defaultBody2.PhoneNumber];
			currentState = new SessionState(stateData.uuid, stateData.unit, stateData.phoneNumber, stateData.state, stateData.numPresses);
			expect(currentState.uuid).to.deep.equal(defaultBody2.UUID);
			expect(currentState.unit).to.deep.equal(defaultBody2.Unit);
			expect(currentState.completed).to.be.false;
			expect(currentState.numPresses).to.deep.equal(1);
		});

		afterEach(function () {
		    app.close();
		});

	});

	after(() => {
		fs.writeFileSync('./' + stateFilename + '.json', '{}');
	});

	after(() => {
		fs.writeFileSync('./' + stateFilename + '.json', '{}');
	});
});