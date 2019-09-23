"use strict";
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var oracledb = require("oracledb");
var numRows = 100;
var result = "";

oracledb.outFormat = oracledb.OBJECT;
//oracledb.fetchAsBuffer = [oracledb.BLOB];
var cursor = {};
var cursorCount = 0;
var config = require("../config/environment");

/**
 * Handle Errors of this file methods
 * @param {*} key
 * @param {*} err
 * @param {*} connection
 */
var errorHandle = function (key, err, connection, oparam) {
  let code = 0;
  let message = "";
  let statusKey = key;
  switch (key) {
    case "RNF": //Record not found
      code = 1;
      message = "Record not found.";
      break;
    case "MSG": //Record not found
      code = 1;
      if (err.message == 'ORA-01426: numeric overflow') {
        err.message = 'Please Try Again.';
      }
      message = err.message;
      break;

    case "ER": //logic or database error
      code = 0;
      if (err.message == 'ORA-01426: numeric overflow') {
        err.message = 'Please Try Again.';
      }
      message = err.message;
      break;

    default:
      break;
  }
  console.log(message);
  doRelease(connection);
  return {
    code: code,
    msg: message,
    status: statusKey,

  };
};

exports.GetLoginForMIS = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success ? result.outBinds.Po_Success.trim() : undefined },
            )
          );
          return;
        }

        // if (result.outBinds.Po_Cursor == null) {
        //   //doRelease(connection);
        //   next(errorHandle("RNF", err, connection));
        //   return;
        // }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor1.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor2 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor2 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor2.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor3 !== undefined) {
                  if (result.outBinds.Po_Cursor3 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor3.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetFirstLoginForMIS = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null  &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next({
            code: 1,
            msg: result.outBinds.Po_Error,
            Po_Success: result.outBinds.Po_Success
          });
          return
        }

        if (result.outBinds.Po_Cursor == null) {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetLogin_Check_UserForMIS = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success ? result.outBinds.Po_Success.trim() : undefined },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null) {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetADMIN_OTP = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success ? result.outBinds.Po_Success.trim() : undefined },
            )
          );
          return;
        }

        
        if (result.outBinds.Po_Success == 'Y') {
          //doRelease(connection);
          next({
            code: 1,
            msg: "Success",
            Po_Success: result.outBinds.Po_Success});
          return;
        }

        if (result.outBinds.Po_Cursor == null) {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetADMIN_Forget_Pass = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success ? result.outBinds.Po_Success.trim() : undefined },
            )
          );
          return;
        }

        
        if (result.outBinds.Po_Success == 'Y') {
          //doRelease(connection);
          next({
            code: 1,
            msg: "Success",
            Po_Success: result.outBinds.Po_Success});
          return;
        }

        if (result.outBinds.Po_Cursor == null) {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetADMIN_Changed_Pass = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success ? result.outBinds.Po_Success.trim() : undefined },
            )
          );
          return;
        }

        
        if (result.outBinds.Po_Success == 'Y') {
          //doRelease(connection);
          next({
            code: 1,
            msg: "Success",
            Po_Success: result.outBinds.Po_Success});
          return;
        }

        if (result.outBinds.Po_Cursor == null) {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetRefCursorMIS_INSERT = function (plsql, bindvars, next) {
  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success ? result.outBinds.Po_Success.trim() : undefined },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null && result.outBinds.Po_Response != "Y") {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }else if(result.outBinds.Po_Response == "Y" && result.outBinds.Po_Cursor == null){
          try {
            next({
              code: 1,
              msg: "Success",
              Po_Success: result.outBinds.Po_Response
            });
          } catch (er) {
          } finally {
            doRelease(connection);
          }
          return
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetRefCursorMIS_DASHBOARD_RPT = function (plsql, bindvars, next) {
  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success.trim() },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null && result.outBinds.Po_Response != "Y") {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }else if(result.outBinds.Po_Response == "Y" && result.outBinds.Po_Cursor == null){
          try {
            next({
              code: 1,
              msg: "Success",
              Po_Success: result.outBinds.Po_Response
            });
          } catch (er) {
          } finally {
            doRelease(connection);
          }
          return
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetRefCursorCLIENT_MASTER = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null && result.outBinds.Po_Success &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null && result.outBinds.Po_Response != "Y") {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }else if(result.outBinds.Po_Response == "Y" && result.outBinds.Po_Cursor == null){
          try {
            next({
              code: 1,
              msg: "Success",
              Po_Success: result.outBinds.Po_Response
            });
          } catch (er) {
          } finally {
            doRelease(connection);
          }
          return
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetRefCursorADMIN_MENU_RIGHT_UPD = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success.trim() },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null) {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetRefCursorADMIN_LEVEL_MASTER = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success ? result.outBinds.Po_Success.trim() : undefined },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null && result.outBinds.Po_Response != "Y") {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }else if(result.outBinds.Po_Response == "Y" && result.outBinds.Po_Cursor == null){
          try {
            next({
              code: 1,
              msg: "Success",
              Po_Success: result.outBinds.Po_Response
            });
          } catch (er) {
          } finally {
            doRelease(connection);
          }
          return
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetRefCursorMENU_RIGHT_MASTER = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success.trim() },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null && result.outBinds.Po_Response != "Y") {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }else if(result.outBinds.Po_Response == "Y" && result.outBinds.Po_Cursor == null){
          try {
            next({
              code: 1,
              msg: "Success",
              Po_Success: result.outBinds.Po_Response
            });
          } catch (er) {
          } finally {
            doRelease(connection);
          }
          return
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetRefCursorADMIN_MASTER = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success.trim() },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null && result.outBinds.Po_Response != "Y") {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }else if(result.outBinds.Po_Response == "Y" && result.outBinds.Po_Cursor == null){
          try {
            next({
              code: 1,
              msg: "Success",
              Po_Success: result.outBinds.Po_Response
            });
          } catch (er) {
          } finally {
            doRelease(connection);
          }
          return
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetRefCursorADMIN_MENU_RIGHTS_MASTER = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success ? result.outBinds.Po_Success.trim() : undefined },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null && result.outBinds.Po_Response != "Y") {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }else if(result.outBinds.Po_Response == "Y" && result.outBinds.Po_Cursor == null){
            next({
              code: 1,
              msg: "Success",
              Po_Success: result.outBinds.Po_Response
            });
          return
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetRefCursorMENU_MASTER = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success ? result.outBinds.Po_Success.trim() : undefined },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null && result.outBinds.Po_Response != "Y") {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }else if( result.outBinds.Po_Response == "Y" && result.outBinds.Po_Cursor == null){
          try {
            next({
              code: 1,
              msg: "Success",
              Po_Success: result.outBinds.Po_Success
            });
            return
          } catch (er) {
          } finally {
            doRelease(connection);
          }
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetRefCursorUSER_LEVEL = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success ? result.outBinds.Po_Success.trim() : undefined },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null && result.outBinds.Po_Response != "Y") {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }else if(result.outBinds.Po_Response == "Y" && result.outBinds.Po_Cursor == null){
          try {
            next({
              code: 1,
              msg: "Success",
              Po_Success: result.outBinds.Po_Response
            });
          } catch (er) {
          } finally {
            doRelease(connection);
          }
          return
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};

exports.GetRefCursorPARAMETER_MASTER = function (plsql,bindvars, next) {

  oracledb.getConnection(config.MISconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success ? result.outBinds.Po_Success.trim() : undefined },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null && result.outBinds.Po_Success != "Y") {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }else if( result.outBinds.Po_Success == "Y" && result.outBinds.Po_Cursor == null){
          try {
            next({
              code: 1,
              msg: "Success",
              Po_Success: result.outBinds.Po_Success
            });
            return
          } catch (er) {
          } finally {
            doRelease(connection);
          }
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};



















































































exports.GetRefCursorCBS = function (plsql, bindvars, next) {
  oracledb.getConnection(config.CBSconnectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    //for getting image data as buffer in cursor.
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    connection.execute(plsql, bindvars,
      { autoCommit: true, fetchAsBuffer: oracledb.BLOB },//autoCommit is default false.
      function (err, result) {
        if (err) {
          //error from service, not from database
          console.log(err.message);

          next(errorHandle("ER", err, connection));
          return;
        }
        if (result.outBinds.Po_Error !== undefined &&
          result.outBinds.Po_Error !== null &&
          result.outBinds.Po_Error.trim().length > 0
        ) {
          next(
            errorHandle(
              "MSG",
              { message: result.outBinds.Po_Error.trim() },
              connection,
              { Po_Success: result.outBinds.Po_Success.trim() },
            )
          );
          return;
        }

        if (result.outBinds.Po_Cursor == null) {
          //doRelease(connection);
          next(errorHandle("RNF", err, connection));
          return;
        }

        let i = 0;
        let queryStream = new Array(6);
        let poCurArray = new Array(6);
        let rows = [];
        let rows1 = [];
        let rows2 = [];
        queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
        var lob = null;
        var buf = [];
        queryStream[0].on("data", function (row) {
          rows.push(row);
        });
        queryStream[0].on("end", function () {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            poCurArray[0] = rows;
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2],
                          Po_Success: result.outBinds.Po_Success
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    if (result.outBinds["po_approvalflag"]) {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        po_approvalflag: result.outBinds["po_approvalflag"]
                        // 'outBinds':result.outBinds
                      });
                    } else {
                      next({
                        code: 1,
                        msg: "Success",
                        cursor1: poCurArray[0],
                        cursor2: poCurArray[1],
                        Po_Success: result.outBinds.Po_Success
                      });
                    }
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {

                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0],
                  Po_Success: result.outBinds.Po_Success
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              poCurArray[0] = rows;
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0],
                Po_Success: result.outBinds.Po_Success
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }

          queryStream[0].on("error", function (err) {
            errorHandle("ER", err, connection);
          });
        });
      });
  });
};



exports.GetMultipleRefCursorWithLob = function (plsql, bindvars, next) {
  oracledb.getConnection(config.connectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      next(errorHandle("ER", err, connection));
      return;
    }
    connection.execute(plsql, bindvars, { autoCommit: true }, function (
      err,
      result
    ) {
      if (err) {
        console.log(err.message);

        next(errorHandle("ER", err, connection));
        return;
      }
      if (
        result.outBinds.Po_Error !== undefined &&
        result.outBinds.Po_Error !== null &&
        result.outBinds.Po_Error.trim().length > 0
      ) {
        next(
          errorHandle(
            "MSG",
            { message: result.outBinds.Po_Error.trim() },
            connection
          )
        );
        return;
      }

      if (result.outBinds.Po_Cursor == null) {
        next(errorHandle("RNF", err, connection));
        return;
      }

      // let queryStream = new Array(1);
      // let poCurArray = new Array(1);
      // let rows = [];
      let i = 0;
      let queryStream = new Array(6);
      let poCurArray = new Array(6);
      let rows = [];
      let rows1 = [];
      let rows2 = [];
      queryStream[0] = result.outBinds.Po_Cursor.toQueryStream();
      var lob = null;
      var buf = [];
      queryStream[0].on("data", function (row) {
        rows.push(row);
        lob = row.CLIENT_PHOTO;
        if (lob) {
          lob.on("data", function (chunk) {
            buf.push(chunk);
          });

          lob.on("error", function (err) {
            console.log("lob.on 'error' event");
            console.error(err.message);
          });
        }
      });
      queryStream[0].on("end", function () {
        poCurArray[0] = rows;
        if (lob) {
          lob.on("end", function () {
            poCurArray[0][0].CLIENT_PHOTO = Buffer.concat(buf).toString(
              "base64"
            );
            if (result.outBinds.Po_Cursor1 !== undefined) {
              if (result.outBinds.Po_Cursor1 !== null) {
                queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
                queryStream[1].on("data", function (row) {
                  poCurArray[1] = row;
                });
                queryStream[1].on("error", function (err) {
                  errorHandle("ER", err, connection);
                });
                queryStream[1].on("end", function () {
                  try {
                    next({
                      code: 1,
                      msg: "Success",
                      cursor1: poCurArray[0],
                      cursor2: poCurArray[1]
                    });
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                });
              } else {
                try {
                  next({
                    code: 1,
                    msg: "Success",
                    cursor1: poCurArray[0],
                    cursor2: null
                  });
                } catch (er) {
                } finally {
                  doRelease(connection);
                }
              }
            } else {
              try {
                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0]
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          });
        } else {
          if (result.outBinds.Po_Cursor1 !== undefined) {
            if (result.outBinds.Po_Cursor1 !== null) {
              queryStream[1] = result.outBinds.Po_Cursor1.toQueryStream();
              queryStream[1].on("data", function (row) {
                rows1.push(row);
              });
              queryStream[1].on("error", function (err) {
                errorHandle("ER", err, connection);
              });
              queryStream[1].on("end", function () {
                poCurArray[1] = rows1;
                if (result.outBinds.Po_Cursor2 !== undefined) {
                  if (result.outBinds.Po_Cursor2 !== null) {
                    queryStream[2] = result.outBinds.Po_Cursor2.toQueryStream();
                    queryStream[2].on("data", function (row) {
                      rows2.push(row);
                    });
                    queryStream[2].on("error", function (err) {
                      errorHandle("ER", err, connection);
                    });
                    queryStream[2].on("end", function () {
                      poCurArray[2] = rows2;
                      try {
                        next({
                          code: 1,
                          msg: "Success",
                          cursor1: poCurArray[0],
                          cursor2: poCurArray[1],
                          cursor3: poCurArray[2]
                        });
                      } catch (er) {
                      } finally {
                        doRelease(connection);
                      }
                    });
                  }
                } else {
                  try {
                    next({
                      code: 1,
                      msg: "Success",
                      cursor1: poCurArray[0],
                      cursor2: poCurArray[1]
                    });
                  } catch (er) {
                  } finally {
                    doRelease(connection);
                  }
                }
              });
            } else {
              try {
                next({
                  code: 1,
                  msg: "Success",
                  cursor1: poCurArray[0]
                });
              } catch (er) {
              } finally {
                doRelease(connection);
              }
            }
          } else {
            try {
              next({
                code: 1,
                msg: "Success",
                cursor1: poCurArray[0]
              });
            } catch (er) {
            } finally {
              doRelease(connection);
            }
          }
        }
        queryStream[0].on("error", function (err) {
          errorHandle("ER", err, connection);
        });
      });
    });
  });
};

exports.GetMultipleRefCursor = function (plsql, bindvars, next) {
  oracledb.getConnection(config.connectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      result = { code: 0, msg: err.message };
      doRelease(connection);
      next(result);
      return;
    }
    oracledb.fetchAsString = [oracledb.CLOB];
    connection.execute(plsql, bindvars, { autoCommit: true, fetchAsBuffer: oracledb.BLOB, fetchAsString: oracledb.CLOB }, function (
      err,
      result
    ) {
      if (err) {
        console.log(err.message);
        result = { code: 0, msg: err.message };
        next(result);
        doRelease(connection);
        return;
      }
      //console.log(result.outBinds.Po_Cursor.metaData);
      if (
        result.outBinds.Po_Error !== null &&
        result.outBinds.Po_Error.trim().length > 0
      ) {
        if (
          result.outBinds.Po_Error.trim()
            .substring(0, 5)
            .toUpperCase() == "ERROR"
        ) {
          result.code = 0;
        } else {
          result.code = 1;
        }
        result.msg = result.outBinds.Po_Error.trim();
        next(result);
        doRelease(connection);
        return;
      }
      if (result.outBinds.Po_Cursor !== null)
        fetchRowsFromRS(connection, result.outBinds.Po_Cursor, numRows, next);
      else {
        result.code = 1;
        result.msg = "Success";
        next(result);
        doRelease(connection);
        return;
      }
    });
  });
};

function fetchRowsFromRS(connection, resultSet, numRows, next) {
  var jsonData = "";

  resultSet.getRows(
    // get numRows rows
    numRows,
    function (err, rows) {
      if (err) {
        console.log(err);
        result = { code: 0, msg: err.message };
        next(result);
        doClose(connection, resultSet); // always close the result set
        return;
      } else if (rows.length === 0) {
        // no rows, or no more rows
        result = { code: 1, msg: "Record not Found." };
        next(result);
        doClose(connection, resultSet); // always close the result set
      } else if (rows.length > 0) {
        //console.log("fetchRowsFromRS(): Got " + rows.length + " rows");
        result = { code: 1, msg: "Success", data: rows };
        next(result);
        doClose(connection, resultSet); // always close the result set
      }
    }
  );
}
/**
 * Release DataBase connection
 * @param {*} connection
 */
var doRelease = function (connection) {
  if (connection) {
    connection.close(function (err) {
      if (err) {
        console.log(err.message);
      }
    });
  }
};
/**
 * Close resultset and release database connection
 * @param {*} connection
 * @param {*} resultSet
 */
var doClose = function (connection, resultSet) {
  resultSet.close(function (err) {
    if (err) {
      console.log(err.message);
    }
    doRelease(connection);
  });
};
exports.GetSPExecuteNonQuery = function (plsql, bindvars, next) {
  oracledb.getConnection(config.connectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      result = { code: 0, msg: err.message };
      doRelease(connection);
      next(result);
      return;
    }
    //console.log(plsql);
    connection.execute(plsql, bindvars, { autoCommit: true, fetchAsBuffer: oracledb.BLOB }, function (
      err,
      result
    ) {
      if (err) {
        console.log(err.message);
        result = { code: 0, msg: err.message };
        doRelease(connection);
        next(result);
        return;
      }

      if (
        result.outBinds.Po_Error !== undefined &&
        result.outBinds.Po_Error !== null &&
        result.outBinds.Po_Error.trim().length > 0
      ) {
        if (
          result.outBinds.Po_Error.trim()
            .substring(0, 5).toUpperCase() == "ERROR"
        ) {
          result.outBinds.code = 0;
        } else {
          result.outBinds.code = 1;
        }
        result.outBinds.msg = result.outBinds.Po_Error.trim();
      } else {
        result.outBinds.code = 1;
        result.outBinds.msg = "Success";
      }
      console.log(result.outBinds);
      try {
        next(result.outBinds);
      } catch (er) {
      } finally {
        doRelease(connection);
      }
    });
  });
};

exports.GetSingleVal = function (plsql, bindvars, next) {
  oracledb.getConnection(config.connectionString, function (err, connection) {
    if (err) {
      console.log(err.message);
      result = { code: 0, msg: err.message };
      doRelease(connection);
      next(result);
      return;
    }
    connection.execute(plsql, bindvars, { autoCommit: true, fetchAsBuffer: oracledb.BLOB }, function (err, result) {
      if (err) {
        result = { code: 0, msg: err.message };
        doRelease(connection);
        next(result);
        return;
      }
      console.log(result.rows[0].VALSTR);
      try {
        next({ code: 1, msg: "Success", result: result.rows[0].VALSTR });
      } catch (er) {
      } finally {
        doRelease(connection);
      }
    });
  });
};

exports.executeQuery = function (plsql, bindvars, next) {
  oracle.getConnection(config.connectionString, function (err, connection) {
    if (err) {
      next(errorHandle("ER", err, connection));
      return;
    }
    connection.execute(plsql, bindvars, { autoCommit: true, fetchAsBuffer: oracledb.BLOB }, function (
      err,
      result
    ) {
      if (err) {
        next(errorHandle("ER", err, connection));
        return;
      }
      try {
        next({ code: 1, msg: "Success", result: result.rows });
      } catch (er) {
        next(errorHandle("ER", er, connection));
      } finally {
        doRelease(connection);
      }
    });
  });
};

exports.GetMuitirows = function (plsql, bindvars, next) {
  oracledb.getConnection(config.connectionString,
    function (err, connection) {
      if (err) {
        console.log(err.message);
        result = { code: 0, msg: err.message };
        doRelease(connection);
        next(result);
        return;
      };
      connection.execute(
        plsql,
        bindvars,
        function (err, result) {
          if (err) {
            result = { code: 0, msg: err.message };
            doRelease(connection);
            next(result);
            return;
          }
          //console.log(result.rows[0]);
          try {
            next({ code: 1, msg: 'Success', result: result.rows });
          }
          catch (er) { }
          finally {
            doRelease(connection);
          }
        });
    })
};
