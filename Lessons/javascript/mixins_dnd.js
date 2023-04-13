/***************************************************/
// Mixins example

function Character( name ) {
    this.name = function() { return name };
}

Character.prototype = (function() {
    var health = 100;
    var mana = 100;

    return {
        toString: function() { return "Character " + this.name() + " " + this.getHealth() + "/" + this.getMana() },
        getHealth: function( ) { return health; },
        getMana: function( ) { return mana; },
        takeDamage: function( amount ) { health = Math.max( health-amount, 0 ); },
        consumeMana: function( amount ) { mana = Math.max( mana-amount, 0 ); },
        isDead: function() { return health===0; }
    }
})()


var asSpellCaster = function() {
    this.magictype = this.magictype || "fire" 

    this.castSpell = function() {
        if( this.getMana() > 10 ) {
            console.log(this.name() + " is casting a spell!");
            this.consumeMana(10);
        }
    }
}

var asStealer = function() {
    this.steal = function() {
        if( this.getMana()>3 ) {
            console.log(this.name() + " is stealing an object...")
            this.consumeMana(3);
        }
    }
}

var asLockpicker = function() {
    this.lockpick = function() {
        if( this.getMana()>2 ) {
            console.log(this.name() + " is lockpiking...")
            this.consumeMana(2);
        }
    }
}

// Mage character definition
//
function Mage( name, type ) {
    this.magictype = type
    Character.apply( this, arguments )
}
Mage.prototype = Object.create( Character.prototype )
Mage.prototype.toString = function() { return Character.prototype.toString.apply(this) + " mage type " + this.magictype }
asSpellCaster.call( Mage.prototype )



// Thief character definition
//
function Thief( name ) {
    Character.apply( this, arguments )
}
Thief.prototype = Object.create( Character.prototype )
Thief.prototype.toString = function() { return Character.prototype.toString.apply(this) + " thief" };
asStealer.call( Thief.prototype )
asLockpicker.call( Thief.prototype )


// Bard character definition
//
function Bard( name ) {
    Character.apply( this, arguments )
}

Bard.prototype = Object.create(Character.prototype);
Bard.prototype.toString = function () { return Character.prototype.toString.apply(this) + " bard"; }

asSpellCaster.call( Bard.prototype )
asStealer.call( Bard.prototype )
Bard.prototype.sing = function () {
    console.log(this.name() + " is playing a song... ")
    this.consumeMana(1);
}




// Let's instantiate a few characters for testing

var m = new Mage( "Merlino", "ice" )
console.log(m.toString())

var r = new Thief( "Robin Hood")
console.log( r.toString() )

var b = new Bard("Pippo the bard")
console.log( b.toString() )


m.castSpell()
r.steal()
r.lockpick()

b.castSpell()
b.steal()
b.sing()
