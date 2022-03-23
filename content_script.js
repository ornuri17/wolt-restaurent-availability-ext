const MESSAGE_TITLES = {
  reading: {
    from_background: {
      restaurents_are_online: "RestaurantsAreOnline",
      create_track_button: "createTrackButton",
      show_tracked_restaurant_message: "showTrackedRestaurantMessage",
    },
  },
  sending: {
    to_background: {
      add_tracked_restaurant: "addTrackedRestaurant",
      can_track_availablity: "canTrackAvailablity",
    },
  },
};

const TEXTS = {
  tracking_button: {
    HE: "מעקב זמינות",
    EN: "Track Availability",
  },
};

const LANGUAGES = {
  HE: "HE",
  EN: "EN",
};
let LANGUAGE;

const SELECTORS = {
  favorite_button: "div[class^='FavoriteButton-module__iconContainer']",
  order_together_button: "a[class^='GroupOrderButton-module']",
};
const getLanguage = () => {
  return window.location.href.includes(`/${LANGUAGES.HE.toLocaleLowerCase()}/`)
    ? LANGUAGES.HE
    : LANGUAGES.EN;
};

const showMessageBar = (message_inner_html) => {
  let popup = document.getElementById("woltChromeExtensionPopup");
  if (popup) {
    document.body.removeChild(popup);
  }
  // Creating popup element
  let styleElement = document.createElement("style");
  styleElement.innerHTML = `#woltChromeExtensionPopup:before {content:'';position:absolute;top:0;left:0;bottom:0;right:0;background-color:rgba(255,255,255,0.5)}`;
  popup = document.createElement("div");
  popup.setAttribute("id", "woltChromeExtensionPopup");
  popup.style.width = "100%";
  popup.style.height = "3em";
  popup.style.position = "fixed";
  popup.style.top = "0";
  popup.style.background = "url('https://i.gifer.com/Y3ie.gif'),#009de0";
  popup.style.backgroundSize = "20%";
  popup.style.color = "#FFF";
  popup.style.fontFamily =
    'system-ui,-apple-system,BlinkMacSystemFont,"Roboto","Open Sans",sans-serif;';
  popup.style.zIndex = "999999999999";
  popup.style.alignItems = "center";
  popup.style.justifyContent = "center";
  popup.style.fontSize = "14px";
  popup.style.display = "flex";
  popup.style.letterSpacing = "1px";
  popup.style.fontWeight = "bold";
  popup.style.textShadow = "1px 1px black, 1.5px 1.5px black";

  // Adding hide button
  const closePopup = document.createElement("div");
  closePopup.style.cursor = "pointer";
  closePopup.style.position = "fixed";
  closePopup.style.right = "1em";
  closePopup.style.textShadow = "0 0 black";
  closePopup.innerText = "X";
  closePopup.onclick = function () {
    popup.style.display = "none";
  };
  document.head.appendChild(styleElement);
  popup.innerHTML = message_inner_html;
  popup.appendChild(closePopup);
  document.body.insertBefore(popup, document.body.firstChild);
  // setTimeout(() => {
  //   document.getElementById("woltChromeExtensionPopup").remove();
  // }, 5000);
};

chrome.runtime.onMessage.addListener((msg) => {
  if (
    msg.title ===
      MESSAGE_TITLES.reading.from_background.restaurents_are_online &&
    msg.body.restaurants
  ) {
    const restaurants = msg.body.restaurants;
    let popup_inner_html;
    // Adding restaurants names and links
    if (restaurants.length === 1) {
      popup_inner_html = `Restaurant <b>${restaurants[0].name}</b> is available. <a href="${restaurants[0].url}">Click here</a> to order now!`;
    } else {
      popup_inner_html = "The following restaurents are available: ";
      for (let i = 0; i < restaurants.length; i++) {
        popup_inner_html += `<a href="${restaurants[i].url}"><b>${restaurants[i].name}</b></a>`;
        popup_inner_html += i !== restaurant.length - 1 ? " " : "";
      }
      popup_inner_html += ". Click on the restaurant name to order now!";
    }
    showMessageBar(popup_inner_html);
  } else if (
    msg.title === MESSAGE_TITLES.reading.from_background.create_track_button &&
    msg.body.restaurant_details
  ) {
    LANGUAGE = getLanguage();
    let favoriteButton = document.querySelector(SELECTORS.favorite_button);
    if (!SELECTORS.favorite_button) {
      let observer = new MutationObserver((mutations) => {
        /*
        this button below should be available first on restaurant page in walt.com
        so here we waiting for it's creation to create a compatible wolt.com site button
        */
        favoriteButton = document.querySelector(SELECTORS.favorite_button);
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
    } else {
      createTrackButton();
    }
  } else if (
    msg.title ===
    MESSAGE_TITLES.reading.from_background.show_tracked_restaurant_message
  ) {
    showMessageBar(msg.body.message_inner_html);
  }
});

const redirectTo = (url) => {
  window.location.href = url;
};

let button = document.createElement("button");
button.onclick = () => {
  redirectTo("https://google.com");
};
button.innerText = "sababa";

showMessageBar(button.outerHTML);

const createTrackButton = () => {
  if (!document.getElementById("tracking_button")) {
    let tracking_button = document.createElement("button");
    const favoriteButton = document.querySelector(
      "button[class^='FavoriteButton-module__button___']"
    );
    tracking_button.id = "tracking_button";
    tracking_button.innerHTML = favoriteButton.innerHTML;
    tracking_button.className = favoriteButton.className;
    if (document.querySelector(SELECTORS.order_together_button)) {
      tracking_button.style.marginLeft = "16px";
    }
    tracking_button.style.fontSize = "1erm";
    tracking_button.style.display = "block";
    tracking_button.childNodes[1].innerHTML = TEXTS.tracking_button[LANGUAGE];
    tracking_button.childNodes[0].remove();
    tracking_button.onclick = () => {
      chrome.runtime.connect().postMessage({
        title: MESSAGE_TITLES.sending.to_background.add_tracked_restaurant,
        body: { url: window.location.href },
      });
      document.getElementById("tracking_button").remove();
    };
    let img = document.createElement("img");
    img.style.width = "16px";
    img.style.height = "16px";
    img.style.marginRight = "12px";
    img.src = chrome.runtime.getURL("bell.png");

    tracking_button.insertBefore(img, tracking_button.firstChild);
    favoriteButton.parentNode.appendChild(tracking_button);
  }
};

window.onload = () => {
  console.log("Wolt-Chrome-Extension Content Script Loaded");
  chrome.runtime.connect().postMessage({
    title: MESSAGE_TITLES.sending.to_background.can_track_availablity,
    body: { url: window.location.href },
  });
};
