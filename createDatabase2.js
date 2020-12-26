#!/usr/bin/env node

const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const { SetupAPI } = require("@influxdata/influxdb-client-apis");

const username = "my-user";
const password = "my-password";

const database = "mydb";
const retentionPolicy = "autogen";

const bucket = `${database}/${retentionPolicy}`;

const clientOptions = {
  url: 'http://localhost:8086',
  token: `${username}:${password}`,
}

const influxDB = new InfluxDB(clientOptions);
const setupApi = new SetupAPI(influxDB);

setupApi
  .getSetup()
  .then(async ({allowed}) => {
    if (allowed) {
      await setupApi.postSetup({
        body: {
          org,
          bucket,
          username,
          password,
          token,
        },
      })
      console.log(`InfluxDB '${url}' is now onboarded.`)
    } else {
      console.log(`InfluxDB '${url}' has been already onboarded.`)
    }
    console.log('\nFinished SUCCESS')
  })
  .catch(error => {
    console.error(error)
    console.log('\nFinished ERROR')
  });
