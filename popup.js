const track_button = document.getElementById("track");
const errors_label = document.getElementById("errors");
const tracked_restaurants = document.getElementById("tracked_restaurants");

const port = chrome.runtime.connect();

const addTrackedRestaurant = async () => {
  let tab_url = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  tab_url = tab_url[0].url;
  port.postMessage({ title: "addTrackedRestaurant", body: { url: tab_url } });
};

port.onMessage.addListener((msg) => {
  if (msg.title === "updateTrackedRestaurantsView") {
    updateTrackedRestaurantsView(msg.body.restaurants);
  }
});

port.onMessage.addListener((msg) => {
  if (msg.title === "error") {
    alert(msg.body.error);
  }
});

const updateTrackedRestaurantsView = (restaurants) => {
  tracked_restaurants.innerHTML = "";
  for (let i = 0; i < restaurants.length; i++) {
    tracked_restaurants.innerHTML += i > 0 ? "<br/>" : "";
    tracked_restaurants.innerHTML += restaurants[i].name;
  }
};

document.addEventListener("DOMContentLoaded", async function () {
  track_button.addEventListener("click", function () {
    addTrackedRestaurant();
  });
  updateTrackedRestaurantsView(await getTrackedRestaurantsFromChromeStorage());
});

const getTrackedRestaurantsFromChromeStorage = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["restaurants"], function (results) {
      resolve(results ? (results.restaurants ? results.restaurants : []) : []);
    });
  });
};
