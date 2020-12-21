#!/home/lucas/Programs/node-v14.15.1-linux-x64/bin/node
const axios = require("axios").default;

const baseURL = "http://localhost:8086";

const client = axios.create({baseURL});

async function createDatabase () {
  const ans = await client.post('/query', {}, {params: {q: "create database messages"}});

  console.log(ans.status);
  console.dir(ans.data);
}

async function createRetentionPolicy () {
  const ans = await client.post("/query", {}, {
    params: {
      q: "create retention policy myrp on messages duration 7h replication 1"
    }
  });

  console.log(ans.status);
  console.dir(ans.data);
}

async function writeMessage () {
//  const ans = await client.post('/write', 'cpu_load_short,host=server01,region=us-west value=0.64 1434055562000000000', {
  const ans = await client.post('/write', 'bug value="hello bug"', {
    params: {
      db: 'messages',

    },
    headers: {
      'content-type': 'application/octet-stream'
    }
  });

  console.log(ans.status);
  console.dir(ans.data);
}

async function readData () {
  const ans = await client.post('/api/v2/query', 'from(bucket: "messages") |> filter(fn:(r) => r._measurement == "cpu")', {
    headers: {
      'Accept': 'application/csv',
      'content-type': 'application/vnd.flux'
    }
  });

  console.log(ans.status);
  console.dir(ans.data);
}



Promise.resolve()
//  .then(createDatabase)
//  .then(createRetentionPolicy)
  .then(writeMessage)
//  .then(readData);
