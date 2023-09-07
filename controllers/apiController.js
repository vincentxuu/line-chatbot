const Utils = require('./Utils');
const {
  ANSWERPACK_URL,
  WATSON_URL,
} = process.env;


/**
 * ApiController
 */
class ApiController {
  /**
 * constructor
 */
  constructor() {
    this.sendMessage = this.sendMessage.bind(this);
    this.getAnsIdMessage = this.getAnsIdMessage.bind(this);
    this.getWatsonResult = this.getWatsonResult.bind(this);
  }

  /**
  * 發送訊息後取得答案包內容
  * @async
  * @param {object} req
  * @param {object} res
  * @return {json} ansId message
  */
  async sendMessage(req, res) {
    const assistantError = await RedisCtl.getAssistantError();
    console.log('[sendMessage][assistantError]', assistantError);
    // assistant系統異常
    if (assistantError === 'true') {
      console.error('[sendMessage][assistantError] assistant異常');
      return res.status(500).json({
        data: {
          assistantError: assistantError === 'true' ? true : false,
          message: '系統維護<br>暫停維護',
        },
      });
    };

    const doc = {
      USER_ID: req.session.user ? req.session.user : '',
      METHOD: 'message',
      // mssql查詢timestamp只能計算到秒
      TIMESTAMP: Math.floor(new Date().valueOf() / 1000),
      TIMESTAMPS: {
        askAssistant: undefined,
        assistantReturn: undefined,
        searchDB: undefined,
        DBreturn: undefined,
      },
      REQUEST_DATA: req.body.text,
      RESPONSE_DATA: undefined,
      ASSISTANT_RESULT: undefined,
    };
    try {
      const token = req.session.token;
      console.log('[sendMessage][token]', token);
      if (!token) {
        throw new Error('沒有token,請重新登入');
      };

      let params = {
        text: req.body.text ? req.body.text : undefined,
        platform: 'web',
        token,
      };
      doc.TIMESTAMPS.askAssistant = Math.floor(new Date().valueOf() / 1000);
      const watsonRes = await getWatsonResult(params);
      doc.TIMESTAMPS.assistantReturn = Math.floor(new Date().valueOf() / 1000);
      doc.ASSISTANT_RESULT = watsonRes;
      if (doc.ASSISTANT_RESULT.assistantResponse) {
        delete doc.ASSISTANT_RESULT.assistantResponse.context;
      };
      console.log('[sendMessage][watsonRes]', watsonRes);
      // eslint-disable-next-line max-len
      const ansId = JSON.parse(watsonRes.assistantResponse.output.text[0]).ansId;
      console.log('[sendMessage][ansId]', ansId);

      params = {
        ansId,
        platform: 'web',
        token,
      };
      doc.TIMESTAMPS.searchDB = Math.floor(new Date().valueOf() / 1000);
      const ansIdRes = await getAnswerPackResult(params);
      doc.TIMESTAMPS.DBreturn = Math.floor(new Date().valueOf() / 1000);
      console.log('[sendMessage][ansIdRes]', ansIdRes);
      const ansIdData = ansIdRes.data;
      console.log('[sendMessage][ansIdData]', ansIdData);
      doc.RESPONSE_DATA = ansIdData;
      console.log('[sendMessage][logData]', doc);
      Utils.saveLogToAmqp(doc);
      return res.status(200).json({
        success: true,
        data: ansIdData,
      });
    } catch (err) {
      console.error('[sendMessage][error]', err);
      doc.ERROR = err.toString();
      Utils.saveLogToAmqp(doc);
      res.status(500).json({
        data: {
          assistantError: assistantError === 'true' ? true : false,
          message: err,
        },
      });
    }
  }

  /**
  * 按下按鈕後取得答案包內容
  * @async
  * @param {object} req
  * @param {object} res
  * @return {json} ansId message
  */
  async getAnsIdMessage(req, res) {
    const doc = {
      USER_ID: req.session.user ? req.session.user : '',
      METHOD: 'button',
      // mssql查詢timestamp只能計算到秒
      TIMESTAMP: Math.floor(new Date().valueOf() / 1000),
      TIMESTAMPS: {
        searchDB: undefined,
        DBreturn: undefined,
      },
      REQUEST_DATA: req.body,
      RESPONSE_DATA: undefined,
    };
    try {
      const token = req.session.token;
      const {ansId} = req.body;
      if (!token) throw new Error('沒有token,請重新登入');
      if (!ansId) throw new Error('沒有傳入答案包,請重新執行');

      const params = {
        ansId,
        platform: 'web',
        token,
      };
      doc.TIMESTAMPS.searchDB = Math.floor(new Date().valueOf() / 1000);
      const ansIdRes = await getAnswerPackResult(params);
      doc.TIMESTAMPS.DBreturn = Math.floor(new Date().valueOf() / 1000);
      console.log('[getAnsIdMessage][ansIdRes]', ansIdRes);
      const ansIdData = ansIdRes.data;
      console.log('[getAnsIdMessage][ansIdData]', ansIdData);

      doc.RESPONSE_DATA = ansIdData;
      console.log('[getAnsIdMessage][logData]', doc);
      Utils.saveLogToAmqp(doc);
      return res.status(200).json({
        success: true,
        data: ansIdData,
      });
    } catch (err) {
      console.error('[getAnsIdMessage][error]', err);
      doc.ERROR = err.toString();
      Utils.saveLogToAmqp(doc);
      return res.status(500).json(err);
    }
  }
  async getWatsonResult(text) {
    const body = {
      text
    };
    const urlData = {
      url: `${WATSON_URL}/assistant/conversation`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      data: body,
    };
    console.log('[watsonUrlData]', urlData);
    return await Utils.callAPI(urlData);
  }
}

/**
  * 取得watson對話結果
  * @async
  * @param {object} params
  * @return {Promise<string>}
  */

/**
  * 取得ansId的內容
  * @async
  * @param {object} params
  * @return {Promise<string>}
  */
async function getAnswerPackResult(params) {
  const body = {
    platform: params.platform,
  };
  const urlData = {
    url: `${ANSWERPACK_URL}/answerPacks/${params.ansId}`,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${params.token}`,
    },
    data: body,
  };
  console.log('[answerPack urlData]', urlData);
  return await Utils.callAPI(urlData);
}

module.exports = new ApiController();
