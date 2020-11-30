const process = require("process");
const rl = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});
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

async function setup() {
  let tagName = null;

  const client = new hello_proto.Subscriber('localhost:50051', grpc.credentials.createInsecure());

  await new Promise(((resolve) => {
    client.getActiveTags({}, function (err, response) {
      let tagList = response.list;
      console.log('Available tags:');
      for (let tag of tagList) {
        console.log(tag);
      }

      const getUserTag = () => {
        rl.question("Which tag do you want to track? ", (ans) => {
          if (tagList.includes(ans)) {
            console.log(`You picked ${ans}`);
            tagName = ans;
            rl.close();
            resolve();
          } else {
            return getUserTag();
          }
        });
      }
      getUserTag();
    });
  }));

  const call = client.subscribeToTag({ message: tagName });

  call.on('data', ({ message }) => {
    console.log(`From broker: ${message}`);
  });

  call.on('end', () => {
    console.log('Server ended');
    rl.close();
  })


}

setup();
