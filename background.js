chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Executing chrome.runtime.onMessage.addListener");
  if (request.action === "getCookies") {
    console.log("Action 'getCookies' received");
    chrome.cookies.getAll({ url: request.url }, function (cookies) {
      console.log("Retrieving cookies from: " + request.url);
      sendResponse({ cookies: cookies });
    });
    return true;
  }
});
