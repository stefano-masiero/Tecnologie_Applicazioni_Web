/************************************************/
// Symbols

let strname = "a";
let symname = Symbol();

let o = {};
o[strname] = "test";
o[symname] = "test_sym";
console.log( o[strname] );
console.log( o[symname] );
console.log( Object.keys( o ) ); // Symbols are a good way to implement "private" properties

/**/

/************************************************
// Hoisting
{
    console.log(a);
    //let a = 10;
    if( true ) {
        var a = 20;
    }
    console.log(a);
}



/************************************************
// Prototypes
let a = {title:"Javascript", pages:20 }
let arr = new Array();

// Prototype of any object can be retrieved using
// the static method Object.getPrototypeOf(..)
console.log( Object.getPrototypeOf(a) );    // Object.prototype
console.log( Object.getPrototypeOf(arr) );  // Array.prototype

// Method isPrototypeOf can be used to check
// if one object is a prototype of another one
console.log( Object.prototype.isPrototypeOf(a) );
console.log( Object.prototype.isPrototypeOf(arr) );
console.log( Array.prototype.isPrototypeOf(arr) );
console.log( Array.prototype.isPrototypeOf(a) );

/**/

/************************************************
// Object property override

let unitcircle = {
    radius: 1
};

let c = Object.create( unitcircle );
console.log(c.radius);     // c inherits the radius property
c.x = 10;                  // properties added to c
c.y = 20;
console.log( c.x );
c.radius = 20;             // c overrides its inherited property
console.log( c.radius );
console.log( unitcircle.radius );

/**/

/************************************************
// Conditional declaration test (works on Node and Chrome,
// fails in some browser implementations). In strict mode
// the conditional declaration throws an exception
//

(function(){
    'use strict'
    var score=10;

    if( score>18 )
    {
        function evaluate() {
            console.log( "Exam passed");
        }
    }
    else
    {
        function evaluate() {
            console.log( "Exam not passed");
        }
    }

    // Note that a function declaration creates a new
    // variable (object) in the current scope (named as the
    // function name) with a property called "name" containing
    // the function name (useful to debug)
    evaluate();
}())

/**/

/************************************************
// Function Hoisting test

function function_hoisting()
{
    a(); // Prints "Hello" even if a has not been declared yet

    //{
    function a()
    {
        console.log("Hello");
    }
    //}
    //let a = function() { console.log("Hello"); }
}

function_hoisting();


/************************************************
// this test

// in browser, this refer to window object if invoked in global scope

function f() {
    console.log(this); // object of type "global"
}


f();

function f2() {
    "use strict";
    console.log(this); // undefined
}

f2();

let o = {
    prop: 10,
    f: function() { return this.prop; } // function invoked as method
}
console.log( o.f() );

// "this" in the prototype chain refers to the object on which the
// method is invoked, not the object that actually contains the method
let o2 = Object.create(o);
o2.prop = 20;
console.log( o2.f() );

function printprop() {
    console.log(this.prop);
};

// When call is used, this refer to the object passed as the first argument
printprop.call( o );



// When using arrow functions, the this keyword is inherited from the environment 
// in which the arrow function is defined rather than when is invoked: lexical this

function TestObject1() {
    this.x = 5;
    this.getx = () => { return this.x } // here we use the arrow function
}
function TestObject2() {
    this.x = 7;
    this.getx = function()  { return this.x } // here we use the classic JS function definition
}

let o3 = new TestObject1();
let o4 = new TestObject2();

console.log( o3.getx() )
console.log( o4.getx() )

let o5 = {
    x: 100,
    getx: o3.getx
}
let o6 = {
    x: 100,
    getx: o4.getx
}

console.log( o5.getx() ) // Prints 5 because this in the arrow function refers to o3, not o5!
console.log( o6.getx() ) // Prints 100

/**/


/************************************************
// Closures

let scope = "global scope";
function checkscope() {
	let scope = "local scope";
	function f() { return scope; }
	return f;
}
console.log( checkscope()() );


// A couple of useful idioms using closures

// 1) Singleton
let unique_integer = (function() {
    let counter = 0;
    return function() { return counter++; }
})();

console.log( unique_integer() );
console.log( unique_integer() );
console.log( unique_integer() );

// 2) Closure used to implement private variables
console.log("---")

function counter() {
    let n=0;  // private variable we want to hide
    return {
        count: function() { return n++; }, // Both count and reset share the same scope (variable n is shared)
        reset: function() { n=0; }
    };
}

// Every counter() invocation creates a new scope chain. Variable n is private in each chain
let a = counter();
let b = counter();

// Two counters are independent. Each function have a different scope chain, one for each
// invocation of counter()
console.log( a.count() );
console.log( b.count() );
b.reset();
console.log( a.count() );
console.log( b.count() );

/**/

/************************************************
// Class constructor

// Suppose we want to create a class "Range" describing a range
// of values. We start by defining a constructor (which is just a JavaScript function)

function Range( from, to ) {
    // When Range is invoked with new, this will refere to the newly created object.
    // NOTE: if we call Range() without new we will pollute the global object (so it
    // is a good idea to use strict mode for constructors)
    'use strict'
    this.from = from;
    this.to = to;
}

// Since Range function is also an object, it has the "prototype" property.
// By modifying the function prototype we can define all the properties of
// all the instances of class Range
Range.prototype = {

    includes:  function( x ) {
        // Returns true if x is in range
        return this.from <= x && x <= this.to;
    },

    foreach: function( f ) {
        // Invokes f for each element in the range
        for( var i=this.from; i<=this.to; ++i )
            f(i);

    },

    toString: function() {
        return "Range [" + this.from + " ... " + this.to + "]";
    }
}

// Some tests
let r = new Range(1,5); // <-- we use new to create a new instance of Range class
console.log(r.includes(3) );
console.log( r.toString() );
r.foreach( console.log );


// The identity of a class depends by the object prototype, not the constructor
// used to build it. Two objects can be instance of the same class even if they
// have been built with different constructors but have the same prototype
function RangeDefault() {
    'use strict'
    this.from = 0;
    this.to = 10;
}
RangeDefault.prototype = Range.prototype;

let rd = new RangeDefault();
console.log( rd.toString() );
console.log( rd instanceof Range ); // true
console.log( Range.prototype.isPrototypeOf(rd) ); // true


// Here we demonstrate that we can dynamically add methods or properties to
// all the existing objects of a class

let s = "test"; // First we instantiate a new String

String.prototype.strWithSpaces = function() {
    // Then we add a new method to all the strings
    var out ="";

    for (var idx=0; idx<this.length; ++idx ) {
        out = out + this[idx] + " ";
    }

    return out;
}

// Object s, instantiated before our modification, dinamically acquires
// the new method
console.log( s.strWithSpaces() )

/**/
/************************************************
// Public and private properties

// Let's modify the Range class to let from and to
// properties private

function Range( from, to ) {

    // The basic idea is to use closures instead

    this.from = function() { return from; }
    this.to = function() { return to; }
}

// We also modify the Range methods
Range.prototype = {

    includes:  function( x ) {
        return this.from() <= x && x <= this.to();
    },

    foreach: function( f ) {
        for( let i=this.from(); i<=this.to(); ++i )
            f(i);

    },
    toString: function() {
        return "Range [" + this.from() + " ... " + this.to() + "]";
    }
}

let r = new Range(1,5);
console.log(r.includes(3) );
console.log( r.toString() );

// WARNING: from and to properties behave as private but the whole object
// remain mutable unless we use specific ES5 features to let the properties
// being immutables

r.from = function() { return 3; }
console.log( r.toString() );

/**/


/************************************************
// Subclassing
// We create a class RangeStep to represent a range of values
// with a certain step (ex: RangeStep(2,8,2) = [2 4 6 8])

function Range( from, to ) {
    this.from = function() { return from; }
    this.to = function() { return to; }
}
Range.prototype = {

    includes:  function( x ) {
        return this.from() <= x && x <= this.to();
    },
    foreach: function( f ) {
        for( let i=this.from(); i<=this.to(); ++i )
            f(i);

    },
    toString: function() {
        return "Range [" + this.from() + " ... " + this.to() + "]";
    }
}

function RangeStep( from, to, step) {
    Range.apply( this, arguments ); //super(arguments)
    this.step = function() { return step; };
}

RangeStep.prototype = Object.create(Range.prototype);  // the actual subclassing operation.
                                                       // Object.create creates a new object with Range.prototype as prototype

// Override some methods
RangeStep.prototype.toString = function() {
    let out = "Range: [ ";
    for( let i=this.from(); i<this.to(); i+=this.step() ) {
        out = out + i + " ";
    }
    out = out + this.to() + " ]";
    return out;
}

RangeStep.prototype.includes = function(x) {
    // We use call() to invoke the superclass
    return Range.prototype.includes.call(this,x) && (x-this.from())%this.step() == 0 || x==this.to() ;
}

let rs = new RangeStep( 2, 9, 2 );
console.log( rs.toString() );
for( let ii=0; ii<12; ++ii ) {
    console.log(ii + ") " + rs.includes(ii) );
}

/**/
/***********************************************
// JavaScript classes

class Range {
    constructor( from, to ) {
        this.from = from;
        this.to = to;
    }
    
    includes( x ) {
        return this.from <= x && x <= this.to;
    }
    foreach( f ) {
        for( var i=this.from; i<=this.to; ++i )
            f(i);
    }

    toString() {
        return "Range [" + this.from + " ... " + this.to + "]";
    }
}

class RangeStep extends Range {
    constructor( from, to, step ) {
        super( from, to )
        this.step = step
    }

    // method override
    toString() {
        let out = "Range: [ ";
        for (let i = this.from; i < this.to; i += this.step) {
            out = out + i + " ";
        }
        out = out + this.to + " ]";
        return out;
    }

}
let r = new Range(1,5);
console.log( r.includes(2) );
console.log( r.toString() );

let rs = new RangeStep(2, 9, 2);
console.log( rs.toString() );


/**/