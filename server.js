const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { readJSON, writeJSON, BLOG_CATEGORIES, formatDrawMonth } = require("./admin/data");
const { seedAdminUsers } = require("./admin/auth");
const { syncGoogleReviews, PLACE_ID, SAGO_PLACE_ID } = require("./admin/reviews");
const { t } = require("./translations");
const { defaultCategories, defaultFaqs } = require("./category-data");
const { complexBusinesses } = require("./complex-data");
const googleMapsPlaceUrl = `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`;
const sagoMapsPlaceUrl = `https://www.google.com/maps/place/?q=place_id:${SAGO_PLACE_ID}`;

const app = express();
const publicDir = path.join(__dirname, "public");
const port = process.env.PORT || 3000;
const siteUrl = "https://www.lnmenterprises.ca";

/* ── Seed defaults + load from JSON ── */
seedAdminUsers();
if (!readJSON("categories.json")) writeJSON("categories.json", defaultCategories);
if (!readJSON("faqs.json")) writeJSON("faqs.json", defaultFaqs);
if (!readJSON("site-content.json")) {
  writeJSON("site-content.json", {
    businessName: "L&M Enterprises",
    phone: "+1-613-396-2224",
    address: "43 Dundas Street, Deseronto, ON K0K 1X0",
    hours: "6:00 AM - 10:00 PM",
    hoursNote: "Open Daily",
    promoBanner: "Win $1000 in FREE GAS! Monthly contest with SAGO Gas Bar",
    facebookUrl: "https://www.facebook.com/LandMEnterprises",
  });
}
if (!readJSON("blog-posts.json")) writeJSON("blog-posts.json", []);

// Seed blog posts if they don't already exist
(function seedBlogPosts() {
  const posts = readJSON("blog-posts.json", []);
  const seedPosts = [
    {
      id: "seed001",
      title: "Welcome to L&M Enterprises \u2014 Now Online",
      slug: "welcome-to-lm-enterprises-now-online",
      excerpt: "We\u2019re excited to launch our new website and bring L&M Enterprises online. Learn about what\u2019s new and what to expect from our Deseronto location.",
      content: "We\u2019re thrilled to announce the launch of our brand-new website for L&M Enterprises. After years of serving the Tyendinaga Mohawk Territory and Deseronto community, we\u2019re bringing the L&M experience online.\n\nOur new site makes it easier than ever to learn about our products, check our hours, and stay up to date on promotions. Whether you\u2019re stopping in for gas, grabbing a quick snack, or picking up your favourite tobacco and vape products, L&M Enterprises is your one-stop shop on Dundas Street.\n\nWhat\u2019s coming next? We\u2019ll be using this blog to share store news, product spotlights, fuel-saving tips, and community updates. Bookmark the page and check back often.\n\nWe want to thank every customer who has supported us over the years. Your loyalty keeps us going, and we\u2019re committed to offering competitive prices, friendly service, and a clean, well-stocked store every single day.\n\nSee you at 43 Dundas Street, Deseronto. Stop in and say hello!",
      category: "Store News",
      featuredImage: "/images/blog/welcome-lm-enterprises.jpg",
      featuredImageAlt: "L&M Enterprises store front in Deseronto, Ontario",
      author: "L&M Enterprises",
      date: "2026-03-01",
      published: true
    },
    {
      id: "seed002",
      title: "5 Ways to Save on Gas This Spring",
      slug: "5-ways-to-save-on-gas-this-spring",
      excerpt: "Fuel prices fluctuate, but these five practical tips will help you get more kilometres out of every fill-up at L&M Enterprises.",
      content: "Gas prices can take a big bite out of your budget, especially if you commute or drive for work. Here are five practical tips to help you save at the pump this spring.\n\n1. Keep your tires properly inflated. Under-inflated tires increase rolling resistance, which means your engine works harder and burns more fuel. Check your tire pressure at least once a month.\n\n2. Drive smoothly. Aggressive acceleration and hard braking can increase fuel consumption by up to 40 percent. Ease into speed and coast to a stop whenever it\u2019s safe to do so.\n\n3. Remove extra weight. That box of tools or bag of sports gear in your trunk adds weight your engine has to haul around. Clear out anything you don\u2019t need for today\u2019s trip.\n\n4. Plan your errands. Combining multiple stops into one loop saves fuel compared to making separate trips. A warm engine is more fuel-efficient than a cold one, so batch your errands together.\n\n5. Fill up at L&M Enterprises. We work hard to keep our fuel prices competitive. Pair that with our monthly Win $1000 in FREE GAS contest through SAGO Gas Bar, and you\u2019ll stretch every dollar further.\n\nStop by 43 Dundas Street in Deseronto and fuel up smart this season.",
      category: "Tips & Savings",
      featuredImage: "/images/blog/save-on-gas-tips.jpg",
      featuredImageAlt: "Fuel pump with money-saving tips",
      author: "L&M Enterprises",
      date: "2026-03-05",
      published: true
    },
    {
      id: "seed003",
      title: "Your Quick Guide to Our Convenience Store",
      slug: "your-quick-guide-to-our-convenience-store",
      excerpt: "From snacks and drinks to everyday essentials, here\u2019s what you\u2019ll find inside L&M Enterprises\u2019 fully stocked convenience store.",
      content: "Need a cold drink on a hot day? Forgot milk on the way home? Looking for a quick lunch? Our convenience store has you covered.\n\nAt L&M Enterprises, we carry a wide selection of everyday items so you never have to make a special trip to a big-box store. Here\u2019s a look at what you\u2019ll find on our shelves.\n\nSnacks and drinks are our bread and butter. We stock chips, chocolate bars, jerky, gum, and candy alongside a full cooler of pop, juice, water, energy drinks, and iced tea. Perfect for road trips or a mid-afternoon pick-me-up.\n\nEveryday essentials are always in stock. We carry bread, milk, eggs, butter, canned goods, and basic toiletries. If you run out of something at home, chances are we have it.\n\nSeasonal items rotate throughout the year. In summer, you\u2019ll find ice, sunscreen, and bug spray. In winter, we keep windshield washer fluid and hand warmers near the front.\n\nLottery tickets are available at the counter. Try your luck with scratch cards or draw-based games while you\u2019re picking up your other items.\n\nWe pride ourselves on keeping our store clean, well-organized, and easy to shop. Pop in next time you need something quick \u2014 we\u2019re open 6 AM to 10 PM daily at 43 Dundas Street, Deseronto.",
      category: "Product Spotlight",
      featuredImage: "/images/blog/convenience-store-guide.jpg",
      featuredImageAlt: "Convenience store shelves stocked with snacks and drinks",
      author: "L&M Enterprises",
      date: "2026-03-08",
      published: true
    },
    {
      id: "seed004",
      title: "Understanding Vape Products at L&M",
      slug: "understanding-vape-products-at-lm",
      excerpt: "New to vaping or looking for something different? Here\u2019s what we carry and how our staff can help you choose the right product.",
      content: "Whether you\u2019re an experienced vaper or just exploring your options, L&M Enterprises carries a solid selection of vape and tobacco products to suit different preferences.\n\nOur vape selection includes disposable vapes, pod systems, and a variety of e-liquid flavours. We carry well-known brands and rotate new arrivals regularly, so there\u2019s usually something new to try on your next visit.\n\nFor traditional tobacco customers, we stock a full range of cigarettes, cigars, rolling tobacco, and accessories. Our prices are competitive, and we keep popular brands in stock so you don\u2019t have to make a second trip.\n\nNot sure what you want? Our staff are happy to answer questions and help you compare options. We can walk you through nicotine strengths, flavour profiles, and device types so you leave with something that works for you.\n\nA few things to keep in mind. All tobacco and vape products are sold to adults only. We check ID and follow all applicable regulations. If you have questions about what we carry or want to request a specific brand, just ask at the counter.\n\nVisit us at 43 Dundas Street in Deseronto and browse our selection in person. We\u2019re here from 6 AM to 10 PM every day.",
      category: "Vape & Tobacco",
      featuredImage: "/images/blog/vape-tobacco-products.jpg",
      featuredImageAlt: "Vape and tobacco products selection",
      author: "L&M Enterprises",
      date: "2026-03-10",
      published: true
    },
    {
      id: "seed005",
      title: "Serving the Tyendinaga Mohawk Territory Community",
      slug: "serving-the-tyendinaga-mohawk-territory-community",
      excerpt: "L&M Enterprises is proud to be part of the Tyendinaga Mohawk Territory and Deseronto community. Here\u2019s how we give back and support our neighbours.",
      content: "L&M Enterprises is more than a gas station and convenience store. We\u2019re part of a community, and we take that role seriously.\n\nLocated at 43 Dundas Street in Deseronto, right in the heart of the Tyendinaga Mohawk Territory, we serve customers from across the region. From families filling up on a weekend road trip to regulars who stop in every morning for coffee, we see familiar faces every day.\n\nCommunity means showing up. We keep our prices fair because we know budgets are tight. We stay open long hours because we know people need a reliable place to grab essentials early in the morning or late at night.\n\nWe\u2019re proud to be locally owned and operated. When you shop at L&M, your money stays in the community. It supports local jobs, local families, and local growth.\n\nWe also believe in being good neighbours. Whether it\u2019s keeping our lot clean, greeting customers by name, or going the extra mile to track down a product someone needs, we try to do things the right way.\n\nLooking ahead, we\u2019re excited about continuing to improve our store, expand our selection, and find new ways to serve the community better. If you have suggestions or feedback, we\u2019d love to hear from you \u2014 drop by the store or use the contact form on our website.\n\nThank you for supporting L&M Enterprises. We\u2019re here because of you.",
      category: "Community",
      featuredImage: "/images/blog/tyendinaga-community.jpg",
      featuredImageAlt: "Serving the Tyendinaga Mohawk Territory and Deseronto community",
      author: "L&M Enterprises",
      date: "2026-03-12",
      published: true
    },
    {
      id: "seo001",
      title: "The Complete Guide to Gas Prices in Deseronto and Tyendinaga: Why We Have the Cheapest Fill-Up Near the 401",
      slug: "cheapest-gas-prices-deseronto-tyendinaga-near-401",
      excerpt: "Deseronto and the Tyendinaga Mohawk Territory consistently offer some of the lowest gas prices in Ontario. Here\u2019s why drivers from Belleville, Napanee, and the 401 corridor save big by filling up at L&M Enterprises on Highway 49.",
      content: "If you have driven through the Deseronto and Tyendinaga Mohawk Territory area on Highway 49, you have probably noticed something that catches every driver\u2019s attention: the gas prices here are consistently among the lowest in all of Ontario.\n\nThis is not a fluke. There is a reason the stretch of Highway 49 between the 401 and Deseronto has become one of the most popular fuel stops in Eastern Ontario. Let us break down why gas is cheaper here, how much you can save, and why L&M Enterprises should be your go-to stop.\n\nWhy Gas Prices Are Lower in Deseronto and Tyendinaga\n\nThe Deseronto and Tyendinaga area has one of the highest concentrations of gas stations in Ontario. Within just a few kilometres along Highway 49, there are over a dozen fuel stations competing for your business. That kind of competition keeps prices sharp.\n\nThe result is that gas prices along Highway 49 regularly come in well below what you would pay at stations in Belleville, Napanee, Kingston, or at any of the highway rest stops along the 401. GasBuddy data consistently shows Deseronto area stations among the lowest-priced in the province.\n\nHow Much Can You Actually Save?\n\nThe savings add up fast. On a typical fill-up of 50 litres, the price difference between Deseronto area stations and a Belleville or Napanee station can easily save you five to ten dollars or more. For commuters who fill up weekly, that is hundreds of dollars a year staying in your pocket.\n\nFor drivers passing through on the 401, the five-minute detour down Highway 49 to L&M Enterprises pays for itself on a single tank. Whether you are driving between Toronto and Montreal, heading to Ottawa, or commuting between Kingston and Belleville, stopping in Deseronto is the smart move.\n\nWhat Fuels Does L&M Enterprises Offer?\n\nAt L&M Enterprises, we offer regular unleaded gasoline at competitive prices every day. Our pumps are well-maintained, our lot is clean, and we are open from 6 AM to 10 PM daily so you can fill up early in the morning or on your way home in the evening.\n\nWhile you are filling up, step inside our fully stocked convenience store for snacks, drinks, tobacco products, vapes, cigars, and everyday essentials. One stop covers everything you need.\n\nHow to Find L&M Enterprises from the 401\n\nGetting here from the 401 is simple. Take the Highway 49 South exit near Marysville. Head south on Highway 49 toward Deseronto. L&M Enterprises is located at 43 Dundas Street, just a five-minute drive from the highway.\n\nThe route is straightforward with no complicated turns. You will pass several other gas stations along the way, but keep driving to L&M for the best combination of price, service, and convenience store selection.\n\nDirections from Belleville: Head east on Highway 2 or take the 401 east to Highway 49 South. About 20 minutes total.\n\nDirections from Napanee: Head west on Highway 2 or take the 401 west to Highway 49 South. About 15 minutes total.\n\nDirections from Kingston: Take the 401 west to Highway 49 South. About 45 minutes.\n\nSeasonal Price Trends\n\nGas prices in Ontario tend to rise in the summer months as demand increases with road trip season. The good news is that the competitive Deseronto market means prices here stay lower than average even during peak season.\n\nSpring and fall tend to offer the best prices. Winter can see slight increases due to supply factors, but the Deseronto area still comes out ahead compared to most Eastern Ontario communities.\n\nCheck Before You Drive\n\nWant to see current prices before you make the trip? Check GasBuddy for real-time Deseronto gas prices. You can also follow L&M Enterprises on social media for updates on pricing and promotions.\n\nThe Bottom Line\n\nWhether you live in Deseronto, commute through the Bay of Quinte area, or are passing through on the 401, filling up at L&M Enterprises on Highway 49 is one of the easiest ways to save money on fuel in Ontario. Our prices are competitive, our store is stocked, and our staff are friendly.\n\nStop by L&M Enterprises at 43 Dundas Street, Deseronto. We are open 6 AM to 10 PM daily. Your wallet will thank you.",
      category: "Gas & Fuel",
      featuredImage: "/images/blog/gas-prices-deseronto.jpg",
      featuredImageAlt: "Gas pumps at L&M Enterprises in Deseronto offering competitive fuel prices near Highway 401",
      author: "L&M Enterprises",
      date: "2026-03-14",
      published: true
    },
    {
      id: "seo002",
      title: "Gas Station Near the 401: Why Deseronto Is the Best Exit for Cheap Fuel Between Kingston and Belleville",
      slug: "gas-station-near-401-deseronto-cheapest-fuel-kingston-belleville",
      excerpt: "Driving the 401 between Kingston and Belleville? The Highway 49 exit to Deseronto puts you five minutes from some of the cheapest gas in Ontario at L&M Enterprises.",
      content: "If you are driving the Highway 401 anywhere between Kingston and Belleville, here is a tip that experienced Ontario drivers already know: take the Highway 49 exit south toward Deseronto. In about five minutes, you will find gas prices that are significantly cheaper than anything along the 401 itself.\n\nL&M Enterprises at 43 Dundas Street in Deseronto is right on Highway 49, making it one of the easiest and most rewarding fuel stops for 401 travellers.\n\nThe Five-Minute Detour That Pays for Itself\n\nThe Highway 49 exit off the 401 is clearly marked. Head south and you will reach L&M Enterprises within five minutes. The road is straight, well-maintained, and easy to navigate even for larger vehicles.\n\nThe savings are real. Gas prices in the Deseronto and Tyendinaga area regularly come in significantly lower than what you will find at highway rest stops, truck stops, or gas stations in Belleville, Napanee, or along the 401 corridor. On a full tank, you can easily save enough to cover a coffee and a snack from our convenience store.\n\nAfter you fill up, getting back on the 401 is just as easy. Head north on Highway 49 and you are back on the highway in minutes, continuing your journey with a full tank and more money in your pocket.\n\nPerfect for Long-Distance Drivers\n\nThe 401 is the busiest highway in North America, carrying hundreds of thousands of vehicles every day. Whether you are making the Toronto to Montreal drive, heading from Toronto to Ottawa via the 416, driving between Kingston and Belleville for work, or on a road trip through Eastern Ontario, the Deseronto exit is your smart fuel stop.\n\nMany experienced drivers and truckers already know about the Deseronto gas price advantage. RV forums, travel groups, and GasBuddy communities regularly mention the Highway 49 corridor as one of the best fuel stops in the province.\n\nMore Than Just Gas\n\nWhen you pull into L&M Enterprises, you get more than cheap fuel. Our convenience store is fully stocked with everything you need for the road ahead.\n\nSnacks and drinks for the drive, including chips, chocolate bars, jerky, cold pop, water, juice, and energy drinks. Coffee and hot beverages to keep you alert on long drives. Tobacco products including cigarettes, rolling tobacco, and accessories. A full vape selection with disposable vapes, pod systems, and e-liquid. Cigars for every budget and occasion. Everyday essentials if you need anything on the go.\n\nOur staff are friendly and knowledgeable. If you need directions, a product recommendation, or just a quick chat to break up a long drive, we are happy to help.\n\nOpen When You Need Us\n\nL&M Enterprises is open from 6 AM to 10 PM daily. That means we are here for early-morning commuters leaving Kingston for Belleville, afternoon travellers heading to Ottawa or Montreal, and evening drivers making their way home.\n\nHow to Find Us from the 401\n\nTake the Highway 49 South exit from the 401 near Marysville. Drive south on Highway 49 for approximately five minutes. L&M Enterprises is located at 43 Dundas Street in Deseronto, right on the main road. You cannot miss us.\n\nComing from the west, this is the exit after Shannonville. Coming from the east, it is the exit before Napanee. The interchange is well-signed and easy to navigate.\n\nWhy This Stop Makes Sense\n\nLet us do the math. A typical sedan has a 50-litre tank. If Deseronto gas prices are even a few cents per litre cheaper than 401 highway stations, which they usually are by a noticeable margin, you save several dollars per fill-up.\n\nIf you drive the 401 regularly, those savings compound quickly. Weekly commuters could save hundreds of dollars a year just by making L&M Enterprises their regular fuel stop.\n\nAnd the detour costs you less than ten minutes. That is a hard deal to beat.\n\nJoin the Drivers Who Already Know\n\nThousands of drivers already take the Highway 49 exit to fill up in Deseronto. Now you know why. Cheaper gas, a great convenience store, and a quick easy detour that gets you back on the 401 in minutes.\n\nNext time you are driving between Kingston and Belleville, take the Highway 49 exit and stop at L&M Enterprises. Your tank and your wallet will both be fuller for it.\n\nL&M Enterprises is located at 43 Dundas Street, Deseronto, Ontario. Open 6 AM to 10 PM daily.",
      category: "Gas & Fuel",
      featuredImage: "/images/blog/highway-49-401-exit.jpg",
      featuredImageAlt: "Highway 401 exit to Deseronto for cheap gas at L&M Enterprises",
      author: "L&M Enterprises",
      date: "2026-03-14",
      published: true
    },
    {
      id: "seo003",
      title: "Driving to Prince Edward County? Stop at L&M Enterprises on Highway 49 for Gas, Snacks, and More",
      slug: "prince-edward-county-stop-lm-enterprises-highway-49-gas-snacks",
      excerpt: "Heading to Prince Edward County via the Skyway Bridge? L&M Enterprises on Highway 49 in Deseronto is your perfect last stop for cheap gas, snacks, and supplies before crossing into the County.",
      content: "If you are heading to Prince Edward County from the east on Highway 49, you are about to drive right past one of the best fuel and supply stops in the region. L&M Enterprises sits on Highway 49 in Deseronto, just minutes before you reach the Bay of Quinte Skyway Bridge that takes you into the County.\n\nWhether you are planning a weekend of wine tasting, a beach day at Sandbanks Provincial Park, or a leisurely drive through the County\u2019s rolling farmland, stopping at L&M first is a smart move. Here is why.\n\nFuel Up Before the County\n\nPrince Edward County is a beautiful destination, but gas options inside the County can be limited and prices tend to be higher in tourist areas like Picton and Wellington. By filling up at L&M Enterprises in Deseronto, you take advantage of some of the lowest gas prices in Ontario.\n\nThe Deseronto and Tyendinaga area is well known for its competitive fuel pricing. You will pay noticeably less per litre here than at stations inside Prince Edward County or along the 401. On a full tank, the savings are enough to put toward a bottle of County wine or a nice lunch.\n\nStock Up on Road Trip Essentials\n\nOur convenience store has everything you need for a day in the County. Cold drinks including pop, water, juice, and iced tea to keep you refreshed during winery visits and beach days. Snacks like chips, chocolate bars, jerky, trail mix, and candy. Ice for your cooler, because nothing ruins a beach day like warm drinks. Sunscreen and bug spray for outdoor adventures. And all the everyday essentials you might have forgotten to pack.\n\nHeading to a campground near Sandbanks or a rental cottage? We have got your last-minute supply needs covered.\n\nTobacco, Vapes, and Cigars\n\nPlanning to enjoy a cigar at sunset overlooking the County? L&M carries a selection of cigars for every occasion and budget. We also stock a full range of cigarettes, rolling tobacco, disposable vapes, pod systems, and vape accessories. Prices on tobacco and vape products in Deseronto are competitive, so stock up before you cross the bridge.\n\nYour Gateway to Prince Edward County\n\nHighway 49 is the eastern gateway to Prince Edward County. The road runs south from the 401 through Deseronto, crosses the Bay of Quinte Skyway Bridge, and enters the County near Ameliasburgh. From there, it is a scenic drive to Picton, the County\u2019s main town, and onward to Sandbanks, Wellington, Bloomfield, and all the other charming County destinations.\n\nL&M Enterprises is perfectly positioned on this route. You will pass right by us on your way to the bridge. Pull in, fill up, grab your supplies, and continue on your way. The whole stop takes just a few minutes.\n\nWhat to Do in Prince Edward County\n\nOnce you cross the Skyway Bridge, Prince Edward County offers some of the best experiences in Ontario. Over forty wineries and cideries dot the countryside, with world-class Pinot Noir and Chardonnay leading the way. Sandbanks Provincial Park features some of the best beaches in Ontario. The town of Picton has charming shops, restaurants, and the Regent Theatre. Bloomfield and Wellington offer farm-to-table dining, craft breweries, and artisan shops. The County\u2019s quiet back roads are perfect for cycling, with gentle hills and stunning lake views.\n\nWhether you are visiting for the day or spending a long weekend, having a full tank and a car stocked with snacks makes the experience that much better.\n\nHow to Find L&M Enterprises\n\nFrom the 401: Take the Highway 49 South exit near Marysville. Drive south for about five minutes. L&M Enterprises is at 43 Dundas Street in Deseronto.\n\nFrom Belleville: Take Highway 2 east or the 401 east to Highway 49 South. About 20 minutes.\n\nFrom Napanee: Take Highway 2 west or the 401 west to Highway 49 South. About 15 minutes.\n\nFrom Kingston: Take the 401 west to Highway 49 South. About 45 minutes.\n\nOnce you leave L&M, continue south on Highway 49. You will cross the Skyway Bridge in about ten minutes and arrive in Prince Edward County.\n\nMake L&M Your County Trip Tradition\n\nMany of our regular customers have made L&M Enterprises their standard stop before heading into the County. They fill up, grab a cold drink and some snacks, and cross the bridge with everything they need for the day.\n\nIt is a simple habit that saves money and time. No need to hunt for a gas station once you are in the County. No paying tourist-area prices. Just a quick, easy stop at a friendly local store with great prices and a well-stocked shop.\n\nNext time you are heading to Prince Edward County, make L&M Enterprises your first stop. We are open 6 AM to 10 PM daily at 43 Dundas Street, Deseronto, Ontario, right on Highway 49 before the Skyway Bridge. See you on your way to the County.",
      category: "Tips & Savings",
      featuredImage: "/images/blog/prince-edward-county.jpg",
      featuredImageAlt: "Bay of Quinte Skyway Bridge on Highway 49 near L&M Enterprises in Deseronto",
      author: "L&M Enterprises",
      date: "2026-03-14",
      published: true
    }
  ];
  let updated = false;
  for (const post of seedPosts) {
    const existing = posts.find(p => p.id === post.id);
    if (!existing) {
      posts.push(post);
      updated = true;
    } else if (existing.featuredImage !== post.featuredImage) {
      existing.featuredImage = post.featuredImage;
      existing.featuredImageAlt = post.featuredImageAlt;
      updated = true;
    }
  }
  if (updated) writeJSON("blog-posts.json", posts);
})();
if (!readJSON("contact-messages.json")) writeJSON("contact-messages.json", []);
if (!readJSON("gas-prices.json")) {
  writeJSON("gas-prices.json", { regular: "0.00", dyedDiesel: "0.00", premium: "0.00", diesel: "0.00", updatedLabel: "", lastUpdatedAt: null });
} else {
  // Migrate old midGrade field to dyedDiesel
  const gp = readJSON("gas-prices.json", {});
  if (gp.midGrade !== undefined && gp.dyedDiesel === undefined) {
    gp.dyedDiesel = gp.midGrade;
    delete gp.midGrade;
    writeJSON("gas-prices.json", gp);
    console.log("Migrated gas-prices.json: midGrade → dyedDiesel");
  }
}
if (!readJSON("promotions.json")) writeJSON("promotions.json", []);
if (!readJSON("winners.json")) writeJSON("winners.json", []);

function loadCategories() { return readJSON("categories.json", defaultCategories); }

function ensureCategoryCopy() {
  const stored = readJSON("categories.json", []) || [];
  const freshBySlug = Object.fromEntries(defaultCategories.map((c) => [c.slug, c]));
  const used = new Set();
  const next = [];
  for (const c of stored) {
    if (freshBySlug[c.slug]) {
      next.push({ ...freshBySlug[c.slug] });
      used.add(c.slug);
    } else {
      next.push(c);
    }
  }
  for (const fresh of defaultCategories) {
    if (!used.has(fresh.slug)) next.push(fresh);
  }
  if (JSON.stringify(next) !== JSON.stringify(stored)) writeJSON("categories.json", next);
}

function ensureFaqCopy() {
  const stored = readJSON("faqs.json", null);
  const hasComplex = stored && stored.some((f) => /Mohawk Medibles/i.test(f.question || ""));
  const stale =
    !stored ||
    !stored.length ||
    stored.some((f) => /separate category pages/i.test(f.question || "")) ||
    !hasComplex;
  if (stale) writeJSON("faqs.json", defaultFaqs);
}
function loadFaqs() { return readJSON("faqs.json", defaultFaqs); }
function loadSiteContent() {
  return readJSON("site-content.json", {
    businessName: "L&M Enterprises", phone: "+1-613-396-2224",
    address: "43 Dundas Street, Deseronto, ON K0K 1X0",
    hours: "6:00 AM - 10:00 PM", hoursNote: "Open Daily",
    promoBanner: "Win $1000 in FREE GAS! Monthly contest with SAGO Gas Bar",
    facebookUrl: "https://www.facebook.com/LandMEnterprises",
  });
}

function loadGasPrices() {
  return readJSON("gas-prices.json", { regular: "0.00", dyedDiesel: "0.00", premium: "0.00", diesel: "0.00", updatedLabel: "", lastUpdatedAt: null });
}
function loadPromotions() {
  return readJSON("promotions.json", []);
}
function loadWinners() {
  return readJSON("winners.json", []);
}
function loadReviews() {
  return readJSON("google-reviews.json", null);
}
function loadSagoReviews() {
  return readJSON("sago-reviews.json", null);
}

function ensureJsonSeed(filename) {
  const seedPath = path.join(__dirname, "seed", filename);
  if (!fs.existsSync(seedPath)) return;
  let seed;
  try {
    seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  } catch {
    return;
  }
  const current = readJSON(filename, null);
  const curQuotes = current && Array.isArray(current.reviews) ? current.reviews.filter((r) => r.text).length : 0;
  const seedQuotes = Array.isArray(seed.reviews) ? seed.reviews.filter((r) => r.text).length : 0;
  const curTotal = (current && current.totalReviews) || 0;
  const seedTotal = seed.totalReviews || 0;
  if (!current || (curQuotes < seedQuotes && curTotal <= seedTotal)) {
    writeJSON(filename, seed);
    console.log(`Seeded ${filename} (${seedQuotes} quotes, ${seedTotal} total)`);
  }
}

function ensureReviewsSeed() {
  ensureJsonSeed("google-reviews.json");
  ensureJsonSeed("sago-reviews.json");
}

app.disable("x-powered-by");
app.use(require("compression")());
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  const umamiHost = process.env.UMAMI_HOST || "https://cloud.umami.is";
  const cspScriptSrc = process.env.UMAMI_WEBSITE_ID ? `'self' ${umamiHost}` : "'self'";
  const cspConnectSrc = process.env.UMAMI_WEBSITE_ID ? `'self' ${umamiHost}` : "'self'";
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src ${cspScriptSrc}; connect-src ${cspConnectSrc}; frame-src 'self' https://www.google.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`,
  );

  if (req.hostname === "lnmenterprises.ca") {
    res.redirect(301, `${siteUrl}${req.originalUrl}`);
    return;
  }

  next();
});

// Language detection
app.use((req, res, next) => {
  const langParam = req.query.lang;
  if (langParam === "fr" || langParam === "en") {
    req.lang = langParam;
    res.cookie("lang", langParam, { maxAge: 365 * 24 * 60 * 60 * 1000, sameSite: "Lax", path: "/" });
  } else {
    const cookieHeader = req.headers.cookie || "";
    const langMatch = cookieHeader.match(/(?:^|;\s*)lang=(\w+)/);
    req.lang = langMatch && langMatch[1] === "fr" ? "fr" : "en";
  }
  next();
});

function pageTemplate({
  title,
  description,
  canonicalPath = "/",
  content,
  jsonLd,
  keywords = [],
  noindex = false,
  ogImage = null,
  lang = "en",
}) {
  const canonical = `${siteUrl}${canonicalPath}`;
  const keywordsContent = keywords.join(", ");
  const robotsContent = noindex ? "noindex, nofollow" : "index, follow";
  const canonicalTag = canonicalPath ? `<link rel="canonical" href="${canonical}" />` : "";

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="keywords" content="${escapeHtml(keywordsContent)}" />
    <meta name="robots" content="${robotsContent}" />
    ${canonicalTag}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="L&amp;M Enterprises" />
    <meta property="og:image" content="${ogImage || `${siteUrl}/og-image.png`}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${ogImage || `${siteUrl}/og-image.png`}" />
    <link rel="alternate" type="application/rss+xml" title="L&amp;M Enterprises Blog" href="${siteUrl}/blog/rss.xml" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#c90019" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/styles.css?v=13" />
    <meta property="og:locale" content="${lang === "fr" ? "fr_CA" : "en_CA"}" />
    <script type="application/ld+json">${JSON.stringify(Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd)}</script>${process.env.GA_MEASUREMENT_ID ? `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(process.env.GA_MEASUREMENT_ID)}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${escapeHtml(process.env.GA_MEASUREMENT_ID)}');
    </script>` : ""}${process.env.UMAMI_WEBSITE_ID ? `
    <script defer src="${process.env.UMAMI_HOST || "https://cloud.umami.is"}/script.js" data-website-id="${escapeHtml(process.env.UMAMI_WEBSITE_ID)}"></script>` : ""}
  </head>
  <body>
    ${content}
  </body>
</html>`;
}

function siteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ConvenienceStore",
    "@id": `${siteUrl}/#business`,
    name: "L&M Enterprises",
    alternateName: "L & M Enterprises",
    description:
      "Convenience store in Deseronto, Ontario next door to SAGO Gas Bar, with tobacco, vape, and everyday essentials in-store and full-service fuel at the pumps.",
    url: siteUrl,
    telephone: "+1-613-396-2224",
    image: [`${siteUrl}/og-image.png`, `${siteUrl}/images/store/exterior.jpg`],
    hasMap: googleMapsPlaceUrl,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "43 Dundas Street",
      addressLocality: "Deseronto",
      addressRegion: "ON",
      postalCode: "K0K 1X0",
      addressCountry: "CA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "44.196220",
      longitude: "-77.064132",
    },
    areaServed: [
      { "@type": "City", name: "Deseronto" },
      { "@type": "AdministrativeArea", name: "Tyendinaga Mohawk Territory" },
    ],
    containedInPlace: {
      "@type": "Place",
      name: "Dundas Street businesses, Deseronto",
      address: {
        "@type": "PostalAddress",
        streetAddress: "39-45 Dundas Street",
        addressLocality: "Deseronto",
        addressRegion: "ON",
        postalCode: "K0K 1X0",
        addressCountry: "CA",
      },
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "06:00",
      closes: "22:00",
    },
    sameAs: [
      "https://www.facebook.com/LandMEnterprises",
      "https://maps.google.com/?cid=417331751451294069",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "In-store categories at L&M Enterprises",
      itemListElement: defaultCategories.map((c, i) => ({
        "@type": "OfferCatalog",
        name: c.nav,
        url: `${siteUrl}/${c.slug}`,
        position: i + 1,
      })),
    },
    department: [
      {
        "@type": "GasStation",
        "@id": `${siteUrl}/gas-station-deseronto#sago`,
        name: "SAGO Gas Bar",
        url: `${siteUrl}/gas-station-deseronto`,
        telephone: "+1-613-396-2224",
        hasMap: sagoMapsPlaceUrl,
        address: {
          "@type": "PostalAddress",
          streetAddress: "39 Dundas Street",
          addressLocality: "Deseronto",
          addressRegion: "ON",
          postalCode: "K0K 1X0",
          addressCountry: "CA",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: "44.1964764",
          longitude: "-77.0640774",
        },
        sameAs: ["https://maps.google.com/?cid=16154812107228605329"],
      },
    ],
  };
  // Google excludes self-serving LocalBusiness ratings from review rich results,
  // including ratings sourced from Google. Keep the visible customer reviews,
  // but do not attach their ratings to this site's own business entities.
  const gp = loadGasPrices();
  if (gp && data.department && data.department[0]) {
    const fuelOffers = [];
    if (gp.regular && !isNaN(parseFloat(gp.regular))) {
      fuelOffers.push({
        "@type": "Offer",
        name: "Regular Gasoline",
        price: (parseFloat(gp.regular) / 100).toFixed(3),
        priceCurrency: "CAD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: (parseFloat(gp.regular) / 100).toFixed(3),
          priceCurrency: "CAD",
          unitCode: "LTR",
          name: "Per Litre",
        },
      });
    }
    if (gp.diesel && !isNaN(parseFloat(gp.diesel))) {
      fuelOffers.push({
        "@type": "Offer",
        name: "Clear Diesel",
        price: (parseFloat(gp.diesel) / 100).toFixed(3),
        priceCurrency: "CAD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: (parseFloat(gp.diesel) / 100).toFixed(3),
          priceCurrency: "CAD",
          unitCode: "LTR",
          name: "Per Litre",
        },
      });
    }
    if (gp.premium && !isNaN(parseFloat(gp.premium))) {
      fuelOffers.push({
        "@type": "Offer",
        name: "Premium Gasoline",
        price: (parseFloat(gp.premium) / 100).toFixed(3),
        priceCurrency: "CAD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: (parseFloat(gp.premium) / 100).toFixed(3),
          priceCurrency: "CAD",
          unitCode: "LTR",
          name: "Per Litre",
        },
      });
    }
    if (fuelOffers.length > 0) {
      data.department[0].makesOffer = fuelOffers;
    }
  }
  return data;
}

function storePicture(basename, alt, extra = "") {
  return `<picture>
    <source srcset="/images/store/${basename}.webp" type="image/webp" />
    <img src="/images/store/${basename}.jpg" alt="${escapeHtml(alt)}" ${extra} />
  </picture>`;
}

function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${siteUrl}${it.path}`,
    })),
  };
}

function categorySchemaType(slug) {
  if (slug === "gas-station-deseronto") return "GasStation";
  if (slug === "convenience-store-deseronto") return "ConvenienceStore";
  if (
    slug === "tobacco-deseronto" ||
    slug === "rolling-tobacco-deseronto" ||
    slug === "cigar-categories-deseronto"
  ) {
    return "TobaccoStore";
  }
  return "Store";
}

function breadcrumbsNav(lang, current) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">
    <a href="/">${t(lang, "nav.home")}</a>
    <span aria-hidden="true">/</span>
    <span>${escapeHtml(current)}</span>
  </nav>`;
}

function faqJsonLd(faqs) {
  const items = faqs || loadFaqs();
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function faqSection(lang, faqs) {
  if (!faqs || !faqs.length) return "";
  const items = faqs
    .map(
      (f) => `
      <article class="faq-item">
        <h3>${escapeHtml(f.question)}</h3>
        <p>${escapeHtml(f.answer)}</p>
      </article>`,
    )
    .join("");
  return `
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>${t(lang, "faq.title")}</h2>
          <div class="section-divider"></div>
        </div>
        <div class="faq-list">${items}</div>
      </div>
    </section>`;
}

function complexJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Dundas Street businesses in Deseronto",
    description:
      "Four locally owned businesses at 39–45 Dundas Street in Deseronto / Tyendinaga Mohawk Territory: SAGO Gas Bar, L&M Enterprises, Mohawk Medibles, and The Stoned Chef.",
    numberOfItems: complexBusinesses.length,
    itemListElement: complexBusinesses.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": b.schemaType,
        name: b.name,
        url: b.href.startsWith("http") ? b.href : `${siteUrl}${b.href === "/" ? "/" : b.href}`,
        telephone: b.telephone,
        hasMap: b.mapsUrl,
        address: {
          "@type": "PostalAddress",
          streetAddress: b.address,
          addressLocality: "Deseronto",
          addressRegion: "ON",
          postalCode: "K0K 1X0",
          addressCountry: "CA",
        },
      },
    })),
  };
}

function complexSection(lang = "en") {
  const iconFor = {
    sago: icons.fuel,
    lnm: icons.shoppingBag,
    medibles: icons.leaf,
    stonedchef: icons.store,
  };
  const cards = complexBusinesses
    .map((b) => {
      const blurb = lang === "fr" ? b.blurbFr : b.blurbEn;
      const extra = b.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `
      <a class="card card-link" href="${escapeHtml(b.href)}"${extra}>
        <div class="icon-circle">${iconFor[b.id] || icons.store}</div>
        <h3>${escapeHtml(b.name)}</h3>
        <p>${escapeHtml(b.address)}</p>
        <p>${escapeHtml(blurb)}</p>
      </a>`;
    })
    .join("");
  return `
    <section class="section section-alt" id="complex">
      <div class="container">
        <div class="section-header">
          <p class="kicker" style="color:var(--accent);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:0.8rem;">${t(lang, "complex.kicker")}</p>
          <h2>${t(lang, "complex.title")}</h2>
          <div class="section-divider"></div>
          <p>${t(lang, "complex.body")}</p>
        </div>
        <div class="complex-grid">${cards}</div>
      </div>
    </section>`;
}

function categoryOfferCards() {
  const iconFor = {
    "gas-station-deseronto": icons.fuel,
    "convenience-store-deseronto": icons.shoppingBag,
    "tobacco-deseronto": icons.leaf,
    "vape-categories-deseronto": icons.leaf,
    "cigar-categories-deseronto": icons.tag,
    "rolling-tobacco-deseronto": icons.tag,
  };
  return loadCategories()
    .map(
      (c) => `
      <a class="card card-link" href="/${escapeHtml(c.slug)}">
        <div class="icon-circle">${iconFor[c.slug] || icons.store}</div>
        <h3>${escapeHtml(c.nav)}</h3>
        <p>${escapeHtml(c.blurb || c.intro)}</p>
      </a>`,
    )
    .join("");
}

/* ── Lucide-style SVG icons (matching the SPA) ── */
const icons = {
  store: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>',
  fuel: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M15 22H3"/><path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/><path d="M7 10h4"/></svg>',
  mapPin: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  phone: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  clock: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  gift: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>',
  facebook: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
  search: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  arrowRight: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  leaf: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
  tag: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
  shoppingBag: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  user: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  calendar: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
  menu: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/></svg>',
};

/* ── Blog helpers ── */
function readingTime(content) {
  const words = (content || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function contentToHtml(text) {
  if (!text) return "";
  return text
    .split(/\n\n+/)
    .map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch { return dateStr; }
}

function blogPostJsonLd(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || (post.content || "").slice(0, 160),
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author || "L&M Enterprises", url: siteUrl },
    publisher: { "@type": "Organization", name: "L&M Enterprises", url: siteUrl, logo: { "@type": "ImageObject", url: `${siteUrl}/og-image.png` } },
    image: post.featuredImage || `${siteUrl}/og-image.png`,
    url: `${siteUrl}/blog/${post.slug}`,
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
    wordCount: (post.content || "").split(/\s+/).filter(Boolean).length,
  };
}

function blogListJsonLd(posts) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "L&M Enterprises Blog",
    url: `${siteUrl}/blog`,
    publisher: { "@type": "Organization", name: "L&M Enterprises" },
    blogPost: posts.slice(0, 10).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${siteUrl}/blog/${p.slug}`,
      datePublished: p.date,
    })),
  };
}

function layout(body, lang = "en") {
  const sc = loadSiteContent();
  const defaultBanner = "Win $1000 in FREE GAS! Monthly contest with SAGO Gas Bar";
  const bannerText = sc.promoBanner && sc.promoBanner !== defaultBanner
    ? sc.promoBanner
    : t(lang, "banner.contest");
  return `
    <a class="skip-link" href="#main">${t(lang, "nav.skip")}</a>
    <div class="promo-banner">
      <div class="container">
        ${icons.gift} ${escapeHtml(bannerText)}
      </div>
    </div>
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="/">
          <span class="brand-mark">${icons.store}</span>
          <span class="brand-text">
            <strong>${escapeHtml(sc.businessName).toUpperCase()}</strong>
            <span>${t(lang, "brand.tagline")}</span>
          </span>
        </a>
        <div class="nav-wrap">
          <input type="checkbox" id="nav-toggle" class="nav-toggle" />
          <label for="nav-toggle" class="nav-summary">${icons.menu}<span class="sr-only">${t(lang, "nav.menu")}</span></label>
          <nav class="nav">
            <a href="/">${t(lang, "nav.home")}</a>
            <a href="/gas-station-deseronto">${t(lang, "nav.prices")}</a>
            <a href="/deseronto-convenience-store-gas-station">${t(lang, "nav.location")}</a>
            <a href="/reviews">${t(lang, "nav.reviews")}</a>
            <a href="/blog">${t(lang, "nav.blog")}</a>
            <a href="/contact-directions">${t(lang, "nav.contact")}</a>
            <a class="nav-cta" href="tel:${escapeHtml(sc.phone)}" data-umami-event="phone-call-nav">${icons.phone} ${t(lang, "nav.callNow")}</a>
            <a href="?lang=${lang === "en" ? "fr" : "en"}" class="lang-switch" title="${lang === "en" ? "Fran\u00e7ais" : "English"}">${lang === "en" ? "FR" : "EN"}</a>
          </nav>
        </div>
      </div>
    </header>
    <div id="main">${body}</div>
    <footer class="site-footer">
      <div class="container">
        <h3 class="footer-title">${escapeHtml(sc.businessName).toUpperCase()}</h3>
        <div class="footer-divider"></div>
        <p class="footer-tagline">${t(lang, "footer.tagline")}</p>
        <div class="footer-contact">
          <a href="tel:${escapeHtml(sc.phone)}" data-umami-event="phone-call-footer">${escapeHtml(sc.phone)}</a>
          <span class="sep">&bull;</span>
          <span>${escapeHtml(sc.address)}</span>
          <span class="sep">&bull;</span>
          <span>${escapeHtml(sc.hoursNote)} ${escapeHtml(sc.hours)}</span>
        </div>
        <p class="footer-links">
          ${loadCategories()
            .map((c) => `<a href="/${escapeHtml(c.slug)}">${escapeHtml(c.nav)}</a>`)
            .join('<span class="sep">&bull;</span>')}
        </p>
        <p class="footer-links">
          ${complexBusinesses
            .map((b) => {
              const extra = b.external ? ' target="_blank" rel="noopener noreferrer"' : "";
              return `<a href="${escapeHtml(b.href)}"${extra}>${escapeHtml(b.name)}</a>`;
            })
            .join('<span class="sep">&bull;</span>')}
        </p>
        <p class="footer-links">
          <a href="/contact-directions">${t(lang, "nav.contact")}</a>
          <span class="sep">&bull;</span>
          <a href="/reviews">${t(lang, "nav.reviews")}</a>
          <span class="sep">&bull;</span>
          <a href="/blog">${t(lang, "nav.blog")}</a>
          <span class="sep">&bull;</span>
          <a href="/deseronto-convenience-store-gas-station">${t(lang, "nav.location")}</a>
        </p>
        <p class="footer-subtext">${t(lang, "footer.serving")}</p>
        <a class="footer-social" href="${escapeHtml(sc.facebookUrl)}" target="_blank" rel="noopener noreferrer" data-umami-event="facebook-link">
          ${icons.facebook} <span>${t(lang, "footer.followUs")}</span>
        </a>
        <div class="footer-bottom">
          &copy; ${new Date().getFullYear()} ${escapeHtml(sc.businessName)}. ${t(lang, "footer.rights")}
        </div>
      </div>
    </footer>
  `;
}

function gasPriceSection(lang = "en") {
  const gp = loadGasPrices();
  const types = [
    { key: "regular", label: t(lang, "gasPrices.regular"), icon: icons.fuel },
    { key: "premium", label: t(lang, "gasPrices.premium"), icon: icons.fuel },
    { key: "dyedDiesel", label: t(lang, "gasPrices.dyedDiesel"), icon: icons.fuel },
    { key: "diesel", label: t(lang, "gasPrices.clearDiesel"), icon: icons.fuel },
  ];
  const cards = types
    .filter((f) => gp[f.key] && gp[f.key] !== "0.00")
    .map(
      (f) => `
      <div class="info-card" style="text-align:center;">
        <div class="icon-circle">${f.icon}</div>
        <h3>${escapeHtml(f.label)}</h3>
        <p style="font-size:2rem;font-weight:800;color:var(--accent);">${escapeHtml(gp[f.key])}<span style="font-size:0.9rem;font-weight:400;color:var(--text-muted);"> &cent;/L</span></p>
      </div>`,
    )
    .join("");

  if (!cards) return "";

  const updatedNote = pricesUpdatedLabel(gp, lang)
    ? `<p style="text-align:center;color:var(--text-muted);margin-top:1rem;font-size:0.9rem;">${escapeHtml(pricesUpdatedLabel(gp, lang))}</p>`
    : "";

  return `
    <section class="section" id="prices">
      <div class="container">
        <div class="section-header">
          <h2>${t(lang, "gasPrices.title")}</h2>
          <div class="section-divider"></div>
          <p>${t(lang, "prices.confirmAtPump")}</p>
        </div>
        <div class="info-grid">${cards}</div>
        ${updatedNote}
      </div>
    </section>`;
}

function promotionsSection(lang = "en") {
  const promos = loadPromotions().filter((p) => p.isActive);
  if (!promos.length) return "";

  const cards = promos
    .map(
      (p) => `
      <article class="card">
        <div class="icon-circle">${icons.gift}</div>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>
        ${p.endDate ? `<p style="font-size:0.85rem;color:var(--text-muted);">Ends: ${escapeHtml(p.endDate)}</p>` : ""}
      </article>`,
    )
    .join("");

  return `
    <section class="section section-alt">
      <div class="container">
        <div class="section-header">
          <h2>${t(lang, "promotions.title")}</h2>
          <div class="section-divider"></div>
        </div>
        <div class="card-grid">${cards}</div>
      </div>
    </section>`;
}

function winnersSection(lang = "en") {
  const winners = loadWinners();
  if (!winners.length) return "";

  const numberLabel = t(lang, "winners.winnerNumber");
  const items = winners.slice(0, 6)
    .map(
      (w) => {
        const headline = w.winningNumber
          ? `<div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.25rem;">${escapeHtml(numberLabel)}</div>
             <h3 style="font-family:ui-monospace,Menlo,monospace;font-size:2rem;color:var(--accent);margin:0 0 0.5rem;">#${escapeHtml(w.winningNumber)}</h3>`
          : `<h3>${escapeHtml(w.name || "")}</h3>`;
        const sub = w.winningNumber && w.name
          ? `<p style="font-weight:600;">${escapeHtml(w.name)}</p>`
          : "";
        const prize = w.prize ? `<p style="font-weight:600;color:var(--accent);">${escapeHtml(w.prize)}</p>` : "";
        const testimonial = w.testimonial ? `<p style="font-style:italic;font-size:0.9rem;color:var(--text-muted);">"${escapeHtml(w.testimonial)}"</p>` : "";
        const formattedDate = formatDrawMonth(w.date, lang);
        const date = formattedDate ? `<p style="font-size:0.85rem;color:var(--text-muted);">${escapeHtml(formattedDate)}</p>` : "";
        return `
      <div class="info-card" style="text-align:center;">
        <div class="icon-circle">${icons.gift}</div>
        ${headline}
        ${sub}
        ${prize}
        ${testimonial}
        ${date}
      </div>`;
      },
    )
    .join("");

  return `
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>${t(lang, "winners.title")}</h2>
          <div class="section-divider"></div>
          <p>Congratulations to our recent winners!</p>
        </div>
        <div class="info-grid">${items}</div>
      </div>
    </section>`;
}

function starsHtml(rating) {
  const n = Number(rating);
  if (!Number.isFinite(n) || n <= 0) return "";
  let s = "";
  for (let i = 1; i <= 5; i++) {
    s += i <= Math.round(n) ? '<span style="color:#f59e0b;">&#9733;</span>' : '<span style="color:#d1d5db;">&#9734;</span>';
  }
  return s;
}

function reviewsSection(lang = "en", limit = 5, opts = {}) {
  const excerpt = opts.excerpt == null ? 220 : opts.excerpt;
  const allLink = opts.allLink !== false;
  const reviewData = opts.reviewData || loadReviews();
  const mapsUrl = opts.mapsUrl || googleMapsPlaceUrl;
  const heading = opts.title || t(lang, "reviews.title");
  const realReviews = reviewData && Array.isArray(reviewData.reviews) ? reviewData.reviews.filter((r) => r.text) : [];
  const overallRating = reviewData && reviewData.rating ? reviewData.rating : null;
  const googleCta = `<p style="margin-top:1.25rem;"><a class="btn btn-primary" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${t(lang, "reviews.googleCta")}</a></p>`;

  if (!realReviews.length && !overallRating) {
    return `
    <section class="section section-alt">
      <div class="container">
        <div class="section-header">
          <h2>${heading}</h2>
          <div class="section-divider"></div>
          <p>${t(lang, "reviews.seeGoogle")}</p>
          ${googleCta}
        </div>
      </div>
    </section>`;
  }

  const reviewCards = realReviews
    .slice(0, limit)
    .map((r) => {
      const body = r.text || "";
      const clipped = excerpt && body.length > excerpt ? `${body.slice(0, excerpt)}...` : body;
      return `
      <div class="card" style="text-align:left;">
        ${starsHtml(r.rating) ? `<div style="margin-bottom:0.5rem;">${starsHtml(r.rating)}</div>` : ""}
        <p style="font-style:italic;margin-bottom:0.75rem;">"${escapeHtml(clipped)}"</p>
        <p style="font-weight:600;font-size:0.9rem;">${escapeHtml(r.authorName || t(lang, "reviews.googleReviewer"))}</p>
        ${r.relativeTimeDescription ? `<p style="font-size:0.8rem;color:var(--text-muted);margin:0.25rem 0 0;">${escapeHtml(r.relativeTimeDescription)}</p>` : ""}
      </div>`;
    })
    .join("");

  const ratingHeader = overallRating
    ? `<p style="font-size:1.25rem;margin-bottom:0.5rem;">${starsHtml(overallRating)} <strong>${escapeHtml(String(overallRating))}</strong>/5${reviewData.totalReviews ? ` (${escapeHtml(String(reviewData.totalReviews))} ${t(lang, "reviews.reviews")})` : ""} ${t(lang, "reviews.onGoogle")}</p>`
    : "";

  const moreCta =
    allLink && realReviews.length > limit
      ? `<p style="margin-top:1rem;"><a class="btn btn-secondary" href="/reviews">${t(lang, "reviews.seeAll")}</a></p>`
      : "";

  return `
    <section class="section section-alt">
      <div class="container">
        <div class="section-header">
          <h2>${heading}</h2>
          <div class="section-divider"></div>
          ${ratingHeader}
        </div>
        ${reviewCards ? `<div class="card-grid">${reviewCards}</div>` : ""}
        <div style="text-align:center;">${moreCta}${googleCta}</div>
      </div>
    </section>`;
}

function pricesUpdatedLabel(gp, lang) {
  const at = gp.lastUpdatedAt ? Date.parse(gp.lastUpdatedAt) : NaN;
  if (Number.isFinite(at)) {
    const formatted = new Date(at).toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "America/Toronto",
    });
    return `${t(lang, "gasPrices.lastUpdated")} ${formatted}`;
  }
  return t(lang, "prices.dateUnavailable");
}

function formatCents(value) {
  const n = String(value || "").replace(/[^0-9.]/g, "");
  if (!n || n === "0.00") return "";
  return `${n}¢`;
}

function homePromotions(lang) {
  const adminPromos = loadPromotions().filter((p) => p.isActive);
  if (adminPromos.length) {
    return adminPromos.slice(0, 4).map((p) => ({
      title: p.title,
      kicker: p.endDate ? `Ends ${p.endDate}` : t(lang, "promo.current"),
      body: p.description || "",
      note: p.details || "",
    }));
  }
  return [
    {
      title: t(lang, "promo.freeGas.title"),
      kicker: t(lang, "promo.freeGas.subtitle"),
      body: t(lang, "promo.freeGas.body"),
      note: t(lang, "promo.freeGas.note"),
    },
    {
      title: t(lang, "promo.sago.title"),
      kicker: t(lang, "promo.sago.subtitle"),
      body: t(lang, "promo.sago.body"),
      note: "",
      cta: { href: "https://www.facebook.com/LandMEnterprises", label: t(lang, "promo.sago.cta") },
    },
  ];
}

function homePage(lang = "en") {
  const sc = loadSiteContent();
  const gp = loadGasPrices();
  const fuels = [
    { key: "regular", label: t(lang, "gasPrices.regular") },
    { key: "premium", label: t(lang, "gasPrices.premium") },
    { key: "dyedDiesel", label: t(lang, "gasPrices.dyedDiesel") },
    { key: "diesel", label: t(lang, "gasPrices.clearDiesel") },
  ];
  const priceCards = fuels
    .map((f) => {
      const price = formatCents(gp[f.key]);
      if (!price) return "";
      return `
        <article class="price-card">
          <div class="icon-circle">${icons.fuel}</div>
          <h3>${escapeHtml(f.label)}</h3>
          <p class="price">${escapeHtml(price)}</p>
          <p class="unit">${t(lang, "prices.perLitre")}</p>
        </article>`;
    })
    .join("");

  const pricesBlock = priceCards
    ? `
    <section class="price-board" id="prices">
      <div class="container">
        <div class="section-header">
          ${pricesUpdatedLabel(gp, lang) ? `<div class="hero-badge">${escapeHtml(pricesUpdatedLabel(gp, lang))}</div>` : ""}
          <h2>${t(lang, "prices.today")}</h2>
          <div class="section-divider"></div>
        </div>
        <div class="price-grid">${priceCards}</div>
        <p class="price-footer">${t(lang, "prices.confirmAtPump")}</p>
      </div>
    </section>`
    : "";

  const promoCards = homePromotions(lang)
    .map(
      (p) => `
      <article class="promo-card">
        <div class="icon-circle">${icons.gift}</div>
        <h3>${escapeHtml(p.title)}</h3>
        <p class="promo-kicker">${escapeHtml(p.kicker)}</p>
        <p>${escapeHtml(p.body)}</p>
        ${p.note ? `<p class="promo-note">${escapeHtml(p.note)}</p>` : ""}
        ${p.cta ? `<p style="margin-top:1rem;"><a class="btn btn-primary" href="${escapeHtml(p.cta.href)}" target="_blank" rel="noopener noreferrer">${icons.facebook} ${escapeHtml(p.cta.label)}</a></p>` : ""}
      </article>`,
    )
    .join("");

  const winners = (loadWinners() || [])
    .map((w) => ({
      month: formatDrawMonth(w.date, lang),
      number: String(w.winningNumber || "").replace(/[^0-9]/g, ""),
      name: w.name || "",
    }))
    .filter((w) => w.month && w.number)
    .slice(0, 3);
  const winnerCards = winners
    .map(
      (w) => `
      <article class="winner-card">
        <p class="winner-month">${escapeHtml(w.month)}</p>
        <p>${t(lang, "winners.winnerNumber")}</p>
        <p class="winner-number">#${escapeHtml(w.number)}</p>
        ${w.name ? `<p>${escapeHtml(w.name)}</p>` : ""}
      </article>`,
    )
    .join("");

  const gallery = [
    { src: "/images/store/exterior.jpg", alt: t(lang, "gallery.exterior.alt"), title: t(lang, "gallery.exterior.title"), caption: t(lang, "gallery.exterior.caption"), wide: true },
    { src: "/images/store/tobacco.jpg", alt: t(lang, "gallery.tobacco.alt"), title: t(lang, "gallery.tobacco.title"), caption: t(lang, "gallery.tobacco.caption") },
    { src: "/images/store/aisles.jpg", alt: t(lang, "gallery.aisles.alt"), title: t(lang, "gallery.aisles.title"), caption: t(lang, "gallery.aisles.caption") },
    { src: "/images/store/snacks.jpg", alt: t(lang, "gallery.snacks.alt"), title: t(lang, "gallery.snacks.title"), caption: t(lang, "gallery.snacks.caption") },
    { src: "/images/store/vapes.jpg", alt: t(lang, "gallery.vapes.alt"), title: t(lang, "gallery.vapes.title"), caption: t(lang, "gallery.vapes.caption"), wide: true },
    { src: "/images/store/candy.jpg", alt: t(lang, "gallery.candy.alt"), title: t(lang, "gallery.candy.title"), caption: t(lang, "gallery.candy.caption") },
    { src: "/images/store/storefront-interior.jpg", alt: t(lang, "gallery.interior.alt"), title: t(lang, "gallery.interior.title"), caption: t(lang, "gallery.interior.caption"), wide: true },
  ];
  const galleryItems = gallery
    .map(
      (g) => `
      <figure class="gallery-item${g.wide ? " gallery-item--wide" : ""}">
        ${storePicture(g.src.replace("/images/store/", "").replace(".jpg", ""), g.alt, 'loading="lazy" width="1400" height="900"')}
        <figcaption><strong>${escapeHtml(g.title)}</strong><span>${escapeHtml(g.caption)}</span></figcaption>
      </figure>`,
    )
    .join("");

  const content = `
    <section class="hero hero--photo" style="background-image:linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.55)), image-set(url('/images/store/hero.webp') type('image/webp'), url('/images/store/hero.jpg') type('image/jpeg'));">
      <div class="hero-content">
        <div class="hero-badge">${t(lang, "hero.partner")}</div>
        <h1>${t(lang, "hero.h1")}</h1>
        <p class="lead">${t(lang, "hero.homeSubtitle")}</p>
        <p class="hero-serving">${t(lang, "hero.serving")}</p>
        <div class="hero-buttons">
          <a class="btn btn-primary btn-pill" href="#location">${icons.mapPin} ${t(lang, "hero.findUs")}</a>
          <a class="btn btn-secondary btn-pill" href="tel:${escapeHtml(sc.phone)}" data-umami-event="phone-call-hero">${icons.phone} ${t(lang, "nav.callNow")}</a>
        </div>
      </div>
    </section>
    <main>
      ${pricesBlock}
      <section class="promo-band">
        <div class="container">
          <div class="section-header">
            <div class="hero-badge">${t(lang, "promo.current")}</div>
            <h2>${t(lang, "promo.exciting")}</h2>
            <div class="section-divider"></div>
          </div>
          <div class="promo-grid">${promoCards}</div>
          ${winnerCards ? `
          <div class="section-header" style="margin-top:1rem;margin-bottom:1.5rem;">
            <div class="hero-badge">${t(lang, "winners.recent")}</div>
            <h2>${t(lang, "winners.monthly")}</h2>
          </div>
          <div class="winner-grid">${winnerCards}</div>
          <p class="winners-note">${t(lang, "winners.congrats")}</p>` : ""}
        </div>
      </section>
      <section class="section">
        <div class="container two-col">
          <div>
            <p class="kicker" style="color:var(--accent);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:0.8rem;">${t(lang, "about.kicker")}</p>
            <h2>${t(lang, "about.title")}</h2>
            <p>${t(lang, "about.p1")}</p>
            <p>${t(lang, "about.p2")}</p>
            <p>${t(lang, "about.p3")}</p>
            <div class="feature-pills">
              <div class="feature-pill"><span class="pill-icon">${icons.fuel}</span> ${t(lang, "pill.gas")}</div>
              <div class="feature-pill"><span class="pill-icon">${icons.shoppingBag}</span> ${t(lang, "pill.store")}</div>
              <div class="feature-pill"><span class="pill-icon">${icons.leaf}</span> ${t(lang, "pill.tobacco")}</div>
              <div class="feature-pill"><span class="pill-icon">${icons.clock}</span> ${t(lang, "pill.hours")}</div>
            </div>
          </div>
          <div>
            ${storePicture("interior", t(lang, "about.photoAlt"), 'width="1600" height="1200" style="width:100%;border-radius:16px;box-shadow:0 12px 24px rgba(0,0,0,0.1);"')}
          </div>
        </div>
      </section>
      <section class="section section-alt">
        <div class="container">
          <div class="section-header">
            <h2>${t(lang, "category.whatWeOffer")}</h2>
            <div class="section-divider"></div>
          </div>
          <div class="card-grid">${categoryOfferCards()}</div>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="section-header">
            <p class="kicker" style="color:var(--accent);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:0.8rem;">${t(lang, "gallery.kicker")}</p>
            <h2>${t(lang, "gallery.title")}</h2>
            <div class="section-divider"></div>
            <p>${t(lang, "gallery.subtitle")}</p>
          </div>
          <div class="gallery-grid">${galleryItems}</div>
        </div>
      </section>
      ${reviewsSection(lang, 9)}
      ${faqSection(lang, loadFaqs())}
      ${complexSection(lang)}
      <section class="section" id="location">
        <div class="container">
          <div class="section-header">
            <h2>${t(lang, "location.findUs")}</h2>
            <div class="section-divider"></div>
            <p>${t(lang, "location.bear")}</p>
          </div>
          <div class="two-col">
            <div class="info-card">
              <h3>${t(lang, "location.visitUs")}</h3>
              <p><strong>43 Dundas Street</strong><br>Tyendinaga Mohawk Territory<br>Deseronto, ON K0K 1X0</p>
              <p style="margin-top:0.75rem;"><a href="tel:${escapeHtml(sc.phone)}">${escapeHtml(sc.phone)}</a></p>
              <p>${escapeHtml(sc.hoursNote)} ${escapeHtml(sc.hours)}</p>
              <p style="margin-top:1rem;"><a class="btn btn-primary" href="${googleMapsPlaceUrl}" target="_blank" rel="noopener noreferrer">${t(lang, "location.directions")}</a></p>
            </div>
            <iframe class="map-frame" title="L&amp;M Enterprises Location" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2863.5!2d-77.0637543!3d44.1965351!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89d7d6d0ddf501eb%3A0x5caa9044ebef975!2sL%20%26%20M%20Enterprises!5e0!3m2!1sen!2sca" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
          </div>
        </div>
      </section>
    </main>`;

  const jsonLd = [{ ...siteJsonLd(), name: "L&M Enterprises" }, faqJsonLd(), complexJsonLd()];

  return pageTemplate({
    title: t(lang, "meta.homeTitle"),
    description: t(lang, "meta.homeDescription"),
    canonicalPath: "/",
    keywords: [
      "tyendinaga gas prices today",
      "lowest gas prices tyendinaga today",
      "deseronto gas prices today",
      "tyendinaga gas prices",
      "tyendinaga diesel prices today",
      "gas station Deseronto",
      "convenience store Deseronto",
      "SAGO gas",
      "cheap gas Deseronto",
      "tobacco Deseronto",
      "vapes Deseronto",
      "Tyendinaga Mohawk Territory",
    ],
    jsonLd,
    lang,
    content: layout(content, lang),
  });
}

function locationPage(lang = "en") {
  const content = `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">${t(lang, "location.title")}</div>
        <h1>${t(lang, "hero.title")}</h1>
        <p class="lead">${t(lang, "hero.subtitle")}</p>
        <div class="hero-buttons">
          <a class="btn btn-primary" href="/contact-directions" data-umami-event="directions-hero">${icons.mapPin} ${t(lang, "location.getDirections")}</a>
          <a class="btn btn-secondary" href="tel:+16133962224" data-umami-event="phone-call-hero">${icons.phone} ${t(lang, "nav.callNow")} 613-396-2224</a>
        </div>
      </div>
    </section>
    <main>
      ${gasPriceSection(lang)}
      <section class="section">
        <div class="container">
          <div class="section-header">
            <h2>${t(lang, "location.title")}</h2>
            <div class="section-divider"></div>
            <p>${t(lang, "location.planVisit")}</p>
          </div>
          <div class="info-grid">
            <div class="info-card">
              <div class="icon-circle">${icons.mapPin}</div>
              <h3>${t(lang, "location.address")}</h3>
              <p>43 Dundas Street<br>Deseronto, ON K0K 1X0</p>
            </div>
            <div class="info-card">
              <div class="icon-circle">${icons.clock}</div>
              <h3>${t(lang, "location.hours")}</h3>
              <p>Open Daily<br>6:00 AM &ndash; 10:00 PM</p>
            </div>
            <div class="info-card">
              <div class="icon-circle">${icons.phone}</div>
              <h3>${t(lang, "location.phone")}</h3>
              <p><a href="tel:+16133962224">613-396-2224</a><br>Call for store info</p>
            </div>
          </div>
        </div>
      </section>
      <section class="section section-alt">
        <div class="container">
          <div class="section-header">
            <h2>${t(lang, "category.whatWeOffer")}</h2>
            <div class="section-divider"></div>
          </div>
          <div class="card-grid">
            <a class="card card-link" href="/gas-station-deseronto">
              <div class="icon-circle">${icons.fuel}</div>
              <h3>Full-Service Gas</h3>
              <p>Partner with SAGO Gas Bar next door for guaranteed lower prices on regular, premium, and diesel fuel.</p>
            </a>
            <a class="card card-link" href="/convenience-store-deseronto">
              <div class="icon-circle">${icons.shoppingBag}</div>
              <h3>Convenience Store</h3>
              <p>Snacks, beverages, and everyday essentials for your journey. Friendly staff ready to help.</p>
            </a>
            <a class="card card-link" href="/tobacco-deseronto">
              <div class="icon-circle">${icons.tag}</div>
              <h3>Product Categories</h3>
              <p>Tobacco, vape, cigar, and rolling tobacco categories available in-store for adult customers.</p>
            </a>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container two-col">
          <div>
            <h2>Why Customers Choose L&amp;M</h2>
            <p>L&amp;M Enterprises is the convenience store at 43 Dundas Street in Deseronto, in the same complex as SAGO Gas Bar (39 Dundas), Mohawk Medibles, and The Stoned Chef (45 Dundas). Park once for fuel, snacks, cannabis, and food.</p>
            <p>Look for the black bear out front. We are open 6am to 10pm every day, with full-service pumps next door and a stocked store inside.</p>
            <div class="feature-pills">
              <div class="feature-pill"><span class="pill-icon">${icons.fuel}</span> Full-Service Gas</div>
              <div class="feature-pill"><span class="pill-icon">${icons.shoppingBag}</span> Convenience Store</div>
              <div class="feature-pill"><span class="pill-icon">${icons.leaf}</span> Tobacco &amp; Vapes</div>
              <div class="feature-pill"><span class="pill-icon">${icons.clock}</span> Open 6am-10pm</div>
            </div>
          </div>
          <div>
            ${storePicture("hero", "L&M Enterprises storefront in Deseronto", 'width="1920" height="1080" style="width:100%;border-radius:16px;box-shadow:0 12px 24px rgba(0,0,0,0.1);"')}
          </div>
        </div>
      </section>
      ${complexSection(lang)}
      ${promotionsSection(lang)}
      ${winnersSection(lang)}
      ${reviewsSection(lang, 9)}
    </main>`;

  return pageTemplate({
    title: "L&M Enterprises | Deseronto Convenience Store and Gas Station",
    description:
      "L&M Enterprises is a convenience store and gas station in Deseronto serving Tyendinaga and nearby communities with fuel, convenience-store essentials, and in-store adult-only product categories.",
    canonicalPath: "/deseronto-convenience-store-gas-station",
    keywords: [
      "Deseronto convenience store",
      "gas station Deseronto",
      "gas station near Tyendinaga",
      "convenience store near Tyendinaga",
    ],
    jsonLd: [
      {
        ...siteJsonLd(),
        name: "L&M Enterprises Deseronto",
        url: `${siteUrl}/deseronto-convenience-store-gas-station`,
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Location", path: "/deseronto-convenience-store-gas-station" },
      ]),
      complexJsonLd(),
    ],
    lang,
    content: layout(content, lang),
  });
}

function reviewsPage(lang = "en") {
  const reviewData = loadReviews();
  const quoted =
    reviewData && Array.isArray(reviewData.reviews) ? reviewData.reviews.filter((r) => r.text).length : 0;
  const total = (reviewData && reviewData.totalReviews) || quoted;
  const content = `
    <section class="hero">
      <div class="hero-content">
        ${breadcrumbsNav(lang, t(lang, "nav.reviews"))}
        <div class="hero-badge">${t(lang, "nav.reviews")}</div>
        <h1>${t(lang, "reviews.pageTitle")}</h1>
        <p class="lead">${t(lang, "reviews.pageSubtitle")}</p>
      </div>
    </section>
    <main>
      ${reviewsSection(lang, 100, { excerpt: 800, allLink: false })}
    </main>`;

  return pageTemplate({
    title: "L&M Enterprises | Google Reviews in Deseronto",
    description: `Read ${total} Google reviews for L&M Enterprises, the gas station and convenience store at 43 Dundas Street in Deseronto.`,
    canonicalPath: "/reviews",
    keywords: [
      "L&M Enterprises reviews",
      "Deseronto gas station reviews",
      "Google reviews Deseronto",
    ],
    jsonLd: [
      siteJsonLd(),
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: t(lang, "nav.reviews"), path: "/reviews" },
      ]),
    ],
    lang,
    content: layout(content, lang),
  });
}

function contactPage(lang = "en") {
  const content = `
    <section class="hero">
      <div class="hero-content">
        ${breadcrumbsNav(lang, t(lang, "nav.contact"))}
        <div class="hero-badge">${t(lang, "contact.title")}</div>
        <h1>Visit, Call, or Get Directions</h1>
        <p class="lead">Find L&amp;M Enterprises at 43 Dundas Street in Deseronto. We are open daily from 6am to 10pm.</p>
        <div class="hero-buttons">
          <a class="btn btn-primary" href="tel:+16133962224">${icons.phone} Call The Store</a>
          <a class="btn btn-secondary" href="${googleMapsPlaceUrl}" rel="noreferrer">${icons.mapPin} Open In Maps</a>
        </div>
      </div>
    </section>
    <main>
      <section class="section">
        <div class="container">
          <div class="section-header">
            <h2>How to Reach Us</h2>
            <div class="section-divider"></div>
          </div>
          <div class="info-grid">
            <div class="info-card">
              <div class="icon-circle">${icons.mapPin}</div>
              <h3>Address</h3>
              <p>43 Dundas Street<br>Deseronto, ON K0K 1X0</p>
            </div>
            <div class="info-card">
              <div class="icon-circle">${icons.phone}</div>
              <h3>Phone</h3>
              <p><a href="tel:+16133962224">613-396-2224</a><br>Call anytime during hours</p>
            </div>
            <div class="info-card">
              <div class="icon-circle">${icons.clock}</div>
              <h3>Hours</h3>
              <p>Open Daily<br>6:00 AM &ndash; 10:00 PM</p>
            </div>
          </div>
        </div>
      </section>
      <section class="section section-alt">
        <div class="container two-col">
          <div>
            <h2>Serving Nearby Communities</h2>
            <p>L&amp;M Enterprises is positioned to serve Deseronto directly while also being a practical stop for Tyendinaga and surrounding area traffic. Whether you are driving through or live nearby, we are a convenient stop for fuel and essentials.</p>
          </div>
          <div>
            <h2>Before You Visit</h2>
            <p>If you are calling ahead, ask about store hours, category availability, or general visit information. The website is informational and does not process online orders.</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container" style="max-width:600px;">
          <div class="section-header">
            <h2>Send Us a Message</h2>
            <div class="section-divider"></div>
            <p>Have a question? Fill out the form below and we will get back to you.</p>
          </div>
          <form method="POST" action="/contact" style="text-align:left;">
            <div style="margin-bottom:1rem;">
              <label for="name" style="display:block;font-weight:600;margin-bottom:0.25rem;">${t(lang, "contact.name")} *</label>
              <input type="text" id="name" name="name" required style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.95rem;" />
            </div>
            <div style="margin-bottom:1rem;">
              <label for="email" style="display:block;font-weight:600;margin-bottom:0.25rem;">${t(lang, "contact.email")} *</label>
              <input type="email" id="email" name="email" required style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.95rem;" />
            </div>
            <div style="margin-bottom:1rem;">
              <label for="phone" style="display:block;font-weight:600;margin-bottom:0.25rem;">${t(lang, "contact.phone")}</label>
              <input type="tel" id="phone" name="phone" style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.95rem;" />
            </div>
            <div style="margin-bottom:1rem;">
              <label for="subject" style="display:block;font-weight:600;margin-bottom:0.25rem;">${t(lang, "contact.subject")}</label>
              <input type="text" id="subject" name="subject" style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.95rem;" />
            </div>
            <div style="margin-bottom:1.5rem;">
              <label for="message" style="display:block;font-weight:600;margin-bottom:0.25rem;">${t(lang, "contact.message")} *</label>
              <textarea id="message" name="message" rows="5" required style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.95rem;resize:vertical;"></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;font-size:1rem;">${t(lang, "contact.send")}</button>
          </form>
        </div>
      </section>
    </main>`;

  return pageTemplate({
    title: "L&M Enterprises | Contact and Directions",
    description:
      "Get store contact details, hours, and directions for L&M Enterprises in Deseronto, Ontario.",
    canonicalPath: "/contact-directions",
    keywords: [
      "L&M Enterprises contact",
      "Deseronto directions",
      "Deseronto store phone number",
      "Tyendinaga convenience store directions",
    ],
    jsonLd: [
      {
        ...siteJsonLd(),
        "@type": "ContactPage",
        url: `${siteUrl}/contact-directions`,
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: t(lang, "nav.contact"), path: "/contact-directions" },
      ]),
    ],
    lang,
    content: layout(content, lang),
  });
}


function categoryPage(category, lang = "en") {
  const relatedLinks = loadCategories()
    .filter((entry) => entry.slug !== category.slug)
    .map(
      (entry) =>
        `<li><a href="/${entry.slug}">${icons.arrowRight} ${escapeHtml(entry.nav)}</a></li>`,
    )
    .join("");

  const detailCards = (category.details || [])
    .map(
      (item, i) => `
      <article class="card">
        <div class="icon-circle">${[icons.search, icons.mapPin, icons.tag][i % 3]}</div>
        <h3>${escapeHtml(item)}</h3>
      </article>`,
    )
    .join("");

  const bodyHtml = (category.body || [])
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
  const photo = category.photo
    ? storePicture(
        category.photo,
        category.searchTitle,
        'loading="lazy" width="1400" height="900" style="width:100%;border-radius:16px;box-shadow:0 12px 24px rgba(0,0,0,0.1);"',
      )
    : "";
  const isGas = category.slug === "gas-station-deseronto";
  const gp = isGas ? loadGasPrices() : null;
  const prices = isGas ? gasPriceSection(lang) : "";
  const cheapGasLink = isGas
    ? `<p><a href="/blog/cheapest-gas-prices-deseronto-tyendinaga-near-401">${t(lang, "category.cheapGasGuide")}</a></p>`
    : "";
  const mapsUrl = isGas ? sagoMapsPlaceUrl : googleMapsPlaceUrl;
  const reviewOpts = isGas
    ? { reviewData: loadSagoReviews(), mapsUrl: sagoMapsPlaceUrl, title: t(lang, "reviews.sagoTitle"), allLink: false }
    : {};

  const gasFaqs = isGas && gp
    ? [
        {
          question: "What are today's gas prices at SAGO Gas Bar & L&M Enterprises in Tyendinaga / Deseronto?",
          answer: `Current fuel prices at SAGO Gas Bar (39 Dundas St, Deseronto) are: Regular Unleaded: ${gp.regular || "149.9"}¢/L, Premium: ${gp.premium || "169.9"}¢/L, Clear Diesel: ${gp.diesel || "199.9"}¢/L, and Dyed Diesel: ${gp.dyedDiesel || "189.9"}¢/L. All fuel is pumped full-service by our attendants. Prices are updated daily.`,
        },
        ...(category.faqs || []),
      ]
    : (category.faqs || []);

  const content = `
    <section class="hero">
      <div class="hero-content">
        ${breadcrumbsNav(lang, category.nav)}
        <div class="hero-badge">${escapeHtml(category.nav)}</div>
        <h1>${escapeHtml(category.searchTitle)}</h1>
        <p class="lead">${escapeHtml(category.intro)}</p>
        <div class="hero-buttons">
          <a class="btn btn-primary" href="/contact-directions">${icons.mapPin} ${t(lang, "location.visitUs")}</a>
          <a class="btn btn-secondary" href="tel:+16133962224">${icons.phone} ${t(lang, "nav.callNow")}</a>
        </div>
      </div>
    </section>
    <main>
      ${prices}
      <section class="section">
        <div class="container">
          <div class="section-header">
            <h2>${escapeHtml(category.title)}</h2>
            <div class="section-divider"></div>
            <p>${escapeHtml(category.description)}</p>
          </div>
          <div class="card-grid">${detailCards}</div>
        </div>
      </section>
      <section class="section section-alt">
        <div class="container two-col">
          <div>
            <h2>${escapeHtml(category.extraHeading)}</h2>
            ${bodyHtml}
            <p>${escapeHtml(category.extraCopy)}</p>
            <p>${escapeHtml(category.localAngle)}</p>
            ${cheapGasLink}
          </div>
          <div>${photo}</div>
        </div>
      </section>
      ${faqSection(lang, gasFaqs)}
      ${reviewsSection(lang, isGas ? 6 : 3, reviewOpts)}
      <section class="section">
        <div class="container two-col">
          <div>
            <h2>${t(lang, "category.relatedCategories")}</h2>
            <ul class="related-list">${relatedLinks}</ul>
          </div>
          <div class="info-card">
            <h2>${t(lang, "location.visitUs")}</h2>
            <p><strong>${isGas ? "39 Dundas Street (SAGO pumps)" : "43 Dundas Street"}</strong><br>Deseronto, ON K0K 1X0</p>
            <p>Open daily 6:00 AM &ndash; 10:00 PM</p>
            <p><a href="tel:+16133962224">613-396-2224</a></p>
            <p style="margin-top:1rem;"><a class="btn btn-primary" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${icons.mapPin} ${t(lang, "location.directions")}</a></p>
          </div>
        </div>
      </section>
    </main>`;

  return pageTemplate({
    title: `${category.searchTitle} | L&M Enterprises`,
    description: category.description,
    canonicalPath: `/${category.slug}`,
    keywords: category.keywords,
    jsonLd: [
      {
        ...siteJsonLd(),
        "@type": categorySchemaType(category.slug),
        name: isGas ? "SAGO Gas Bar & L&M Enterprises" : `L&M Enterprises - ${category.title}`,
        description: category.description,
        url: `${siteUrl}/${category.slug}`,
        hasMap: mapsUrl,
        ...(isGas
          ? {
              address: {
                "@type": "PostalAddress",
                streetAddress: "39 Dundas Street",
                addressLocality: "Deseronto",
                addressRegion: "ON",
                postalCode: "K0K 1X0",
                addressCountry: "CA",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 44.1925,
                longitude: -77.0505,
              },
              telephone: "+16133962224",
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ],
                  opens: "06:00",
                  closes: "22:00",
                },
              ],
              currenciesAccepted: "CAD",
              paymentAccepted: "Cash, Debit Card, Credit Card",
              priceRange: "$$",
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Current Fuel Prices",
                itemListElement: gp
                  ? [
                      gp.regular && gp.regular !== "0.00"
                        ? {
                            "@type": "Offer",
                            name: "Regular Unleaded Gasoline",
                            price: (parseFloat(gp.regular) / 100).toFixed(3),
                            priceCurrency: "CAD",
                            priceSpecification: {
                              "@type": "UnitPriceSpecification",
                              price: (parseFloat(gp.regular) / 100).toFixed(3),
                              priceCurrency: "CAD",
                              unitCode: "LTR",
                              unitText: "liter",
                            },
                            availability: "https://schema.org/InStock",
                          }
                        : null,
                      gp.premium && gp.premium !== "0.00"
                        ? {
                            "@type": "Offer",
                            name: "Premium Unleaded Gasoline",
                            price: (parseFloat(gp.premium) / 100).toFixed(3),
                            priceCurrency: "CAD",
                            priceSpecification: {
                              "@type": "UnitPriceSpecification",
                              price: (parseFloat(gp.premium) / 100).toFixed(3),
                              priceCurrency: "CAD",
                              unitCode: "LTR",
                              unitText: "liter",
                            },
                            availability: "https://schema.org/InStock",
                          }
                        : null,
                      gp.diesel && gp.diesel !== "0.00"
                        ? {
                            "@type": "Offer",
                            name: "Clear Diesel Fuel",
                            price: (parseFloat(gp.diesel) / 100).toFixed(3),
                            priceCurrency: "CAD",
                            priceSpecification: {
                              "@type": "UnitPriceSpecification",
                              price: (parseFloat(gp.diesel) / 100).toFixed(3),
                              priceCurrency: "CAD",
                              unitCode: "LTR",
                              unitText: "liter",
                            },
                            availability: "https://schema.org/InStock",
                          }
                        : null,
                      gp.dyedDiesel && gp.dyedDiesel !== "0.00"
                        ? {
                            "@type": "Offer",
                            name: "Dyed Diesel Fuel",
                            price: (parseFloat(gp.dyedDiesel) / 100).toFixed(3),
                            priceCurrency: "CAD",
                            priceSpecification: {
                              "@type": "UnitPriceSpecification",
                              price: (parseFloat(gp.dyedDiesel) / 100).toFixed(3),
                              priceCurrency: "CAD",
                              unitCode: "LTR",
                              unitText: "liter",
                            },
                            availability: "https://schema.org/InStock",
                          }
                        : null,
                    ].filter(Boolean)
                  : [],
              },
            }
          : {}),
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: category.nav, path: `/${category.slug}` },
      ]),
      faqJsonLd(gasFaqs),
    ],
    lang,
    content: layout(content, lang),
  });
}

function blogPage(activeCategory = null, lang = "en") {
  let posts = readJSON("blog-posts.json", []).filter((p) => p.published);
  if (activeCategory) posts = posts.filter((p) => p.category === activeCategory);

  const allPosts = readJSON("blog-posts.json", []).filter((p) => p.published);
  const usedCategories = [...new Set(allPosts.map((p) => p.category).filter(Boolean))];

  const filterPills = `
    <div class="blog-filters">
      <a class="blog-filter-pill${!activeCategory ? " active" : ""}" href="/blog">${t(lang, "blog.all")}</a>
      ${usedCategories.map((c) => `<a class="blog-filter-pill${activeCategory === c ? " active" : ""}" href="/blog?category=${encodeURIComponent(c)}">${escapeHtml(c)}</a>`).join("")}
    </div>`;

  const postCards = posts.length
    ? posts.map((p) => {
        const displayTitle = (lang === "fr" && p.titleFr) ? p.titleFr : p.title;
        const displayExcerpt = (lang === "fr" && p.excerptFr) ? p.excerptFr : (p.excerpt || (p.content || "").slice(0, 150) + ((p.content || "").length > 150 ? "..." : ""));
        const imgHtml = p.featuredImage
          ? `<img class="blog-post-card__img" src="${escapeHtml(p.featuredImage)}" alt="${escapeHtml(p.featuredImageAlt || displayTitle)}" loading="lazy" />`
          : `<div class="blog-post-card__img blog-post-card__img--fallback"></div>`;
        return `
          <a href="/blog/${escapeHtml(p.slug)}" class="blog-post-card">
            ${imgHtml}
            <div class="blog-post-card__body">
              ${p.category ? `<span class="blog-post-card__cat">${escapeHtml(p.category)}</span>` : ""}
              <h3 class="blog-post-card__title">${escapeHtml(displayTitle)}</h3>
              <p class="blog-post-card__excerpt">${escapeHtml(displayExcerpt)}</p>
            </div>
            <div class="blog-post-card__meta">
              <span>${formatDate(p.date)}</span>
              <span>${readingTime(p.content)} ${t(lang, "blog.minRead")}</span>
            </div>
          </a>`;
      }).join("")
    : `<div style="text-align:center;padding:3rem 0;color:var(--text-muted);">
        <p>${t(lang, "blog.noPosts")}</p>
      </div>`;

  const content = `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">${t(lang, "blog.title")}</div>
        <h1>Store Updates &amp; Local Info</h1>
        <p class="lead">${t(lang, "blog.subtitle")}</p>
      </div>
    </section>
    <main>
      <section class="section">
        <div class="container">
          ${filterPills}
          <div class="blog-grid">${postCards}</div>
        </div>
      </section>
      <section class="section section-alt">
        <div class="container">
          <div class="section-header">
            <h2>Also Explore</h2>
            <div class="section-divider"></div>
          </div>
          <div class="card-grid">
            <article class="card">
              <div class="icon-circle">${icons.fuel}</div>
              <h3>Gas Station</h3>
              <p>Fuel prices, full-service pumping, and SAGO Gas Bar partnership details.</p>
              <a class="btn btn-outline" href="/gas-station-deseronto" style="margin-top:1rem;">${t(lang, "common.learnMore")}</a>
            </article>
            <article class="card">
              <div class="icon-circle">${icons.shoppingBag}</div>
              <h3>Convenience Store</h3>
              <p>Snacks, drinks, and everyday essentials at your local stop.</p>
              <a class="btn btn-outline" href="/convenience-store-deseronto" style="margin-top:1rem;">${t(lang, "common.learnMore")}</a>
            </article>
            <article class="card">
              <div class="icon-circle">${icons.mapPin}</div>
              <h3>${t(lang, "contact.title")}</h3>
              <p>Find the store, get directions, or call ahead before visiting.</p>
              <a class="btn btn-outline" href="/contact-directions" style="margin-top:1rem;">${t(lang, "common.learnMore")}</a>
            </article>
          </div>
        </div>
      </section>
    </main>`;

  return pageTemplate({
    title: activeCategory ? `${activeCategory} | L&M Enterprises Blog` : "L&M Enterprises | Blog",
    description: "News, tips, and product highlights from L&M Enterprises — your gas station, convenience store, and tobacco & vape shop in Deseronto, Ontario.",
    canonicalPath: "/blog",
    keywords: ["L&M Enterprises blog", "Deseronto store updates", "gas station blog", "convenience store news"],
    jsonLd: blogListJsonLd(allPosts),
    lang,
    content: layout(content, lang),
  });
}

function blogPostPage(post, lang = "en") {
  const allPosts = readJSON("blog-posts.json", []).filter((p) => p.published);
  const related = allPosts
    .filter((p) => p.id !== post.id && post.category && p.category === post.category)
    .slice(0, 3);
  const displayTitle = (lang === "fr" && post.titleFr) ? post.titleFr : post.title;
  const displayContent = (lang === "fr" && post.contentFr) ? post.contentFr : post.content;
  const displayExcerpt = (lang === "fr" && post.excerptFr) ? post.excerptFr : (post.excerpt || (post.content || "").slice(0, 160));
  const mins = readingTime(displayContent);
  const date = formatDate(post.date);
  const author = post.author || "L&M Enterprises";
  const category = post.category || "";
  const excerpt = displayExcerpt;
  const heroStyle = post.featuredImage
    ? `background-image:linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)),url('${escapeHtml(post.featuredImage)}');background-size:cover;background-position:center;`
    : "";
  const heroClass = post.featuredImage ? "hero hero--blog-post" : "hero";

  const relatedHtml = related.length
    ? `<section class="section" style="background:var(--bg-alt);">
        <div class="container">
          <h2 style="text-align:center;margin-bottom:2rem;">${t(lang, "blog.relatedPosts")}</h2>
          <div class="blog-grid">
            ${related.map((r) => {
              const rTitle = (lang === "fr" && r.titleFr) ? r.titleFr : r.title;
              const rExcerpt = (lang === "fr" && r.excerptFr) ? r.excerptFr : (r.excerpt || (r.content || "").slice(0, 120));
              const rMins = readingTime(r.content);
              const rDate = formatDate(r.date);
              const imgHtml = r.featuredImage
                ? `<img class="blog-post-card__img" src="${escapeHtml(r.featuredImage)}" alt="${escapeHtml(r.featuredImageAlt || rTitle)}" loading="lazy" />`
                : `<div class="blog-post-card__img blog-post-card__img--fallback"></div>`;
              return `<a href="/blog/${escapeHtml(r.slug)}" class="blog-post-card">
                ${imgHtml}
                <div class="blog-post-card__body">
                  ${r.category ? `<span class="blog-post-card__cat">${escapeHtml(r.category)}</span>` : ""}
                  <h3 class="blog-post-card__title">${escapeHtml(rTitle)}</h3>
                  <p class="blog-post-card__excerpt">${escapeHtml(rExcerpt)}</p>
                </div>
                <div class="blog-post-card__meta">
                  <span>${rDate}</span>
                  <span>${rMins} ${t(lang, "blog.minRead")}</span>
                </div>
              </a>`;
            }).join("")}
          </div>
        </div>
      </section>`
    : "";

  const content = `
    <section class="${heroClass}" ${heroStyle ? `style="${heroStyle}"` : ""}>
      <div class="hero-content">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <a href="/blog">Blog</a>
          <span aria-hidden="true">/</span>
          <span>${escapeHtml(displayTitle)}</span>
        </nav>
        <h1>${escapeHtml(displayTitle)}</h1>
      </div>
    </section>
    <main>
      <section class="section">
        <div class="container">
          <div class="blog-post-meta">
            <span>${icons.user} ${escapeHtml(author)}</span>
            <span>${icons.calendar} ${date}</span>
            ${category ? `<span><a href="/blog?category=${encodeURIComponent(category)}">${escapeHtml(category)}</a></span>` : ""}
            <span>${mins} ${t(lang, "blog.minRead")}</span>
          </div>
          <article class="blog-post-body">
            ${contentToHtml(displayContent)}
          </article>
          <div style="margin-top:3rem;text-align:center;">
            <a class="btn btn-primary" href="/blog">${icons.arrowRight} ${t(lang, "blog.backToBlog")}</a>
          </div>
        </div>
      </section>
      ${relatedHtml}
    </main>`;

  return pageTemplate({
    title: `${displayTitle} | L&M Enterprises`,
    description: excerpt,
    canonicalPath: `/blog/${post.slug}`,
    keywords: ["L&M Enterprises blog", "Deseronto store updates", ...(category ? [category.toLowerCase()] : [])],
    jsonLd: blogPostJsonLd(post),
    ogImage: post.featuredImage || null,
    lang,
    content: layout(content, lang),
  });
}

function notFoundPage(lang = "en") {
  return pageTemplate({
    title: `${t(lang, "notFound.title")} | L&M Enterprises`,
    description: "The page you requested could not be found.",
    canonicalPath: "",
    noindex: true,
    jsonLd: siteJsonLd(),
    lang,
    content: layout(`
      <main>
        <div class="not-found">
          <div class="container">
            <p class="eyebrow">404</p>
            <h1>${t(lang, "notFound.title")}</h1>
            <p>${t(lang, "notFound.message")}</p>
            <a class="btn btn-primary" href="/">${t(lang, "notFound.backHome")}</a>
          </div>
        </div>
      </main>`, lang),
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* ── Admin routes ── */
app.use("/admin", require("./admin/routes"));

/* ── Contact form handler ── */
const contactRateLimit = new Map();
// Clean up expired rate-limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of contactRateLimit) {
    if (now > entry.resetTime) contactRateLimit.delete(ip);
  }
}, 600000);
app.use("/contact", express.urlencoded({ extended: false, limit: "100kb" }));

app.post("/contact", (req, res) => {
  const lang = req.lang || "en";
  const ip = req.ip;
  const now = Date.now();
  const entry = contactRateLimit.get(ip) || { count: 0, resetTime: now + 3600000 };
  if (now > entry.resetTime) { entry.count = 0; entry.resetTime = now + 3600000; }
  entry.count++;
  contactRateLimit.set(ip, entry);
  if (entry.count > 5) {
    res.status(429).send(pageTemplate({
      title: "Too Many Requests", description: "Rate limited.",
      noindex: true, jsonLd: siteJsonLd(), lang,
      content: layout(`<main><div class="not-found"><div class="container"><h1>Too Many Requests</h1><p>Please wait before submitting another message.</p><a class="btn btn-primary" href="/contact-directions">Go Back</a></div></div></main>`, lang),
    }));
    return;
  }
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).send("Name, email, and message are required.");
    return;
  }
  const messages = readJSON("contact-messages.json", []);
  messages.unshift({
    id: crypto.randomBytes(8).toString("hex"),
    name, email, phone: phone || "", subject: subject || "",
    message, date: new Date().toISOString(), read: false,
  });
  writeJSON("contact-messages.json", messages);
  res.send(pageTemplate({
    title: `${t(lang, "contact.messageSent")} | L&M Enterprises`,
    description: "Thank you for your message.",
    noindex: true, jsonLd: siteJsonLd(), lang,
    content: layout(`<main><div class="not-found"><div class="container"><p class="eyebrow">Thank You</p><h1>${t(lang, "contact.messageSent")}</h1><p>${t(lang, "contact.messageSentDesc")}</p><a class="btn btn-primary" href="/">${t(lang, "notFound.backHome")}</a></div></div></main>`, lang),
  }));
});

/* ── Gas Prices API (for SPA homepage) ── */
app.get("/api/gas-prices", (_req, res) => {
  const gp = loadGasPrices();
  res.json({
    regular: gp.regular || "0.00",
    premium: gp.premium || "0.00",
    dyedDiesel: gp.dyedDiesel || "0.00",
    diesel: gp.diesel || "0.00",
    updatedLabel: gp.updatedLabel || "",
    lastUpdatedAt: gp.lastUpdatedAt || null,
  });
});

app.get(/^\/(api)(\/|$)/, (_req, res) => {
  res.status(404).send("Not found");
});

app.get("/files", (_req, res) => {
  res.redirect(301, "/");
});

app.get("/", (req, res) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.send(homePage(req.lang));
});

app.get("/index.html", (_req, res) => {
  res.redirect(301, "/");
});

app.get("/blog", (req, res) => {
  res.send(blogPage(req.query.category || null, req.lang));
});

/* ── RSS Feed (must be before /blog/:slug) ── */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

app.get("/blog/rss.xml", (_req, res) => {
  const posts = readJSON("blog-posts.json", []).filter((p) => p.published).slice(0, 20);
  const items = posts
    .map(
      (p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${siteUrl}/blog/${escapeXml(p.slug)}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${escapeXml(p.slug)}</guid>
      <description>${escapeXml(p.excerpt || (p.content || "").slice(0, 200))}</description>
      <pubDate>${new Date(p.date + "T00:00:00").toUTCString()}</pubDate>
      ${p.category ? `<category>${escapeXml(p.category)}</category>` : ""}
    </item>`,
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>L&amp;M Enterprises Blog</title>
    <link>${siteUrl}/blog</link>
    <description>News, tips, and product highlights from L&amp;M Enterprises in Deseronto, Ontario.</description>
    <language>en-ca</language>
    <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  res.set("Content-Type", "application/rss+xml; charset=utf-8");
  res.send(rss);
});

app.get("/blog/:slug", (req, res, next) => {
  const posts = readJSON("blog-posts.json", []);
  const post = posts.find((p) => p.slug === req.params.slug && p.published);
  if (!post) return next();
  res.send(blogPostPage(post, req.lang));
});

app.get("/deseronto-convenience-store-gas-station", (req, res) => {
  res.send(locationPage(req.lang));
});

app.get("/contact-directions", (req, res) => {
  res.send(contactPage(req.lang));
});

app.get("/reviews", (req, res) => {
  res.send(reviewsPage(req.lang));
});

/* ── Gas Prices URL Aliases ── */
app.get(["/gas-prices", "/tyendinaga-gas-prices", "/deseronto-gas-prices", "/fuel-prices"], (_req, res) => {
  res.redirect(301, "/gas-station-deseronto");
});

const categorySlugs = new Set(defaultCategories.map((c) => c.slug));
for (const slug of categorySlugs) {
  app.get(`/${slug}`, (req, res) => {
    const cats = loadCategories();
    const category = cats.find((c) => c.slug === slug);
    if (!category) return res.status(404).send(notFoundPage(req.lang));
    res.send(categoryPage(category, req.lang));
  });
}

/* ── Sitemap ── */
app.get("/sitemap.xml", (_req, res) => {
  const cats = loadCategories();
  const posts = readJSON("blog-posts.json", []).filter((p) => p.published);

  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: "/", priority: "1.0", changefreq: "weekly", lastmod: today },
    { loc: "/gas-station-deseronto", priority: "0.95", changefreq: "daily", lastmod: today },
    { loc: "/deseronto-convenience-store-gas-station", priority: "0.9", changefreq: "weekly", lastmod: today },
    { loc: "/contact-directions", priority: "0.8", changefreq: "monthly", lastmod: today },
    { loc: "/reviews", priority: "0.8", changefreq: "weekly", lastmod: today },
    { loc: "/blog", priority: "0.8", changefreq: "daily", lastmod: today },
  ];

  for (const cat of cats) {
    urls.push({ loc: `/${cat.slug}`, priority: "0.7", changefreq: "monthly", lastmod: today });
  }

  for (const post of posts) {
    urls.push({
      loc: `/blog/${post.slug}`,
      priority: "0.6",
      changefreq: "monthly",
      lastmod: post.date || today,
    });
  }

  const urlEntries = urls
    .map(
      (u) => `
  <url>
    <loc>${escapeXml(siteUrl + u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
    )
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlEntries}
</urlset>`;

  res.set("Content-Type", "application/xml; charset=utf-8");
  res.send(sitemap);
});

app.use(express.static(publicDir, {
  maxAge: "7d",
  index: false,                        // Don't auto-serve index.html (our route handles /)
  setHeaders(res, filePath) {
    // Don't cache index.html even if requested directly
    if (filePath.endsWith("index.html")) {
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  },
}));

app.use((req, res) => {
  res.status(404).send(notFoundPage(req.lang));
});

app.use((err, _req, res, _next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  if (process.env.NODE_ENV !== "production") console.error(err.stack);
  res.status(500).send("Internal server error");
});

function scheduleReviewSync() {
  if (!process.env.GOOGLE_PLACES_API_KEY && !(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD)) return;
  const run = () =>
    syncGoogleReviews()
      .then((r) => console.log(`Google reviews synced (${r.totalReviews || 0} total)`))
      .catch((err) => console.error("Google reviews sync skipped:", err.message));
  run();
  setInterval(run, 12 * 60 * 60 * 1000).unref();
}

ensureReviewsSeed();
ensureCategoryCopy();
ensureFaqCopy();
app.listen(port, () => {
  console.log(`L&M Enterprises Railway server listening on ${port}`);
  scheduleReviewSync();
});
