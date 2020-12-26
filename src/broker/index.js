const _ = require("lodash");
const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const { setupDatabase } = require("./setupDB");
const { influxClient } = require("./influxClient");

const AVAILABLE_TAGS = [
  'trial',
  'license',
  'support',
  'bug'
];

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
);
const hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

function register(call, callback) {
  const { message: tagName } = call.request;
  if (!AVAILABLE_TAGS.includes(tagName))
    return callback(null, { message: 'tag not available.' });
  if (tagName in publishers)
    return callback(null, { message: 'tag already registered.' });
  publishers[tagName] = {};
  return callback(null, { message: 'registration successful.' });
}

function sendMessage(call) {
  let firstMessage = true;
  call.on('data', async ({ id, message }) => {
    if (firstMessage) {
      call.on('end', async () => {
        for (let i in publishers[id]) {
          publishers[id][i].write({ message: "The publisher lost connection." });
          await publishers[id][i].end();
        }
        delete publishers[id];
        console.log(`Disconnected: ${JSON.stringify(id)}`);
      });
      firstMessage = false;
    }

    console.log('w');
    await influxClient.write(message, 'm');

    if (!_.isEmpty(publishers[id])) {
      for (let i in publishers[id]) {
        publishers[id][i].write({ message });
      }
    }
  });
}

publishers = {};

const getActiveTags = (call, callback) => {
  let tags = [];
  for (let key in publishers) tags.push(key);
  return callback(null, { list: tags });
}

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

const subscribeToTag = (call) => {
  let firstMessage = true;
  call.on('data', async ({ message }) => {
    if (firstMessage) {
      if (!(message in publishers)) {
        call.write({ message: 'No publisher with given tag' });
        call.end();
      } else {
        await influxClient.read('m');
        let id = getRandomInt(1, 500000);
        while (id in publishers[message])
          id = getRandomInt(1, 500000);
        publishers[message][+id] = call;
        call.on('end', () => {
          console.log(`Lost subscriber with id ${id}`);
          delete publishers[message][+id];
        });
      }
      firstMessage = false;
    }
    console.log(message);
  });
}

async function setup() {
  const server = new grpc.Server();
  server.addService(hello_proto.Publisher.service, { register, sendMessage });
  server.addService(hello_proto.Subscriber.service, { subscribeToTag, getActiveTags });
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
  });
  await setupDatabase("mydb", "1h");
}

setup();
