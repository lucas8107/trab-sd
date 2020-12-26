const axios = require("axios").default;

const baseURL = "http://localhost:8086";
const client = axios.create({baseURL});

async function dropDatabase(name) {
  return await client.post('/query', {}, {params: {q: `drop database ${name}`}});
}

async function createDatabase(name) {
  return await client.post('/query', {}, {params: {q: `create database ${name}`}});
}

async function createRetentionPolicy(name, retentionTime) {
  return await client.post("/query", {}, {
    params: {
      q: `create retention policy myrp on ${name} duration ${retentionTime} replication 1`
    }
  });
}

async function setupDatabase(name, retentionTime) {
  await dropDatabase(name);
  await createDatabase(name);
  await createRetentionPolicy(name, retentionTime);
}

module.exports = {
  setupDatabase
}
