async function start() {
  let res = await window.pywebview.api.start();
  update_listener_status(res);
  set_pressed_keys_placeholder("No keys are pressed");
}
async function stop() {
  let res = await window.pywebview.api.stop();
  update_listener_status(res);
  set_pressed_keys_placeholder("Not monitoring key presses");
}
function update_listener_status(status_string) {
  document.getElementById("status").innerText = "is " + status_string;
}
function set_pressed_keys_placeholder(string) {
  document.getElementById("lastPressed").innerText = string;
}
async function update_pressed_keys(keys_string){
  // let debug = await window.pywebview.api.console(keys_string);
  document.getElementById("lastPressed").innerText = "Last pressed key is " + keys_string;

  keys_string.split(" + ").map(key => {
    key = CSS.escape(key);
    document.querySelectorAll(`kbd[data-key='${key}'], kbd[data-alt='${key}']`).
      forEach(triggeredClass =>
        triggeredClass.classList.toggle("key-active"))
  });
  }
async function update_keys_on_press(keys_string) {
  keys_string.split(" + ").map(key => {
    key = CSS.escape(key);
    document.querySelectorAll(`kbd[data-key='${key}'], kbd[data-alt='${key}']`).
      forEach(triggeredClass =>
        triggeredClass.classList.add("key-active"))
  });
}
async function update_keys_on_release(keys_string) {
  keys_string.split(" + ").map(key => {
    key = CSS.escape(key);
    document.querySelectorAll(`kbd[data-key='${key}'], kbd[data-alt='${key}']`).
      forEach(triggeredClass =>
        triggeredClass.classList.remove("key-active"))
  });
}
function highlight_escape_keys(keys_string) {
  keys_string.split(" + ").map(escape_key => {
    document.querySelectorAll(`kbd[data-key='${escape_key}'], kbd[data-alt='${escape_key}']`).
      forEach(triggeredClass =>
        triggeredClass.classList.add("key-escape"))
  });
}

document.getElementById("startBtn").addEventListener("click", start);
document.getElementById("stopBtn").addEventListener("click", stop);