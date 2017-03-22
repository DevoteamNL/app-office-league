exports.randomName = function () {
    var rnd = Math.floor(Math.random() * animals.length);
    var animal = animals[rnd];
    rnd = Math.floor(Math.random() * adjectives.length);
    var adj = adjectives[rnd];
    return capitalize(adj) + ' ' + capitalize(pluralize(animal));
};

var capitalize = function (str) {
    return str[0].toUpperCase() + str.substring(1);
};

var pluralize = function (str) {
    if (str.endsWith('sh')) {
        return str + 'es';
    }
    if (str.endsWith('ey')) {
        return str + 's';
    }
    if (str.endsWith('us')) {
        return str + 'es';
    }
    if (str.endsWith('x')) {
        return str + 'es';
    }
    if (str.endsWith('us')) {
        return str + 'es';
    }
    if (str.endsWith('to')) {
        return str + 'es';
    }
    if (str.endsWith('ch')) {
        return str + 'es';
    }
    return str + 's';
};

var animals = [
    "aardvark",
    "addax",
    "albatross",
    "alligator",
    "alpaca",
    "anaconda",
    "angelfish",
    "anteater",
    "antelope",
    "ant",
    "ape",
    "armadillo",
    "baboon",
    "badger",
    "barracuda",
    "bat",
    "batfish",
    "bear",
    "beaver",
    "bee",
    "beetle",
    "bird",
    "bison",
    "boar",
    "booby",
    "buffalo",
    "bug",
    "butterfly",
    "buzzard",
    "caiman",
    "camel",
    "capuchin",
    "capybara",
    "caracal",
    "cardinal",
    "caribou",
    "cassowary",
    "cat",
    "caterpillar",
    "centipede",
    "cheetah",
    "chicken",
    "chimpanzee",
    "chinchilla",
    "chipmunk",
    "cicada",
    "civet",
    "cobra",
    "cockroach",
    "cod",
    "constrictor",
    "copperhead",
    "cormorant",
    "corncrake",
    "cottonmouth",
    "cowfish",
    "cow",
    "coyote",
    "crab",
    "crane",
    "crayfish",
    "crocodile",
    "crossbill",
    "curlew",
    "deer",
    "dingo",
    "dog",
    "dogfish",
    "dolphin",
    "donkey",
    "dormouse",
    "dotterel",
    "dove",
    "dragonfly",
    "duck",
    "dugong",
    "dunlin",
    "eagle",
    "earthworm",
    "echidna",
    "eel",
    "eland",
    "elephant",
    "elk",
    "emu",
    "falcon",
    "ferret",
    "finch",
    "fish",
    "flamingo",
    "flatworm",
    "fly",
    "fowl",
    "fox",
    "frog",
    "gannet",
    "gaur",
    "gazelle",
    "gecko",
    "gemsbok",
    "gentoo",
    "gerbil",
    "gerenuk",
    "gharial",
    "gibbon",
    "giraffe",
    "gnat",
    "gnu",
    "goat",
    "goldfinch",
    "goosander",
    "goose",
    "gorilla",
    "goshawk",
    "grasshopper",
    "grebe",
    "grivet",
    "grouse",
    "guanaco",
    "gull",
    "hamerkop",
    "hamster",
    "hare",
    "hawk",
    "hedgehog",
    "heron",
    "herring",
    "hippopotamus",
    "hoopoe",
    "hornet",
    "horse",
    "hummingbird",
    "hyena",
    "iguana",
    "impala",
    "jackal",
    "jaguar",
    "jellyfish",
    "kangaroo",
    "katipo",
    "kea",
    "kestrel",
    "kingfisher",
    "kinkajou",
    "kitten",
    "koala",
    "kookaburra",
    "kouprey",
    "kudu",
    "ladybird",
    "lapwing",
    "lark",
    "lemur",
    "leopard",
    "lion",
    "lizard",
    "llama",
    "lobster",
    "locust",
    "loris",
    "louse",
    "lynx",
    "lyrebird",
    "macaque",
    "macaw",
    "magpie",
    "mallard",
    "mamba",
    "manatee",
    "mandrill",
    "mantis",
    "manx",
    "markhor",
    "marten",
    "meerkat",
    "millipede",
    "mink",
    "mockingbird",
    "mole",
    "mongoose",
    "monkey",
    "moose",
    "mosquito",
    "moth",
    "mouse",
    "narwhal",
    "newt",
    "nightingale",
    "ocelot",
    "octopus",
    "okapi",
    "opossum",
    "orangutan",
    "oryx",
    "osprey",
    "ostrich",
    "otter",
    "owl",
    "ox",
    "oyster",
    "oystercatcher",
    "panda",
    "panther",
    "parrot",
    "partridge",
    "peacock",
    "peafowl",
    "peccary",
    "pelican",
    "penguin",
    "petrel",
    "pheasant",
    "pig",
    "pigeon",
    "pintail",
    "piranha",
    "platypus",
    "plover",
    "polecat",
    "pollan",
    "pony",
    "porcupine",
    "porpoise",
    "puffin",
    "puma",
    "pygmy",
    "quagga",
    "quail",
    "quelea",
    "quetzal",
    "quoll",
    "rabbit",
    "raccoon",
    "rat",
    "ratel",
    "rattlesnake",
    "raven",
    "ray",
    "reindeer",
    "rhinoceros",
    "rook",
    "sable",
    "salamander",
    "salmon",
    "sandpiper",
    "sardine",
    "scarab",
    "seahorse",
    "seal",
    "serval",
    "shark",
    "sheep",
    "shrew",
    "shrike",
    "skimmer",
    "skipper",
    "skunk",
    "skylark",
    "sloth",
    "snail",
    "snake",
    "spider",
    "squirrel",
    "stag",
    "starling",
    "stoat",
    "stork",
    "swan",
    "swiftlet",
    "tamarin",
    "tapir",
    "tarantula",
    "tarsier",
    "teira",
    "termite",
    "tern",
    "thrush",
    "tiger",
    "toad",
    "tortoise",
    "toucan",
    "trout",
    "tuatara",
    "turkey",
    "turtle",
    "unicorn",
    "vendace",
    "vicuña",
    "vole",
    "vulture",
    "wallaby",
    "walrus",
    "warbler",
    "wasp",
    "weasel",
    "weevil",
    "whale",
    "wildebeest",
    "willet",
    "wolf",
    "wolverine",
    "wombat",
    "worm",
    "wren",
    "wryneck",
    "xenomorph",
    "yacare",
    "yak",
    "zebra"
];

var adjectives = [
    "adorable",
    "adventurous",
    "aggressive",
    "agreeable",
    "alert",
    "alive",
    "amused",
    "angry",
    "annoyed",
    "annoying",
    "anxious",
    "arrogant",
    "ashamed",
    "attractive",
    "average",
    "awful",
    "bad",
    "beautiful",
    "better",
    "bewildered",
    "black",
    "bloody",
    "blue",
    "blue-eyed",
    "blushing",
    "bored",
    "brainy",
    "brave",
    "breakable",
    "bright",
    "busy",
    "calm",
    "careful",
    "cautious",
    "charming",
    "cheerful",
    "clean",
    "clear",
    "clever",
    "cloudy",
    "clumsy",
    "colorful",
    "combative",
    "comfortable",
    "concerned",
    "condemned",
    "confused",
    "cooperative",
    "courageous",
    "crazy",
    "creepy",
    "crowded",
    "cruel",
    "curious",
    "cute",
    "dangerous",
    "dark",
    "dead",
    "defeated",
    "defiant",
    "delightful",
    "depressed",
    "determined",
    "different",
    "difficult",
    "disgusted",
    "distinct",
    "disturbed",
    "dizzy",
    "doubtful",
    "drab",
    "dull",
    "eager",
    "easy",
    "elated",
    "elegant",
    "embarrassed",
    "enchanting",
    "encouraging",
    "energetic",
    "enthusiastic",
    "envious",
    "evil",
    "excited",
    "expensive",
    "exuberant",
    "fair",
    "faithful",
    "famous",
    "fancy",
    "fantastic",
    "fierce",
    "filthy",
    "fine",
    "foolish",
    "fragile",
    "frail",
    "frantic",
    "friendly",
    "frightened",
    "funny",
    "gentle",
    "gifted",
    "glamorous",
    "gleaming",
    "glorious",
    "good",
    "gorgeous",
    "graceful",
    "grieving",
    "grotesque",
    "grumpy",
    "handsome",
    "happy",
    "healthy",
    "helpful",
    "helpless",
    "hilarious",
    "homeless",
    "homely",
    "horrible",
    "hungry",
    "hurt",
    "ill",
    "important",
    "impossible",
    "inexpensive",
    "innocent",
    "inquisitive",
    "itchy",
    "jealous",
    "jittery",
    "jolly",
    "joyous",
    "kind",
    "lazy",
    "light",
    "lively",
    "lonely",
    "long",
    "lovely",
    "lucky",
    "magnificent",
    "misty",
    "modern",
    "motionless",
    "muddy",
    "mushy",
    "mysterious",
    "nasty",
    "naughty",
    "nervous",
    "nice",
    "nutty",
    "obedient",
    "obnoxious",
    "odd",
    "old-fashioned",
    "open",
    "outrageous",
    "outstanding",
    "panicky",
    "perfect",
    "plain",
    "pleasant",
    "poised",
    "poor",
    "powerful",
    "precious",
    "prickly",
    "proud",
    "puzzled",
    "quaint",
    "real",
    "relieved",
    "repulsive",
    "rich",
    "scary",
    "selfish",
    "shiny",
    "shy",
    "silly",
    "sleepy",
    "smiling",
    "smoggy",
    "sore",
    "sparkling",
    "splendid",
    "spotless",
    "stormy",
    "strange",
    "stupid",
    "successful",
    "super",
    "talented",
    "tame",
    "tender",
    "tense",
    "terrible",
    "testy",
    "thankful",
    "thoughtful",
    "thoughtless",
    "tired",
    "tough",
    "troubled",
    "ugliest",
    "ugly",
    "uninterested",
    "unsightly",
    "unusual",
    "upset",
    "uptight",
    "vast",
    "victorious",
    "vivacious",
    "wandering",
    "weary",
    "wicked",
    "wide-eyed",
    "wild",
    "witty",
    "worrisome",
    "worried",
    "wrong",
    "xenophobic",
    "xanthous",
    "xerothermic",
    "yawning",
    "yellowed",
    "yucky",
    "zany",
    "zealous"
];