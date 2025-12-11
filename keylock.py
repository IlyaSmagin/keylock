from pynput import keyboard

def on_press(key):
    # Stop listener on pressing Esc key
    if key == keyboard.Key.esc:
        print("Escape character detected, exiting...")
        return False

with keyboard.Listener(on_press=on_press, suppress=True) as listener:
    print("Keyboard is locked, press escape character to remove the lock!")
    listener.join()  # Will block until listener is stopped by returning False