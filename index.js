console.clear();


const http = require('http');
const fs = require('fs');
const stream = require('stream');
const crypto = require('crypto')
const commandLine = require('child_process');
const multiparty = require('multiparty');
const colors = require('colors');
const screenshot = require('screenshot-desktop');

const secureKeyCreator = require('./encryption/createKey');
const encryption = require('./encryption/encryption');
const CONFIG = require('./config');

let authenticated=false;
let sessionCode=false;
let childProcess;

//----------------------main----------------------
secureKeyCreator.createKeyExchangeServer();
createCommandServer(CONFIG.ports.command);
creteUploadServer(CONFIG.ports.upload);
createDownloadServer(CONFIG.ports.download);
createScreenServer(CONFIG.ports.screen);
createStatusServer(CONFIG.ports.status);
console.log("Check './config/index.js' for port, host and other configurations");
//------------------------------------------------



function createScreenServer(port){
	  console.log("Started screen server on port ".green.bold + port.toString().magenta.bold);
    createDataServer(port, (response, postData) => {
        screenshot({ filename: __dirname + '/tmp/screen.jpeg' }).then((imgPath) => {
            write(
                response, Buffer.from(
                    fs.readFileSync(__dirname + '/tmp/screen.jpeg','hex')
                , 'hex').toString('base64')
            );            
        }).catch((err) => {
          write(response, '');
        });   
    });
}




function createCommandServer(port){
	  console.log("Started command server on port ".green.bold + port.toString().magenta.bold);
    createDataServer(port, (response, postData) => {
        if(postData.command){
            let command=postData.command;
            switch(postData.type){
                case 'tray':
                    switch(command){
                      case 'open':
                        commandLine.exec(__dirname+'/files/cd_open.bat',(error, stdout, stderr) => {
                             if (stderr){
                                 write(response, JSON.stringify(stderr));
                                 return;
                             }
                             write(response, JSON.stringify(stdout));    
                        });
                        break;
                      case 'close':
                        write(response, "Command Not Availabel Yet");
                        break;
                      default:
                        write(response, "Tray Command Not Recognized");
                        break;
                    }
                    break;
                case 'cmd':                    
                    if(childProcess){
                        childProcess.kill();
                    }

                    childProcess = commandLine.exec(command, (error, stdout, stderr) => {                   
                        write(response, '');
                    });

                    childProcess.stdout.on('data',(data) => {
                        write(response, data.toString(), true);
                    });  
                    childProcess.stderr.on('data',(data) => {
                        write(response, data.toString(), true);
                    });          
                    break;                
                case 'cmdIn':
                    if(childProcess){ 
                      try{
                        childProcess.stdin.write(command + '\n');
                      } catch(err) {
                        write(response, "Invalid Input");
                      }
                    } else {
                      write(response, 'No Child Process Is Started');   
                    }                                
                    break;                
                default:
                    write(response, "Command Not Recognized");
                    break;
            }
        }else{
            write(response, "Command Not Recognized");
        }  
    })
}



function createDownloadServer(port){
	  console.log("Started download server on port ".green.bold + port.toString().magenta.bold);
    createDataServer(port, (response, postData) => {
        const { path } = postData;

        if(!fs.existsSync(path)){
          write(response, "File does not exist on server");
          return;
        }

        if(postData.enc != 'no')
        {       
          encryption.encryptFile(
              path,
              __dirname + '/tmp/outgoingFile.enc',
              secureKeyCreator.KEY,
              () => {
                write(response, 'stream', true);
                fs.createReadStream(__dirname + '/tmp/outgoingFile.enc')
                .pipe(response)
                .on('close',() => {
                  if(__dirname + '/tmp/outgoingFile.enc'){
                    fs.unlinkSync(__dirname + '/tmp/outgoingFile.enc');
                  }
                });
              },
              (err) => {
                write(response, JSON.stringify(err));
              }
          );
        }else{                                                      
          write(response, 'stream', true);       
          fs.createReadStream(path).pipe(response);       
        }                          

    })
}


function creteUploadServer(port){
	  console.log("Started upload server on port ".green.bold + port.toString().magenta.bold);
    http.createServer((request, response) => {   
        if(!secureKeyCreator.KEY)
        {
          write(response, '-1', false, true, true);
          return;
        }

        var form = new multiparty.Form();

        var formData = {};

        var pendingFieldCount = 0;

        form.on('part', (part) => {          
            if(!part.filename){
                pendingFieldCount ++;
                let partValue = '';
                part.on('data', (chunk) => {
                  partValue += chunk;
                }).on('end',() => {
                  pendingFieldCount --;
                  formData[part.name] = partValue;
                });      

            }else{
                var waitForFields = setInterval( () => {
                  if(pendingFieldCount !== 0){
                    return;
                  }

                  clearInterval(waitForFields);

                  response.statusCode = 200; 
                  formData = decryptObject(formData);

                  doIfAuth(formData, response, () => {
                      if(formData.enc != 'no'){
                        part.pipe(fs.createWriteStream(__dirname + '/tmp/incomingFile.enc'))
                        .on('close', () => {
                          encryption.decryptFile(__dirname + '/tmp/incomingFile.enc', 
                            formData.path, 
                            secureKeyCreator.KEY,
                            () => {
                              write(response, 'Upload Done');
                              if(fs.existsSync(__dirname + '/tmp/incomingFile.enc')){
                                fs.unlinkSync(__dirname + '/tmp/incomingFile.enc');                                
                              }
                            },
                            (err) => {
                              write(response, JSON.stringify(err));
                            });
                        })
                        .on('error', (e) => {
                            write(response, JSON.stringify(e));
                        });         
                      }else{
                        part.pipe(fs.createWriteStream(formData.path))
                        .on('close', () => {
                            write(response, 'Upload Done');
                        })
                        .on('error', (e) => {
                            write(response, JSON.stringify(e));
                        });      
                      }
                  })
                },100);
                 
            }
        });

        form.parse(request);   
    }).listen(port);
}




function createDataServer(port, callBack){
    http.createServer((request, response) => {
  
        if(!secureKeyCreator.KEY){
            write(response, '-1', false, true, true);
            return;
        }  

        let body = '';
        request.on('data', (chunk) => {
            body += chunk;
        }).on('end', () => {
            response.statusCode = 200;

            let postData = decryptObject(
                extractPostData(body)
            ); 

            doIfAuth(postData, response, () => {
                callBack(response, postData);
            });
            
        });
    }).listen(port);
}





function write(response, message, keepAlive, noEncryption, dontWrap){  
    if(!dontWrap){

        let sessionCodeEnc;
        let authenticatedEnc;
        let messageEnc;

        if(!noEncryption){
          sessionCodeEnc=encryption.encrypt(sessionCode,secureKeyCreator.KEY);
          authenticatedEnc=encryption.encrypt(authenticated,secureKeyCreator.KEY);
          messageEnc=encryption.encrypt(message,secureKeyCreator.KEY);
        }else{
          sessionCodeEnc=sessionCode;
          authenticatedEnc=authenticated;
          messageEnc=message;
        }   

        response.write(JSON.stringify({'sessionCode':sessionCodeEnc,'auth':authenticatedEnc,'message':messageEnc}));
    
    }else{

        let messageEnc;

        if(!noEncryption){
          messageEnc=encryption.encrypt(message,secureKeyCreator.KEY);
        }else{
          messageEnc=message;
        }  

        response.write(messageEnc);

    }
       
    
    if(!keepAlive){
      response.end();
    }

}



function createStatusServer(port){
	  console.log("Started status server on port ".green.bold + port.toString().magenta.bold);
    http.createServer((request, response) => {   
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/plain');
          write(response, '1', false, true, true);     
    }).listen(port);
}



function generateSessionCode(){
    return crypto.createHash('sha1').update(Date.now().toString() + Math.random().toString()).digest('hex');
}



function encryptObject(object){
  var objectEnc = {...object};
  var keys = Object.keys(objectEnc);
  for(var i = 0; i < keys.length; i++){
    if(typeof(objectEnc[keys[i]]) == 'object'){
      objectEnc[keys[i]] = encryption.encrypt(JSON.stringify(objectEnc[keys[i]]),secureKeyCreator.KEY);
    }else{
      objectEnc[keys[i]] = encryption.encrypt((objectEnc[keys[i]]),secureKeyCreator.KEY);  
    }
  }
  return objectEnc;
}

function decryptObject(object){
  var objectEnc = {...object};
  var keys = Object.keys(objectEnc);
  for(var i = 0; i < keys.length; i++){
    if(typeof(objectEnc[keys[i]]) == 'object'){
      objectEnc[keys[i]] = encryption.decrypt(JSON.stringify(objectEnc[keys[i]]),secureKeyCreator.KEY);
    }else{
      objectEnc[keys[i]] = encryption.decrypt((objectEnc[keys[i]]),secureKeyCreator.KEY);  
    }
  }
  return objectEnc;
}


function extractPostData(body){
    let postData = body.split('&');    

    let postDataExtracted = {};
    let tmpPost;
    for(let i = 0; i < postData.length; i++)
    {
        tmpPost = postData[i].split('=');
        tmpPost[0] = decodeURIComponent(tmpPost[0]);
        tmpPost[1] = decodeURIComponent(tmpPost[1]);
        postDataExtracted[tmpPost[0]] = tmpPost[1];
    }

    return postDataExtracted;
}



function doIfAuth(data, response, callBack){
    if(
        (   
            data.user 
            && data.pass 
            && data.user.trim()==CONFIG.cred.user.trim() 
            && data.pass.trim()==CONFIG.cred.pass.trim()  
        ) || (
            data.sessionCode 
            && data.sessionCode.trim()==sessionCode
        )
    ){
        authenticated=true;
        
        if(!sessionCode || (data.sessionCode && sessionCode!=data.sessionCode.trim())){
            sessionCode = generateSessionCode();
        }        
        


        callBack();

    }else{
        authenticated=false;
        write(response, 'Authentication Failed');
    }
}