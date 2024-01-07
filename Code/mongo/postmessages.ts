/**
 *  Simple HTTP REST server + MongoDB (Mongoose)
 *
 *  Post and get simple text messages. Each message has a text content, a list of tags
 *  and an associated timestamp
 *  All the posted messages are stored in a MongoDB collection
 *
 *
 *  Endpoints          Attributes          Method        Description
 *
 *     /                  -                  GET         Returns the version and a list of available endpoints
 *     /messages        ?tags=               GET         Returns all the posted messages, optionally filtered by tags
 *                      ?skip=n
 *                      ?limit=m
 *     /messages          -                  POST        Post a new message
 *     /messages        ?id=<id>             DELETE      Delete a message by id
 *     /tags              -                  GET         Get a list of tags
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
 *  $ node postmessages.js
 *
 *  To manually inspect the database in mongodb shell:
 *  > use postmessage
 *  > show collections
 *  > db.messages.find( {} )
 *
 *  to delete all the messages:
 *  > db.messages.deleteMany( {} )
 *
 */


import http = require('http');                // HTTP module
import url = require('url');                  // url module is used to parse the query section of the URL
import fs = require('fs');                    // filesystem module
import colors = require('colors');
colors.enabled = true;


import mongoose = require('mongoose');
import {Message} from './Message';
import * as message from './Message';



var server = http.createServer( function( req, res ) {

    // This function will be invoked asynchronously for every incoming connection

    console.log("New connection".inverse);
    console.log("REQUEST:")
    console.log("     URL: ".red + req.url );
    console.log("  METHOD: ".red + req.method );
    console.log(" Headers: ".red + JSON.stringify( req.headers ) );

    var body: string = "";

    req.on("data", function( chunk ) {
        body = body + chunk;

    }).on("end", function() {
        console.log("Request end");

        var respond = function( status_code: number, response_data: Object ) : void {
            res.writeHead(status_code, { "Content-Type": "application/json" });
            res.write(JSON.stringify(response_data), "utf-8");
            res.end();
        }


        if( req.url == "/" && req.method=="GET") {
            return respond(200, { api_version: "1.0", endpoints: [ "/messages", "/tags" ] });
        }

        else if( req.url.search( "/messages" )!=-1 && req.method == "GET" ) {

            var query = url.parse( req.url, true /* true=parse query string*/).query;
            console.log(" Query: ".red + JSON.stringify(query));

            var filter = {};
            if( query.tags ) {
                filter = { tags: {$all: query.tags } };
            }
            console.log("Using filter: " + JSON.stringify(filter) );

            const skip = parseInt( <string>(query.skip || "0") ) || 0;
            const limit = parseInt( <string>(query.limit || "20") ) || 20;

            message.getModel().find( filter ).skip( skip ).limit( limit )
            .then( (documents) => {
                return respond( 200, documents );
            }).catch( (reason) => {
                return respond(404, { error: true, errormessage: "DB error:"+reason });
            })
        }
        else if( req.url == "/messages" && req.method == "POST" ) {
             console.log("Received: " + body);

             try {
                 var recvmessage = JSON.parse(body);
                 recvmessage.timestamp = new Date();

                 if( message.isMessage( recvmessage ) ) {

                    message.getModel().create( recvmessage ).then( ( data ) => {
                        respond(200,  { error: false, errormessage: "", id: data._id } );
                    }).catch((reason) => {
                        return respond(404, { error: true, errormessage: "DB error"+reason });
                    } )

                 } else {
                    return respond(404, { error: true, errormessage: "Data is not a valid Message" });
                 }
             } catch( e ) {
                return respond(404, { error: true, errormessage: "JSON parse failed" });
            }
        }
        else if( req.url == "/tags" && req.method == "GET" ) {
            message.getModel().distinct("tags")
            .then( (taglist) => {
                return respond( 200, taglist );
            }).catch( (reason)=>{
                return respond(404, { error: true, errormessage: "DB error"+reason });
            })
        }
        else if( req.url.search( "/messages" )!=-1 && req.method == "DELETE" ) {
            var query = url.parse( req.url, true /* true=parse query string*/).query;
            console.log(" Query: ".red + JSON.stringify(query));
            message.getModel().deleteOne( {_id: mongoose.Types.ObjectId( <string>(query.id) ) } )
            .then( ()=> {
                return respond( 200, {error:false, errormessage:""} );
            }).catch( (reason)=> {
                return respond(404, { error: true, errormessage: "DB error"+reason });
            })
        }
        else {
            return respond(404, { error: true, errormessage: "Invalid endpoint/method" });
        }

    });

});





/*

The bootstrap code will do the following:

1) Connect to the database
2) Check how many messages we have in the "Message" collection
3) No messages? Create some test messages to populate the collection. Otherwise skip to 4
4) Start the webserver


... all the operations are asynchronous!



 Let's use the Promises to solve the "JavaScript callback hell":

    asyncfunc1( function callback1() {
        .. do something ..
        asyncfunc2( function callback2() {
            ... do something ...
            asyncfunc3( fuction callback3() {
                ... and so on ...
            })

        })
    })

    A Promise is a proxy for a value not necessarily known when the promise is created.
    Can be in one of those 3 states:

      1) Pending: the initial state
      2) Fullfilled: the async operation was completed successfully
      3) Rejected: the async operation failed (error occurred)

    Note: A promise is said to be settled if it is either fulfilled or rejected, but not pending.


    The methods promise.then(), promise.catch(), and promise.finally() are used 
    to associate further action with a promise that becomes settled.


    - promise.then( onfullfill, onreject ) appends fulfillment (and rejection) handlers 
      to the promise, and returns a new promise resolving to the return value of the called 
      handler, or to its original settled value if the promise was not handled (ie if handlers
      are undefined).

    - promise.catch() appends a rejection handler (only) callback to the promise, 
      and returns a new promise resolving to the return value of the callback if it is called.
      It is like calling promise.then(undefined, onrejected ) 

    Note: then() and catch() returns promises so they can be chained!!!
          Typical idiom:
            myPromise
            .then(handleResolvedA, handleRejectedA (optional) )
            .then(handleResolvedB)
            .then(handleResolvedC)
            .catch(handleRejectedAny);

    Note: a function returning a value can be "casted" to a promise that is fullfilled immediately.

 */ 

/**/  

console.log("Starting the application)");
mongoose.connect( 'mongodb://mymongo:27017/postmessage' )
.then(
    () => {

        console.log("Connected to MongoDB");
        return message.getModel().countDocuments({}); // We explicitly return a promise-like object here
    }
).then(
    (count) => {
        console.log("Collection contains " + count + " messages");

        if (count == 0) {
            console.log("Adding some test data into the database");
            var m1 = message.getModel().create({
                tags: ["Tag1", "Tag2", "Tag3"],
                content: "Post 1",
                timestamp: new Date()
            });
            var m2 = message.getModel().create({
                tags: ["Tag1", "Tag5"],
                content: "Post 2",
                timestamp: new Date()
            });
            var m3 = message.getModel().create({
                tags: ["Tag6", "Tag10"],
                content: "Post 3",
                timestamp: new Date()
            });

            return Promise.all([m1, m2, m3]);
        }
        //return Promise.reject("Database is not empty!")
    }
).then( 
    () => {
        console.log("DB initialized successfully.");  // A function will be transformed to a promise already fullfilled
    }
).then(
    () => {

        // We can manually create a Promise for APIs that
        // normally accept a callback function

        return new Promise( (resolve, reject) => {
            server.listen(8080, function () {
                console.log("HTTP Server started on port 8080");
                resolve(0);
            });
            server.on('error', (e) => { reject(e); } );
        });
    }
)
.catch( 
    (reason) => {
        console.log("Error occurred while initializing the server:".red )
        console.log( reason );
    }
).finally(
    ()=>{
        console.log("Initialization complete")
    }
);

/**/

/* Async-await version 

Async and await keywords act as syntactic sugar on top of promises, making asynchronous 
code easier to write and to read afterwards.

- The async keyword put in front of a function declaration turns it into an async function (ie. 
  a function returning a promise).
- The await keyword put in front of any async promise-based function invocation "pauses" the code on that line 
  until the promise fulfills, then returns the resulting value.

NOTE: await can only be used inside an async function!

How it works:
    All the code following the await is wrapped in a function that is set as the fullfillment
    handler of the awaited function. The interpreter is not really *paused*, it is just a synctactic
    sugar to avoid long chains of then().

    async function a() {
        .. code before ..
        var v = await f()
        .. code after using v ..
    }

    becomes:

    async function a() {
        .. code before ..
        return f().then( (v) => {
            .. code after ..
        } )
    }

/* 

async function main()
{
    console.log("Starting the application (Async/await version)");
    try {
        await mongoose.connect( 'mongodb://mymongo:27017/postmessage' );
        console.log("Connected to MongoDB");
        let count = await message.getModel().countDocuments({});

        console.log("Collection contains " + count + " messages");

        var m1 = await message.getModel().create({
            tags: ["Tag1", "Tag2", "Tag3"],
            content: "Post 1",
            timestamp: new Date()
        });

        var m2 = await message.getModel().create({
            tags: ["Tag1", "Tag5"],
            content: "Post 2",
            timestamp: new Date()
        });

        var m3 = await message.getModel().create({
            tags: ["Tag6", "Tag10"],
            content: "Post 3",
            timestamp: new Date()
        });

        await new Promise( (resolve)=>{ 
            server.listen( 8080, function() {
                resolve(0);
            })
        })

        console.log("HTTP Server started on port 8080");

    }catch( e ) {
        console.log( "Error: ", e )

    }
} 


main()

/**/ 