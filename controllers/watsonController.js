const AssistantV1 = require('ibm-watson/assistant/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const getReply = async function (text){
  let res;
  let conversationContext
  const assistant = new AssistantV1({
    version: '2021-06-14',
    authenticator: new IamAuthenticator({
      apikey: '2LKJH8ZZX58NWf7Nh3JsmyFa50T6vpHYwH4i0VugW11k',
    }),
    serviceUrl: 'https://api.au-syd.assistant.watson.cloud.ibm.com',
  });
  try{
    res = await assistant.message({
      workspaceId: 'e5f2d935-02b9-4fd2-a801-eab8a3d45941',
      input: text,
      context: this.conversationContext,
    });
  }catch(err){
      console.log(err);
    }
  console.log('getReply-res',res);
  console.log('getReply-.result.output',res.result.output);
  console.log('getReply-.result.output.generic',res.result.output.generic);
  console.log('getReply-.result.output.text',res.result.output.text);
  console.log('getReply-res.result.context',res.result.context);


  if(res.result.output.text[0]){ 
    this.conversationContext = res?.result?.context;
    console.log(res.result.output.text);
    return res.result.output.text[0];
  }else {
    return "可能在忙，晚點再試一次";
  }

}

module.exports = getReply
