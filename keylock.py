from pynput import keyboard
import webview
import os

# keyboard.Key.ctrl_l
# keyboard.KeyCode.from_char("q")
# https://pynput.readthedocs.io/en/latest/keyboard.html
escape_keys = {keyboard.Key.esc}
pressed_keys = set()
listener = None
listener_running = False

def format_keys(keys):
    pressed_keys_names = []
    for key in keys:
        if hasattr(key, "char") and key.char:
            pressed_keys_names.append(key.char)
        else:
            pressed_keys_names.append(key.name)
    formatted_keys = " + ".join(pressed_keys_names)
    return formatted_keys

def on_press(key):
    pressed_keys.add(key)
    print("You pressed:", format_keys(pressed_keys))
    api.display_pressed_keys(format_keys(pressed_keys))
    if (escape_keys.issubset(pressed_keys)):
        stop_listener()

def on_release(key):
    if key in pressed_keys:
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

def on_closing():
    print("Window is closing, stopping listener...")
    stop_listener()

class Api:
    def start(self):
        return start_listener()

    def stop(self):
        return stop_listener()

    def display_pressed_keys(self, keys_string):
        global window
        if window:
            window.evaluate_js(f'update_pressed_keys("{keys_string}")')

if __name__ == "__main__":
    api = Api()
    html_file = os.path.join(os.path.dirname(__file__), "index.html");
    window = webview.create_window("Leylock", url=html_file, js_api=api)
    window.events.closing += on_closing
    webview.start()