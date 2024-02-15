# ExperimentInterface

A webinterface for managing Harmonny VR Experiments


## Requirements / First setup
Install nodejs (version 20).
Make sure that we have the right angular client version:
```
npm install -g @angular/cli@17.1.3
```

Then, from inside this project folder, run this command to install all dependencies:
```
npm install
```

Build the interface:
```
ng build
```

## Run the interface webserver & Configure Headset

Run the following command to start the webserver with the webinterface.
It runs on [http://localhost:4444](http://localhost:4444). It listens for udp messages from the headset on port 7766.

```
node server.js
```

Configure the headset target host and port to the IP address of the computer this web interface is running on.

## Fetch an update

To get the latest version from git, just stop the server, git pull, rebuild and restart:

```
git pull
ng build
node server.js
```
