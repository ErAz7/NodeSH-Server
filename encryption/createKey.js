const crypto=require('crypto');
const querystring = require('querystring');
const http = require('http');
const colors = require('colors');
const fs = require('fs');

const CONFIG = require('../config');

let A;
let B;
let P;
let G;
let Private;
let Me;

function reset(){
  A = null;
  B = null;
  P = null;
  G = null;
  Private = null;
  exports.KEY = null;
  Me = null;
}


function post(data,callBack) { 
  let post_data = querystring.stringify(data);

  let post_options = {
      host: CONFIG.host,
      port: CONFIG.ports.keyExchange,
      path: '',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data)
      }
  };

  let post_req = http.request(post_options, function(res){   
      let body='';
      let responseJSON;
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
          try{
            body+=chunk;
            responseJSON=JSON.parse(body.trim());            
            body='';
          }catch(e){                      
            return;
          }
          communicate(responseJSON,callBack);
      }).on('end', () => {   
      });
  }).on('error', function(error) {
        console.log(JSON.stringify(error).bold.red);
  });;

  post_req.write(post_data);
  post_req.end();  
}

function initialize(data){
  if(Me){
    return;
  }
  console.log("Initializing Secure Connection...".bold);
  if(!data){
    Me=crypto.createDiffieHellman(CONFIG.enc.primeLength);
  }else{
    Me=crypto.createDiffieHellman(data.P,'hex',data.G,'hex'); 
  }  
  Me.generateKeys();
}

function createP(){
  P=Me.getPrime('hex');
}

function createG(){
  G=Me.getGenerator('hex');
}

function createPrivate(){
  Private=Me.getPrivateKey('hex');
}

function getA(){
  A=Me.getPublicKey('hex');
}

function getKEY(){  
  console.log("Computing Secret Key...".bold);
  exports.KEY=Me.computeSecret(B,'hex','hex');
}

function communicate(data,callBack){
  initialize(data);
  if(!data){    
    createP();
    createG();
    createPrivate();
    getA();
    console.log("Public Data Generated".bold.green); 
    post({P:P,G:G,public:A},callBack);
    console.log("Waiting For Other Party To Respond...".bold);
  }else{
    B=data.public;
    if(!P){
      P=data.P;
      G=data.G;
      createPrivate();
      getA(); 
      console.log("Public Data Recieved".bold.green);     
    }
    getKEY();
    console.log("Established Secure Connection\n\n".bgGreen.bold.white);
    if(callBack){
      callBack();
    }   
    
  }
}






function createKeyExchangeServer(){ 
    console.log("Started key exchange server on port ".green.bold + CONFIG.ports.keyExchange.toString().magenta.bold);
    http.createServer((request, response) => {   
          let body = [];
          request.on('data', (chunk) => {
            body.push(chunk);
          }).on('end', () => {
            response.statusCode = 200;

            body = Buffer.concat(body).toString();
            if(!body.trim()){
              return;
            }
            let postData=body.split('&');    

            let postDataDecoded={};
            let tmpPost;
            for(let i=0;i<postData.length;i++){
              tmpPost=postData[i].split('=');
              tmpPost[0]=decodeURIComponent(tmpPost[0]);
              tmpPost[1]=decodeURIComponent(tmpPost[1]);
              postDataDecoded[tmpPost[0]]=tmpPost[1];
            }
            reset();
            communicate(
              {
                P:postDataDecoded.P,
                G:postDataDecoded.G,
                public:postDataDecoded.public
              },
              function(){
                response.end(JSON.stringify({
                  public:A,
                  P:P,
                  G:G
                }));
                
              }
            );
          });
    }).listen(CONFIG.ports.keyExchange);
}




exports.reset = reset;
exports.KEY = null;
exports.communicate = communicate;
exports.createKeyExchangeServer = createKeyExchangeServer;
