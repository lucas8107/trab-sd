const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

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

function register(call) {
    for(let i = 0; i < 10; i++)
        call.write({ message: 'Test' });
    call.end();
}

function sendMessage(call, callback) {
    console.log(`Received: ${call.request.name}`);
    callback(null, { message: 'ACK' });
}

function setup() {
    const server = new grpc.Server();
    server.addService(hello_proto.Publisher.service, { register });
    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
        server.start();
    });
}

setup();
