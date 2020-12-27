# trab-sd
Using influxdb to keep data

## Docker-compose
```
docker-compose up
```
## Broker
```
npm run broker <retention time in hours>
```

## Publisher
```
npm run publisher <tag name> <retention time in hours>
```

## Subscriber
```
npm run subscriber <tag name>
or
npm run subscriber
```
