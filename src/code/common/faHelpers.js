/*
FontAwesome icon provider.
*/
export default class FontAwesome {
    static #icons = { "fa-cloud-sun-rain": ["fas"], "fa-crosshairs": ["fas"], "fa-sellsy": ["fab"], "fa-adn": ["fab"], "fa-file-download": ["fas"], "fa-tachometer-alt": ["fas"], "fa-flushed": ["fas", "far"], "fa-microsoft": ["fab"], "fa-grin-beam": ["fas", "far"], "fa-campground": ["fas"], "fa-credit-card": ["fas", "far"], "fa-calendar-times": ["fas", "far"], "fa-print": ["fas"], "fa-file-upload": ["fas"], "fa-algolia": ["fab"], "fa-glass-cheers": ["fas"], "fa-linkedin": ["fab"], "fa-phone-alt": ["fas"], "fa-buffer": ["fab"], "fa-icicles": ["fas"], "fa-rainbow": ["fas"], "fa-cloudversify": ["fab"], "fa-calendar-alt": ["fas", "far"], "fa-reply": ["fas"], "fa-houzz": ["fab"], "fa-redo-alt": ["fas"], "fa-battery-half": ["fas"], "fa-moon": ["fas", "far"], "fa-shipping-fast": ["fas"], "fa-sign-language": ["fas"], "fa-times": ["fas"], "fa-untappd": ["fab"], "fa-grunt": ["fab"], "fa-check-square": ["fas", "far"], "fa-unsplash": ["fab"], "fa-quote-left": ["fas"], "fa-font-awesome-alt": ["fab"], "fa-weibo": ["fab"], "fa-grip-horizontal": ["fas"], "fa-trash-restore": ["fas"], "fa-hips": ["fab"], "fa-first-aid": ["fas"], "fa-grin-tongue": ["fas", "far"], "fa-stripe": ["fab"], "fa-dog": ["fas"], "fa-dailymotion": ["fab"], "fa-expand-alt": ["fas"], "fa-record-vinyl": ["fas"], "fa-elementor": ["fab"], "fa-smile": ["fas", "far"], "fa-key": ["fas"], "fa-kaggle": ["fab"], "fa-lyft": ["fab"], "fa-user-minus": ["fas"], "fa-flickr": ["fab"], "fa-creative-commons-share": ["fab"], "fa-get-pocket": ["fab"], "fa-clinic-medical": ["fas"], "fa-napster": ["fab"], "fa-jedi-order": ["fab"], "fa-volume-down": ["fas"], "fa-star-of-david": ["fas"], "fa-hospital-symbol": ["fas"], "fa-rocketchat": ["fab"], "fa-hand-sparkles": ["fas"], "fa-zhihu": ["fab"], "fa-viadeo": ["fab"], "fa-telegram-plane": ["fab"], "fa-chevron-up": ["fas"], "fa-chevron-left": ["fas"], "fa-expand-arrows-alt": ["fas"], "fa-font-awesome": ["fab"], "fa-holly-berry": ["fas"], "fa-hand-peace": ["fas", "far"], "fa-dice-four": ["fas"], "fa-mars-stroke": ["fas"], "fa-speaker-deck": ["fab"], "fa-symfony": ["fab"], "fa-google-plus": ["fab"], "fa-rss-square": ["fas"], "fa-vial": ["fas"], "fa-ice-cream": ["fas"], "fa-dumbbell": ["fas"], "fa-dumpster-fire": ["fas"], "fa-clock": ["fas", "far"], "fa-kickstarter": ["fab"], "fa-user-times": ["fas"], "fa-fire": ["fas"], "fa-leaf": ["fas"], "fa-github": ["fab"], "fa-money-check": ["fas"], "fa-headphones": ["fas"], "fa-book-open": ["fas"], "fa-text-width": ["fas"], "fa-receipt": ["fas"], "fa-facebook-square": ["fab"], "fa-medium": ["fab"], "fa-battle-net": ["fab"], "fa-pied-piper-hat": ["fab"], "fa-landmark": ["fas"], "fa-jsfiddle": ["fab"], "fa-window-close": ["fas", "far"], "fa-staylinked": ["fab"], "fa-head-side-virus": ["fas"], "fa-thermometer-half": ["fas"], "fa-yarn": ["fab"], "fa-baseball-ball": ["fas"], "fa-uncharted": ["fab"], "fa-socks": ["fas"], "fa-map-pin": ["fas"], "fa-file-contract": ["fas"], "fa-creative-commons-pd": ["fab"], "fa-reddit": ["fab"], "fa-hashtag": ["fas"], "fa-cloudsmith": ["fab"], "fa-uniregistry": ["fab"], "fa-swimming-pool": ["fas"], "fa-step-backward": ["fas"], "fa-grin-wink": ["fas", "far"], "fa-map": ["fas", "far"], "fa-user-shield": ["fas"], "fa-hand-holding-water": ["fas"], "fa-pen-alt": ["fas"], "fa-discord": ["fab"], "fa-cut": ["fas"], "fa-digital-tachograph": ["fas"], "fa-mobile": ["fas"], "fa-tags": ["fas"], "fa-language": ["fas"], "fa-mars-double": ["fas"], "fa-guilded": ["fab"], "fa-newspaper": ["fas", "far"], "fa-chevron-right": ["fas"], "fa-firstdraft": ["fab"], "fa-dice-two": ["fas"], "fa-video-slash": ["fas"], "fa-creative-commons": ["fab"], "fa-centos": ["fab"], "fa-th-large": ["fas"], "fa-buysellads": ["fab"], "fa-broom": ["fas"], "fa-mitten": ["fas"], "fa-surprise": ["fas", "far"], "fa-cloud-rain": ["fas"], "fa-laptop-house": ["fas"], "fa-meetup": ["fab"], "fa-coffee": ["fas"], "fa-cc-stripe": ["fab"], "fa-chess-king": ["fas"], "fa-adjust": ["fas"], "fa-bacon": ["fas"], "fa-bus": ["fas"], "fa-edit": ["fas", "far"], "fa-skiing": ["fas"], "fa-creative-commons-nc": ["fab"], "fa-temperature-high": ["fas"], "fa-drumstick-bite": ["fas"], "fa-strava": ["fab"], "fa-bong": ["fas"], "fa-google-plus-square": ["fab"], "fa-sticker-mule": ["fab"], "fa-mdb": ["fab"], "fa-docker": ["fab"], "fa-slash": ["fas"], "fa-parachute-box": ["fas"], "fa-blogger-b": ["fab"], "fa-shield-virus": ["fas"], "fa-vials": ["fas"], "fa-hand-middle-finger": ["fas"], "fa-freebsd": ["fab"], "fa-share": ["fas"], "fa-medapps": ["fab"], "fa-cart-arrow-down": ["fas"], "fa-user-alt-slash": ["fas"], "fa-circle": ["fas", "far"], "fa-highlighter": ["fas"], "fa-share-square": ["fas", "far"], "fa-arrow-circle-down": ["fas"], "fa-angle-double-up": ["fas"], "fa-thumbs-up": ["fas", "far"], "fa-suitcase-rolling": ["fas"], "fa-om": ["fas"], "fa-border-style": ["fas"], "fa-facebook": ["fab"], "fa-signature": ["fas"], "fa-wheelchair": ["fas"], "fa-ruler-vertical": ["fas"], "fa-smile-beam": ["fas", "far"], "fa-radiation-alt": ["fas"], "fa-biking": ["fas"], "fa-faucet": ["fas"], "fa-phone-volume": ["fas"], "fa-odnoklassniki-square": ["fab"], "fa-exclamation-circle": ["fas"], "fa-twitter": ["fab"], "fa-object-ungroup": ["fas", "far"], "fa-deploydog": ["fab"], "fa-google-drive": ["fab"], "fa-undo": ["fas"], "fa-ruble-sign": ["fas"], "fa-low-vision": ["fas"], "fa-eraser": ["fas"], "fa-hand-scissors": ["fas", "far"], "fa-user": ["fas", "far"], "fa-vaadin": ["fab"], "fa-clone": ["fas", "far"], "fa-compass": ["fas", "far"], "fa-glass-whiskey": ["fas"], "fa-edge": ["fab"], "fa-quote-right": ["fas"], "fa-scroll": ["fas"], "fa-rss": ["fas"], "fa-pen-fancy": ["fas"], "fa-wrench": ["fas"], "fa-store-alt": ["fas"], "fa-compact-disc": ["fas"], "fa-cc-mastercard": ["fab"], "fa-folder-minus": ["fas"], "fa-sort-up": ["fas"], "fa-gg": ["fab"], "fa-stop": ["fas"], "fa-microphone-alt-slash": ["fas"], "fa-mixer": ["fab"], "fa-address-card": ["fas", "far"], "fa-user-secret": ["fas"], "fa-external-link-alt": ["fas"], "fa-meh": ["fas", "far"], "fa-volume-off": ["fas"], "fa-php": ["fab"], "fa-tint-slash": ["fas"], "fa-user-circle": ["fas", "far"], "fa-fulcrum": ["fab"], "fa-underline": ["fas"], "fa-swatchbook": ["fas"], "fa-burn": ["fas"], "fa-equals": ["fas"], "fa-ticket-alt": ["fas"], "fa-gem": ["fas", "far"], "fa-cc-discover": ["fab"], "fa-hotjar": ["fab"], "fa-basketball-ball": ["fas"], "fa-fast-backward": ["fas"], "fa-air-freshener": ["fas"], "fa-mars-stroke-h": ["fas"], "fa-shoe-prints": ["fas"], "fa-taxi": ["fas"], "fa-luggage-cart": ["fas"], "fa-mountain": ["fas"], "fa-ussunnah": ["fab"], "fa-star-half-alt": ["fas"], "fa-gifts": ["fas"], "fa-asterisk": ["fas"], "fa-viruses": ["fas"], "fa-envelope-square": ["fas"], "fa-chevron-circle-up": ["fas"], "fa-kiwi-bird": ["fas"], "fa-band-aid": ["fas"], "fa-cotton-bureau": ["fab"], "fa-css3": ["fab"], "fa-syringe": ["fas"], "fa-hourglass-end": ["fas"], "fa-arrow-up": ["fas"], "fa-fan": ["fas"], "fa-archive": ["fas"], "fa-angle-double-right": ["fas"], "fa-envelope-open-text": ["fas"], "fa-restroom": ["fas"], "fa-chevron-circle-left": ["fas"], "fa-bootstrap": ["fab"], "fa-long-arrow-alt-right": ["fas"], "fa-cheese": ["fas"], "fa-user-cog": ["fas"], "fa-typo3": ["fab"], "fa-caret-square-down": ["fas", "far"], "fa-handshake": ["fas", "far"], "fa-weight": ["fas"], "fa-leanpub": ["fab"], "fa-paste": ["fas"], "fa-deezer": ["fab"], "fa-subscript": ["fas"], "fa-chrome": ["fab"], "fa-sort-amount-down": ["fas"], "fa-angellist": ["fab"], "fa-user-nurse": ["fas"], "fa-yelp": ["fab"], "fa-list-ul": ["fas"], "fa-themeisle": ["fab"], "fa-search": ["fas"], "fa-guitar": ["fas"], "fa-venus": ["fas"], "fa-egg": ["fas"], "fa-flipboard": ["fab"], "fa-galactic-senate": ["fab"], "fa-smile-wink": ["fas", "far"], "fa-gitlab": ["fab"], "fa-subway": ["fas"], "fa-atlas": ["fas"], "fa-hand-holding": ["fas"], "fa-audible": ["fab"], "fa-keyboard": ["fas", "far"], "fa-plus": ["fas"], "fa-portrait": ["fas"], "fa-user-friends": ["fas"], "fa-itch-io": ["fab"], "fa-democrat": ["fas"], "fa-windows": ["fab"], "fa-th": ["fas"], "fa-arrows-alt-h": ["fas"], "fa-app-store": ["fab"], "fa-bacterium": ["fas"], "fa-toilet": ["fas"], "fa-reply-all": ["fas"], "fa-spray-can": ["fas"], "fa-voicemail": ["fas"], "fa-search-plus": ["fas"], "fa-less-than": ["fas"], "fa-forward": ["fas"], "fa-comment-alt": ["fas", "far"], "fa-carrot": ["fas"], "fa-concierge-bell": ["fas"], "fa-tenge": ["fas"], "fa-cart-plus": ["fas"], "fa-window-restore": ["fas", "far"], "fa-airbnb": ["fab"], "fa-nutritionix": ["fab"], "fa-external-link-square-alt": ["fas"], "fa-recycle": ["fas"], "fa-affiliatetheme": ["fab"], "fa-cc-visa": ["fab"], "fa-map-signs": ["fas"], "fa-wizards-of-the-coast": ["fab"], "fa-image": ["fas", "far"], "fa-qq": ["fab"], "fa-cash-register": ["fas"], "fa-long-arrow-alt-down": ["fas"], "fa-first-order": ["fab"], "fa-balance-scale": ["fas"], "fa-memory": ["fas"], "fa-cloudflare": ["fab"], "fa-th-list": ["fas"], "fa-tty": ["fas"], "fa-tram": ["fas"], "fa-torah": ["fas"], "fa-download": ["fas"], "fa-pinterest-square": ["fab"], "fa-kiss": ["fas", "far"], "fa-stack-overflow": ["fab"], "fa-linux": ["fab"], "fa-baby-carriage": ["fas"], "fa-calendar": ["fas", "far"], "fa-wpbeginner": ["fab"], "fa-piggy-bank": ["fas"], "fa-edge-legacy": ["fab"], "fa-remove-format": ["fas"], "fa-photo-video": ["fas"], "fa-glasses": ["fas"], "fa-dollar-sign": ["fas"], "fa-avianex": ["fab"], "fa-hotdog": ["fas"], "fa-behance": ["fab"], "fa-stamp": ["fas"], "fa-opera": ["fab"], "fa-the-red-yeti": ["fab"], "fa-frown": ["fas", "far"], "fa-globe": ["fas"], "fa-chess-pawn": ["fas"], "fa-calendar-day": ["fas"], "fa-less": ["fab"], "fa-list-alt": ["fas", "far"], "fa-oil-can": ["fas"], "fa-user-clock": ["fas"], "fa-accessible-icon": ["fab"], "fa-stopwatch": ["fas"], "fa-hire-a-helper": ["fab"], "fa-chart-line": ["fas"], "fa-praying-hands": ["fas"], "fa-scribd": ["fab"], "fa-comments": ["fas", "far"], "fa-arrow-left": ["fas"], "fa-mortar-pestle": ["fas"], "fa-jedi": ["fas"], "fa-prescription": ["fas"], "fa-fedora": ["fab"], "fa-handshake-slash": ["fas"], "fa-prescription-bottle": ["fas"], "fa-biohazard": ["fas"], "fa-pinterest-p": ["fab"], "fa-snapchat-square": ["fab"], "fa-align-justify": ["fas"], "fa-video": ["fas"], "fa-user-alt": ["fas"], "fa-viadeo-square": ["fab"], "fa-assistive-listening-systems": ["fas"], "fa-ruler-horizontal": ["fas"], "fa-instagram": ["fab"], "fa-wix": ["fab"], "fa-wave-square": ["fas"], "fa-fighter-jet": ["fas"], "fa-phone-square-alt": ["fas"], "fa-torii-gate": ["fas"], "fa-palfed": ["fab"], "fa-laugh-wink": ["fas", "far"], "fa-circle-notch": ["fas"], "fa-spider": ["fas"], "fa-deaf": ["fas"], "fa-radiation": ["fas"], "fa-hackerrank": ["fab"], "fa-file-audio": ["fas", "far"], "fa-studiovinari": ["fab"], "fa-superscript": ["fas"], "fa-viacoin": ["fab"], "fa-d-and-d": ["fab"], "fa-connectdevelop": ["fab"], "fa-compress-arrows-alt": ["fas"], "fa-snowman": ["fas"], "fa-question": ["fas"], "fa-pied-piper": ["fab"], "fa-box": ["fas"], "fa-gopuram": ["fas"], "fa-fill": ["fas"], "fa-wifi": ["fas"], "fa-dribbble": ["fab"], "fa-goodreads": ["fab"], "fa-sort-amount-down-alt": ["fas"], "fa-fort-awesome": ["fab"], "fa-otter": ["fas"], "fa-cc-amazon-pay": ["fab"], "fa-camera": ["fas"], "fa-heading": ["fas"], "fa-drum": ["fas"], "fa-phone-slash": ["fas"], "fa-sd-card": ["fas"], "fa-toggle-on": ["fas"], "fa-angry": ["fas", "far"], "fa-poll": ["fas"], "fa-cookie-bite": ["fas"], "fa-grin-alt": ["fas", "far"], "fa-tv": ["fas"], "fa-golf-ball": ["fas"], "fa-superpowers": ["fab"], "fa-stop-circle": ["fas", "far"], "fa-bluetooth": ["fab"], "fa-filter": ["fas"], "fa-chess-knight": ["fas"], "fa-github-square": ["fab"], "fa-shopping-basket": ["fas"], "fa-orcid": ["fab"], "fa-at": ["fas"], "fa-plane": ["fas"], "fa-plus-circle": ["fas"], "fa-optin-monster": ["fab"], "fa-smoking": ["fas"], "fa-bath": ["fas"], "fa-fonticons-fi": ["fab"], "fa-deviantart": ["fab"], "fa-linode": ["fab"], "fa-tumblr-square": ["fab"], "fa-android": ["fab"], "fa-odnoklassniki": ["fab"], "fa-ns8": ["fab"], "fa-uber": ["fab"], "fa-shopware": ["fab"], "fa-modx": ["fab"], "fa-satellite-dish": ["fas"], "fa-share-alt-square": ["fas"], "fa-handshake-alt-slash": ["fas"], "fa-dungeon": ["fas"], "fa-sun": ["fas", "far"], "fa-vine": ["fab"], "fa-mastodon": ["fab"], "fa-blender-phone": ["fas"], "fa-store-alt-slash": ["fas"], "fa-caret-square-right": ["fas", "far"], "fa-shekel-sign": ["fas"], "fa-feather-alt": ["fas"], "fa-accusoft": ["fab"], "fa-lock-open": ["fas"], "fa-playstation": ["fab"], "fa-hooli": ["fab"], "fa-reddit-square": ["fab"], "fa-supple": ["fab"], "fa-page4": ["fab"], "fa-border-none": ["fas"], "fa-asymmetrik": ["fab"], "fa-bitbucket": ["fab"], "fa-file-video": ["fas", "far"], "fa-gofore": ["fab"], "fa-glass-martini-alt": ["fas"], "fa-readme": ["fab"], "fa-intercom": ["fab"], "fa-ban": ["fas"], "fa-bacteria": ["fas"], "fa-ellipsis-v": ["fas"], "fa-bars": ["fas"], "fa-id-card-alt": ["fas"], "fa-cloud-upload-alt": ["fas"], "fa-contao": ["fab"], "fa-grin-squint-tears": ["fas", "far"], "fa-heartbeat": ["fas"], "fa-paragraph": ["fas"], "fa-bread-slice": ["fas"], "fa-fire-alt": ["fas"], "fa-meh-rolling-eyes": ["fas", "far"], "fa-angular": ["fab"], "fa-outdent": ["fas"], "fa-stumbleupon": ["fab"], "fa-grip-lines-vertical": ["fas"], "fa-wine-glass-alt": ["fas"], "fa-grin-stars": ["fas", "far"], "fa-stopwatch-20": ["fas"], "fa-ring": ["fas"], "fa-microphone": ["fas"], "fa-microscope": ["fas"], "fa-reacteurope": ["fab"], "fa-delicious": ["fab"], "fa-codepen": ["fab"], "fa-venus-mars": ["fas"], "fa-city": ["fas"], "fa-cloud-sun": ["fas"], "fa-money-bill-alt": ["fas", "far"], "fa-dolly-flatbed": ["fas"], "fa-lira-sign": ["fas"], "fa-check-double": ["fas"], "fa-hands": ["fas"], "fa-donate": ["fas"], "fa-crow": ["fas"], "fa-table-tennis": ["fas"], "fa-desktop": ["fas"], "fa-ruler-combined": ["fas"], "fa-hand-holding-heart": ["fas"], "fa-dharmachakra": ["fas"], "fa-flask": ["fas"], "fa-stream": ["fas"], "fa-bus-alt": ["fas"], "fa-html5": ["fab"], "fa-satellite": ["fas"], "fa-phone": ["fas"], "fa-child": ["fas"], "fa-toolbox": ["fas"], "fa-joint": ["fas"], "fa-diaspora": ["fab"], "fa-mailchimp": ["fab"], "fa-grav": ["fab"], "fa-car-side": ["fas"], "fa-creative-commons-sampling": ["fab"], "fa-cloud-showers-heavy": ["fas"], "fa-globe-africa": ["fas"], "fa-black-tie": ["fab"], "fa-usb": ["fab"], "fa-soap": ["fas"], "fa-mendeley": ["fab"], "fa-arrows-alt": ["fas"], "fa-blind": ["fas"], "fa-gift": ["fas"], "fa-ellipsis-h": ["fas"], "fa-khanda": ["fas"], "fa-teeth-open": ["fas"], "fa-spinner": ["fas"], "fa-closed-captioning": ["fas", "far"], "fa-dhl": ["fab"], "fa-artstation": ["fab"], "fa-gitkraken": ["fab"], "fa-fish": ["fas"], "fa-calendar-plus": ["fas", "far"], "fa-baby": ["fas"], "fa-kiss-beam": ["fas", "far"], "fa-keycdn": ["fab"], "fa-people-arrows": ["fas"], "fa-utensil-spoon": ["fas"], "fa-cc-apple-pay": ["fab"], "fa-truck-monster": ["fas"], "fa-mouse": ["fas"], "fa-hot-tub": ["fas"], "fa-firefox": ["fab"], "fa-umbrella-beach": ["fas"], "fa-level-down-alt": ["fas"], "fa-shower": ["fas"], "fa-vnv": ["fab"], "fa-sim-card": ["fas"], "fa-ankh": ["fas"], "fa-dropbox": ["fab"], "fa-pencil-ruler": ["fas"], "fa-mobile-alt": ["fas"], "fa-hospital": ["fas", "far"], "fa-tumblr": ["fab"], "fa-mars-stroke-v": ["fas"], "fa-swimmer": ["fas"], "fa-water": ["fas"], "fa-wpressr": ["fab"], "fa-alipay": ["fab"], "fa-history": ["fas"], "fa-first-order-alt": ["fab"], "fa-dochub": ["fab"], "fa-shapes": ["fas"], "fa-plus-square": ["fas", "far"], "fa-medkit": ["fas"], "fa-head-side-mask": ["fas"], "fa-pinterest": ["fab"], "fa-draft2digital": ["fab"], "fa-location-arrow": ["fas"], "fa-crutch": ["fas"], "fa-train": ["fas"], "fa-hacker-news-square": ["fab"], "fa-angle-right": ["fas"], "fa-suitcase": ["fas"], "fa-kiss-wink-heart": ["fas", "far"], "fa-dev": ["fab"], "fa-osi": ["fab"], "fa-search-minus": ["fas"], "fa-innosoft": ["fab"], "fa-mix": ["fab"], "fa-cloud-moon": ["fas"], "fa-comment-dollar": ["fas"], "fa-trademark": ["fas"], "fa-erlang": ["fab"], "fa-mandalorian": ["fab"], "fa-hand-paper": ["fas", "far"], "fa-telegram": ["fab"], "fa-kaaba": ["fas"], "fa-chevron-circle-right": ["fas"], "fa-grin-tongue-squint": ["fas", "far"], "fa-file-csv": ["fas"], "fa-store-slash": ["fas"], "fa-bone": ["fas"], "fa-sketch": ["fab"], "fa-car-alt": ["fas"], "fa-seedling": ["fas"], "fa-volume-mute": ["fas"], "fa-magnet": ["fas"], "fa-angle-up": ["fas"], "fa-american-sign-language-interpreting": ["fas"], "fa-pause-circle": ["fas", "far"], "fa-car-battery": ["fas"], "fa-red-river": ["fab"], "fa-github-alt": ["fab"], "fa-hand-spock": ["fas", "far"], "fa-unlink": ["fas"], "fa-allergies": ["fas"], "fa-tshirt": ["fas"], "fa-percentage": ["fas"], "fa-mask": ["fas"], "fa-sort": ["fas"], "fa-skating": ["fas"], "fa-border-all": ["fas"], "fa-file-powerpoint": ["fas", "far"], "fa-funnel-dollar": ["fas"], "fa-ruler": ["fas"], "fa-stethoscope": ["fas"], "fa-lastfm": ["fab"], "fa-registered": ["fas", "far"], "fa-file": ["fas", "far"], "fa-laugh": ["fas", "far"], "fa-neos": ["fab"], "fa-tablet-alt": ["fas"], "fa-itunes": ["fab"], "fa-i-cursor": ["fas"], "fa-sort-alpha-down-alt": ["fas"], "fa-server": ["fas"], "fa-caret-up": ["fas"], "fa-splotch": ["fas"], "fa-palette": ["fas"], "fa-fly": ["fab"], "fa-pencil-alt": ["fas"], "fa-user-tie": ["fas"], "fa-eye-dropper": ["fas"], "fa-grip-lines": ["fas"], "fa-dyalog": ["fab"], "fa-dna": ["fas"], "fa-aws": ["fab"], "fa-sort-alpha-down": ["fas"], "fa-cube": ["fas"], "fa-amazon": ["fab"], "fa-check": ["fas"], "fa-bezier-curve": ["fas"], "fa-dice-three": ["fas"], "fa-jira": ["fab"], "fa-whatsapp-square": ["fab"], "fa-mercury": ["fas"], "fa-gulp": ["fab"], "fa-galactic-republic": ["fab"], "fa-google-plus-g": ["fab"], "fa-pills": ["fas"], "fa-plug": ["fas"], "fa-stroopwafel": ["fas"], "fa-product-hunt": ["fab"], "fa-drafting-compass": ["fas"], "fa-volleyball-ball": ["fas"], "fa-hard-hat": ["fas"], "fa-bluetooth-b": ["fab"], "fa-play": ["fas"], "fa-yen-sign": ["fas"], "fa-codiepie": ["fab"], "fa-buromobelexperte": ["fab"], "fa-apper": ["fab"], "fa-book-medical": ["fas"], "fa-eye": ["fas", "far"], "fa-car-crash": ["fas"], "fa-spell-check": ["fas"], "fa-archway": ["fas"], "fa-grip-vertical": ["fas"], "fa-css3-alt": ["fab"], "fa-pause": ["fas"], "fa-backward": ["fas"], "fa-pizza-slice": ["fas"], "fa-university": ["fas"], "fa-utensils": ["fas"], "fa-cog": ["fas"], "fa-file-archive": ["fas", "far"], "fa-redo": ["fas"], "fa-store": ["fas"], "fa-candy-cane": ["fas"], "fa-trash-restore-alt": ["fas"], "fa-watchman-monitoring": ["fab"], "fa-pen-nib": ["fas"], "fa-medium-m": ["fab"], "fa-creative-commons-nd": ["fab"], "fa-joget": ["fab"], "fa-toilet-paper-slash": ["fas"], "fa-phabricator": ["fab"], "fa-times-circle": ["fas", "far"], "fa-comment": ["fas", "far"], "fa-reddit-alien": ["fab"], "fa-space-shuttle": ["fas"], "fa-bitcoin": ["fab"], "fa-fedex": ["fab"], "fa-blog": ["fas"], "fa-hockey-puck": ["fas"], "fa-expand": ["fas"], "fa-play-circle": ["fas", "far"], "fa-network-wired": ["fas"], "fa-window-maximize": ["fas", "far"], "fa-pied-piper-square": ["fab"], "fa-hospital-user": ["fas"], "fa-slack-hash": ["fab"], "fa-church": ["fas"], "fa-fingerprint": ["fas"], "fa-journal-whills": ["fas"], "fa-clipboard-check": ["fas"], "fa-centercode": ["fab"], "fa-passport": ["fas"], "fa-tencent-weibo": ["fab"], "fa-old-republic": ["fab"], "fa-snapchat-ghost": ["fab"], "fa-charging-station": ["fas"], "fa-pray": ["fas"], "fa-bandcamp": ["fab"], "fa-whmcs": ["fab"], "fa-clipboard-list": ["fas"], "fa-researchgate": ["fab"], "fa-sort-down": ["fas"], "fa-chart-area": ["fas"], "fa-firefox-browser": ["fab"], "fa-dice-d6": ["fas"], "fa-horse": ["fas"], "fa-calendar-week": ["fas"], "fa-paypal": ["fab"], "fa-bug": ["fas"], "fa-diagnoses": ["fas"], "fa-google": ["fab"], "fa-transgender": ["fas"], "fa-file-alt": ["fas", "far"], "fa-user-tag": ["fas"], "fa-twitter-square": ["fab"], "fa-instalod": ["fab"], "fa-js": ["fab"], "fa-sistrix": ["fab"], "fa-weixin": ["fab"], "fa-square": ["fas", "far"], "fa-check-circle": ["fas", "far"], "fa-id-badge": ["fas", "far"], "fa-save": ["fas", "far"], "fa-hand-point-left": ["fas", "far"], "fa-evernote": ["fab"], "fa-thermometer-empty": ["fas"], "fa-font-awesome-logo-full": ["fab", "fas", "far"], "fa-head-side-cough-slash": ["fas"], "fa-venus-double": ["fas"], "fa-chess-queen": ["fas"], "fa-resolving": ["fab"], "fa-pastafarianism": ["fas"], "fa-info-circle": ["fas"], "fa-compress": ["fas"], "fa-sleigh": ["fas"], "fa-grimace": ["fas", "far"], "fa-hotel": ["fas"], "fa-phoenix-squadron": ["fab"], "fa-hand-lizard": ["fas", "far"], "fa-facebook-f": ["fab"], "fa-paper-plane": ["fas", "far"], "fa-indent": ["fas"], "fa-bell": ["fas", "far"], "fa-ribbon": ["fas"], "fa-street-view": ["fas"], "fa-tablets": ["fas"], "fa-discourse": ["fab"], "fa-fax": ["fas"], "fa-transgender-alt": ["fas"], "fa-node": ["fab"], "fa-nimblr": ["fab"], "fa-file-code": ["fas", "far"], "fa-heart": ["fas", "far"], "fa-arrow-right": ["fas"], "fa-capsules": ["fas"], "fa-puzzle-piece": ["fas"], "fa-camera-retro": ["fas"], "fa-cc-amex": ["fab"], "fa-folder-open": ["fas", "far"], "fa-user-check": ["fas"], "fa-mars": ["fas"], "fa-copy": ["fas", "far"], "fa-heart-broken": ["fas"], "fa-project-diagram": ["fas"], "fa-trash": ["fas"], "fa-cannabis": ["fas"], "fa-sort-numeric-up": ["fas"], "fa-opencart": ["fab"], "fa-prescription-bottle-alt": ["fas"], "fa-lungs": ["fas"], "fa-inbox": ["fas"], "fa-sort-numeric-down": ["fas"], "fa-teamspeak": ["fab"], "fa-gas-pump": ["fas"], "fa-thermometer": ["fas"], "fa-truck-pickup": ["fas"], "fa-money-bill-wave-alt": ["fas"], "fa-hourglass": ["fas", "far"], "fa-arrow-alt-circle-up": ["fas", "far"], "fa-table": ["fas"], "fa-sort-numeric-down-alt": ["fas"], "fa-sourcetree": ["fab"], "fa-mizuni": ["fab"], "fa-minus-square": ["fas", "far"], "fa-vimeo": ["fab"], "fa-cloud-download-alt": ["fas"], "fa-cookie": ["fas"], "fa-cloud": ["fas"], "fa-themeco": ["fab"], "fa-dice": ["fas"], "fa-greater-than-equal": ["fas"], "fa-map-marker": ["fas"], "fa-head-side-cough": ["fas"], "fa-align-right": ["fas"], "fa-dribbble-square": ["fab"], "fa-sync": ["fas"], "fa-arrow-circle-left": ["fas"], "fa-bowling-ball": ["fas"], "fa-id-card": ["fas", "far"], "fa-rev": ["fab"], "fa-flag": ["fas", "far"], "fa-code": ["fas"], "fa-wallet": ["fas"], "fa-ambulance": ["fas"], "fa-hiking": ["fas"], "fa-users-cog": ["fas"], "fa-unlock-alt": ["fas"], "fa-beer": ["fas"], "fa-poop": ["fas"], "fa-running": ["fas"], "fa-hand-holding-usd": ["fas"], "fa-google-wallet": ["fab"], "fa-money-bill-wave": ["fas"], "fa-podcast": ["fas"], "fa-poo-storm": ["fas"], "fa-plane-arrival": ["fas"], "fa-genderless": ["fas"], "fa-cloud-meatball": ["fas"], "fa-angrycreative": ["fab"], "fa-wine-glass": ["fas"], "fa-yoast": ["fab"], "fa-file-medical": ["fas"], "fa-graduation-cap": ["fas"], "fa-line": ["fab"], "fa-google-pay": ["fab"], "fa-buy-n-large": ["fab"], "fa-500px": ["fab"], "fa-tablet": ["fas"], "fa-hands-helping": ["fas"], "fa-behance-square": ["fab"], "fa-divide": ["fas"], "fa-sad-cry": ["fas", "far"], "fa-maxcdn": ["fab"], "fa-umbraco": ["fab"], "fa-caret-down": ["fas"], "fa-football-ball": ["fas"], "fa-skull": ["fas"], "fa-suse": ["fab"], "fa-wine-bottle": ["fas"], "fa-linkedin-in": ["fab"], "fa-hands-wash": ["fas"], "fa-keybase": ["fab"], "fa-slack": ["fab"], "fa-invision": ["fab"], "fa-rupee-sign": ["fas"], "fa-confluence": ["fab"], "fa-js-square": ["fab"], "fa-quinscape": ["fab"], "fa-align-left": ["fas"], "fa-anchor": ["fas"], "fa-angle-double-down": ["fas"], "fa-digg": ["fab"], "fa-ups": ["fab"], "fa-fire-extinguisher": ["fas"], "fa-ubuntu": ["fab"], "fa-skull-crossbones": ["fas"], "fa-republican": ["fas"], "fa-award": ["fas"], "fa-bicycle": ["fas"], "fa-disease": ["fas"], "fa-microphone-alt": ["fas"], "fa-microphone-slash": ["fas"], "fa-warehouse": ["fas"], "fa-earlybirds": ["fab"], "fa-long-arrow-alt-up": ["fas"], "fa-vr-cardboard": ["fas"], "fa-envelope": ["fas", "far"], "fa-money-bill": ["fas"], "fa-pallet": ["fas"], "fa-quora": ["fab"], "fa-apple-pay": ["fab"], "fa-lemon": ["fas", "far"], "fa-file-medical-alt": ["fas"], "fa-neuter": ["fas"], "fa-amilia": ["fab"], "fa-chess-bishop": ["fas"], "fa-arrow-alt-circle-right": ["fas", "far"], "fa-grin": ["fas", "far"], "fa-caret-square-up": ["fas", "far"], "fa-globe-americas": ["fas"], "fa-door-closed": ["fas"], "fa-bolt": ["fas"], "fa-helicopter": ["fas"], "fa-cuttlefish": ["fab"], "fa-industry": ["fas"], "fa-periscope": ["fab"], "fa-copyright": ["fas", "far"], "fa-broadcast-tower": ["fas"], "fa-parking": ["fas"], "fa-viber": ["fab"], "fa-plane-slash": ["fas"], "fa-bed": ["fas"], "fa-hryvnia": ["fas"], "fa-lastfm-square": ["fab"], "fa-virus": ["fas"], "fa-dragon": ["fas"], "fa-critical-role": ["fab"], "fa-cc-diners-club": ["fab"], "fa-cogs": ["fas"], "fa-x-ray": ["fas"], "fa-hand-holding-medical": ["fas"], "fa-users-slash": ["fas"], "fa-sitemap": ["fas"], "fa-twitch": ["fab"], "fa-app-store-ios": ["fab"], "fa-megaport": ["fab"], "fa-folder-plus": ["fas"], "fa-crown": ["fas"], "fa-fantasy-flight-games": ["fab"], "fa-male": ["fas"], "fa-certificate": ["fas"], "fa-rocket": ["fas"], "fa-sign-in-alt": ["fas"], "fa-not-equal": ["fas"], "fa-vuejs": ["fab"], "fa-creative-commons-by": ["fab"], "fa-home": ["fas"], "fa-star-of-life": ["fas"], "fa-apple": ["fab"], "fa-soundcloud": ["fab"], "fa-swift": ["fab"], "fa-sith": ["fab"], "fa-lightbulb": ["fas", "far"], "fa-rockrms": ["fab"], "fa-globe-asia": ["fas"], "fa-ethernet": ["fas"], "fa-life-ring": ["fas", "far"], "fa-share-alt": ["fas"], "fa-redhat": ["fab"], "fa-uikit": ["fab"], "fa-futbol": ["fas", "far"], "fa-binoculars": ["fas"], "fa-skyatlas": ["fab"], "fa-vihara": ["fas"], "fa-screwdriver": ["fas"], "fa-hubspot": ["fab"], "fa-school": ["fas"], "fa-free-code-camp": ["fab"], "fa-hand-pointer": ["fas", "far"], "fa-compress-alt": ["fas"], "fa-clipboard": ["fas", "far"], "fa-shopify": ["fab"], "fa-file-excel": ["fas", "far"], "fa-tools": ["fas"], "fa-users": ["fas"], "fa-steam-symbol": ["fab"], "fa-teeth": ["fas"], "fa-usps": ["fab"], "fa-etsy": ["fab"], "fa-infinity": ["fas"], "fa-window-minimize": ["fas", "far"], "fa-hospital-alt": ["fas"], "fa-chromecast": ["fab"], "fa-jenkins": ["fab"], "fa-vimeo-v": ["fab"], "fa-bullhorn": ["fas"], "fa-quidditch": ["fas"], "fa-hamburger": ["fas"], "fa-trello": ["fab"], "fa-medrt": ["fab"], "fa-blackberry": ["fab"], "fa-random": ["fas"], "fa-less-than-equal": ["fas"], "fa-goodreads-g": ["fab"], "fa-vector-square": ["fas"], "fa-wikipedia-w": ["fab"], "fa-icons": ["fas"], "fa-atlassian": ["fab"], "fa-wordpress-simple": ["fab"], "fa-shield-alt": ["fas"], "fa-creative-commons-sampling-plus": ["fab"], "fa-place-of-worship": ["fas"], "fa-chevron-down": ["fas"], "fa-font-awesome-flag": ["fab"], "fa-laravel": ["fab"], "fa-cloudscale": ["fab"], "fa-igloo": ["fas"], "fa-minus-circle": ["fas"], "fa-comment-slash": ["fas"], "fa-sort-amount-up": ["fas"], "fa-coins": ["fas"], "fa-female": ["fas"], "fa-trade-federation": ["fab"], "fa-bible": ["fas"], "fa-user-graduate": ["fas"], "fa-exclamation-triangle": ["fas"], "fa-hippo": ["fas"], "fa-korvue": ["fab"], "fa-search-location": ["fas"], "fa-magic": ["fas"], "fa-strikethrough": ["fas"], "fa-arrows-alt-v": ["fas"], "fa-align-center": ["fas"], "fa-plane-departure": ["fas"], "fa-music": ["fas"], "fa-unlock": ["fas"], "fa-yandex-international": ["fab"], "fa-stripe-s": ["fab"], "fa-pied-piper-pp": ["fab"], "fa-book": ["fas"], "fa-arrow-alt-circle-left": ["fas", "far"], "fa-volume-up": ["fas"], "fa-dove": ["fas"], "fa-pound-sign": ["fas"], "fa-angle-down": ["fas"], "fa-calculator": ["fas"], "fa-creative-commons-pd-alt": ["fab"], "fa-cat": ["fas"], "fa-couch": ["fas"], "fa-unity": ["fab"], "fa-pump-soap": ["fas"], "fa-birthday-cake": ["fas"], "fa-spotify": ["fab"], "fa-italic": ["fas"], "fa-bullseye": ["fas"], "fa-stack-exchange": ["fab"], "fa-battery-three-quarters": ["fas"], "fa-shopping-bag": ["fas"], "fa-npm": ["fab"], "fa-road": ["fas"], "fa-house-user": ["fas"], "fa-safari": ["fab"], "fa-backspace": ["fas"], "fa-calendar-check": ["fas", "far"], "fa-gamepad": ["fas"], "fa-level-up-alt": ["fas"], "fa-forumbee": ["fab"], "fa-file-prescription": ["fas"], "fa-notes-medical": ["fas"], "fa-file-invoice": ["fas"], "fa-text-height": ["fas"], "fa-greater-than": ["fas"], "fa-tooth": ["fas"], "fa-octopus-deploy": ["fab"], "fa-traffic-light": ["fas"], "fa-stumbleupon-circle": ["fab"], "fa-euro-sign": ["fas"], "fa-snowplow": ["fas"], "fa-sad-tear": ["fas", "far"], "fa-trailer": ["fas"], "fa-horse-head": ["fas"], "fa-shuttle-van": ["fas"], "fa-people-carry": ["fas"], "fa-vote-yea": ["fas"], "fa-user-slash": ["fas"], "fa-skiing-nordic": ["fas"], "fa-power-off": ["fas"], "fa-hacker-news": ["fab"], "fa-snapchat": ["fab"], "fa-caret-square-left": ["fas", "far"], "fa-dice-six": ["fas"], "fa-searchengin": ["fab"], "fa-list": ["fas"], "fa-brain": ["fas"], "fa-grin-tongue-wink": ["fas", "far"], "fa-creative-commons-remix": ["fab"], "fa-fist-raised": ["fas"], "fa-globe-europe": ["fas"], "fa-folder": ["fas", "far"], "fa-hammer": ["fas"], "fa-replyd": ["fab"], "fa-paint-roller": ["fas"], "fa-upload": ["fas"], "fa-dolly": ["fas"], "fa-sign": ["fas"], "fa-hornbill": ["fab"], "fa-cocktail": ["fas"], "fa-chess": ["fas"], "fa-ad": ["fas"], "fa-internet-explorer": ["fab"], "fa-glide": ["fab"], "fa-thermometer-quarter": ["fas"], "fa-tractor": ["fas"], "fa-weight-hanging": ["fas"], "fa-file-image": ["fas", "far"], "fa-poll-h": ["fas"], "fa-expeditedssl": ["fab"], "fa-snowflake": ["fas", "far"], "fa-user-ninja": ["fas"], "fa-monero": ["fab"], "fa-react": ["fab"], "fa-fast-forward": ["fas"], "fa-robot": ["fas"], "fa-comment-dots": ["fas", "far"], "fa-chalkboard-teacher": ["fas"], "fa-git-alt": ["fab"], "fa-yandex": ["fab"], "fa-flag-usa": ["fas"], "fa-caravan": ["fas"], "fa-step-forward": ["fas"], "fa-procedures": ["fas"], "fa-briefcase-medical": ["fas"], "fa-pump-medical": ["fas"], "fa-google-play": ["fab"], "fa-truck-moving": ["fas"], "fa-pen-square": ["fas"], "fa-tasks": ["fas"], "fa-sign-out-alt": ["fas"], "fa-thumbtack": ["fas"], "fa-user-injured": ["fas"], "fa-menorah": ["fas"], "fa-dot-circle": ["fas", "far"], "fa-ioxhost": ["fab"], "fa-rust": ["fab"], "fa-fonticons": ["fab"], "fa-question-circle": ["fas", "far"], "fa-perbyte": ["fab"], "fa-tree": ["fas"], "fa-map-marked": ["fas"], "fa-blogger": ["fab"], "fa-smog": ["fas"], "fa-boxes": ["fas"], "fa-square-root-alt": ["fas"], "fa-truck-loading": ["fas"], "fa-slideshare": ["fab"], "fa-hat-cowboy": ["fas"], "fa-hive": ["fab"], "fa-angle-double-left": ["fas"], "fa-sticky-note": ["fas", "far"], "fa-vimeo-square": ["fab"], "fa-glide-g": ["fab"], "fa-frog": ["fas"], "fa-blender": ["fas"], "fa-sort-amount-up-alt": ["fas"], "fa-tiktok": ["fab"], "fa-xbox": ["fab"], "fa-retweet": ["fas"], "fa-hand-point-right": ["fas", "far"], "fa-ebay": ["fab"], "fa-microchip": ["fas"], "fa-grin-beam-sweat": ["fas", "far"], "fa-xing-square": ["fab"], "fa-lungs-virus": ["fas"], "fa-youtube": ["fab"], "fa-patreon": ["fab"], "fa-briefcase": ["fas"], "fa-yahoo": ["fab"], "fa-deskpro": ["fab"], "fa-gratipay": ["fab"], "fa-chevron-circle-down": ["fas"], "fa-joomla": ["fab"], "fa-headphones-alt": ["fas"], "fa-cc-paypal": ["fab"], "fa-think-peaks": ["fab"], "fa-user-md": ["fas"], "fa-file-word": ["fas", "far"], "fa-chalkboard": ["fas"], "fa-rebel": ["fab"], "fa-aviato": ["fab"], "fa-book-reader": ["fas"], "fa-address-book": ["fas", "far"], "fa-arrow-circle-right": ["fas"], "fa-git": ["fab"], "fa-font": ["fas"], "fa-user-edit": ["fas"], "fa-frown-open": ["fas", "far"], "fa-money-check-alt": ["fas"], "fa-skype": ["fab"], "fa-balance-scale-right": ["fas"], "fa-apple-alt": ["fas"], "fa-dice-one": ["fas"], "fa-toggle-off": ["fas"], "fa-film": ["fas"], "fa-chess-rook": ["fas"], "fa-bold": ["fas"], "fa-creative-commons-nc-eu": ["fab"], "fa-digital-ocean": ["fab"], "fa-object-group": ["fas", "far"], "fa-openid": ["fab"], "fa-envelope-open": ["fas", "far"], "fa-laugh-beam": ["fas", "far"], "fa-walking": ["fas"], "fa-grin-tears": ["fas", "far"], "fa-r-project": ["fab"], "fa-battery-empty": ["fas"], "fa-xing": ["fab"], "fa-headset": ["fas"], "fa-exchange-alt": ["fas"], "fa-hamsa": ["fas"], "fa-sellcast": ["fab"], "fa-user-lock": ["fas"], "fa-grin-squint": ["fas", "far"], "fa-laptop-code": ["fas"], "fa-pepper-hot": ["fas"], "fa-synagogue": ["fas"], "fa-car": ["fas"], "fa-weebly": ["fab"], "fa-yammer": ["fab"], "fa-hat-wizard": ["fas"], "fa-percent": ["fas"], "fa-bahai": ["fas"], "fa-vest": ["fas"], "fa-box-open": ["fas"], "fa-medal": ["fas"], "fa-caret-right": ["fas"], "fa-balance-scale-left": ["fas"], "fa-sliders-h": ["fas"], "fa-imdb": ["fab"], "fa-canadian-maple-leaf": ["fab"], "fa-images": ["fas", "far"], "fa-bity": ["fab"], "fa-wordpress": ["fab"], "fa-qrcode": ["fas"], "fa-steam": ["fab"], "fa-file-import": ["fas"], "fa-chair": ["fas"], "fa-ghost": ["fas"], "fa-fill-drip": ["fas"], "fa-tired": ["fas", "far"], "fa-map-marked-alt": ["fas"], "fa-square-full": ["fas"], "fa-dashcube": ["fab"], "fa-user-plus": ["fas"], "fa-temperature-low": ["fas"], "fa-long-arrow-alt-left": ["fas"], "fa-wolf-pack-battalion": ["fab"], "fa-servicestack": ["fab"], "fa-eye-slash": ["fas", "far"], "fa-star": ["fas", "far"], "fa-paw": ["fas"], "fa-wind": ["fas"], "fa-cc-jcb": ["fab"], "fa-arrow-down": ["fas"], "fa-meteor": ["fas"], "fa-ideal": ["fab"], "fa-vk": ["fab"], "fa-sort-numeric-up-alt": ["fas"], "fa-laptop-medical": ["fas"], "fa-hanukiah": ["fas"], "fa-battery-full": ["fas"], "fa-sms": ["fas"], "fa-dizzy": ["fas", "far"], "fa-bookmark": ["fas", "far"], "fa-draw-polygon": ["fas"], "fa-dice-five": ["fas"], "fa-foursquare": ["fab"], "fa-undo-alt": ["fas"], "fa-smoking-ban": ["fas"], "fa-arrow-alt-circle-down": ["fas", "far"], "fa-poo": ["fas"], "fa-code-branch": ["fas"], "fa-hourglass-half": ["fas"], "fa-thermometer-full": ["fas"], "fa-youtube-square": ["fab"], "fa-cpanel": ["fab"], "fa-snowboarding": ["fas"], "fa-file-invoice-dollar": ["fas"], "fa-caret-left": ["fas"], "fa-envira": ["fab"], "fa-pager": ["fas"], "fa-route": ["fas"], "fa-directions": ["fas"], "fa-drum-steelpan": ["fas"], "fa-braille": ["fas"], "fa-java": ["fab"], "fa-yin-yang": ["fas"], "fa-figma": ["fab"], "fa-atom": ["fas"], "fa-tape": ["fas"], "fa-stackpath": ["fab"], "fa-mug-hot": ["fas"], "fa-list-ol": ["fas"], "fa-info": ["fas"], "fa-dice-d20": ["fas"], "fa-pushed": ["fab"], "fa-mosque": ["fas"], "fa-columns": ["fas"], "fa-file-export": ["fas"], "fa-minus": ["fas"], "fa-business-time": ["fas"], "fa-umbrella": ["fas"], "fa-python": ["fab"], "fa-map-marker-alt": ["fas"], "fa-drupal": ["fab"], "fa-signal": ["fas"], "fa-angle-left": ["fas"], "fa-house-damage": ["fas"], "fa-bomb": ["fas"], "fa-building": ["fas", "far"], "fa-node-js": ["fab"], "fa-hand-point-up": ["fas", "far"], "fa-ethereum": ["fab"], "fa-sass": ["fab"], "fa-person-booth": ["fas"], "fa-simplybuilt": ["fab"], "fa-comment-medical": ["fas"], "fa-salesforce": ["fab"], "fa-wpforms": ["fab"], "fa-layer-group": ["fas"], "fa-meh-blank": ["fas", "far"], "fa-gg-circle": ["fab"], "fa-thermometer-three-quarters": ["fas"], "fa-grin-hearts": ["fas", "far"], "fa-phone-square": ["fas"], "fa-crop-alt": ["fas"], "fa-raspberry-pi": ["fab"], "fa-git-square": ["fab"], "fa-speakap": ["fab"], "fa-gitter": ["fab"], "fa-hat-cowboy-side": ["fas"], "fa-file-pdf": ["fas", "far"], "fa-theater-masks": ["fas"], "fa-sync-alt": ["fas"], "fa-creative-commons-nc-jp": ["fab"], "fa-squarespace": ["fab"], "fa-barcode": ["fas"], "fa-cross": ["fas"], "fa-battery-quarter": ["fas"], "fa-chart-bar": ["fas", "far"], "fa-creative-commons-zero": ["fab"], "fa-hdd": ["fas", "far"], "fa-quran": ["fas"], "fa-brush": ["fas"], "fa-hand-point-down": ["fas", "far"], "fa-chess-board": ["fas"], "fa-flag-checkered": ["fas"], "fa-feather": ["fas"], "fa-universal-access": ["fas"], "fa-adversal": ["fab"], "fa-wodu": ["fab"], "fa-laptop": ["fas"], "fa-ravelry": ["fab"], "fa-bimobject": ["fab"], "fa-magento": ["fab"], "fa-waze": ["fab"], "fa-toilet-paper": ["fas"], "fa-creative-commons-sa": ["fab"], "fa-calendar-minus": ["fas", "far"], "fa-tint": ["fas"], "fa-gripfire": ["fab"], "fa-h-square": ["fas"], "fa-lock": ["fas"], "fa-book-dead": ["fas"], "fa-facebook-messenger": ["fab"], "fa-kickstarter-k": ["fab"], "fa-tag": ["fas"], "fa-comments-dollar": ["fas"], "fa-mouse-pointer": ["fas"], "fa-door-open": ["fas"], "fa-btc": ["fab"], "fa-vest-patches": ["fas"], "fa-hourglass-start": ["fas"], "fa-markdown": ["fab"], "fa-link": ["fas"], "fa-mail-bulk": ["fas"], "fa-solar-panel": ["fas"], "fa-crop": ["fas"], "fa-whatsapp": ["fab"], "fa-pied-piper-alt": ["fab"], "fa-sort-alpha-up-alt": ["fas"], "fa-shopping-cart": ["fas"], "fa-bell-slash": ["fas", "far"], "fa-spa": ["fas"], "fa-eject": ["fas"], "fa-ello": ["fab"], "fa-empire": ["fab"], "fa-peace": ["fas"], "fa-star-half": ["fas", "far"], "fa-box-tissue": ["fas"], "fa-trash-alt": ["fas", "far"], "fa-file-signature": ["fas"], "fa-fort-awesome-alt": ["fab"], "fa-search-dollar": ["fas"], "fa-ember": ["fab"], "fa-thumbs-down": ["fas", "far"], "fa-amazon-pay": ["fab"], "fa-pen": ["fas"], "fa-phoenix-framework": ["fab"], "fa-motorcycle": ["fas"], "fa-star-and-crescent": ["fas"], "fa-glass-martini": ["fas"], "fa-itunes-note": ["fab"], "fa-truck": ["fas"], "fa-monument": ["fas"], "fa-steam-square": ["fab"], "fa-virus-slash": ["fas"], "fa-audio-description": ["fas"], "fa-hand-rock": ["fas", "far"], "fa-cubes": ["fas"], "fa-sort-alpha-up": ["fas"], "fa-autoprefixer": ["fab"], "fa-chart-pie": ["fas"], "fa-microblog": ["fab"], "fa-dumpster": ["fas"], "fa-gavel": ["fas"], "fa-pagelines": ["fab"], "fa-sink": ["fas"], "fa-laugh-squint": ["fas", "far"], "fa-paperclip": ["fas"], "fa-won-sign": ["fas"], "fa-schlix": ["fab"], "fa-exclamation": ["fas"], "fa-marker": ["fas"], "fa-trophy": ["fas"], "fa-wpexplorer": ["fab"], "fa-paint-brush": ["fas"], "fa-y-combinator": ["fab"], "fa-database": ["fas"], "fa-terminal": ["fas"], "fa-mixcloud": ["fab"], "fa-shirtsinbulk": ["fab"], "fa-arrow-circle-up": ["fas"], "fa-user-astronaut": ["fas"], "fa-ship": ["fas"], "fa-renren": ["fab"], "fa-instagram-square": ["fab"], "fa-d-and-d-beyond": ["fab"], "fa-cloud-moon-rain": ["fas"] }

    static get icons() { return Object.entries(this.#icons).sort((a, b) => a[0].localeCompare(b[0])) }
    static getStyles(...styles) {
        const icons = {}
        if (!styles.length) styles = null
        for (const [icon, istyles] of this.icons) {
            const intersect = styles?.filter(s => istyles.includes(s)) || istyles
            if (intersect.length > 0) {
                icons[icon] = intersect
            }
        }
        return icons
    }

    static isFacon(string) {
        return ['fab fa-', 'far fa-', 'fas fa-'].includes(string?.substring(0, 7))
    }

    // Checks each glyph can be displayed and removes the invalid ones
    // Slow, so only enabled as needed
    static removeUnavailableIcons() {
        if (this.#hasChecked) return
        for (const [icon, styles] of Object.entries(this.#icons)) {
            for (const style of styles) {
                const el = document.body.add('i', { classes: [style, icon], style: 'visibility: hidden' })
                if (el.offsetHeight < 10) {
                    if (this.#icons[icon].length == 1) {
                        delete this.#icons[icon]
                    } else {
                        this.#icons[icon].remove(style)
                    }
                }
                el.remove()
            }
        }
        this.#hasChecked = true
    }
    static #hasChecked = false
}