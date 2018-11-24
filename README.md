# [IT_API](http://api.it.teithe.gr/) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/apavlidi/IT_API/wiki/How-to-contribute) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/6264e9c8a11049739bdfd7b7b331b062)](https://www.codacy.com?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=apavlidi/IT_API&amp;utm_campaign=Badge_Grade)

IT_API is an API that integrates with the Internet services of the department of [Information Technology at Alexander Technological Education Institute of Thessaloniki](https://www.it.teithe.gr/?lang=el) 

## Installation

### Requirements 

* You should have nodejs installed.If you don`t just go [here](https://nodejs.org/en/) and install it.
* You should have an internal IP of the IT departpment.Connect via vpn with the instructions [here](https://apps.it.teithe.gr/service/openvpn).
* You have to use preconfigured server with LDAP and MongodDB as described [here](https://github.com/apavlidi/IT_API/wiki/OVA-Image) 

#### Windows

 * You have to clone the project first.  <br/>
                `$ git clone https://github.com/apavlidi/IT_API.git`
                
 * Before installing the modules you have to specifically install <b>node-canvas</b>.  <br/>
  Follow the instructions here to install it: https://github.com/Automattic/node-canvas/wiki/Installation%3A-Windows <br/>
    > **Note:** In case you can't install it you can alternatively do the following:
    You have to commend every line that contains the `text2png` module.
    After you commended it just run: `$ npm run startDevWindows` <br/>
    You can either search on the project for its usage but for now it is on `/routes/ldapFunctions.js`
 
 * Go to the projecet's folder and run the following command <br/>
          `$ npm install`

 * Next run:  <br/>
`$ set NODE_ENV=development & LDAP_HOST=ldap://{LDAP-SERVER-IP}:389 & LDAP_USER={USER} & LDAP_PASSWORD={PASSWORD} MONGO_URL=mongodb://{USER}:{PASSSWORD}@{SERVER-IP}/myappdev?authSource=admin`

 

#### Linux

 * You have to clone the project first.  <br/>
                `$ git clone https://github.com/apavlidi/IT_API.git`

 * Go to the projecet's folder and run the following command <br/>
          `$ npm install`

 * Next run:  <br/>
`$ NODE_ENV=development LDAP_HOST=ldap://{LDAP-SERVER-IP}:389 LDAP_USER={USER} LDAP_PASSWORD={PASSWORD} MONGO_URL=mongodb://{USER}:{PASSWORD}@{SERVER-IP}/myappdev?authSource=admin`


#### Mac OS

 * You have to clone the project first.  <br/>
                `$ git clone https://github.com/apavlidi/IT_API.git`

 * Go to the projecet's folder and run the following command <br/>
          `$ npm install`

 * Next run:  <br/>
`$ NODE_ENV=development LDAP_HOST=ldap://{LDAP-SERVER-IP}:389 LDAP_USER={USER} LDAP_PASSWORD={PASSWORD} MONGO_URL=mongodb://{USER}:{PASSWORD}@{SERVER-IP}/myappdev?authSource=admin`


> **Pro Tip!:** You can make a script and pass these variables and run the script instead of running the whole command in every run

## Documentation

You can find the IT_API documentation [here](https://github.com/apavlidi/IT_API/wiki/API-Documentation).  

## Contributing

The main purpose of this repository is to continue to evolve IT_API core, making it faster,more maintanable and more scalable. Development of IT_API happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements.

### Contributing Guide

Read our [contributing guide](https://github.com/apavlidi/IT_API/wiki/How-to-contribute) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to IT_API


### Good First Issues

To help you get your feet wet and get you familiar with our contribution process, we have a list of [good first issues](https://github.com/apavlidi/IT_API/issues) that contain bugs or enhancement with relatively  limited scope. This is a great place to get started.


### Feedback

Suggestions/improvements welcome!



