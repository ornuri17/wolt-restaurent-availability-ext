const MESSAGE_TITLES = {
	reading: {
		from_background: {
			restaurents_are_online: "RestaurantsAreOnline",
			create_track_button: "createTrackButton",
			show_tracked_restaurant_message: "showTrackedRestaurantMessage",
			tracked_restaurants: "trackedRestaurants",
		},
	},
	sending: {
		to_background: {
			add_tracked_restaurant: "addTrackedRestaurant",
			can_track_availablity: "canTrackAvailablity",
			get_tracked_restaurants: "getTrackedRestaurants",
		},
	},
};

const TEXTS = {
	tracking_button: {
		HE: "מעקב זמינות",
		EN: "Track Availability",
	},
};

const LANGUAGES = {
	HE: "HE",
	EN: "EN",
};
let LANGUAGE;
let TRACKED_RESTAURANTS = [];

const NOTFICATIONS_MESSAGES = {
	tracking: {
		EN: {
			part_one: `You are now tracking - `,
			part_two: `<br>We will let you know once it's online`,
		},
		HE: `נכנסה למעקב.<br>נודיע לך כאשר המשלוחים יפתחו`,
	},
};

const SELECTORS = {
	favorite_button: "button[aria-label='Favorite']",
	order_together_parent:
		"div[data-test-id='venue-content-header.root'] > div > div > div",
	v1_order_together_button: "a[data-test-id='GroupOrderButton.Link']",
	temporarily_offline_and_closed_restaurants:
		"p[class^='VenueCard__OverlayText']",
	venue_button: "#venueButton",
	tracking_button: "tracking_button",
	search_input: "input[class^='sc-1web0kr-2']",
	search_result_item: "p[class^='SearchResultItem__OverlayText']",
};

const RESTAURANT_STATUS = {
	temporarilyOffline: "temporarily offline",
	closed: "closed",
	HE_closed_and_temporarilyOffline: "סגור כרגע",
};
const DISPLAY = {
	none: "none",
	block: "block",
};

let observer;

const GOOGLE_ANALYTICS = {
	file: "googleAnalytics.js",
	DataLayer: `window.dataLayer = window.dataLayer || []function gtag() {dataLayer.push(arguments);}gtag("js", new Date());gtag("config", "G-VF6M91Y2SH");`,
};

const googleanAlyticsSrc = document.createElement("script");
googleanAlyticsSrc.setAttribute(
	"src",
	chrome.runtime.getURL(GOOGLE_ANALYTICS.file)
);
document.body.appendChild(googleanAlyticsSrc);
const googleanAlyticsDataLayer = document.createElement("script");
googleanAlyticsDataLayer.innerHTML = GOOGLE_ANALYTICS.DataLayer;

const getLanguage = () => {
	return window.location.href.includes(`/${LANGUAGES.HE.toLocaleLowerCase()}/`)
		? LANGUAGES.HE
		: LANGUAGES.EN;
};

const showMessageBar = (element, multiline = false) => {
	let popup = document.getElementById("woltChromeExtensionPopup");
	if (popup) {
		document.body.removeChild(popup);
	}
	// Creating popup element
	let styleElement = document.createElement("style");
	styleElement.innerHTML = `#woltChromeExtensionPopup:before {content:'';position:absolute;top:0;left:0;bottom:0;right:0;background-color:rgba(255,255,255,0.5)}`;
	popup = document.createElement("div");
	popup.setAttribute("id", "woltChromeExtensionPopup");
	popup.style.width = "100%";
	popup.style.height = multiline ? "7em" : "5em";
	popup.style.position = "fixed";
	popup.style.top = "0";
	popup.style.background = "url('https://i.gifer.com/Y3ie.gif'),#009de0";
	popup.style.backgroundSize = "20%";
	popup.style.fontFamily =
		'system-ui,-apple-system,BlinkMacSystemFont,"Roboto","Open Sans",sans-serif;';
	popup.style.zIndex = "999999";
	popup.style.alignItems = "center";
	popup.style.justifyContent = "center";
	popup.style.fontSize = "12px";
	popup.style.display = "flex";
	popup.style.letterSpacing = "0.5px";
	popup.style.fontWeight = "bold";

	// Adding hide button
	const closePopup = document.createElement("div");
	closePopup.style.cursor = "pointer";
	closePopup.style.position = "fixed";
	closePopup.style.left = "10px";
	closePopup.style.top = "5px";
	closePopup.style.textShadow = "0 0 black";
	closePopup.innerText = "X";
	closePopup.onclick = function () {
		popup.style.display = "none";
	};
	element.style.zIndex = "101";
	element.style.padding = "4px 8px";
	element.style.backgroundColor = "white";
	element.style.borderRadius = "15px";
	element.style.textAlign = "center";
	element.style.lineHeight = "1.65";
	document.head.appendChild(styleElement);
	popup.appendChild(element);
	popup.appendChild(closePopup);
	document.body.insertBefore(popup, document.body.firstChild);
	setTimeout(() => {
		document.getElementById("woltChromeExtensionPopup").remove();
	}, 5000);
};

chrome.runtime.onMessage.addListener((msg) => {
	if (
		msg.title ===
			MESSAGE_TITLES.reading.from_background.restaurents_are_online &&
		msg.body.restaurants
	) {
		const restaurants = msg.body.restaurants;
		let popup_element = document.createElement("div");
		// Adding restaurants names and links
		if (restaurants.length === 1) {
			let popup_first_text_element = document.createElement("div");
			if (LANGUAGE === LANGUAGES.HE) {
				popup_first_text_element.style.direction = "rtl";
			}
			popup_first_text_element.innerText =
				LANGUAGE === LANGUAGES.EN
					? `Restaurant ${restaurants[0].name} is online.`
					: `${restaurants[0].name} פתוחה כעת להזמנות`;

			let popup_link_element = document.createElement("a");
			popup_link_element.href = restaurants[0].url;
			popup_link_element.innerText =
				LANGUAGE === LANGUAGES.EN ? "Click here" : "לחצו כאן";

			let popup_second_text_element = document.createElement("div");
			popup_second_text_element.appendChild(popup_link_element);
			popup_second_text_element.innerHTML +=
				LANGUAGE === LANGUAGES.EN ? " to order now" : " והזמינו עכשיו";

			popup_element.appendChild(popup_first_text_element);
			popup_element.appendChild(popup_second_text_element);
		} else {
			let popup_first_text_element = document.createElement("div");
			popup_first_text_element.innerText =
				LANGUAGE === LANGUAGES.EN
					? "The following restaurents are now online: "
					: ":המסעדות הבאות פתוחות כעת להזמנות ";

			popup_element.appendChild(popup_first_text_element);

			for (let i = 0; i < restaurants.length; i++) {
				let popup_link_element = document.createElement("a");
				popup_link_element.href = restaurants[i].url;
				popup_link_element.innerText = restaurants[i].name;
				popup_element.appendChild(popup_link_element);
				if (i !== restaurants.length - 1) {
					let seperator = document.createElement("span");
					seperator.innerHTML = "&emsp;|&emsp;";
					popup_element.appendChild(seperator);
				}
			}

			let popup_second_text_element = document.createElement("div");

			popup_second_text_element.innerText =
				LANGUAGE === LANGUAGES.EN
					? "Click on the restaurant name to order now!"
					: "לחצו על שם המסעדה ממנה תרצו להזמין והזמינו עכשיו";
			popup_element.appendChild(popup_second_text_element);
		}
		showMessageBar(popup_element, restaurants.length > 1);
	} else if (
		msg.title === MESSAGE_TITLES.reading.from_background.create_track_button &&
		msg.body.restaurant_details
	) {
		LANGUAGE = getLanguage();
		let favoriteButton = document.querySelector(SELECTORS.favorite_button);
		if (!favoriteButton) {
			observer = new MutationObserver((mutations) => {
				/*
        this button below should be available first on restaurant page in wolt.com
        so here we wait for its creation to create a compatible wolt.com site button
        */
				favoriteButton = document.querySelector(SELECTORS.favorite_button);
				if (favoriteButton) {
					observer.disconnect();
					createTrackButton();
				}
			});
			observer.observe(document, {
				childList: true,
				subtree: true,
				attributes: false,
				characterData: false,
			});
		} else if (
			document.URL.includes("category" || "grocery_retail" || "stores")
		) {
			TRACKED_RESTAURANTS = msg.body;
			createButtonOnVenueCard();
		} else {
			createTrackButton();
		}
	} else if (
		msg.title ===
		MESSAGE_TITLES.reading.from_background.show_tracked_restaurant_message
	) {
		let message_element = document.createElement("div");
		message_element.style.margin = "auto";
		message_element.innerHTML =
			LANGUAGE === LANGUAGES.EN
				? `${NOTFICATIONS_MESSAGES.tracking.EN.part_one}${msg.body.restaurant_name}${NOTFICATIONS_MESSAGES.tracking.EN.part_two}`
				: `${msg.body.restaurant_name} ${NOTFICATIONS_MESSAGES.tracking.HE}`;
		if (LANGUAGE === LANGUAGES.HE) {
			message_element.style.direction = "rtl";
		}
		showMessageBar(message_element);
		TRACKED_RESTAURANTS = msg.body.tracked_restaurants;
	} else if (
		msg.title === MESSAGE_TITLES.reading.from_background.tracked_restaurants &&
		msg.body
	) {
		TRACKED_RESTAURANTS = { tracked_restaurants: msg.body };
		createButtonOnVenueCard();
	}
});

const createButtonV1 = () => {
	let tracking_button = document.createElement("button");
	const favoriteButton = document.querySelector(SELECTORS.favorite_button);
	tracking_button.id = SELECTORS.tracking_button;
	tracking_button.innerHTML = favoriteButton.innerHTML;
	tracking_button.className = favoriteButton.className;
	if (document.querySelector(SELECTORS.order_together_parent)) {
		if (LANGUAGE === LANGUAGES.EN) {
			tracking_button.style.marginLeft = "16px";
			tracking_button.style.marginRight = "0px";
		} else {
			tracking_button.style.marginRight = "16px";
		}
	}
	tracking_button.style.fontSize = "1erm";
	tracking_button.style.display = "flex";
	tracking_button.childNodes[1].innerHTML = TEXTS.tracking_button[LANGUAGE];
	tracking_button.childNodes[0].remove();
	tracking_button.onclick = () => {
		chrome.runtime.connect().postMessage({
			title: MESSAGE_TITLES.sending.to_background.add_tracked_restaurant,
			body: { url: window.location.href, lang: LANGUAGE.toLowerCase() },
		});
		document.getElementById(SELECTORS.tracking_button).remove();
	};
	let img = document.createElement("img");
	img.style.width = "16px";
	img.style.height = "16px";
	if (LANGUAGE === LANGUAGES.EN) {
		img.style.marginRight = "12px";
	} else {
		img.style.marginLeft = "12px";
	}
	img.src = chrome.runtime.getURL("bell.png");

	tracking_button.insertBefore(img, tracking_button.firstChild);
	favoriteButton.parentNode.appendChild(tracking_button);
};
const createButtonV2 = (order_together_button) => {
	let tracking_button = document.createElement("button");
	const order_together_button_v2 = document.querySelector(
		SELECTORS.order_together_parent
	).children[1];
	tracking_button.id = SELECTORS.tracking_button;
	tracking_button.innerHTML = order_together_button_v2.innerHTML;
	tracking_button.className = order_together_button_v2.className;
	tracking_button.childNodes[0].innerHTML = TEXTS.tracking_button[LANGUAGE];
	tracking_button.onclick = () => {
		chrome.runtime.connect().postMessage({
			title: MESSAGE_TITLES.sending.to_background.add_tracked_restaurant,
			body: { url: window.location.href, lang: LANGUAGE.toLowerCase() },
		});
		document.getElementById(SELECTORS.tracking_button).remove();
	};
	let img = document.createElement("img");
	img.style.width = "16px";
	img.style.height = "16px";
	if (LANGUAGE === LANGUAGES.EN) {
		img.style.marginRight = "12px";
	} else {
		img.style.marginLeft = "12px";
	}
	img.src = chrome.runtime.getURL("bell.png");

	tracking_button.insertBefore(img, tracking_button.firstChild);
	order_together_button_v2.parentNode.appendChild(tracking_button);
};

const createTrackButton = () => {
	if (!document.getElementById(SELECTORS.tracking_button)) {
		LANGUAGE = getLanguage();
		if (document.querySelector(SELECTORS.order_together_parent) === null) {
			createButtonV1();
		} else {
			createButtonV2();
		}
	}
};

const canTrackAvailablity = () => {
	chrome.runtime.connect().postMessage({
		title: MESSAGE_TITLES.sending.to_background.can_track_availablity,
		body: { url: window.location.href },
	});
};

window.onload = () => {
	console.log("Woltor Content Script Loaded");
	canTrackAvailablity();
	chrome.runtime.connect().postMessage({
		title: MESSAGE_TITLES.sending.to_background.get_tracked_restaurants,
	});
};

const getRestaurentSlugFromURL = (url) => {
	return url.substring(url.lastIndexOf("/") + 1);
};

const createVenueCrardTrackBottonContainer = () => {
	const venueCrardTrackBottonContainer = document.createElement("div");
	venueCrardTrackBottonContainer.style.position = "relative";
	venueCrardTrackBottonContainer.style.zIndex = "5000";

	return venueCrardTrackBottonContainer;
};

const createVenueCrardTrackBottonImg = () => {
	const tracking_img = document.createElement("img");
	tracking_img.src = chrome.runtime.getURL("grey-bell.png");
	tracking_img.style.width = "1.5rem";
	tracking_img.style.height = "1.5rem";

	return tracking_img;
};

const createVenueCrardTrackBotton = (restaurantURL) => {
	LANGUAGE = getLanguage();
	const tracking_button = document.createElement("div");
	tracking_button.id = "venueButton";
	tracking_button.style.position = "relative";

	const trackingAvailableToggle = createVenueButtonToggle();

	tracking_button.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();

		VenueCrardTrackBottonHandleClick(restaurantURL);
		tracking_button.style.display = "none";
	});

	tracking_button.addEventListener("mouseover", (e) => {
		e.preventDefault();
		e.stopPropagation();

		tracking_button.appendChild(trackingAvailableToggle);
	});

	tracking_button.addEventListener("mouseout", (e) => {
		e.preventDefault();
		e.stopPropagation();

		tracking_button.removeChild(trackingAvailableToggle);
	});

	return tracking_button;
};

const createVenueButtonToggle = () => {
	const trackingAvailableToggle = document.createElement("div");
	trackingAvailableToggle.innerText = TEXTS.tracking_button[LANGUAGE];
	trackingAvailableToggle.id = "trackingAvailableToggle";
	trackingAvailableToggle.style.position = "fixed";
	trackingAvailableToggle.style.fontSize = "small";
	trackingAvailableToggle.style.top = "70%";
	trackingAvailableToggle.style.left = "50%";
	trackingAvailableToggle.style.transform = "translate(-50%, -50%)";
	return trackingAvailableToggle;
};

const VenueCrardTrackBottonHandleClick = (restaurantURL) => {
	chrome.runtime.connect().postMessage({
		title: MESSAGE_TITLES.sending.to_background.add_tracked_restaurant,
		body: {
			url: restaurantURL,
			lang: getLanguage().toLowerCase(),
		},
	});
};

const venueCardButtonMetaData = (restaurantElement) => {
	const restaurantMainElement =
		restaurantElement.parentElement.parentElement.parentElement.parentElement
			.parentElement;
	const isButtonExist = restaurantMainElement.querySelector(
		SELECTORS.venue_button
	);
	const restaurantURL = `https://wolt.com${restaurantMainElement.getAttribute(
		"href"
	)}`;
	const slug = getRestaurentSlugFromURL(restaurantURL);
	const restaurantSlugLength =
		TRACKED_RESTAURANTS.tracked_restaurants.filter((r) => r.slug === slug)
			.length < 1;
	return {
		restaurantMainElement,
		isButtonExist,
		restaurantURL,
		slug,
		restaurantSlugLength,
	};
};

const getTemporarilyOfflineRestaurants = () => {
	const restaurantsFromVenueCard = document.querySelectorAll(
		'[data-test-id^="venueCard."]'
	);
	const temporarily_offline_restaurants = [];
	restaurantsFromVenueCard.forEach((restaurant) => {
		const temporarily_offline_element = restaurant.querySelector("p");
		if (
			temporarily_offline_element.innerText === "Temporarily offline" ||
			temporarily_offline_element.innerText === "Closed"
		) {
			temporarily_offline_restaurants.push(temporarily_offline_element);
		}
	});
	return temporarily_offline_restaurants;
};

const createButtonOnVenueCard = () => {
	const temporarily_offline_restaurants = getTemporarilyOfflineRestaurants();
	if (temporarily_offline_restaurants) {
		temporarily_offline_restaurants.forEach((restaurantElement) => {
			const buttonMetaData = venueCardButtonMetaData(restaurantElement);

			if (!buttonMetaData.isButtonExist) {
				if (
					buttonMetaData.restaurantSlugLength &&
					(restaurantElement.innerHTML.toLowerCase() ===
						RESTAURANT_STATUS.temporarilyOffline ||
						restaurantElement.innerHTML.toLowerCase() ===
							RESTAURANT_STATUS.closed ||
						restaurantElement.innerText ===
							RESTAURANT_STATUS.HE_closed_and_temporarilyOffline)
				) {
					const trackBottonContainer = createVenueCrardTrackBottonContainer();
					const tracking_button = createVenueCrardTrackBotton(
						buttonMetaData.restaurantURL
					);
					const tracking_img = createVenueCrardTrackBottonImg();

					tracking_button.appendChild(tracking_img);
					trackBottonContainer.appendChild(tracking_button);
					restaurantElement.appendChild(trackBottonContainer);
				}
			} else if (
				buttonMetaData.isButtonExist.style.display === DISPLAY.none &&
				TRACKED_RESTAURANTS.restaurant_details.slug === buttonMetaData.slug
			) {
				buttonMetaData.isButtonExist.style.display = DISPLAY.block;
			}
		});
	}
};

const createSearchBarButton = () => {
	const searchBar = document.createElement("input");
	searchBar.addEventListener("input", () => {
		const searchResult = document.querySelectorAll(
			SELECTORS.search_result_item
		);
	});
};

window.document.addEventListener("DOMContentLoaded", createSearchBarButton());
