let isLocked = false;

async function toggleLock() {

  const lockButton = document.getElementById("lockToggle");
  if (lockButton.disabled) return;
  lockButton.disabled = true;

  const apiFn = isLocked ? stopLocking : startLocking;
  const expectedRes = isLocked ? "unlocked" : "locked";
  const nextButtonText = isLocked ? 'Lock Keyboard' : 'Unlock Keyboard';

  let res;
  try {
    res = await apiFn();
  } catch (error) {
    console.error('API call failed:', error);
    await window.pywebview.api.console('API call failed:', error);
    lockButton.disabled = false;
    return;
  }

  if (res !== expectedRes) {
    console.error('API state mismatch:', res, 'expected:', expectedRes);
    await window.pywebview.api.console('API state mismatch:', res, 'expected:', expectedRes);
    lockButton.disabled = false;
    return;
  }

  lockButton.textContent = nextButtonText;
  lockButton.setAttribute('aria-pressed', !isLocked.toString());
  lockButton.classList.toggle('lock-active', !isLocked);
  isLocked = !isLocked;

  lockButton.disabled = false;

}

async function startLocking() {
  let res = await window.pywebview.api.start();
  update_listener_status(res);
  set_pressed_keys_placeholder("Monitoring key presses");
  return res;
}

async function stopLocking() {
  let res = await window.pywebview.api.stop();
  update_listener_status(res);
  set_pressed_keys_placeholder("Not monitoring key presses");
  return res;
}

function update_listener_status(status_string) {
  const status = document.getElementById("status");
  status.innerText = status_string;
  status.classList.toggle("statusLocked");
}

function set_pressed_keys_placeholder(string) {
  document.getElementById("lastPressed").innerText = string;
}

function update_keys_on_press(keys_array) {
  render_buttons_to(keys_array, "pressedKeySequence", "key-active");
  update_key_classes("add", keys_array, "key-active");
}

function update_keys_on_release(released_key, keys_array) {
  render_buttons_to(keys_array, "pressedKeySequence", "key-active");//update_buttons_in or separate function using removeChild()
  update_key_classes("remove", released_key, "key-active");
}

function highlight_escape_keys(keys_array) {
  update_key_classes("add", keys_array, "key-escape");
  render_buttons_to(keys_array, "escapeKeySequence", "key-escape");
}

function render_buttons_to(keys_array, containerId, keyClassName = "") {
  const containerNode = document.getElementById(containerId);
  
  const currentKbdNodes = Array.from(containerNode.querySelectorAll("kbd"));
  const currentKeys = currentKbdNodes.map(kbd => kbd.textContent);
  
  // Remove keys not in new array (and their "+" if applicable)
  currentKeys.forEach((key, idx) => {
    if (!keys_array.includes(key)) {
      const kbdNode = currentKbdNodes[idx];
      kbdNode.remove();
      
      const nextSibling = kbdNode.nextSibling;
      if (nextSibling && nextSibling.textContent === " + ") {
        nextSibling.remove();
      }
    }
  });
  
  // Append new keys at the end
  const newKeys = keys_array.filter(key => !currentKeys.includes(key));
  newKeys.forEach((newKey, i) => {
    const newKbd = document.createElement("kbd");

    newKey = CSS.escape(newKey);
    newKbd.textContent = newKey;
    newKbd.classList.add(keyClassName);
    
    containerNode.appendChild(newKbd);
    
    if (keys_array.length > 1 && i < newKeys.length - 1) {
      containerNode.appendChild(document.createTextNode(" + "));
    }
  });
}

function update_key_classes(action, keys_array, class_name) {
  keys_array.forEach(key => {
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

document.getElementById("lockToggle").addEventListener("click", toggleLock);