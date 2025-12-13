async function start() {
  let res = await window.pywebview.api.start();
  document.getElementById("status").innerText = "is " + res;
}
async function stop() {
  let res = await window.pywebview.api.stop();
  document.getElementById("status").innerText = "is " + res;
}

document.getElementById("startBtn").addEventListener("click", start);
document.getElementById("stopBtn").addEventListener("click", stop);