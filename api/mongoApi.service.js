'use strict';

//var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
//const router = express.Router();
const mongoDbUrl = "mongodb://192.168.1.193:27017/";
const dbName = 'Products';
var db;

function errorHandler(req, res, errorMsg, mongoClient, callback) {
    db = null;
    if (mongoClient)
        mongoClient.close();
    return callback(req, res, { code: 0, msg: errorMsg });
}

function connectDb(req, res, dbMethod, callback) {
    MongoClient.connect(mongoDbUrl, (err, mongoClient) => {
        if (err) {
            return errorHandler(req, res, "Db Connection Error. " + err.message, mongoClient, callback);
        } else {
            db = mongoClient.db(dbName);
            if (dbMethod.name == 'inserts' || dbMethod.name == 'insertOne')
                getNextSequenceValue(req, res, mongoClient, dbMethod, callback);
            else if (dbMethod.name == 'getNextBillNo') {
                return getNextBillNo(req, res, mongoClient, callback);
            }
            else
                dbMethod(req, res, mongoClient, callback);
        }
    });
}
/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} mongoClient 
 * @param {*} callback 
 */
function getNextBillNo(req, res, mongoClient, callback) {
    db = mongoClient.db(dbName);
    db.collection('userwise_bill_counters').findOneAndUpdate(
        { tran_date: moment(new Date()).format('DD/MMM/YYYY'), CLIENT_MST_ID: req.body.data.CLIENT_MST_ID },
        { $inc: { sequence_value: 1 } },
        {
            sort: { _id: 1 },
            returnOriginal: false,
            upsert: true
        },
        (err, dbres) => {
            if (err) {
                return errorHandler(req, res, "New Bill Generation Error. " + err.message, mongoClient, callback);
            }
            console.log('New Bill No Created.');
            let resultObj = { code: 1, msg: "Success", result: dbres };
            mongoClient.close();
            db = null;
            callback(req, res, resultObj);
        });
}

function getNextSequenceValue(req, res, mongoClient, dbMethod, callback) {
    db = mongoClient.db(dbName);
    var inc_value = 1;
    var insertOneFlag = true;
    if (req.body.data && req.body.data.length && req.body.data.length > 0) {
        inc_value = req.body.data.length;
        insertOneFlag = false;
    }
    db.collection('counters').findOneAndUpdate(
        { _id: req.body.collectionName },
        { $inc: { sequence_value: inc_value } },
        {
            sort: { _id: 1 },
            returnOriginal: false,
            upsert: true
        },
        (err, dbres) => {
            if (err) {
                return errorHandler(req, res, "Sequence Error. " + err.message, mongoClient, callback);
            }
            console.log('sequence incremented.');

            if (insertOneFlag)
                req.body.data._id = dbres.value.sequence_value;
            else {
                let i = inc_value;
                let id = parseInt(dbres.value.sequence_value);
                for (i; i > 0; i--) {
                    req.body.data[i - 1]._id = id;
                    id--;
                }
            }
            dbMethod(req, res, mongoClient, callback);
        });
}

function insertOne(req, res, mongoClient, callback) {
    try {

        let date = new Date();
        let currentTime = moment();
        req.body.data.TRANSACTION_DATE = moment(date).format('DD/MMM/YYYY');
        req.body.data.TRANSACTION_TIME = moment(currentTime).format("hh:mm");
        if (req.body.data._id == -1)
            return errorHandler(req, res, "Sequence Error. " + err.message, callback);

        // if(req.body.collectionName === 'product_tran_master'){
        //     db.collection('userwise_bill_counters').findOneAndUpdate(
        //         { _id: req.body.collectionName, tran_date:req.body.data.TRANSACTION_DATE, CLIENT_MST_ID:req.body.data.CLIENT_MST_ID },
        //         { $inc: { sequence_value: 1 } },
        //         { 
        //             sort:{_id:1},
        //             returnOriginal: false,
        //             upsert: true
        //         },
        //         (err, dbres) => {
        //             if (err) {
        //                 return errorHandler(req, res, "Sequence Error. " + err.message, mongoClient, callback);
        //             }
        //             console.log('sequence incremented.');
        //             req.body.data.bill_number = dbres.value.sequence_value;
        //             dbMethod(req, res, mongoClient, callback);
        //         });
        // }




        db.collection(req.body.collectionName).insertOne(req.body.data, (err, dbres) => {
            let resultObj = {};
            if (err)
                resultObj = { code: 0, msg: err.message };
            else {
                resultObj = { code: 1, msg: "Success", result: dbres };
                console.log("One document inserted.")
            }
            mongoClient.close();
            db = null;
            callback(req, res, resultObj);
        });
    }
    catch (e) {
        return errorHandler(req, res, "insertOne " + err.message, callback);
    }
}

function inserts(req, res, mongoClient, callback) {
    try {

        let date = new Date();
        let currentTime = moment();
        req.body.data.TRANSACTION_DATE = moment(date).format('DD/MMM/YYYY');
        req.body.data.TRANSACTION_TIME = moment(currentTime).format("hh:mm");
        // if (req.body.data._id == -1) {
        //     return errorHandler(req, res, "Sequence Error " + err.message, callback);
        // }
        db.collection(req.body.collectionName).insertMany(req.body.data, (err, dbres) => {
            let resultObj = {};
            if (err)
                resultObj = { code: 0, msg: err.message };
            else {
                resultObj = { code: 1, msg: "Success", result: dbres };
                console.log(dbres.insertedCount + ' documents inserted');
            }
            mongoClient.close();
            db = null;
            return callback(req, res, resultObj);
        });
    }
    catch (e) {
        return errorHandler(req, res, "inserts Error " + e.message, callback);
    }
}

function getData(req, res, mongoClient, callback) {
    try {
        req.body.getRecordLimit = req.body.getRecordLimit ? req.body.getRecordLimit : 100;
        let result = {};
        let getCondition = req.body.getCondition !== undefined ? req.body.getCondition : {};
        let selectField = req.body.selectField !== undefined ? req.body.selectField : {};
        db.collection(req.body.collectionName).find(getCondition, selectField)
            .sort({ _id: 1 }).limit(req.body.getRecordLimit).toArray((err, dbres) => {
                if (err)
                    result = { code: 0, msg: err.message };
                else
                    result = { code: 1, msg: "Success", result: dbres };
                mongoClient.close();
                db = null;
                callback(req, res, result);
            });
    }
    catch (e) {
        return errorHandler(req, res, "getData Error " + e.message, callback);
    }
}

function updateOne(req, res, mongoClient, callback) {
    try {

        let updateCondition = req.body.updateCondition !== undefined ? req.body.updateCondition : {};
        let updateValues = { $set: req.body.updateValues };

        db.collection(req.body.collectionName).updateOne(updateCondition, updateValues, (err, dbres) => {
            let resultObj = {};
            if (err)
                resultObj = { code: 0, msg: err.message };
            else {
                resultObj = { code: 1, msg: "Success", result: dbres };
                console.log('One document updated.');
            }
            mongoClient.close();
            db = null;
            callback(req, res, resultObj);
        });
    }
    catch (e) {
        return errorHandler(req, res, "updateOne Error " + e.message, callback);
    }
}

function updates(req, res, mongoClient, callback) {
    try {

        let updateCondition = req.body.updateCondition !== undefined ? req.body.updateCondition : {};
        let updateValues = { $set: req.body.updateValues };

        let results = db.collection(req.body.collectionName).updateMany(updateCondition, updateValues, (err, dbres) => {
            let resultObj = {};
            if (err)
                resultObj = { code: 0, msg: err.message };
            else {
                resultObj = { code: 1, msg: "Success", result: dbres };
                console.log(dbres.result.nModified + ' documents updated');
            }
            mongoClient.close();
            db = null;
            callback(req, res, resultObj);
        });
    }
    catch (e) {
        return errorHandler(req, res, "updates Error " + e.message, callback);
    }

}

function deleteOne(req, res, mongoClient, callback) {
    try {

        let deleteCondition = req.body.deleteCondition !== undefined ? req.body.deleteCondition : {};
        db.collection(req.body.collectionName).deleteOne(deleteCondition, (err, dbres) => {
            let resultObj = {};
            if (err)
                resultObj = { code: 0, msg: err.message };
            else {
                resultObj = { code: 1, msg: "Success", result: dbres };
                console.log('One document deleted');
            }

            mongoClient.close();
            db = null;
            callback(req, res, resultObj);
        });
    }
    catch (e) {
        return errorHandler(req, res, "deleteOne Error " + e.message, callback);
    }
}

function deletes(req, res, mongoClient, callback) {
    try {

        let deleteCondition = req.body.deleteCondition !== undefined ? req.body.deleteCondition : {};
        db.collection(req.body.collectionName).deleteMany(deleteCondition, (err, dbres) => {
            let resultObj = {};
            if (err)
                resultObj = { code: 0, msg: err.message };
            else {
                resultObj = { code: 1, msg: "Success", result: dbres };
                console.log(dbres.result.n + ' documents deleted');
            }
            mongoClient.close();
            callback(req, res, resultObj);
        });
    }
    catch (e) {
        return errorHandler(req, res, "deletes Error " + e.message, callback);
    }
}

exports.insertOneRecord = function (req, res, callback) {
    connectDb(req, res, insertOne, callback);
}

exports.insertRecords = function (req, res, callback) {
    connectDb(req, res, inserts, callback);
}

exports.getRecords = function (req, res, callback) {
    connectDb(req, res, getData, callback);
}

exports.updateOneRecord = function (req, res, callback) {
    connectDb(req, res, updateOne, callback);
}

exports.updateRecords = function (req, res, callback) {
    connectDb(req, res, updates, callback);
}

exports.deleteOneRecord = function (req, res, callback) {
    connectDb(req, res, deleteOne, callback);
}

exports.deleteRecords = function (req, res, callback) {
    connectDb(req, res, deletes, callback);
}

exports.getNewBillNo = function (req, res, callback) {
    connectDb(req, res, getNextBillNo, callback);
}





