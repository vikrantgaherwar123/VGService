'use strict';

var request = require('request');
var express = require('express');
var api = require('./api.service');
var oracledb = require('oracledb');
var net = require("net");
var ab2str = require('arraybuffer-to-string')
var config = require('../config/environment');

var error = {};


//----------------------Post Start --------------------------
exports.Posts = function (req, res) {
    var param = req.body.opkeyword; // methodName
    switch (param) {
        case 'MIS_INSERT': MIS_INSERT(req, res); break;
        case 'ADMINL': ADMIN_LOGIN(req, res); break;
        case 'MIS_DASHBOARD_RPT' : MIS_DASHBOARD_RPT(req, res);break;
        case 'MIS_TESTPROC' : MIS_TESTPROC(req, res);break;
        case 'CLIENTMAS' : CLIENT_MASTER(req, res);break; //sujit
        case 'UPDADRGHT' : ADMIN_MENU_RIGHT_UPD(req, res);break; //mis dashboard 2 cursors
        case 'LEVELRIGHTMASTER' : ADMIN_LEVEL_MASTER(req, res);break;//sujit
        case 'ADMINM' : ADMIN_MASTER(req, res);break; //sujit
        case 'ADMIN_MENU' : ADMIN_MENU_RIGHTS_MASTER(req, res);break; //vikrant
        case 'ADMINFL' : ADMIN_FIRST_LOGIN(req, res);break;
        case 'ADMINCU' : ADMIN_CHECK_USER(req, res);break;
        case 'ADMINCP' : ADMIN_CHANGE_PASS(req, res);break;
        case 'ADMINSO' : ADMIN_SEND_OTP(req, res);break;
        case 'RPTMAST' : DASHBOARD_RPT_MASTER(req, res);break;
        case 'PARAMETERM' : PARAMETER_MASTER(req, res);break;


        case 'ADMINFOP' : ADMIN_FORGET_PASS(req, res);break;
        case 'MENURGHTMST' : MENU_RIGHT_MASTER(req, res);break;
        case 'MENU_MASTER' : MENU_MASTER(req, res);break;
        case 'USER_LEVEL' : ADMIN_LEVEL_USER(req, res);break;


        default:
        break;
    }
};

//Package MIS_LOGIN

function ADMIN_LOGIN(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };
    var plsql = "BEGIN Pkg_Mis_Login.Pr_Admin_Login ("
        + ":Pi_Login_User_Id,"
        + ":Pi_Password,"
        + ":Pi_Login_From,"
        + ":Po_Error,"
        + ":Po_Cursor1,"
        + ":Po_Cursor2"
        + "); End;";

    var bindvars = {
        Pi_Login_User_Id: req.body.Login_User_Id,
        Pi_Password: req.body.Password,
        Pi_Login_From: req.body.Login_From,
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Cursor1:  { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },
        Po_Cursor2:  { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },
    };
    api.GetLoginForMIS(plsql,bindvars,getData);
};

function ADMIN_FIRST_LOGIN(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };
    var plsql = "BEGIN Pkg_Mis_Login.Pr_Admin_First_Login ("
        + ":Pi_Login_User_Id,"
        + ":Pi_Login_Pass,"
        + ":Po_Success,"
        + ":Po_Error"
        + "); End;";

    var bindvars = {
        Pi_Login_User_Id: req.body.Login_User_Id,
        Pi_Login_Pass: req.body.Login_Pass,
        Po_Success:  { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
    };
    api.GetFirstLoginForMIS(plsql,bindvars,getData);
};

function ADMIN_CHECK_USER(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };
    var plsql = "BEGIN Pkg_Mis_Login.Pr_Admin_Check_User ("
        + ":Pi_Login_User_Id,"
        + ":Po_Success,"
        + ":Po_Error,"
        + ":Po_Cursor"
        + "); End;";

    var bindvars = {
        Pi_Login_User_Id: req.body.Login_User_Id,
        Po_Success:  { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },
    };
    api.GetLogin_Check_UserForMIS(plsql,bindvars,getData);
};

function ADMIN_CHANGE_PASS(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };
    var plsql = "BEGIN Pkg_Mis_Login.Pr_Admin_Change_Pass ("
        + ":Pi_Login_User_Id,"
        + ":Pi_Otp,"
        + ":Pi_Old_Password,"
        + ":Pi_Old_Conf_Pass,"
        + ":Pi_New_Password,"
        + ":Pi_New_Slt_Pass,"
        + ":Pi_New_Conf_Pass,"
        + ":Pi_New_Slt_Conf_Pass,"
        + ":Pi_Flag,"
        + ":Po_Success,"
        + ":Po_Error"
        + "); End;";

    var bindvars = {
        Pi_Login_User_Id: req.body.Login_User_Id,
        Pi_Otp: req.body.Otp,
        Pi_Old_Password: req.body.Old_Password,
        Pi_Old_Conf_Pass: req.body.Old_Conf_Pass,
        Pi_New_Password: req.body.New_Password,
        Pi_New_Slt_Pass: req.body.New_Slt_Pass,
        Pi_New_Conf_Pass: req.body.New_Conf_Pass,
        Pi_New_Slt_Conf_Pass: req.body.New_Slt_Conf_Pass,
        Pi_Flag: req.body.Flag,
        Po_Success:  { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
    };
    api.GetADMIN_Changed_Pass(plsql,bindvars,getData);
};

function ADMIN_FORGET_PASS(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };
    var plsql = "BEGIN Pkg_Mis_Login.Pr_Admin_Forpass ("
        + ":Pi_Login_User_Id,"
        + ":Pi_Otp,"
        + ":Pi_New_Password,"
        + ":Pi_Slt_Password,"
        + ":Pi_Conf_Password,"
        + ":Pi_Slt_Conf_Pass,"
        + ":Pi_Flag,"
        + ":Po_Success,"
        + ":Po_Error"
        + "); End;";

    var bindvars = {
        Pi_Login_User_Id: req.body.Login_User_Id,
        Pi_Otp: req.body.Otp,
        Pi_New_Password: req.body.New_Password,
        Pi_Slt_Password: req.body.Slt_Password,
        Pi_Conf_Password: req.body.Conf_Password,
        Pi_Slt_Conf_Pass: req.body.Slt_Conf_Pass,
        Pi_Flag: req.body.Flag,
        Po_Success:  { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
    };
    api.GetADMIN_Forget_Pass(plsql,bindvars,getData);
};

function ADMIN_SEND_OTP(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };
    var plsql = "BEGIN Pkg_Mis_Login.Pr_Admin_Send_Otp ("
        + ":Pi_Login_User_Id,"
        + ":Pi_Flag,"
        + ":Po_Success,"
        + ":Po_Error"
        + "); End;";

    var bindvars = {
        Pi_Login_User_Id: req.body.Login_User_Id,
        Pi_Flag: req.body.Flag,
        Po_Success: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
    };
    api.GetADMIN_OTP(plsql,bindvars,getData);
};

function MENU_RIGHT_MASTER(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };

    var plsql = "BEGIN Pkg_Mis_Login.Pr_Menu_Right_Master ("
        + ":Pi_Login_User_Id,"
        + ":Pi_Req_From,"
        + ":Pi_ParentMenuID,"
        + ":Pi_Pref_Flag,"
        + ":Po_Error,"
        + ":Po_Success,"
        + ":Po_Cursor"
        + "); End;";

    var bindvars = {
        Pi_Login_User_Id: req.body.Login_User_Id,
        Pi_Req_From: req.body.Req_From,
        Pi_ParentMenuID: req.body.ParentMenuID,
        Pi_Pref_Flag: req.body.Pref_Flag,
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Success: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },
    };
    api.GetRefCursorMENU_RIGHT_MASTER(plsql, bindvars, getData);
}

function ADMIN_LEVEL_USER(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };

    var plsql = "BEGIN Pkg_Mis_Login.Pr_Admin_Level_User ("
        + ":Pi_Level_Mst_ID,"
        + ":Po_Success,"
        + ":Po_Error,"
        + ":Po_Cursor"
        + "); End;";

    var bindvars = {
        Pi_Level_Mst_ID: req.body.Level_Mst_ID,
        Po_Success: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },

    };
    api.GetRefCursorUSER_LEVEL(plsql, bindvars, getData);
}

//package MIS_MASTER
function DASHBOARD_RPT_MASTER(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };
    var plsql = "BEGIN Pkg_MIS_Master.Pr_Dashboard_RPT_Master ("
        + ":Pio_Dash_Rpt_ID,"
        + ":Pi_RPT_Flag,"
        + ":Pi_Object_Name,"
        + ":Pi_NoOfPara,"
        + ":Pi_Description,"
        + ":Pi_KeyWord,"
        + ":Pi_Execute_On,"
        + ":Pi_Execute_Freq,"
        + ":Pi_Type_Flag,"
        + ":Pi_Parameter_Name,"
        + ":Pi_Para_Sequence,"
        + ":Pi_Paratype,"
        + ":Pi_ParaDataType,"
        + ":Pi_Gen_Sync_Flag,"
        + ":Pi_Flag,"
        + ":Pi_Enter_User_ID,"
        + ":Po_Response,"
        + ":Po_Error"
        + "); End;";

    var bindvars = {
        Pio_Dash_Rpt_ID: { val:req.body.Dash_Rpt_ID,dir: oracledb.BIND_INOUT, type: oracledb.NUMBER, maxSize: 5000 },
        Pi_RPT_Flag: req.body.RPT_Flag,
        Pi_Object_Name: req.body.Object_Name,
        Pi_NoOfPara: req.body.NoOfPara,
        Pi_Description: req.body.Description,
        Pi_KeyWord: req.body.KeyWord,
        Pi_Execute_On: req.body.Execute_On,
        Pi_Execute_Freq: req.body.Execute_Freq,
        Pi_Type_Flag: req.body.Type_Flag,
        Pi_Parameter_Name: req.body.Parameter_Name,
        Pi_Para_Sequence: req.body.Para_Sequence,
        Pi_Paratype: req.body.Paratype,
        Pi_ParaDataType: req.body.ParaDataType,
        Pi_Gen_Sync_Flag: req.body.Gen_Sync_Flag,
        Pi_Flag: req.body.Flag,
        Pi_Enter_User_ID: req.body.Enter_User_ID,
        Po_Response: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
    };
    api.GetADMIN_OTP(plsql,bindvars,getData);
};

function CLIENT_MASTER(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };

    var plsql = "BEGIN Pkg_MIS_Master.Pr_Client_Master ("
        + ":Pio_Client_Mst_ID,"
        + ":Pi_Client_Name,"
        + ":Pi_Client_Oth_Name,"
        + ":Pi_Client_Add,"
        + ":Pi_Client_Oth_Add,"
        + ":Pi_Client_Short_Name,"
        + ":Pi_Flag,"
        + ":Pi_Enter_User_ID,"
        + ":Pi_Client_Logo,"
        + ":Po_Response,"
        + ":Po_Cursor,"
        + ":Po_Error"
        + "); End;";

    var bindvars = {
        Pio_Client_Mst_ID: { val:req.body.Client_Mst_ID,dir: oracledb.BIND_INOUT, type: oracledb.NUMBER, maxSize: 5000 },
        Pi_Client_Name: req.body.Client_Name,
        Pi_Client_Oth_Name: req.body.Client_Oth_Name,
        Pi_Client_Add:req.body.Client_Add,
        Pi_Client_Oth_Add: req.body.Client_Oth_Add,
        Pi_Client_Short_Name: req.body.Client_Short_Name,
        Pi_Flag: req.body.Flag,
        Pi_Client_Logo: req.body.Client_Logo,
        Pi_Enter_User_ID: req.body.Enter_User_ID,
        Po_Response: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },

    };
    api.GetRefCursorCLIENT_MASTER(plsql, bindvars, getData);
}

function ADMIN_LEVEL_MASTER(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };

    var plsql = "BEGIN Pkg_MIS_Master.Pr_Admin_Level_Master ("
        + ":Pi_User_Level_Mst_Id,"
        + ":Pi_User_Level_Desc,"
        + ":Pi_User_Level_Short_Desc,"
        + ":Pi_Super_Level_Flag,"
        + ":Pi_Pw_Change_Freqency,"
        + ":Pi_Auth_Flag,"
        + ":Pi_Enter_User_Id,"
        + ":Pi_Enter_Desc,"
        + ":Pi_Opflag,"
        + ":Po_Error,"
        + ":Po_Cursor,"
        + ":Po_Response"
        + "); End;";

    var bindvars = {
        Pi_User_Level_Mst_Id: req.body.User_Level_Mst_Id,
        Pi_User_Level_Desc: req.body.User_Level_Desc,
        Pi_User_Level_Short_Desc: req.body.User_Level_Short_Desc,
        Pi_Super_Level_Flag: req.body.Super_Level_Flag,
        Pi_Pw_Change_Freqency: req.body.Pw_Change_Freqency,
        Pi_Auth_Flag: req.body.Auth_Flag,
        Pi_Enter_User_Id: req.body.Enter_User_Id,
        Pi_Enter_Desc: req.body.Enter_Desc,
        Pi_Opflag: req.body.Opflag,
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },
        Po_Response: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },

    };
    api.GetRefCursorADMIN_LEVEL_MASTER(plsql, bindvars, getData);
}

function ADMIN_MASTER(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };

    var adminPhoto = null;
    if (req.body.Admin_Photo != undefined && req.body.Admin_Photo != '') {
        var BASE64_MARKER = ';base64,';
        var base64Index = req.body.Admin_Photo.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
        var base64 = req.body.Admin_Photo.substring(base64Index);
        var buf = new Buffer(base64, "base64");
        adminPhoto = Buffer.from(buf);
    }

    var plsql = "BEGIN Pkg_MIS_Master.Pr_Admin_Master ("
        + ":Pi_Admin_Mst_Id,"
        + ":Pi_Userid,"
        + ":Pi_User_Name,"
        + ":Pi_User_Level_Mst_Id,"
        + ":Pi_Login_Password,"
        + ":Pi_Tran_Password,"
        + ":Pi_Slt_Login_Password,"
        + ":Pi_Slt_Tran_Password,"
        + ":Pi_First_Time_Login,"
        + ":Pi_No_Of_Attempts,"
        + ":Pi_Creation_Date,"
        + ":Pi_Expiry_Date,"
        + ":Pi_Mobile_Number,"
        + ":Pi_Email_Id,"
        + ":Pi_Aadhar_Number,"
        + ":Pi_Status,"
        + ":Pi_Status_Date,"
        + ":Pi_Enter_User_Id,"
        + ":Pi_Enter_Desc,"
        + ":Pi_Admin_Photo,"
        + ":Pi_Opflag,"
        + ":Po_Error,"
        + ":Po_Cursor,"
        + ":Po_Response"
        + "); End;";

    var bindvars = {
        Pi_Admin_Mst_Id: req.body.Admin_Mst_Id,
        Pi_Userid: req.body.Userid,
        Pi_User_Name: req.body.User_Name,
        Pi_User_Level_Mst_Id: req.body.User_Level_Mst_Id,
        Pi_Login_Password: req.body.Login_Password,
        Pi_Tran_Password: req.body.Tran_Password,
        Pi_Slt_Login_Password: req.body.Slt_Login_Password,
        Pi_Slt_Tran_Password: req.body.Slt_Tran_Password,
        Pi_First_Time_Login: req.body.First_Time_Login,
        Pi_No_Of_Attempts: req.body.No_Of_Attempts,
        Pi_Creation_Date: req.body.Creation_Date,
        Pi_Expiry_Date: req.body.Expiry_Date,
        Pi_Mobile_Number: req.body.Mobile_Number,
        Pi_Email_Id: req.body.Email_Id,
        Pi_Aadhar_Number: req.body.Aadhar_Number,
        Pi_Status: req.body.Status,
        Pi_Status_Date: req.body.Status_Date,
        Pi_Enter_User_Id: req.body.Enter_User_Id,
        Pi_Enter_Desc: req.body.Enter_Desc,
        Pi_Admin_Photo: { dir: oracledb.BIND_IN, type: oracledb.BUFFER, val: adminPhoto },
        Pi_Opflag: req.body.Opflag,
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },
        Po_Response: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },

    };
    api.GetRefCursorADMIN_MASTER(plsql, bindvars, getData);
}

function ADMIN_MENU_RIGHTS_MASTER(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };

    var plsql = "BEGIN Pkg_MIS_Master.Pr_Admin_Menu_Rights_Master ("
        + ":Pi_User_Menu_Mstid,"
        + ":Pi_Userid,"
        + ":Pi_Menu_Mst_Id,"
        + ":Pi_Parameters,"
        + ":Pi_Selected_Flag,"
        + ":Pi_Enter_User_Id,"
        + ":Pi_Enter_Desc,"
        + ":Pi_Opflag,"
        + ":Po_Error,"
        + ":Po_Cursor,"
        + ":Po_Response"
        + "); End;";

    var bindvars = {
        Pi_User_Menu_Mstid: req.body.User_Menu_Mstid,
        Pi_Userid: req.body.Userid,
        Pi_Menu_Mst_Id: req.body.Menu_Mst_Id,
        Pi_Parameters: req.body.Parameters,
        Pi_Selected_Flag: req.body.Selected_Flag,
        Pi_Enter_User_Id: req.body.Enter_User_Id,
        Pi_Enter_Desc: req.body.Enter_Desc,
        Pi_Opflag: req.body.Opflag,
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },
        Po_Response: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },

    };
    api.GetRefCursorADMIN_MENU_RIGHTS_MASTER(plsql, bindvars, getData);
}

function MENU_MASTER(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };

    var plsql = "BEGIN Pkg_MIS_Master.Pr_Menu_Master ("
        + ":Pi_Menu_Mst_Id,"
        + ":Pi_Caption_Name,"
        + ":Pi_Parent_Menu_Mst_Id,"
        + ":Pi_Position,"
        + ":Pi_Page_Name,"
        + ":Pi_Parameters,"
        + ":Pi_Visible_Flag,"
        + ":Pi_Caption_Name_Ol,"
        + ":Pi_Menu_Desc,"
        + ":Pi_Menu_Desc_Ol,"
        + ":Pi_Hot_Key,"
        + ":Pi_Menu_Type,"
        + ":Pi_Menu_History_Flag,"
        + ":Pi_Remarks,"
        + ":Pi_Password_Required,"
        + ":Pi_Enter_User_Id,"
        + ":Pi_Enter_Desc,"
        + ":Pi_Help_Page_Name,"
        + ":Pi_User_Level_Mst_Id,"
        + ":Pi_Opflag,"
        + ":Po_Error,"
        + ":Po_Cursor,"
        + ":Po_Response"
        + "); End;";

    var bindvars = {
        Pi_Menu_Mst_Id: req.body.Menu_Mst_Id,
        Pi_Caption_Name: req.body.Caption_Name,
        Pi_Parent_Menu_Mst_Id: req.body.Parent_Menu_Mst_Id,
        Pi_Position: req.body.Position,
        Pi_Page_Name: req.body.Page_Name,
        Pi_Parameters: req.body.Parameters,
        Pi_Visible_Flag: req.body.Visible_Flag,
        Pi_Caption_Name_Ol: req.body.Caption_Name_Ol,
        Pi_Menu_Desc: req.body.Menu_Desc,
        Pi_Menu_Desc_Ol: req.body.Menu_Desc_Ol,
        Pi_Hot_Key: req.body.Hot_Key,
        Pi_Menu_Type: req.body.Menu_Type,
        Pi_Menu_History_Flag: req.body.Menu_History_Flag,
        Pi_Remarks: req.body.Remarks,
        Pi_Password_Required: req.body.Password_Required,
        Pi_Enter_User_Id: req.body.Enter_User_Id,
        Pi_Enter_Desc: req.body.Enter_Desc,
        Pi_Help_Page_Name: req.body.Help_Page_Name,
        Pi_User_Level_Mst_Id: req.body.User_Level_Mst_Id,
        Pi_Opflag: req.body.Opflag,
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },
        Po_Response: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },

    };
    api.GetRefCursorMENU_MASTER(plsql, bindvars, getData);
}

function PARAMETER_MASTER(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };

    var plsql = "BEGIN Pkg_MIS_Master.Pr_Parameter_Master ("
        + ":Pi_Parameter_Id,"
        + ":Pi_Parameter_Description,"
        + ":Pi_Parameter_Value,"
        + ":Pi_Parameter_Sub_Value,"
        + ":Pi_Status_Flag,"
        + ":Pi_Status_Date,"
        + ":Pi_Enter_User_Id,"
        + ":Pi_Enter_Desc,"
        + ":Pi_Modify_Allow_Flag,"
        + ":Pi_Opflag,"
        + ":Po_Error,"
        + ":Po_Cursor,"
        + ":Po_Success"
        + "); End;";

    var bindvars = {
        Pi_Parameter_Id: req.body.Parameter_Id,
        Pi_Parameter_Description: req.body.Parameter_Description,
        Pi_Parameter_Value: req.body.Parameter_Value,
        Pi_Parameter_Sub_Value: req.body.Parameter_Sub_Value,
        Pi_Status_Flag: req.body.Status_Flag,
        Pi_Status_Date: req.body.Status_Date,
        Pi_Enter_User_Id: req.body.Enter_User_Id,
        Pi_Enter_Desc: req.body.Enter_Desc,
        Pi_Modify_Allow_Flag: req.body.Modify_Allow_Flag,
        Pi_Opflag: req.body.Opflag,
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },
        Po_Success: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
    };
    api.GetRefCursorPARAMETER_MASTER(plsql, bindvars, getData);
}


//SINGLE PRCEDURES
function MIS_INSERT(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };
    var plsql = "BEGIN Pr_MIS_Insert ("
        + ":Pi_Report_Id,"
        + ":Pi_Record,"
        + ":Pi_Client_Mst_ID,"
        + ":Pi_Report_Date,"
        + ":Pi_Delete_Flag,"
        + ":Po_Responce,"
        + ":Po_Error"
        + "); End;";

    var bindvars = {
        Pi_Report_Id: req.body.Report_Id,
        Pi_Record: req.body.Record,
        Pi_Client_Mst_ID: req.body.Client_Mst_ID,
        Pi_Report_Date: req.body.Report_Date,
        Pi_Delete_Flag: req.body.Delete_Flag,
        Po_Responce:  { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },

    };
    api.GetRefCursorMIS_INSERT(plsql, bindvars, getData);

};

function MIS_DASHBOARD_RPT(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };

    var plsql = "BEGIN Pr_Mis_Dashboard_RPT ("
        + ":Pi_Client_Mst_ID,"
        + ":Pi_NoOfPara,"
        + ":Pi_Report_ID,"
        + ":Pi_Report_Date,"
        + ":Pi_ParaValue,"
        + ":Pi_ParaType,"
        + ":Pi_InOutType,"
        + ":Po_Cursor,"
        + ":Po_Error"
        + "); End;";

    var bindvars = {
        Pi_Client_Mst_ID: req.body.Client_Mst_ID,
        Pi_NoOfPara: req.body.NoOfPara,
        Pi_Report_ID: req.body.Report_ID,
        Pi_Report_Date: null,//req.body.Report_Date,
        Pi_ParaValue: req.body.ParaValue,
        Pi_ParaType: req.body.ParaType,
        Pi_InOutType: req.body.InOutType,
        Po_Cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },

    };
    api.GetRefCursorMIS_DASHBOARD_RPT(plsql, bindvars, getData);
}

function MIS_TESTPROC(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };

    var plsql = "BEGIN Pr_Mis_TestProc ("
        + ":Pi_Client_MSt_id,"
        + ":Pi_Region,"
        + ":Pi_Branch_Mst,"
        + ":Pi_ALnx_type,"
        + ":Po_Cursor,"
        + ":Po_Error,"
        + "); End;";

    var bindvars = {
        Pi_Client_Mst_ID: req.body.Client_Mst_ID,
        Pi_Region: req.body.Region,
        Pi_Branch_Mst: req.body.Branch_Mst,
        Pi_ALnx_type: req.body.ALnx_type,//req.body.Report_Date,
        Po_Cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR, maxSize: 5000 },
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
    };
    api.GetRefCursorMIS_DASHBOARD_RPT(plsql, bindvars, getData);
}

function ADMIN_MENU_RIGHT_UPD(req, res) {
    var getData = function (data) {
        if (data.code === 1) {
            res.status(200).json(data);
        }
        else {
            error = { code: 0, msg: data.msg };
            return res.status(401).json(error);
        }
    };

    var plsql = "BEGIN Pr_Admin_Menu_Right_UPD ("
        + ":Pi_Login_User_ID,"
        + ":Pi_Menu_MSTID,"
        + ":Pi_Pref_Sequence,"
        + ":Po_Error"
        + "); End;";

    var bindvars = {
        Pi_Login_User_ID: req.body.Client_Mst_ID,
        Pi_Menu_MSTID: req.body.Region,
        Pi_Pref_Sequence: req.body.Branch_Mst,
        Po_Error: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 5000 },
    };
    api.GetRefCursorADMIN_MENU_RIGHT_UPD(plsql, bindvars, getData);
}



















