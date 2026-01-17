const LITERALS = Object.freeze({
  IDS: Object.freeze({
    LOCK_TOGGLE: "lockToggle",
    EDIT_ESCAPE_SEQ: "editEscapeSequence",
    SAVE_ESCAPE_SEQ: "saveEscapeSequence",
    ESCAPE_SEQ: "escapeKeySequence",
    EDIT_ESCAPE_INPUT_WRAPPER: "editEscapeSequenceInput",
    EDIT_ESCAPE_INPUT: "editEscapeInput",
    PRESSED_SEQ: "pressedKeySequence",
    STATUS: "status",
    LAST_PRESSED: "lastPressed"
  }),
  CLASSES: Object.freeze({
    KEY_ACTIVE: "key-active",
    KEY_ESCAPE: "key-escape",
    LOCK_ACTIVE: "lock-active",
    STATUS_LOCKED: "statusLocked"
  }),
  BUTTON_TEXT: Object.freeze({
    LOCK: "Lock Keyboard",
    UNLOCK: "Unlock Keyboard",
    EDIT: "edit",
    CLOSE: "close"
  }),
  STATUS: Object.freeze({
    MONITORING: "Monitoring key presses",
    NOT_MONITORING: "Not monitoring key presses"
  }),
  API_RESULTS: Object.freeze({
    LOCKED: "locked",
    UNLOCKED: "unlocked"
  }),
  SEPARATORS: Object.freeze({
    PLUS: "+"
  }),
  STATE: "keyStateStore"
});

function eventStore(context = window, name) {
  name = name ?? LITERALS.STATE;

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
        const oldValue = backing[ref]; // Capture previous value
        backing[ref] = value;
        context.dispatchEvent(
          new CustomEvent(`${name}:${prop}`, {
            detail: { prop, value, oldValue } // Include both
          })
        );
      }
    });
  });

  return store;
}
const state = eventStore();

// these functions are called from python backend
function set_escape_keys(keys_array) {
  state.escapeKeySet = keys_array;
}
function set_isLocked(isLocked) {
  state.isLocked = isLocked;
}
function update_keys_on_press(keys_array) {
  render_buttons_to(keys_array, LITERALS.IDS.PRESSED_SEQ, LITERALS.CLASSES.KEY_ACTIVE);
  update_key_classes("add", keys_array, LITERALS.CLASSES.KEY_ACTIVE);
}

function update_keys_on_release(released_key, keys_array) {
  render_buttons_to(keys_array, LITERALS.IDS.PRESSED_SEQ, LITERALS.CLASSES.KEY_ACTIVE); // update_buttons_in or separate function using removeChild()
  update_key_classes("remove", released_key, LITERALS.CLASSES.KEY_ACTIVE);
}
// end of backend interface (some functions below call python backend via window.pywebview.api.)

async function toggleLock() {
  const isLocked = state.isLocked;
  const lockButton = document.getElementById(LITERALS.IDS.LOCK_TOGGLE);
  if (lockButton.disabled) return;
  lockButton.disabled = true;

  const apiFn = isLocked ? startLocking : stopLocking;
  const expectedRes = isLocked ? LITERALS.API_RESULTS.LOCKED : LITERALS.API_RESULTS.UNLOCKED;
  const nextButtonText = isLocked ? LITERALS.BUTTON_TEXT.UNLOCK : LITERALS.BUTTON_TEXT.LOCK;

  let res;
  try {
    res = await apiFn();
  } catch (error) {
    console.error('API call failed:', error);
    await window.pywebview.api.console('API call failed: ' + error);
    lockButton.disabled = false;
    return;
  }

  if (res !== expectedRes) {
    console.error('API state mismatch:', res, 'expected:', expectedRes);
    await window.pywebview.api.console('API state mismatch: ' + res + ' expected: ' + expectedRes);
    lockButton.disabled = false;
    return;
  }

  lockButton.textContent = nextButtonText;
  lockButton.setAttribute('aria-pressed', isLocked.toString());
  lockButton.classList.toggle(LITERALS.CLASSES.LOCK_ACTIVE, isLocked);

  lockButton.disabled = false;
}

async function startLocking() {
  let res = await window.pywebview.api.start();
  update_listener_status(res);
  set_pressed_keys_placeholder(LITERALS.STATUS.MONITORING);
  return res;
}

async function stopLocking() {
  let res = await window.pywebview.api.stop();
  update_listener_status(res);
  set_pressed_keys_placeholder(LITERALS.STATUS.NOT_MONITORING);
  return res;
}

function update_listener_status(status_string) {
  const status = document.getElementById(LITERALS.IDS.STATUS);
  status.innerText = status_string;
  status.classList.toggle(LITERALS.CLASSES.STATUS_LOCKED);
}

function set_pressed_keys_placeholder(string) {
  document.getElementById(LITERALS.IDS.LAST_PRESSED).innerText = string;
}

function toggleEdit() {
  const editButton = document.getElementById(LITERALS.IDS.EDIT_ESCAPE_SEQ);
  const keysContainerNode = document.getElementById(LITERALS.IDS.ESCAPE_SEQ);
  const inputContainerNode = document.getElementById(LITERALS.IDS.EDIT_ESCAPE_INPUT_WRAPPER);
  const isEditing = state.isEditing;

  if (isEditing) {
    editButton.textContent = LITERALS.BUTTON_TEXT.CLOSE;
    editButton.classList.add(LITERALS.CLASSES.KEY_ESCAPE);
    const inputField = document.getElementById(LITERALS.IDS.EDIT_ESCAPE_INPUT);
    const keys_array = stringify_key_sequence(LITERALS.IDS.ESCAPE_SEQ);
    keysContainerNode.style.display = "none";
    inputContainerNode.style.display = "flex";
    inputField.value = keys_array;
  } else { // TODO remove duplication editButton.classList.toggle("key-escape", isEditing)
    editButton.textContent = LITERALS.BUTTON_TEXT.EDIT;
    editButton.classList.remove(LITERALS.CLASSES.KEY_ESCAPE);
    keysContainerNode.style.display = "flex";
    inputContainerNode.style.display = "none";
  }
}

async function saveEscapeSequence() {
  const inputField = document.getElementById(LITERALS.IDS.EDIT_ESCAPE_INPUT);
  const userEscapeMonitorSequence = inputField.value;
  await window.pywebview.api.change_escape_keys(userEscapeMonitorSequence); // escapekeysequence is changed in py and calls set_escape_keys
  state.isEditing = false;
}

function stringify_key_sequence(containerId) {
  const containerNode = document.getElementById(containerId);
  const currentKbdNodes = Array.from(containerNode.querySelectorAll("kbd"));
  const keysStringArray = currentKbdNodes.map(keyNode => {
    let formattedKey = keyNode.textContent;
    if (keyNode.textContent.length > 1) {
      formattedKey = `<${formattedKey}>`;
    }
    return formattedKey;
  });
  const keysString = keysStringArray.join(LITERALS.SEPARATORS.PLUS);

  // await window.pywebview.api.console('stringified keys:'+keysString);
  return keysString;
}

function highlight_escape_keys(keys_array, old_keys_array = []) {
  render_buttons_to(keys_array, LITERALS.IDS.ESCAPE_SEQ, LITERALS.CLASSES.KEY_ESCAPE);
  update_key_classes("remove", old_keys_array, LITERALS.CLASSES.KEY_ESCAPE);
  update_key_classes("add", keys_array, LITERALS.CLASSES.KEY_ESCAPE);
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
    plusElement.textContent = LITERALS.SEPARATORS.PLUS;
    newNodes.push(plusElement);
  });

  newNodes.pop();

  containerNode.replaceChildren(...newNodes);
}

function update_key_classes(action, keys_array, class_name) {
  keys_array.forEach(key => {
    key = CSS.escape(key);
    const selector = `kbd[data-key='${key}'], kbd[data-alt='${key}']`;
    const allCorrespondingKeys = document.querySelectorAll(selector); // add :scope

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

document.getElementById(LITERALS.IDS.EDIT_ESCAPE_SEQ)
  .addEventListener("click", handleEditing);
document.getElementById(LITERALS.IDS.LOCK_TOGGLE)
  .addEventListener("click", () => (state.isLocked = !state.isLocked));
document.getElementById(LITERALS.IDS.SAVE_ESCAPE_SEQ)
  .addEventListener("click", saveEscapeSequence);

window.addEventListener(`${LITERALS.STATE}:isLocked`, (e) => {
  // const isLocked = e.detail.value; window.pywebview.api.console('Lock state changed: '+isLocked+" obj: "+e.detail.prop);
  toggleLock();
});
window.addEventListener(`${LITERALS.STATE}:isEditing`, (e) => {
  //const isEditing = e.detail.value; window.pywebview.api.console('Editing state changed: '+isEditing+" obj: "+e.detail.prop);
  toggleEdit();
});
window.addEventListener(`${LITERALS.STATE}:escapeKeySet`, (e) => {
  const escapeKeySequence = e.detail.value;
  const oldEscapeKeySequence = e.detail.oldValue;
  // window.pywebview.api.console('Escape key sequence changed: '+escapeKeySequence+" old: "+oldEscapeKeySequence);
  highlight_escape_keys(escapeKeySequence, oldEscapeKeySequence);
});