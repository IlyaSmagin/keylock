from pynput import keyboard

# keyboard.Key.ctrl_l
# keyboard.KeyCode.from_char("q")
escape_keys = {keyboard.Key.esc}
pressed_keys = set()

def on_press(key):
    pressed_keys.add(key)
    print("You pressed:", key)
    if all(k in pressed_keys for k in escape_keys):
        return False

def on_release(key):
    if key in pressed_keys:
        pressed_keys.remove(key)

with keyboard.Listener(on_press=on_press, on_release=on_release, suppress=True) as listener:
    print("Keyboard is locked, press " + str(escape_keys) + " to remove the lock!")
    listener.join()  # Will block until listener is stopped by returning False
    print("Escape character detected " + str(escape_keys) + ", exiting...")

