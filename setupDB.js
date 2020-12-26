#!/usr/bin/env node

const { InfluxDB } = require("@influxdata/influxdb-client");
const { SetupAPI } = require("@influxdata/influxdb-client-apis");

const config = {
  url: "http://localhost:8086",
  org: "org",
  bucket: "myDB",
  username: "my-user",
  password: "my-password"
};

const setupApi = new SetupAPI(new InfluxDB({ url: config.url }));

setupApi
  .getSetup()
  .then(async ({allowed}) => {
    if(allowed) {
      await setupApi.postSetup({
        body: config
      });
      console.log(`InfluxDB '${url}' is now onboarded.`);
    } else {
      console.log(`InfluxDB '${url}' has been already onboarded.`);
    }
    console.log(`Finished`);
  })
  .catch(error => {
    console.error(error);
    console.log("Finished");
  });
