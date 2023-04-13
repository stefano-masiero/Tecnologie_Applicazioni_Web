/***************************************************
// JavaScript file is a valid typescript file.

var radius = 4; // TS infers that radius has type Number
var area = Math.PI * radius * radius;
area = "ciao";


/**/

/***************************************************
// Type annotation


var myname: string = 'Filippo';
var heightInCentimeters: number = 87.3;
var isActive: boolean = true;

// array type annotation
var names: string[] = ['James', 'Nick', 'Rebecca', 'Lily'];

// function annotation with parameter type annotation and return type annotation
var sayHello: (name: string) => string;

// implementation of sayHello function
sayHello = function (name: string) {
    return 'Hello ' + name;
};

sayHello = function() { // Invalid function implementation
    console.log("Hello"); 
} 

// object type annotation
var person: { name: string; heightInCentimeters: number; };
// Implementation of a person object
person = {
  name: "Mark",
  heightInCentimeters: 183,
};

var a: any;  // Special type "any" denotes a dynamic type
a = "test";
a = 3;

/**/

/***************************************************
// Enumerations

enum BoxSize {
    Small,
    Medium
};

var size = BoxSize.Small;
console.log( BoxSize[size] );

    
// Enumerations are open-ended:
enum BoxSize {
    Large = 2,
    XLarge,
    XXLarge
}

// Now BoxSize enumeration contains { Small, Medium, Large, XLarge, XXLarge }
console.log( BoxSize[ BoxSize.XXLarge ] );

/**/


/***************************************************
// functions

function repeat_string(str: string, n: number ): string {
    var outstr: string = "";
    while( n-->0 ) {
        outstr = str + " " + outstr;
    }
    return outstr;
}
console.log( repeat_string("Hello", 3) );


function repeat_string2(str: string, n: number, sepstr?: string ): string {  // sepstr parameter is optional
    var outstr: string = "";
    var sepstr: string = sepstr || "";
    while( n-->0 ) {
        outstr = str + sepstr + outstr;
    }
    return outstr;
}
console.log( repeat_string2("Hello",3,'-') );


var curr_separator: string = "_";
function repeat_string3(str: string, n: number, sepstr=curr_separator ): string {  // sepstr has a default value whose type is automatically inferred 
    var outstr: string = "";
    var sepstr: string = sepstr || "";
    while( n-->0 ) {
        outstr = str + sepstr + outstr;
    }
    return outstr;
}
console.log( repeat_string3("Hello",4) );


/**/


/***************************************************
// REST parameter

function getAverage( ...a: number[] ): number { 
    var total = 0;
    var count = 0;
    for (var i = 0; i < a.length; i++) {
      total += a[i];
      count++;
    }
   return total / count;
}

var result = getAverage(2, 4, 6, 8, 10); // the average is 6
console.log(result);

/**/


/***************************************************
// Function Overload


function getAverage(a: string, b: string, c: string): number; 
function getAverage(a: number, b: number, c: number): number; 

// Implementation:
function getAverage(a: any, b: any, c: any): number {
    var total = parseInt(a, 10) + parseInt(b, 10) + parseInt(c, 10);
    return total / 3;
}

var result = getAverage(4, 2, 8); // 5
console.log(result);
var result = getAverage("4", "3", "8"); // 5
console.log(result);

/**/


/***************************************************
// Interface

interface Point {
    x: number;
    y: number; 
}

interface Passenger {
    name: string;
}

interface Vehicle {
    // Constructor
    new() : Vehicle;
    
    // Properties
    currentLocation: Point;

    // Methods
    travelTo(point: Point);
    addPassenger(passenger: Passenger);
    removePassenger(passenger: Passenger);
}

// NOTE: Interfaces do not result in any Javascript code generated.
// their only purpose is to provide type checking

// interfaces are open-ended and hence new methods/properties can
// be added after the initial definition

interface Passenger {
    age: number;
}

var passengers : Passenger[];
passengers.push( {name: "Filippo", age: 33} );

/**/

/***************************************************
// Type assertions and structural subtyping

interface A {
    bar: number;
    bas: string;
}
var a1 = {};
//a1.bar = 123;  // wrong because the bar property do not exist in an empty object. Empty object and "A" are not compatible
//a1.bas = 'hello';

var a2 = <A>a1; 
//var a2 = a1 as A; // you can also use this notation
a2.bar = 123;

// Type compatibility in TypeScript is based on structural subtyping

interface AA {
    bar: number;
    //bas: string;
}
var a3: AA = a2;    // This assignment is allowed even if a2 and a3 have
                    // two different types. Indeed, the two types are compatible:
                    // "AA" has all the members of "A"
/**/

/***************************************************
// Classes

class Greeter {
  greeting: string;

  constructor(message: string) {
    this.greeting = message; // "this" is used to access class members
  }

  // Methods are defined similar to functions but without the "function" keyword
  // methods and properties are assumed to be public if no modifier is used
  greet() {
    return "Hello, " + this.greeting;
  }
}
let greeter = new Greeter("world");
console.log( greeter.greet() );

/**/

/***************************************************
// Class inheritance

interface Movable {
    move( distanceInMeters: number ) : void;
}

class Animal implements Movable { // implements is used to implement interfaces
    name: string;
    constructor(_name: string) { this.name = _name; }

    move(distanceInMeters: number = 0) {
        console.log(this.name + " moved " + distanceInMeters + "m.");
    }
}

class Snake extends Animal { // extends is used to define subclasses
    constructor(name: string) {
        super(name); // super _must_ be called in subclass constructor
    }
    move(distanceInMeters = 5) { // Method override
        console.log("Slithering...");
        super.move(distanceInMeters);
    }
}

var s: Snake = new Snake("Alex");
s.move(10);
/**/

/***************************************************/
// Class modifiers, parameter properties, getters setters

class Person {
    protected name: string;
    protected constructor(theName: string) { this.name = theName; }
}

// Employee can extend Person
class Employee extends Person {
    readonly office_number: number; // Readonly properties are public properties that can only be set in class constructor
    
    constructor(name: string, private department: string, _offnum: number = 10) { 
        // The private modifier in constructor parameters adds a new property
        // in the class with the specified access modifier (private in this case)
        super(name);
        //this.department = department;  <- class properties are assigned automatically 
        this.office_number = _offnum;
    }

    public indroduce_myself() {
        console.log( "Hello, my name is " + this.name + " and I work at " + this.department );
    }

    get employee_name() { return this.name; }
    set employee_name( newname: string ) { 
        this.name = newname[0].toLocaleUpperCase() + newname.substr(1).toLocaleLowerCase(); 
    }
}

var e : Employee = new Employee("Filippo", "DAIS");
e.indroduce_myself();
e.employee_name = "mario";
e.indroduce_myself();

/**/

/***************************************************
// Generics

// We define a generic function reverse in which we refer
// to a generic type T. Using generics is more powerful than
// just using "any". For instance, we can force the fact that
// the return type of reverse is the same as the input type, and
// both must be arrays
//

function reverse<T>(list: T[]) : T[] { 
    var reversedList: T[] = [];
    for (var i = list.length - 1; i >= 0; i--) {
      reversedList.push(list[i]);
    }
    return reversedList;
}

var letters = ['a', 'b', 'c', 'd'];
var reversedLetters = reverse<string>(letters); // d, c, b, a
console.log( reversedLetters );
var numbers = [1, 2, 3, 4];
var reversedNumbers = reverse<number>(numbers); // 4, 3, 2, 1
console.log( reversedNumbers );




// Generic interfaces and classes

interface Collection<T, TId> {  
    // T is the type of the collection, TId is the type of
    // the id property of each element of the collection

    getById(id: TId): T;  // Get an element of the collection given an Id
    persist(model: T): TId; // Save a new element and obtain ad Id
}


class CustomerId {  // Class representing the Id of a customer (a pair of numbers in this case)
  constructor(public v1: number = undefined, public v2: number = undefined ) {}
  get value() {
    return [this.v1, this.v2];
  }
  set value( v: number[] ) {
      this.v1 = v[0];
      this.v2 = v[1];
  }
}

class Customer { // Class representing a customer
    constructor( public name: string, public id: CustomerId = new CustomerId() ) {
    }
}

class CustomerArrayCollection implements Collection<Customer, CustomerId> {
  constructor(private customers: Customer[]) {}
  getById(id: CustomerId) {
    return this.customers[ id.value[0] ];
  }
  persist(customer: Customer) {
      customer.id.value = [ this.customers.push(customer)-1, 123 ];
      return customer.id;
  }
}

var c : CustomerArrayCollection = new CustomerArrayCollection( [] );
var cid1 = c.persist( new Customer("Filippo") );
var cid2 = c.persist( new Customer("Mario") );

console.log( c.getById( cid1 ) );


// Generics with type constraints 

interface HasName {
    name: string;
}
function greet<T extends HasName>(obj: T): string {
  return "Hello " + obj.name;
}

class A implements HasName {
    id: number;
    constructor( public name:string ) {
        this.id = 0;
    }
}
class B { // Thanks to structural subtyping, this also works if we not explicitly define 
          // that B implements HasName 
    constructor( public name:string, public surname:string ) {
    }
}

console.log( greet( new A("Filippo") ) );
console.log( greet( new B("Filippo","Bergamasco") ) );

/**/