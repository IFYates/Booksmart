/*
Boxicons provider.
https://boxicons.com
*/

/*
How to update:
1. https://boxicons.com/cheatsheet
2. Run `JSON.stringify([...document.querySelectorAll('i.bx')].map(e => e.className.slice(3)).sort().reduce((a, b) => {
    const t = b.split('-', 2)[0]
    b = b.slice(t.length + 1)
    a[b] ??= []
    a[b].push(t)
    return a
}, {}))`
3. Replace #icons value
*/
export default class Boxicons {
    static #icons = {"abacus":["bx"],"accessibility":["bx"],"add-to-queue":["bx","bxs"],"adjust":["bx","bxs"],"alarm":["bx","bxs"],"alarm-add":["bx","bxs"],"alarm-exclamation":["bx","bxs"],"alarm-off":["bx","bxs"],"alarm-snooze":["bx","bxs"],"album":["bx","bxs"],"align-justify":["bx"],"align-left":["bx"],"align-middle":["bx"],"align-right":["bx"],"analyse":["bx","bxs"],"anchor":["bx"],"angry":["bx","bxs"],"aperture":["bx"],"arch":["bx","bxs"],"archive":["bx","bxs"],"archive-in":["bx","bxs"],"archive-out":["bx","bxs"],"area":["bx","bxs"],"arrow-back":["bx"],"arrow-from-bottom":["bx","bxs"],"arrow-from-left":["bx","bxs"],"arrow-from-right":["bx","bxs"],"arrow-from-top":["bx","bxs"],"arrow-to-bottom":["bx","bxs"],"arrow-to-left":["bx","bxs"],"arrow-to-right":["bx","bxs"],"arrow-to-top":["bx","bxs"],"at":["bx"],"atom":["bx"],"award":["bx","bxs"],"badge":["bx","bxs"],"badge-check":["bx","bxs"],"baguette":["bx","bxs"],"ball":["bx","bxs"],"band-aid":["bx","bxs"],"bar-chart":["bx"],"bar-chart-alt":["bx"],"bar-chart-alt-2":["bx","bxs"],"bar-chart-square":["bx","bxs"],"barcode":["bx","bxs"],"barcode-reader":["bx"],"baseball":["bx","bxs"],"basket":["bx","bxs"],"basketball":["bx","bxs"],"bath":["bx","bxs"],"battery":["bx","bxs"],"bed":["bx","bxs"],"been-here":["bx","bxs"],"beer":["bx","bxs"],"bell":["bx","bxs"],"bell-minus":["bx","bxs"],"bell-off":["bx","bxs"],"bell-plus":["bx","bxs"],"bible":["bx","bxs"],"bitcoin":["bx","bxl"],"blanket":["bx","bxs"],"block":["bx"],"bluetooth":["bx"],"body":["bx"],"bold":["bx"],"bolt-circle":["bx","bxs"],"bomb":["bx","bxs"],"bone":["bx","bxs"],"bong":["bx","bxs"],"book":["bx","bxs"],"book-add":["bx","bxs"],"book-alt":["bx","bxs"],"book-bookmark":["bx","bxs"],"book-content":["bx","bxs"],"book-heart":["bx","bxs"],"book-open":["bx","bxs"],"book-reader":["bx","bxs"],"bookmark":["bx","bxs"],"bookmark-alt":["bx","bxs"],"bookmark-alt-minus":["bx","bxs"],"bookmark-alt-plus":["bx","bxs"],"bookmark-heart":["bx","bxs"],"bookmark-minus":["bx","bxs"],"bookmark-plus":["bx","bxs"],"bookmarks":["bx","bxs"],"border-all":["bx"],"border-bottom":["bx"],"border-inner":["bx"],"border-left":["bx"],"border-none":["bx"],"border-outer":["bx"],"border-radius":["bx"],"border-right":["bx"],"border-top":["bx"],"bot":["bx","bxs"],"bowl-hot":["bx","bxs"],"bowl-rice":["bx","bxs"],"bowling-ball":["bx","bxs"],"box":["bx","bxs"],"bracket":["bx"],"braille":["bx"],"brain":["bx","bxs"],"briefcase":["bx","bxs"],"briefcase-alt":["bx","bxs"],"briefcase-alt-2":["bx","bxs"],"brightness":["bx","bxs"],"brightness-half":["bx","bxs"],"broadcast":["bx"],"brush":["bx","bxs"],"brush-alt":["bx","bxs"],"bug":["bx","bxs"],"bug-alt":["bx","bxs"],"building":["bx","bxs"],"building-house":["bx","bxs"],"buildings":["bx","bxs"],"bulb":["bx","bxs"],"bullseye":["bx","bxs"],"buoy":["bx","bxs"],"bus":["bx","bxs"],"bus-school":["bx","bxs"],"cabinet":["bx","bxs"],"cable-car":["bx","bxs"],"cake":["bx","bxs"],"calculator":["bx","bxs"],"calendar":["bx","bxs"],"calendar-alt":["bx","bxs"],"calendar-check":["bx","bxs"],"calendar-edit":["bx","bxs"],"calendar-event":["bx","bxs"],"calendar-exclamation":["bx","bxs"],"calendar-heart":["bx","bxs"],"calendar-minus":["bx","bxs"],"calendar-plus":["bx","bxs"],"calendar-star":["bx","bxs"],"calendar-week":["bx","bxs"],"calendar-x":["bx","bxs"],"camera":["bx","bxs"],"camera-home":["bx","bxs"],"camera-movie":["bx","bxs"],"camera-off":["bx","bxs"],"candles":["bx"],"capsule":["bx","bxs"],"captions":["bx","bxs"],"car":["bx","bxs"],"card":["bx","bxs"],"caret-down":["bx"],"caret-down-circle":["bx","bxs"],"caret-down-square":["bx","bxs"],"caret-left":["bx"],"caret-left-circle":["bx","bxs"],"caret-left-square":["bx","bxs"],"caret-right":["bx"],"caret-right-circle":["bx","bxs"],"caret-right-square":["bx","bxs"],"caret-up":["bx"],"caret-up-circle":["bx","bxs"],"caret-up-square":["bx","bxs"],"carousel":["bx","bxs"],"cart":["bx","bxs"],"cart-add":["bx","bxs"],"cart-alt":["bx","bxs"],"cart-download":["bx","bxs"],"cast":["bx"],"category":["bx","bxs"],"category-alt":["bx","bxs"],"cctv":["bx","bxs"],"certification":["bx","bxs"],"chair":["bx"],"chalkboard":["bx","bxs"],"chart":["bx","bxs"],"chat":["bx","bxs"],"check":["bx"],"check-circle":["bx","bxs"],"check-double":["bx"],"check-shield":["bx","bxs"],"check-square":["bx","bxs"],"checkbox":["bx","bxs"],"checkbox-checked":["bx","bxs"],"checkbox-minus":["bx","bxs"],"checkbox-square":["bx"],"cheese":["bx","bxs"],"chevron-down":["bx","bxs"],"chevron-down-circle":["bx","bxs"],"chevron-down-square":["bx","bxs"],"chevron-left":["bx","bxs"],"chevron-left-circle":["bx","bxs"],"chevron-left-square":["bx","bxs"],"chevron-right":["bx","bxs"],"chevron-right-circle":["bx","bxs"],"chevron-right-square":["bx","bxs"],"chevron-up":["bx","bxs"],"chevron-up-circle":["bx","bxs"],"chevron-up-square":["bx","bxs"],"chevrons-down":["bx","bxs"],"chevrons-left":["bx","bxs"],"chevrons-right":["bx","bxs"],"chevrons-up":["bx","bxs"],"child":["bx"],"chip":["bx","bxs"],"church":["bx","bxs"],"circle":["bx","bxs"],"circle-half":["bx","bxs"],"circle-quarter":["bx","bxs"],"circle-three-quarter":["bx","bxs"],"clinic":["bx","bxs"],"clipboard":["bx"],"closet":["bx"],"cloud":["bx","bxs"],"cloud-download":["bx","bxs"],"cloud-drizzle":["bx"],"cloud-light-rain":["bx"],"cloud-lightning":["bx","bxs"],"cloud-rain":["bx","bxs"],"cloud-snow":["bx"],"cloud-upload":["bx","bxs"],"code":["bx"],"code-alt":["bx"],"code-block":["bx"],"code-curly":["bx"],"coffee":["bx","bxs"],"coffee-togo":["bx","bxs"],"cog":["bx","bxs"],"coin":["bx","bxs"],"coin-stack":["bx","bxs"],"collapse":["bx"],"collapse-alt":["bx"],"collapse-horizontal":["bx"],"collapse-vertical":["bx"],"collection":["bx","bxs"],"color":["bx","bxs"],"color-fill":["bx","bxs"],"columns":["bx"],"command":["bx"],"comment":["bx","bxs"],"comment-add":["bx","bxs"],"comment-check":["bx","bxs"],"comment-detail":["bx","bxs"],"comment-dots":["bx","bxs"],"comment-edit":["bx","bxs"],"comment-error":["bx","bxs"],"comment-minus":["bx","bxs"],"comment-x":["bx","bxs"],"compass":["bx","bxs"],"confused":["bx","bxs"],"conversation":["bx","bxs"],"cookie":["bx","bxs"],"cool":["bx","bxs"],"copy":["bx","bxs"],"copy-alt":["bx","bxs"],"copyright":["bx","bxs"],"credit-card":["bx","bxs"],"credit-card-alt":["bx","bxs"],"credit-card-front":["bx","bxs"],"cricket-ball":["bx","bxs"],"crop":["bx","bxs"],"cross":["bx"],"crosshair":["bx"],"crown":["bx","bxs"],"cube":["bx","bxs"],"cube-alt":["bx","bxs"],"cuboid":["bx","bxs"],"current-location":["bx"],"customize":["bx","bxs"],"cut":["bx"],"cycling":["bx"],"cylinder":["bx","bxs"],"data":["bx","bxs"],"desktop":["bx"],"detail":["bx","bxs"],"devices":["bx","bxs"],"dialpad":["bx"],"dialpad-alt":["bx"],"diamond":["bx","bxs"],"dice-1":["bx","bxs"],"dice-2":["bx","bxs"],"dice-3":["bx","bxs"],"dice-4":["bx","bxs"],"dice-5":["bx","bxs"],"dice-6":["bx","bxs"],"directions":["bx","bxs"],"disc":["bx","bxs"],"dish":["bx","bxs"],"dislike":["bx","bxs"],"dizzy":["bx","bxs"],"dna":["bx"],"dock-bottom":["bx","bxs"],"dock-left":["bx","bxs"],"dock-right":["bx","bxs"],"dock-top":["bx","bxs"],"dollar":["bx"],"dollar-circle":["bx","bxs"],"donate-blood":["bx","bxs"],"donate-heart":["bx","bxs"],"door-open":["bx","bxs"],"dots-horizontal":["bx"],"dots-horizontal-rounded":["bx"],"dots-vertical":["bx"],"dots-vertical-rounded":["bx"],"doughnut-chart":["bx","bxs"],"down-arrow":["bx","bxs"],"down-arrow-alt":["bx","bxs"],"down-arrow-circle":["bx","bxs"],"download":["bx","bxs"],"downvote":["bx","bxs"],"drink":["bx","bxs"],"droplet":["bx","bxs"],"dumbbell":["bx"],"duplicate":["bx","bxs"],"edit":["bx","bxs"],"edit-alt":["bx","bxs"],"envelope":["bx","bxs"],"envelope-open":["bx","bxs"],"equalizer":["bx"],"eraser":["bx","bxs"],"error":["bx","bxs"],"error-alt":["bx","bxs"],"error-circle":["bx","bxs"],"euro":["bx"],"exclude":["bx"],"exit":["bx","bxs"],"exit-fullscreen":["bx"],"expand":["bx"],"expand-alt":["bx"],"expand-horizontal":["bx"],"expand-vertical":["bx"],"export":["bx"],"extension":["bx","bxs"],"face":["bx","bxs"],"fast-forward":["bx"],"fast-forward-circle":["bx","bxs"],"female":["bx"],"female-sign":["bx"],"file":["bx","bxs"],"file-blank":["bx","bxs"],"file-find":["bx","bxs"],"film":["bx","bxs"],"filter":["bx"],"filter-alt":["bx","bxs"],"fingerprint":["bx"],"first-aid":["bx","bxs"],"first-page":["bx"],"flag":["bx","bxs"],"folder":["bx","bxs"],"folder-minus":["bx","bxs"],"folder-open":["bx","bxs"],"folder-plus":["bx","bxs"],"font":["bx"],"font-color":["bx"],"font-family":["bx"],"font-size":["bx"],"food-menu":["bx","bxs"],"food-tag":["bx"],"football":["bx"],"fork":["bx"],"fridge":["bx","bxs"],"fullscreen":["bx"],"game":["bx","bxs"],"gas-pump":["bx","bxs"],"ghost":["bx","bxs"],"gift":["bx","bxs"],"git-branch":["bx"],"git-commit":["bx"],"git-compare":["bx"],"git-merge":["bx"],"git-pull-request":["bx"],"git-repo-forked":["bx"],"glasses":["bx"],"glasses-alt":["bx"],"globe":["bx"],"globe-alt":["bx"],"grid":["bx","bxs"],"grid-alt":["bx","bxs"],"grid-horizontal":["bx"],"grid-small":["bx"],"grid-vertical":["bx"],"group":["bx","bxs"],"handicap":["bx"],"happy":["bx","bxs"],"happy-alt":["bx","bxs"],"happy-beaming":["bx","bxs"],"happy-heart-eyes":["bx","bxs"],"hard-hat":["bx","bxs"],"hash":["bx"],"hdd":["bx","bxs"],"heading":["bx"],"headphone":["bx"],"health":["bx"],"heart":["bx","bxs"],"heart-circle":["bx","bxs"],"heart-square":["bx","bxs"],"help-circle":["bx","bxs"],"hide":["bx","bxs"],"highlight":["bx"],"history":["bx"],"hive":["bx"],"home":["bx","bxs"],"home-alt":["bx"],"home-alt-2":["bx","bxs"],"home-circle":["bx","bxs"],"home-heart":["bx","bxs"],"home-smile":["bx","bxs"],"horizontal-center":["bx"],"horizontal-left":["bx"],"horizontal-right":["bx"],"hotel":["bx","bxs"],"hourglass":["bx","bxs"],"id-card":["bx","bxs"],"image":["bx","bxs"],"image-add":["bx","bxs"],"image-alt":["bx","bxs"],"images":["bx"],"import":["bx"],"infinite":["bx"],"info-circle":["bx","bxs"],"info-square":["bx","bxs"],"injection":["bx","bxs"],"intersect":["bx"],"italic":["bx"],"joystick":["bx","bxs"],"joystick-alt":["bx","bxs"],"joystick-button":["bx","bxs"],"key":["bx","bxs"],"knife":["bx"],"label":["bx","bxs"],"landscape":["bx","bxs"],"laptop":["bx"],"last-page":["bx"],"laugh":["bx","bxs"],"layer":["bx","bxs"],"layer-minus":["bx","bxs"],"layer-plus":["bx","bxs"],"layout":["bx","bxs"],"leaf":["bx","bxs"],"left-arrow":["bx","bxs"],"left-arrow-alt":["bx","bxs"],"left-arrow-circle":["bx","bxs"],"left-down-arrow-circle":["bx","bxs"],"left-indent":["bx"],"left-top-arrow-circle":["bx","bxs"],"lemon":["bx","bxs"],"library":["bx"],"like":["bx","bxs"],"line-chart":["bx"],"line-chart-down":["bx"],"link":["bx"],"link-alt":["bx"],"link-external":["bx"],"lira":["bx"],"list-check":["bx"],"list-minus":["bx"],"list-ol":["bx"],"list-plus":["bx"],"list-ul":["bx"],"loader":["bx"],"loader-alt":["bx"],"loader-circle":["bx"],"location-plus":["bx","bxs"],"lock":["bx","bxs"],"lock-alt":["bx","bxs"],"lock-open":["bx","bxs"],"lock-open-alt":["bx","bxs"],"log-in":["bx","bxs"],"log-in-circle":["bx","bxs"],"log-out":["bx","bxs"],"log-out-circle":["bx","bxs"],"low-vision":["bx","bxs"],"magnet":["bx","bxs"],"mail-send":["bx"],"male":["bx"],"male-female":["bx"],"male-sign":["bx"],"map":["bx","bxs"],"map-alt":["bx","bxs"],"map-pin":["bx","bxs"],"mask":["bx","bxs"],"math":["bx"],"medal":["bx","bxs"],"meh":["bx","bxs"],"meh-alt":["bx","bxs"],"meh-blank":["bx","bxs"],"memory-card":["bx","bxs"],"menu":["bx"],"menu-alt-left":["bx"],"menu-alt-right":["bx"],"merge":["bx"],"message":["bx","bxs"],"message-add":["bx","bxs"],"message-alt":["bx","bxs"],"message-alt-add":["bx","bxs"],"message-alt-check":["bx","bxs"],"message-alt-detail":["bx","bxs"],"message-alt-dots":["bx","bxs"],"message-alt-edit":["bx","bxs"],"message-alt-error":["bx","bxs"],"message-alt-minus":["bx","bxs"],"message-alt-x":["bx","bxs"],"message-check":["bx","bxs"],"message-detail":["bx","bxs"],"message-dots":["bx","bxs"],"message-edit":["bx","bxs"],"message-error":["bx","bxs"],"message-minus":["bx","bxs"],"message-rounded":["bx","bxs"],"message-rounded-add":["bx","bxs"],"message-rounded-check":["bx","bxs"],"message-rounded-detail":["bx","bxs"],"message-rounded-dots":["bx","bxs"],"message-rounded-edit":["bx","bxs"],"message-rounded-error":["bx","bxs"],"message-rounded-minus":["bx","bxs"],"message-rounded-x":["bx","bxs"],"message-square":["bx","bxs"],"message-square-add":["bx","bxs"],"message-square-check":["bx","bxs"],"message-square-detail":["bx","bxs"],"message-square-dots":["bx","bxs"],"message-square-edit":["bx","bxs"],"message-square-error":["bx","bxs"],"message-square-minus":["bx","bxs"],"message-square-x":["bx","bxs"],"message-x":["bx","bxs"],"meteor":["bx","bxs"],"microchip":["bx","bxs"],"microphone":["bx","bxs"],"microphone-off":["bx","bxs"],"minus":["bx"],"minus-back":["bx"],"minus-circle":["bx","bxs"],"minus-front":["bx"],"mobile":["bx","bxs"],"mobile-alt":["bx"],"mobile-landscape":["bx"],"mobile-vibration":["bx","bxs"],"money":["bx"],"money-withdraw":["bx"],"moon":["bx","bxs","bxs"],"mouse":["bx","bxs"],"mouse-alt":["bx","bxs"],"move":["bx"],"move-horizontal":["bx"],"move-vertical":["bx"],"movie":["bx","bxs"],"movie-play":["bx","bxs"],"music":["bx","bxs"],"navigation":["bx","bxs"],"network-chart":["bx","bxs"],"news":["bx","bxs"],"no-entry":["bx","bxs"],"no-signal":["bx"],"note":["bx","bxs"],"notepad":["bx","bxs"],"notification":["bx","bxs"],"notification-off":["bx","bxs"],"objects-horizontal-center":["bx","bxs"],"objects-horizontal-left":["bx","bxs"],"objects-horizontal-right":["bx","bxs"],"objects-vertical-bottom":["bx","bxs"],"objects-vertical-center":["bx","bxs"],"objects-vertical-top":["bx","bxs"],"outline":["bx"],"package":["bx","bxs"],"paint":["bx","bxs"],"paint-roll":["bx","bxs"],"palette":["bx","bxs"],"paper-plane":["bx","bxs"],"paperclip":["bx"],"paragraph":["bx"],"party":["bx","bxs"],"paste":["bx","bxs"],"pause":["bx"],"pause-circle":["bx"],"pen":["bx","bxs"],"pencil":["bx","bxs"],"phone":["bx","bxs"],"phone-call":["bx","bxs"],"phone-incoming":["bx","bxs"],"phone-off":["bx","bxs"],"phone-outgoing":["bx","bxs"],"photo-album":["bx","bxs"],"pie-chart":["bx","bxs"],"pie-chart-alt":["bx","bxs"],"pie-chart-alt-2":["bx","bxs"],"pin":["bx","bxs"],"planet":["bx","bxs"],"play":["bx"],"play-circle":["bx"],"plug":["bx","bxs"],"plus":["bx"],"plus-circle":["bx","bxs"],"plus-medical":["bx"],"podcast":["bx"],"pointer":["bx","bxs"],"poll":["bx"],"polygon":["bx","bxs"],"popsicle":["bx","bxs"],"pound":["bx"],"power-off":["bx"],"printer":["bx","bxs"],"pulse":["bx"],"purchase-tag":["bx","bxs"],"purchase-tag-alt":["bx","bxs"],"pyramid":["bx","bxs"],"qr":["bx"],"qr-scan":["bx"],"question-mark":["bx"],"radar":["bx"],"radio":["bx","bxs"],"radio-circle":["bx"],"radio-circle-marked":["bx"],"receipt":["bx","bxs"],"rectangle":["bx","bxs"],"recycle":["bx"],"redo":["bx"],"reflect-horizontal":["bx"],"reflect-vertical":["bx"],"refresh":["bx"],"registered":["bx","bxs"],"rename":["bx","bxs"],"repeat":["bx"],"reply":["bx"],"reply-all":["bx"],"repost":["bx"],"reset":["bx"],"restaurant":["bx"],"revision":["bx"],"rewind":["bx"],"rewind-circle":["bx","bxs"],"rfid":["bx"],"right-arrow":["bx","bxs"],"right-arrow-alt":["bx","bxs"],"right-arrow-circle":["bx","bxs"],"right-down-arrow-circle":["bx","bxs"],"right-indent":["bx"],"right-top-arrow-circle":["bx","bxs"],"rocket":["bx","bxs"],"rotate-left":["bx"],"rotate-right":["bx"],"rss":["bx"],"ruble":["bx"],"ruler":["bx","bxs"],"run":["bx"],"rupee":["bx"],"sad":["bx","bxs"],"save":["bx","bxs"],"scan":["bx"],"scatter-chart":["bx"],"screenshot":["bx"],"search":["bx","bxs"],"search-alt":["bx"],"search-alt-2":["bx","bxs"],"select-multiple":["bx","bxs"],"selection":["bx"],"send":["bx","bxs"],"server":["bx","bxs"],"shape-circle":["bx"],"shape-polygon":["bx"],"shape-square":["bx"],"shape-triangle":["bx"],"share":["bx","bxs"],"share-alt":["bx","bxs"],"shekel":["bx"],"shield":["bx","bxs"],"shield-alt":["bx"],"shield-alt-2":["bx","bxs"],"shield-minus":["bx","bxs"],"shield-plus":["bx","bxs"],"shield-quarter":["bx"],"shield-x":["bx","bxs"],"shocked":["bx","bxs"],"shopping-bag":["bx","bxs"],"show":["bx","bxs"],"show-alt":["bx"],"shower":["bx","bxs"],"shuffle":["bx"],"sidebar":["bx"],"signal-1":["bx"],"signal-2":["bx"],"signal-3":["bx"],"signal-4":["bx"],"signal-5":["bx"],"sitemap":["bx"],"skip-next":["bx"],"skip-next-circle":["bx","bxs"],"skip-previous":["bx"],"skip-previous-circle":["bx","bxs"],"sleepy":["bx","bxs"],"slider":["bx"],"slider-alt":["bx"],"slideshow":["bx","bxs"],"smile":["bx","bxs"],"sort":["bx"],"sort-a-z":["bx"],"sort-alt-2":["bx"],"sort-down":["bx"],"sort-up":["bx"],"sort-z-a":["bx"],"spa":["bx","bxs"],"space-bar":["bx"],"speaker":["bx","bxs"],"spray-can":["bx","bxs"],"spreadsheet":["bx","bxs"],"square":["bx","bxs"],"square-rounded":["bx","bxs"],"star":["bx","bxs"],"station":["bx"],"stats":["bx"],"sticker":["bx","bxs"],"stop":["bx"],"stop-circle":["bx"],"stopwatch":["bx","bxs"],"store":["bx","bxs"],"store-alt":["bx","bxs"],"street-view":["bx"],"strikethrough":["bx"],"subdirectory-left":["bx"],"subdirectory-right":["bx"],"sun":["bx","bxs"],"support":["bx"],"sushi":["bx","bxs"],"swim":["bx"],"sync":["bx"],"tab":["bx"],"table":["bx"],"tachometer":["bx","bxs"],"tag":["bx","bxs"],"tag-alt":["bx","bxs"],"target-lock":["bx"],"task":["bx"],"task-x":["bx"],"taxi":["bx","bxs"],"tennis-ball":["bx","bxs"],"terminal":["bx","bxs"],"test-tube":["bx"],"text":["bx"],"time":["bx","bxs"],"time-five":["bx","bxs"],"timer":["bx","bxs"],"tired":["bx","bxs"],"toggle-left":["bx","bxs"],"toggle-right":["bx","bxs"],"tone":["bx","bxs"],"traffic-cone":["bx","bxs"],"train":["bx","bxs"],"transfer":["bx"],"transfer-alt":["bx"],"trash":["bx","bxs"],"trash-alt":["bx","bxs"],"trending-down":["bx"],"trending-up":["bx"],"trim":["bx"],"trip":["bx"],"trophy":["bx","bxs"],"tv":["bx","bxs"],"underline":["bx"],"undo":["bx"],"unite":["bx"],"universal-access":["bx","bxs"],"unlink":["bx"],"up-arrow":["bx","bxs"],"up-arrow-alt":["bx","bxs"],"up-arrow-circle":["bx","bxs"],"upload":["bx"],"upside-down":["bx","bxs"],"upvote":["bx","bxs"],"usb":["bx"],"user":["bx","bxs"],"user-check":["bx","bxs"],"user-circle":["bx","bxs"],"user-minus":["bx","bxs"],"user-pin":["bx","bxs"],"user-plus":["bx","bxs"],"user-voice":["bx","bxs"],"user-x":["bx","bxs"],"vector":["bx","bxs"],"vertical-bottom":["bx"],"vertical-center":["bx"],"vertical-top":["bx"],"vial":["bx","bxs"],"video":["bx","bxs"],"video-off":["bx","bxs"],"video-plus":["bx","bxs"],"video-recording":["bx","bxs"],"voicemail":["bx"],"volume":["bx","bxs"],"volume-full":["bx","bxs"],"volume-low":["bx","bxs"],"volume-mute":["bx","bxs"],"walk":["bx"],"wallet":["bx","bxs"],"wallet-alt":["bx","bxs"],"water":["bx"],"webcam":["bx","bxs"],"wifi":["bx"],"wifi-0":["bx"],"wifi-1":["bx"],"wifi-2":["bx"],"wifi-off":["bx"],"wind":["bx"],"window":["bx"],"window-alt":["bx","bxs"],"window-close":["bx"],"window-open":["bx"],"windows":["bx","bxl"],"wine":["bx","bxs"],"wink-smile":["bx","bxs"],"wink-tongue":["bx","bxs"],"won":["bx"],"world":["bx"],"wrench":["bx","bxs"],"x":["bx"],"x-circle":["bx","bxs"],"yen":["bx"],"zoom-in":["bx","bxs"],"zoom-out":["bx","bxs"],"500px":["bxl"],"99designs":["bxl"],"adobe":["bxl"],"airbnb":["bxl"],"algolia":["bxl"],"amazon":["bxl"],"android":["bxl"],"angular":["bxl"],"apple":["bxl"],"audible":["bxl"],"aws":["bxl"],"baidu":["bxl"],"behance":["bxl"],"bing":["bxl"],"blender":["bxl"],"blogger":["bxl"],"bootstrap":["bxl"],"c-plus-plus":["bxl"],"chrome":["bxl"],"codepen":["bxl"],"creative-commons":["bxl"],"css3":["bxl"],"dailymotion":["bxl"],"deezer":["bxl"],"dev-to":["bxl"],"deviantart":["bxl"],"digg":["bxl"],"digitalocean":["bxl"],"discord":["bxl"],"discord-alt":["bxl"],"discourse":["bxl"],"django":["bxl"],"docker":["bxl"],"dribbble":["bxl"],"dropbox":["bxl"],"drupal":["bxl"],"ebay":["bxl"],"edge":["bxl"],"etsy":["bxl"],"facebook":["bxl"],"facebook-circle":["bxl"],"facebook-square":["bxl"],"figma":["bxl"],"firebase":["bxl"],"firefox":["bxl"],"flask":["bxl","bxs"],"flickr":["bxl"],"flickr-square":["bxl"],"flutter":["bxl"],"foursquare":["bxl"],"git":["bxl"],"github":["bxl"],"gitlab":["bxl"],"gmail":["bxl"],"go-lang":["bxl"],"google":["bxl"],"google-cloud":["bxl"],"google-plus":["bxl"],"google-plus-circle":["bxl"],"graphql":["bxl"],"heroku":["bxl"],"html5":["bxl"],"imdb":["bxl"],"instagram":["bxl"],"instagram-alt":["bxl"],"internet-explorer":["bxl"],"invision":["bxl"],"java":["bxl"],"javascript":["bxl"],"joomla":["bxl"],"jquery":["bxl"],"jsfiddle":["bxl"],"kickstarter":["bxl"],"kubernetes":["bxl"],"less":["bxl"],"linkedin":["bxl"],"linkedin-square":["bxl"],"magento":["bxl"],"mailchimp":["bxl"],"markdown":["bxl"],"mastercard":["bxl"],"mastodon":["bxl"],"medium":["bxl"],"medium-old":["bxl"],"medium-square":["bxl"],"messenger":["bxl"],"meta":["bxl"],"microsoft":["bxl"],"microsoft-teams":["bxl"],"mongodb":["bxl"],"netlify":["bxl"],"nodejs":["bxl"],"ok-ru":["bxl"],"opera":["bxl"],"patreon":["bxl"],"paypal":["bxl"],"periscope":["bxl"],"php":["bxl"],"pinterest":["bxl"],"pinterest-alt":["bxl"],"play-store":["bxl"],"pocket":["bxl"],"postgresql":["bxl"],"product-hunt":["bxl"],"python":["bxl"],"quora":["bxl"],"react":["bxl"],"redbubble":["bxl"],"reddit":["bxl"],"redux":["bxl"],"sass":["bxl"],"shopify":["bxl"],"sketch":["bxl"],"skype":["bxl"],"slack":["bxl"],"slack-old":["bxl"],"snapchat":["bxl"],"soundcloud":["bxl"],"spotify":["bxl"],"spring-boot":["bxl"],"squarespace":["bxl"],"stack-overflow":["bxl"],"steam":["bxl"],"stripe":["bxl"],"tailwind-css":["bxl"],"telegram":["bxl"],"tiktok":["bxl"],"trello":["bxl"],"trip-advisor":["bxl"],"tumblr":["bxl"],"tux":["bxl"],"twitch":["bxl"],"twitter":["bxl"],"typescript":["bxl"],"unity":["bxl"],"unsplash":["bxl"],"upwork":["bxl"],"venmo":["bxl"],"vimeo":["bxl"],"visa":["bxl"],"visual-studio":["bxl"],"vk":["bxl"],"vuejs":["bxl"],"whatsapp":["bxl"],"whatsapp-square":["bxl"],"wikipedia":["bxl"],"wix":["bxl"],"wordpress":["bxl"],"xing":["bxl"],"yahoo":["bxl"],"yelp":["bxl"],"youtube":["bxl"],"zoom":["bxl"],"adjust-alt":["bxs"],"ambulance":["bxs"],"baby-carriage":["bxs"],"backpack":["bxs"],"badge-dollar":["bxs"],"balloon":["bxs"],"bank":["bxs"],"battery-charging":["bxs"],"battery-full":["bxs"],"battery-low":["bxs"],"bell-ring":["bxs"],"binoculars":["bxs"],"bolt":["bxs"],"bookmark-star":["bxs"],"business":["bxs"],"camera-plus":["bxs"],"car-battery":["bxs"],"car-crash":["bxs"],"car-garage":["bxs"],"car-mechanic":["bxs"],"car-wash":["bxs"],"castle":["bxs"],"cat":["bxs"],"chess":["bxs"],"city":["bxs"],"coffee-alt":["bxs"],"coffee-bean":["bxs"],"component":["bxs"],"contact":["bxs"],"coupon":["bxs"],"dashboard":["bxs"],"direction-left":["bxs"],"direction-right":["bxs"],"discount":["bxs"],"dog":["bxs"],"down-arrow-square":["bxs"],"droplet-half":["bxs"],"dryer":["bxs"],"edit-location":["bxs"],"eject":["bxs"],"ev-station":["bxs"],"eyedropper":["bxs"],"face-mask":["bxs"],"factory":["bxs"],"file-archive":["bxs"],"file-css":["bxs"],"file-doc":["bxs"],"file-export":["bxs"],"file-gif":["bxs"],"file-html":["bxs"],"file-image":["bxs"],"file-import":["bxs"],"file-jpg":["bxs"],"file-js":["bxs"],"file-json":["bxs"],"file-md":["bxs"],"file-pdf":["bxs"],"file-plus":["bxs"],"file-png":["bxs"],"file-txt":["bxs"],"flag-alt":["bxs"],"flag-checkered":["bxs"],"flame":["bxs"],"florist":["bxs"],"graduation":["bxs"],"guitar-amp":["bxs"],"hand":["bxs"],"hand-down":["bxs"],"hand-left":["bxs"],"hand-right":["bxs"],"hand-up":["bxs"],"hot":["bxs"],"hourglass-bottom":["bxs"],"hourglass-top":["bxs"],"inbox":["bxs"],"institution":["bxs"],"invader":["bxs"],"keyboard":["bxs"],"landmark":["bxs"],"left-arrow-square":["bxs"],"magic-wand":["bxs"],"megaphone":["bxs"],"microphone-alt":["bxs"],"minus-square":["bxs"],"offer":["bxs"],"parking":["bxs"],"pear":["bxs"],"piano":["bxs"],"pizza":["bxs"],"plane":["bxs"],"plane-alt":["bxs"],"plane-land":["bxs"],"plane-take-off":["bxs"],"playlist":["bxs"],"plus-square":["bxs"],"quote-alt-left":["bxs"],"quote-alt-right":["bxs"],"quote-left":["bxs"],"quote-right":["bxs"],"quote-single-left":["bxs"],"quote-single-right":["bxs"],"radiation":["bxs"],"report":["bxs"],"right-arrow-square":["bxs"],"school":["bxs"],"shapes":["bxs"],"ship":["bxs"],"shopping-bag-alt":["bxs"],"shopping-bags":["bxs"],"skull":["bxs"],"sort-alt":["bxs"],"star-half":["bxs"],"t-shirt":["bxs"],"tag-x":["bxs"],"thermometer":["bxs"],"to-top":["bxs"],"torch":["bxs"],"traffic":["bxs"],"traffic-barrier":["bxs"],"tree":["bxs"],"tree-alt":["bxs"],"truck":["bxs"],"up-arrow-square":["bxs"],"user-account":["bxs"],"user-badge":["bxs"],"user-detail":["bxs"],"user-rectangle":["bxs"],"videos":["bxs"],"virus":["bxs"],"virus-block":["bxs"],"washer":["bxs"],"watch":["bxs"],"watch-alt":["bxs"],"widget":["bxs"],"x-square":["bxs"],"yin-yang":["bxs"],"zap":["bxs"]}

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

    static isBoxicon(string) {
        return string?.slice(0, 3) == 'bx '
    }
}