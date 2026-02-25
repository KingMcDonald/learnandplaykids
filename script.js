// ==================== GAME ENGINE ====================

class KindergartenGame {
  constructor() {
    // Game State
    this.userName = ""; // User's name for personalization
    this.currentActivity = null;
    this.currentQuestion = 0;
    this.score = 0;
    this.plantStage = 0; // Unlimited stages
    this.plantStageAtFinish = false; // Track if plant grew during activity
    this.sessionData = []; // For research tracking
    this.scoreClickCount = 0; // Track clicks on score for stats access
    this.usernameClickCount = 0; // Track clicks on username for logout

    // Plant stages - unlimited growth with 20 stages
    this.plantStages = [
      "🌱",
      "🌿",
      "🌼",
      "🌳",
      "🎋",
      "🌲",
      "🌴",
      "🌵",
      "🌾",
      "🌻",
      "🌺",
      "🌷",
      "🌹",
      "🏵️",
      "💐",
      "🌸",
      "🌞",
      "🌛",
      "⭐",
      "🌟",
    ];
    this.plantNames = [
      "Baby Seed",
      "Sprout",
      "Flower",
      "Tree",
      "Magic Tree",
      "Pine Tree",
      "Palm Tree",
      "Cactus",
      "Wheat",
      "Sunflower",
      "Hibiscus",
      "Tulip",
      "Rose",
      "Poppy",
      "Bouquet",
      "Cherry Blossom",
      "Sun Guardian",
      "Moon Keeper",
      "Star Seed",
      "Super Star",
    ];
    // Score needed per stage (increases progressively)
    this.scorePerStage = [
      50, 150, 250, 300, 400, 500, 550, 650, 750, 850, 950, 1000, 1050, 1250,
      1350, 1400, 1450, 1550, 1650, 1750,
    ];

    // Activity Modules Data
    this.activities = {
      alphabet: {
        name: "Tap & Talk Alphabet",
        questions: this.generateAlphabetQuestions(),
      },
      phonics: {
        name: "Sound Out Letters",
        questions: this.generatePhonicsQuestions(),
      },
      match: {
        name: "Magic Match & Pop",
        questions: this.generateMatchQuestions(),
      },
      listen: {
        name: "Listen & Find",
        questions: this.generateListenQuestions(),
      },
      numbers: {
        name: "Count & Learn",
        questions: this.generateNumberQuestions(),
      },
      colors: {
        name: "Color Hunt",
        questions: this.generateColorQuestions(),
      },
      shapes: {
        name: "Shape Quest",
        questions: this.generateShapeQuestions(),
      },
      vocab: {
        name: "Picture Words",
        questions: this.generateVocabQuestions(),
      },
      memory: {
        name: "Memory Match",
        questions: this.generateMemoryQuestions(),
      },
      sightwords: {
        name: "Sight Words",
        questions: this.generateSightWordsQuestions(),
      },
      rhyme: {
        name: "Rhyme Time",
        questions: this.generateRhymeQuestions(),
      },
      math: {
        name: "Math Time",
        questions: this.generateMathQuestions(),
      },
      pattern: {
        name: "Pattern Quest",
        questions: this.generatePatternQuestions(),
      },
      category: {
        name: "Sort & Learn",
        questions: this.generateCategoryQuestions(),
      },
      animals: {
        name: "Animal Sounds",
        questions: this.generateAnimalSoundsQuestions(),
      },
    };

    // Game Features
    this.soundEnabled = localStorage.getItem("soundEnabled") !== "false";
    this.achievements = this.loadAchievements();
    this.dailyChallenge = this.initializeDailyChallenge();
    this.streak = 0;
    this.theme = "default";
    this.stats = this.loadStats();

    // Double-tap confirmation system
    this.pendingSelection = null;

    // BGM System
    this.bgmEnabled = localStorage.getItem("bgmEnabled") !== "false";
    // BGM volume is capped at 0.2, so default is 0.1 (mid-range in the 0-0.2 scale)
    let savedBGMVolume = parseFloat(localStorage.getItem("bgmVolume")) || 0.1;
    this.bgmVolume = Math.min(0.2, savedBGMVolume); // Ensure cap is respected
    this.bgmAudio = null;

    // Sound library (base64 encoded simple tones)
    this.sounds = {
      correct:
        "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
      incorrect:
        "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
      reward:
        "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
    };

    this.init();
  }

  init() {
    // Initialize BGM first (for all users)
    this.initializeBGM();
    
    // Check if username already exists (returning user)
    const savedUsername = localStorage.getItem("kg_username");
    if (savedUsername) {
      // Auto-login with saved username
      this.userName = savedUsername;
      this.loadSavedProgress();
      this.updateStreak();
      this.updateGardenDisplay();
      // Show notification and wait for user to click play
      this.showBGMNotification();
      // Don't auto-proceed to garden - let user click play button
    } else {
      // New user - show start screen
      this.startLoadingScreen();
    }

    this.soundEnabled = localStorage.getItem("soundEnabled") !== "false";
    this.streak = parseInt(localStorage.getItem("streak")) || 0;



    // Setup modal close button
    const closeModalBtn = document.getElementById("closeModal");
    if (closeModalBtn) {
      closeModalBtn.onclick = () => this.closeCountModal();
    }

    // Setup score button for stats access (5 clicks)
    const appTitle = document.getElementById("appTitle");
    if (appTitle) {
      appTitle.addEventListener("click", () => this.handleScoreClick());
    }
  }

  handleScoreClick() {
    this.scoreClickCount++;
    if (this.scoreClickCount >= 5) {
      this.scoreClickCount = 0;
      this.showStatsPage();
    }
  }




  closeCountModal() {
    const modal = document.getElementById("countModal");
    modal.classList.remove("show");
  }

  // ==================== LOADING SCREEN ====================

  startLoadingScreen() {
    // Show loading screen for 2 seconds then show notification
    // With 5 second timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn("⚠️ Loading timeout - proceeding anyway");
      this.showBGMNotification();
    }, 5000);
    
    setTimeout(() => {
      this.showBGMNotification();
      clearTimeout(timeoutId);
      // Notification will handle showing start screen after play is clicked
    }, 2000);
  }

  showBGMNotification() {
    // Check if notification already exists to prevent duplicates
    if (document.querySelector(".bgm-notification")) {
      return;
    }
    
    // Show notification that BGM is available - always show even after login
    const notification = document.createElement("div");
    notification.className = "bgm-notification";
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🎵</div>
        <div class="notification-text">
          <p class="notification-title">♪ Background Music Enabled</p>
          <p class="notification-subtitle">Enjoy the background music! Adjust volume in Sound Settings.</p>
        </div>
        <div class="notification-actions">
          <button class="notification-btn play-btn" onclick="game.playBGM(); setTimeout(() => { game.proceedFromNotification(); }, 500);">▶ Play Now</button>
          <button class="notification-btn skip-btn" onclick="game.proceedFromNotification()">➜ Skip</button>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    
    // Prevent auto-removal - user must click play or skip
  }

  proceedFromNotification() {
    const notification = document.querySelector(".bgm-notification");
    if (notification) {
      notification.style.animation = "slideOutDown 0.4s ease forwards";
      setTimeout(() => notification.remove(), 400);
    }
    
    // Proceed based on user state
    const savedUsername = localStorage.getItem("kg_username");
    if (savedUsername) {
      this.showScreen("gardenScreen");
    } else {
      this.showScreen("startScreen");
    }
  }

  // ==================== QUESTION GENERATORS ====================

  generateAlphabetQuestions() {
    // ✨ DYNAMIC DIFFICULTY PROGRESSION with SMART MIXING
    // Stage 0-2: Letters A-M (13 letters) | Stage 3-5: Add N-T (19 letters) | Stage 6+: Full alphabet (26)
    let maxLetters = 13; // Basic level
    if (this.plantStage >= 3) maxLetters = 19; // Intermediate
    if (this.plantStage >= 6) maxLetters = 26; // Advanced

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const availableLetters = alphabet.slice(0, maxLetters);

    // 🎲 RANDOMIZED QUESTIONS WITH SMART DISTRACTORS
    const questions = [];
    const questionTypes = [
      "Find the letter",
      "Tap on",
      "Which one is",
      "Spot the letter",
      "Click on",
      "Show me",
    ];

    // Use Set to avoid duplicate letters in one question batch
    const usedLetters = new Set();

    for (let i = 0; i < 5; i++) {
      let letter;
      // Avoid repeated letters in same batch
      do {
        letter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
      } while (usedLetters.has(letter) && usedLetters.size < availableLetters.length);
      usedLetters.add(letter);

      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

      // Get diverse wrong answers - prefer visually/phonetically similar letters
      const similarLetters = {
        'A': ['H', 'V'],
        'B': ['D', 'P'],
        'C': ['G', 'O'],
        'D': ['B', 'O'],
        'E': ['F'],
        'G': ['C', 'O'],
        'L': ['I', 'T'],
        'O': ['C', 'D', 'G'],
        'P': ['B', 'R'],
        'R': ['P'],
        'V': ['A', 'U'],
        'I': ['L', 'T'],
      };

      let wrongLetters = availableLetters.filter((l) => l !== letter);
      
      // Prefer similar letters as distractors for better learning
      const preferredWrong = (similarLetters[letter] || [])
        .filter(l => wrongLetters.includes(l));
      
      const remainingWrong = wrongLetters.filter(
        l => !preferredWrong.includes(l)
      );

      let options = [
        letter,
        ...preferredWrong.slice(0, 2),
        ...this.shuffleArray(remainingWrong).slice(0, Math.max(0, 3 - preferredWrong.length))
      ];

      options = this.shuffleArray(options.slice(0, 4));

      questions.push({
        type: "letter-recognition",
        question: `${questionType} ${letter}`,
        target: letter,
        options: options,
        sound: `Find the letter ${letter}`,
        icon: letter,
      });
    }

    return questions;
  }

  generatePhonicsQuestions() {
    // ✨ COMPREHENSIVE PHONICS LIBRARY WITH PROGRESSION
    const allPhonics = [
      // Stage 0-2: Basic letters
      { letter: "A", sound: "/æ/", word: "Apple", icon: "🍎", difficulty: 1 },
      { letter: "B", sound: "/b/", word: "Ball", icon: "⚽", difficulty: 1 },
      { letter: "C", sound: "/k/", word: "Cat", icon: "🐱", difficulty: 1 },
      { letter: "D", sound: "/d/", word: "Dog", icon: "🐶", difficulty: 1 },
      { letter: "E", sound: "/e/", word: "Egg", icon: "🥚", difficulty: 1 },
      { letter: "F", sound: "/f/", word: "Fish", icon: "🐠", difficulty: 1 },
      { letter: "G", sound: "/g/", word: "Grapes", icon: "🍇", difficulty: 1 },
      { letter: "H", sound: "/h/", word: "Hat", icon: "🎩", difficulty: 1 },
      {
        letter: "I",
        sound: "/ɪ/",
        word: "Ice cream",
        icon: "🍦",
        difficulty: 1,
      },
      {
        letter: "J",
        sound: "/dʒ/",
        word: "Jellyfish",
        icon: "🪼",
        difficulty: 1,
      },
      // Stage 3+: Intermediate letters
      { letter: "K", sound: "/k/", word: "Kite", icon: "🪁", difficulty: 2 },
      { letter: "L", sound: "/l/", word: "Lion", icon: "🦁", difficulty: 2 },
      { letter: "M", sound: "/m/", word: "Monkey", icon: "🐵", difficulty: 2 },
      { letter: "N", sound: "/n/", word: "Nest", icon: "🪺", difficulty: 2 },
      { letter: "O", sound: "/ɑ/", word: "Orange", icon: "🍊", difficulty: 2 },
      { letter: "P", sound: "/p/", word: "Penguin", icon: "🐧", difficulty: 2 },
      { letter: "Q", sound: "/kw/", word: "Queen", icon: "👑", difficulty: 2 },
      // Stage 6+: Advanced letters
      { letter: "R", sound: "/r/", word: "Rainbow", icon: "🌈", difficulty: 3 },
      { letter: "S", sound: "/s/", word: "Sun", icon: "☀️", difficulty: 3 },
      { letter: "T", sound: "/t/", word: "Tiger", icon: "🐯", difficulty: 3 },
      {
        letter: "U",
        sound: "/ʌ/",
        word: "Umbrella",
        icon: "☂️",
        difficulty: 3,
      },
      { letter: "V", sound: "/v/", word: "Violin", icon: "🎻", difficulty: 3 },
      { letter: "W", sound: "/w/", word: "Whale", icon: "🐋", difficulty: 3 },
      {
        letter: "X",
        sound: "/ks/",
        word: "Xylophone",
        icon: "🎵",
        difficulty: 3,
      },
      { letter: "Y", sound: "/j/", word: "Yo-yo", icon: "🪀", difficulty: 3 },
      { letter: "Z", sound: "/z/", word: "Zebra", icon: "🦓", difficulty: 3 },
    ];

    // 🎲 FILTER BY DIFFICULTY LEVEL
    let availablePhonics = allPhonics;
    if (this.plantStage < 3) {
      availablePhonics = allPhonics.filter((p) => p.difficulty === 1);
    } else if (this.plantStage < 6) {
      availablePhonics = allPhonics.filter((p) => p.difficulty <= 2);
    } // else all available

    // 🎲 RANDOMIZED QUESTION GENERATION - Create fresh questions each time
    const questions = [];
    const questionStarters = [
      "Tap the letter that makes the",
      "Which letter says",
      "Find the sound for",
      "Tap the letter with sound",
    ];

    for (let i = 0; i < 5; i++) {
      const phonicSet =
        availablePhonics[Math.floor(Math.random() * availablePhonics.length)];
      const questionStarter =
        questionStarters[Math.floor(Math.random() * questionStarters.length)];

      // Get wrong answer options from available letters
      let wrongLetters = availablePhonics.filter(
        (p) => p.letter !== phonicSet.letter,
      );
      let options = [
        phonicSet.letter,
        ...this.shuffleArray(wrongLetters.map((p) => p.letter)).slice(0, 3),
      ];

      questions.push({
        type: "phonics",
        question: `${questionStarter} sound for ${phonicSet.word}`,
        target: phonicSet.letter,
        options: this.shuffleArray(options),
        sound: `${phonicSet.letter} says ${phonicSet.sound} like in ${phonicSet.word}`,
        icon: phonicSet.icon,
      });
    }

    return questions;
  }

  generateMatchQuestions() {
    // ✨ EXTENSIVE MATCH LIBRARY WITH CATEGORIES AND PROGRESSION
    const allItems = {
      // FRUITS - Easy (Stage 0+)
      fruits: [
        { item: "🍎", label: "Apple", difficulty: 1 },
        { item: "🍌", label: "Banana", difficulty: 1 },
        { item: "🍊", label: "Orange", difficulty: 1 },
        { item: "🍓", label: "Strawberry", difficulty: 1 },
        { item: "🍇", label: "Grapes", difficulty: 1 },
        { item: "🍑", label: "Peach", difficulty: 1 },
        { item: "🍋", label: "Lemon", difficulty: 1 },
        { item: "🥝", label: "Kiwi", difficulty: 1 },
      ],
      // ANIMALS - Easy (Stage 0+)
      animals: [
        { item: "🐕", label: "Dog", difficulty: 1 },
        { item: "🐱", label: "Cat", difficulty: 1 },
        { item: "🐰", label: "Rabbit", difficulty: 1 },
        { item: "🐿️", label: "Squirrel", difficulty: 1 },
        { item: "🦋", label: "Butterfly", difficulty: 1 },
        { item: "🐢", label: "Turtle", difficulty: 1 },
        { item: "🐬", label: "Dolphin", difficulty: 1 },
        { item: "🦁", label: "Lion", difficulty: 1 },
      ],
      // COLORS - Easy (Stage 0+)
      colors: [
        { item: "🔴", label: "Red", difficulty: 1 },
        { item: "🟠", label: "Orange", difficulty: 1 },
        { item: "🟡", label: "Yellow", difficulty: 1 },
        { item: "🟢", label: "Green", difficulty: 1 },
        { item: "🔵", label: "Blue", difficulty: 1 },
        { item: "🟣", label: "Purple", difficulty: 1 },
        { item: "🟤", label: "Brown", difficulty: 1 },
        { item: "⚫", label: "Black", difficulty: 1 },
      ],
      // VEHICLES - Medium (Stage 3+)
      vehicles: [
        { item: "🚗", label: "Car", difficulty: 2 },
        { item: "🚂", label: "Train", difficulty: 2 },
        { item: "✈️", label: "Airplane", difficulty: 2 },
        { item: "🚢", label: "Boat", difficulty: 2 },
        { item: "🚁", label: "Helicopter", difficulty: 2 },
        { item: "🚀", label: "Rocket", difficulty: 2 },
        { item: "🏎️", label: "Race Car", difficulty: 2 },
        { item: "🚴", label: "Bicycle", difficulty: 2 },
      ],
      // FOOD - Medium (Stage 3+)
      food: [
        { item: "🍕", label: "Pizza", difficulty: 2 },
        { item: "🍔", label: "Burger", difficulty: 2 },
        { item: "🌭", label: "Hot Dog", difficulty: 2 },
        { item: "🍝", label: "Pasta", difficulty: 2 },
        { item: "🍪", label: "Cookie", difficulty: 2 },
        { item: "🎂", label: "Cake", difficulty: 2 },
        { item: "🧁", label: "Cupcake", difficulty: 2 },
        { item: "🍦", label: "Ice Cream", difficulty: 2 },
      ],
      // NATURE - Medium (Stage 3+)
      nature: [
        { item: "🌳", label: "Tree", difficulty: 2 },
        { item: "🌸", label: "Flower", difficulty: 2 },
        { item: "🌼", label: "Sunflower", difficulty: 2 },
        { item: "☀️", label: "Sun", difficulty: 2 },
        { item: "🌙", label: "Moon", difficulty: 2 },
        { item: "⭐", label: "Star", difficulty: 2 },
        { item: "🌈", label: "Rainbow", difficulty: 2 },
        { item: "❄️", label: "Snow", difficulty: 2 },
      ],
      // OBJECTS - Hard (Stage 6+)
      objects: [
        { item: "🎈", label: "Balloon", difficulty: 3 },
        { item: "🎯", label: "Target", difficulty: 3 },
        { item: "🎨", label: "Painting", difficulty: 3 },
        { item: "🎸", label: "Guitar", difficulty: 3 },
        { item: "🎭", label: "Theater Masks", difficulty: 3 },
        { item: "🎪", label: "Circus Tent", difficulty: 3 },
        { item: "📚", label: "Books", difficulty: 3 },
        { item: "🔑", label: "Key", difficulty: 3 },
      ],
    };

    // 🎲 CATEGORY SELECTION BASED ON DIFFICULTY
    let availableCategories = ["fruits", "animals", "colors"];
    if (this.plantStage >= 3) {
      availableCategories.push("vehicles", "food", "nature");
    }
    if (this.plantStage >= 6) {
      availableCategories.push("objects");
    }

    // 🎲 RANDOMIZED QUESTION GENERATION - Pick from different categories
    const questions = [];
    const questionTemplates = [
      "Tap the",
      "Find the",
      "Select the",
      "Click on the",
      "Which one is the",
    ];

    for (let i = 0; i < 5; i++) {
      // Alternate between different categories for variety
      const categoryIndex = i % availableCategories.length;
      const category = availableCategories[categoryIndex];
      const categoryItems = allItems[category];
      const selectedItem =
        categoryItems[Math.floor(Math.random() * categoryItems.length)];
      const questionTemplate =
        questionTemplates[Math.floor(Math.random() * questionTemplates.length)];

      // Create diverse wrong answer options from the same category
      let wrongItems = categoryItems.filter(
        (item) => item.label !== selectedItem.label,
      );
      let options = [
        selectedItem.item,
        ...this.shuffleArray(wrongItems.map((x) => x.item)).slice(0, 3),
      ];

      questions.push({
        type: "match",
        question: `${questionTemplate} ${selectedItem.label}`,
        target: selectedItem.item,
        options: this.shuffleArray(options),
        sound: `Find the ${selectedItem.label}`,
        icon: selectedItem.item,
        category: category,
      });
    }

    return questions;
  }

  generateListenQuestions() {
    // Difficulty scales with plant stage
    const maxNumber = 5 + this.plantStage * 3;
    const maxCount = Math.min(maxNumber, 50);

    const numbers = Array.from(
      { length: 6 },
      () => Math.floor(Math.random() * maxCount) + 1,
    );

    const uniqueNumbers = [...new Set(numbers)].slice(0, 4);

    // Number words up to 50 (fallback to digits if higher)
    const numberWords = [
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
      "Twenty",
      "Twenty-one",
      "Twenty-two",
      "Twenty-three",
      "Twenty-four",
      "Twenty-five",
      "Twenty-six",
      "Twenty-seven",
      "Twenty-eight",
      "Twenty-nine",
      "Thirty",
      "Thirty-one",
      "Thirty-two",
      "Thirty-three",
      "Thirty-four",
      "Thirty-five",
      "Thirty-six",
      "Thirty-seven",
      "Thirty-eight",
      "Thirty-nine",
      "Forty",
      "Forty-one",
      "Forty-two",
      "Forty-three",
      "Forty-four",
      "Forty-five",
      "Forty-six",
      "Forty-seven",
      "Forty-eight",
      "Forty-nine",
      "Fifty",
    ];

    // Word-enhanced listening sentence templates
    const sentenceTemplates = [
      (word) => `The number is ${word}`,
      (word) => `Can you find the number ${word}?`,
      (word) => `Listen and tap ${word}`,
      (word) => `What number is ${word}?`,
      (word) => `How many? The answer is ${word}`,
      (word) => `Tap the number ${word} and listen carefully`,
      (word) => `Why is the number ${word}? Tap it`,
      (word) => `Find the number ${word} on the screen`,
    ];

    return uniqueNumbers.map((num) => {
      const word = numberWords[num - 1] || String(num);

      const options = this.shuffleArray([
        String(num),
        ...this.getRandomNumbers(3, num, maxCount),
      ]);

      const randomSentence =
        sentenceTemplates[Math.floor(Math.random() * sentenceTemplates.length)];

      return {
        type: "listen",
        question: "Listen carefully and tap the correct number",
        target: String(num),
        options: options,
        sound: randomSentence(word),
        icon: this.getNumberIcon(num),
      };
    });
  }

  generateNumberQuestions() {
    // Smart difficulty progression: grow number range as player advances
    let maxNumber = 10; // Stage 0-1
    if (this.plantStage >= 2) maxNumber = 15; // Stage 2-3
    if (this.plantStage >= 4) maxNumber = 20; // Stage 4-5
    if (this.plantStage >= 7) maxNumber = 30; // Stage 7-9
    if (this.plantStage >= 10) maxNumber = 50; // Stage 10+

    // Generate diverse targets - avoid consecutive numbers
    const targets = [];
    const usedNumbers = new Set();
    while (targets.length < 4 && usedNumbers.size < maxNumber) {
      let num = Math.floor(Math.random() * maxNumber) + 1;
      // Skip numbers too close to already selected ones for variety
      if (!usedNumbers.has(num) && !Array.from(usedNumbers).some(n => Math.abs(n - num) < 2)) {
        targets.push(num);
        usedNumbers.add(num);
      }
    }

    const questionTemplates = [
      "Count the objects and choose the number",
      "How many objects are there?",
      "Look carefully and count",
      "What number matches the objects?",
      "Count and tap the correct number",
      "Choose the right number",
    ];

    const soundTemplates = [
      "Count the objects carefully",
      "How many objects do you see?",
      "Let us count together",
      "Count and choose the answer",
      "Find the correct number",
      "Can you count to the right number?",
    ];

    // Child-friendly countable objects
    const objectSets = [
      { name: "apples", icon: "🍎" },
      { name: "bananas", icon: "🍌" },
      { name: "grapes", icon: "🍇" },
      { name: "oranges", icon: "🍊" },
      { name: "strawberries", icon: "🍓" },
      { name: "watermelons", icon: "🍉" },
      { name: "cupcakes", icon: "🧁" },
      { name: "cookies", icon: "🍪" },
      { name: "candies", icon: "🍬" },
      { name: "stars", icon: "⭐" },
      { name: "hearts", icon: "❤️" },
      { name: "fish", icon: "🐟" },
      { name: "cats", icon: "🐱" },
      { name: "dogs", icon: "🐶" },
      { name: "birds", icon: "🐦" },
      { name: "blocks", icon: "🧱" },
      { name: "balls", icon: "⚽" },
      { name: "flowers", icon: "🌸" },
      { name: "trees", icon: "🌳" },
      { name: "sun", icon: "☀️" },
    ];

    return targets.map((target) => {
      // Smart distractors: mix of nearby numbers and random numbers
      const nearbyNumbers = [target - 2, target - 1, target + 1, target + 2]
        .filter(n => n > 0 && n <= maxNumber && n !== target);
      
      const randomNumbers = [];
      while (randomNumbers.length < 3 - nearbyNumbers.length && randomNumbers.length < 3) {
        const num = Math.floor(Math.random() * maxNumber) + 1;
        if (num !== target && 
            !nearbyNumbers.includes(num) && 
            !randomNumbers.includes(num) &&
            Math.abs(num - target) > 2) {
          randomNumbers.push(num);
        }
      }

      const choices = this.shuffleArray([
        String(target),
        ...nearbyNumbers.map(String).slice(0, 2),
        ...randomNumbers.map(String).slice(0, 1)
      ]);

      const object = objectSets[Math.floor(Math.random() * objectSets.length)];

      return {
        type: "number",
        showCountButton: true,
        question: questionTemplates[Math.floor(Math.random() * questionTemplates.length)],
        target: String(target),
        options: choices,
        sound: soundTemplates[Math.floor(Math.random() * soundTemplates.length)],
        icon: this.getNumberIcon(target),
        icons: this.getNumberIcons(choices.map(Number)),
        countButtonText: `Count the ${object.name}`,
        modalTitle: `Count the ${object.name}`,
        modalObjects: Array.from({ length: target }, () => object.icon),
      };
    });
  }

  generateColorQuestions() {
    const allColors = [
      { name: "Red", icon: "●", hex: "#ff0000" },
      { name: "Blue", icon: "●", hex: "#0000ff" },
      { name: "Yellow", icon: "●", hex: "#ffff00" },
      { name: "Green", icon: "●", hex: "#00ff00" },
      { name: "Orange", icon: "●", hex: "#ff8800" },
      { name: "Purple", icon: "●", hex: "#800080" },
      { name: "Pink", icon: "●", hex: "#ff69b4" },
    ];
    // Difficulty: more colors to choose from as plant grows
    const numColors = Math.min(5 + Math.floor(this.plantStage / 3), 7);
    const colors = allColors.slice(0, numColors);
    const selectedColors = this.shuffleArray(colors).slice(0, 5);

    return selectedColors.map((c) => ({
      type: "color",
      question: `Tap the ${c.name} circle`,
      target: c.name,
      options: this.shuffleArray([
        c.name,
        ...colors
          .filter((x) => x.name !== c.name)
          .slice(0, 3 + Math.floor(this.plantStage / 5))
          .map((x) => x.name),
      ]),
      sound: `Find the color ${c.name}`,
      icon: c.icon,
      hex: c.hex,
    }));
  }

  generateShapeQuestions() {
    const shapes = [
      { name: "Circle", icon: "⭕", class: "shape-circle" },
      { name: "Square", icon: "⬜", class: "shape-square" },
      { name: "Triangle", icon: "🔺", class: "shape-triangle" },
      { name: "Star", icon: "⭐", class: "shape-star" },
      { name: "Heart", icon: "❤", class: "shape-heart" },
    ];
    const shapeMap = {};
    shapes.forEach((s) => {
      shapeMap[s.name] = s;
    });
    // Shuffle shapes and pick unique ones based on plant stage (difficulty scaling)
    const numOptions = Math.min(3 + Math.floor(this.plantStage / 5), 5);
    const selectedShapes = this.shuffleArray(shapes).slice(0, 5);

    return selectedShapes.map((s) => {
      const optionNames = this.shuffleArray([
        s.name,
        ...shapes
          .filter((x) => x.name !== s.name)
          .slice(0, numOptions)
          .map((x) => x.name),
      ]);
      return {
        type: "shape",
        question: `Tap the ${s.name}`,
        target: s.name,
        options: optionNames,
        optionIcons: optionNames.map((name) => shapeMap[name].icon),
        optionClasses: optionNames.map((name) => shapeMap[name].class),
        sound: `Find the ${s.name}`,
        icon: s.icon,
        shapeClass: s.class,
      };
    });
  }

  generateVocabQuestions() {
    // 📚 COMPREHENSIVE VOCABULARY WITH DIFFICULTY LEVELS
    const allVocab = [
      // EASY LEVEL - Stage 0-2 (Common, everyday objects)
      { word: "Cat", icon: "🐱", level: 1 },
      { word: "Dog", icon: "🐶", level: 1 },
      { word: "Fish", icon: "🐠", level: 1 },
      { word: "Bird", icon: "🐦", level: 1 },
      { word: "Apple", icon: "🍎", level: 1 },
      { word: "Banana", icon: "🍌", level: 1 },
      { word: "Ball", icon: "⚽", level: 1 },
      { word: "Sun", icon: "☀️", level: 1 },
      { word: "Moon", icon: "🌙", level: 1 },
      { word: "Star", icon: "⭐", level: 1 },
      { word: "Tree", icon: "🌳", level: 1 },
      { word: "Flower", icon: "🌸", level: 1 },
      { word: "Clock", icon: "⏰", level: 1 },
      { word: "Book", icon: "📖", level: 1 },
      { word: "Car", icon: "🚗", level: 1 },

      // MEDIUM LEVEL - Stage 3-6
      { word: "Frog", icon: "🐸", level: 2 },
      { word: "Turtle", icon: "🐢", level: 2 },
      { word: "Lion", icon: "🦁", level: 2 },
      { word: "Monkey", icon: "🐵", level: 2 },
      { word: "Elephant", icon: "🐘", level: 2 },
      { word: "Grapes", icon: "🍇", level: 2 },
      { word: "Orange", icon: "🍊", level: 2 },
      { word: "Watermelon", icon: "🍉", level: 2 },
      { word: "Strawberry", icon: "🍓", level: 2 },
      { word: "Cookie", icon: "🍪", level: 2 },
      { word: "Kite", icon: "🪁", level: 2 },
      { word: "Teddy Bear", icon: "🧸", level: 2 },
      { word: "Train", icon: "🚂", level: 2 },
      { word: "Airplane", icon: "✈️", level: 2 },
      { word: "Rainbow", icon: "🌈", level: 2 },
      { word: "Cloud", icon: "☁️", level: 2 },
      { word: "Phone", icon: "📱", level: 2 },
      { word: "Guitar", icon: "🎸", level: 2 },

      // HARD LEVEL - Stage 7+
      { word: "Penguin", icon: "🐧", level: 3 },
      { word: "Horse", icon: "🐴", level: 3 },
      { word: "Rabbit", icon: "🐰", level: 3 },
      { word: "Bear", icon: "🐻", level: 3 },
      { word: "Crab", icon: "🦀", level: 3 },
      { word: "Octopus", icon: "🐙", level: 3 },
      { word: "Peach", icon: "🍑", level: 3 },
      { word: "Pineapple", icon: "🍍", level: 3 },
      { word: "Lemon", icon: "🍋", level: 3 },
      { word: "Cupcake", icon: "🧁", level: 3 },
      { word: "Chocolate", icon: "🍫", level: 3 },
      { word: "Balloon", icon: "🎈", level: 3 },
      { word: "Rocket", icon: "🚀", level: 3 },
      { word: "Laptop", icon: "💻", level: 3 },
      { word: "Camera", icon: "📷", level: 3 },
      { word: "Snow", icon: "❄️", level: 3 },
      { word: "Fire", icon: "🔥", level: 3 },
      { word: "Mushroom", icon: "🍄", level: 3 },
      { word: "Umbrella", icon: "☂️", level: 3 },
      { word: "Glasses", icon: "👓", level: 3 },
    ];

    // Determine max difficulty level based on plant stage
    let maxLevel = 1;
    if (this.plantStage >= 3) maxLevel = 2;
    if (this.plantStage >= 7) maxLevel = 3;

    // Get available vocab for this difficulty
    const availableVocab = allVocab.filter(v => v.level <= maxLevel);

    // Determine number of options for this question set
    let numOptions = 4;
    if (this.plantStage >= 5) numOptions = 5;

    // Select 5 questions with diverse vocabulary
    const selectedVocab = this.shuffleArray(availableVocab).slice(0, 5);
    const vocabMap = {};
    availableVocab.forEach((v) => {
      vocabMap[v.word] = v.icon;
    });

    return selectedVocab.map((v) => {
      // Select distractors from same or lower difficulty level
      const possibleDistractions = availableVocab.filter(x => x.word !== v.word);
      const distractors = this.shuffleArray(possibleDistractions)
        .slice(0, numOptions - 1)
        .map(x => x.word);

      const optionWords = this.shuffleArray([v.word, ...distractors]);

      return {
        type: "vocab",
        question: `What is this?`,
        target: v.word,
        options: optionWords,
        optionIcons: optionWords.map((word) => vocabMap[word]),
        sound: `This is a ${v.word}`,
        icon: v.icon,
      };
    });
  }

  // ==================== NEW GAMES ====================

  generateMemoryQuestions() {
    // Full set of pairs for variety
    const pairs = [
      { emoji: "🐱", label: "Cat" },
      { emoji: "🐶", label: "Dog" },
      { emoji: "🐭", label: "Mouse" },
      { emoji: "🐰", label: "Rabbit" },
      { emoji: "🐻", label: "Bear" },
      { emoji: "🦁", label: "Lion" },
      { emoji: "🐟", label: "Fish" },
      { emoji: "🦋", label: "Butterfly" },
      { emoji: "🐸", label: "Frog" },
      { emoji: "🐦", label: "Bird" },
      { emoji: "🍎", label: "Apple" },
      { emoji: "🍌", label: "Banana" },
      { emoji: "🍇", label: "Grapes" },
      { emoji: "🍉", label: "Watermelon" },
      { emoji: "🍓", label: "Strawberry" },
      { emoji: "🍕", label: "Pizza" },
      { emoji: "🍦", label: "Ice Cream" },
      { emoji: "🍩", label: "Donut" },
      { emoji: "🎈", label: "Balloon" },
      { emoji: "🎂", label: "Cake" },
      { emoji: "🏀", label: "Basketball" },
      { emoji: "⚽", label: "Soccer Ball" },
      { emoji: "🎸", label: "Guitar" },
      { emoji: "🎹", label: "Piano" },
      { emoji: "🚗", label: "Car" },
      { emoji: "✈️", label: "Airplane" },
      { emoji: "🚀", label: "Rocket" },
      { emoji: "📱", label: "Phone" },
      { emoji: "💻", label: "Laptop" },
      { emoji: "🌳", label: "Tree" },
      { emoji: "🌸", label: "Flower" },
      { emoji: "🌞", label: "Sun" },
      { emoji: "🌙", label: "Moon" },
      { emoji: "🌈", label: "Rainbow" },
      { emoji: "⭐", label: "Star" },
    ];

    // 🎯 ULTRA-EASY PROGRESSION FOR KIDS - Much easier early stages!
    // Flower stage (0-1): VERY EASY - Just 2 pairs (4 cards total)
    // This helps kids learn memory concept without frustration
    let numPairs = 2; // SUPER EASY START for Flower stage!
    if (this.plantStage >= 2) numPairs = 3; // Sprout - 6 cards
    if (this.plantStage >= 4) numPairs = 4; // Young Plant - 8 cards
    if (this.plantStage >= 6) numPairs = 6; // Growing Plant - 12 cards
    if (this.plantStage >= 8) numPairs = 8; // Mature Plant - 16 cards
    if (this.plantStage >= 10) numPairs = 10; // Strong Plant - 20 cards
    if (this.plantStage >= 13) numPairs = 12; // Flourishing - 24 cards

    // Randomly select pairs (not just slice, for variety each game)
    const shuffledPairs = this.shuffleArray(pairs);
    const selectedPairs = shuffledPairs.slice(0, numPairs);

    // Create a deck: one card showing emoji, one showing label
    const deck = [];
    selectedPairs.forEach((pair, pairIndex) => {
      // Both cards in a pair get the same pairId for matching
      const pairId = `pair-${pairIndex}`;

      deck.push({
        ...pair,
        display: pair.emoji,
        pairId: pairId,
        flipped: false,
        id: crypto.randomUUID(),
      });
      deck.push({
        ...pair,
        display: pair.label,
        pairId: pairId,
        flipped: false,
        id: crypto.randomUUID(),
      });
    });

    // Shuffle the deck
    const shuffledDeck = this.shuffleArray(deck);

    return [
      {
        type: "memory",
        question: "Find the matching pairs!",
        pairs: selectedPairs,
        deck: shuffledDeck,
        sound: "Find the matching pairs by tapping two cards",
        // Optional: show a timed preview at start
        previewTime: 3000, // 3 seconds cards face up
      },
    ];
  }

  generateSightWordsQuestions() {
    // Expanded sight words with difficulty levels (Dolch & high-frequency)
    const allWords = [
      // Level 1 (Very Easy - Stage 0-2)
      { word: "the", label: "the", level: 1 },
      { word: "a", label: "a", level: 1 },
      { word: "I", label: "I", level: 1 },
      { word: "is", label: "is", level: 1 },
      { word: "it", label: "it", level: 1 },
      
      // Level 2 (Easy - Stage 3-5)
      { word: "and", label: "and", level: 2 },
      { word: "to", label: "to", level: 2 },
      { word: "you", label: "you", level: 2 },
      { word: "in", label: "in", level: 2 },
      { word: "of", label: "of", level: 2 },
      { word: "for", label: "for", level: 2 },
      { word: "that", label: "that", level: 2 },
      
      // Level 3 (Medium - Stage 6-9)
      { word: "with", label: "with", level: 3 },
      { word: "have", label: "have", level: 3 },
      { word: "this", label: "this", level: 3 },
      { word: "from", label: "from", level: 3 },
      { word: "or", label: "or", level: 3 },
      { word: "had", label: "had", level: 3 },
      { word: "can", label: "can", level: 3 },
      { word: "be", label: "be", level: 3 },
      
      // Level 4 (Hard - Stage 10+)
      { word: "by", label: "by", level: 4 },
      { word: "as", label: "as", level: 4 },
      { word: "would", label: "would", level: 4 },
      { word: "at", label: "at", level: 4 },
      { word: "does", label: "does", level: 4 },
      { word: "on", label: "on", level: 4 },
      { word: "if", label: "if", level: 4 },
      { word: "when", label: "when", level: 4 },
      { word: "they", label: "they", level: 4 },
    ];

    // Determine difficulty level based on plant stage
    let maxLevel = 1;
    if (this.plantStage >= 3) maxLevel = 2;
    if (this.plantStage >= 6) maxLevel = 3;
    if (this.plantStage >= 10) maxLevel = 4;

    // Filter words by current difficulty level
    const availableWords = allWords.filter(w => w.level <= maxLevel);
    
    // Select appropriate number of words for this question set
    let numWords = 4;
    if (this.plantStage >= 5) numWords = 6;
    if (this.plantStage >= 8) numWords = 8;
    if (this.plantStage >= 12) numWords = 10;

    // Shuffle and select words (prefer harder words at higher stages)
    const selectedWords = availableWords
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(numWords, availableWords.length));

    // Generate questions from selected words
    return selectedWords.map((w) => {
      // Create distractors from other words at same or lower level
      const distractors = allWords
        .filter(x => x.word !== w.word && x.level <= maxLevel)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(x => x.word);

      return {
        type: "sightwords",
        question: `Find the word: "${w.word}"`,
        target: w.word,
        options: this.shuffleArray([
          w.word,
          ...distractors,
        ]),
        sound: `Find the word ${w.word}`,
      };
    });
  }

  generateRhymeQuestions() {
    // 🎵 COMPREHENSIVE RHYME WORDS WITH DIFFICULTY LEVELS
    const rhymeGroups = [
      // EASY - Stage 0-3
      {
        word1: "Cat",
        icon: "🐱",
        rhymes: [
          { word: "Hat", icon: "🎩" },
          { word: "Bat", icon: "🦇" },
          { word: "Mat", icon: "🧶" },
          { word: "Sat", icon: "💺" },
        ],
        difficulty: 1,
      },
      {
        word1: "Moon",
        icon: "🌙",
        rhymes: [
          { word: "Spoon", icon: "🥄" },
          { word: "Soon", icon: "⏰" },
          { word: "Balloon", icon: "🎈" },
          { word: "Croon", icon: "🎤" },
        ],
        difficulty: 1,
      },
      {
        word1: "Day",
        icon: "☀️",
        rhymes: [
          { word: "Play", icon: "🎮" },
          { word: "Way", icon: "🛣️" },
          { word: "Say", icon: "💬" },
          { word: "Ray", icon: "☀️" },
        ],
        difficulty: 1,
      },
      {
        word1: "Dog",
        icon: "🐶",
        rhymes: [
          { word: "Log", icon: "🪵" },
          { word: "Fog", icon: "🌫️" },
          { word: "Jog", icon: "🏃" },
          { word: "Bog", icon: "🌿" },
        ],
        difficulty: 1,
      },
      {
        word1: "Bed",
        icon: "🛏️",
        rhymes: [
          { word: "Red", icon: "🔴" },
          { word: "Bread", icon: "🍞" },
          { word: "Head", icon: "🧠" },
          { word: "Fed", icon: "🍽️" },
        ],
        difficulty: 1,
      },
      {
        word1: "Bell",
        icon: "🔔",
        rhymes: [
          { word: "Well", icon: "💧" },
          { word: "Shell", icon: "🐚" },
          { word: "Smell", icon: "👃" },
          { word: "Tell", icon: "📢" },
        ],
        difficulty: 1,
      },
      // MEDIUM - Stage 4-7
      {
        word1: "Ring",
        icon: "💍",
        rhymes: [
          { word: "Sing", icon: "🎤" },
          { word: "Wing", icon: "🪶" },
          { word: "Spring", icon: "🌸" },
          { word: "King", icon: "👑" },
        ],
        difficulty: 2,
      },
      {
        word1: "Tree",
        icon: "🌳",
        rhymes: [
          { word: "Bee", icon: "🐝" },
          { word: "Sea", icon: "🌊" },
          { word: "Key", icon: "🔑" },
          { word: "Free", icon: "🦅" },
        ],
        difficulty: 2,
      },
      {
        word1: "Boat",
        icon: "🚤",
        rhymes: [
          { word: "Coat", icon: "🧥" },
          { word: "Goat", icon: "🐐" },
          { word: "Note", icon: "📝" },
          { word: "Moat", icon: "🏰" },
        ],
        difficulty: 2,
      },
      {
        word1: "Cake",
        icon: "🎂",
        rhymes: [
          { word: "Bake", icon: "🔥" },
          { word: "Lake", icon: "🏞️" },
          { word: "Snake", icon: "🐍" },
          { word: "Wake", icon: "😴" },
        ],
        difficulty: 2,
      },
      // HARD - Stage 8+
      {
        word1: "House",
        icon: "🏠",
        rhymes: [
          { word: "Mouse", icon: "🐭" },
          { word: "Blouse", icon: "👕" },
          { word: "Louse", icon: "🦟" },
        ],
        difficulty: 3,
      },
      {
        word1: "Star",
        icon: "⭐",
        rhymes: [
          { word: "Far", icon: "🌌" },
          { word: "Car", icon: "🚗" },
          { word: "Jar", icon: "🫙" },
        ],
        difficulty: 3,
      },
    ];

    let maxDifficulty = 1;
    if (this.plantStage >= 4) maxDifficulty = 2;
    if (this.plantStage >= 8) maxDifficulty = 3;

    const availableGroups = rhymeGroups.filter(g => g.difficulty <= maxDifficulty);
    const selectedGroups = this.shuffleArray(availableGroups).slice(0, 5);

    return selectedGroups.map((group) => {
      const correctRhyme = group.rhymes[Math.floor(Math.random() * group.rhymes.length)];
      
      // Get distractors from OTHER rhyme groups (different rhyme endings)
      const otherGroups = availableGroups.filter(g => g !== group);
      const shuffledOtherGroups = this.shuffleArray(otherGroups);
      
      const distractors = [];
      for (let g of shuffledOtherGroups) {
        if (distractors.length >= 3) break;
        const randomWord = g.rhymes[Math.floor(Math.random() * g.rhymes.length)];
        distractors.push(randomWord.word);
      }

      return {
        type: "rhyme",
        question: `What rhymes with "${group.word1}"?`,
        target: correctRhyme.word,
        options: this.shuffleArray([correctRhyme.word, ...distractors]),
        sound: `What word rhymes with ${group.word1}?`,
        icon: group.icon,
        correctRhymeIcon: correctRhyme.icon,
      };
    });
  }

  generateMathQuestions() {
    // 🔢 MATH WITH NUMBERS (not dots) - PROGRESSIVE DIFFICULTY
    let maxNum = 5;
    let hasSubtraction = false;
    let hasMultiplication = false;
    
    if (this.plantStage >= 3) {
      maxNum = 10;
      hasSubtraction = true;
    }
    if (this.plantStage >= 7) {
      maxNum = 15;
    }
    if (this.plantStage >= 10) {
      maxNum = 20;
      hasMultiplication = true;
    }
    if (this.plantStage >= 13) {
      maxNum = 25;
    }

    const operations = ["+"];
    if (hasSubtraction) operations.push("-");
    if (hasMultiplication) operations.push("×");

    const questions = [];
    const usedProblems = new Set();
    const questionTemplates = [
      (n1, op, n2, ans) => `${n1} ${op} ${n2} = ?`,
      (n1, op, n2, ans) => `${n1} ${op} ${n2} equals what?`,
      (n1, op, n2, ans) => `What is ${n1} ${op} ${n2}?`,
    ];

    for (let i = 0; i < 5; i++) {
      let num1, num2, op, answer, problemKey;
      
      // Ensure diverse problems without repeats
      do {
        num1 = Math.floor(Math.random() * (maxNum - 1)) + 2;
        
        if (hasMultiplication && Math.random() > 0.6) {
          // Multiplication: keep numbers smaller
          num2 = Math.floor(Math.random() * 9) + 1;
          op = "×";
          answer = num1 * num2;
        } else {
          num2 = Math.floor(Math.random() * Math.min(num1 - 1, 5)) + 1;
          op = operations.filter(o => o !== "×")[Math.floor(Math.random() * (operations.length - (hasMultiplication ? 1 : 0)))];
          answer = op === "+" ? num1 + num2 : num1 - num2;
        }
        
        problemKey = `${num1}${op}${num2}`;
      } while (usedProblems.has(problemKey) && usedProblems.size < 30);
      
      usedProblems.add(problemKey);

      // Use numbers instead of dots - More interactive!
      const num1Display = Array(num1).fill(1).map((_, i) => i + 1).join(" ");
      const num2Display = Array(num2).fill(1).map((_, i) => i + 1).join(" ");

      // Question template with variety
      const questionTemplate = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
      const questionText = questionTemplate(num1, op, num2, answer);

      // Smarter distractors based on difficulty
      const wrongAnswers = new Set();
      
      // Off by 1 distractor
      wrongAnswers.add(Math.max(0, answer - 1));
      wrongAnswers.add(Math.max(0, answer + 1));
      
      // Add operation confusion distractor (if addition, show subtraction result)
      if (op === "+") {
        wrongAnswers.add(Math.max(0, num1 - num2));
      }
      
      // Random distractor
      let randomWrong;
      const maxRange = Math.max(maxNum + 10, answer + 5);
      do {
        randomWrong = Math.floor(Math.random() * maxRange) + 1;
      } while (wrongAnswers.has(randomWrong) || randomWrong === answer);
      wrongAnswers.add(randomWrong);

      const options = this.shuffleArray([
        String(answer),
        ...Array.from(wrongAnswers).slice(0, 3).map(String)
      ]);

      questions.push({
        type: "math",
        question: questionText,
        target: String(answer),
        options: options,
        sound: `${num1} ${op === "+" ? "plus" : op === "-" ? "minus" : "times"} ${num2} equals ${answer}`,
        showNumbers: true,
        num1Display,
        num2Display,
      });
    }
    return questions;
  }

  generatePatternQuestions() {
    // 🎨 INTERACTIVE PATTERNS - Kid-friendly with More Variety
    const basicPatterns = [
      { question: "🔴 🟡 🔴 🟡 ?", pattern: "AB AB", target: "🔴", wrongOptions: ["🟡", "🟢", "⚫"] },
      { question: "⭐ 🌙 ⭐ 🌙 ?", pattern: "AB AB", target: "⭐", wrongOptions: ["🌙", "☀️", "🌟"] },
      { question: "🍎 🍌 🍎 🍌 ?", pattern: "AB AB", target: "🍎", wrongOptions: ["🍌", "🍊", "🍇"] },
      { question: "🐱 🐶 🐱 🐶 ?", pattern: "AB AB", target: "🐱", wrongOptions: ["🐶", "🐭", "🐰"] },
      { question: "❤️ 💛 ❤️ 💛 ?", pattern: "AB AB", target: "❤️", wrongOptions: ["💛", "💚", "💜"] },
      { question: "🎨 📚 🎨 📚 ?", pattern: "AB AB", target: "🎨", wrongOptions: ["📚", "✏️", "🖍️"] },
    ];

    const intermediatePatterns = [
      { question: "🔴 🟡 🟢 🔴 🟡 🟢 ?", pattern: "ABC ABC", target: "🔴", wrongOptions: ["🟡", "🟢", "⚫"] },
      { question: "🐱 🐱 🐶 🐱 🐱 🐶 ?", pattern: "AAB AAB", target: "🐱", wrongOptions: ["🐶", "🐭", "🦁"] },
      { question: "❤️ ⭐ ❤️ ⭐ ?", pattern: "AB AB", target: "❤️", wrongOptions: ["⭐", "🌙", "🔴"] },
      { question: "🌳 🌳 🌳 🌳 🌳 ?", pattern: "AAAAA", target: "🌳", wrongOptions: ["🌸", "🌲", "🌴"] },
      { question: "🎈 🎈 🎈 🎈 🎈 ?", pattern: "AAAAA", target: "🎈", wrongOptions: ["🎉", "🎁", "🎊"] },
      { question: "🍎 🍎 🍌 🍎 🍎 🍌 ?", pattern: "AAB AAB", target: "🍎", wrongOptions: ["🍌", "🍊", "🍇"] },
      { question: "⭐ 💫 ✨ ⭐ 💫 ✨ ?", pattern: "ABC ABC", target: "⭐", wrongOptions: ["💫", "✨", "🌟"] },
    ];

    const advancedPatterns = [
      { question: "1️⃣ 2️⃣ 1️⃣ 2️⃣ 1️⃣ ?", pattern: "AB ABA", target: "2️⃣", wrongOptions: ["1️⃣", "3️⃣", "0️⃣"] },
      { question: "🔴 🟡 🟢 🔴 🟡 🟢 🔴 ?", pattern: "ABC ABCA", target: "🟡", wrongOptions: ["🔴", "🟢", "🟠"] },
      { question: "🍎 🍎 🍌 🍎 🍎 🍌 ?", pattern: "AAB AAB", target: "🍎", wrongOptions: ["🍌", "🍊", "🍇"] },
      { question: "⭐ ⭐ ⭐ 🌙 ⭐ ⭐ ⭐ 🌙 ?", pattern: "AAAB AAAB", target: "⭐", wrongOptions: ["🌙", "☀️", "🌟"] },
      { question: "🚗 🚗 🚗 🚂 🚗 🚗 🚗 🚂 ?", pattern: "AAAB AAAB", target: "🚗", wrongOptions: ["🚂", "✈️", "🚁"] },
      { question: "🎸 🎹 🥁 🎸 🎹 🥁 ?", pattern: "ABC ABC", target: "🎸", wrongOptions: ["🎹", "🥁", "🎺"] },
    ];

    let selectedPatterns = basicPatterns;
    if (this.plantStage >= 5) selectedPatterns = [...basicPatterns, ...intermediatePatterns];
    if (this.plantStage >= 10) selectedPatterns = [...basicPatterns, ...intermediatePatterns, ...advancedPatterns];

    // Randomize pattern selection
    const questions = [];
    const usedIndices = new Set();

    for (let i = 0; i < 6 && usedIndices.size < selectedPatterns.length; i++) {
      let idx;
      do {
        idx = Math.floor(Math.random() * selectedPatterns.length);
      } while (usedIndices.has(idx));
      usedIndices.add(idx);

      const pattern = selectedPatterns[idx];
      questions.push({
        type: "pattern",
        question: pattern.question,
        patternType: pattern.pattern,
        target: pattern.target,
        options: this.shuffleArray([pattern.target, ...pattern.wrongOptions]),
        sound: `The pattern is ${pattern.pattern}. What comes next?`,
        hint: `Pattern: ${pattern.pattern}`,
      });
    }

    return questions;
  }

  generateAnimalSoundsQuestions() {
    // 🐾 ANIMAL SOUNDS WITH DIFFICULTY PROGRESSION - KID-FRIENDLY SOUNDS
    const allAnimals = [
      // EASY LEVEL - Stage 0-2 (Common familiar animals)
    { animal: "Dog", emoji: "🐶", sound: "Woof woof woof! The doggy says woof! Bark bark bark!", level: 1 },
    { animal: "Cat", emoji: "🐱", sound: "Meow meow meow! The kitty says meow! Meow!", level: 1 },
    { animal: "Cow", emoji: "🐄", sound: "Moo moo moo! The cow says moo! Mooooo!", level: 1 },
    { animal: "Sheep", emoji: "🐑", sound: "Ba! ba! baa! The sheep says ba!! Ba! ba!!", level: 1 },
    { animal: "Pig", emoji: "🐷", sound: "Oink oink oink! The piggy says oink! Oink oink!", level: 1 },

    // MEDIUM LEVEL - Stage 3-6
    { animal: "Duck", emoji: "🦆", sound: "Quack quack quack! The duck says quack! Quack quack!", level: 2 },
    { animal: "Rooster", emoji: "🐓", sound: "Cock-a-doodle-doo! The rooster says cock-a-doodle-doo! Early morning!", level: 2 },
    { animal: "Bee", emoji: "🐝", sound: "Buzzz buzzz buzzz! The bee says buzz! Bzzzzzz!", level: 2 },
    { animal: "Bird", emoji: "🐦", sound: "Tweet tweet tweet! The bird says tweet tweet! Chirp chirp!", level: 2 },
    { animal: "Horse", emoji: "🐴", sound: "Neigh neigh neiiiigh! The horse says neigh! Whinny whinny!", level: 2 },
    { animal: "Lion", emoji: "🦁", sound: "Roooaaarrr! The lion roars! Roar roar roar!", level: 2 },
    { animal: "Monkey", emoji: "🐵", sound: "Oooh oooh oooh! The monkey says ooh ooh! Ah ah ah!", level: 2 },

    // HARD LEVEL - Stage 7+
    { animal: "Elephant", emoji: "🐘", sound: "Paaawooo paaawooo! The elephant trumpets! Trumpet sound!", level: 3 },
    { animal: "Snake", emoji: "🐍", sound: "Hissssss! The snake hisses! Psssss!", level: 3 },
    { animal: "Frog", emoji: "🐸", sound: "Ribbit ribbit ribbit! The frog says ribbit! Croak croak!", level: 3 },
    { animal: "Owl", emoji: "🦉", sound: "Hoo hoo hoooo! The owl hoots! Whooo whooo!", level: 3 },
    { animal: "Wolf", emoji: "🐺", sound: "Aroooooo! The wolf howls! Howwwwl!", level: 3 },
    { animal: "Bear", emoji: "🐻", sound: "Growwwl growwwl! The bear growls! Roarrr!", level: 3 },
    ]

    // Determine max difficulty level based on plant stage
    let maxLevel = 1;
    if (this.plantStage >= 3) maxLevel = 2;
    if (this.plantStage >= 7) maxLevel = 3;

    // Get available animals for this difficulty
    const availableAnimals = allAnimals.filter(a => a.level <= maxLevel);

    // Determine number of options
    let numOptions = 4;
    if (this.plantStage >= 5) numOptions = 5;

    // Select 5 questions with diverse animals
    const selectedAnimals = this.shuffleArray(availableAnimals).slice(0, 5);
    const animalMap = {};
    availableAnimals.forEach((a) => {
      animalMap[a.animal] = a.emoji;
    });

    return selectedAnimals.map((a) => {
      // Select distractors from same or lower difficulty level
      const possibleDistractions = availableAnimals.filter(x => x.animal !== a.animal);
      const distractors = this.shuffleArray(possibleDistractions)
        .slice(0, numOptions - 1)
        .map(x => x.animal);

      const optionAnimals = this.shuffleArray([a.animal, ...distractors]);

      return {
        type: "animals",
        question: `Which animal makes this sound?`,
        target: a.animal,
        options: optionAnimals,
        optionIcons: optionAnimals.map((name) => animalMap[name]),
        sound: `${a.sound}. This is a ${a.animal}!`,
        icon: a.emoji,
      };
    });
  }

  generateCategoryQuestions() {
    // 📊 ENHANCED CATEGORIES - Kid-Friendly with Better Variety & Difficulty
    const categories = {
      animals: [
        { emoji: "🐱", name: "Cat" },
        { emoji: "🐶", name: "Dog" },
        { emoji: "🐭", name: "Mouse" },
        { emoji: "🦁", name: "Lion" },
        { emoji: "🐘", name: "Elephant" },
        { emoji: "🦋", name: "Butterfly" },
        { emoji: "🐸", name: "Frog" },
        { emoji: "🦊", name: "Fox" },
        { emoji: "🐻", name: "Bear" },
        { emoji: "🦝", name: "Raccoon" },
        { emoji: "🐢", name: "Turtle" },
        { emoji: "🦉", name: "Owl" },
      ],
      food: [
        { emoji: "🍎", name: "Apple" },
        { emoji: "🍌", name: "Banana" },
        { emoji: "🍕", name: "Pizza" },
        { emoji: "🍪", name: "Cookie" },
        { emoji: "🥕", name: "Carrot" },
        { emoji: "🍉", name: "Watermelon" },
        { emoji: "🍔", name: "Burger" },
        { emoji: "🌽", name: "Corn" },
        { emoji: "🍓", name: "Strawberry" },
        { emoji: "🍫", name: "Chocolate" },
        { emoji: "🥪", name: "Sandwich" },
        { emoji: "🍰", name: "Cake" },
      ],
      colors: [
        { emoji: "🔴", name: "Red" },
        { emoji: "🟠", name: "Orange" },
        { emoji: "🟡", name: "Yellow" },
        { emoji: "🟢", name: "Green" },
        { emoji: "🔵", name: "Blue" },
        { emoji: "🟣", name: "Purple" },
        { emoji: "🟤", name: "Brown" },
        { emoji: "⚫", name: "Black" },
        { emoji: "⚪", name: "White" },
        { emoji: "🩷", name: "Pink" },
      ],
      objects: [
        { emoji: "🎨", name: "Paint" },
        { emoji: "📚", name: "Book" },
        { emoji: "✏️", name: "Pencil" },
        { emoji: "🎈", name: "Balloon" },
        { emoji: "⚽", name: "Ball" },
        { emoji: "🧩", name: "Puzzle" },
        { emoji: "🎮", name: "Game" },
        { emoji: "🧸", name: "Teddy" },
        { emoji: "🪀", name: "Yo-Yo" },
        { emoji: "🎲", name: "Dice" },
        { emoji: "📷", name: "Camera" },
        { emoji: "🔔", name: "Bell" },
      ],
      shapes: [
        { emoji: "⭕", name: "Circle" },
        { emoji: "⬜", name: "Square" },
        { emoji: "🔺", name: "Triangle" },
        { emoji: "⭐", name: "Star" },
        { emoji: "❤️", name: "Heart" },
        { emoji: "🔷", name: "Diamond" },
        { emoji: "🔶", name: "Hexagon" },
        { emoji: "🟥", name: "Red Square" },
        { emoji: "🟨", name: "Yellow Square" },
        { emoji: "🔔", name: "Bell" },
      ],
      toys: [
        { emoji: "🧸", name: "Teddy Bear" },
        { emoji: "🎮", name: "Game Controller" },
        { emoji: "🚗", name: "Car" },
        { emoji: "🚀", name: "Rocket" },
        { emoji: "🎸", name: "Guitar" },
        { emoji: "🎺", name: "Trumpet" },
        { emoji: "🪀", name: "Yo-Yo" },
        { emoji: "🧩", name: "Puzzle" },
        { emoji: "🎲", name: "Dice" },
        { emoji: "🪆", name: "Doll" },
        { emoji: "🎪", name: "Tent" },
        { emoji: "🛝", name: "Slide" },
      ],
      vehicles: [
        { emoji: "🚗", name: "Car" },
        { emoji: "🚕", name: "Taxi" },
        { emoji: "🚌", name: "Bus" },
        { emoji: "🚎", name: "Bus 2" },
        { emoji: "🚐", name: "Van" },
        { emoji: "🚑", name: "Ambulance" },
        { emoji: "🚒", name: "Fire Truck" },
        { emoji: "✈️", name: "Airplane" },
        { emoji: "🚁", name: "Helicopter" },
        { emoji: "🚂", name: "Train" },
        { emoji: "🚢", name: "Boat" },
        { emoji: "🚴", name: "Bike" },
      ],
      nature: [
        { emoji: "🌳", name: "Tree" },
        { emoji: "🌸", name: "Flower" },
        { emoji: "☀️", name: "Sun" },
        { emoji: "🌙", name: "Moon" },
        { emoji: "⭐", name: "Star" },
        { emoji: "🌈", name: "Rainbow" },
        { emoji: "🍃", name: "Leaf" },
        { emoji: "🌺", name: "Hibiscus" },
        { emoji: "🌻", name: "Sunflower" },
        { emoji: "🌼", name: "Daisy" },
      ],
    };

    const categoryNames = Object.keys(categories);
    const questions = [];
    const usedCategories = new Set();

    // Generate 6 questions instead of 5 for more content
    const numQuestions = Math.min(6, categoryNames.length);

    for (let i = 0; i < numQuestions; i++) {
      let categoryName;
      do {
        categoryName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
      } while (usedCategories.has(categoryName) && usedCategories.size < categoryNames.length);
      usedCategories.add(categoryName);

      const categoryItems = categories[categoryName];
      const correctItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
      
      // Get diverse wrong items from different categories
      const wrongCategories = categoryNames
        .filter((c) => c !== categoryName)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const wrongItems = wrongCategories.map(cat => {
        const items = categories[cat];
        return items[Math.floor(Math.random() * items.length)];
      });

      const allOptions = [correctItem, ...wrongItems];
      const options = this.shuffleArray(allOptions.map(o => o.emoji));

      const questionTemplates = [
        `Which one is a ${categoryName}?`,
        `Pick the ${categoryName}!`,
        `Find the ${categoryName}!`,
        `What is a ${categoryName}?`,
        `Show me the ${categoryName}!`,
      ];

      const questionTemplate = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];

      questions.push({
        type: "category",
        question: questionTemplate,
        categoryName: categoryName,
        target: correctItem.emoji,
        options: options,
        correctName: correctItem.name,
        sound: `Pick the ${correctItem.name}! It's a ${categoryName}!`,
      });
    }

    return questions;
  }

  // ==================== HELPER METHODS ====================

  getRandomLetters(count, exclude) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      .split("")
      .filter((l) => l !== exclude);
    return letters.sort(() => Math.random() - 0.5).slice(0, count);
  }

  getRandomNumbers(count, exclude, maxNumber = 10) {
    const numbers = Array.from({ length: maxNumber }, (_, i) =>
      String(i + 1),
    ).filter((n) => n !== String(exclude));
    return numbers.sort(() => Math.random() - 0.5).slice(0, count);
  }

  getRandomItems(count = 3) {
    const items = ["🐱", "🐶", "🍌", "🍕", "🏠", "👨", "👧", "✈️", "🐘", "🦁"];
    const shuffled = items.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, items.length));
  }

  getNumberIcon(n) {
    const icons = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    return icons[n - 1] || n;
  }

  getNumberIcons(numbers) {
    return numbers.map((n) => this.getNumberIcon(parseInt(n)));
  }

  shuffleArray(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  // ==================== SCREEN MANAGEMENT ====================

  showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active");
    });

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add("active");
    }
  }

  // ==================== USERNAME HELPERS ====================

  normalizeUsername(name) {
    return name.trim().replace(/\s+/g, " ").toLowerCase();
  }

  hashUsername(name) {
    // Simple deterministic hash (safe for localStorage keys)
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // ==================== GAME START ====================

  startGame() {
    const rawName = document.getElementById("userName").value;

    const validation = this.isValidUsername(rawName);
    if (!validation.isValid) {
      alert(`⚠️ ${validation.message}`);
      return;
    }

    this.userName = this.normalizeUsername(rawName);

    // Save username to localStorage for auto-login on refresh
    localStorage.setItem("kg_username", this.userName);

    const loaded = this.loadSavedProgress();

    if (!loaded) {
      this.resetUserProgressMemoryOnly();
    }

    this.saveGameState();

    this.showScreen("gardenScreen");
    this.updateGardenDisplay();
    this.showWelcomeMessage();
  }

  // ==================== USERNAME VALIDATION ====================

  isValidUsername(userName) {
    if (!userName || userName.trim().length === 0) {
      return { isValid: false, message: "Username cannot be empty." };
    }

    if (userName.length < 2 || userName.length > 20) {
      return {
        isValid: false,
        message: "Username must be 2–20 characters long.",
      };
    }

    const regex = /^[a-zA-Z0-9\s\-']+$/;
    if (!regex.test(userName)) {
      return {
        isValid: false,
        message:
          "Only letters, numbers, spaces, hyphens, and apostrophes are allowed.",
      };
    }

    if (/^\d+$/.test(userName)) {
      return { isValid: false, message: "Username cannot be numbers only." };
    }

    const badWords = ["stupid", "dumb", "hate"];
    const lower = userName.toLowerCase();
    for (const word of badWords) {
      if (lower.includes(word)) {
        return { isValid: false, message: "Please choose a kinder name." };
      }
    }

    return { isValid: true, message: "" };
  }

  // ==================== SAVE / LOAD ====================

  saveGameState() {
    if (!this.userName) return;
    
    const userId = this.hashUsername(this.userName);
    
    // Save in game format (existing)
    const gameKey = `kg_${userId}`;
    const gameData = {
      userName: this.userName,
      score: this.score,
      plantStage: this.plantStage,
      sessionData: this.sessionData,
      streak: this.streak,
      achievements: this.achievements,
      stats: this.stats,
    };
    localStorage.setItem(gameKey, JSON.stringify(gameData));
    
    // Save activity progress for admin panel
    localStorage.setItem(
      `activityProgress_${userId}`,
      JSON.stringify({
        completed: true,
        score: this.score,
        timestamp: new Date().toISOString(),
        plantStage: this.plantStage,
        achievements: this.achievements,
        sessionCount: (this.sessionData || []).length
      })
    );
    
    // Save user settings for admin panel
    localStorage.setItem(
      `userSettings_${userId}`,
      JSON.stringify({
        name: this.userName,
        createdAt: localStorage.getItem(`userCreated_${userId}`) || new Date().toISOString(),
        theme: this.theme,
        soundEnabled: this.soundEnabled
      })
    );
    
    // Track last login time
    localStorage.setItem(`lastLogin_${userId}`, new Date().toISOString());
    
    // Track user creation time (only set once)
    if (!localStorage.getItem(`userCreated_${userId}`)) {
      localStorage.setItem(`userCreated_${userId}`, new Date().toISOString());
    }
    
    console.log(`💾 Game saved for ${this.userName} (ID: ${userId})`);
    

  }




  loadSavedProgress() {
    if (!this.userName) return false;
    const userId = this.hashUsername(this.normalizeUsername(this.userName));
    const key = `kg_${userId}`;
    const saved = localStorage.getItem(key);

    if (!saved) {
      console.log(`📭 No saved progress found for ${this.userName}`);
      return false;
    }

    try {
      const data = JSON.parse(saved);
      this.score = data.score || 0;
      this.plantStage = data.plantStage || 0;
      this.sessionData = data.sessionData || [];
      this.streak = data.streak || 0;
      this.achievements = data.achievements || this.loadAchievements();
      this.stats = data.stats || this.loadStats();
      
      console.log(`✅ Loaded saved progress for ${this.userName}: Score=${this.score}, Plant=${this.plantStage}`);
      return true;
    } catch (e) {
      console.error(`❌ Error loading progress for ${this.userName}:`, e);
      return false;
    }
  }

  // ==================== RESET (SAFE) ====================

  resetUserProgressMemoryOnly() {
    this.score = 0;
    this.plantStage = 0;
    this.sessionData = [];
    this.streak = 0;
    this.achievements = this.loadAchievements();
  }

  // ==================== VALIDATION ====================

  validateProgress(progress) {
    return (
      typeof progress === "object" &&
      progress.score >= 0 &&
      progress.plantStage >= 0
    );
  }

  // ==================== UI HELPERS ====================

  showWelcomeMessage() {
    const message = `Hi ${this.userName}! Welcome to the Neuro Comrade. Let's learn and have fun!`;
    this.speak(message);
  }

  backToStart() {
    // Clear saved username to allow new login
    localStorage.removeItem("kg_username");
    this.userName = "";
    this.showScreen("startScreen");
    // Clear input field
    document.getElementById("userName").value = "";
  }

  backToGarden() {
    // Hide hint button when leaving memory activity
    const hintBtn = document.getElementById("hintBtn");
    if (hintBtn) {
      hintBtn.classList.add("hidden");
    }
    // Hide count button
    const countBtn = document.getElementById("countBtn");
    if (countBtn) {
      countBtn.classList.add("hidden");
    }
    // 🎵 RESUME BGM WHEN RETURNING TO GARDEN
    this.playBGM();
    this.showScreen("gardenScreen");
    this.updateGardenDisplay();
  }

  // ==================== ACTIVITY FLOW ====================

  startActivity(activityType) {
    this.currentActivity = activityType;
    this.currentQuestion = 0;
    
    // ⏲️ TRACK SESSION START TIME FOR DAILY STATISTICS
    this.sessionStartTime = Date.now();
    
    // Increment session count when activity starts (including incomplete sessions)
    this.stats.totalSessions++;
    this.stats.lastPlayDate = new Date().toISOString();
    if (!this.stats.gamesPlayed[activityType]) {
      this.stats.gamesPlayed[activityType] = 0;
    }
    this.stats.gamesPlayed[activityType]++;
    this.saveGameState();
    
    // 🔄 REGENERATE FRESH QUESTIONS EVERY TIME - NO REPETITION!
    this.activities[activityType].questions =
      this.generateFreshQuestions(activityType);
    
    // ⏸️ PAUSE BGM FOR CLARITY OF TEXT SPEECH
    this.stopBGM();
    
    this.showScreen("activityScreen");
    this.loadQuestion();
  }

  generateFreshQuestions(activityType) {
    // Generate completely new questions based on activity type
    switch (activityType) {
      case "alphabet":
        return this.generateAlphabetQuestions();
      case "phonics":
        return this.generatePhonicsQuestions();
      case "match":
        return this.generateMatchQuestions();
      case "listen":
        return this.generateListenQuestions();
      case "numbers":
        return this.generateNumberQuestions();
      case "colors":
        return this.generateColorQuestions();
      case "shapes":
        return this.generateShapeQuestions();
      case "vocab":
        return this.generateVocabQuestions();
      case "memory":
        return this.generateMemoryQuestions();
      case "sightwords":
        return this.generateSightWordsQuestions();
      case "rhyme":
        return this.generateRhymeQuestions();
      case "math":
        return this.generateMathQuestions();
      case "pattern":
        return this.generatePatternQuestions();
      case "category":
        return this.generateCategoryQuestions();
      case "animals":
        return this.generateAnimalSoundsQuestions();
      default:
        return [];
    }
  }

  loadQuestion() {
    // RESEARCH: Track when question starts for response time measurement
    this.questionStartTime = Date.now();
    this.currentQuestionAttempts = 0;
    
    const activity = this.activities[this.currentActivity];
    const question =
      activity.questions[this.currentQuestion % activity.questions.length];

    // Update question counter (hide for memory)
    const questionCounter = document.getElementById("questionNumber");
    const questionCounterContainer = document.querySelector(".question-counter");
    if (question.type === "memory") {
      // Hide question counter for memory game
      if (questionCounterContainer) {
        questionCounterContainer.classList.add("hidden");
      }
    } else {
      // Show for other activities
      if (questionCounterContainer) {
        questionCounterContainer.classList.remove("hidden");
      }
      const questionNumber = this.currentQuestion + 1;
      if (questionCounter) {
        questionCounter.textContent = questionNumber;
      }
    }

    // Update instruction
    document.getElementById("instruction").textContent =
      `👂 ${question.question}`;

    // Handle Count button for numbers activity
    const countBtn = document.getElementById("countBtn");
    if (question.showCountButton) {
      countBtn.classList.remove("hidden");
      countBtn.textContent = question.countButtonText;
      countBtn.onclick = () => this.openCountModal(question);
    } else {
      countBtn.classList.add("hidden");
    }

    // Clear previous options
    const optionsGrid = document.getElementById("options");
    optionsGrid.innerHTML = "";

    // Special handling for Memory activity
    if (question.type === "memory") {
      this.initializeMemoryGame(question, optionsGrid);
      this.currentQuestionData = question;
      setTimeout(() => this.playInstruction(), 500);
      return;
    }

    // Hide memory stats for non-memory activities
    const memoryStats = document.getElementById("memoryStats");
    if (memoryStats) {
      memoryStats.classList.add("hidden");
    }

    // Add option buttons for other activities
    question.options.forEach((option, index) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.dataset.optionValue = option; // Store the option value for comparison
      
      // Add visual feedback for button press
      btn.addEventListener("mousedown", () => btn.classList.add("active"));
      btn.addEventListener("mouseup", () => btn.classList.remove("active"));
      btn.addEventListener("mouseleave", () => btn.classList.remove("active"));
      btn.addEventListener("touchstart", () => {
        btn.classList.add("active");
      });
      btn.addEventListener("touchend", () => {
        btn.classList.remove("active");
      });
      
      btn.onclick = () => this.handleOptionClick(btn, option, question.target);

      // Handle different activity types
      if (question.type === "shape") {
        const shapeClass = question.optionClasses[index] || "";
        const icon = question.optionIcons[index] || "";
        btn.innerHTML = `
          <div class="${shapeClass}"></div>
          <span class="option-label" style="font-size: 36px; font-weight: 900;">${question.options[index]}</span>
        `;
      } else if (question.type === "color") {
        // For colors, display colored circles only
        const colorMap = {
          Red: "#ff0000",
          Blue: "#0000ff",
          Yellow: "#ffff00",
          Green: "#00ff00",
          Orange: "#ff8800",
          Purple: "#800080",
          Pink: "#ff69b4",
        };
        const color = colorMap[question.options[index]] || "#ccc";
        btn.innerHTML = `
          <div style="width: 100px; height: 100px; border-radius: 50%; background: ${color}; margin: 10px auto; box-shadow: 0 4px 15px rgba(0,0,0,0.2);"></div>
          <span class="option-label" style="font-size: 32px; font-weight: 900;">${question.options[index]}</span>
        `;
      } else if (question.type === "number") {
        const icon = question.icons[index] || "";
        btn.innerHTML = `<span class="option-emoji" style="font-size: 120px;">${icon}</span><span class="option-label" style="font-size: 42px; font-weight: 900;">${question.options[index]}</span>`;
      } else if (question.type === "vocab") {
        const icon = question.optionIcons[index] || "";
        btn.innerHTML = `<span class="option-emoji" style="font-size: 120px;">${icon}</span><span class="option-label" style="font-size: 32px; font-weight: 900;">${question.options[index]}</span>`;
      } else if (question.type === "match") {
        btn.innerHTML = `<span class="option-emoji" style="font-size: 120px;">${option}</span>`;
      } else if (question.type === "sightwords") {
        btn.innerHTML = `<span class="option-label" style="font-size: 48px; font-weight: 900; letter-spacing: 2px;">${option}</span>`;
      } else if (question.type === "rhyme") {
        btn.innerHTML = `<span class="option-label" style="font-size: 44px; font-weight: 900;">${option}</span>`;
      } else if (question.type === "math") {
        btn.innerHTML = `<span class="option-label" style="font-size: 50px; font-weight: 900;">${option}</span>`;
      } else if (question.type === "pattern") {
        btn.innerHTML = `<span class="option-emoji" style="font-size: 120px;">${option}</span>`;
      } else if (question.type === "category") {
        btn.innerHTML = `<span class="option-emoji" style="font-size: 120px;">${option}</span>`;
      } else if (question.type === "animals") {
        const icon = question.optionIcons[index] || "";
        btn.innerHTML = `<span class="option-emoji" style="font-size: 130px;">${icon}</span><span class="option-label" style="font-size: 28px; font-weight: 900;">${question.options[index]}</span>`;
      } else {
        btn.innerHTML = `<span class="option-label" style="font-size: 50px; font-weight: 900;">${option}</span>`;
      }

      optionsGrid.appendChild(btn);
    });

    // Store current question data
    this.currentQuestionData = question;

    // Auto-play instruction after a short delay
    setTimeout(() => this.playInstruction(), 500);
    
    // For animals activity, add visual effect
    if (question.type === "animals") {
      const instruction = document.getElementById("instruction");
      if (instruction) {
        instruction.innerHTML = `🎵🐾 <strong>Listen to the sound and find the animal!</strong> 🐾🎵`;
      }
    }
  }

  initializeMemoryGame(question, container) {
    // Initialize memory game state
    this.memoryState = {
      deck: question.deck,
      flippedCards: [],
      matchedPairs: [],
      isProcessing: false,
      moves: 0,
      startTime: Date.now(),
    };

    // Show memory stats display
    const memoryStats = document.getElementById("memoryStats");
    if (memoryStats) {
      memoryStats.classList.remove("hidden");
    }

    // Update total pairs count and reset stats
    const totalPairs = question.deck.length / 2;
    const totalPairsElement = document.getElementById("totalPairs");
    const pairsFoundElement = document.getElementById("pairsFound");
    const movesCountElement = document.getElementById("movesCount");
    
    if (totalPairsElement) {
      totalPairsElement.textContent = totalPairs;
    }
    if (pairsFoundElement) {
      pairsFoundElement.textContent = "0";
    }
    if (movesCountElement) {
      movesCountElement.textContent = "0";
    }

    // Make grid responsive to deck size
    const pairsCount = totalPairs;
    let gridCols = 4; // Default
    if (pairsCount <= 3) gridCols = 2;
    else if (pairsCount <= 6) gridCols = 4;
    else if (pairsCount <= 8) gridCols = 4;
    else if (pairsCount <= 12) gridCols = 4;
    else gridCols = 5;

    container.style.display = "grid";
    container.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;
    container.style.gap = "12px";
    container.style.justifyItems = "center";

    // Create memory cards from deck
    question.deck.forEach((card) => {
      const cardBtn = document.createElement("button");
      cardBtn.className = "memory-card";
      cardBtn.dataset.cardId = card.id;
      cardBtn.dataset.matchKey = card.matchKey;
      cardBtn.innerHTML = `<span class="memory-card-face">?</span>`;

      cardBtn.onclick = (e) => {
        e.preventDefault();
        this.flipMemoryCard(cardBtn, card);
      };

      container.appendChild(cardBtn);
    });

    // Show preview if specified
    if (question.previewTime > 0) {
      this.showMemoryPreview(question.deck, question.previewTime);
    }

    // Show hint button for memory game
    const hintBtn = document.getElementById("hintBtn");
    if (hintBtn) {
      hintBtn.classList.remove("hidden");
    }
  }

  flipMemoryCard(cardElement, cardData) {
    // Prevent flipping if game is processing or card already matched
    if (
      this.memoryState.isProcessing ||
      this.memoryState.matchedPairs.includes(cardData.pairId)
    ) {
      return;
    }

    // Prevent flipping same card twice
    if (this.memoryState.flippedCards.some((c) => c.cardId === cardData.id)) {
      return;
    }

    // Flip the card
    cardElement.classList.add("flipped");
    cardElement.innerHTML = `<span class="memory-card-face">${cardData.display}</span>`;

    this.memoryState.flippedCards.push({
      cardId: cardData.id,
      pairId: cardData.pairId,
      element: cardElement,
    });

    // Check for match when 2 cards are flipped
    if (this.memoryState.flippedCards.length === 2) {
      this.memoryState.moves++;
      // Update moves display
      const movesCountElement = document.getElementById("movesCount");
      if (movesCountElement) {
        movesCountElement.textContent = this.memoryState.moves;
      }
      this.checkMemoryMatch();
    }
  }

  checkMemoryMatch() {
    this.memoryState.isProcessing = true;

    const [card1, card2] = this.memoryState.flippedCards;
    const isMatch = card1.pairId === card2.pairId;

    if (isMatch) {
      // Match found - keep cards flipped and mark as matched
      this.memoryState.matchedPairs.push(card1.pairId);
      card1.element.classList.add("matched");
      card2.element.classList.add("matched");

      // Update pairs found display
      const pairsFoundElement = document.getElementById("pairsFound");
      if (pairsFoundElement) {
        pairsFoundElement.textContent = this.memoryState.matchedPairs.length;
      }

      // Play success sound
      if (this.soundEnabled) {
        this.playSound("correct");
      }

      this.showFeedback("✅ Match Found!", "correct");

      // Hide feedback after a delay
      setTimeout(() => {
        document.getElementById("feedback").classList.add("hidden");
      }, 1000);

      this.memoryState.flippedCards = [];
      this.memoryState.isProcessing = false;

      // Check if all pairs matched
      if (
        this.memoryState.matchedPairs.length ===
        this.memoryState.deck.length / 2
      ) {
        setTimeout(() => {
          this.completeMemoryGame();
        }, 800);
      }
    } else {
      // No match - flip cards back
      setTimeout(() => {
        card1.element.classList.remove("flipped");
        card2.element.classList.remove("flipped");
        card1.element.innerHTML = `<span class="memory-card-face">?</span>`;
        card2.element.innerHTML = `<span class="memory-card-face">?</span>`;

        // Play error sound
        if (this.soundEnabled) {
          this.playSound("incorrect");
        }

        this.showFeedback("💪 Try Again!", "incorrect");

        // Hide feedback after a delay
        setTimeout(() => {
          document.getElementById("feedback").classList.add("hidden");
        }, 1000);

        this.memoryState.flippedCards = [];
        this.memoryState.isProcessing = false;
      }, 1200);
    }
  }

  showMemoryPreview(deck, previewTime) {
    const cards = document.querySelectorAll(".memory-card");

    // Show all cards temporarily
    cards.forEach((cardElement, index) => {
      const cardData = deck[index];
      cardElement.classList.add("flipped", "preview");
      cardElement.innerHTML = `<span class="memory-card-face">${cardData.display}</span>`;
    });

    // Flip back after preview time
    setTimeout(() => {
      cards.forEach((cardElement) => {
        cardElement.classList.remove("flipped", "preview");
        cardElement.innerHTML = `<span class="memory-card-face">?</span>`;
      });
    }, previewTime);
  }

  showMemoryHint() {
    // Prevent hint if game is processing or no cards are matched yet
    if (this.memoryState.isProcessing || !this.memoryState.deck) {
      return;
    }

    const cards = document.querySelectorAll(".memory-card");

    // Show all non-matched cards temporarily
    cards.forEach((cardElement, index) => {
      const cardData = this.memoryState.deck[index];

      // Skip if card is already matched or already flipped by player
      if (
        !this.memoryState.matchedPairs.includes(cardData.pairId) &&
        !cardElement.classList.contains("flipped")
      ) {
        cardElement.classList.add("flipped", "hint");
        cardElement.innerHTML = `<span class="memory-card-face">${cardData.display}</span>`;
      }
    });

    // Flip back after 2 seconds
    setTimeout(() => {
      cards.forEach((cardElement) => {
        if (cardElement.classList.contains("hint")) {
          cardElement.classList.remove("flipped", "hint");
          cardElement.innerHTML = `<span class="memory-card-face">?</span>`;
        }
      });
    }, 2000);
  }

  completeMemoryGame() {
    const elapsed = Math.round(
      (Date.now() - this.memoryState.startTime) / 1000,
    );
    const pairs = this.memoryState.matchedPairs.length;

    // Calculate score based on moves and time
    const baseScore = 50;
    const moveBonus = Math.max(0, 30 - this.memoryState.moves);
    const timeBonus = Math.max(0, 20 - Math.floor(elapsed / 10));

    const earnedPoints = baseScore + moveBonus + timeBonus;
    this.score += earnedPoints;

    document.getElementById("activityScore").textContent = this.score;

    this.showFeedback(
      `🎉 Perfect! ${pairs} pairs matched in ${this.memoryState.moves} moves!`,
      "correct",
    );

    // Track session data
    this.sessionData.push({
      activity: this.currentActivity,
      pairs: pairs,
      moves: this.memoryState.moves,
      time: elapsed,
      points: earnedPoints,
      timestamp: Date.now(),
    });

    this.stats.totalQuestionsAnswered++;
    this.stats.correctAnswers++;

    this.checkAchievements();
    this.updateDailyChallenge();

    // Move to reward after delay
    setTimeout(() => {
      this.finishActivity();
    }, 2000);
  }

  openCountModal(question) {
    const modal = document.getElementById("countModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalObjects = document.getElementById("modalObjects");

    modalTitle.textContent = question.modalTitle;
    modalObjects.innerHTML = question.modalObjects
      .map((o) => `<span>${o}</span>`)
      .join("");

    if (question.overflow) {
      modalObjects.innerHTML += "<span>...</span>";
    }

    modal.classList.add("show");
  }

  playInstruction() {
    const question = this.currentQuestionData;
    
    // For animals, add visual bounce effect
    if (question.type === "animals") {
      this.showAnimalBounceEffect();
    }
    
    this.speak(question.sound);
  }

  showAnimalBounceEffect() {
    const instruction = document.getElementById("instruction");
    if (!instruction) return;
    
    // Add bounce animation
    instruction.style.animation = "none";
    setTimeout(() => {
      instruction.style.animation = "bounce 0.6s ease-in-out";
    }, 10);
  }

  handleOptionClick(buttonElement, selected, target) {
    // Ignore clicks on disabled buttons
    if (buttonElement.disabled) return;
    
    // Check if this is the same button being clicked again (confirmation tap)
    if (this.pendingSelection === selected) {
      // Second tap - confirm the answer
      this.clearPendingSelection();
      this.playSound("confirm");
      this.checkAnswer(selected, target);
    } else {
      // First tap - mark as pending and await confirmation
      this.clearPendingSelection();
      this.pendingSelection = selected;
      buttonElement.classList.add("pending");
      
      // Play audio feedback for first tap
      this.playSound("pending");
      
      // Show visual feedback
      const instructionEl = document.getElementById("instruction");
      if (instructionEl) {
        instructionEl.innerHTML = "✋ <strong>Tap again to confirm!</strong>";
        instructionEl.style.color = "#f59e0b";
        instructionEl.style.fontSize = "44px";
        instructionEl.style.fontWeight = "bold";
      }
    }
  }

  clearPendingSelection() {
    if (this.pendingSelection !== null) {
      // Remove pending class from all buttons
      document.querySelectorAll(".option-btn.pending").forEach((btn) => {
        btn.classList.remove("pending");
      });
      this.pendingSelection = null;
      
      // Reset instruction text
      const instructionEl = document.getElementById("instruction");
      if (instructionEl && instructionEl.textContent.includes("Tap again")) {
        instructionEl.innerHTML = "Listen...";
        instructionEl.style.color = "#764ba2";
        instructionEl.style.fontSize = "44px";
        instructionEl.style.fontWeight = "900";
      }
    }
  }

  checkAnswer(selected, target) {
    // Store the selected option for feedback
    this.selectedOption = selected;
    // Compare as strings to handle both emojis and text
    const isCorrect = String(selected) === String(target);
    const buttons = document.querySelectorAll(".option-btn");

    buttons.forEach((btn) => {
      btn.disabled = true;
    });

    if (isCorrect) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer();
    }
  }

  handleCorrectAnswer() {
    // Animate correct button - find and highlight it
    const targetStr = String(this.currentQuestionData.target);
    document.querySelectorAll(".option-btn").forEach((btn) => {
      const btnContent = btn.textContent.trim();
      if (btnContent === targetStr) {
        btn.classList.add("correct");
      }
    });

    // Show feedback
    this.showFeedback("✅ Great! 🎉", "correct");

    // RESEARCH SCORING: +1 for correct (simple binary for research study)
    const pointsEarned = 1;
    this.score += pointsEarned;
    document.getElementById("activityScore").textContent = this.score;

    // Get question data for research tracking
    const difficulty = this.currentQuestionData.difficulty || "medium";
    const questionData = {
      activity: this.currentActivity,
      questionNumber: this.currentQuestion,
      isCorrect: true,
      pointsEarned: pointsEarned,
      difficulty: difficulty,
      timestamp: Date.now(),
      responseTime: this.questionStartTime ? Date.now() - this.questionStartTime : 0,
      attemptNumber: this.currentQuestionAttempts || 1
    };
    
    // Update statistics and tracking (centralized logic)
    this.updateStatisticsAndTracking(questionData, true);

    // Check for achievements
    this.checkAchievements();
    this.updateDailyChallenge();

    // Play reward sound
    if (this.soundEnabled) {
      this.playSound("correct");
    }

    // Move to next question or finish
    setTimeout(() => {
      this.currentQuestion++;
      // Hide feedback before loading next question
      document.getElementById("feedback").classList.add("hidden");
      if (this.currentQuestion < 5) {
        this.loadQuestion();
      } else {
        this.finishActivity();
      }
    }, 1500);
  }

  handleIncorrectAnswer() {
    // Animate incorrect button
    document.querySelectorAll(".option-btn").forEach((btn) => {
      btn.classList.add("incorrect");
    });

    // Show feedback
    this.showFeedback("💪 Try Again!", "incorrect");

    // RESEARCH SCORING: No deduction - just track incorrect response
    const pointsEarned = 0;
    const difficulty = this.currentQuestionData.difficulty || "medium";
    const selectedAnswer = this.selectedOption || "no_response";
    
    // Track session data with COMPREHENSIVE RESEARCH METRICS
    const questionData = {
      activity: this.currentActivity,
      questionNumber: this.currentQuestion,
      isCorrect: false,
      pointsEarned: pointsEarned,
      selectedAnswer: String(selectedAnswer),
      correctAnswer: String(this.currentQuestionData?.target || "unknown"),
      difficulty: difficulty,
      timestamp: Date.now(),
      responseTime: this.questionStartTime ? Date.now() - this.questionStartTime : 0,
      attemptNumber: this.currentQuestionAttempts || 1
    };
    
    // Update statistics and tracking (centralized logic)
    this.updateStatisticsAndTracking(questionData, false);

    // Play error sound
    this.playSound("incorrect");

    // Retry the same question
    setTimeout(() => {
      document.querySelectorAll(".option-btn").forEach((btn) => {
        btn.classList.remove("incorrect");
        btn.disabled = false;
      });
      document.getElementById("feedback").classList.add("hidden");
    }, 1200);
  }

  updateStatisticsAndTracking(questionData, isCorrect) {
    // Centralized method to update stats and track learning
    // Add question data to session
    this.sessionData.push(questionData);
    
    // Update stats totals
    this.stats.totalQuestionsAnswered++;
    if (isCorrect) {
      this.stats.correctAnswers++;
    } else {
      this.stats.wrongAnswers++;
    }
    
    // Calculate and track accuracy percentage
    this.stats.accuracy = (this.stats.correctAnswers / this.stats.totalQuestionsAnswered) * 100;
    
    // Track learning curve over time
    if (!this.stats.learningCurve) this.stats.learningCurve = [];
    this.stats.learningCurve.push({
      questionNumber: this.stats.totalQuestionsAnswered,
      accuracy: this.stats.accuracy,
      timestamp: Date.now()
    });
  }

  showFeedback(message, type) {
    const feedback = document.getElementById("feedback");
    const activityScreen = document.getElementById("activity-screen");
    
    // Remove hidden class to show feedback as centered modal
    feedback.classList.remove("hidden");
    feedback.textContent = message;
    feedback.className = `feedback ${type} feedback-modal`;
    
    // Apply blur effect to background activity screen
    if (activityScreen) {
      activityScreen.classList.add("blur-bg");
    }
    
    // Auto-remove blur after feedback hides
    setTimeout(() => {
      if (activityScreen) {
        activityScreen.classList.remove("blur-bg");
      }
    }, 2000);
  }

  finishActivity() {
    // 📊 RECORD DAILY STATISTICS WHEN ACTIVITY COMPLETES
    this.recordDailyStatistics();
    
    // Check if plant should grow based on score NOW (after activity completes)
    this.checkPlantGrowth();
    // Auto-save progress after activity
    this.saveGameState();
    // Show reward screen
    this.showRewardScreen();
  }

  // ==================== PLANT GROWTH SYSTEM ====================

  checkPlantGrowth() {
    // Check if current score is enough for next stage
    const scoreNeededForNextStage = this.scorePerStage[this.plantStage];

    if (
      this.score >= scoreNeededForNextStage &&
      this.plantStage < this.plantStages.length - 1
    ) {
      this.plantStageAtFinish = true; // Mark that plant grew during this activity
      this.growPlant();
    } else {
      this.plantStageAtFinish = false;
    }
  }

  growPlant() {
    if (this.plantStage < this.plantStages.length - 1) {
      this.plantStage++;
      this.saveSavedProgress();
      // Show growth notification
      this.showPlantGrowthNotification();
    }
  }

  showPlantGrowthNotification() {
    const message = `🌱 Your plant grew to ${this.plantNames[this.plantStage]}! 🎉`;
    this.speak(message);
  }

  updateGardenDisplay() {
    const plant = document.getElementById("plant");
    const plantStage = document.getElementById("plantStage");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");

    plant.textContent = this.plantStages[this.plantStage];
    plantStage.textContent = this.plantNames[this.plantStage];

    // Calculate progress toward next stage based on score
    const currentStageScore =
      this.plantStage > 0 ? this.scorePerStage[this.plantStage - 1] : 0;
    const nextStageScore =
      this.scorePerStage[this.plantStage] ||
      this.scorePerStage[this.scorePerStage.length - 1];
    const scoreInCurrentStage = this.score - currentStageScore;
    const scoreNeededForNextStage = nextStageScore - currentStageScore;
    const progress = (scoreInCurrentStage / scoreNeededForNextStage) * 100;

    progressFill.style.width = Math.min(progress, 100) + "%";
    // Reference the specific target score for the current stage
    const targetScore = this.scorePerStage[this.plantStage];

    progressText.textContent = `Score: ${this.score} / Stage ${this.plantStage + 1} (Goal: ${targetScore})`;

    document.getElementById("score").textContent = this.score;

    // Update streak display
    const streakCounter = document.getElementById("streakCounter");
    if (streakCounter) streakCounter.textContent = this.streak;

    // Update header with user name
    const header = document.querySelector(".header");
    const nameSpan = document.getElementById("playerName");

    if (this.userName) {
      if (nameSpan) {
        // Update existing span with new name
        nameSpan.textContent = this.userName;
      } else {
        // Create new span if it doesn't exist
        const newSpan = document.createElement("span");
        newSpan.id = "playerName";
        newSpan.className = "player-name";
        newSpan.textContent = this.userName;
        header.appendChild(newSpan);
      }
    } else {
      // Remove the span if there's no userName
      if (nameSpan) {
        header.removeChild(nameSpan);
      }
    }

    // Update the name in the garden header
    const nameOfPlayer = document.getElementById("nameOfPlayer");

    if (this.userName) {
      if (nameOfPlayer) {
        nameOfPlayer.textContent = this.userName;
        // Add click listener for logout
        nameOfPlayer.addEventListener("click", () => this.handleUsernameClick());
      }
    } else {
      // If no userName, clear the span
      if (nameOfPlayer) {
        nameOfPlayer.textContent = "Friend";
        nameOfPlayer.addEventListener("click", () => this.handleUsernameClick());
      }
    }
  }

  // ==================== REWARD & FEEDBACK ====================

  showRewardScreen() {
    const rewardPlant = document.getElementById("rewardPlant");
    const rewardMessage = document.getElementById("rewardMessage");

    rewardPlant.textContent = this.plantStages[this.plantStage];

    if (this.plantStageAtFinish) {
      rewardMessage.textContent = `🎉 Your garden grows! Stage: ${this.plantNames[this.plantStage]} 🎉`;
    } else {
      rewardMessage.textContent = "🌟 Excellent Work! Keep Learning! 🌟";
    }

    this.playConfetti();
    this.playSound("reward");
    this.showScreen("rewardScreen");
  }

  closeReward() {
    this.backToGarden();
  }

  playConfetti() {
    const confettiContainer = document.getElementById("confetti");
    confettiContainer.innerHTML = "";

    for (let i = 0; i < 30; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.delay = Math.random() * 0.3 + "s";
      piece.style.background = ["#84fab0", "#8fd3f4", "#ffa07a", "#98d8c8"][
        Math.floor(Math.random() * 4)
      ];
      confettiContainer.appendChild(piece);
    }

    setTimeout(() => {
      confettiContainer.innerHTML = "";
    }, 3300);
  }

  // ==================== AUDIO SYSTEM ====================

  speak(text) {
    // Use Web Speech API with optimized voice selection to reduce delays
    if ("speechSynthesis" in window && this.soundEnabled) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      // Kid-friendly voice settings
      utterance.rate = 0.9; // Slightly faster for responsiveness
      utterance.pitch = 1.2; // Friendly pitch
      utterance.volume = Math.max(0.5, this.bgmVolume); // Use BGM volume
      utterance.lang = "en-US";
      
      // Use cached voices or get fresh ones
      if (!this.cachedVoices) {
        this.cachedVoices = speechSynthesis.getVoices();
      }
      
      if (this.cachedVoices.length > 0) {
        // Prefer female voice for kids, fallback to first available
        const childVoice = this.cachedVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes('female') || name.includes('woman') || name.includes('child') || name.includes('kid');
        }) || this.cachedVoices[0];
        utterance.voice = childVoice;
      }

      // Use set timeout to ensure speech synthesis is ready
      setTimeout(() => {
        try {
          speechSynthesis.speak(utterance);
        } catch (e) {
          console.debug("Speech synthesis unavailable");
        }
      }, 10);
    }
  }

  playSound(type) {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();

      // Resume audio context if suspended (mobile requirement)
      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {
          console.log("Could not resume audio context");
        });
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === "pending") {
        // Soft tone for first tap confirmation
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.1,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } else if (type === "confirm") {
        // Two-tone chime for confirmation
        oscillator.frequency.value = 900;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.15,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);

        // Second tone
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1100;
        gain2.gain.setValueAtTime(0.2, audioContext.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.2,
        );
        osc2.start(audioContext.currentTime + 0.05);
        osc2.stop(audioContext.currentTime + 0.2);
      } else if (type === "correct") {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (type === "incorrect") {
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.2,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } else if (type === "reward") {
        // Play a simple melody
        const notes = [
          { freq: 523, duration: 0.1 },
          { freq: 659, duration: 0.1 },
          { freq: 784, duration: 0.2 },
        ];

        notes.forEach((note, index) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);

          const startTime = audioContext.currentTime + index * 0.12;
          osc.frequency.value = note.freq;
          gain.gain.setValueAtTime(0.2, startTime);
          gain.gain.exponentialRampToValueAtTime(
            0.01,
            startTime + note.duration,
          );
          osc.start(startTime);
          osc.stop(startTime + note.duration);
        });
      }
    } catch (error) {
      console.log("Audio not available:", error);
    }
  }

  playAnimalCelebrationSound() {
    // Fun celebratory sound for identifying animals correctly
    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();

      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {
          console.log("Could not resume audio context");
        });
      }

      // Play a fun ascending melody
      const celebrationNotes = [
        { freq: 523, duration: 0.1 },
        { freq: 659, duration: 0.1 },
        { freq: 784, duration: 0.1 },
        { freq: 987, duration: 0.2 },
        { freq: 1047, duration: 0.3 }
      ];

      celebrationNotes.forEach((note, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);

        const startTime = audioContext.currentTime + index * 0.12;
        osc.frequency.value = note.freq;
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          startTime + note.duration,
        );
        osc.start(startTime);
        osc.stop(startTime + note.duration);
      });
    } catch (error) {
      console.log("Animal celebration sound not available:", error);
    }
  }

  // ==================== BGM SYSTEM ====================

  initializeBGM() {
    // Prevent re-initialization if audio already exists
    if (this.bgmAudio && this.bgmAudio.src) {
      return;
    }

    // Create audio element for BGM
    this.bgmAudio = new Audio();
    this.bgmAudio.src = "assets/themeBGM.mp3";
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = this.bgmVolume;
    this.bgmAudio.crossOrigin = "anonymous";
    
    // Preload audio for faster playback
    this.bgmAudio.preload = "auto";
    
    // Handle errors gracefully (e.g., file not found, offline)
    this.bgmAudio.onerror = () => {
      console.debug("⚠️ BGM file not available - continuing without music");
      this.bgmAvailable = false;
    };
    
    this.bgmAudio.oncanplaythrough = () => {
      this.bgmAvailable = true;
    };
    
    // Set flag to indicate whether BGM is available
    this.bgmAvailable = true;
  }

  playBGM() {
    // Only attempt to play if BGM is available
    if (!this.bgmAudio || !this.bgmAvailable) {
      this.initializeBGM();
    }
    
    if (!this.bgmAudio) return;
    
    try {
      // Only play if currently paused
      if (this.bgmAudio.paused) {
        const playPromise = this.bgmAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.debug("BGM playback prevented - user gesture may be required or file unavailable");
          });
        }
      }
    } catch (error) {
      console.debug("BGM playback unavailable:", error.message);
    }
  }

  stopBGM() {
    if (!this.bgmAudio) return;
    this.bgmAudio.pause();
    this.bgmAudio.currentTime = 0;
  }


  setBGMVolume(volume) {
    // Volume input is slider value 0-100
    // Convert to actual volume range 0-0.2 (where 0.2 is max BGM volume)
    let sliderValue = parseFloat(volume);
    this.bgmVolume = Math.max(0, Math.min(0.2, (sliderValue / 100) * 0.2));
    localStorage.setItem("bgmVolume", this.bgmVolume);

    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmVolume;
    }
    
    // Update the display immediately (show percentage relative to 0-20 range)
    const bgmPercent = document.getElementById("bgmVolPercent");
    if (bgmPercent) {
      bgmPercent.textContent = Math.round((this.bgmVolume / 0.2) * 100) + "%";
    }
  }

  toggleBGMFromCheckbox() {
    const bgmCheckbox = document.getElementById("bgmEnableCheckbox");
    if (bgmCheckbox) {
      this.bgmEnabled = bgmCheckbox.checked;
      localStorage.setItem("bgmEnabled", this.bgmEnabled);

      if (this.bgmEnabled) {
        this.playBGM();
      } else {
        this.stopBGM();
      }
    }
  }

  // ==================== SOUND SETTINGS MODAL ====================

  showSoundSettings() {
    // Remove existing modal if any
    const existingModal = document.getElementById("soundSettingsModal");
    if (existingModal) existingModal.remove();

    const html = `
      <div id="soundSettingsModal" class="modal show">
        <div class="modal-content modal-sound-settings">
          <div class="modal-header">
            <h2>🔊 Sound & Music Settings</h2>
            <button class="modal-close" onclick="game.closeModal('soundSettingsModal')">✕</button>
          </div>
          <div class="modal-body">        

            <!-- BGM Volume -->
            <div class="sound-setting-item">
              <div class="setting-label">
                <span class="setting-icon">🎵</span>
                <span class="setting-name">Background Music</span>
                <span class="volume-percent" id="bgmVolPercent">${Math.round((this.bgmVolume / 0.2) * 100)}%</span>
              </div>
              <input 
                type="range" 
                class="volume-slider" 
                id="bgmVolSlider"
                min="0" 
                max="100" 
                value="${(this.bgmVolume / 0.2) * 100}"
                oninput="game.setBGMVolume(this.value)"
              />
              <label class="toggle-label">
                <input 
                  type="checkbox" 
                  id="bgmEnableCheckbox"
                  ${this.bgmEnabled ? "checked" : ""}
                  onchange="game.toggleBGMFromCheckbox()"
                  class="toggle-checkbox"
                />
                <span class="toggle-text">Enable Music</span>
              </label>
            </div>

            <!-- Sound Effects Volume -->
            <div class="sound-setting-item">
              <div class="setting-label">
                <span class="setting-icon">🎮</span>
                <span class="setting-name">Sound Effects</span>
                <span class="volume-percent" id="sfxVolPercent">100%</span>
              </div>
              <input 
                type="range" 
                class="volume-slider" 
                id="sfxVolSlider"
                min="0" 
                max="100" 
                value="100"
                oninput="game.setSFXVolume(this.value / 100)"
              />
            </div>

            <!-- Sound Toggle -->
            <div class="sound-setting-item">
              <button class="sound-test-btn" onclick="game.playSound('correct')">
                🔊 Test Sound
              </button>
            </div>

            <!-- Info Box -->
            <div class="sound-info-box">
              <p>💡 Adjust the volume levels to your preference. BGM will continue playing in the background!</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    // Update volume displays
    this.updateVolumeDisplay();
  }

  updateVolumeDisplay() {
    const bgmPercent = document.getElementById("bgmVolPercent");
    const sfxPercent = document.getElementById("sfxVolPercent");

    if (bgmPercent) {
      bgmPercent.textContent = Math.round(this.bgmVolume * 100) + "%";
    }
    if (sfxPercent) {
      sfxPercent.textContent = Math.round(this.sfxVolume * 100) + "%";
    }
     
    // Enable/disable sound based on volume
    this.soundEnabled = normalizedVolume > 0;
    localStorage.setItem("soundEnabled", this.soundEnabled);

    // Update the display
    const soundIcon = document.getElementById("soundIcon");
    if (soundIcon) {
      soundIcon.textContent = normalizedVolume > 0 ? "🔊" : "🔇";
    }
  }

  setSFXVolume(volume) {
    // Store SFX volume for future sound effects
    localStorage.setItem("sfxVolume", volume);

    const sfxPercent = document.getElementById("sfxVolPercent");
    if (sfxPercent) {
      sfxPercent.textContent = Math.round(volume * 100) + "%";
    }
  }

  // ==================== ACHIEVEMENTS & FEATURES ====================

  loadAchievements() {
    const saved = localStorage.getItem("achievements");
    return saved
      ? JSON.parse(saved)
      : {
          first100: false,
          alphabet_master: false,
          numbers_master: false,
          streak5: false,
          streak10: false,
          all_games: false,
          score500: false,
          score1000: false,
        };
  }

  saveAchievements() {
    localStorage.setItem("achievements", JSON.stringify(this.achievements));
    this.saveGameState();
  }

  checkAchievements() {
    // Only trigger achievements outside of activities
    if (this.currentActivity !== null) return;

    // First 100 points
    if (this.score >= 100 && !this.achievements.first100) {
      this.achievements.first100 = true;
      this.showAchievementNotification("🏅 First 100 Points!");
    }

    // 500 points
    if (this.score >= 500 && !this.achievements.score500) {
      this.achievements.score500 = true;
      this.showAchievementNotification("🏆 500 Points Achieved!");
    }

    // 1000 points
    if (this.score >= 1000 && !this.achievements.score1000) {
      this.achievements.score1000 = true;
      this.showAchievementNotification("👑 1000 Points Legend!");
    }

    this.saveAchievements();
  }

  showAchievementNotification(message) {
    this.speak(message);
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("show");
      // Ensure modal is hidden by adding a small delay for CSS transition
      setTimeout(() => {
        if (modal.parentNode) {
          modal.remove();
        }
      }, 300);
    }
  }

  loadStats() {
    const saved = localStorage.getItem("gameStats");
    return saved
      ? JSON.parse(saved)
      : {
          totalSessions: 0,
          totalQuestionsAnswered: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          lastPlayDate: null,
          favoriteActivity: "alphabet",
          gamesPlayed: {},
        };
  }

  updateStats() {
    this.stats.totalSessions++;
    this.stats.lastPlayDate = new Date().toISOString();
    if (!this.stats.gamesPlayed[this.currentActivity]) {
      this.stats.gamesPlayed[this.currentActivity] = 0;
    }
    this.stats.gamesPlayed[this.currentActivity]++;
    this.saveGameState();
  }

  getStatistics() {
    const accuracy =
      this.stats.totalQuestionsAnswered > 0
        ? (
            (this.stats.correctAnswers / this.stats.totalQuestionsAnswered) *
            100
          ).toFixed(1)
        : 0;

    return {
      sessionCount: this.stats.totalSessions,
      totalQuestions: this.stats.totalQuestionsAnswered,
      correctAnswers: this.stats.correctAnswers,
      wrongAnswers: this.stats.wrongAnswers || 0,
      accuracy: accuracy,
      score: this.score,
      plantStage: this.plantStage,
      streak: this.streak,
    };
  }

  initializeDailyChallenge() {
    const saved = localStorage.getItem("dailyChallenge");
    const today = new Date().toDateString();

    if (saved) {
      const challenge = JSON.parse(saved);
      if (challenge.date !== today) {
        // New day, reset challenge with random target
        const targets = [8, 10, 12, 15, 5];
        const randomTarget =
          targets[Math.floor(Math.random() * targets.length)];
        return {
          date: today,
          completed: false,
          target: randomTarget,
          description: this.getDailyChallengeDescription(randomTarget),
        };
      }
      return challenge;
    }
    const targets = [8, 10, 12, 15, 5];
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    return {
      date: today,
      completed: false,
      target: randomTarget,
      description: this.getDailyChallengeDescription(randomTarget),
    };
  }

  getDailyChallengeDescription(target) {
    const descriptions = {
      5: "Quick Challenge: 5 questions to start your day!",
      8: "Regular Challenge: Answer 8 questions!",
      10: "Standard Challenge: Complete 10 questions!",
      12: "Extended Challenge: Tackle 12 questions!",
      15: "Master Challenge: 15 questions for experts!",
    };
    return descriptions[target] || `Answer ${target} questions!`;
  }

  updateDailyChallenge() {
    const questions = this.sessionData.length;
    if (
      questions >= this.dailyChallenge.target &&
      !this.dailyChallenge.completed
    ) {
      this.dailyChallenge.completed = true;
      // Only speak if not in an activity (reward screen)
      if (this.currentActivity === null) {
        this.speak("🎉 Daily Challenge Complete! Great Job!");
      }
      localStorage.setItem(
        "dailyChallenge",
        JSON.stringify(this.dailyChallenge),
      );
    }
  }

  updateStreak() {
    const today = new Date().toDateString();
    const lastPlayDate = localStorage.getItem("lastPlayDate");
    const savedStreak = parseInt(localStorage.getItem("streak")) || 0;

    // If never played before
    if (!lastPlayDate) {
      this.streak = 1;
      localStorage.setItem("lastPlayDate", today);
      localStorage.setItem("streak", this.streak);
      return;
    }

    // Already played today - don't update
    if (lastPlayDate === today) {
      this.streak = savedStreak; // Keep existing streak
      return;
    }

    // Calculate if it's been exactly 1 day
    const lastDate = new Date(lastPlayDate);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Continued streak - played yesterday, playing today
      this.streak = savedStreak + 1;
    } else if (daysDiff > 1) {
      // Streak broken - missed one or more days
      console.log(`⚠️ Streak broken! Missed ${daysDiff} days`);
      this.streak = 1; // Reset to 1 for today
    } else {
      // Same day (shouldn't happen but safety check)
      this.streak = savedStreak;
    }

    // Save updated values
    localStorage.setItem("lastPlayDate", today);
    localStorage.setItem("streak", this.streak);

    // Show notifications for streaks
    if (this.streak >= 5 && !this.achievements.streak5) {
      this.achievements.streak5 = true;
      this.showAchievementNotification("🔥 5 Day Streak!");
    }
    if (this.streak >= 10 && !this.achievements.streak10) {
      this.achievements.streak10 = true;
      this.showAchievementNotification("🔥 10 Day Streak! Amazing!");
    }
  }

  toggleSound() {
    this.showSoundSettings();
  }

  showStatistics() {
    const stats = this.getStatistics();
    const modalHTML = `
      <div id="statsModal" class="modal show">
        <div class="modal-content modal-statistics">
          <div class="modal-header">
            <h2>Your Statistics</h2>
            <button class="modal-close" onclick="game.closeModal('statsModal')">✕</button>
          </div>
          <div class="modal-body">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="value">${stats.sessionCount}</div>
                <div class="label">Sessions</div>
              </div>
              <div class="stat-item">
                <div class="value">${stats.totalQuestions}</div>
                <div class="label">Questions</div>
              </div>
              <div class="stat-item">
                <div class="value" style="color: #2ecc71;">${stats.correctAnswers}</div>
                <div class="label">Correct</div>
              </div>
              <div class="stat-item">
                <div class="value" style="color: #ff6b6b;">${stats.wrongAnswers}</div>
                <div class="label">Mistakes</div>
              </div>
              <div class="stat-item">
                <div class="value" style="color: #2ecc71;">${stats.accuracy}%</div>
                <div class="label">Accuracy</div>
              </div>
              <div class="stat-item">
                <div class="value" style="color: #f1c40f;">${stats.score}</div>
                <div class="label">Total Score</div>
              </div>
              <div class="stat-item">
                <div class="value" style="color: #ff9800;">${this.plantNames[stats.plantStage]}</div>
                <div class="label">Plant Stage</div>
              </div>
              <div class="stat-item">
                <div class="value" style="color: #ff9800;">${stats.streak}</div>
                <div class="label">Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const existingModal = document.getElementById("statsModal");
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  showAchievements() {
    const achievements = [
      {
        id: "first100",
        icon: "🏅",
        name: "First Steps",
        description: "Earn 100 points",
        unlocked: this.achievements.first100,
      },
      {
        id: "score500",
        icon: "🏆",
        name: "Score Master",
        description: "Reach 500 points",
        unlocked: this.achievements.score500,
      },
      {
        id: "score1000",
        icon: "👑",
        name: "Legend",
        description: "Reach 1000 points",
        unlocked: this.achievements.score1000,
      },
      {
        id: "accuracy90",
        icon: "🎯",
        name: "Sharpshooter",
        description: "90% Accuracy",
        unlocked:
          this.stats.totalQuestionsAnswered > 0 &&
          (this.stats.correctAnswers / this.stats.totalQuestionsAnswered) *
            100 >=
            90,
      },
      {
        id: "streak5",
        icon: "🔥",
        name: "Hot Streak",
        description: "5 Day Streak",
        unlocked: this.streak >= 5,
      },
      {
        id: "streak10",
        icon: "🔥🔥",
        name: "Unstoppable",
        description: "10 Day Streak",
        unlocked: this.streak >= 10,
      },
      {
        id: "questions100",
        icon: "📚",
        name: "Century",
        description: "Answer 100 questions",
        unlocked: this.stats.totalQuestionsAnswered >= 100,
      },
      {
        id: "perfect_day",
        icon: "✨",
        name: "Perfect Day",
        description: "100% Accuracy in one session",
        unlocked: false,
      },
      {
        id: "all_games",
        icon: "🎮",
        name: "All Games Master",
        description: "Play all 14 activities",
        unlocked: Object.keys(this.stats.gamesPlayed || {}).length >= 14,
      },
      {
        id: "plant_stage5",
        icon: "🌳",
        name: "Gardener",
        description: "Reach Plant Stage 5",
        unlocked: this.plantStage >= 5,
      },
      {
        id: "plant_stage10",
        icon: "🌲",
        name: "Botanist",
        description: "Reach Plant Stage 10",
        unlocked: this.plantStage >= 10,
      },
    ];

    const badgesHTML = achievements
      .map(
        (ach) => `
        <div class="achievement-badge ${ach.unlocked ? "unlocked" : "locked"}" title="${ach.description}">
          <div class="icon">${ach.icon}</div>
          <div class="name">${ach.name}</div>
          <div class="status">${ach.unlocked ? "✓" : "🔒"}</div>
        </div>
      `,
      )
      .join("");

    const modalHTML = `
      <div id="achieveModal" class="modal show">
        <div class="modal-content modal-achievements">
          <div class="modal-header">
            <h2>🏆 Achievements</h2>
            <button class="modal-close" onclick="game.closeModal('achieveModal')">✕</button>
          </div>
          <div class="modal-body">
            <div class="achievement-list">
              ${badgesHTML}
            </div>
          </div>
        </div>
      </div>
    `;

    const existingModal = document.getElementById("achieveModal");
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  showDailyChallenge() {
    const remaining = Math.max(
      0,
      this.dailyChallenge.target - this.sessionData.length,
    );
    const description =
      this.dailyChallenge.description ||
      this.getDailyChallengeDescription(this.dailyChallenge.target);
    const progressPercent = Math.min(
      100,
      Math.round((this.sessionData.length / this.dailyChallenge.target) * 100),
    );
    const modalHTML = `
      <div id="challengeModal" class="modal show">
        <div class="modal-content modal-challenges">
          <div class="modal-header">
            <h2>🎯 Daily Challenge</h2>
            <button class="modal-close" onclick="game.closeModal('challengeModal')">✕</button>
          </div>
          <div class="modal-body">
            <p style="text-align: center; font-size: 15px; color: #f0f0f0; margin-bottom: 20px;">
              ${description}
            </p>
            <div class="progress-bar-container">
              <div class="progress-bar" style="width: ${progressPercent}%"></div>
              <span class="progress-text">${progressPercent}%</span>
            </div>
            <div class="challenge-stats">
              <div class="stat-item">
                <div class="value" style="font-size: 32px; color: #ff6b6b;">${remaining}</div>
                <div class="label">To Go</div>
              </div>
              <div class="stat-item">
                <div class="value" style="font-size: 24px; color: #2ecc71;">${this.sessionData.length}</div>
                <div class="label">Completed</div>
              </div>
              <div class="stat-item">
                <div class="value" style="font-size: 24px; color: #fff;">${this.dailyChallenge.target}</div>
                <div class="label">Target</div>
              </div>
            </div>
            ${
              this.dailyChallenge.completed
                ? '<div class="challenge-complete">✅ Challenge Completed Today!</div>'
                : ""
            }
          </div>
        </div>
      </div>
    `;

    const existingModal = document.getElementById("challengeModal");
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  showTutorial() {
    const tutorialModal = document.getElementById("tutorialModal");
    if (tutorialModal) {
      tutorialModal.style.display = "flex";
    }
  }

  // ==================== DATA PERSISTENCE ====================

  saveSavedProgress() {
    this.saveGameState();
  }

  // ==================== INTERACTIVE TUTORIAL ====================

  tutorialStep = 0;

  showTutorial() {
    this.tutorialStep = 0;
    document.getElementById("tutorialModal").style.display = "flex";
    this.displayTutorialStep();
  }

  displayTutorialStep() {
    // Hide all steps
    for (let i = 0; i <= 6; i++) {
      const step = document.getElementById(`tutorialStep${i === 0 ? "" : "-" + i}`);
      if (step) step.style.display = "none";
    }
    // Show current step
    const currentStep = document.getElementById(`tutorialStep${this.tutorialStep === 0 ? "" : "-" + this.tutorialStep}`);
    if (currentStep) currentStep.style.display = "block";
  }

  nextTutorialStep() {
    if (this.tutorialStep < 6) {
      this.tutorialStep++;
      this.displayTutorialStep();
    }
  }

  previousTutorialStep() {
    if (this.tutorialStep > 0) {
      this.tutorialStep--;
      this.displayTutorialStep();
    }
  }

  // ==================== STATS PAGE ====================

  showStatsPage() {
    // Get daily statistics
    const dailyStats = this.getDailyStatistics();
    const userStats = this.getUserStatistics();

    const statsHTML = `
      <div id="statsPageModal" class="modal show" style="z-index: 9999;">
        <div class="modal-content stats-modal" style="max-width: 95%; max-height: 95vh; overflow-y: auto; border-radius: 15px;">
          <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px 15px 0 0; display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 28px;">
              ${this.userName}'s Stats
            </h2>
            <button class="modal-close" onclick="game.closeModal('statsPageModal')" style="background: white; color: #667eea; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 24px; cursor: pointer;">✕</button>
          </div>
          
          <div class="modal-body stats-body" style="padding: 20px; background: #f8f9fa;">
            
            <!-- USER STATISTICS SECTION -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #667eea; font-size: 22px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                User Statistics
              </h3>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #667eea;">
                  <div style="font-size: 24px; color: #667eea; font-weight: bold;">${userStats.totalSessions}</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Total Sessions</div>
                </div>
                
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #10b981;">
                  <div style="font-size: 24px; color: #10b981; font-weight: bold;">${userStats.accuracy}%</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Overall Accuracy</div>
                </div>
                
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #f59e0b;">
                  <div style="font-size: 24px; color: #f59e0b; font-weight: bold;">${userStats.totalScore}</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Total Score</div>
                </div>
                
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #ef4444;">
                  <div style="font-size: 24px; color: #ef4444; font-weight: bold;">${userStats.totalQuestionsAnswered}</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Questions Answered</div>
                </div>
                
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #06b6d4;">
                  <div style="font-size: 24px; color: #06b6d4; font-weight: bold;">${userStats.correctAnswers}</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Correct Answers</div>
                </div>
                
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #8b5cf6;">
                  <div style="font-size: 24px; color: #8b5cf6; font-weight: bold;">${this.plantStage}</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Plant Stage</div>
                </div>
                
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #ec4899;">
                  <div style="font-size: 24px; color: #ec4899; font-weight: bold;">${userStats.avgReactionTime}ms</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Avg Reaction Time</div>
                </div>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 10px; margin-top: 15px;">
                <h4 style="color: #333; margin: 0 0 10px 0;">📱 Activity Breakdown</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; font-size: 12px;">
                  ${this.generateActivityBreakdown(userStats.gamesPlayed)}
                </div>
              </div>
            </div>
            
            <!-- USER CONSISTENCY SECTION -->
            <div>
              <h3 style="color: #667eea; font-size: 22px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                Daily Activity
              </h3>
              
              <div style="background: white; border-radius: 10px; overflow-x: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <thead>
                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                      <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Date</th>
                      <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Sessions</th>
                      <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Time (mins)</th>
                      <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Score</th>
                      <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${dailyStats.map((day, idx) => `
                      <tr style="background: ${idx % 2 === 0 ? '#f9f9f9' : 'white'}; border-bottom: 1px solid #eee;">
                        <td style="padding: 12px; border: 1px solid #ddd; font-weight: 500;"><span style="background: #ec4899; color: white; padding: 4px 8px; border-radius: 4px;">${day.date}</span></td>
                        <td style="padding: 12px; text-align: center; border: 1px solid #ddd;"><span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 4px;">${day.sessions}</span></td>
                        <td style="padding: 12px; text-align: center; border: 1px solid #ddd;"><span style="background: #764ba2; color: white; padding: 4px 8px; border-radius: 4px;">${day.totalTime}</span></td>
                        <td style="padding: 12px; text-align: center; border: 1px solid #ddd;"><span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;">${day.score}</span></td>
                        <td style="padding: 12px; text-align: center; border: 1px solid #ddd;"><span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px;">${day.streak}</span></td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    `;

    const existingModal = document.getElementById("statsPageModal");
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML("beforeend", statsHTML);
  }

  generateActivityBreakdown(gamesPlayed) {
    return Object.entries(gamesPlayed)
      .map(([game, count]) => `<div style="background: #f0f0f0; padding: 8px; border-radius: 5px; text-align: center;"><strong>${count}</strong><br>${game}</div>`)
      .join("");
  }

  getUserStatistics() {
    const accuracy = this.stats.totalQuestionsAnswered > 0
      ? ((this.stats.correctAnswers / this.stats.totalQuestionsAnswered) * 100).toFixed(1)
      : 0;

    // Calculate average reaction time from session data
    const reactionTimesWithData = this.sessionData.filter(d => d.responseTime > 0);
    const avgReactionTime = reactionTimesWithData.length > 0
      ? Math.round(reactionTimesWithData.reduce((sum, d) => sum + d.responseTime, 0) / reactionTimesWithData.length)
      : 0;

    return {
      totalSessions: this.stats.totalSessions || 0,
      accuracy: accuracy,
      totalScore: this.score,
      totalQuestionsAnswered: this.stats.totalQuestionsAnswered || 0,
      correctAnswers: this.stats.correctAnswers || 0,
      gamesPlayed: this.stats.gamesPlayed || {},
      avgReactionTime: avgReactionTime,
    };
  }

  getDailyStatistics() {
    // Get daily stats from localStorage
    const dailyKey = `dailyStats_${this.hashUsername(this.userName)}`;
    let dailyStats = JSON.parse(localStorage.getItem(dailyKey)) || {};

    // Create array of last 30 days of data (present to past)
    const stats = [];
    for (let i = 0; i <= 29; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dailyStats[dateStr] || { sessions: 0, totalTime: 0, score: 0, streak: 0 };

      stats.push({
        date: this.formatDate(dateStr),
        sessions: dayData.sessions || 0,
        totalTime: Math.round((dayData.totalTime || 0) / 60),
        score: dayData.score || 0,
        streak: dayData.streak || 0,
      });
    }

    return stats;
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  recordDailyStatistics() {
    if (!this.userName) return;

    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `dailyStats_${this.hashUsername(this.userName)}`;
    let dailyStats = JSON.parse(localStorage.getItem(dailyKey)) || {};

    // Calculate session duration correctly
    const sessionDuration = this.sessionStartTime ? (Date.now() - this.sessionStartTime) : 0;

    if (!dailyStats[today]) {
      dailyStats[today] = {
        sessions: 0,
        totalTime: 0,
        score: 0,
        streak: this.streak,
        totalReactionTime: 0,
        reactionCount: 0,
      };
    }

    dailyStats[today].sessions = (dailyStats[today].sessions || 0) + 1;
    dailyStats[today].totalTime = (dailyStats[today].totalTime || 0) + sessionDuration;
    dailyStats[today].score = this.score;
    dailyStats[today].streak = this.streak;
    
    // Track reaction times from session data
    const sessionReactionTimes = this.sessionData.filter(d => d.responseTime > 0).map(d => d.responseTime);
    if (sessionReactionTimes.length > 0) {
      dailyStats[today].totalReactionTime = (dailyStats[today].totalReactionTime || 0) + sessionReactionTimes.reduce((a, b) => a + b, 0);
      dailyStats[today].reactionCount = (dailyStats[today].reactionCount || 0) + sessionReactionTimes.length;
    }

    localStorage.setItem(dailyKey, JSON.stringify(dailyStats));
  }

  // ==================== RESEARCH ANALYTICS ====================

  getSessionReport() {
    const correctCount = this.sessionData.filter((d) => d.correct).length;
    const totalCount = this.sessionData.length;
    const accuracy =
      totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(1) : 0;

    return {
      totalActivitiesCompleted: totalCount,
      correctAnswers: correctCount,
      accuracy: accuracy,
      totalScore: this.score,
      plantStage: this.plantStage,
      plantName: this.plantNames[this.plantStage],
      sessionDuration:
        totalCount > 0
          ? Date.now() - (this.sessionData[0]?.timestamp || Date.now())
          : 0,
      detailedData: this.sessionData,
    };
  }

  exportSessionData() {
    const report = this.getSessionReport();
    console.log("📊 SESSION REPORT:", report);
    return report;
  }

  // ==================== LOGOUT FUNCTIONALITY ====================

  handleUsernameClick() {
    this.usernameClickCount++;
    
    // Reset counter after 3 seconds of no clicks
    if (this.usernameClickResetTimer) {
      clearTimeout(this.usernameClickResetTimer);
    }
    this.usernameClickResetTimer = setTimeout(() => {
      this.usernameClickCount = 0;
    }, 3000);

    // Show logout modal when 10 clicks reached
    if (this.usernameClickCount >= 10) {
      this.showLogoutModal();
      this.usernameClickCount = 0; // Reset after showing
    }
  }

  showLogoutModal() {
    const modal = document.getElementById("logoutModal");
    const usernameSpan = document.getElementById("logoutUsername");
    
    if (modal && usernameSpan) {
      usernameSpan.textContent = this.userName;
      modal.classList.remove("hidden");
      modal.classList.add("show");
    }
  }

  confirmLogout() {
    // Hide the modal
    const modal = document.getElementById("logoutModal");
    if (modal) {
      modal.classList.remove("show");
      modal.classList.add("hidden");
    }

    // Clear the game state
    this.resetGameState();
    
    // Clear local storage
    localStorage.removeItem("kg_username");
    this.usernameClickCount = 0;

    // Redirect to start screen
    this.showScreen("startScreen");
    document.getElementById("userName").value = "";
    document.getElementById("userName").focus();
  }

  cancelLogout() {
    // Hide the modal
    const modal = document.getElementById("logoutModal");
    if (modal) {
      modal.classList.remove("show");
      modal.classList.add("hidden");
    }

    // Reset the click counter
    this.usernameClickCount = 0;
  }

  resetGameState() {
    this.currentActivity = null;
    this.currentQuestion = 0;
    this.score = 0;
    this.plantStage = 0;
    this.plantStageAtFinish = false;
    this.sessionData = [];
    this.scoreClickCount = 0;
    this.usernameClickCount = 0;
  }
}

// ==================== INITIALIZE GAME ====================

// Ensure game initializes after all scripts load
let gameInstance = null;

function initializeGame() {
  if (!gameInstance) {
    gameInstance = new KindergartenGame();
    console.log("✅ Game initialized successfully");
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  // DOM already loaded
  initializeGame();
}

// Also initialize after window load for safety
window.addEventListener('load', () => {
  if (!gameInstance) {
    initializeGame();
  }
});

// Make game globally accessible
const game = gameInstance || new KindergartenGame();

// Auto-save progress every minute
setInterval(() => {
  if (game && game.saveSavedProgress) {
    game.saveSavedProgress();
  }
}, 60000);

// Export data on page unload
window.addEventListener("beforeunload", () => {
  if (game && game.saveSavedProgress) {
    game.saveSavedProgress();
  }
});

// ==================== SERVICE WORKER REGISTRATION (OFFLINE SUPPORT) ====================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
        
        // Trigger asset precaching on first load
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'PRECACHE_ASSETS',
            message: 'Precache all assets for offline support'
          });
        }
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.warn('⚠️ Service Worker registration failed:', error);
      });
  });

  // Handle service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker updated - app refresh recommended');
    // Trigger precaching again after update
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PRECACHE_ASSETS'
      });
    }
  });
} else {
  console.log('⚠️ Service Workers not supported - offline mode unavailable');
}
