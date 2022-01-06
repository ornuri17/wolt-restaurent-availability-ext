window.onload = () => {
  console.log("Wolt-Chrome-Extension Content Script Loaded");
};

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if (msg.title === "RestaurantsAreOnline" && msg.body.restaurants) {
      const restaurants = msg.body.restaurants;
      let popup = document.getElementById("wolt-chrome-extension-popup");
      if (popup) {
        document.body.removeChild(popup);
      }
      // Creating popup element
      popup = document.createElement("div");
      popup.setAttribute("id", "wolt-chrome-extension-popup");
      popup.style.width = "100%";
      popup.style.height = "3em";
      popup.style.position = "sticky";
      popup.style.top = "0";
      popup.style.backgroundColor = "#009de0";
      popup.style.color = "#FFF";
      popup.style.fontFamily =
        'system-ui,-apple-system,BlinkMacSystemFont,"Roboto","Open Sans",sans-serif;';
      popup.style.zIndex = "9999999";
      popup.style.alignItems = "center";
      popup.style.justifyContent = "center";
      popup.style.fontSize = "14px";

      // Adding hide button
      const closePopup = document.createElement("div");
      closePopup.style.position = "fixed";
      closePopup.style.right = "1em";
      closePopup.innerText = "X";
      closePopup.onClick = function () {
        popup.style.display = "none";
      };

      let popupInnerHTML;
      // Adding restaurants names and links
      if (restaurants.length === 1) {
        popupInnerHTML = `Restaurant <b>${restaurants[0].name}</b> is available. Click <a href="${restaurants[0].url}">here</a> to order now!`;
      } else {
        popupInnerHTML = "The following restaurents are available: ";
        for (let i = 0; i < restaurants.length; i++) {
          popupInnerHTML += `<a href="${restaurants[i].url}"><b>${restaurants[i].name}</b></a>`;
          popupInnerHTML += i !== restaurant.length - 1 ? " " : "";
        }
        popupInnerHTML += ". Click on the restaurant name to order now!";
      }
      popup.innerHTML = popupInnerHTML;
      document.body.insertBefore(popup, document.body.firstChild);
    }
  });
});
