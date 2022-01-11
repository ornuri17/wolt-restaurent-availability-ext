const track_button = document.getElementById("track");
const errors_label = document.getElementById("errors");
const tracked_restaurants_tbl = document.getElementById(
  "tracked_restaurants_tbl"
);

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

const updateTrackedRestaurantsView = (restaurants) => {
  tracked_restaurants_tbl.innerHTML = "";
  for (let i = 0; i < restaurants.length; i++) {
    let tr = document.createElement("tr");

    let td_restaurant_name = document.createElement("td");
    td_restaurant_name.innerHTML = restaurants[i].name;
    td_restaurant_name.style.color = "blue";

    tracked_restaurants_tbl.appendChild(tr);
    tr.appendChild(td_restaurant_name);
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
