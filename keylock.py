from pynput import keyboard

def on_press(key):
    # Stop listener on pressing Esc key
    if key == keyboard.Key.esc:
        return False

with keyboard.Listener(on_press=on_press, suppress=True) as listener:
    listener.join()  # Will block until listener is stopped by returning False