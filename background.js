const checkRestaurantsAvailablity = async () => {
  console.log("Checking Restaurants Availability");
  const restaurants = await getTrackedRestaurantsFromChromeStorage();
  if (restaurants.length > 0) {
    let promises = [];
    for (const restaurant of restaurants) {
      promises.push(checkRestaurantAvailability(restaurant));
    }
    const results = await Promise.all(promises);
    let availableRestaurants = results.filter((r) => r.online);
    await notifyRestaurantsAreOnlineToActiveTab(availableRestaurants);
  }
};

const checkRestaurantAvailablity = async (restaurant) => {
  const response = await fetch(
    "https://restaurant-api.wolt.com/v3/venues/slug/" + restaurant.slug
  );
  reponse = await response.json();
  restaurant.online = response.results[0].online;
  return restaurant;
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const notifyRestaurantsAreOnlineToActiveTab = (restaurants) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        if (tabs[0] && tabs[0].id) {
          const port = chrome.tabs.connect(tabs[0].id);
          port.postMessage({
            restaurants,
          });
          await deleteRestaurantsFromList(restaurants);
        }
        resolve();
      }
    );
  });
};

const notifyPopupToUpdateTrackedRestaurantsView = () => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      msg: "updateTrackedRestaurantsView",
    });
  });
};

const deleteRestaurantsFromList = async (restaurants_to_delete) => {
  let restaurants = await getTrackedRestaurantsFromChromeStorage();
  for (const restaurant of restaurants_to_delete) {
    restaurants = restaurants.filter((r) => r.slug !== restaurant.slug);
  }
  await setTrackedRestaurantsOnChromeStorage(restaurants);
  await notifyPopupToUpdateTrackedRestaurantsView();
  return;
};

const getTrackedRestaurantsFromChromeStorage = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["restaurants"], function (results) {
      resolve(results ? (results.restaurants ? results.restaurants : []) : []);
    });
  });
};

const setTrackedRestaurantsOnChromeStorage = (restaurants) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ restaurants: restaurants }, () => {
      resolve();
    });
  });
};

const checking_availability_interval_secs = 20;
const checking_availability_interval = setInterval(
  checkRestaurantsAvailablity,
  checking_availability_interval_secs * 1000
);
