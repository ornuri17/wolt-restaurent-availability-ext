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

const VENUE_PAGE_VERSIONS = {
	V1: "V1",
	V2: "V2",
};

let LANGUAGE;
let VENUE_PAGE_VERSION;
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

const V1_SELECTORS = {
	EN_favorite_button: "button[aria-label='Favorite']",
	HE_favorite_button: "button[aria-label='מועדפים']",
	order_together_button: "a[data-test-id='GroupOrderButton.Link']",
	search_input: "input[class^='sc-1web0kr-2']",
	search_result_item: "p[class^='SearchResultItem__OverlayText']",
};

const V2_SELECTORS = {
	order_together_button_parent:
		"div[data-test-id='venue-content-header.root'] > div > div > div",
};

//this "SELECTORS" is work for v1 & v2
const SELECTORS = {
	restaurants_from_venue_card: "[data-test-id^='venueCard.']",
	woltor_venue_button: "#venueButton",
	woltor_tracking_button: "tracking_button",
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
		VENUE_PAGE_VERSION = getVenuePageVersion();
		let ButtonToCheckByVersion =
			VENUE_PAGE_VERSION === VENUE_PAGE_VERSIONS.V1
				? LANGUAGE === LANGUAGES.HE
					? document.querySelector(V1_SELECTORS.HE_favorite_button)
					: document.querySelector(V1_SELECTORS.EN_favorite_button)
				: document.querySelector(V2_SELECTORS.order_together_button_parent);

		if (!ButtonToCheckByVersion) {
			observer = new MutationObserver((mutations) => {
				/*
        this button below should be available first on restaurant page in wolt.com
        so here we wait for its creation to create a compatible wolt.com site button
        */
				ButtonToCheckByVersion =
					VENUE_PAGE_VERSION === VENUE_PAGE_VERSIONS.V1
						? LANGUAGE === LANGUAGES.HE
							? document.querySelector(V1_SELECTORS.HE_favorite_button)
							: document.querySelector(V1_SELECTORS.EN_favorite_button)
						: document.querySelector(V2_SELECTORS.order_together_button_parent);
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

const createButton = () => {
	let tracking_button = document.createElement(
		VENUE_PAGE_VERSION === VENUE_PAGE_VERSIONS.V1 ? "button" : "div"
	);

	tracking_button.style.fontSize = "1rem";
	tracking_button.style.display = "flex";
	tracking_button.onclick = () => {
		chrome.runtime.connect().postMessage({
			title: MESSAGE_TITLES.sending.to_background.add_tracked_restaurant,
			body: { url: window.location.href, lang: LANGUAGE.toLowerCase() },
		});
		document.getElementById(SELECTORS.woltor_tracking_button).remove();
	};

	getTrackButtonAdditionalParams(tracking_button);
};

const createRestaurantPageTrackButtonImg = () => {
	let img = document.createElement("img");
	if (VENUE_PAGE_VERSION === VENUE_PAGE_VERSIONS.V1) {
		img.style.width = "16px";
		img.style.height = "16px";
		if (LANGUAGE === LANGUAGES.EN) {
			img.style.marginInlineEnd = "0.75rem";
		} else {
			img.style.marginLeft = "10px";
		}
		img.src = chrome.runtime.getURL("bell.png");
	} else {
		img.style.width = "14px";
		img.style.height = "14px";
		if (LANGUAGE === LANGUAGES.EN) {
			img.style.marginInline = "0px 0.5rem";
		} else {
			img.style.marginLeft = "10px";
		}
		img.src = chrome.runtime.getURL("blue_bell.png");
	}

	return img;
};

const createContinerDiv = (className) => {
	const continer = document.createElement("div");
	continer.setAttribute("class", className);
	return continer;
};

const getTrackButtonAdditionalParams = (tracking_button) => {
	if (VENUE_PAGE_VERSION === VENUE_PAGE_VERSIONS.V2) {
		const order_together_button_parent = document.querySelector(
			V2_SELECTORS.order_together_button_parent
		);
		const continer = createContinerDiv(
			order_together_button_parent.children[0].className
		);
		tracking_button.innerHTML =
			order_together_button_parent.children[1].innerHTML;
		tracking_button.className =
			order_together_button_parent.children[1].className;
		tracking_button.children[0].innerText = TEXTS.tracking_button[LANGUAGE];
		if (LANGUAGE === LANGUAGES.EN) {
			tracking_button.style.marginRight = "16px";
			tracking_button.style.marginLeft = "0px";
		} else {
			tracking_button.style.marginLeft = "16px";
		}
		continer.appendChild(tracking_button);
		continer.appendChild(order_together_button_parent.children[1]);
		order_together_button_parent.appendChild(continer);
	} else {
		const favoriteButton =
			LANGUAGE === LANGUAGES.HE
				? document.querySelector(V1_SELECTORS.HE_favorite_button)
				: document.querySelector(V1_SELECTORS.EN_favorite_button);
		tracking_button.innerHTML = favoriteButton.innerHTML;
		tracking_button.className = favoriteButton.className;
		tracking_button.childNodes[1].innerHTML = TEXTS.tracking_button[LANGUAGE];
		tracking_button.childNodes[0].remove();
		if (document.querySelector(V1_SELECTORS.order_together_button)) {
			if (LANGUAGE === LANGUAGES.EN) {
				tracking_button.style.marginLeft = "16px";
				tracking_button.style.marginRight = "0px";
			} else {
				tracking_button.style.marginRight = "16px";
			}
		}
		favoriteButton.parentNode.appendChild(tracking_button);
	}
	const img = createRestaurantPageTrackButtonImg();
	tracking_button.insertBefore(img, tracking_button.firstChild);
};

const getVenuePageVersion = () => {
	return document.querySelector(V2_SELECTORS.order_together_button_parent) ===
		null
		? VENUE_PAGE_VERSIONS.V1
		: VENUE_PAGE_VERSIONS.V2;
};

const createTrackButton = () => {
	if (!document.getElementById(V2_SELECTORS.woltor_tracking_button)) {
		VENUE_PAGE_VERSION = getVenuePageVersion();
		LANGUAGE = getLanguage();
		createButton();
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
		SELECTORS.woltor_venue_button
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

const getTemporarilyOfflineAndClosedRestaurants = () => {
	const restaurantsFromVenueCard = document.querySelectorAll(
		SELECTORS.restaurants_from_venue_card
	);
	const temporarily_offline_restaurants = [];
	restaurantsFromVenueCard.forEach((restaurant) => {
		const temporarily_offline_element = restaurant.querySelector("p");
		if (
			temporarily_offline_element.innerText
				.toLowerCase()
				.includes(RESTAURANT_STATUS.temporarilyOffline) ||
			temporarily_offline_element.innerText
				.toLowerCase()
				.includes(RESTAURANT_STATUS.closed) ||
			temporarily_offline_element.innerText
				.toLowerCase()
				.includes(RESTAURANT_STATUS.HE_closed_and_temporarilyOffline)
		) {
			temporarily_offline_restaurants.push(temporarily_offline_element);
		}
	});
	return temporarily_offline_restaurants;
};

const createButtonOnVenueCard = () => {
	const temporarily_offline_restaurants =
		getTemporarilyOfflineAndClosedRestaurants();
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
