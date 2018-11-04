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
