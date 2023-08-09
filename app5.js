const https = require("https");
const bcrypt = require('bcrypt');
const fs = require("fs");
const port = 4014;
const express = require("express");
const app = express();
const cors = require('cors');
const urlencodedParser = express.urlencoded({extended: false});
var bodyParser = require('body-parser');
const tesseract = require("node-tesseract-ocr");
const axios = require('axios').default;
const WebSocketClient = require('websocket').client;
const socketPort = '8080/';
let client = new WebSocketClient();

let socket;

const Redis = require('ioredis');
const redis = new Redis({
  port: 6379,
  host: "212.22.94.200",
  password: "ugD6s2xz"
});
let salt;
redis.get("salt").then((res) => salt = res);

let corsOptions = {
	origin : '*',
	optionsSuccessStatus: 200
}
app.use(function(req, res, next){
    if(!req.connection.encrypted){ res.redirect('https://' + req.headers.host + req.url); }
    else{ return next(); }
});
app.use(bodyParser.json());
app.use(cors({origin: '*'}));

app.use(function(req, res, next){
	console.log('\n\n');
	console.log(req.url);
	next();
});

app.get('(/4014)?/1587', cors({origin: '*'}), function(request, response){
    console.log(`URL: ${request.url}`);
	socket.send(`TM: s2: URL: ${request.url}`);
	filePath = "exp1/test5.html";
	fs.readFile(filePath, function(error, data){
              
        if(error){
                  
            response.statusCode = 404;
            response.end("Resourse not found!");
            console.log('404');
			socket.send(`TM: s2: 404`);
        }   
        else{
            response.end(data);
        }
    });
});

app.get('(/4014)?/newLibs*', function(request, response){
	
    console.log(`URL: ${request.url}`);
	socket.send(`TM: s2: URL: ${request.url}`);
    filePath = request.url.substr(request.url[1]==='4' ? 5 : 1);
	if (filePath[filePath.length-1]=='/')  filePath = filePath.slice(0,-1);
    fs.readFile(filePath, function(error, data){
		console.log(`URL: ${request.url}`);
        if(error){
                  
            response.statusCode = 404;
            response.end("Resourse not found!");
            console.log('404');
			socket.send(`TM: s2: 404`);
        }   
        else{
            response.end(data);
        }
    });
});

app.get('(/4014)?/libs*', function(request, response){
	
    console.log(`URL: ${request.url}`);
	socket.send(`TM: s2: URL: ${request.url}`);
    filePath = request.url.substr(request.url[1]==='4' ? 6 : 1);
	console.log('file path: '+filePath);
    console.log(`filePath: ${filePath}`);
    console.log(`filePath[1]: ${filePath[1]}`);
    fs.readFile(filePath, function(error, data){
              
        if(error){
                  
            response.statusCode = 404;
            response.end("Resourse not found!");
            console.log('404');
			socket.send(`TM: s2: 404`);
        }   
        else{
            response.end(data);
        }
    });
});

app.get('(/4014)?/', function(request, response){
	
    console.log(`URL: ${request.url}`);
	socket.send(`TM: s2: URL: ${request.url}`);
    filePath = request.url.substr(request.url[1]==='4' ? 5 : 1);
    if (!filePath) filePath = "exp1/test.html";
    if (filePath=='1587') filePath = "exp1/test5.html";
    fs.readFile(filePath, function(error, data){
              
        if(error){
                  
            response.statusCode = 404;
            response.end("Resourse not found!");
            console.log('404');
			socket.send(`TM: s2: 404`);
        }   
        else{
            response.end(data);
        }
    });
});

app.get('(/4014)?/favico*', function(request, response){
	
    console.log(`URL: ${request.url}`);
	socket.send(`TM: s2: URL: ${request.url}`);
    filePath = request.url.substr(request.url[1]==='4' ? 5 : 1);
    fs.readFile(filePath, function(error, data){
              
        if(error){
                  
            response.statusCode = 404;
            response.end("Resourse not found!");
            console.log('404');
			socket.send(`TM: s2: 404`);
        }   
        else{
            response.end(data);
        }
    });
});

app.get('(/4014)?/apiTok', async function(request, response){
		await bcrypt.hash((request.query.pass+request.query.login.trim()), salt).then(function(res) {
			console.log(res);
			redis.get(res).then(response.send(res)).catch((e) => response.send(JSON.stringify({status: 403, error:'incorrect'})));
		});
});

app.post('(/4014)?/api', async function(request, response){	
    if(!request.body) return response.sendStatus(200);
	console.log(request.body);
	let buf = {
		token: request.body.token,
		url: request.body.url,
		telegToken: request.body.telegToken,
		id: request.body.id,
		lang: request.body.lang
	}
	let userName;
	if (buf.token[0]==='$') buf.token=buf.token.substr(7);
	await redis.get(buf.token).then(res => userName = res).catch((e) => response.send(JSON.stringify({status: 403, error:'incorrect'})));
	if (buf.telegToken&&userName&&buf.id&&buf.lang) {
		let config = {
			lang: buf.lang,
			oem: 1,
			psm: 3,
		};
		const file_reqvest = `https://api.telegram.org/bot${buf.telegToken}/getFile?file_id=${buf.id}`;
		try {
		axios.get(file_reqvest).then(res => {
			let img = `https://api.telegram.org/file/bot${buf.telegToken}/${res.data.result.file_path}`;
			
			tesseract
				.recognize(img, config)
				.then((text) => {
					response.send(JSON.stringify({status: 200, text: text}));
				})
				.catch((error) => {
					response.send(JSON.stringify({status: 500, error: error.message}))
				})
		});
		} catch (e) {
			console.log(e);
			socket.send(`TM: s2: URL: ${e}`);
			response.send(JSON.stringify({status: 500, error: error.message}));
		}
	}
	else if (userName&&buf.lang&&buf.url) {
		tesseract
			.recognize(buf.url, config)
			.then((text) => {
				response.send(JSON.stringify({status: 200, text: text}));
			})
			.catch((error) => {
				response.send(JSON.stringify({status: 500, error: error.message}))
			})
	}
	else response.send(JSON.stringify({status: 403, error:'incorrect'}));
});

https
  .createServer(
    {
		key: fs.readFileSync("/etc/letsencrypt/live/spamigor.ru/privkey.pem"),//("/home/spamigor/node/certHttps/key.pem"),
		cert: fs.readFileSync("/etc/letsencrypt/live/spamigor.ru/fullchain.pem"),//("/home/spamigor/node/certHttps/cert.pem"),
		ca: fs.readFileSync("/etc/letsencrypt/live/spamigor.ru/chain.pem"),
    },
    app
  )
  .listen(port, () => {
    console.log(`serever is runing at port ${port}`);
  });
  
  client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
	setTimeout(() => {
		console.log('reconnect');
		client.connect('wss://spamigor.ru:' + socketPort, 'echo-protocol');
	}, 60*1000)
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
		setTimeout(() => {
			console.log('reconnect');
			client.connect('wss://spamigor.ru:' + socketPort, 'echo-protocol');
		}, 60*1000)
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
			console.log("Received: '" + message.utf8Data + "'");
        }
    });
	
	socket = connection;
    
    function sendNumber() {
        if (connection.connected) {
            var number = new Date();
            connection.sendUTF('s2: ' + (Number(number)).toString());
            connection.sendUTF('s3: ' + (Number(number)).toString());
            setTimeout(sendNumber, 60*1000);
        }
    }
    sendNumber();
});

client.connect('wss://spamigor.ru:' + socketPort, 'echo-protocol');
