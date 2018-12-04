# [IT_API](http://api.it.teithe.gr/) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/apavlidi/IT_API/wiki/How-to-contribute) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/6264e9c8a11049739bdfd7b7b331b062)](https://www.codacy.com?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=apavlidi/IT_API&amp;utm_campaign=Badge_Grade)

IT_API is an API that integrates with the Internet services of the department of [Information Technology at Alexander Technological Education Institute of Thessaloniki](https://www.it.teithe.gr/?lang=el) 

## Installation

### Requirements 

* You should have NodeJS installed. If you don't, just go to the official [website](https://nodejs.org/en/) and see instructions on how to install it from there.
* You should have an internal IP of the IT departpment. Connect via VPN by following the instructions [here](https://apps.it.teithe.gr/service/openvpn).
* You have to use a server with LDAP and MongodDB pre-configured as described [here](https://github.com/apavlidi/IT_API/wiki/OVA-Image).

#### Windows

 * Clone the project on your local machine.  <br/>
                `$ git clone https://github.com/apavlidi/IT_API.git`
                
 * Before installing the NodeJS modules you have to specifically install <b>node-canvas</b>.  <br/>
  Follow the instructions here on how to install it: https://github.com/Automattic/node-canvas/wiki/Installation%3A-Windows <br/>
    > **Note:** In case you're having issues with the installation, you can alternatively do the following:
    Comment out every line that contains the `text2png` module.
    After that just run the following command: `$ npm run startDevWindows` <br/>
    You can either search on the project for its usage but for now it is on `/routes/ldapFunctions.js`
 
 * Go to the project's folder and run the following command <br/>
          `$ npm install`

 * Then run:  <br/>
`$ set NODE_ENV=development & LDAP_HOST=ldap://{LDAP-SERVER-IP}:389 & LDAP_USER={USER} & LDAP_PASSWORD={PASSWORD} MONGO_URL=mongodb://{USER}:{PASSSWORD}@{SERVER-IP}/myappdev?authSource=admin`

 

#### Linux

 * Clone the project on your local machine.  <br/>
                `$ git clone https://github.com/apavlidi/IT_API.git`

 * Go to the project's folder and run the following command <br/>
          `$ npm install`

 * Then run:  <br/>
`$ NODE_ENV=development LDAP_HOST=ldap://{LDAP-SERVER-IP}:389 LDAP_USER={USER} LDAP_PASSWORD={PASSWORD} MONGO_URL=mongodb://{USER}:{PASSWORD}@{SERVER-IP}/myappdev?authSource=admin`


#### Mac OS

 * Clone the project on your local machine.  <br/>
                `$ git clone https://github.com/apavlidi/IT_API.git`

 * Go to the project's folder and run the following command <br/>
          `$ npm install`

 * Then run:  <br/>
`$ NODE_ENV=development LDAP_HOST=ldap://{LDAP-SERVER-IP}:389 LDAP_USER={USER} LDAP_PASSWORD={PASSWORD} MONGO_URL=mongodb://{USER}:{PASSWORD}@{SERVER-IP}/myappdev?authSource=admin`


> **Pro Tip!:** You can write a script and pass these variables to it. Then run the script instead of writing the same commands repeatedly every time by hand.

## Documentation

IT_API documentation is available [here](https://github.com/apavlidi/IT_API/wiki/API-Documentation).  

## Contributing

The main purpose of this repository is to further the development of IT_API, by making it faster, more maintainable and more scalable. Development of IT_API happens here on GitHub, and we are grateful to the community for contributing bugfixes and improvements.

### Contributing Guide

Read our [contributing guide](https://github.com/apavlidi/IT_API/wiki/How-to-contribute) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to IT_API.


### Good First Issues

To help you get your feet wet and get you familiar with our contribution process, we have a list of [good first issues](https://github.com/apavlidi/IT_API/issues) that contain bugs or enhancements with relatively limited scope. This is a great place to get started.


### Feedback

Suggestions and/or improvements are welcome!



