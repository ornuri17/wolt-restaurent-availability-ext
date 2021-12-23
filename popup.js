let track_button = document.getElementById("track");
let errors_label = document.getElementById("errors");
let restaurants_tracked = document.getElementById("restaurants_tracked");
let restaurants = {};

// When the button is clicked, inject setPageBackgroundColor into current page
track_button.addEventListener("click", async () => {
  try {
    let [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    let tab_url = tab.url;
    let restaurant_details = {};

    await validateWoltURL(tab_url);
    let restaurant_name_on_wolt = getRestaurentNameFromURL(tab_url);
    restaurant_details = await getRestaurentDetails(restaurant_name_on_wolt);

    if (!restaurant_details.online) {
      restaurants_tracked.innerHTML =
        restaurants_tracked.innerHTML + Object.keys(restaurants).length > 0
          ? " " + restaurant_name_on_wolt
          : restaurant_name_on_wolt;

      restaurants[restaurant_name_on_wolt] = restaurant_details;
      chrome.storage.sync.set({ restaurants: restaurants }, () => {});
      restaurants[restaurant_name_on_wolt]["interval"] = setInterval(
        checkRestaurantAvailablity,
        30 * 1000
      );
    } else {
      alert(`${restaurant_name_on_wolt} is already online`);
    }
  } catch (err) {
    errors_label.innerText = err;
  }
});

function validateWoltURL(url) {
  if (url.toLowerCase().indexOf("wolt.com") === -1) {
    throw "Website is not supported";
  }
}

function getRestaurentNameFromURL(url) {
  return url.substring(url.lastIndexOf("/") + 1);
}

function checkRestaurantAvailablity() {
  console.log("checking availability");
  chrome.storage.local.get(["restaurants"], async function (results) {
    let restaurants_names = Object.keys(results.restaurants);
    if (restaurants_names.length > 0) {
      for (const restaurant_name_on_wolt of restaurants_names) {
        const response = await fetch(
          "https://restaurant-api.wolt.com/v3/venues/slug/" +
            restaurant_name_on_wolt
        );
        // The response is a Response instance.
        // You parse the data into a useable format using `.json()`
        const restaurant_data = await response.json();
        if (!restaurant_data.results[0].online) {
          restaurants[restaurant_name_on_wolt]["interval"] = null;
          chrome.tabs.sendMessage(tabs[0].id, { restaurant_name_on_wolt });
        }
        return restaurant_data;
      }
    }
  });
}

async function getRestaurentDetails(restaurant_name_on_wolt) {
  const results = await fetch(
    "https://restaurant-api.wolt.com/v3/venues/slug/" + restaurant_name_on_wolt
  );
  let restaurant_All_wolt_data = await results.json();
  let restaurant_data = {};

  restaurant_data.name = restaurant_All_wolt_data.results[0].name;
  restaurant_data.image = restaurant_All_wolt_data.results[0].mainimage;
  restaurant_data.online = restaurant_All_wolt_data.results[0].online;
  return restaurant_data;
}
