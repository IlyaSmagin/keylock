async function start() {
  let res = await window.pywebview.api.start();
  update_listener_status(res);
  update_pressed_keys("No keys are pressed");
}
async function stop() {
  let res = await window.pywebview.api.stop();
  update_listener_status(res);
  update_pressed_keys("Not monitoring key presses");
}
function update_listener_status(status_string) {
  document.getElementById("status").innerText = "is " + status_string;
}
function update_pressed_keys(keys_string){
  document.getElementById("lastPressed").innerText = "Last pressed key is " + keys_string;
  keys_string.split(" + ").map(key =>
    document.querySelectorAll(".key-"+keys_string).forEach(triggeredClass =>
      triggeredClass.classList.toggle("key-active"))
  );
  }

document.getElementById("startBtn").addEventListener("click", start);
document.getElementById("stopBtn").addEventListener("click", stop);