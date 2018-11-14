# Secure File Host
> Filesystem host toolkit for Browser-Desktop datasource connections

[![Build Status](https://travis-ci.org/buttercup/secure-file-host.svg?branch=master)](https://travis-ci.org/buttercup/secure-file-host)

## About

This library provides an **event emitter** and an **Express application** for use with the [Buttercup Desktop application](https://github.com/buttercup/buttercup-desktop) - It's designed to provide an interface for [Browser extension](https://github.com/buttercup/buttercup-browser-extension) users to connect on for reading and writing vault files on the local system.

Some users may not want to have their vault files synchronised via a cloud storage service, and this tool is designed to allow them to read files on their PC without the need for connecting to external services.

## Installation

Simply run `npm install @buttercup/secure-file-host --save` to install.

This library is only designed to work with Node JS.

## Usage

Create and run an express server:

```javascript
const { startFileHost } = require("@buttercup/secure-file-host");

const host = startFileHost(9998);
// host.key is the encryption key
```

_In this example, the browser can connect to the file host service on port `9998`._

For repeated use, you may want to provide your own key:

```javascript
startFileHost(9998, "some-encryption-key");
```

You can stop the service when closing the application:

```javascript
const host = startFileHost(9998);

// later
host.stop();
```

If a user wants to cancel the handskahe procedure, make sure to call the `host.cancel()` method to prevent a deadlock.

More details available in the [API documentation](API.md)

### Emitted events

The returned `host` object contains an `emitter` property, which is an event emitter instance. It emits the following events:

| Event Slug    | Schedule               | Description                                               |
|---------------|------------------------|-----------------------------------------------------------|
| `codeReady`   | On client connect      | A client has connected and is awaiting a code to be presented so that the **user** can enter it in the other application's interface. |
| `connectionAvailabilityChanged` | When the status of the host in terms of it accepting new connections changes | Called with an object like `{ available: true }` when the availability of the host changes. It will be fired with `{ available: false }` when someone is trying to connect, and it will stay unavailable until it is either connected or cancelled. If a wrong code is attempted it will stay unavailable for a further 15 seconds. |
| `connected`   |  When connection and handshake procedures have been completed | When the entire handshake procedure has been completed successfully the `connected` event is fired with no arguments. |
