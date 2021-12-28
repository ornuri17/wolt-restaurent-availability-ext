const track_button = document.getElementById("track");
const errors_label = document.getElementById("errors");
const tracked_restaurants = document.getElementById("tracked_restaurants");

document.addEventListener("DOMContentLoaded", async function () {
  track_button.addEventListener("click", addTrackedRestaurant);
  await updateTrackedRestaurantsView();
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.msg === "updateTrackedRestaurantsView") {
    console.log("updateTrackedRestaurantsView MSG");
    updateTrackedRestaurantsView();
  }
});

const updateTrackedRestaurantsView = async () => {
  const restaurants = await getTrackedRestaurantsFromChromeStorage();
  tracked_restaurants.innerHTML = "";
  for (let i = 0; i < restaurants.length; i++) {
    tracked_restaurants.innerHTML += i > 0 ? "<br/>" : "";
    tracked_restaurants.innerHTML += restaurants[i].name;
  }
};

const addTrackedRestaurant = async () => {
  try {
    let [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    let tab_url = tab.url;

    await validateWoltURL(tab_url);
    const slug = getRestaurentSlugFromURL(tab_url);
    let restaurants = await getTrackedRestaurantsFromChromeStorage();
    const restaurant_details = await getRestaurantDetails(slug);
    if (restaurants.filter((r) => r.slug === slug).length > 0) {
      throw `You're already tracking ${restaurant_details.name} availability`;
    } else {
      if (!restaurant_details.online) {
        restaurants.push(restaurant_details);
        await setRestaurantsOnChromeStorage(restaurants);
        await updateTrackedRestaurantsView();
      } else {
        throw `${restaurant_details.name} is already online`;
      }
    }
  } catch (err) {
    alert(err);
  }
};

const validateWoltURL = (url) => {
  if (
    url.toLowerCase().indexOf("wolt.com") === -1 ||
    url.toLowerCase().indexOf("restaurant") === -1
  ) {
    throw "Website is not supported";
  }
};

const getRestaurentSlugFromURL = (url) => {
  return url.substring(url.lastIndexOf("/") + 1);
};

const getRestaurantDetails = async (slug) => {
  let results = await fetch(
    "https://restaurant-api.wolt.com/v3/venues/slug/" + slug
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (restaurant_data) {
      return {
        name: restaurant_data.results[0].name[0].value,
        slug,
        url: restaurant_data.results[0].url
          ? restaurant_data.results[0].url
          : restaurant_data.results[0].public_url,
        image: restaurant_data.results[0].mainimage,
        online: restaurant_data.results[0].online,
      };
    });
  return results;
};

const getTrackedRestaurantsFromChromeStorage = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["restaurants"], function (results) {
      resolve(results ? (results.restaurants ? results.restaurants : []) : []);
    });
  });
};
