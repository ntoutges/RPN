export default {
  "+": function() {
    this.stackUp( this.stackDown().add( this.stackDown() ) )
  },
  "-": function() {
    this.stackUp( this.stackDown().sub( this.stackDown() ) )
  },
  "*": function() {
    this.stackUp( this.stackDown().mul( this.stackDown() ) )
  },
  "/": function() {
    this.stackUp( this.stackDown().div( this.stackDown() ) )
  },
  "^": function() {
    this.stackUp( this.stackDown().pow( this.stackDown() ) )
  },
  
  "==": function() {
    this.stackUp(
      this.stackDown().equals( this.stackDown() )
    )
  }
}