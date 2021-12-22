chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  debugger;
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );

  if (request.restaurant_name_on_wolt) {
    let body = document.getElementsByName("body");
    let popup = document.createElement("div");
    popup.innerHTML =
      "Restaurant " + request.restaurant_name_on_wolt + " is available";
    body.appendChild(popup);
  }
});
