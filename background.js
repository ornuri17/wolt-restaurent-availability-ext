const DAY_INDEX_TO_DAY_NAME_MAP = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};
const ENGLISH = "en";
const EMPTY_STRING = "";
const MESSAGE_TITLES = {
  reading: {
    from_content: {
      add_tracked_restaurant: "addTrackedRestaurant",
      can_track_availablity: "canTrackAvailablity",
      get_tracked_restaurants: "getTrackedRestaurants",
    },
    from_popup: { delete_tracked_restaurant: "deleteTrackedRestaurant" },
  },
  sending: {
    to_content_script: {
      restaurants_are_online: "RestaurantsAreOnline",
      create_track_button: "createTrackButton",
      show_tracked_restaurant_message: "showTrackedRestaurantMessage",
      tracked_restaurants: "trackedRestaurants",
    },
    to_popup: {
      update_tracked_restaurants_view: "updateTrackedRestaurantsView",
    },
  },
};

const sendMessageToContentScript = (title, body) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, {
        title,
        body,
      });
    } else {
      setTimeout(() => {}, 1000);
      sendMessageToContentScript(title, body);
    }
  });
};

const sendMessageToPopup = (title, body, callback) => {
  chrome.runtime.sendMessage(
    {
      title,
      body,
    },
    async function (response) {
      if (callback) {
        await callback();
      }
    }
  );
};

const setTrackedRestaurantsOnChromeStorage = (restaurants) => {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ restaurants: restaurants }, () => {
      resolve();
    });
  });
};

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
    `https://restaurant-api.wolt.com/v3/venues/slug/${restaurant.slug}`
  );
  response = await response.json();
  restaurant.online = response.results[0].online;
  return restaurant;
};

const notifyRestaurantsAreOnlineToActiveTab = (restaurants) => {
  sendMessageToContentScript(
    MESSAGE_TITLES.sending.to_content_script.restaurants_are_online,
    { restaurants }
  );
  deleteRestaurantsFromList(restaurants);
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
  sendMessageToPopup(
    MESSAGE_TITLES.sending.to_popup.update_tracked_restaurants_view,
    {
      restaurants,
    }
  );
};

const checking_availability_interval_secs = 20;
const checking_availability_interval = setInterval(
  checkRestaurantsAvailablity,
  checking_availability_interval_secs * 1000
);

"restaurant_page_validation", "wolt_site_validation";

const canTrackAvailablity = async (url, lang = "en") => {
  const validateURL = validateWoltURL(url);
  if (validateURL.title === "restaurant_page_validation") {
    const slug = getRestaurentSlugFromURL(url);
    const restaurants = await getTrackedRestaurantsFromChromeStorage();
    const restaurant_details = await getRestaurantDetails(slug, lang);
    if (restaurants.filter((r) => r.slug === slug).length > 0) {
      return false;
    } else {
      if (!restaurant_details.open) {
        return false;
      } else {
        if (!restaurant_details.online) {
          return restaurant_details;
        } else {
          return false;
        }
      }
    }
  } else if (validateURL.title === "wolt_site_validation") {
    return false;
  }
};

const addTrackedRestaurant = async (url, lang = "en") => {
  try {
    const restaurant_details = await canTrackAvailablity(url, lang);
    if (restaurant_details) {
      let restaurants = await getTrackedRestaurantsFromChromeStorage();
      restaurants.push(restaurant_details);
      await setTrackedRestaurantsOnChromeStorage(restaurants);
      sendMessageToPopup(
        MESSAGE_TITLES.sending.to_popup.update_tracked_restaurants_view,
        {
          restaurants,
        }
      );
      const tracked_restaurants = getTrackedRestaurantsFromChromeStorage();
      sendMessageToContentScript(
        MESSAGE_TITLES.sending.to_content_script
          .show_tracked_restaurant_message,
        {
          restaurant_name: restaurant_details.name,
          tracked_restaurants,
        }
      );
    } else {
      throw new Error("Could not added that restaurant");
    }
  } catch (err) {
    console.error(err);
  }
};

const validateWoltURL = (url) => {
  const restaurant_page_validation =
    url.toLowerCase().indexOf("wolt.com") !== -1 &&
    (url.toLowerCase().indexOf("restaurant") !== -1 ||
      url.toLowerCase().indexOf("venue") !== -1);

  const wolt_site_validation =
    url.toLowerCase().indexOf("wolt.com") !== -1 &&
    url.toLowerCase().indexOf("category") !== -1;

  if (restaurant_page_validation) {
    return {
      title: "restaurant_page_validation",
      valid: restaurant_page_validation,
    };
  } else if (wolt_site_validation) {
    return {
      title: "wolt_site_validation",
      valid: wolt_site_validation,
    };
  } else {
    return {
      title: "not matched",
      valid: false,
    };
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
      opening_times[DAY_INDEX_TO_DAY_NAME_MAP[new Date().getDay()]].filter(
        (time) => time.type === "open"
      )[0].value.$date
    ),
    close_time: convertTimeToNumber(
      opening_times[DAY_INDEX_TO_DAY_NAME_MAP[new Date().getDay()]].filter(
        (time) => time.type === "close"
      )[0].value.$date
    ),
  };
};

const checkIfRestaurentIsOpen = (opening_times) => {
  const current_time = new Date().getHours() + new Date().getMinutes() / 60;
  const { open_time, close_time } = getOpenAndCloseTimes(opening_times);
  return (
    current_time >= open_time &&
    current_time <= (close_time < open_time ? close_time + 24 : close_time)
  );
};

const getRestaurantDetails = async (slug, lang = "en") => {
  const response = await fetch(
    `https://restaurant-api.wolt.com/v3/venues/slug/${slug}`,
    {
      headers: {
        "app-language": lang,
      },
    }
  );
  let restaurant_data = await response.json();
  let description = restaurant_data.results[0].short_description.filter(
    (description) => {
      return description.lang === lang;
    }
  );
  let name = restaurant_data.results[0].name.filter((name) => {
    return name.lang === lang;
  });
  description = description.length > 0 ? description[0].value : null;
  name = name.length > 0 ? name[0].value : null;
  return {
    name: name || restaurant_data.results[0].name[0].value,
    slug,
    url: restaurant_data.results[0].url
      ? restaurant_data.results[0].url
      : restaurant_data.results[0].public_url,
    image: restaurant_data.results[0].listimage,
    online: restaurant_data.results[0].online,
    description: description || restaurant_data.results[0].description[0].value,
    open: checkIfRestaurentIsOpen(restaurant_data.results[0].opening_times),
  };
};

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (msg) => {
    if (
      msg.title === MESSAGE_TITLES.reading.from_content.add_tracked_restaurant
    ) {
      addTrackedRestaurant(msg.body.url, msg.body.lang);
    } else if (
      msg.title === MESSAGE_TITLES.reading.from_popup.delete_tracked_restaurant
    ) {
      setTrackedRestaurantsOnChromeStorage([]);
      setTrackedRestaurantsOnChromeStorage(msg.body.restaurants);
      let restaurant_details = await canTrackAvailablity(
        msg.body.deleted_restaurant_url
      );
      if (restaurant_details) {
        sendMessageToContentScript(
          MESSAGE_TITLES.sending.to_content_script.create_track_button,
          { restaurant_details }
        );
      }
    } else if (
      msg.title === MESSAGE_TITLES.reading.from_content.can_track_availablity
    ) {
      const restaurant_details = await canTrackAvailablity(msg.body.url);
      if (restaurant_details.open && !restaurant_details.online) {
        sendMessageToContentScript(
          MESSAGE_TITLES.sending.to_content_script.create_track_button,
          { restaurant_details }
        );
      } else {
        sendMessageToContentScript(restaurant_details.title, {
          restaurant_details,
        });
      }
    } else if (
      msg.title === MESSAGE_TITLES.reading.from_content.get_tracked_restaurants
    ) {
      const tracked_restaurants =
        await getTrackedRestaurantsFromChromeStorage();
      sendMessageToContentScript(
        MESSAGE_TITLES.sending.to_content_script.tracked_restaurants,
        tracked_restaurants
      );
    }
  });
});

chrome.webNavigation.onHistoryStateUpdated.addListener(function () {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    async function (tabs) {
      if (tabs.length > 0) {
        let url = tabs[0].url;
        let restaurant_details = await canTrackAvailablity(url);
        if (restaurant_details) {
          sendMessageToContentScript(
            MESSAGE_TITLES.sending.to_content_script.create_track_button,
            { restaurant_details }
          );
        } else {
          const tracked_restaurants =
            await getTrackedRestaurantsFromChromeStorage();
          sendMessageToContentScript(
            MESSAGE_TITLES.sending.to_content_script.tracked_restaurants,
            tracked_restaurants
          );
        }
      }
    }
  );
});
