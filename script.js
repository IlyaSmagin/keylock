function eventStore(context = window, name = "keyStateStore") {
  const store = {
    isLocked: false,
    isEditing: false,
    pressedKeySet: [],
    escapeKeySet: []
  };

  const backing = { ...store };

  Object.keys(store).forEach(prop => {
    let ref = `_${prop}`;
    backing[ref] = store[prop];
    Object.defineProperty(store, prop, {
      enumerable: true,
      configurable: true,
      get() {
        return backing[ref];
      },
      set(value) {
        const oldValue = backing[ref];  // Capture previous value
        backing[ref] = value;
        context.dispatchEvent(
          new CustomEvent(`${name}:${prop}`, {
            detail: { prop, value, oldValue }  // Include both
          })
        );
      }
    });
  });

  return store;
}
const state = eventStore();

//these functions are called from python backend
function set_escape_keys(keys_array) {
  state.escapeKeySet = keys_array;
}
function set_isLocked(isLocked) {
  state.isLocked = isLocked;
}
function update_keys_on_press(keys_array) {
  render_buttons_to(keys_array, "pressedKeySequence", "key-active");
  update_key_classes("add", keys_array, "key-active");
}

function update_keys_on_release(released_key, keys_array) {
  render_buttons_to(keys_array, "pressedKeySequence", "key-active");//update_buttons_in or separate function using removeChild()
  update_key_classes("remove", released_key, "key-active");
}
//end of backend interface (some functions below call python backend via window.pywebview.api. )

async function toggleLock() {
  const isLocked = state.isLocked;
  const lockButton = document.getElementById("lockToggle");
  if (lockButton.disabled) return;
  lockButton.disabled = true;

  const apiFn = isLocked ? startLocking : stopLocking;
  const expectedRes = isLocked ? "locked" : "unlocked";
  const nextButtonText = isLocked ? 'Unlock Keyboard' : 'Lock Keyboard';

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
  lockButton.setAttribute('aria-pressed', isLocked.toString());
  lockButton.classList.toggle('lock-active', isLocked);

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

function toggleEdit() {
  const editButton = document.getElementById("editEscapeSequence");
  const keysContainerNode = document.getElementById("escapeKeySequence");
  const inputContainerNode = document.getElementById("editEscapeSequenceInput")
  const isEditing = state.isEditing;

  if(isEditing) {
    editButton.textContent = "close"
    editButton.classList.add("key-escape");
    const inputField = document.getElementById("editEscapeInput");
    const keys_array = stringify_key_sequence("escapeKeySequence");
    keysContainerNode.style.display = "none";
    inputContainerNode.style.display = "flex";
    inputField.value = keys_array;
  } else { //remove duplication editButton.classList.toggle("key-escape", isEditing)
    editButton.textContent = "edit";
    editButton.classList.remove("key-escape");
    keysContainerNode.style.display = "flex";
    inputContainerNode.style.display = "none";
  }
}

async function saveEscapeSequence() {
    const inputField = document.getElementById("editEscapeInput");
    const userEscapeMonitorSequence = inputField.value;
    await window.pywebview.api.change_escape_keys(userEscapeMonitorSequence);//escapekeysequence is changed in py and calls set_escape_keys
    state.isEditing = false;
}

function stringify_key_sequence(containerId) {
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
  return keysString;
}

function highlight_escape_keys(keys_array, old_keys_array = []) {
  render_buttons_to(keys_array, "escapeKeySequence", "key-escape");
  update_key_classes("remove", old_keys_array, "key-escape");
  update_key_classes("add", keys_array, "key-escape");
}

function render_buttons_to(keys_array, containerId, keyClassName = "") {
  const containerNode = document.getElementById(containerId);

  const newNodes = [];

  keys_array.forEach((key, i) => {
    const newKbd = document.createElement("kbd");
    const escapedKey = CSS.escape(key);
    newKbd.textContent = escapedKey;
    newKbd.classList.add(keyClassName);
    newNodes.push(newKbd);

    const plusElement = document.createElement("span");
    plusElement.textContent = "+";
    newNodes.push(plusElement);
  });

  newNodes.pop();

  containerNode.replaceChildren(...newNodes);
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

function handleEditing() {
  if (!state.isLocked) {
    state.isEditing = !state.isEditing;
  } else {
    state.isEditing = false;
  }
}

document.getElementById("editEscapeSequence").addEventListener("click", handleEditing);
document.getElementById("lockToggle").addEventListener("click", () => (state.isLocked = !state.isLocked));
document.getElementById("saveEscapeSequence").addEventListener("click", saveEscapeSequence);

window.addEventListener('keyStateStore:isLocked', (e) => {
  const isLocked = e.detail.value;
  //window.pywebview.api.console('Lock state changed: '+isLocked+" obj: "+e.detail.prop);
  toggleLock();
});
window.addEventListener('keyStateStore:isEditing', (e) => {
  const isEditing = e.detail.value;
  //window.pywebview.api.console('Editing state changed: '+isEditing+" obj: "+e.detail.prop);
  toggleEdit();
});
window.addEventListener('keyStateStore:escapeKeySet', (e) => {
  const escapeKeySequence = e.detail.value;
  const oldEscapeKeySequence = e.detail.oldValue;
  //window.pywebview.api.console('Escape key sequence changed: '+escapeKeySequence+" old: "+oldEscapeKeySequence);
  highlight_escape_keys(escapeKeySequence, oldEscapeKeySequence);
});