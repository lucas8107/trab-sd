const process = require("process");
const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const poissonProcess = require("poisson-process");
const { exit } = require("process");

let lastTime = new Date();
let totalDelta = 0;
let count = 0;

function sendMessage(call) {
  const currentTime = new Date();
  totalDelta += currentTime.getTime() - lastTime.getTime();
  lastTime = currentTime;
  count++;
  call.write({ id: tagName, message: `Avg: ${totalDelta / count}` });
}

function messageLoop(call) {
  const loop = poissonProcess.create(1000, () => sendMessage(call));
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
  tagName = process.argv.slice(2)[0];

  if (!tagName) {
    console.log("Proivide a tag name");
    return;
  }

  const client = new hello_proto.Publisher('localhost:50051', grpc.credentials.createInsecure());

  await client.register({ message: tagName }, (err, resp) => {
    console.log(resp.message);
    if (resp.message !== 'registration successful.') {
      exit(0);
    }
  });

  const call = client.sendMessage({ id: 1, message: 'test' }, (err, stats) => {
    console.log(err, stats);
  });

  messageLoop(call);

}

start();
