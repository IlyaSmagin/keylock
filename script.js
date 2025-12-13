async function start() {
  let res = await window.pywebview.api.start();
  document.getElementById("status").innerText = "is " + res;
  document.getElementById("currentlyPressed").innerText = "No keys are pressed";
}
async function stop() {
  let res = await window.pywebview.api.stop();
  document.getElementById("status").innerText = "is " + res;
  document.getElementById("currentlyPressed").innerText = "Not monitoring keys presses";
}
function update_pressed_keys(keys_string){
  document.getElementById("currentlyPressed").innerText = keys_string;
}

document.getElementById("startBtn").addEventListener("click", start);
document.getElementById("stopBtn").addEventListener("click", stop);