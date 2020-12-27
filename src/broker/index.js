const process = require("process");
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

const TAG_IDS = {
  'trial': 0,
  'license': 0,
  'support': 0,
  'bug': 0
};

let dbRetainTimeHours = 1;

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
  return callback(null, { message: `registration successful.|${TAG_IDS[tagName]}` });
}

function sendMessage(call) {
  let firstMessage = true;
  call.on('data', async ({ tag, id, timestamp, message }) => {
    if (firstMessage) {
      call.on('end', async () => {
        for (let i in publishers[tag]) {
          publishers[tag][i].write({ message: "The publisher lost connection." });
          await publishers[tag][i].end();
        }
        delete publishers[tag];
        console.log(`Disconnected: ${JSON.stringify(tag)}`);
      });
      firstMessage = false;
    }

    TAG_IDS[tag] = +id + 1;
    await influxClient.write(`${tag}|${id}|${timestamp}|${message}`, tag);

    if (!_.isEmpty(publishers[tag])) {
      for (let i in publishers[tag]) {
        publishers[tag][i].write({ message: `${tag}|${id}|${timestamp}|${message}` });
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
    console.log(message);
    if (firstMessage) {
      if (!(message in publishers)) {
        call.write({ message: 'No publisher with given tag' });
        call.end();
      } else {
        // await call.write({message: `Fetching messages sent within the last ${1} hour(s)`});
        const pastMessages = await influxClient.read(message, dbRetainTimeHours);
        // for(msg of pastMessages) {
          // console.log(msg);
          // await call.write({message: msg});
        // }
        let id = getRandomInt(1, 500000);
        while (id in publishers[message])
          id = getRandomInt(1, 500000);
        publishers[message][+id] = call;

        for(msg of pastMessages) {
          publishers[message][+id].write({ message: msg });
        }

        call.on('end', () => {
          console.log(`Lost subscriber with id ${id}`);
          if(publishers[message])
            delete publishers[message][+id];
        });
      }
      firstMessage = false;
    }
    console.log(message);
  });
}

async function setup() {
  let args = process.argv.slice(2);

  dbRetainTimeHours = Math.ceil(Number(args[0]));

  if(!dbRetainTimeHours) {
    console.log("Provide a retain time (integer hour)");
    return;
  }

  if(isNaN(dbRetainTimeHours)) {
    console.log("The value provided should be a number");
  }

  const server = new grpc.Server();
  server.addService(hello_proto.Publisher.service, { register, sendMessage });
  server.addService(hello_proto.Subscriber.service, { subscribeToTag, getActiveTags });
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
  });

  await setupDatabase("mydb", `${dbRetainTimeHours}h`);
}

setup();
