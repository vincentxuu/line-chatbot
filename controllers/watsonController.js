const AssistantV1 = require('ibm-watson/assistant/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const getReply = async function (text){
  let res
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
    input: text
    });
  }catch(err){
      console.log(err);
    }

  if(res.result.output.text[0]){ 
  console.log(res.result.output.text);
  return res.result.output.text[0];
  }

}

module.exports = getReply
