// establish stream and log responses to the console
var es = new EventSource("sse.php");
var listener = function (event) {
  if (typeof event.data !== "undefined") {
    console.log(event.data);
  }
};
es.addEventListener("open", listener);
es.addEventListener("message", listener);
es.addEventListener("error", listener);
