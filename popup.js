const MESSAGE_TITLES = {
  reading: {
    from_background: {
      update_tracked_restaurants_view: "updateTrackedRestaurantsView",
    },
  },
  sending: {
    to_background: {
      delete_tracked_restaurant: "deleteTrackedRestaurant",
    },
  },
};

chrome.runtime.onMessage.addListener((msg) => {
  if (
    msg.title ===
    MESSAGE_TITLES.reading.from_background.update_tracked_restaurants_view
  ) {
    updateTrackedRestaurantsView(msg.body.restaurants);
  }
});

// Variables to target our base class,  get carousel items, count how many carousel items there are, set the slide to 0 (which is the number that tells us the frame we're on), and set motion to true which disables interactivity.
let itemClassName = "carousel-element";
let carousel_indicator_classname = "carousel-indicator";
let items = document.getElementsByClassName(itemClassName);
let totalItems = items.length;
let carousel_indicators = document.getElementsByClassName(
  carousel_indicator_classname
);
let slide = 0;
let moving = true;

// To initialise the carousel we'll want to update the DOM with our own classes
function setInitialClasses() {
  // Target the last, initial, and next items and give them the relevant class.
  // This assumes there are three or more items.
  if (totalItems > 1) {
    items[totalItems - 1].classList.add("prev");
    items[0].classList.add("active");
    items[1].classList.add("next");
    carousel_indicators[0].classList.add("active");
  }
}

// Set click events to navigation buttons

function setEventListeners() {
  if (totalItems > 1) {
    let next = document.getElementsByClassName("carousel-button-next")[0],
      prev = document.getElementsByClassName("carousel-button-prev")[0];

    next.addEventListener("click", moveNext);
    prev.addEventListener("click", movePrev);
  }
}

// Disable interaction by setting 'moving' to true for the same duration as our transition (0.5s = 500ms)
function disableInteraction() {
  moving = true;

  setTimeout(function () {
    moving = false;
  }, 500);
}

function moveCarouselTo(slide) {
  // Check if carousel is moving, if not, allow interaction
  if (!moving) {
    // temporarily disable interactivity
    disableInteraction();

    // Preemptively set variables for the current next and previous slide, as well as the potential next or previous slide.

    var newPrevious = slide - 1,
      newNext = slide + 1,
      oldPrevious = slide - 2,
      oldNext = slide + 2;

    // Test if carousel has more than three items
    if (totalItems > 1) {
      // Checks if the new potential slide is out of bounds and sets slide numbers
      if (newPrevious <= 0) {
        oldPrevious = totalItems - 1;
      } else if (newNext >= totalItems - 1) {
        oldNext = 0;
      }

      // Check if current slide is at the beginning or end and sets slide numbers
      if (slide === 0) {
        newPrevious = totalItems - 1;
        oldPrevious = totalItems - 2;
        oldNext = slide + 1;
      } else if (slide === totalItems - 1) {
        newPrevious = slide - 1;
        newNext = 0;
        oldNext = 1;
      }

      // Now we've worked out where we are and where we're going, by adding and removing classes, we'll be triggering the carousel's transitions.

      // Based on the current slide, reset to default classes.
      items[oldPrevious].className = itemClassName;
      items[oldNext].className = itemClassName;

      // Add the new classes
      items[newPrevious].className = itemClassName + " prev";
      items[slide].className = itemClassName + " active";
      items[newNext].className = itemClassName + " next";

      carousel_indicators[slide].className =
        carousel_indicator_classname + " active";
      carousel_indicators[newPrevious].className = carousel_indicator_classname;
      carousel_indicators[newNext].className = carousel_indicator_classname;
    }
  }
}

// Next navigation handler
function moveNext() {
  // Check if moving
  if (!moving) {
    // If it's the last slide, reset to 0, else +1
    if (slide === totalItems - 1) {
      slide = 0;
    } else {
      slide++;
    }

    // Move carousel to updated slide
    moveCarouselTo(slide);
  }
}

// Previous navigation handler
function movePrev() {
  // Check if moving
  if (!moving) {
    // If it's the first slide, set as the last slide, else -1
    if (slide === 0) {
      slide = totalItems - 1;
    } else {
      slide--;
    }

    // Move carousel to updated slide
    moveCarouselTo(slide);
  }
}

// Initialise carousel
function initCarousel() {
  items = document.getElementsByClassName(itemClassName);
  totalItems = items.length;
  carousel_indicators = document.getElementsByClassName(
    carousel_indicator_classname
  );
  setInitialClasses();
  setEventListeners();

  // Set moving to false now that the carousel is ready
  moving = false;
}

const updateTrackedRestaurantsView = (restaurants) => {
  let restaurants_container = document.getElementById("restaurants-container");
  restaurants_container.innerHTML = "";
  let carousel_next_button = document.createElement("div");
  carousel_next_button.className = "carousel-button carousel-button-next";
  let carousel_prev_button = document.createElement("div");
  carousel_prev_button.className = "carousel-button carousel-button-prev";
  let carousel_indicators_container = document.createElement("div");
  carousel_indicators_container.className = "carousel-indicators-container";

  restaurants_container.appendChild(carousel_next_button);
  restaurants_container.appendChild(carousel_prev_button);

  if (restaurants.length === 0) {
    let empty_state = document.createElement("span");
    empty_state.className = "empty_state";
    empty_state.innerHTML = "You are not tracking any restaurant";
    document.body.appendChild(empty_state);
    return;
  }

  for (let i = 0; i < restaurants.length; i++) {
    let carousel_element = document.createElement("div");
    carousel_element.className = "carousel-element";

    let restaurant_container = document.createElement("div");
    restaurant_container.className = "restaurant-container";

    let restaurant_page_link = document.createElement("a");
    restaurant_page_link.href = restaurants[i].url;
    restaurant_page_link.target = "_blank";
    restaurant_page_link.className = "restaurant-page-link";

    let restaurant_img = document.createElement("img");
    restaurant_img.src = restaurants[i].image;
    restaurant_img.className = "restaurant-img";

    let restaurant_details = document.createElement("div");
    restaurant_details.className = "restaurant-details";

    let restaurant_name = document.createElement("span");
    restaurant_name.innerHTML = restaurants[i].name;
    restaurant_name.className = "restaurant-name";

    let br = document.createElement("br");
    let restaurant_description = document.createElement("span");
    restaurant_description.innerHTML = restaurants[i].description;
    restaurant_description.className = "restaurant-description";

    let delete_button_wrapper = document.createElement("div");
    delete_button_wrapper.className = "delete-button-wrapper";

    let delete_button = document.createElement("span");
    let delete_icon = document.createElement("img");
    delete_icon.src = "delete.png";
    delete_button.className = "delete-button";
    delete_button.onclick = function () {
      chrome.runtime.connect().postMessage({
        title: MESSAGE_TITLES.sending.to_background.delete_tracked_restaurant,
        body: {
          restaurants: restaurants.filter(
            (r) => r.slug !== restaurants[i].slug
          ),
          deleted_restaurant_url: restaurants[i].url,
        },
      });
      updateTrackedRestaurantsView(getTrackedRestaurantsFromChromeStorage());
      window.location.reload();
    };

    let carousel_indicator = document.createElement("span");
    carousel_indicator.className = "carousel-indicator";

    restaurant_page_link.appendChild(restaurant_img);
    restaurant_page_link.appendChild(restaurant_details);
    restaurant_details.appendChild(restaurant_name);
    restaurant_details.appendChild(br);
    restaurant_details.appendChild(restaurant_description);
    restaurant_container.appendChild(restaurant_page_link);
    delete_button.appendChild(delete_icon);
    delete_button_wrapper.appendChild(delete_button);
    restaurant_container.appendChild(delete_button_wrapper);
    carousel_element.appendChild(restaurant_container);
    carousel_indicators_container.appendChild(carousel_indicator);
    restaurants_container.appendChild(carousel_element);
  }
  document.body.appendChild(carousel_indicators_container);

  initCarousel();
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
