/**
 *  Simple HTTP REST server + MongoDB (Mongoose) + Express
 * 
 *  Post and get simple text messages. Each message has a text content, a list of tags
 *  and an associated timestamp.
 *  All the posted messages are stored in a MongoDB collection.
 * 
 *  The application also provide user authentication through JWT. The provided
 *  APIs are fully stateless.
 * 
 * 
 * 
 *  Endpoints          Attributes          Method        Description
 * 
 *     /                  -                  GET         Returns the version and a list of available endpoints
 *     /messages        ?tags=               GET         Returns all the posted messages, optionally filtered by tags
 *                      ?skip=n
 *                      ?limit=m
 *     /messages          -                  POST        Post a new message
 *     /messages/:id      -                  DELETE      Delete a message by id
 *     /tags              -                  GET         Get a list of tags
 * 
 *     /users             -                  GET         List all users
 *     /users/:mail       -                  GET         Get user info by mail
 *     /users             -                  POST        Add a new user
 *     /login             -                  POST        login an existing user, returning a JWT
 * 
 * 
 * ------------------------------------------------------------------------------------ 
 *  To install the required modules:
 *  $ npm install
 * 
 *  To compile:
 *  $ npm run compile
 * 
 *  To setup:
 *  1) Create a file ".env" to store the JWT secret:
 *     JWT_SECRET=<secret>
 * 
 *    $ echo "JWT_SECRET=secret" > ".env"
 * 
 *  2) Generate HTTPS self-signed certificates
 *    $ cd keys
 *    $ openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 36
 *    $ openssl rsa -in key.pem -out newkey.pem && mv newkey.pem key.pem
 * 
 *  3) In postman go to settings and deselect HTTPS certificate check (self-signed
 *     certificate will not work otherwise)
 * 
 *  To run:
 *  $ node postmesages.js
 * 
 *  To manually inspect the database:
 *  > use postmessages
 *  > show collections
 *  > db.messages.find( {} )
 *  
 *  to delete all the messages:
 *  > db.messages.deleteMany( {} )
 * 
 */


const result = require('dotenv').config()     // The dotenv module will load a file named ".env"
                                              // file and load all the key-value pairs into
                                              // process.env (environment variable)
if (result.error) {
  console.log("Unable to load \".env\" file. Please provide one to store the JWT secret key");
  process.exit(-1);
}
if( !process.env.JWT_SECRET ) {
  console.log("\".env\" file loaded but JWT_SECRET=<secret> key-value pair was not found");
  process.exit(-1);
}

import fs = require('fs');
import http = require('http');                  // HTTP module
import https = require('https');                // HTTPS module
import colors = require('colors');
colors.enabled = true;


import mongoose = require('mongoose');
import {Message} from './Message';
import * as message from './Message';

import { User } from './User';
import * as user from './User';

import express = require('express');

import passport = require('passport');           // authentication middleware for Express
import passportHTTP = require('passport-http');  // implements Basic and Digest authentication for HTTP (used for /login endpoint)

import jsonwebtoken = require('jsonwebtoken');  // JWT generation
const { expressjwt: jwt } = require('express-jwt');            // JWT parsing middleware for express

import cors = require('cors');                  // Enable CORS middleware
const io = require('socket.io');                // Socket.io websocket library
import redis = require('redis');                // REDIS in-memory database used as data cache
import { nextTick } from 'process';



// Let's add some custom type definition to the Express
// types. Remember that interfaces are open-ended, so we
// can easily add properties to existing object types
declare global {
  namespace Express {
      interface User {
        mail:string,
        username: string,
        roles: string[],
        id: string
      }

      interface Request {
        auth: {
          mail: string;
        }
      }
    }
}


let ios = undefined;

let rc = redis.createClient({
  url: 'redis://myredis'
});

let app = express();

// We create the JWT authentication middleware
// provided by the express-jwt library.  
// 
// How it works (from the official documentation):
// If the token is valid, req.auth will be set with the JSON object 
// decoded to be used by later middleware for authorization and access control.
//
let auth = jwt( {
                  secret: process.env.JWT_SECRET, 
                  algorithms: ["HS256"]
                } );


app.use( cors() );

// Install the top-level middleware "bodyparser"
// body-parser extracts the entire body portion of an incoming request stream 
// and exposes it on req.body
app.use( express.json( ) );

app.use( (req,res,next) => {
  console.log("------------------------------------------------".inverse)
  console.log("New request for: "+req.url );
  console.log("Method: "+req.method);
  next();
})

// Add API routes to express application
//

app.get("/", (req,res) => {

    res.status(200).json( { api_version: "1.0", endpoints: [ "/messages", "/tags", "/users", "/login" ] } ); // json method sends a JSON response (setting the correct Content-Type) to the client

});

app.get("/tags", auth, (req,res,next) => {

  let rediskey = "TAGS";
  rc.get(rediskey).then((cachedtags) => {
    
    if( cachedtags ) {
      console.log("REDIS "+"hit".green+" for "+rediskey );
      return res.status(200).json( JSON.parse(cachedtags) );

    } else {
      console.log("REDIS "+"miss".red+" for "+rediskey );

      message.getModel().distinct("tags").then((taglist) => {
        rc.set(rediskey, JSON.stringify(taglist) ).then( ()=>{console.log( rediskey + " added to REDIS cache" ) } );
        return res.status(200).json(taglist);
      }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
      })
    }
  });

});

app.route("/messages").get( auth, (req,res,next) => {

  var filter = {};
  if (req.query.tags) {
    filter = { tags: { $all: req.query.tags } };
  }
  console.log("Using filter: " + JSON.stringify(filter));
  console.log(" Using query: " + JSON.stringify(req.query));

  let skip = parseInt(req.query.skip as string || "0") || 0;
  let limit = parseInt(req.query.limit as string || "20") || 20;

  let rediskey = "QUERY" + JSON.stringify(filter) + JSON.stringify(skip) + JSON.stringify(limit);

  rc.get(rediskey).then((cachedquery) => {

    if (cachedquery) {
      console.log("REDIS " + "hit".green + " for " + rediskey);
      return res.status(200).json(JSON.parse(cachedquery));

    } else {
      console.log("REDIS " + "miss".red + " for " + rediskey);

      message.getModel().find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).then((documents) => {
        rc.set(rediskey, JSON.stringify(documents)).then(() => { console.log(rediskey + " added to REDIS cache") });
        return res.status(200).json(documents);
      }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
      })
    }

  })

}).post( auth, (req,res,next) => {

  console.log("Received: " + JSON.stringify(req.body) );

  var recvmessage = req.body;
  recvmessage.timestamp = new Date();
  recvmessage.authormail = req.auth.mail;

  if( message.isMessage( recvmessage ) ) {

    message.getModel().create( recvmessage ).then( async ( data ) => {

      // Invalidate redis caches
      rc.del("TAGS").then( ()=>{console.log( "TAGS REDIS cache invalidated" ) } );

      // Delete all cached queries (ie. keys starting with QUERY)
      for await (const key of rc.scanIterator({TYPE:'string', MATCH:'QUERY*'})) {
        await rc.del(key).then( ()=>{console.log( key+" key removed" ) } );
      }

      // Notify all socket.io clients
      ios.emit('broadcast', data );

      return res.status(200).json({ error: false, errormessage: "", id: data._id });
    }).catch((reason) => {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
    } )

  } else {
    return next({ statusCode:404, error: true, errormessage: "Data is not a valid Message" });
  }

});

app.delete( '/messages/:messageid', auth, (req,res,next) => {

  console.log("Delete request for message id: "+req.params.messageid )

  // Check moderator role
  if( !user.newUser(req.auth).hasModeratorRole() ) {
    return next({ statusCode:404, error: true, errormessage: "Unauthorized: user is not a moderator"} );
  }
  
  // req.params.messageid contains the :messageid URL component

  message.getModel().deleteOne( {_id: mongoose.Types.ObjectId(req.params.messageid) } ).then( 
    ( q )=> {
      if( q.deletedCount > 0 )
        return res.status(200).json( {error:false, errormessage:""} );
      else 
        return res.status(404).json( {error:true, errormessage:"Invalid message ID"} );
  }).catch( (reason)=> {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

});


app.get('/users', auth, (req,res,next) => {

  user.getModel().find( {}, {digest:0, salt:0} ).then( (users) => {
    return res.status(200).json( users );
  }).catch( (reason) => {
    return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

});


app.post('/users', (req,res,next) => {

    let u = user.newUser( req.body );
    if( !req.body.password ) {
      return next({ statusCode:404, error: true, errormessage: "Password field missing"} );
    }
    u.setPassword( req.body.password );

    u.save().then( (data) => {
      return res.status(200).json({ error: false, errormessage: "", id: data._id });
    }).catch( (reason) => {
      if( reason.code === 11000 )
        return next({statusCode:404, error:true, errormessage: "User already exists"} );
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason.errmsg });
    })

});


app.get('/users/:mail', auth, (req,res,next) => {

  let rediskey = "USER"+req.params.mail;
  rc.get( rediskey ).then( (cacheduser) => {

    if( cacheduser ) {
      console.log("REDIS "+"hit".green+" for "+rediskey );
      return res.status(200).json( JSON.parse(cacheduser) );

    } else {
      console.log("REDIS "+"miss".red+" for "+rediskey );

      user.getModel().findOne({ mail: req.params.mail }, { digest: 0, salt: 0 }).then((user) => {
        // Add to cache
        rc.set(rediskey, JSON.stringify(user) ).then( ()=>{console.log( rediskey + " added to REDIS cache" ) } );

        return res.status(200).json(user);
      }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
      })
    }

  }).catch( (err) => {
    console.log("REDIS error: ".red + JSON.stringify(err) );
  });

});



// Configure HTTP basic authentication strategy 
// trough passport middleware.
// NOTE: Always use HTTPS with Basic Authentication

passport.use( new passportHTTP.BasicStrategy(
  function(username, password, done) {

    // "done" callback (verify callback) documentation:  http://www.passportjs.org/docs/configure/

    // Delegate function we provide to passport middleware
    // to verify user credentials 

    console.log("New login attempt from ".green + username );
    user.getModel().findOne( {mail: username} , (err, user)=>{
      if( err ) {
        return done( {statusCode: 500, error: true, errormessage:err} );
      }

      if( !user ) {
        return done(null,false,{statusCode: 500, error: true, errormessage:"Invalid user"});
      }

      if( user.validatePassword( password ) ) {
        return done(null, user);
      }

      return done(null,false,{statusCode: 500, error: true, errormessage:"Invalid password"});
    })
  }
));


// Login endpoint uses passport middleware to check
// user credentials before generating a new JWT
app.get("/login", passport.authenticate('basic', { session: false }), (req,res,next) => {

  // If we reach this point, the user is successfully authenticated and
  // has been injected into req.user

  // We now generate a JWT with the useful user data
  // and return it as response

  let tokendata = {
    username: req.user.username,
    roles: req.user.roles,
    mail: req.user.mail,
    id: req.user.id
  };

  console.log("Login granted. Generating token" );
  let token_signed = jsonwebtoken.sign(tokendata, process.env.JWT_SECRET, { expiresIn: '1h' } );

  // Note: You can manually check the JWT content at https://jwt.io

  return res.status(200).json({ error: false, errormessage: "", token: token_signed });

});



// Add error handling middleware
app.use( function(err,req,res,next) {

  console.log("Request error: ".red + JSON.stringify(err) );
  res.status( err.statusCode || 500 ).json( err );

});


// The very last middleware will report an error 404 
// (will be eventually reached if no error occurred and if
//  the requested endpoint is not matched by any route)
//
app.use( (req,res,next) => {
  res.status(404).json({statusCode:404, error:true, errormessage: "Invalid endpoint"} );
})



// Connect to mongodb and launch the HTTP server trough Express
//
mongoose.connect( 'mongodb://mymongo:27017/postmessages' )
.then( 
  () => {

    console.log("Connected to MongoDB");

    return user.getModel().findOne( {mail:"admin@postmessages.it"} );
  }
).then(
  (doc) => {
    if (!doc) {
      console.log("Creating admin user");

      let u = user.newUser({
        username: "admin",
        mail: "admin@postmessages.it"
      });
      u.setAdmin();
      u.setModerator();
      u.setPassword("admin");
      return u.save()
    } else {
      console.log("Admin user already exists");
    }
  }
)
.then(
  () => {
    return message.getModel().countDocuments({})
  }
).then(
  (count) => {
    if (count == 0) {
      console.log("Adding some test messages into the database");
      let m1 = message
        .getModel()
        .create({
          tags: ["Tag1", "Tag2", "Tag3"],
          content: "Post 1",
          timestamp: new Date(),
          authormail: "admin@postmessages.it"
        });
      let m2 = message
        .getModel()
        .create({
          tags: ["Tag1", "Tag5"],
          content: "Post 2",
          timestamp: new Date(),
          authormail: "admin@postmessages.it"
        });
      let m3 = message
        .getModel()
        .create({
          tags: ["Tag6", "Tag10"],
          content: "Post 3",
          timestamp: new Date(),
          authormail: "admin@postmessages.it"
        });

      return Promise.all([m1, m2, m3]);
      }
    }
).then( ()=>{

    // Connect to REDIS
    rc.on("ready", () => {
      console.log("REDIS ready".green);
    })

    rc.on("error", (reason) => {
      console.log("REDIS error: ".red + reason);
    })

    console.log("Connecting to REDIS...");
    return rc.connect();
  
  }).then(      
  () => {
    let server = http.createServer(app);

    ios = io(server, {
      cors: {
        origin: "http://localhost:4200" // See: https://socket.io/docs/v4/handling-cors/#configuration
      }
    });

    ios.on('connection', function (client) {
      console.log("Socket.io client connected".green);
    });

    server.listen(8080, () => console.log("HTTP Server started on port 8080".green));

      // To start an HTTPS server we create an https.Server instance 
      // passing the express application middleware. Then, we start listening
      // on port 8443
      //
    /*
    https.createServer({
      key: fs.readFileSync('keys/key.pem'),
      cert: fs.readFileSync('keys/cert.pem')
    }, app).listen(8443);
    */
  }
).catch(
  (err) => {
    console.log("Error Occurred during initialization".red );
    console.log(err);
  }
)