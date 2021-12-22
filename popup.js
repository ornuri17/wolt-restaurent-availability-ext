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
      chrome.storage.local.set({ restaurants }, () => {});
      chrome.storage.local.get(
        /* String or Array */ ["restaurents"],
        function (items) {
          console.log(items);
        }
      );
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
  chrome.storage.local.get(["restaurents"], async function (items) {
    for (const restaurant_name_on_wolt of items) {
      await fetch(
        "https://restaurant-api.wolt.com/v3/venues/slug/" +
          restaurant_name_on_wolt
      )
        .then(function (response) {
          // The response is a Response instance.
          // You parse the data into a useable format using `.json()`
          return response.json();
        })
        .then(function (restaurant_data) {
          if (restaurant_data.results[0].online) {
            restaurants[restaurant_name_on_wolt]["interval"] = null;
            chrome.tabs.sendMessage(tabs[0].id, { restaurant_name_on_wolt });
          }
        });
    }
  });
}

async function getRestaurentDetails(restaurant_name_on_wolt) {
  let results = await fetch(
    "https://restaurant-api.wolt.com/v3/venues/slug/" + restaurant_name_on_wolt
  )
    .then(function (response) {
      // The response is a Response instance.
      // You parse the data into a useable format using `.json()`
      return response.json();
    })
    .then(function (restaurant_data) {
      return {
        name: restaurant_data.results[0].name,
        image: restaurant_data.results[0].mainimage,
        online: restaurant_data.results[0].online,
      };
    });
  return results;
}

function updateTrackedRestaurantsLabel() {
  let tracked_restaurants = "";
  chrome.storage.local.get(
    /* String or Array */ ["restaurents"],
    function (items) {
      
    }
  );
}
