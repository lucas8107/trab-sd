#!/usr/bin/env node

const { InfluxDB, Point } = require("@influxdata/influxdb-client");

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

console.log('*** WRITE POINTS ***')

const writeAPI = influxDB.getWriteApi('', bucket)
const point = new Point('bug')
  .stringField('msg', 'Hello influx');
const point2 = new Point('live')
  .stringField('msg', 'Hello db');
writeAPI.writePoint(point)
writeAPI.writePoint(point2);
writeAPI
  .close()
  .then(() => console.log('FINISHED'))
  .catch(error => {
    console.error(error)
  })

console.log('*** QUERY ROWS ***')

const queryAPI = influxDB.getQueryApi('')
const query = `from(bucket: "${bucket}") |> range(start: -1h) |> filter(fn: (r) => r._measurement == "live")`
queryAPI.queryRows(query, {
  next(row, tableMeta) {
    const o = tableMeta.toObject(row);
    console.log(JSON.stringify(o, null, 2));
    //console.log(`${o._time} ${o._measurement} : ${o._field}=${o._value}`)
  },
  error(error) {
    console.error(error)
  },
  complete() {
    console.log('\nFinished')
  },
})
