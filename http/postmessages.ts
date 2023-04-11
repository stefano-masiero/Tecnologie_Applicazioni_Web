/**
 *  Simple HTTP REST server
 * 
 *  Post and get simple text messages. Each message has a text content, a list of tags
 *  and an associated timestamp
 * 
 * 
 *  Endpoints          Attributes          Method        Description
 * 
 *     /                  -                  GET         Returns the version and a list of available endpoints
 *     /messages          -                  GET         Returns all the posted messages
 *     /messages          -                  POST        Post a new message
 *     /messages        ?index=<n>           DELETE      Delete the n^th message
 * 
 * 
 * ------------------------------------------------------------------------------------ 
 *  To install the required modules:
 *  $ npm install
 * 
 *  To compile:
 *  $ npm run compile
 *  or
 *  $ npx tsc
 * 
 *  To run:
 *  $ node postmessages
 * 
 */


import http = require('http');                // HTTP module
import url = require('url');                  // url module is used to parse the query section of the URL
import fs = require('fs');                    // filesystem module
import colors = require('colors');
colors.enabled = true;

import {Message} from './Message';
import {isMessage} from './Message';


// Shared state concurrency: All our messages will be kept here
let messages: Message[] = [];

// All the incoming messages will also be written to a text file
let ostream: fs.WriteStream;


let server = http.createServer( function( req, res ) {

    // This function will be invoked asynchronously for every incoming connection

    console.log("New connection".inverse);
    console.log("REQUEST:")
    console.log("     URL: ".red + req.url );
    console.log("  METHOD: ".red + req.method );
    console.log(" Headers: ".red + JSON.stringify( req.headers ) );

    let body: string = "";

    req.on("data", function( chunk ) {
        body = body + chunk;

    }).on("end", function() {
        console.log("Request end");


        let response_data: object = {
            error: true,
            errormessage: "Invalid endpoint/method"
        };
        let status_code: number = 404;


        if( req.url == "/" && req.method=="GET") {
            status_code = 200;
            response_data = {
                api_version: "1.0",
                endpoints: [ "/messages" ]
            }
        }

        if( req.url == "/messages" && req.method == "GET" ) {
            status_code = 200;
            response_data = messages;
        }

        if( req.url == "/messages" && req.method == "POST" ) {
            console.log("Received: " + body);

            try {
                let recvmessage = JSON.parse(body);
                // Add the timestamp
                recvmessage.timestamp = new Date();
                
                if( isMessage( recvmessage ) ) {
                    messages.push( recvmessage );
                    ostream.write(  JSON.stringify( recvmessage ) + "\n", 'utf8', function() {
                        console.log("Message appended to file");
                    });

                    status_code = 200;
                    response_data = { error: false, errormessage: "" };

                } else {

                    status_code = 400;
                    response_data = { error: true, errormessage: "Data is not a valid Message" };
                }

            } catch( e ) {

                status_code = 400;
                response_data = {
                    error: true,
                    errormessage: "JSON parse failed"
                };
            }
        }

        if( req.url.search( "/messages" )!=-1 && req.method == "DELETE" ) {
            let parsedquery = url.parse( req.url, true /* true=parse query string*/).query;
            console.log(" Query: ".red + JSON.stringify(parsedquery));

            let query:string = <string>(parsedquery.index)
            let queryidx:number = parseInt( query );

            if( queryidx < messages.length ) {
                messages[ queryidx ] = messages[ messages.length-1 ];
                messages.pop();
                status_code = 200;
                response_data = { error: false, errormessage: "" };
            } else {
                status_code = 400;
                response_data = {
                    error: true,
                    errormessage: "Invalid index"
                };
            }
        }

        res.writeHead(status_code, { "Content-Type": "application/json" });
        res.write(JSON.stringify(response_data), "utf-8");
        res.end();
    });

});


server.listen( 8080, function() {
    console.log("HTTP Server started on port 8080");
    ostream = fs.createWriteStream('messagelog.txt');
});


console.log("Server setup complete");
