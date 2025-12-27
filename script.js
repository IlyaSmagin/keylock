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
  const status = document.getElementById("status");
  status.innerText = status_string;
  status.classList.toggle("statusLocked");
}

function set_pressed_keys_placeholder(string) {
  document.getElementById("lastPressed").innerText = string;
}

function update_keys_on_press(keys_string) {
  set_pressed_keys_placeholder("Last pressed key is " + keys_string);
  update_key_classes("add", keys_string, "key-active");
}

function update_keys_on_release(keys_string) {
  set_pressed_keys_placeholder("Last pressed key is " + keys_string);
  update_key_classes("remove", keys_string, "key-active");
}

function highlight_escape_keys(keys_string) {
  update_key_classes("add", keys_string, "key-escape");
}

function update_key_classes(action, keys_string, class_name) {
  keys_string.split(" + ").forEach(key => {
    key = CSS.escape(key);
    document.querySelectorAll(`kbd[data-key='${key}'], kbd[data-alt='${key}']`)
      .forEach(triggered_class => {
        if (action === "add") {
          triggered_class.classList.add(class_name);
        } else if (action === "remove") {
          triggered_class.classList.remove(class_name);
        }
      });
  });
}


document.getElementById("startBtn").addEventListener("click", start);
document.getElementById("stopBtn").addEventListener("click", stop);