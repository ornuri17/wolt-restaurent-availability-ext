const port = chrome.runtime.connect({ name: "knockknock" });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
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
  } else if (msg.title === "createTrackButton" && msg.body.restaurant_details) {
    let observer = new MutationObserver((mutations) => {
      const favoriteButton = document.querySelector(
        "div[class^='FavoriteButton-module__iconContainer']"
      );
      if (favoriteButton) {
        observer.disconnect();
        createTrackButton();
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  }
});

const createTrackButton = () => {
  if (!document.getElementById("tracking_button")) {
    let tracking_button = document.createElement("BUTTON");
    let FavoriteButton = document.querySelector(
      "#mainContent > div > div.Venue__VenueContent-sc-3kit60-0.iXeWkx > div.Description-module__wrapper___N6IMY > div > div.Description-module__start___F4ot1 > button"
    );
    tracking_button.id = "tracking_button";
    tracking_button.innerHTML = FavoriteButton.innerHTML;
    tracking_button.className = FavoriteButton.className;
    tracking_button.style.marginRight = "16px";
    tracking_button.style.fontSize = "1erm";
    tracking_button.style.display = "block";
    tracking_button.childNodes[1].innerHTML = "Tracking";
    tracking_button.childNodes[0].remove();
    tracking_button.onclick = () => {
      chrome.runtime.connect().postMessage({
        title: "addTrackedRestaurant",
        body: { url: window.location.href },
      });
      tracking_button.style.display = "none";
    };
    let img = document.createElement("img");
    img.style.width = "16px";
    img.style.height = "16px";
    img.style.marginRight = "12px";
    img.src =
      "https://icons.veryicon.com/png/o/education-technology/power-icon/system-monitoring-1.png";
    tracking_button.insertBefore(img, tracking_button.firstChild);
    FavoriteButton.parentNode.appendChild(tracking_button);
  }
};

window.onload = () => {
  console.log("Wolt-Chrome-Extension Content Script Loaded");
  chrome.runtime.connect().postMessage({
    title: "canTrackAvailablity",
    body: { url: window.location.href },
  });
};
console.log("________________________");
