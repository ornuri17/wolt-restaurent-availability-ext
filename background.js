const dayNumberToDayNameMap = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

let port;

const setTrackedRestaurantsOnChromeStorage = (restaurants) => {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ restaurants: restaurants }, () => {
      resolve();
    });
  });
};
// setTrackedRestaurantsOnChromeStorage([]);
const getTrackedRestaurantsFromChromeStorage = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["restaurants"], function (results) {
      resolve(results ? (results.restaurants ? results.restaurants : []) : []);
    });
  });
};

const deleteRestaurantsFromList = async (restaurants_to_delete) => {
  let restaurants = await getTrackedRestaurantsFromChromeStorage();
  for (const restaurant of restaurants_to_delete) {
    restaurants = restaurants.filter((r) => r.slug !== restaurant.slug);
  }
  await setTrackedRestaurantsOnChromeStorage(restaurants);
  await notifyPopupToUpdateTrackedRestaurantsView(restaurants);
  return;
};

const checkRestaurantAvailablity = async (restaurant) => {
  let response = await fetch(
    "https://restaurant-api.wolt.com/v3/venues/slug/" + restaurant.slug
  );
  response = await response.json();
  restaurant.online = response.results[0].online;
  return restaurant;
};

const notifyRestaurantsAreOnlineToActiveTab = (restaurants) => {
  return new Promise((resolve) => {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        if (tabs[0] && tabs[0].id) {
          const port = chrome.tabs.connect(tabs[0].id);
          port.postMessage({
            title: "RestaurantsAreOnline",
            body: {
              restaurants,
            },
          });
          await deleteRestaurantsFromList(restaurants);
        }
        resolve();
      }
    );
  });
};

const checkRestaurantsAvailablity = async () => {
  console.log("Checking Restaurants Availability");
  const restaurants = await getTrackedRestaurantsFromChromeStorage();
  if (restaurants.length > 0) {
    let promises = [];
    for (const restaurant of restaurants) {
      promises.push(checkRestaurantAvailablity(restaurant));
    }
    const results = await Promise.all(promises);
    let availableRestaurants = results.filter((r) => r.online);
    if (availableRestaurants.length > 0) {
      await notifyRestaurantsAreOnlineToActiveTab(availableRestaurants);
    }
  }
};

const notifyPopupToUpdateTrackedRestaurantsView = (restaurants) => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      msg: {
        title: "updateTrackedRestaurantsView",
        body: { restaurants },
      },
    });
    resolve();
  });
};

const checking_availability_interval_secs = 20;
const checking_availability_interval = setInterval(
  checkRestaurantsAvailablity,
  checking_availability_interval_secs * 1000
);

const addTrackedRestaurant = async (url) => {
  try {
    validateWoltURL(url);
    const slug = getRestaurentSlugFromURL(url);
    let restaurants = await getTrackedRestaurantsFromChromeStorage();
    const restaurant_details = await getRestaurantDetails(slug);
    if (restaurants.filter((r, i) => r.slug === slug).length > 0) {
      throw `You're already tracking ${restaurant_details.name} availability`;
    } else {
      if (!restaurant_details.open) {
        throw `${restaurant_details.name} is closed`;
      } else {
        if (!restaurant_details.online) {
          restaurants.push(restaurant_details);
          await setTrackedRestaurantsOnChromeStorage(restaurants);
          port.postMessage({
            title: "updateTrackedRestaurantsView",
            body: { restaurants },
          });
        } else {
          throw `${restaurant_details.name} is already online`;
        }
      }
    }
  } catch (err) {
    throw port.postMessage({
      title: "error",
      body: { error: err },
    });
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

const convertTimeToNumber = (time) => {
  let date = new Date(time);
  date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return date.getHours() + date.getMinutes() / 60;
};

const getOpenAndCloseTimes = (opening_times) => {
  return {
    open_time: convertTimeToNumber(
      opening_times[dayNumberToDayNameMap[new Date().getDay()]].filter(
        (time) => time.type === "open"
      )[0].value.$date
    ),
    close_time: convertTimeToNumber(
      opening_times[dayNumberToDayNameMap[new Date().getDay()]].filter(
        (time) => time.type === "close"
      )[0].value.$date
    ),
  };
};

const checkIfRestaurentIsOpen = (opening_times) => {
  const { open_time, close_time } = getOpenAndCloseTimes(opening_times);
  const current_time = new Date().getHours() + new Date().getMinutes() / 60;
  return (
    current_time >= open_time &&
    current_time <= (close_time < open_time ? close_time + 24 : close_time)
  );
};

const getRestaurantDetails = async (slug) => {
  const response = await fetch(
    "https://restaurant-api.wolt.com/v3/venues/slug/" + slug
  );
  const restaurant_data = await response.json();
  return {
    name: restaurant_data.results[0].name[0].value,
    slug,
    url: restaurant_data.results[0].url
      ? restaurant_data.results[0].url
      : restaurant_data.results[0].public_url,
    image: restaurant_data.results[0].mainimage,
    online: restaurant_data.results[0].online,
    open: checkIfRestaurentIsOpen(restaurant_data.results[0].opening_times),
  };
};

chrome.runtime.onConnect.addListener((_port) => {
  port = _port;
  port.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.title === "getTrackedRestaurantsFromChromeStorage") {
      const tracked_restaurants =
        await getTrackedRestaurantsFromChromeStorage();
      sendResponse = {
        title: "updateTrackedRestaurantsView",
        body: { restaurants: tracked_restaurants },
      };
    } else if (msg.title === "addTrackedRestaurant") {
      addTrackedRestaurant(msg.body.url);
    }
  });
});
