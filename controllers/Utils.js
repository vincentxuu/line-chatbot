const axios = require('axios');

// public functions
exports = module.exports = {};

// 請求其他服務
exports.callAPI = (urlData) => {
  return new Promise(function(resolve, reject) {
    axios(urlData)
      .then((result) => {
        resolve(result.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

// Controller的log傳到amqp
exports.saveLogToAmqp = (log) => {
  Object.keys(log).forEach((key) => {
    // 將物件轉為字串
    if (typeof (log[key]) === 'object') log[key] = JSON.stringify(log[key]);

    // 字串限制輸入長度
    switch (key) {
      case 'USER_ID':
        log[key] = log[key].substring(0, 50);
        break;
      case 'METHOD':
        log[key] = log[key].substring(0, 7);
        break;
      case 'TIMESTAMPS':
        log[key] = log[key].substring(0, 255);
        break;
      case 'REQUEST_DATA':
        log[key] = log[key].substring(0, 255);
        break;
    };
  });
  const logToAmqp = {
    data: log,
  };

  logger.info(JSON.stringify(logToAmqp));
};
