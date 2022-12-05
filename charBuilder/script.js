var boxes = document.getElementsByClassName("boxes");

var isMouseDown = false;
var setTo = true;

xprt();
document.addEventListener("mouseup", () =>    { isMouseDown = false; })
document.addEventListener("mouseleave", () => { isMouseDown = false; })

for (var box of boxes) {
  box.addEventListener("mousemove", function() {
    if (isMouseDown) setBox.call(this);
  });

  box.addEventListener("mousedown", function() {
    isMouseDown = true;
    setTo = !this.classList.contains("active");
    setBox.call(this);
  });
}

function setBox() {
  const oldC = this.classList.contains("active");
  if (setTo) this.classList.add("active");
  else this.classList.remove("active");

  if (oldC != this.classList.contains("active")) xprt();
}

function xprt() {
  var out = "[" + "\n";
  for (var i = 0; i < boxes.length; i += 5) {
    out += "\t\"";
    for (var j = 0; j < 5; j++) {
      out += boxes[i+j].classList.contains("active") ? "|" : " ";
    }
    out += "\"" + ((i+5 < boxes.length) ? "," : "") + "\n";
  }
  out += "]";
  document.getElementById("output").value = out;
  document.getElementById("inlineOutput").value = out.replace(/[\t\n]/g, "") + ","
}

document.getElementById("output").addEventListener("click", function() { copyToClipboard(this); });
document.getElementById("inlineOutput").addEventListener("click", function() { copyToClipboard(this); });

document.body.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.keyCode == 83) {
    event.preventDefault();
    copyToClipboard(document.getElementById("output"));
  }
});

function copyToClipboard(txt) {
  txt.select();
  txt.setSelectionRange(0,999999999999);
  
  navigator.clipboard.writeText(txt.value);
}