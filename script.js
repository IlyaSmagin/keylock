let isLocked = false;
// remove global state
async function toggleLock() {
// calculate isLocked based on button aria-pressed state
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
    await window.pywebview.api.console('API call failed: '+error);
    lockButton.disabled = false;
    return;
  }

  if (res !== expectedRes) {
    console.error('API state mismatch:', res, 'expected:', expectedRes);
    await window.pywebview.api.console('API state mismatch: '+res+' expected: '+expectedRes);
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

function toggleEdit() {
  const editButton = document.getElementById("editEscapeSequence");
  let isEditing = editButton.textContent === "close";//messy
  const isLocked = document.getElementById("status").textContent === "locked";
  
  if(isLocked) return

  if(!isEditing) {
    editButton.textContent = "close"
    editButton.classList.add("key-escape");
  } else { //remove duplication
    editButton.textContent = "edit";
    editButton.classList.remove("key-escape");
    const keys_array = stringify_key_sequence("escapeKeySequence");
    document.getElementById("escapeKeySequence").replaceChildren();
    render_buttons_to(keys_array, "escapeKeySequence", "key-escape");
  }
}

async function stringify_key_sequence(containerId) {
  const containerNode = document.getElementById(containerId);
  const currentKbdNodes = Array.from(containerNode.querySelectorAll("kbd"));
  const keysStringArray = currentKbdNodes.map(keyNode => {
    let formattedKey = keyNode.textContent;
    if(keyNode.textContent.length > 1) {
      formattedKey = `<${formattedKey}>`;
    }
    return formattedKey;
  });
  const keysString = keysStringArray.join("+");

  //await window.pywebview.api.console('stringified keys:'+keysString);
  let ret = await window.pywebview.api.change_escape_keys(keysString);
  return keysStringArray;
}

function highlight_escape_keys(keys_array) {
  render_buttons_to(keys_array, "escapeKeySequence", "key-escape");
  update_key_classes("add", keys_array, "key-escape");
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
      if (nextSibling && nextSibling.textContent === "+") {
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
//check why no plused appended
    if ((keys_array.length > 0) && (i < newKeys.length - 1)) {
      plusElement = document.createElement("span");
      plusElement.textContent = "+";
      containerNode.appendChild(plusElement);
    }
  });

}

function update_key_classes(action, keys_array, class_name) {
  keys_array.forEach(key => {
    key = CSS.escape(key);
    const allCorrespondingKeys = document.querySelectorAll(`kbd[data-key='${key}'], kbd[data-alt='${key}']`);// add :scope

      allCorrespondingKeys.forEach(correspondingKey => {

        if (action === "add") {
          correspondingKey.classList.toggle(class_name, true);
        } else if (action === "remove") {
          correspondingKey.classList.toggle(class_name, false);
        } else {
          correspondingKey.classList.toggle(class_name);
        }
      });
  });
}

document.getElementById("lockToggle").addEventListener("click", toggleLock);
document.getElementById("editEscapeSequence").addEventListener("click", toggleEdit);