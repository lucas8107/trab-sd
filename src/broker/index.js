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

function register(call, callback) {
  const { message: tagName } = call.request;
  if (tagName in publishers)
    return callback(new Error("test"), { message: 'tag already registered' });
  publishers[tagName] = [];
  return callback(null, { message: 'registration successful' });
}

function sendMessage(call) {
  call.on('data', ({ id, message }) => {
    if (publishers[id].length) {
      for (let i in publishers[id]) {
        publishers[id][i].write({ message })
      }
    }
  });

  call.on('end', (el) => {
    console.log(`Disconnected: ${JSON.stringify(el)}`);
  });
}

publishers = {

}

const getActiveTags = (call, callback) => {
  tags = [];
  for (let key in publishers) tags.push(key);
  return callback(null, { list: tags });
}

const subscribeToTag = (call) => {
  console.log(publishers);
  console.log(call.request);
  const tagName = call.request.message;
  if (!(tagName in publishers)) {
    call.write({ message: 'No publisher with given tag' });
    call.end();
  } else {
    publishers[tagName].push(call);
  }
}

function setup() {
  const server = new grpc.Server();
  server.addService(hello_proto.Publisher.service, { register, sendMessage });
  server.addService(hello_proto.Subscriber.service, { subscribeToTag, getActiveTags });
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
  });
}

setup();
