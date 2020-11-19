const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const poissonProcess = require("poisson-process");

let lastTime = new Date();
let totalDelta = 0;
let count = 0;

function sendMessage() {
    const currentTime = new Date();
    totalDelta += currentTime.getTime() - lastTime.getTime();
    count++;
    console.log(`Avg: ${totalDelta/count}`);
}

function main() {
    const loop = poissonProcess.create(3000, sendMessage);
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

function setup() {
    const client = new hello_proto.Publisher('localhost:50051', grpc.credentials.createInsecure());

    const call = client.register({message: 'Lucas'});

    call.on('data', ({message}) => {
        console.log(message);
    });

    call.on('end', () => {
        console.log('Connection ended');
    });
}

setup();
