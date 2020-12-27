const { InfluxDB, Point } = require("@influxdata/influxdb-client");

const username = "my-user";
const password = "my-password";

const database = "mydb";
const retentionPolicy = "myrp";

const bucket = `${database}/${retentionPolicy}`;

const clientOptions = {
  url: "http://localhost:8086",
  token: `${username}:${password}`,
}

const influxDB = new InfluxDB(clientOptions);

class InfluxClient {

  constructor() {
    this.writeAPI = influxDB.getWriteApi('', bucket);
    this.queryAPI = influxDB.getQueryApi('');
  }

  async write(message, tag, id) {
    const point = new Point(tag)
      .stringField('msg', message);
    this.writeAPI.writePoint(point);
    await this.writeAPI.flush();
  }

  async read(tag, range) {
    const query = `from(bucket: "${bucket}") |> range(start: -${range || 1}h) |> filter(fn: (r) => r._measurement == "${tag}")`;
    const data = await this.queryAPI.collectRows(query);
    return data.map((el) => el._value);
  }
}

module.exports = {
  influxClient: new InfluxClient()
}
