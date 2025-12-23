from pynput import keyboard
import webview
import os
import json

# keyboard.Key.ctrl_l
# keyboard.KeyCode.from_char("q")
# https://pynput.readthedocs.io/en/latest/keyboard.html
escape_keys = {keyboard.Key.esc, keyboard.KeyCode.from_char("m")}
pressed_keys = set()
listener = None
listener_running = False

def format_keys(keys):
    pressed_keys_names = []
    for key in keys:
        if hasattr(key, "char") and key.char:
            pressed_keys_names.append(key.char)
        elif (hasattr(key, "name")):
            pressed_keys_names.append(key.name)
        else:
            pressed_keys_names.append("unknown key")
    formatted_keys = " + ".join(pressed_keys_names)
    return formatted_keys

def on_press(key):
    pressed_keys.add(key)
    print("You pressed:", format_keys(pressed_keys))
    #as listener stops immediatly after add some delay to display that escape keys were pressed
    api.update_keys_on_press(format_keys(pressed_keys))
    if (escape_keys.issubset(pressed_keys)):
        api.update_keys_on_release(format_keys(pressed_keys))
        api.stop_from_backend()

def on_release(key):
    if key in pressed_keys:
        api.update_keys_on_release(format_keys([key]))
        pressed_keys.remove(key)

def start_listener():
    global listener, listener_running
    if listener_running:
        return "already running"
    listener_running = True
    listener = keyboard.Listener(on_press=on_press, on_release=on_release, suppress=True)
    listener.start()
    print("Listener started")
    return "started"

def stop_listener():
    global listener, listener_running
    if listener is not None:
        listener.stop()
        pressed_keys.clear()
        listener_running = False
        print("Listener stopped")
        return "stopped"
    print("Listener not running")
    return "not running"

def on_starting():
    global escape_keys
    print("Window is opening...")
    api.highlight_escape_keys(format_keys(escape_keys))

def on_closing():
    print("Window is closing, stopping listener...")
    stop_listener()

class Api:
    def start(self):
        return start_listener()

    def stop(self):
        return stop_listener()

    def stop_from_backend(self):
        # goes to js and back which is prob not effective or clean
        global window
        if window:
            window.evaluate_js("stop()")

    def console(self, keys_string):
        print(keys_string)

    # remove duplication
    def update_keys_on_press(self, keys_string):
        global window
        if window:
            js_arg = json.dumps(keys_string)
            window.evaluate_js(f'update_keys_on_press({js_arg})')

    def update_keys_on_release(self, keys_string):
        global window
        if window:
            js_arg = json.dumps(keys_string)
            window.evaluate_js(f'update_keys_on_release({js_arg})')

    def highlight_escape_keys(self, keys_string):
        global window
        if window:
            js_arg = json.dumps(keys_string)
            window.evaluate_js(f'highlight_escape_keys({js_arg})')


if __name__ == "__main__":
    api = Api()
    html_file = os.path.join(os.path.dirname(__file__), "index.html");
    window = webview.create_window("Keylock", url=html_file, js_api=api)
    window.events.closing += on_closing
    webview.start(func=on_starting)