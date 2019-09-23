'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
    if (!process.env[name]) {
        throw new Error('You must set the ' + name + ' environment variable');
    }
    return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
    env: process.env.NODE_ENV,

    // Root path of server
    root: path.normalize(__dirname + '/../../..'),
    //log: path.normalize(__dirname + '/../../../log'),
    // Server port
    port: process.env.PORT || 3008,
    MISconnectionString: {
        "user": "mis_dashboard",
        "password": "mis_dashboard",
        "connectString": "192.168.1.200/devop"
    },

    // CBSconnectionString: {
    //     "user": "pucbl_120116",
    //     "password": "pucbl_120116",
    //     "connectString": "192.168.1.82/atmdb"
    // },

    // Secret for session, you will want to change this and make it an environment variable
    secrets: {
        session: 'VGM',
        password: 'PWD'
    },

    // List of user roles
    userRoles: ['guest', 'user', 'admin']

};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
    all,
    require('./' + process.env.NODE_ENV + '.js') || {});