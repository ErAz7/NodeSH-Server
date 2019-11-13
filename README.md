# NodeSH-Client

A Node.js Secure Shell Access server that provides :
- __Secure Shell Access__ 
- __Encrypted Download__ 
- __Encrypted Upload__

using __Nodejs__ + __Diffie-Hellman__ key exchange + __AES__ encryption

wroks on __Windows__, __macOS__, __Linux__


# Table of Contents

- [Installation](#installation)
- [API](#api)
    - [Key Exchange](#key-exchange)
    - [Send Requests To Server](#send-requests-to-server)
        - [Authentication Fields](#authentication-fields)
        - [cmd , cmdIn , tray](#cmd--cmdin--tray)
        - [download , upload](#download--upload)
    - [Server Response](#server-response)
        - [cmd , cmdIn , tray , screen , upload](#cmd--cmdin--tray--screen--upload)
        - [download](#download)        
- [Contribution](#contribution)

# Installation
To install this package, simply run :
`npm i nodesh-server`

To run the server, run `npm start`

Do not forget to set the host __IP address__ or __domain name__ in configuration file ('./config/index.js'), __Consider__ that username and password in this file, should be the same on server and client machines in order to connect.

# API
You can use [NodeSH-Client]() to connect and communicate with NodeSH-Server but if you prefer to write a client yourself, here is the API :
### Key Exchange
Since client is the connection starter, first you should calculate  __Generator__, __Prime__ and __Client Public Key__ and post them to __Key Exchange Port__ of server setted in configuration file, field names should be as follows :
```
P = PRIME
G = GENERATOR
public = CLIENT_PUBLIC
```

Server will calculate its own public key and send back a JSON object containing __Generator__ (you sent), __Prime__ (you sent) and __Server Public Key__ as response
```javascript
{
    public: SERVER_PUBLIC,
    P: PRIME,
    G: Generator
}
```

Finally you grab the __Server Public  Key__, calculate __Secret Key__ and  keep it somewhere, now secure connection is established

__Consider__ the  __Prime BitLength__ and __Encryption Algorithm__ setted in configuration file should be the same on both sides
### Send Requests To Server
To send requests to server, you should send a __POST Request__  with values __Encrypted__ using the secret key you exchanged in 'Key Exchange' API

First three fields are authentication fields. You should send __user__ and __pass__ fields together or __sessionCode__ field. The rest are based on the __Usage Type__ :
- #### Authentication Fields
    - __user :__ 
    The username. Will be compared with username setted in configuration file on server. consider this is not necessary if a session code exists
    - __pass :__ 
    The password. Will be compared with password setted in configuration file on server. consider this is not necessary if a session code exists
    - __sessionCode :__ 
    The session code. Will be compared with the session code stored in a variable server side. Session code will be returned in response after every time you send a request to server. So you should use __user__ and __pass__ fields at first requests and grab the session code from response. Once you caught session code, you can send it instead of __user__ and __pass__ 
- #### cmd , cmdIn , tray
    - __type :__ 
    Command type. Should be one of valid __Command Usage Types__ mentioned in __Client Guide__ (__cmd__, __cmdIn__ and __tray__)
    - __command :__ 
    The command to be executed on server
- #### download , upload
    - __path :__ 
    A file path on server to be downloaded
    - __dest :__ 
    A file path on server to save uploaded file
    - __enc :__ 
    Determines if file should be encrypted during transfer
    - __file :__
    Supplies a readable stream to send file to server. __Consider__ you should use __multipart/form-data__ to send stream and necessary fields beside

__Consider,__ To request server to take an screenshot and send it back __Encrypted__, only __Authentication Fields__ are necessary

Also __Remember__ that any request should be sendt to its own port setted in configuration file
### Server Response
Server's respond will differ based on usage type :
- #### cmd , cmdIn , tray , screen , upload
    Response will be a JSON object in the following format :
    ```javascript
        {
            sessionCode: SESSION_CODE,
            auth: TRUE|FALSE,
            message: RESPONSE_MESSAGE
        }
    ```
    
    __sessionCode__ is the session code to use in further requests for authentication

    __auth__ says whether authentication succeeded (true) or failed (false)

    __message__ is the main response from server, it contains response data
    
    __Consider__ you might get several JSON objects during a connection until it ends. So you might want to add chunks to a string until it become a valid JSON, then do whatever you want with JSON object (after decryption), empty the string and do these again until connection ends
- #### download
    Response will be a JSON object first, formatted in the exact same way as above. Then if the __message__ in response JSON is the string __'stream'__then next chunks will be the file from server, otherwise, something has went wrong and message describes the problem, no further chunks will arrive and connection will end


# Contribution
This project was born in my very first days in node.js and at first, was actually something fun to do after I studied more and earned a better understanding of computer networks and network security. Recently I beautified it, changed some algorithms, added some new features and finally uploaded on Github. it might still have some bugs or issues to be solved so feel free to open issues if detected

Besides, there are many other cool features to add to this project
