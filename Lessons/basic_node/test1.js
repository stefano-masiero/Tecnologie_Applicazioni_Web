// Function import using CommonJS modules syntax
const hello_module = require('./sayhello')


for( var i=0; i<10; ++i ) {
    hello_module.sayhello()
}
