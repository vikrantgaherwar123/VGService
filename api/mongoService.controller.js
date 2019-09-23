'use strict';

var request = require('request');
var express = require('express');
var mongoApi = require('./mongoApi.service');

var ab2str = require('arraybuffer-to-string')

exports.Posts = function (req, res) {
    var param = req.body.methodName;
    switch (param) {
        case 'GET_PRODTYPE':
            getProductType(req, res); break;
        case 'INSERT_PRODTYPE':
            insertProductType(req, res); break;
        case 'UPDATE_PRODTYPE':
            updateProductType(req, res); break;
        case 'GET_PRODMASTER':
            getProductMaster(req, res); break;
        case 'INSERT_PRODMASTER':
            insertProductMaster(req, res); break;
        case 'UPDATE_PRODMASTER':
            updateProductMaster(req, res); break;
        case 'GET_NEWBILLNO':
            getNewBillNo(req, res); break;
        case 'INSERT_PRODTRANMASTER':
            insertProdTranMaster(req, res); break;
        case 'GET_PRODTRANBILL':
            getProdTranBill(req, res); break;
        case 'INSERT_PRODTRANDETAIL':
            insertProdTranDetail(req, res); break;



        default: break;
    }
}

var getResult = function (req, res, data) {
    if (data.code === 1 && data.msg === 'Success') {
        if (data.result.insertedId)
            data.insertedId = data.result.insertedId;
        return res.status(200).json(data);
    }
    else {
        return res.status(401).json({ code: 0, msg: data.msg });
    }
}


function getProductType(req, res) {
    req.body.getCondition = { CLIENT_MST_ID: req.body.data.CLIENT_MST_ID };
    req.body.collectionName = 'product_type_master';
    mongoApi.getRecords(req, res, getResult);
}

function insertProductType(req, res) {
    req.body.collectionName = 'product_type_master';
    mongoApi.insertOneRecord(req, res, getResult);
}

function updateProductType(req, res) {
    req.body.updateCondition = { _id: req.body.data._id };
    req.body.updateValues = req.body.data;
    req.body.collectionName = 'product_type_master';
    mongoApi.updateRecords(req, res, getResult);
}

var getProdMasterResult = function (req, res, data) {
    if (data.code === 1 && data.msg === 'Success') {
        return data;
    }
    else {
        return res.status(401).json({ code: 0, msg: data.msg });
    }
}

const getProductMaster = async (req, res) => {
    req.body.data._id = req.body.data._id ? req.body.data._id : 0;
    req.body.getRecordLimit = 4;
    // { $gt: req.body.data.fromProdTypeId, $lt: req.body.data.upToProdTypeId }
    req.body.collectionName = 'product_master';
    let i = req.body.data.fromProdTypeId + 1;
    let result = new Array();
    //for (i; i < req.body.data.upToProdTypeId; i++) {
    req.body.getCondition = {
        _id: { $gt: req.body.data._id }, CLIENT_MST_ID: req.body.data.CLIENT_MST_ID,
        PRO_TYPE_MST_ID: i
    };
    mongoApi.getRecords(req, res, getResult)
    // result = await (mongoApi.getRecords(req, res, getProdMasterResult));
    // if(i == req.body.data.upToProdTypeId)
    //     return res.status(200).json(result); 
    //}

}

function insertProductMaster(req, res) {
    req.body.collectionName = 'product_master';
    mongoApi.insertOneRecord(req, res, getResult);
}

function updateProductMaster(req, res) {
    req.body.updateCondition = {};
    req.body.collectionName = 'product_master';
    mongoApi.updateRecords(req, res, getResult);
}

function getNewBillNo(req, res) {
    req.body.collectionName = 'product_tran_master';
    mongoApi.getNewBillNo(req, res, getResult);
}

function insertProdTranMaster(req, res) {
    req.body.collectionName = 'product_tran_master';
    mongoApi.insertOneRecord(req, res, getResult);
}

function getProdTranBill(req, res) {
    req.body.getCondition = { CLIENT_MST_ID: req.body.data.CLIENT_MST_ID, ACTIVE_FLAG:'Y'};
    req.body.collectionName = 'product_tran_master';
    mongoApi.getRecords(req, res, getResult);
}

function insertProdTranDetail(req, res) {
    req.body.collectionName = 'product_tran_details';
    mongoApi.insertRecords(req, res, getResult);
}

