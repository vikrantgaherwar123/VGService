
'use strict';
var express = require('express');
var controller = require('./service.controller');
// var mController = require('./mongoService.controller');
var router = express.Router();

//router.post('/', controller.save)
// router.post('/M',mController.Posts);
router.post('/',controller.Posts);
// router.get('/',controller.Get);


module.exports = router;