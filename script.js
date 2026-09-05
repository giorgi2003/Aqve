const photo = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const photoNatural = (id, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${Math.round(w * 9 / 16)}&q=80`;

const CATEGORIES = [
  { id: "all", name: 'ყველა', image: photo("photo-1504674900247-0877df9cc836", 300) },
  { id: "burger", name: 'ბურგერი', image: photo("photo-1568901346375-23c9450c58cd", 300) },
  { id: "pizza", name: 'პიცა', image: photo("photo-1513104890138-7c749659a591", 300) },
  { id: "geo", name: 'ქართული', image: photo("photo-1496116218417-1a781b1c416c", 300) },
  { id: "cafe", name: 'კაფე', image: photo("photo-1495474472287-4d71bcdd2085", 300) },
  { id: "dessert", name: 'დესერტი', image: photo("photo-1551024601-bec78aea704b", 300) },
  { id: "shop", name: 'მარკეტი', image: photo("photo-1542838132-92c53300491e", 300) },
];

const PICKS = [
  { id: "deal", title: "დღეს -20%", sub: "პირველ შეკვეთაზე", image: photo("photo-1550547660-d9450f859349", 400) },
  { id: "fast", title: "25 წუთში", sub: "სწრაფი მიტანა", image: photo("photo-1574071318508-1cdbab80d002", 400) },
  { id: "free", title: "უფასო მიტანა", sub: "ახალციხეში", image: photo("photo-1495474472287-4d71bcdd2085", 400) },
  { id: "top", title: "ყველაზე პოპულარული", sub: "AQVE Picks", image: photo("photo-1568901346375-23c9450c58cd", 400) },
];

const TRENDING = ["r1", "n1", "m1", "c3", "s1", "g3", "t2"];

const EAT_IDEAS = [
  { type: "cat", id: "pizza", label: "პიცა", image: photo("photo-1513104890138-7c749659a591", 400) },
  { type: "cat", id: "burger", label: "ბურგერი", image: photo("photo-1568901346375-23c9450c58cd", 400) },
  { type: "item", id: "m1", restaurantId: "meskhi", label: "ხინკალი", image: photo("photo-1496116218417-1a781b1c416c", 400) },
  { type: "item", id: "c3", restaurantId: "city", label: "შაურმა", image: photo("photo-1599487488170-d11ec9c172f0", 400) },
  { type: "item", id: "n1", restaurantId: "napoli", label: "მარგარიტა", image: photo("photo-1513104890138-7c749659a591", 400) },
  { type: "cat", id: "dessert", label: "დესერტი", image: photo("photo-1551024601-bec78aea704b", 400) },
  { type: "cat", id: "geo", label: "ქართული", image: photo("photo-1496116218417-1a781b1c416c", 400) },
];

const TREND_SIGNALS = {
  r1: "ხშირად უკვეთავენ",
  n1: "AQVE არჩევანი",
  m1: "პოპულარობა იზრდება",
  c3: "სწრაფი მიტანა",
};

const LIVE = {
  open: "ღიაა",
  closed: "დაკეტილია",
  closing: "იკეტება",
  busy: "დატვირთულია",
};

let homeReady = false;
let feedAnimated = false;
let eatIdea = EAT_IDEAS[0];
let pendingSearchFocus = false;

const T = {
  hello: 'რას შევუკვეთავთ?',
  promo1: 'უფასო მიტანა ახალციხეში',
  promo1s: 'შერჩეულ რესტორნებზე',
  promo2: 'პირველ შეკვეთაზე -20%',
  dges: 'დღეს',
  popular: 'პოპულარული',
  ufaso: 'უფასო მიტანა',
  fast: 'სწრაფი მიტანა',
  near: 'რესტორნები შენთან ახლოს',
  none: 'რესტორანი ვერ მოიძებნა',
  back: 'უკან',
  mitana: 'მიტანა',
  search: 'ძებნა',
  rests: 'რესტორნები',
  dishes: 'კერძები',
  orders: 'შეკვეთები',
  noorders: 'ჯერ შეკვეთა არ გაქვს',
  favs: 'რჩეული',
  nofavs: 'რჩეული რესტორნები აქ გამოჩნდება',
  profile: 'პროფილი',
  guest: 'სტუმარი',
  city: 'ახალციხე',
  biz: 'ბიზნესისთვის',
  addBiz: '\u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d8\u10e1 \u10d3\u10d0\u10db\u10d0\u10e2\u10d4\u10d1\u10d0',
  addBizSoon: '\u10db\u10d0\u10da\u10d4 \u10d3\u10d0\u10d4\u10db\u10d0\u10e2\u10d4\u10d1\u10d0',
  bizTitle1: '\u10d3\u10d0\u10d0\u10db\u10d0\u10e2\u10d4 \u10e8\u10d4\u10dc\u10d8 \u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d8 AQVE-\u10d6\u10d4',
  bizSub1: '\u10e8\u10d4\u10d0\u10d5\u10e1\u10d4 \u10eb\u10d8\u10e0\u10d8\u10d7\u10d0\u10d3\u10d8 \u10d8\u10dc\u10e4\u10dd\u10e0\u10db\u10d0\u10ea\u10d8\u10d0. \u10d2\u10d0\u10dc\u10d0\u10ea\u10ee\u10d0\u10d3\u10e1 AQVE-\u10d8\u10e1 \u10d2\u10e3\u10dc\u10d3\u10d8 \u10d2\u10d0\u10d3\u10d0\u10d0\u10db\u10dd\u10ec\u10db\u10d4\u10d1\u10e1.',
  bizTitle2: '\u10d5\u10d8\u10e1 \u10d3\u10d0\u10d5\u10e3\u10d9\u10d0\u10d5\u10e8\u10d8\u10e0\u10d3\u10d4\u10d7?',
  bizSub2: '\u10d4\u10e1 \u10d8\u10dc\u10e4\u10dd\u10e0\u10db\u10d0\u10ea\u10d8\u10d0 AQVE-\u10d8\u10e1 \u10d2\u10d0\u10d3\u10d0\u10db\u10dd\u10ec\u10db\u10d4\u10d1\u10d8\u10e1\u10d0 \u10d3\u10d0 \u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d7\u10d0\u10dc \u10d9\u10dd\u10db\u10e3\u10dc\u10d8\u10d9\u10d0\u10ea\u10d8\u10d8\u10e1\u10d7\u10d5\u10d8\u10e1 \u10d2\u10d0\u10db\u10dd\u10d8\u10e7\u10d4\u10dc\u10d4\u10d1\u10d0.',
  bizTitle3: '\u10d1\u10dd\u10da\u10dd \u10dc\u10d0\u10d1\u10d8\u10ef\u10d8',
  bizSub3: '\u10d8\u10e3\u10e0\u10d8\u10d3\u10d8\u10e3\u10da\u10d8 \u10db\u10dd\u10dc\u10d0\u10ea\u10d4\u10db\u10d4\u10d1\u10d8 \u10d0\u10d3\u10db\u10d8\u10dc\u10d8\u10e1\u10e2\u10e0\u10d0\u10ea\u10d8\u10e3\u10da\u10d8\u10d0 \u10d3\u10d0 \u10e1\u10d0\u10ef\u10d0\u10e0\u10dd\u10d3 \u10d0\u10e0 \u10d2\u10d0\u10db\u10dd\u10e9\u10dc\u10d3\u10d4\u10d1\u10d0.',
  bizContinue: '\u10d2\u10d0\u10d2\u10e0\u10eb\u10d4\u10da\u10d4\u10d1\u10d0',
  bizSend: '\u10d2\u10d0\u10dc\u10d0\u10ea\u10ee\u10d0\u10d3\u10d8\u10e1 \u10d2\u10d0\u10d2\u10d6\u10d0\u10d5\u10dc\u10d0',
  bizSending: '\u10d8\u10d2\u10d6\u10d0\u10d5\u10dc\u10d4\u10d1\u10d0...',
  bizOk: '\u10d2\u10d0\u10dc\u10d0\u10ea\u10ee\u10d0\u10d3\u10d8 \u10db\u10d8\u10e6\u10d4\u10d1\u10e3\u10da\u10d8\u10d0',
  bizOkSub: '\u10e9\u10d5\u10d4\u10dc \u10d2\u10d0\u10d3\u10d0\u10d5\u10d0\u10db\u10dd\u10ec\u10db\u10d4\u10d1\u10d7 \u10d8\u10dc\u10e4\u10dd\u10e0\u10db\u10d0\u10ea\u10d8\u10d0\u10e1 \u10d3\u10d0 \u10d3\u10d0\u10d2\u10d8\u10d9\u10d0\u10d5\u10e8\u10d8\u10e0\u10d3\u10d4\u10d1\u10d8\u10d7.\n\u10d3\u10d0\u10db\u10e2\u10d9\u10d8\u10ea\u10d4\u10d1\u10d8\u10e1 \u10e8\u10d4\u10db\u10d3\u10d4\u10d2 \u10e8\u10d4\u10eb\u10da\u10d4\u10d1\u10d7 \u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d8\u10e1 \u10db\u10d0\u10e0\u10d7\u10d5\u10d0\u10e1 AQVE-\u10d6\u10d4.',
  bizHome: '\u10db\u10d7\u10d0\u10d5\u10d0\u10e0\u10d6\u10d4 \u10d3\u10d0\u10d1\u10e0\u10e3\u10dc\u10d4\u10d1\u10d0',
  bizFail: '\u10d2\u10d0\u10d2\u10d6\u10d0\u10d5\u10dc\u10d0 \u10d5\u10d4\u10e0 \u10db\u10dd\u10ee\u10d4\u10e0\u10ee\u10d3\u10d0. \u10e1\u10ea\u10d0\u10d3\u10d4 \u10ee\u10d4\u10da\u10d0\u10ee\u10da\u10d0.',
  cart: 'კალათა',
  products: 'პროდუქტები',
  sum: 'ჯამი',
  order: 'შეკვეთა',
  confirm: 'შეკვეთის დადასტურება',
  pay: 'გადასახდელი',
  place: 'შეკვეთის გაფორმება',
  cancel: 'გაუქმება',
  preparing: 'მზადება',
  now: 'ახლა',
  dish: 'კერძი',
  othercart: 'კალათაში სხვა რესტორნის კერძებია. გავასუფთავოთ?',
  req: 'მოთხოვნა მიღებულია — დემო რეჟიმი',
  dash: '\u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d8\u10e1 \u10de\u10d0\u10dc\u10d4\u10da\u10d8',
  unavail: '\u10d3\u10e0\u10dd\u10d4\u10d1\u10d8\u10d7 \u10db\u10d8\u10e3\u10ec\u10d5\u10d3\u10dd\u10db\u10d4\u10da\u10d8\u10d0',
  closedNow: '\u10d0\u10ee\u10da\u10d0 \u10d3\u10d0\u10d9\u10d4\u10e2\u10d8\u10da\u10d8\u10d0',
  addItem: '+\u00a0\u10d3\u10d0\u10db\u10d0\u10e2\u10d4\u10d1\u10d0',
  findDish: '\u10db\u10dd\u10eb\u10d4\u10d1\u10dc\u10d4 \u10d9\u10d4\u10e0\u10eb\u10d8...',
  noCatDishes: '\u10d0\u10db \u10d9\u10d0\u10e2\u10d4\u10d2\u10dd\u10e0\u10d8\u10d0\u10e8\u10d8 \u10ef\u10d4\u10e0 \u10d9\u10d4\u10e0\u10eb\u10d4\u10d1\u10d8 \u10d0\u10e0 \u10d0\u10e0\u10d8\u10e1.',
  noDishFound: '\u10d9\u10d4\u10e0\u10eb\u10d8 \u10d5\u10d4\u10e0 \u10db\u10dd\u10d8\u10eb\u10d4\u10d1\u10dc\u10d0',
  clearQ: '\u10d2\u10d0\u10e1\u10e3\u10e4\u10d7\u10d0\u10d5\u10d4\u10d1\u10d0',
  ings: '\u10d8\u10dc\u10d2\u10e0\u10d4\u10d3\u10d8\u10d4\u10dc\u10e2\u10d4\u10d1\u10d8',
  details: '\u10d3\u10d4\u10e2\u10d0\u10da\u10d4\u10d1\u10d8',
  ingsHint: '\u10d3\u10d0\u10d0\u10d6\u10d8\u10e0\u10d4 \u00d7 \u10d8\u10dc\u10d2\u10e0\u10d4\u10d3\u10d8\u10d4\u10dc\u10e2\u10d6\u10d4, \u10e0\u10dd\u10db\u10d4\u10da\u10d8\u10ea \u10d0\u10e0 \u10d2\u10d8\u10dc\u10d3\u10d0 \u10e8\u10d4\u10d9\u10d5\u10d4\u10d7\u10d0\u10e8\u10d8',
  without: '\u10d2\u10d0\u10e0\u10d4\u10e8\u10d4',
  comp: '\u10e8\u10d4\u10db\u10d0\u10d3\u10d2\u10d4\u10dc\u10da\u10dd\u10d1\u10d0',
  editIngs: '\u10e8\u10d4\u10ea\u10d5\u10da\u10d0',
  ingsReady: '\u10db\u10d6\u10d0\u10d3\u10d0\u10d0',
  thisOne: '\u10db\u10ee\u10dd\u10da\u10dd\u10d3 \u10d4\u10e1 \u10d4\u10e0\u10d7\u10d8',
  extrasTitle: '\u10d3\u10d0\u10d0\u10db\u10d0\u10e2\u10d4 \u10e1\u10e3\u10e0\u10d5\u10d8\u10da\u10d8\u10e1\u10d0\u10db\u10d4\u10d1\u10e0',
  extrasLabel: '\u10d3\u10d0\u10db\u10d0\u10e2\u10d4\u10d1\u10d4\u10d1\u10d8',
  extraPrefix: '\u10d3\u10d0\u10db\u10d0\u10e2\u10d4\u10d1\u10d8\u10d7\u10d8',
  removedLabel: '\u10d0\u10db\u10dd\u10e6\u10d4\u10d1\u10e3\u10da\u10d8\u10d0',
  quoteFail: '\u10e4\u10d0\u10e1\u10d8\u10e1 \u10d3\u10d0\u10d3\u10d0\u10e1\u10e2\u10e3\u10e0\u10d4\u10d1\u10d0 \u10d5\u10d4\u10e0 \u10db\u10dd\u10ee\u10d4\u10e0\u10ee\u10d3\u10d0',
  eatHint: '\u10e8\u10d4\u10db\u10d8\u10e0\u10e9\u10d8\u10d4 \u10e0\u10d0\u10db\u10d4',
  trendTitle: '\u10d0\u10ee\u10da\u10d0 \u10e2\u10e0\u10d4\u10dc\u10d3\u10e8\u10d8\u10d0 \u10d0\u10ee\u10d0\u10da\u10ea\u10d8\u10ee\u10d4\u10e8\u10d8',
  itemWord: '\u10dc\u10d8\u10d5\u10d7\u10d8',
  homeEnd: '\u10d0\u10db \u10d4\u10e2\u10d0\u10de\u10d6\u10d4 \u10e1\u10e3\u10da \u10d4\u10e1\u10d0\u10d0 \u2014 \u10db\u10d0\u10da\u10d4 \u10db\u10d4\u10e2\u10d8 \u10d8\u10e5\u10dc\u10d4\u10d1\u10d0',
};

const RESTAURANTS = [
  {
    id: "rabati",
    name: 'რაბათი გრილი',
    cuisine: 'ბურგერი • გრილი',
    category: "burger",
    rating: 4.8, reviews: 312, time: "25–35 წთ", timeMin: 25, fee: 4, promo: "-20%", live: "open",
    image: photoNatural("photo-1550547660-d9450f859349"),
    menu: {
      'ბურგერი': [
        { id: "r1", name: 'კლასიკური ბურგერი', desc: 'საქონლის ხორცი, ჩედარი, სოუსი', price: 16.9, image: photo("photo-1568901346375-23c9450c58cd", 400) },
        { id: "r2", name: 'დაბლ ჩიზბურგერი', desc: 'ორმაგი ხორცი და ყველი', price: 19.5, image: photo("photo-1553979459-d2229ba7433b", 400) },
      ],
      'გარნირი': [
        { id: "r3", name: 'ფრი', desc: 'ხრაშუნა კარტოფილი', price: 6.5, image: photo("photo-1573080496219-bb0803267ae1", 400) },
      ],
    },
  },
  {
    id: "meskhi",
    name: 'მესხური ეზო',
    cuisine: 'ქართული • ხინკალი',
    category: "geo",
    rating: 4.9, reviews: 540, time: "30–40 წთ", timeMin: 30, fee: 5, promo: "", live: "busy",
    image: photoNatural("photo-1555939594-58d7cb561ad1"),
    menu: {
      'ქართული': [
        { id: "m1", name: 'ხინკალი', desc: '10 ცალი, წვნიანი', price: 18, image: photo("photo-1496116218417-1a781b1c416c", 400) },
        { id: "m2", name: 'მწვადი', desc: 'ღორის მწვადი, პური', price: 22, image: photo("photo-1555939594-58d7cb561ad1", 400) },
      ],
      'სალათი': [
        { id: "m3", name: 'საქონლის სალათი', desc: 'სეზონური ბოსტნეული', price: 9, image: photo("photo-1546069901-ba9599a7e63c", 400) },
      ],
    },
  },
  {
    id: "green",
    name: 'მწვანე კაფე',
    cuisine: 'ყავა • დესერტი',
    category: "cafe",
    rating: 4.7, reviews: 188, time: "15–25 წთ", timeMin: 15, fee: 0, promo: 'უფასო მიტანა', live: "closing", until: "22:00",
    image: photoNatural("photo-1495474472287-4d71bcdd2085"),
    menu: {
      'ყავა': [
        { id: "g1", name: 'კაპუჩინო', desc: 'რბილი ქაფი', price: 8, image: photo("photo-1509042239860-f550ce710b93", 400) },
        { id: "g2", name: 'აის ლატე', desc: 'ცივი რძიანი ყავა', price: 9.5, image: photo("photo-1461023058943-07fcbe16d735", 400) },
      ],
      'დესერტი': [
        { id: "g3", name: 'ჩიზქეიქი', desc: 'ნიუ-იორკ სტილი', price: 11, image: photo("photo-1578985545062-69928b1d9587", 400) },
      ],
    },
  },
  {
    id: "napoli",
    name: 'ნაპოლი პიცა',
    cuisine: 'პიცა • იტალიური',
    category: "pizza",
    rating: 4.6, reviews: 276, time: "20–30 წთ", timeMin: 20, fee: 3, promo: "1+1", live: "open",
    image: photoNatural("photo-1574071318508-1cdbab80d002"),
    menu: {
      'პიცა': [
        { id: "n1", name: 'მარგარიტა', desc: 'მოცარელა, ბაზილიკო', price: 17, image: photo("photo-1513104890138-7c749659a591", 400) },
        { id: "n2", name: 'პეპერონი', desc: 'ცხარე სალამი', price: 19, image: photo("photo-1628840042765-356cda07504e", 400) },
      ],
    },
  },
  {
    id: "sweet",
    name: 'სვიტ ჰაუსი',
    cuisine: 'დესერტი • ნამცხვარი',
    category: "dessert",
    rating: 4.8, reviews: 143, time: "20–30 წთ", timeMin: 20, fee: 0, promo: 'უფასო მიტანა', live: "open",
    image: photoNatural("photo-1563805042-7684c019e1cb"),
    menu: {
      'დესერტი': [
        { id: "s1", name: 'დონატები', desc: '3 ცალი, გლაზური', price: 10, image: photo("photo-1551024601-bec78aea704b", 400) },
        { id: "s2", name: 'ნაყინი', desc: 'ვანილი / შოკოლადი', price: 7, image: photo("photo-1563805042-7684c019e1cb", 400) },
      ],
    },
  },
  {
    id: "market",
    name: 'ახალციხის მარკეტი',
    cuisine: 'მაღაზია • პროდუქტი',
    category: "shop",
    rating: 4.5, reviews: 97, time: "35–50 წთ", timeMin: 35, fee: 6, promo: "", live: "closed", opens: "10:00",
    image: photoNatural("photo-1542838132-92c53300491e"),
    menu: {
      'პროდუქტი': [
        { id: "k1", name: 'პურის კალათა', desc: 'სუფთა თონის პური', price: 4.5, image: photo("photo-1509440159596-0249088772ff", 400) },
        { id: "k2", name: 'ხილის ნაკრები', desc: 'სეზონური ხილი', price: 12, image: photo("photo-1610832958506-aa56368176cf", 400) },
      ],
    },
  },
  {
    id: "city",
    name: 'ქალაქის ბურგერი',
    cuisine: 'ბურგერი • სწრაფი',
    category: "burger",
    rating: 4.4, reviews: 201, time: "15–25 წთ", timeMin: 15, fee: 0, promo: 'უფასო მიტანა', live: "open",
    image: photoNatural("photo-1571091718767-18b5b1457add"),
    menu: {
      'ბურგერი': [
        { id: "c1", name: 'სმეში ბურგერი', desc: 'თხელი კატლეტი, სოუსი', price: 14, image: photo("photo-1550547660-d9450f859349", 400) },
        { id: "c2", name: 'ჩიკენ ბურგერი', desc: 'ქათმის ფილე', price: 13.5, image: photo("photo-1606755962773-d324e0a13086", 400) },
        { id: "c3", name: 'შაურმა', desc: 'ქათამი, სოუსი, პიტა', price: 12, image: photo("photo-1599487488170-d11ec9c172f0", 400) },
      ],
    },
  },
  {
    id: "tone",
    name: 'თონე მესხეთი',
    cuisine: 'ქართული • საცხობი',
    category: "geo",
    rating: 4.7, reviews: 164, time: "20–30 წთ", timeMin: 20, fee: 3, promo: "", live: "closing", until: "21:00",
    image: photoNatural("photo-1509440159596-0249088772ff"),
    menu: {
      'საცხობი': [
        { id: "t1", name: 'შოთის პური', desc: 'ცომი, სუფთა თონე', price: 3.5, image: photo("photo-1549931319-a545dcf3bc73", 400) },
        { id: "t2", name: 'ახალი ხაჭაპური', desc: 'იმერული', price: 12, image: photo("photo-1604908176997-125f25cc6f3d", 400) },
      ],
    },
  },
];

const state = {
  page: "home",
  restaurantId: null,
  category: "all",
  menuCat: null,
  menuQuery: "",
  dishId: null,
  dishRemoved: [],
  dishExtras: [],
  query: "",
  favorites: new Set(JSON.parse(localStorage.getItem("aqve-favs") || "[]")),
  cart: JSON.parse(localStorage.getItem("aqve-cart") || "[]"),
  orders: JSON.parse(localStorage.getItem("aqve-orders") || "[]"),
  cartOpen: false,
  cartEditId: null,
  pick: "",
};

const view = document.getElementById("view");
const cartPanel = document.getElementById("cartPanel");
const app = document.getElementById("app");
const overlay = document.getElementById("overlay");
const mobileCartBtn = document.getElementById("mobileCartBtn");
const search = document.getElementById("search");

function newCartLineId() {
  return "cl" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function removedKey(removed) {
  return (removed || []).map((name) => String(name).trim()).filter(Boolean).sort().join("\n");
}

function ensureCartLineIds() {
  let dirty = false;
  state.cart.forEach((line) => {
    if (!line.id) {
      line.id = newCartLineId();
      dirty = true;
    }
    if (!Array.isArray(line.removed)) {
      line.removed = [];
      dirty = true;
    }
    if (!Array.isArray(line.extras)) {
      line.extras = [];
      dirty = true;
    }
  });
  if (dirty) save();
}

function save() {
  localStorage.setItem("aqve-favs", JSON.stringify([...state.favorites]));
  localStorage.setItem("aqve-cart", JSON.stringify(state.cart));
  localStorage.setItem("aqve-orders", JSON.stringify(state.orders));
}

ensureCartLineIds();

function money(n) {
  return n.toFixed(n % 1 ? 1 : 0) + " \u10da";
}

function moneyTetri(tetri) {
  const n = Number(tetri || 0) / 100;
  return n.toFixed(n % 1 ? 2 : 0) + " \u10da";
}

function itemBaseTetri(item) {
  if (!item) return 0;
  if (item.price_tetri != null) return Number(item.price_tetri) || 0;
  return Math.round(Number(item.price || 0) * 100);
}

function extraPriceTetri(ing) {
  if (!ing) return 0;
  if (ing.extra_price_tetri != null) return Number(ing.extra_price_tetri) || 0;
  return Math.round(Number(ing.extra_price || 0) * 100);
}

function includedIngs(item) {
  return (item.ingredients || []).filter((ing) => {
    if (!ing || typeof ing === "string") return Boolean(ing);
    return ing.included_by_default !== false;
  });
}

function extraIngs(item) {
  return (item.ingredients || []).filter((ing) => ing && typeof ing === "object" && ing.extra_available && ing.id);
}

function extrasKey(extras) {
  return (extras || []).filter((row) => row && row.qty > 0).map((row) => row.id + ":" + row.qty).sort().join(",");
}

function lineExtras(line) {
  return (line.extras || []).filter((row) => row && row.qty > 0);
}

function extrasUnitTetri(line, item) {
  const catalog = extraIngs(item);
  return lineExtras(line).reduce((sum, row) => {
    const ing = catalog.find((x) => x.id === row.id);
    return sum + extraPriceTetri(ing) * row.qty;
  }, 0);
}

function lineUnitTetri(line, item) {
  return itemBaseTetri(item) + extrasUnitTetri(line, item);
}

let LIVE_CATALOG = [];

function catalog() {
  const demoIds = new Set(LIVE_CATALOG.map((r) => r.id));
  return LIVE_CATALOG.concat(RESTAURANTS.filter((r) => !demoIds.has(r.id)));
}

function restaurantById(id) {
  return catalog().find((r) => r.id === id);
}

function allItems() {
  return catalog().flatMap((r) =>
    Object.values(r.menu || {}).flat().map((item) => ({ ...item, restaurantId: r.id, restaurant: r.name }))
  );
}

function filteredRestaurants() {
  const q = state.query.trim().toLowerCase();
  return catalog().filter((r) => {
    const catOk = state.category === "all" || r.category === state.category;
    const text = (r.name + " " + r.cuisine + " " + Object.values(r.menu).flat().map((i) => i.name).join(" ")).toLowerCase();
    const pickOk =
      !state.pick ||
      (state.pick === "deal" && /20|1\+1/.test(r.promo)) ||
      (state.pick === "fast" && r.timeMin <= 25) ||
      (state.pick === "free" && r.fee === 0) ||
      (state.pick === "top" && r.rating >= 4.7);
    return catOk && pickOk && (!q || text.includes(q));
  }).sort((a, b) => (state.pick === "top" ? b.rating - a.rating : 0));
}

function cartQty(itemId) {
  return state.cart.reduce((n, line) => n + (line.itemId === itemId ? line.qty : 0), 0);
}

function cartCount() {
  return state.cart.reduce((n, x) => n + x.qty, 0);
}

function cartRestaurant() {
  if (!state.cart.length) return null;
  return restaurantById(state.cart[0].restaurantId);
}

function cartTotals() {
  const rest = cartRestaurant();
  const itemsTetri = state.cart.reduce((sum, line) => {
    const item = allItems().find((i) => i.id === line.itemId);
    return sum + (item ? lineUnitTetri(line, item) * line.qty : 0);
  }, 0);
  const feeTetri = rest && rest.fee_tetri != null ? Number(rest.fee_tetri) || 0 : Math.round(Number(rest && rest.fee || 0) * 100);
  return {
    items: itemsTetri / 100,
    fee: feeTetri / 100,
    total: (itemsTetri + feeTetri) / 100,
    itemsTetri,
    feeTetri,
    totalTetri: itemsTetri + feeTetri,
  };
}

function canOrder(restaurantId, item) {
  const rest = restaurantById(restaurantId);
  if (!rest || rest.live === "closed") return false;
  if (item && item.available === false) return false;
  return true;
}

function setQty(restaurantId, item, qty, fromEl, extra) {
  const prev = cartQty(item.id);
  const delta = qty - prev;
  if (!delta) return;
  if (delta > 0 && !canOrder(restaurantId, item)) return;
  if (state.cart.length && state.cart[0].restaurantId !== restaurantId) {
    if (!confirm(T.othercart)) return;
    state.cart = [];
  }
  const removed = extra && Array.isArray(extra.removed) ? extra.removed.slice() : [];
  const extras = extra && Array.isArray(extra.extras) ? extra.extras.filter((row) => row.qty > 0).map((row) => ({ id: row.id, qty: row.qty })) : [];
  const key = removedKey(removed) + "\0" + extrasKey(extras);
  let i = state.cart.findIndex((x) => x.itemId === item.id && removedKey(x.removed) + "\0" + extrasKey(x.extras) === key);
  if (i < 0 && delta < 0) {
    for (let j = state.cart.length - 1; j >= 0; j--) {
      if (state.cart[j].itemId === item.id) { i = j; break; }
    }
  }
  if (i >= 0) {
    const next = state.cart[i].qty + delta;
    if (next <= 0) {
      if (state.cartEditId === state.cart[i].id) state.cartEditId = null;
      state.cart.splice(i, 1);
    } else {
      state.cart[i].qty = next;
    }
  } else if (delta > 0) {
    state.cart.push({
      id: newCartLineId(),
      restaurantId,
      itemId: item.id,
      qty: delta,
      removed,
      extras,
    });
  }
  const origin = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : null;
  save();
  if (delta > 0) {
    flyToCart(origin);
    pingCart();
    fromEl?.classList.add("is-pop");
  }
  render();
}

function adjustLineQty(lineId, delta, fromEl) {
  const i = state.cart.findIndex((x) => x.id === lineId);
  if (i < 0 || !delta) return;
  const line = state.cart[i];
  const item = allItems().find((x) => x.id === line.itemId);
  if (!item) return;
  if (delta > 0 && !canOrder(line.restaurantId, item)) return;
  const next = line.qty + delta;
  if (next <= 0) {
    if (state.cartEditId === line.id) state.cartEditId = null;
    state.cart.splice(i, 1);
  } else {
    line.qty = next;
  }
  save();
  if (delta > 0) {
    const origin = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : null;
    flyToCart(origin);
    pingCart();
    fromEl?.classList.add("is-pop");
  }
  render();
}

function mergeMatchingCartLines() {
  const kept = [];
  const seen = new Map();
  state.cart.forEach((line) => {
    if (line.id === state.cartEditId) {
      kept.push(line);
      return;
    }
    const key = line.itemId + "\0" + removedKey(line.removed) + "\0" + extrasKey(line.extras);
    const twin = seen.get(key);
    if (twin) {
      twin.qty += line.qty;
      return;
    }
    seen.set(key, line);
    kept.push(line);
  });
  state.cart = kept;
}

function startCartIngEdit(lineId) {
  if (state.cartEditId === lineId) {
    state.cartEditId = null;
    mergeMatchingCartLines();
    save();
    renderCart();
    return;
  }
  const line = state.cart.find((x) => x.id === lineId);
  if (!line) return;
  if (line.qty > 1) {
    line.qty -= 1;
    const copy = {
      id: newCartLineId(),
      restaurantId: line.restaurantId,
      itemId: line.itemId,
      qty: 1,
      removed: (line.removed || []).slice(),
      extras: lineExtras(line).map((row) => ({ id: row.id, qty: row.qty })),
    };
    state.cart.splice(state.cart.indexOf(line) + 1, 0, copy);
    state.cartEditId = copy.id;
  } else {
    state.cartEditId = line.id;
  }
  save();
  renderCart();
}

function pingCart() {
  const ping = document.getElementById("cartPing");
  if (!ping) return;
  ping.hidden = false;
  ping.classList.remove("is-on");
  void ping.offsetWidth;
  ping.classList.add("is-on");
  clearTimeout(pingCart.t);
  pingCart.t = setTimeout(() => {
    ping.classList.remove("is-on");
    ping.hidden = true;
  }, 1100);
}

function isMobileView() {
  return window.matchMedia("(max-width: 760px)").matches;
}

function flyToCart(origin) {
  if (!origin || !origin.width) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const destEl = document.getElementById("headerCart");
  const visible = destEl && destEl.getClientRects().length;
  const dest = (visible ? destEl : document.querySelector('.tab[data-go="orders"]'))?.getBoundingClientRect();
  if (!dest || !dest.width) return;
  const node = document.createElement("span");
  node.className = "aqve-fly";
  node.style.left = origin.left + origin.width / 2 + "px";
  node.style.top = origin.top + origin.height / 2 + "px";
  document.body.appendChild(node);
  const dx = dest.left + dest.width / 2 - (origin.left + origin.width / 2);
  const dy = dest.top + dest.height / 2 - (origin.top + origin.height / 2);
  const ms = isMobileView() ? 300 : 550;
  node.style.transitionDuration = ms + "ms";
  requestAnimationFrame(() => {
    node.style.transform = `translate(${dx}px, ${dy}px)`;
    node.style.opacity = "0.15";
  });
  destEl?.classList.add("is-receiving");
  setTimeout(() => {
    node.remove();
    destEl?.classList.remove("is-receiving");
  }, ms + 30);
}

function syncCartDot() {
  const n = cartCount();
  document.querySelectorAll(".cart-dot").forEach((dot) => {
    dot.hidden = n === 0;
    dot.textContent = n > 9 ? "9+" : String(n);
  });
}

function toggleFav(id, e) {
  e?.stopPropagation();
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  save();
  render();
  requestAnimationFrame(() => {
    document.querySelector(`[data-fav="${id}"]`)?.classList.add("is-pop");
  });
}

function go(page, id) {
  if (page === "home") location.hash = "#/";
  else if (page === "restaurant") location.hash = "#/r/" + id;
  else if (page === "business-register" || page === "business/register") location.hash = "#/business/register";
  else location.hash = "#/" + page;
}

function parseHash() {
  const path = (location.pathname || "").replace(/\/+$/, "");
  if (path.endsWith("/business/register")) return { page: "business-register", restaurantId: null };
  const h = location.hash.replace(/^#\/?/, "");
  if (!h) return { page: "home", restaurantId: null };
  if (h === "business/register" || h === "business-registration") return { page: "business-register", restaurantId: null };
  if (h.startsWith("r/")) return { page: "restaurant", restaurantId: h.slice(2) };
  return { page: h, restaurantId: null };
}

function statusHTML(r) {
  if (r.live === "closed") {
    return `<span class="rst-state is-closed"><i></i>${LIVE.closed}${r.opens ? ` · იხსნება ${r.opens}` : ""}</span>`;
  }
  if (r.live === "closing") return `<span class="rst-state is-closing"><i></i>${LIVE.closing} ${r.until}-ზე</span>`;
  if (r.live === "busy") return `<span class="rst-state is-busy"><i></i>${LIVE.busy}</span>`;
  return `<span class="rst-state is-open"><i></i>${LIVE.open}</span>`;
}

function contextBadge(r) {
  if (r.promo) return "";
  if (r.rating >= 4.9) return '<span class="ctx">\u10de\u10dd\u10de\u10e3\u10da\u10d0\u10e0\u10e3\u10da\u10d8</span>';
  if (r.id === "tone") return '<span class="ctx ctx-aqve">AQVE \u10d0\u10e0\u10e9\u10d4\u10d5\u10d0\u10dc\u10d8</span>';
  if (r.timeMin <= 20 && r.live !== "closed") return '<span class="ctx ctx-fast">\u10e1\u10ec\u10e0\u10d0\u10e4\u10d8</span>';
  return "";
}

function restaurantMenuItems(r) {
  return Object.entries(r.menu || {}).flatMap(([cat, items]) =>
    (items || []).map((item) => ({ ...item, categoryName: cat }))
  );
}

function classifyRestaurantImage(img) {
  const box = img && img.closest("[data-ri]");
  if (!box) return;
  applyRestaurantCover(box);
  box.classList.add("is-ready");
}

const AQVE_DESKTOP_ASPECT = 16 / 9;
const AQVE_MOBILE_ASPECT = 358 / 202.8;
const AQVE_COVER_ZOOM_MIN = 0.35;
const AQVE_COVER_ZOOM_MAX = 3;

function clampCoverValue(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function parseCoverCrop(raw) {
  let src = raw;
  if (typeof src === "string") {
    try { src = JSON.parse(src); } catch { src = null; }
  }
  const x = Number(src && src.x);
  const y = Number(src && src.y);
  const zoom = Number(src && src.zoom);
  return {
    x: clampCoverValue(Number.isFinite(x) ? x : 50, 0, 100),
    y: clampCoverValue(Number.isFinite(y) ? y : 50, 0, 100),
    zoom: clampCoverValue(Number.isFinite(zoom) ? zoom : 1, AQVE_COVER_ZOOM_MIN, AQVE_COVER_ZOOM_MAX),
  };
}

function aqveCoverLayout(nw, nh, crop, frameAspect) {
  const zoom = clampCoverValue(Number(crop && crop.zoom) || 1, AQVE_COVER_ZOOM_MIN, AQVE_COVER_ZOOM_MAX);
  const x = clampCoverValue(Number.isFinite(Number(crop && crop.x)) ? Number(crop.x) : 50, 0, 100);
  const y = clampCoverValue(Number.isFinite(Number(crop && crop.y)) ? Number(crop.y) : 50, 0, 100);
  const ratio = frameAspect > 0 ? frameAspect : AQVE_DESKTOP_ASPECT;
  const imageAspect = nw / nh;
  const dw = Math.max(1, imageAspect / ratio) * zoom;
  const dh = Math.max(1, ratio / imageAspect) * zoom;
  return {
    dw,
    dh,
    ox: (1 - dw) * (x / 100),
    oy: (1 - dh) * (y / 100),
  };
}

function coverImageSrc(r, fallback) {
  const raw = String((r && (r.cover_original || r.cover_original_url)) || fallback || "");
  if (!raw) return "";
  if (!(r && (r.cover_crop_desktop || r.cover_crop_mobile || r.cover_original || r.cover_original_url))) return raw;
  const desktop = parseCoverCrop(r.cover_crop_desktop);
  const mobile = parseCoverCrop(r.cover_crop_mobile);
  const stamp = [desktop.x, desktop.y, desktop.zoom, mobile.x, mobile.y, mobile.zoom].join("-");
  return raw + (raw.includes("?") ? "&" : "?") + "cc=" + encodeURIComponent(stamp);
}

function cropFromBox(box, which) {
  const prefix = which === "mobile" ? "cropMobile" : "cropDesktop";
  const x = Number(box.dataset[prefix + "X"]);
  const y = Number(box.dataset[prefix + "Y"]);
  const zoom = Number(box.dataset[prefix + "Zoom"]);
  if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(zoom)) {
    return parseCoverCrop({ x, y, zoom });
  }
  return parseCoverCrop(box.dataset[prefix]);
}

function paintCoverVars(el, layout) {
  if (!el) return;
  el.style.setProperty("--aqve-dw", layout.dw * 100 + "%");
  el.style.setProperty("--aqve-dh", layout.dh * 100 + "%");
  el.style.setProperty("--aqve-ox", layout.ox * 100 + "%");
  el.style.setProperty("--aqve-oy", layout.oy * 100 + "%");
}

function applyRestaurantCover(box) {
  if (!box || !box.hasAttribute("data-crop-desktop")) return;
  const img = box.querySelector(".ri-img");
  const frame = box.querySelector(".ri-frame") || box;
  const nw = img && img.naturalWidth;
  const nh = img && img.naturalHeight;
  if (!nw || !nh) return;
  const mobile = isMobileView();
  const crop = cropFromBox(box, mobile ? "mobile" : "desktop");
  const rect = frame.getBoundingClientRect();
  const fallback = mobile ? AQVE_MOBILE_ASPECT : AQVE_DESKTOP_ASPECT;
  const aspect = rect.width > 2 && rect.height > 2 ? rect.width / rect.height : fallback;
  const layout = aqveCoverLayout(nw, nh, crop, aspect);
  box.classList.add("is-composed");
  paintCoverVars(img, layout);
  img.style.setProperty("position", "absolute", "important");
  img.style.setProperty("inset", "auto", "important");
  img.style.setProperty("left", layout.ox * 100 + "%", "important");
  img.style.setProperty("top", layout.oy * 100 + "%", "important");
  img.style.setProperty("right", "auto", "important");
  img.style.setProperty("bottom", "auto", "important");
  img.style.setProperty("width", layout.dw * 100 + "%", "important");
  img.style.setProperty("height", layout.dh * 100 + "%", "important");
  img.style.setProperty("min-width", "0", "important");
  img.style.setProperty("min-height", "0", "important");
  img.style.setProperty("max-width", "none", "important");
  img.style.setProperty("max-height", "none", "important");
  img.style.setProperty("object-fit", "fill", "important");
  img.style.setProperty("object-position", "center", "important");
  img.style.setProperty("transform", "none", "important");
}

function applyRestaurantCovers() {
  document.querySelectorAll("[data-ri][data-crop-desktop]").forEach(applyRestaurantCover);
}

function restaurantImageHTML({ src, alt, eager, variant, extras, restaurant }) {
  const r = restaurant || {};
  const url = coverImageSrc(r, src);
  const name = String(alt || "");
  const load = eager ? "" : 'loading="lazy" decoding="async"';
  const hasCrop = Boolean(r.cover_crop_desktop || r.cover_crop_mobile || r.cover_original || r.cover_original_url);
  const desktop = parseCoverCrop(r.cover_crop_desktop);
  const mobile = parseCoverCrop(r.cover_crop_mobile);
  const cropAttrs = hasCrop
    ? ` data-crop-desktop="${esc(JSON.stringify(desktop))}" data-crop-mobile="${esc(JSON.stringify(mobile))}" data-crop-desktop-x="${desktop.x}" data-crop-desktop-y="${desktop.y}" data-crop-desktop-zoom="${desktop.zoom}" data-crop-mobile-x="${mobile.x}" data-crop-mobile-y="${mobile.y}" data-crop-mobile-zoom="${mobile.zoom}"`
    : "";
  const photo = url
    ? `<img class="ri-img" src="${esc(url)}" alt="${esc(name)}" ${load}>`
    : "";
  return `
    <div class="card-media ri restaurant-cover ri-${variant || "card"}" data-ri${cropAttrs}>
      <span class="card-sk"></span>
      <div class="ri-frame">
        ${photo}
        <span class="ri-ph" aria-hidden="true"></span>
        ${extras || ""}
      </div>
    </div>
  `;
}

function cardHTML(r, i = 0, opts = {}) {
  const fav = state.favorites.has(r.id);
  const featured = Boolean(opts.featured);
  const eager = Boolean(opts.eager) || i < 2;
  const fee = r.fee
    ? `<span class="stat-fee">${money(r.fee)} \u10db\u10d8\u10e2\u10d0\u10dc\u10d0</span>`
    : `<span class="stat-free">\u10e3\u10e4\u10d0\u10e1\u10dd \u10db\u10d8\u10e2\u10d0\u10dc\u10d0<i></i></span>`;
  const letter = String(r.name || "A").slice(0, 1).toUpperCase();
  const extras = `
        ${r.promo ? `<span class="badge">${r.promo}<i></i></span>` : contextBadge(r)}
        ${statusHTML(r)}
        <button class="fav ${fav ? "is-on" : ""}" data-fav="${r.id}" type="button" aria-label="${T.favs}">
          <svg viewBox="0 0 24 24"><path d="M12 20.4 10.4 19C5.4 14.4 2 11.3 2 7.5A4.5 4.5 0 0 1 12 5a4.5 4.5 0 0 1 10 2.5c0 3.8-3.4 6.9-8.4 11.5L12 20.4z" ${fav ? 'fill="currentColor"' : ""}/></svg>
          <i class="fav-node"></i>
        </button>
        ${featured ? `<svg class="card-route" viewBox="0 0 320 80" preserveAspectRatio="none" aria-hidden="true"><path d="M8 58 C 70 58 92 18 156 28 S 240 70 312 24"/></svg>` : ""}`;
  return `
    <article class="card${featured ? " card--feature" : ""} has-logo${r.live === "closed" ? " is-closed" : ""}${feedAnimated ? "" : " is-enter"}" data-open="${r.id}" style="--i:${i}">
      ${restaurantImageHTML({ src: r.image, alt: r.name, eager, variant: featured ? "featured" : "card", extras, restaurant: r })}
      ${r.logo ? `<img class="card-logo" src="${r.logo}" alt="">` : `<span class="card-logo card-logo-ph" aria-hidden="true">${letter}</span>`}
      <div class="card-body">
        <h3 class="card-name">${r.name}</h3>
        <div class="card-meta">${r.cuisine}</div>
        <div class="card-stats">
          <span class="star">\u2605 ${r.rating}</span>
          <span class="stat-dot">\u00b7</span>
          <span class="stat-time">${r.time}</span>
          <span class="stat-dot">\u00b7</span>
          ${fee}
        </div>
      </div>
    </article>
  `;
}

function bindCardImages() {
  document.querySelectorAll("[data-ri] .ri-img").forEach((img) => {
    const ready = () => classifyRestaurantImage(img);
    if (img.complete && img.naturalWidth) ready();
    else {
      img.addEventListener("load", ready, { once: true });
      img.addEventListener("error", ready, { once: true });
    }
  });
  applyRestaurantCovers();
  document.querySelectorAll("[data-ri]").forEach((box) => {
    if (!box.querySelector(".ri-img")) box.classList.add("is-ready");
  });
  document.querySelectorAll(".menu-card-media img").forEach((img) => {
    const ready = () => img.closest(".menu-card-media")?.classList.add("is-ready");
    if (img.complete && img.naturalWidth) ready();
    else {
      img.addEventListener("load", ready, { once: true });
      img.addEventListener("error", ready, { once: true });
    }
  });
}

function foodCard(item, rank) {
  const rest = restaurantById(item.restaurantId);
  const signal = TREND_SIGNALS[item.id];
  const lead = rank === 1;
  return `
    <article class="food ${lead ? "is-lead" : ""} ${signal ? "has-signal" : ""}">
      <img src="${item.image}" alt="${item.name}" ${rank && rank > 2 ? 'loading="lazy" decoding="async"' : ""}>
      ${rank ? `<span class="food-rank">${rank === 1 ? "#1 \u10e2\u10e0\u10d4\u10dc\u10d3\u10e8\u10d8\u10d0" : "#" + rank}</span>` : ""}
      ${signal ? `<span class="food-signal">${signal}</span>` : ""}
      <div class="food-body">
        <h4>${item.name}</h4>
        <small>${item.restaurant}</small>
        <div class="food-meta">
          <strong class="price">${money(item.price)}</strong>
          ${rest ? `<span class="star">\u2605 ${rest.rating}</span>` : ""}
        </div>
      </div>
      <button class="add add-aqve" data-add="${item.restaurantId}:${item.id}" type="button" ${item.available === false ? "disabled" : ""}>+</button>
    </article>
  `;
}

function homeFeedHTML(list) {
  if (!list.length) return `<div class="empty">${T.none}</div>`;
  return `<div class="feed feed--masonry">${list.map((r, i) => cardHTML(r, i, { featured: i === 0, eager: i < 3 })).join("")}</div>`;
}

function liveStatus() {
  const open = catalog().filter((r) => r.live !== "closed");
  const avg = open.length ? Math.round(open.reduce((n, r) => n + r.timeMin, 0) / open.length) : 0;
  return { open: open.length, avg };
}

function recentDishes() {
  const seen = new Set();
  const out = [];
  state.orders.forEach((o) => {
    const ids = [...(o.itemIds || [])];
    if (!ids.length) {
      const r = o.restaurantId ? restaurantById(o.restaurantId) : RESTAURANTS.find((x) => x.name === o.restaurant);
      const first = r ? Object.values(r.menu).flat()[0] : null;
      if (first) ids.push(first.id);
    }
    ids.forEach((id) => {
      if (seen.has(id)) return;
      seen.add(id);
      const item = allItems().find((i) => i.id === id);
      if (item) out.push(item);
    });
  });
  return out.slice(0, 8);
}

function rail(title, list) {
  if (!list.length) return "";
  return `
    <section class="rail">
      <div class="section-head"><h2>${title}</h2></div>
      <div class="rail-track">${list.map((r) => cardHTML(r)).join("")}</div>
    </section>
  `;
}

function renderHome() {
  if (!homeReady) {
    view.innerHTML = `
      <div class="page page-home is-sk">
        <div class="sk-live"><i></i><b></b></div>
        <div class="sk-row sk-cats">${"<i></i>".repeat(7)}</div>
        <div class="sk-row sk-picks"><b class="is-lead"></b>${"<b></b>".repeat(3)}</div>
        <div class="sk-row sk-foods">${"<em></em>".repeat(4)}</div>
        <div class="feed feed--masonry">
          <article class="card card-ghost"><div class="card-media ri"><div class="ri-frame"></div></div><div class="card-body"><b></b><i></i></div></article>
          <article class="card card-ghost"><div class="card-media ri"><div class="ri-frame"></div></div><div class="card-body"><b></b><i></i></div></article>
          <article class="card card-ghost"><div class="card-media ri"><div class="ri-frame"></div></div><div class="card-body"><b></b><i></i></div></article>
        </div>
      </div>
    `;
    homeReady = true;
    setTimeout(render, 240);
    return;
  }
  const list = filteredRestaurants();
  const live = liveStatus();
  const again = recentDishes();
  const trend = TRENDING.map((id) => allItems().find((i) => i.id === id)).filter(Boolean);
  view.innerHTML = `
    <div class="page page-home">
      <div class="discover">
        <svg class="discover-route" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true">
          <path d="M18 22 C 90 18 120 54 198 46"/>
          <path d="M64 118 C 180 128 250 96 360 110"/>
          <path d="M210 248 C 340 232 480 268 620 250"/>
        </svg>
        <i class="route-dot d1"></i><i class="route-dot d2"></i><i class="route-dot d3"></i>
        <div class="discover-top">
          <p class="live-line">
            <i class="pulse"></i>
            <span>${live.open} \u10e0\u10d4\u10e1\u10e2\u10dd\u10e0\u10d0\u10dc\u10d8 \u10d0\u10ee\u10da\u10d0 \u10e6\u10d8\u10d0\u10d0</span>
            <span class="live-route" aria-hidden="true"></span>
            <span>\u2248${live.avg} \u10ec\u10d7 \u10e1\u10d0\u10e8\u10e3\u10d0\u10da\u10dd\u10d3</span>
          </p>
          <button class="eat-launch" data-eat-open type="button">
            <span class="eat-node" aria-hidden="true"></span>
            <span class="eat-copy">
              <strong>\u10e0\u10d0 \u10d5\u10ed\u10d0\u10db\u10dd?</strong>
              <em>${T.eatHint}</em>
            </span>
            <i class="eat-tail" aria-hidden="true"></i>
          </button>
        </div>
        <div class="cats" role="list">
          ${CATEGORIES.map((c) => `
            <button class="cat ${state.category === c.id ? "is-active" : ""}" data-cat="${c.id}" type="button">
              <span class="cat-visual">
                <img src="${c.image}" alt="">
                <svg class="cat-route" viewBox="0 0 76 76" aria-hidden="true"><path d="M46 70 C 58 70 68 60 70 48"/></svg>
                <i class="cat-node"></i>
              </span>
              <span class="cat-label">${c.name}</span>
            </button>
          `).join("")}
        </div>
        <div class="picks" role="list">
          ${PICKS.map((p, i) => `
            <button class="pick pick--${p.id}${i === 0 ? " pick--lead" : ""} ${state.pick === p.id ? "is-active" : ""}" data-pick="${p.id}" type="button">
              <svg class="pick-route" viewBox="0 0 240 112" preserveAspectRatio="none" aria-hidden="true">
                <path d="M12 78 C 54 78 64 22 118 32 S 176 92 228 40"/>
              </svg>
              <span class="pick-node"></span>
              <img src="${p.image}" alt="" ${i ? 'loading="lazy" decoding="async"' : ""}>
              <span class="pick-copy">
                <b>${p.title}</b>
                <small>${p.sub}</small>
              </span>
            </button>
          `).join("")}
        </div>
      </div>
      <section class="trend-zone">
        <svg class="zone-route" viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true"><path d="M40 48 C 180 18 280 70 420 42"/></svg>
        <section class="rail">
          <div class="section-head"><h2>${T.trendTitle}</h2><i class="sec-route" aria-hidden="true"></i></div>
          <div class="rail-track foods">${trend.map((item, i) => foodCard(item, i + 1)).join("")}</div>
        </section>
        ${again.length ? `
        <section class="rail">
          <div class="section-head"><h2>\u10d8\u10e1\u10d4\u10d5 \u10d8\u10d2\u10d8\u10d5\u10d4? \ud83d\udc40</h2></div>
          <div class="rail-track foods">${again.map((item) => foodCard(item)).join("")}</div>
        </section>` : ""}
      </section>
      <section class="near">
        <svg class="zone-route near-route" viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true"><path d="M720 22 C 800 50 880 18 980 36"/></svg>
        <div class="section-head"><h2>${T.near}</h2><i class="sec-route" aria-hidden="true"></i></div>
        ${homeFeedHTML(list)}
        ${list.length && list.length <= 4 ? `<p class="home-end"><i></i>${T.homeEnd}</p>` : ""}
      </section>
    </div>
  `;
  requestAnimationFrame(() => { feedAnimated = true; });
}

function qtyControl(restaurantId, item) {
  if (item && item.available === false) {
    return `<span class="dish-off">${T.unavail}</span>`;
  }
  const rest = restaurantById(restaurantId);
  if (rest && rest.live === "closed") {
    return `<span class="dish-off">${T.closedNow}</span>`;
  }
  const q = cartQty(item.id);
  if (!q) return `<button class="add" data-add="${restaurantId}:${item.id}" type="button">+</button>`;
  return `
    <div class="qty">
      <button class="ghost" data-add="${restaurantId}:${item.id}:-1" type="button">\u2212</button>
      <span>${q}</span>
      <button data-add="${restaurantId}:${item.id}:1" type="button">+</button>
    </div>
  `;
}

function menuQtyControl(restaurantId, item) {
  if (item && item.available === false) {
    return `<span class="dish-off">${T.unavail}</span>`;
  }
  const rest = restaurantById(restaurantId);
  if (rest && rest.live === "closed") {
    return `<span class="dish-off">${T.closedNow}</span>`;
  }
  const q = cartQty(item.id);
  if (!q) {
    return `<button class="menu-add" data-add="${restaurantId}:${item.id}" type="button"><i></i>${T.addItem}</button>`;
  }
  return `
    <div class="qty menu-qty">
      <button class="ghost" data-add="${restaurantId}:${item.id}:-1" type="button">\u2212</button>
      <span>${q}</span>
      <button data-add="${restaurantId}:${item.id}:1" type="button">+</button>
    </div>
  `;
}

function menuDishCard(r, item) {
  const signal = TREND_SIGNALS[item.id];
  const off = item.available === false;
  return `
    <article class="menu-card ${off ? "is-off" : ""}" data-dish="${item.id}">
      <div class="menu-card-media">
        <span class="menu-sk"></span>
        <img src="${item.image}" alt="${item.name}" loading="lazy" decoding="async">
        ${signal ? `<span class="menu-badge">${signal}</span>` : ""}
      </div>
      <div class="menu-card-body">
        <h4>${item.name}</h4>
        <p>${item.desc || ""}</p>
        <button class="menu-details" type="button" data-dish="${item.id}">${T.details}</button>
        <div class="menu-card-foot">
          <strong class="price">${money(item.price)}</strong>
          ${menuQtyControl(r.id, item)}
        </div>
      </div>
    </article>
  `;
}

function dishExtrasHTML(item) {
  const extras = extraIngs(item);
  if (!extras.length) return "";
  const picked = state.dishExtras || [];
  return `
    <div class="dish-extras">
      <span>${T.extrasTitle}</span>
      ${extras.map((ing) => {
        const qty = (picked.find((row) => row.id === ing.id) || {}).qty || 0;
        const price = extraPriceTetri(ing);
        if (qty) {
          return `<div class="dish-extra is-on">
            <div>
              <strong>${T.extraPrefix} ${ing.name}</strong>
              <em>${moneyTetri(price * qty)}</em>
            </div>
            <div class="qty">
              <button class="ghost" type="button" data-dish-extra="${ing.id}:-1">\u2212</button>
              <span>${qty}</span>
              <button type="button" data-dish-extra="${ing.id}:1">+</button>
            </div>
          </div>`;
        }
        return `<button class="dish-extra-add" type="button" data-dish-extra="${ing.id}:1"><i>+</i><span>${T.extraPrefix} ${ing.name}</span><em>+${moneyTetri(price)}</em></button>`;
      }).join("")}
    </div>`;
}

function dishDetailHTML(r, item) {
  if (!item) return "";
  const ings = includedIngs(item);
  const removed = state.dishRemoved || [];
  const preview = { extras: state.dishExtras || [] };
  return `
    <div class="dish-layer">
      <button class="dish-layer-bg" type="button" data-close-dish aria-label="${T.cancel}"></button>
      <div class="dish-sheet">
        <button class="dish-sheet-x" type="button" data-close-dish aria-label="${T.cancel}">\u2715</button>
        <div class="dish-sheet-media">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="dish-sheet-body">
          <h3>${item.name}</h3>
          <p>${item.desc || ""}</p>
          ${ings.length ? `
            <div class="dish-ings is-pick">
              <span>${T.comp}</span>
              <small>${T.ingsHint}</small>
              <p>${ings.map((ing) => {
                const name = String(ing.name || ing || "").trim();
                const off = removed.includes(name);
                return `<button class="dish-ing ${off ? "is-off" : ""}" type="button" data-toggle-ing="${name.replace(/"/g, "&quot;")}">${name}<i>${off ? "+" : "\u00d7"}</i></button>`;
              }).join("")}</p>
            </div>
          ` : ""}
          ${dishExtrasHTML(item)}
          ${item.prep_time ? `<div class="muted">${item.prep_time}</div>` : ""}
          <div class="dish-sheet-foot">
            <strong class="price">${moneyTetri(lineUnitTetri(preview, item))}</strong>
            ${menuQtyControl(r.id, item)}
          </div>
        </div>
      </div>
    </div>`;
}

function openDish(id) {
  if (state.dishId !== id) {
    state.dishRemoved = [];
    state.dishExtras = [];
  }
  state.dishId = id;
  render();
}

function renderRestaurant() {
  const r = restaurantById(state.restaurantId);
  if (!r) { go("home"); return; }
  const groups = Object.keys(r.menu || {});
  if (!groups.length) {
    view.innerHTML = `
      <div class="page page-restaurant">
        <button class="back" data-go="home" type="button">\u2190 ${T.back}</button>
        <div class="rest-head">
          <h1>${r.name}</h1>
          ${statusHTML(r)}
        </div>
        <div class="empty">${T.none}</div>
      </div>`;
    return;
  }
  if (!state.menuCat || !r.menu[state.menuCat]) state.menuCat = groups[0];
  const q = String(state.menuQuery || "").trim().toLowerCase();
  const searching = Boolean(q);
  const allDishes = restaurantMenuItems(r);
  const pool = searching
    ? allDishes.filter((item) => (item.name + " " + (item.desc || "")).toLowerCase().includes(q))
    : (r.menu[state.menuCat] || []);
  const openDish = allDishes.find((item) => item.id === state.dishId);
  view.innerHTML = `
    <div class="page page-restaurant">
      <button class="back" data-go="home" type="button">\u2190 ${T.back}</button>
      ${restaurantImageHTML({
        src: r.image,
        alt: r.name,
        eager: true,
        variant: "hero",
        restaurant: r,
        extras: `
          ${r.logo ? `<img class="rest-logo" src="${r.logo}" alt="">` : ""}
          ${r.promo ? `<span class="badge">${r.promo}</span>` : ""}`,
      })}
      <div class="rest-head">
        <h1>${r.name}</h1>
        <div class="card-meta">${r.cuisine}</div>
        ${r.short_description || r.description ? `<p class="muted">${r.short_description || r.description}</p>` : ""}
        <div class="rest-facts">
          ${statusHTML(r)}
          <span class="chip star">\u2605 ${r.rating} \u00b7 ${r.reviews}</span>
          <span class="chip">${r.time}</span>
          <span class="chip">${r.fee ? T.mitana + " " + money(r.fee) : T.ufaso}</span>
        </div>
      </div>
      <div class="menu-discover">
        <div class="menu-sticky">
          <label class="menu-search">
            <i class="search-mark" aria-hidden="true"></i>
            <input type="search" data-menu-search placeholder="${T.findDish}" value="${String(state.menuQuery || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")}">
          </label>
          <div class="menu-cats">
            ${groups.map((g) => `<button class="${state.menuCat === g ? "is-active" : ""}" data-menu-cat="${g}" type="button">${g}</button>`).join("")}
          </div>
        </div>
        <section class="menu-group">
          <div class="menu-heading">
            <h3>${searching ? T.search : state.menuCat}</h3>
            <i class="menu-route" aria-hidden="true"></i>
            <span>${pool.length} ${T.dish}</span>
          </div>
          ${pool.length
            ? `<div class="menu-grid">${pool.map((item) => menuDishCard(r, item)).join("")}</div>`
            : `<div class="menu-empty">
                <p>${searching ? T.noDishFound : T.noCatDishes}</p>
                ${searching ? `<button type="button" class="ghost-btn" data-clear-menu-q>${T.clearQ}</button>` : ""}
              </div>`}
        </section>
      </div>
      ${dishDetailHTML(r, openDish)}
    </div>
  `;
}

function renderSearch() {
  const q = state.query.trim().toLowerCase();
  const rests = q ? filteredRestaurants() : catalog();
  const dishes = q ? allItems().filter((i) => (i.name + " " + i.restaurant).toLowerCase().includes(q)) : [];
  const mobile = isMobileView();
  view.innerHTML = `
    <div class="page page-search">
      ${mobile ? "" : `<h1 class="greeting">${T.search}</h1>`}
      ${mobile && !q ? `
        <div class="cats search-cats" role="list">
          ${CATEGORIES.map((c) => `
            <button class="cat ${state.category === c.id ? "is-active" : ""}" data-cat="${c.id}" type="button">
              <span class="cat-visual">
                <img src="${c.image}" alt="">
                <i class="cat-node"></i>
              </span>
              <span class="cat-label">${c.name}</span>
            </button>
          `).join("")}
        </div>` : ""}
      <section>
        <div class="section-head"><h2>${T.rests}</h2></div>
        <div class="feed">${rests.map((r) => cardHTML(r)).join("") || `<div class="empty">${T.none}</div>`}</div>
      </section>
      ${dishes.length ? `
        <section class="stack">
          <div class="section-head"><h2>${T.dishes}</h2></div>
          ${dishes.map((item) => `
            <article class="dish">
              <div>
                <h4>${item.name}</h4>
                <p>${item.restaurant}</p>
                <div class="dish-foot">
                  <span class="price">${money(item.price)}</span>
                  ${qtyControl(item.restaurantId, item)}
                </div>
              </div>
              <img src="${item.image}" alt="${item.name}">
            </article>
          `).join("")}
        </section>
      ` : ""}
    </div>
  `;
}

function renderOrders() {
  view.innerHTML = `
    <div class="page">
      <h1 class="greeting">${T.orders}</h1>
      ${state.orders.length ? `<div class="stack">${state.orders.map((o) => `
        <article class="list-card order-card">
          <strong>${o.restaurant}</strong>
          <div class="muted">${o.items} \u00b7 ${o.when}</div>
          <div class="card-stats"><span>${o.status}</span><span>${money(o.total)}</span></div>
        </article>`).join("")}</div>` : `<div class="empty">${T.noorders}</div>`}
    </div>
  `;
}

function renderFavorites() {
  const list = catalog().filter((r) => state.favorites.has(r.id));
  view.innerHTML = `
    <div class="page">
      <h1 class="greeting">${T.favs}</h1>
      ${list.length ? `<div class="feed">${list.map((r) => cardHTML(r)).join("")}</div>` : `<div class="empty">${T.nofavs}</div>`}
    </div>
  `;
}

const BIZ_DRAFT_KEY = "aqve-biz-app-draft";
const BIZ_STEP_FIELDS = {
  1: ["business_name", "business_type", "city", "address", "business_phone", "social_url"],
  2: ["contact_first_name", "contact_last_name", "contact_phone", "contact_email", "contact_role"],
  3: ["identification_number", "authority", "terms"],
};
const BIZ_ERR = {
  business_name: "\u10e8\u10d4\u10d0\u10d5\u10e1\u10d4 \u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d8\u10e1 \u10e1\u10d0\u10ee\u10d4\u10da\u10d8",
  business_type: "\u10d0\u10d8\u10e0\u10e9\u10d8\u10d4 \u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d8\u10e1 \u10e2\u10d8\u10de\u10d8",
  city: "\u10d0\u10d8\u10e0\u10e9\u10d8\u10d4 \u10e5\u10d0\u10da\u10d0\u10e5\u10d8",
  address: "\u10e8\u10d4\u10d0\u10d5\u10e1\u10d4 \u10db\u10d8\u10e1\u10d0\u10db\u10d0\u10e0\u10d7\u10d8",
  business_phone: "\u10e8\u10d4\u10d8\u10e7\u10d5\u10d0\u10dc\u10d4 \u10e1\u10ec\u10dd\u10e0\u10d8 \u10e2\u10d4\u10da\u10d4\u10e4\u10dd\u10dc\u10d8\u10e1 \u10dc\u10dd\u10db\u10d4\u10e0\u10d8",
  social_url: "\u10e8\u10d4\u10d8\u10e7\u10d5\u10d0\u10dc\u10d4 \u10e1\u10ec\u10dd\u10e0\u10d8 Facebook \u10d0\u10dc Instagram \u10d1\u10db\u10e3\u10da\u10d8",
  contact_first_name: "\u10e8\u10d4\u10d0\u10d5\u10e1\u10d4 \u10e1\u10d0\u10ee\u10d4\u10da\u10d8",
  contact_last_name: "\u10e8\u10d4\u10d0\u10d5\u10e1\u10d4 \u10d2\u10d5\u10d0\u10e0\u10d8",
  contact_phone: "\u10e8\u10d4\u10d8\u10e7\u10d5\u10d0\u10dc\u10d4 \u10e1\u10ec\u10dd\u10e0\u10d8 \u10e2\u10d4\u10da\u10d4\u10e4\u10dd\u10dc\u10d8\u10e1 \u10dc\u10dd\u10db\u10d4\u10e0\u10d8",
  contact_email: "\u10e8\u10d4\u10d8\u10e7\u10d5\u10d0\u10dc\u10d4 \u10e1\u10ec\u10dd\u10e0\u10d8 \u10d4\u10da\u10e4\u10dd\u10e1\u10e2\u10d0",
  contact_role: "\u10d0\u10d8\u10e0\u10e9\u10d8\u10d4 \u10de\u10dd\u10d6\u10d8\u10ea\u10d8\u10d0",
  identification_number: "\u10e1\u10d0\u10d8\u10d3\u10d4\u10dc\u10e2\u10d8\u10e4\u10d8\u10d9\u10d0\u10ea\u10d8\u10dd \u10dc\u10dd\u10db\u10d4\u10e0\u10d8 \u10e3\u10dc\u10d3\u10d0 \u10d8\u10e7\u10dd\u10e1 9 \u10d0\u10dc 11 \u10ea\u10d8\u10e4\u10e0\u10d8",
  authority: "\u10d3\u10d0\u10d0\u10d3\u10d0\u10e1\u10e2\u10e3\u10e0\u10d4 \u10d2\u10d0\u10dc\u10d0\u10ea\u10ee\u10d0\u10d3\u10d8\u10e1 \u10d2\u10d0\u10d2\u10d6\u10d0\u10d5\u10dc\u10d8\u10e1 \u10e3\u10e4\u10da\u10d4\u10d1\u10d0",
  terms: "\u10d3\u10d0\u10d4\u10d7\u10d0\u10dc\u10ee\u10db\u10d4 \u10de\u10d8\u10e0\u10dd\u10d1\u10d4\u10d1\u10e1",
};

let bizDraft = null;

function bizApps() {
  return window.AqveApplications;
}

function bizStore() {
  return bizApps().store;
}

function emptyBizDraft() {
  return {
    step: 1,
    screen: "form",
    submitting: false,
    submitError: "",
    errors: {},
    business_name: "",
    business_type: "",
    city: bizApps().CITIES[0].id,
    address: "",
    business_phone: "",
    social_url: "",
    contact_first_name: "",
    contact_last_name: "",
    contact_phone: "",
    contact_email: "",
    contact_role: "",
    legal_name: "",
    identification_number: "",
    authority: false,
    terms: false,
  };
}

function loadBizDraft() {
  if (bizDraft) return bizDraft;
  try {
    const saved = JSON.parse(sessionStorage.getItem(BIZ_DRAFT_KEY) || "null");
    bizDraft = saved ? { ...emptyBizDraft(), ...saved, submitting: false, submitError: saved.submitError || "" } : emptyBizDraft();
  } catch {
    bizDraft = emptyBizDraft();
  }
  return bizDraft;
}

function persistBizDraft() {
  if (!bizDraft || bizDraft.screen === "success") {
    sessionStorage.removeItem(BIZ_DRAFT_KEY);
    return;
  }
  const copy = { ...bizDraft, submitting: false };
  sessionStorage.setItem(BIZ_DRAFT_KEY, JSON.stringify(copy));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function captureBizForm() {
  document.querySelectorAll("[data-biz-field]").forEach((el) => {
    const key = el.dataset.bizField;
    bizDraft[key] = el.type === "checkbox" ? el.checked : el.value;
  });
}

function bizFieldErr(name) {
  return bizDraft.errors[name] ? `<div class="biz-err">${esc(bizDraft.errors[name])}</div>` : "";
}

function bizInput(name, label, required, extra = "") {
  const invalid = bizDraft.errors[name] ? " is-invalid" : "";
  return `
    <label class="biz-field">
      <span>${esc(label)}${required ? " <i>*</i>" : ""}</span>
      <input class="field${invalid}" data-biz-field="${name}" value="${esc(bizDraft[name])}" ${extra}>
      ${bizFieldErr(name)}
    </label>`;
}

function bizChoices(list, name) {
  return `<div class="biz-choices">${list.map((item) => `
    <button type="button" class="biz-choice${bizDraft[name] === item.id ? " is-on" : ""}" data-biz-set="${name}" data-biz-value="${item.id}">${esc(item.label)}</button>
  `).join("")}</div>${bizFieldErr(name)}`;
}

function bizProgress() {
  const steps = [
    { n: 1, t: "\u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d8" },
    { n: 2, t: "\u10d9\u10dd\u10dc\u10e2\u10d0\u10e5\u10e2\u10d8" },
    { n: 3, t: "\u10d3\u10d0\u10d3\u10d0\u10e1\u10e2\u10e3\u10e0\u10d4\u10d1\u10d0" },
  ];
  return `<ol class="biz-steps" aria-label="\u10e0\u10d4\u10d2\u10d8\u10e1\u10e2\u10e0\u10d0\u10ea\u10d8\u10d8\u10e1 \u10dc\u10d0\u10d1\u10d8\u10ef\u10d4\u10d1\u10d8">${steps.map((step, i) => `
    <li class="biz-node${bizDraft.step > step.n ? " is-done" : bizDraft.step === step.n ? " is-on" : ""}">
      <i></i><span>${step.t}</span>
    </li>${i < steps.length - 1 ? `<li class="biz-route" aria-hidden="true"></li>` : ""}
  `).join("")}</ol>`;
}

function validateBizStep(step) {
  const { errors } = bizStore().validate(bizDraft);
  const next = {};
  BIZ_STEP_FIELDS[step].forEach((key) => {
    if (errors[key]) next[key] = BIZ_ERR[key];
  });
  bizDraft.errors = next;
  return !Object.keys(next).length;
}

function bizGoNext() {
  captureBizForm();
  if (!validateBizStep(bizDraft.step)) {
    persistBizDraft();
    renderBusinessRegister();
    return;
  }
  bizDraft.step = Math.min(3, bizDraft.step + 1);
  bizDraft.errors = {};
  persistBizDraft();
  renderBusinessRegister();
}

function bizGoBack() {
  captureBizForm();
  bizDraft.step = Math.max(1, bizDraft.step - 1);
  bizDraft.errors = {};
  bizDraft.submitError = "";
  persistBizDraft();
  renderBusinessRegister();
}

async function bizSubmit() {
  captureBizForm();
  if (bizDraft.submitting) return;
  if (!validateBizStep(3)) {
    persistBizDraft();
    renderBusinessRegister();
    return;
  }
  bizDraft.submitting = true;
  bizDraft.submitError = "";
  persistBizDraft();
  renderBusinessRegister();
  try {
    if (sessionStorage.getItem("aqve-force-submit-error") === "1") {
      await new Promise((resolve) => setTimeout(resolve, 400));
      throw Object.assign(new Error("network"), { code: "network" });
    }
    const row = await bizStore().submitApplication(bizDraft);
    if (row.status !== bizApps().STATUSES.PENDING_REVIEW) throw new Error("status");
    bizDraft = { ...emptyBizDraft(), screen: "success" };
    persistBizDraft();
    renderBusinessRegister();
  } catch (err) {
    bizDraft.submitting = false;
    if (err && err.code === "invalid" && err.errors) {
      const next = {};
      Object.keys(err.errors).forEach((key) => { next[key] = BIZ_ERR[key] || BIZ_ERR.terms; });
      bizDraft.errors = next;
    }
    bizDraft.submitError = T.bizFail;
    persistBizDraft();
    renderBusinessRegister();
  }
}

function renderBusinessRegister() {
  loadBizDraft();
  if (bizDraft.screen === "success") {
    view.innerHTML = `
      <div class="page biz-page">
        <div class="biz-wrap">
          <div class="biz-card biz-success">
            <div class="biz-ok" aria-hidden="true"><i></i></div>
            <h1 class="greeting">${T.bizOk}</h1>
            <p class="muted">${T.bizOkSub.replace(/\n/g, "<br>")}</p>
            <button class="primary-btn" data-go="home" type="button">${T.bizHome}</button>
          </div>
        </div>
      </div>`;
    return;
  }

  const catalog = bizApps();
  const titles = {
    1: [T.bizTitle1, T.bizSub1],
    2: [T.bizTitle2, T.bizSub2],
    3: [T.bizTitle3, T.bizSub3],
  };
  const [title, sub] = titles[bizDraft.step];
  const cityLabel = catalog.store.labelOf(catalog.CITIES, bizDraft.city);
  const typeLabel = catalog.store.labelOf(catalog.BUSINESS_TYPES, bizDraft.business_type);

  let body = "";
  if (bizDraft.step === 1) {
    body = `
      ${bizInput("business_name", "\u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d8\u10e1 \u10e1\u10d0\u10ee\u10d4\u10da\u10d8", true, 'autocomplete="organization"')}
      <div class="biz-field">
        <span>\u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d8\u10e1 \u10e2\u10d8\u10de\u10d8 <i>*</i></span>
        ${bizChoices(catalog.BUSINESS_TYPES, "business_type")}
      </div>
      <label class="biz-field">
        <span>\u10e5\u10d0\u10da\u10d0\u10e5\u10d8 <i>*</i></span>
        <select class="field${bizDraft.errors.city ? " is-invalid" : ""}" data-biz-field="city">
          ${catalog.CITIES.map((city) => `<option value="${city.id}"${bizDraft.city === city.id ? " selected" : ""}>${esc(city.label)}</option>`).join("")}
        </select>
        ${bizFieldErr("city")}
      </label>
      ${bizInput("address", "\u10db\u10d8\u10e1\u10d0\u10db\u10d0\u10e0\u10d7\u10d8", true, 'autocomplete="street-address"')}
      ${bizInput("business_phone", "\u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d8\u10e1 \u10e2\u10d4\u10da\u10d4\u10e4\u10dd\u10dc\u10d8", true, 'type="tel" inputmode="tel" autocomplete="tel" placeholder="+995 5XX XX XX XX"')}
      ${bizInput("social_url", "Facebook / Instagram", false, 'placeholder="instagram.com/\u2026"')}`;
  } else if (bizDraft.step === 2) {
    body = `
      ${bizInput("contact_first_name", "\u10e1\u10d0\u10ee\u10d4\u10da\u10d8", true, 'autocomplete="given-name"')}
      ${bizInput("contact_last_name", "\u10d2\u10d5\u10d0\u10e0\u10d8", true, 'autocomplete="family-name"')}
      ${bizInput("contact_phone", "\u10e2\u10d4\u10da\u10d4\u10e4\u10dd\u10dc\u10d8", true, 'type="tel" inputmode="tel" autocomplete="tel" placeholder="+995 5XX XX XX XX"')}
      ${bizInput("contact_email", "\u10d4\u10da\u10e4\u10dd\u10e1\u10e2\u10d0", true, 'type="email" autocomplete="email"')}
      <div class="biz-field">
        <span>\u10de\u10dd\u10d6\u10d8\u10ea\u10d8\u10d0 \u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10e8\u10d8 <i>*</i></span>
        ${bizChoices(catalog.CONTACT_ROLES, "contact_role")}
      </div>`;
  } else {
    body = `
      ${bizInput("legal_name", "\u10d8\u10e3\u10e0\u10d8\u10d3\u10d8\u10e3\u10da\u10d8 \u10d3\u10d0\u10e1\u10d0\u10ee\u10d4\u10da\u10d4\u10d1\u10d0", false, 'autocomplete="organization"')}
      ${bizInput("identification_number", "\u10e1\u10d0\u10d8\u10d3\u10d4\u10dc\u10e2\u10d8\u10e4\u10d8\u10d9\u10d0\u10ea\u10d8\u10dd \u10dc\u10dd\u10db\u10d4\u10e0\u10d8", false, 'inputmode="numeric"')}
      <div class="biz-sum">
        <div><span>\u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d8</span><strong>${esc(bizDraft.business_name)}</strong></div>
        <div><span>\u10e2\u10d8\u10de\u10d8</span><strong>${esc(typeLabel)}</strong></div>
        <div><span>\u10db\u10d8\u10e1\u10d0\u10db\u10d0\u10e0\u10d7\u10d8</span><strong>${esc(cityLabel)}${bizDraft.address ? " \u00b7 " + esc(bizDraft.address) : ""}</strong></div>
        <div><span>\u10e1\u10d0\u10d9\u10dd\u10dc\u10e2\u10d0\u10e5\u10e2\u10dd \u10de\u10d8\u10e0\u10d8</span><strong>${esc((bizDraft.contact_first_name + " " + bizDraft.contact_last_name).trim())}</strong></div>
      </div>
      <label class="biz-check">
        <input type="checkbox" data-biz-field="authority"${bizDraft.authority ? " checked" : ""}>
        <span>\u10d5\u10d0\u10d3\u10d0\u10e1\u10e2\u10e3\u10e0\u10d4\u10d1, \u10e0\u10dd\u10db \u10db\u10d0\u10e5\u10d5\u10e1 \u10d0\u10db \u10d1\u10d8\u10d6\u10dc\u10d4\u10e1\u10d8\u10e1 \u10e1\u10d0\u10ee\u10d4\u10da\u10d8\u10d7 \u10d2\u10d0\u10dc\u10d0\u10ea\u10ee\u10d0\u10d3\u10d8\u10e1 \u10d2\u10d0\u10d2\u10d6\u10d0\u10d5\u10dc\u10d8\u10e1 \u10e3\u10e4\u10da\u10d4\u10d1\u10d0.</span>
      </label>
      ${bizFieldErr("authority")}
      <label class="biz-check">
        <input type="checkbox" data-biz-field="terms"${bizDraft.terms ? " checked" : ""}>
        <span>\u10d5\u10d4\u10d7\u10d0\u10dc\u10ee\u10db\u10d4\u10d1\u10d8 AQVE-\u10d8\u10e1 \u10d1\u10d8\u10d6\u10dc\u10d4\u10e1 \u10de\u10d8\u10e0\u10dd\u10d1\u10d4\u10d1\u10e1 \u10d3\u10d0 \u10de\u10d4\u10e0\u10e1\u10dd\u10dc\u10d0\u10da\u10e3\u10e0\u10d8 \u10db\u10dd\u10dc\u10d0\u10ea\u10d4\u10db\u10d4\u10d1\u10d8\u10e1 \u10d3\u10d0\u10db\u10e3\u10e8\u10d0\u10d5\u10d4\u10d1\u10d0\u10e1.</span>
      </label>
      ${bizFieldErr("terms")}`;
  }

  const actions = bizDraft.step === 1
    ? `<button class="primary-btn" data-biz-next type="button"${bizDraft.submitting ? " disabled" : ""}>${T.bizContinue}</button>`
    : `<div class="biz-actions">
        <button class="ghost-btn" data-biz-back type="button"${bizDraft.submitting ? " disabled" : ""}>${T.back}</button>
        <button class="primary-btn" ${bizDraft.step === 3 ? "data-biz-submit" : "data-biz-next"} type="button"${bizDraft.submitting ? " disabled" : ""}>${bizDraft.submitting ? T.bizSending : bizDraft.step === 3 ? T.bizSend : T.bizContinue}</button>
      </div>`;

  view.innerHTML = `
    <div class="page biz-page">
      <div class="biz-wrap">
        ${bizProgress()}
        <form class="biz-card" id="bizRegisterForm" novalidate>
          <h1 class="greeting">${esc(title)}</h1>
          <p class="muted biz-lead">${esc(sub)}</p>
          ${body}
          ${bizDraft.submitError ? `<div class="biz-banner" role="alert">${esc(bizDraft.submitError)}</div>` : ""}
          ${actions}
        </form>
      </div>
    </div>`;
}

function renderProfile() {
  view.innerHTML = `
    <div class="page">
      <h1 class="greeting">${T.profile}</h1>
      <div class="stack">
        <div class="list-card">
          <strong>${T.guest}</strong>
          <div class="muted">${T.city}</div>
        </div>
        <button class="row-link" data-go="orders" type="button">${T.orders} <span>\u203a</span></button>
        <button class="row-link" data-go="favorites" type="button">${T.favs} <span>\u203a</span></button>
      </div>
      <section class="profile-biz" aria-label="${T.biz}">
        <h2>${T.biz}</h2>
        <a href="#/business/register">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16l-1.3-4.2A1 1 0 0 0 17.7 4H6.3a1 1 0 0 0-1 0.8L4 9z"/><path d="M4 9a2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0"/><path d="M5.2 10.8V19a1 1 0 0 0 1 1h11.6a1 1 0 0 0 1-1v-8.2"/><path d="M10 20v-5.2h4V20"/></svg>
          <span>\u2192 ${T.addBiz}</span>
        </a>
        <a href="${location.port === "5500" ? "http://" + location.hostname + ":5501/business/dashboard" : "/business/dashboard"}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h6V4H4zm10 10h6v-6h-6zM4 20h6v-6H4zm10-10h6V4h-6z"/></svg>
          <span>\u2192 ${T.dash}</span>
        </a>
      </section>
    </div>
  `;
}

function productIngNames(item) {
  return includedIngs(item).map((ing) => String(ing.name || ing || "").trim()).filter(Boolean);
}

function lineExcluded(line, names) {
  const allow = new Set(names);
  return (line.removed || []).filter((name) => allow.has(name));
}

function georgianGenitive(name) {
  const s = String(name || "").trim();
  if (!s) return s;
  if (s.endsWith("\u10d8\u10e1")) return s;
  if (s.endsWith("\u10d8")) return s.slice(0, -1) + "\u10d8\u10e1";
  if (/[\u10d0\u10d4\u10dd\u10e3]$/.test(s)) return s + "\u10e1";
  return s + "\u10d8\u10e1";
}

function withoutPhrase(names) {
  const gs = names.map(georgianGenitive).filter(Boolean);
  if (!gs.length) return "";
  if (gs.length === 1) return gs[0] + " \u10d2\u10d0\u10e0\u10d4\u10e8\u10d4";
  const last = gs[gs.length - 1];
  const prev = gs[gs.length - 2];
  const head = gs.slice(0, -2);
  const pair = prev + "\u10d0 \u10d3\u10d0 " + last + " \u10d2\u10d0\u10e0\u10d4\u10e8\u10d4";
  return head.length ? head.join(", ") + ", " + pair : pair;
}

function cartExtrasHTML(line, item) {
  const extras = extraIngs(item);
  if (!extras.length) return "";
  const rows = extras.map((ing) => {
    const qty = ((line.extras || []).find((row) => row.id === ing.id) || {}).qty || 0;
    const price = extraPriceTetri(ing);
    if (qty) {
      return `<div class="cart-extra">
        <span>+ ${ing.name}</span>
        <div class="qty cart-extra-qty">
          <button class="ghost" type="button" data-cart-extra="${line.id}:${ing.id}:-1">\u2212</button>
          <span>${qty}</span>
          <button type="button" data-cart-extra="${line.id}:${ing.id}:1">+</button>
        </div>
        <strong>+${moneyTetri(price * qty)}</strong>
      </div>`;
    }
    return `<button class="cart-extra-add" type="button" data-cart-extra="${line.id}:${ing.id}:1"><i>+</i><span>${ing.name}</span><em>+${moneyTetri(price)}</em></button>`;
  }).join("");
  return `
    <div class="cart-extras">
      <div class="cart-comp-head"><span>${T.extrasTitle}</span></div>
      ${rows}
    </div>`;
}

function cartIngsHTML(line, item) {
  const names = productIngNames(item);
  const extras = extraIngs(item);
  if (!names.length && !extras.length) return "";
  const excluded = lineExcluded(line, names);
  const editing = state.cartEditId === line.id;
  const shown = editing ? names : names.filter((name) => !excluded.includes(name));
  const chips = shown.map((name) => {
    if (!editing) return `<span class="cart-chip">${name}</span>`;
    const off = excluded.includes(name);
    return `<button class="cart-chip${off ? " is-off" : ""}" type="button" data-cart-ing="${line.id}" data-ing-name="${name.replace(/"/g, "&quot;")}" aria-pressed="${off}"><i aria-hidden="true">${off ? "\u21b6" : "\u2212"}</i><span>${name}</span></button>`;
  }).join("");
  const summary = !editing && excluded.length ? `<p class="cart-without">${T.removedLabel}: ${withoutPhrase(excluded)}</p>` : "";
  const onlyThis = editing && state.cart.filter((x) => x.itemId === line.itemId).length > 1
    ? `<p class="cart-only">${T.thisOne}</p>` : "";
  const comp = names.length ? `
    <div class="cart-comp${editing ? " is-edit" : ""}">
      <div class="cart-comp-head">
        <span>${T.comp}</span>
        <button type="button" data-cart-edit="${line.id}">${editing ? T.ingsReady : T.editIngs}</button>
      </div>
      ${chips ? `<div class="cart-ings">${chips}</div>` : ""}
      ${summary}
      ${onlyThis}
    </div>` : "";
  return comp + cartExtrasHTML(line, item);
}

function renderCart() {
  const rest = cartRestaurant();
  const count = cartCount();
  if (!count) state.cartEditId = null;
  else if (state.cartEditId && !state.cart.some((line) => line.id === state.cartEditId)) state.cartEditId = null;
  if (state.page === "business-register") {
    cartPanel.hidden = true;
    mobileCartBtn.hidden = true;
    app.classList.remove("has-cart", "cart-open", "has-m-cart");
    syncCartDot();
    return;
  }
  if (!count) {
    cartPanel.hidden = true;
    mobileCartBtn.hidden = true;
    app.classList.remove("has-cart", "cart-open", "has-m-cart");
    syncCartDot();
    return;
  }
  const { itemsTetri, feeTetri, totalTetri } = cartTotals();
  const lines = state.cart.map((line) => {
    const item = allItems().find((i) => i.id === line.itemId);
    if (!item) return "";
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <strong>${item.name}</strong>
          <div class="muted">${moneyTetri(itemBaseTetri(item))}${extrasUnitTetri(line, item) ? " \u2192 " + moneyTetri(lineUnitTetri(line, item)) : ""}</div>
          ${cartIngsHTML(line, item)}
          ${extrasUnitTetri(line, item) ? `<div class="cart-line-sum">${T.sum}: ${moneyTetri(lineUnitTetri(line, item) * line.qty)}</div>` : ""}
          <div class="qty" style="margin-top:8px">
            <button class="ghost" data-line-qty="${line.id}:-1" type="button">\u2212</button>
            <span>${line.qty}</span>
            <button data-line-qty="${line.id}:1" type="button">+</button>
          </div>
        </div>
      </div>`;
  }).join("");

  cartPanel.innerHTML = `
    <div class="sheet-head"><h3>${T.cart}</h3><button class="icon-btn cart-close" type="button" aria-label="close">\u2715</button></div>
    <div class="muted" style="margin:-8px 0 14px">${rest ? rest.name : ""}</div>
    ${lines}
    <div class="totals">
      <div><span>${T.products}</span><span>${moneyTetri(itemsTetri)}</span></div>
      <div><span>${T.mitana}</span><span>${feeTetri ? moneyTetri(feeTetri) : T.ufaso}</span></div>
      <div class="sum"><span>${T.sum}</span><span>${moneyTetri(totalTetri)}</span></div>
    </div>
    <button class="primary-btn" id="checkoutBtn" type="button">${T.order}</button>
  `;

  const desktop = window.matchMedia("(min-width: 761px)").matches;
  app.classList.toggle("has-cart", desktop);
  app.classList.toggle("cart-open", !desktop && state.cartOpen);
  if (desktop) {
    cartPanel.hidden = false;
    mobileCartBtn.hidden = true;
    state.cartOpen = false;
    app.classList.remove("has-m-cart");
  } else {
    cartPanel.hidden = !state.cartOpen;
    mobileCartBtn.hidden = state.cartOpen;
    mobileCartBtn.innerHTML = `<span>${count} ${T.itemWord}</span><strong>${moneyTetri(totalTetri)}</strong><em>${T.cart}</em>`;
    app.classList.toggle("has-m-cart", !mobileCartBtn.hidden && isMobileView());
  }
  syncCartDot();
}

function render() {
  const parsed = parseHash();
  if (state.restaurantId !== parsed.restaurantId) {
    state.menuQuery = "";
    state.dishId = null;
    state.dishRemoved = [];
    state.dishExtras = [];
  }
  state.page = parsed.page;
  state.restaurantId = parsed.restaurantId;
  if (state.page !== "restaurant") {
    state.menuCat = null;
    state.dishId = null;
    state.dishRemoved = [];
    state.dishExtras = [];
  }

  app.classList.toggle("is-biz-flow", state.page === "business-register");
  app.classList.toggle("is-search", state.page === "search");
  document.body.classList.toggle("dish-open", Boolean(state.dishId));

  if (state.page === "restaurant") renderRestaurant();
  else if (state.page === "search") renderSearch();
  else if (state.page === "orders") renderOrders();
  else if (state.page === "favorites") renderFavorites();
  else if (state.page === "profile") renderProfile();
  else if (state.page === "business-register") renderBusinessRegister();
  else renderHome();

  renderCart();
  syncTabs();
  bindCardImages();
  syncCompactHeader();
  if (pendingSearchFocus) {
    pendingSearchFocus = false;
    requestAnimationFrame(() => search.focus({ preventScroll: true }));
  }
  overlay.hidden = !state.cartOpen || window.matchMedia("(min-width: 761px)").matches;
  const menuSearch = document.querySelector("[data-menu-search]");
  if (menuSearch && typeof state.menuFocus === "number") {
    menuSearch.focus();
    const pos = Math.min(state.menuFocus, menuSearch.value.length);
    menuSearch.setSelectionRange(pos, pos);
    state.menuFocus = null;
  }
}

function syncTabs() {
  const map = { home: "home", restaurant: "home", search: "search", orders: "orders", favorites: "favorites", profile: "profile" };
  const current = state.page === "business-register" ? "" : (map[state.page] || "home");
  document.querySelectorAll(".tab").forEach((tab) => {
    const on = tab.dataset.go === current;
    tab.classList.toggle("is-active", on);
    tab.setAttribute("aria-current", on ? "page" : "false");
  });
}

function itemFromKey(key) {
  const [restaurantId, itemId, delta] = key.split(":");
  const rest = restaurantById(restaurantId);
  const item = rest ? Object.values(rest.menu).flat().find((i) => i.id === itemId) : allItems().find((i) => i.id === itemId);
  return { restaurantId, item, delta: delta ? Number(delta) : 1 };
}

document.addEventListener("click", (e) => {
  if (e.target.closest(".cart-close")) {
    state.cartOpen = false;
    render();
    return;
  }
  const bizSet = e.target.closest("[data-biz-set]");
  if (bizSet) {
    loadBizDraft();
    captureBizForm();
    bizDraft[bizSet.dataset.bizSet] = bizSet.dataset.bizValue;
    delete bizDraft.errors[bizSet.dataset.bizSet];
    persistBizDraft();
    renderBusinessRegister();
    return;
  }
  if (e.target.closest("[data-biz-next]")) {
    e.preventDefault();
    bizGoNext();
    return;
  }
  if (e.target.closest("[data-biz-back]")) {
    e.preventDefault();
    bizGoBack();
    return;
  }
  if (e.target.closest("[data-biz-submit]")) {
    e.preventDefault();
    bizSubmit();
    return;
  }
  const goBtn = e.target.closest("[data-go]");
  if (goBtn) {
    if (bizDraft && bizDraft.screen === "success") {
      bizDraft = emptyBizDraft();
      persistBizDraft();
    }
    if (goBtn.dataset.go === "search" && isMobileView()) pendingSearchFocus = true;
    go(goBtn.dataset.go);
    return;
  }
  const fav = e.target.closest("[data-fav]");
  if (fav) { toggleFav(fav.dataset.fav, e); return; }
  const open = e.target.closest("[data-open]");
  if (open) { go("restaurant", open.dataset.open); return; }
  const cat = e.target.closest("[data-cat]");
  if (cat) {
    state.category = cat.dataset.cat;
    if (isMobileView() && state.page === "search") go("home");
    else render();
    return;
  }
  const pick = e.target.closest("[data-pick]");
  if (pick) {
    state.pick = state.pick === pick.dataset.pick ? "" : pick.dataset.pick;
    render();
    return;
  }
  if (e.target.closest("[data-eat-open]")) {
    openEat();
    return;
  }
  const menuCat = e.target.closest("[data-menu-cat]");
  if (menuCat) {
    state.menuCat = menuCat.dataset.menuCat;
    state.menuQuery = "";
    state.dishId = null;
    render();
    return;
  }
  const add = e.target.closest("[data-add]");
  if (add) {
    const { restaurantId, item, delta } = itemFromKey(add.dataset.add);
    if (!item) return;
    const extra = add.closest(".dish-sheet")
      ? { removed: (state.dishRemoved || []).slice(), extras: (state.dishExtras || []).slice() }
      : null;
    setQty(restaurantId, item, cartQty(item.id) + delta, add, extra);
    return;
  }
  const lineQtyBtn = e.target.closest("[data-line-qty]");
  if (lineQtyBtn) {
    const [lineId, delta] = lineQtyBtn.dataset.lineQty.split(":");
    adjustLineQty(lineId, Number(delta), lineQtyBtn);
    return;
  }
  const cartExtra = e.target.closest("[data-cart-extra]");
  if (cartExtra) {
    const [lineId, ingId, delta] = cartExtra.dataset.cartExtra.split(":");
    const line = state.cart.find((x) => x.id === lineId);
    if (!line) return;
    line.extras = Array.isArray(line.extras) ? line.extras.slice() : [];
    let row = line.extras.find((x) => x.id === ingId);
    if (!row) {
      row = { id: ingId, qty: 0 };
      line.extras.push(row);
    }
    row.qty = Math.max(0, Math.min(20, row.qty + Number(delta)));
    line.extras = line.extras.filter((x) => x.qty > 0);
    save();
    renderCart();
    return;
  }
  const dishExtra = e.target.closest("[data-dish-extra]");
  if (dishExtra) {
    const [ingId, delta] = dishExtra.dataset.dishExtra.split(":");
    state.dishExtras = (state.dishExtras || []).slice();
    let row = state.dishExtras.find((x) => x.id === ingId);
    if (!row) {
      row = { id: ingId, qty: 0 };
      state.dishExtras.push(row);
    }
    row.qty = Math.max(0, Math.min(20, row.qty + Number(delta)));
    state.dishExtras = state.dishExtras.filter((x) => x.qty > 0);
    render();
    return;
  }
  const cartEdit = e.target.closest("[data-cart-edit]");
  if (cartEdit) {
    startCartIngEdit(cartEdit.dataset.cartEdit);
    return;
  }
  const cartIng = e.target.closest("[data-cart-ing]");
  if (cartIng) {
    if (state.cartEditId !== cartIng.dataset.cartIng) return;
    const line = state.cart.find((x) => x.id === cartIng.dataset.cartIng);
    if (!line) return;
    const name = cartIng.dataset.ingName;
    line.removed = Array.isArray(line.removed) ? line.removed.slice() : [];
    const i = line.removed.indexOf(name);
    if (i >= 0) line.removed.splice(i, 1);
    else line.removed.push(name);
    if (state.dishId === line.itemId) state.dishRemoved = line.removed.slice();
    save();
    const off = line.removed.includes(name);
    cartIng.classList.toggle("is-off", off);
    cartIng.setAttribute("aria-pressed", String(off));
    const mark = cartIng.querySelector("i");
    if (mark) mark.textContent = off ? "\u21b6" : "\u2212";
    return;
  }
  const togIng = e.target.closest("[data-toggle-ing]");
  if (togIng && state.dishId) {
    const name = togIng.dataset.toggleIng;
    const list = (state.dishRemoved || []).slice();
    const i = list.indexOf(name);
    if (i >= 0) list.splice(i, 1);
    else list.push(name);
    state.dishRemoved = list;
    render();
    return;
  }
  if (e.target.closest("[data-clear-menu-q]")) {
    state.menuQuery = "";
    render();
    return;
  }
  if (e.target.closest("[data-close-dish]")) {
    state.dishId = null;
    state.dishRemoved = [];
    state.dishExtras = [];
    render();
    return;
  }
  const dishCard = e.target.closest("[data-dish]");
  if (dishCard) {
    openDish(dishCard.dataset.dish);
    return;
  }
  if (e.target.id === "openPartner") {
    document.getElementById("partnerModal").hidden = false;
    return;
  }
  if (e.target.id === "checkoutBtn") {
    openCheckout();
  }
});

const topbar = document.getElementById("topbar");
const locationBtn = document.getElementById("locationBtn");

search.addEventListener("input", () => {
  state.query = search.value;
  if (state.page === "home" || state.page === "search") render();
});

search.addEventListener("focus", () => {
  topbar.classList.add("search-live");
  if (window.matchMedia("(max-width: 760px)").matches && state.page === "home") go("search");
});
search.addEventListener("blur", () => topbar.classList.remove("search-live"));

locationBtn.addEventListener("pointerenter", () => topbar.classList.add("loc-live"));
locationBtn.addEventListener("pointerleave", () => topbar.classList.remove("loc-live"));
locationBtn.addEventListener("focus", () => topbar.classList.add("loc-live"));
locationBtn.addEventListener("blur", () => topbar.classList.remove("loc-live"));

document.getElementById("locationBtn").onclick = () => {
  document.getElementById("locationSheet").hidden = false;
};
document.getElementById("closeLocation").onclick = () => {
  document.getElementById("locationSheet").hidden = true;
};
document.getElementById("closePartner").onclick = () => {
  document.getElementById("partnerModal").hidden = true;
};
document.getElementById("partnerSubmit").onclick = () => {
  alert(T.req);
  document.getElementById("partnerModal").hidden = true;
};
document.querySelectorAll(".place-row").forEach((row) => {
  row.onclick = () => {
    document.querySelectorAll(".place-row").forEach((r) => r.classList.remove("is-active"));
    row.classList.add("is-active");
    document.getElementById("locationSheet").hidden = true;
    const parts = row.textContent.split("\u00b7").map((s) => s.trim()).filter(Boolean);
    const label = locationBtn.querySelector("strong");
    if (label && parts[1]) label.textContent = parts[1];
    topbar.classList.add("loc-pick", "loc-live");
    window.setTimeout(() => topbar.classList.remove("loc-pick", "loc-live"), 620);
  };
});

mobileCartBtn.onclick = () => { state.cartOpen = true; render(); };
overlay.onclick = () => {
  state.cartOpen = false;
  state.dishId = null;
  state.dishRemoved = [];
  state.dishExtras = [];
  document.getElementById("locationSheet").hidden = true;
  document.getElementById("partnerModal").hidden = true;
  document.getElementById("checkoutSheet").hidden = true;
  document.getElementById("eatLayer").hidden = true;
  render();
};

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || !state.dishId) return;
  state.dishId = null;
  state.dishRemoved = [];
  state.dishExtras = [];
  render();
});

function showEat(idea) {
  eatIdea = idea;
  document.getElementById("eatImg").src = idea.image;
  document.getElementById("eatLabel").textContent = idea.label;
  const meta = document.getElementById("eatMeta");
  if (!meta) return;
  if (idea.type === "item") {
    const item = allItems().find((i) => i.id === idea.id);
    meta.textContent = item ? `${item.restaurant} · ${money(item.price)}` : "";
  } else {
    meta.textContent = "კატეგორია";
  }
}

function spinEat() {
  const spin = document.getElementById("eatSpin");
  spin.classList.add("is-spin");
  let n = 0;
  const tick = setInterval(() => {
    showEat(EAT_IDEAS[n % EAT_IDEAS.length]);
    n += 1;
    if (n > 8) {
      clearInterval(tick);
      showEat(EAT_IDEAS[Math.floor(Math.random() * EAT_IDEAS.length)]);
      spin.classList.remove("is-spin");
    }
  }, 70);
}

function openEat() {
  document.getElementById("eatLayer").hidden = false;
  spinEat();
}

document.getElementById("eatLayer").addEventListener("click", (e) => {
  if (e.target.id === "eatLayer") e.target.hidden = true;
});
document.getElementById("eatAgain").onclick = spinEat;
document.getElementById("eatShow").onclick = () => {
  document.getElementById("eatLayer").hidden = true;
  if (eatIdea.type === "cat") {
    state.category = eatIdea.id;
    state.pick = "";
    if (state.page !== "home") go("home");
    else render();
    return;
  }
  go("restaurant", eatIdea.restaurantId);
};

function cartQuotePayload() {
  return {
    lines: state.cart.map((x) => ({
      itemId: x.itemId,
      qty: x.qty,
      removed: x.removed || [],
      extras: lineExtras(x).map((row) => ({ id: row.id, qty: row.qty })),
    })),
  };
}

async function quoteCart() {
  const payload = cartQuotePayload();
  const urls = ["/api/public/quote"];
  const host = location.hostname;
  const port = String(location.port || "");
  if (host === "localhost" || host === "127.0.0.1") {
    if (port !== "5501") urls.push(location.protocol + "//" + host + ":5501/api/public/quote");
    if (port !== "5500") urls.push(location.protocol + "//" + host + ":5500/api/public/quote");
  }
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (body && (body.ok || body.code)) return body;
    } catch {
      /* try next origin */
    }
  }
  return null;
}

function clientOrderSnapshot() {
  return state.cart.map((x) => {
    const item = allItems().find((i) => i.id === x.itemId);
    const removed = lineExcluded(x, item ? productIngNames(item) : (x.removed || []));
    const extras = item ? lineExtras(x).map((row) => {
      const ing = extraIngs(item).find((e) => e.id === row.id);
      const extra_price_tetri = extraPriceTetri(ing);
      return {
        id: row.id,
        name: ing ? ing.name : row.id,
        qty: row.qty,
        extra_price_tetri,
        extra_total_tetri: extra_price_tetri * row.qty,
      };
    }) : [];
    const extras_unit_tetri = extras.reduce((n, row) => n + row.extra_total_tetri, 0);
    const unit_base_tetri = itemBaseTetri(item);
    return {
      itemId: x.itemId,
      name: item ? item.name : x.itemId,
      qty: x.qty,
      removed,
      extras,
      unit_base_tetri,
      extras_unit_tetri,
      unit_tetri: unit_base_tetri + extras_unit_tetri,
      line_total_tetri: (unit_base_tetri + extras_unit_tetri) * x.qty,
      change: removed.length ? withoutPhrase(removed) : "",
      kitchen: {
        remove: removed,
        extra: extras.map((row) => ({ name: row.name, qty: row.qty })),
      },
    };
  });
}

async function openCheckout() {
  if (state.cartEditId) {
    state.cartEditId = null;
    mergeMatchingCartLines();
    save();
    renderCart();
  }
  const rest = cartRestaurant();
  if (!rest || rest.live === "closed") return;
  const blocked = state.cart.some((line) => {
    const item = allItems().find((i) => i.id === line.itemId);
    return item && item.available === false;
  });
  if (blocked) return;
  const preview = cartTotals();
  let quote = null;
  if (rest.source === "live") {
    quote = await quoteCart();
    if (!quote || !quote.ok) {
      alert((quote && quote.error) || T.quoteFail);
      return;
    }
  }
  const itemsTetri = quote ? quote.items_tetri : preview.itemsTetri;
  const feeTetri = preview.feeTetri;
  const totalTetri = itemsTetri + feeTetri;
  document.getElementById("checkoutBody").innerHTML = `
    <h3>${T.confirm}</h3>
    <p class="muted">${rest.name} \u00b7 ${T.city}</p>
    <div class="totals">
      <div><span>${T.products}</span><span>${moneyTetri(itemsTetri)}</span></div>
      <div><span>${T.mitana}</span><span>${feeTetri ? moneyTetri(feeTetri) : T.ufaso}</span></div>
      <div class="sum"><span>${T.pay}</span><span>${moneyTetri(totalTetri)}</span></div>
    </div>
    <button class="primary-btn" id="placeOrder" type="button">${T.place}</button>
    <button class="ghost-btn" id="closeCheckout" type="button">${T.cancel}</button>
  `;
  document.getElementById("checkoutSheet").hidden = false;
  document.getElementById("placeOrder").onclick = () => {
    const lines = (quote && quote.lines ? quote.lines : clientOrderSnapshot()).map((line) => ({
      ...line,
      change: line.removed && line.removed.length ? withoutPhrase(line.removed) : "",
    }));
    state.orders.unshift({
      restaurant: rest.name,
      restaurantId: rest.id,
      itemIds: state.cart.map((x) => x.itemId),
      items: cartCount() + " " + T.dish,
      lines,
      total: totalTetri / 100,
      total_tetri: totalTetri,
      items_tetri: itemsTetri,
      quoted: Boolean(quote && quote.ok),
      status: T.preparing,
      when: T.now + " \u00b7 " + T.city,
    });
    state.cart = [];
    state.cartOpen = false;
    save();
    document.getElementById("checkoutSheet").hidden = true;
    go("orders");
  };
  document.getElementById("closeCheckout").onclick = () => {
    document.getElementById("checkoutSheet").hidden = true;
  };
}

document.addEventListener("input", (e) => {
  const menuSearch = e.target.closest("[data-menu-search]");
  if (menuSearch) {
    state.menuQuery = menuSearch.value;
    state.menuFocus = menuSearch.selectionStart;
    render();
    return;
  }
  const field = e.target.closest("[data-biz-field]");
  if (!field || !bizDraft) return;
  bizDraft[field.dataset.bizField] = field.type === "checkbox" ? field.checked : field.value;
  if (bizDraft.errors[field.dataset.bizField]) {
    delete bizDraft.errors[field.dataset.bizField];
    field.classList.remove("is-invalid");
    field.closest(".biz-field")?.querySelector(".biz-err")?.remove();
    field.closest(".biz-check")?.nextElementSibling?.classList.contains("biz-err") && field.closest(".biz-check").nextElementSibling.remove();
  }
  persistBizDraft();
});

document.addEventListener("change", (e) => {
  const field = e.target.closest("[data-biz-field]");
  if (!field || !bizDraft) return;
  bizDraft[field.dataset.bizField] = field.type === "checkbox" ? field.checked : field.value;
  persistBizDraft();
});

document.addEventListener("focusout", (e) => {
  const field = e.target.closest("[data-biz-field]");
  if (!field || !bizDraft) return;
  if (field.dataset.bizField === "business_phone" || field.dataset.bizField === "contact_phone") {
    field.value = bizStore().formatGePhone(field.value);
    bizDraft[field.dataset.bizField] = field.value;
    persistBizDraft();
  }
});

document.addEventListener("submit", (e) => {
  if (e.target.id !== "bizRegisterForm") return;
  e.preventDefault();
  if (!bizDraft || bizDraft.submitting) return;
  if (bizDraft.step < 3) bizGoNext();
  else bizSubmit();
});

function syncCompactHeader() {
  const compact = isMobileView() && state.page === "home" && window.scrollY > 28;
  topbar?.classList.toggle("is-compact", compact);
}

window.addEventListener("hashchange", render);
window.addEventListener("resize", () => {
  renderCart();
  applyRestaurantCovers();
});
window.addEventListener("scroll", syncCompactHeader, { passive: true });
loadLiveCatalog().then(render);

async function loadLiveCatalog() {
  const urls = ["/api/public/catalog"];
  const host = location.hostname;
  const port = String(location.port || "");
  if (host === "localhost" || host === "127.0.0.1") {
    if (port !== "5501") urls.push(location.protocol + "//" + host + ":5501/api/public/catalog");
    if (port !== "5500") urls.push(location.protocol + "//" + host + ":5500/api/public/catalog");
  }
  for (const url of urls) {
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) continue;
      const rows = await res.json();
      if (Array.isArray(rows)) {
        LIVE_CATALOG = rows;
        return;
      }
    } catch {
      /* try next origin */
    }
  }
}
