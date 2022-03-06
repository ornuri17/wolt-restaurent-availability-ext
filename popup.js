// const track_button = document.getElementById("track");
const errors_label = document.getElementById("errors");
const tracked_restaurants_tbl = document.getElementById("tracked_restaurants");

const port = chrome.runtime.connect();

const addTrackedRestaurant = async () => {
  let tab_url = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  tab_url = tab_url[0].url;
  port.postMessage({ title: "addTrackedRestaurant", body: { url: tab_url } });
};

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.title === "updateTrackedRestaurantsView") {
    updateTrackedRestaurantsView(msg.body.restaurants);
  }
});

const updateTrackedRestaurantsView = (restaurants) => {
  tracked_restaurants_tbl.innerHTML = "";
  if (restaurants.length === 0) {
    let tr_empty_state = document.createElement("tr");

    let td_empty_state = document.createElement("td");
    td_empty_state.innerHTML = "You are not tracking any restaurant";
    td_empty_state.style.color = "blue";
    td_empty_state.style.width = "auto";
    tr_empty_state.appendChild(td_empty_state);
    tracked_restaurants_tbl.appendChild(tr_empty_state);
    return;
  }
  for (let i = 0; i < restaurants.length; i++) {
    let tr = document.createElement("tr");

    let td_restaurant_name = document.createElement("td");
    td_restaurant_name.innerHTML = restaurants[i].name;
    td_restaurant_name.style.color = "blue";

    let td_delete_restaurant = document.createElement("td");
    let delete_button = document.createElement("button");
    delete_button.id = restaurants.slug;
    delete_button.innerText = "X";
    delete_button.onclick = function () {
      port.postMessage({
        title: "setTrackedRestaurantsOnChromeStorage-delete_button",
        body: {
          restaurants: restaurants.filter(
            (r) => r.slug !== restaurants[i].slug
          ),
        },
      });
      updateTrackedRestaurantsView(getTrackedRestaurantsFromChromeStorage());
      window.location.reload();
    };

    tracked_restaurants_tbl.appendChild(tr);
    tr.appendChild(td_restaurant_name);
    td_delete_restaurant.appendChild(delete_button);
    tr.appendChild(td_delete_restaurant);
  }
};

document.addEventListener("DOMContentLoaded", async function () {
  updateTrackedRestaurantsView(await getTrackedRestaurantsFromChromeStorage());
});

const getTrackedRestaurantsFromChromeStorage = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["restaurants"], function (results) {
      resolve(results ? (results.restaurants ? results.restaurants : []) : []);
    });
  });
};
