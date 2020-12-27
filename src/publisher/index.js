const process = require("process");
const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const poissonProcess = require("poisson-process");
const { exit } = require("process");

let lastTime = new Date();
let totalDelta = 0;
let count = 0;
let id = 0;
let messagesPerHour = 60;

function sendMessage(call) {
  const currentTime = new Date();
  totalDelta += currentTime.getTime() - lastTime.getTime();
  lastTime = currentTime;
  count++;
  call.write({
    tag: tagName,
    id: id++,
    timestamp: new Date().toISOString(),
    message: `Avg: ${totalDelta / count}`
  });
}

function messageLoop(call) {
  const loop = poissonProcess.create((60*60*1000)/messagesPerHour, () => sendMessage(call));
  loop.start();
}

const PROTO_PATH = path.join(__dirname, '..', 'protos/helloworld.proto');

const packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
)
const hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

tagName = '';

async function start() {
  let args = process.argv.slice(2);
  tagName = args[0];
  messagesPerHour = Number(args[1]);

  if (!tagName) {
    console.log("Proivide a tag name");
    return;
  }

  if(!messagesPerHour) {
    console.log("Provide a message per hour number");
    return;
  }

  if(isNaN(messagesPerHour)) {
    console.log("Message per hour number should be a number");
  }

  const client = new hello_proto.Publisher('localhost:50051', grpc.credentials.createInsecure());

  await client.register({ message: tagName }, (err, resp) => {
    console.log(resp.message);
    if (!resp.message.startsWith('registration successful.')) {
      exit(0);
    }
    id = Number(resp.message.split('|')[1]);
  });

  const call = client.sendMessage({
    tag: '',
    id: 0,
    timestamp: new Date().toISOString(),
    message: 'test'
  }, (err, stats) => {
    console.log(err, stats);
  });

  messageLoop(call);

}

start();
