export default {
  "+": function() {
    console.log(this.stackDown().add(this.stackDown()))
  }
}