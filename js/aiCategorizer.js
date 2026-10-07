// Machine Learning NLP Task Categorizer & Priority Classifier
// Uses a Multinomial Naive Bayes probabilistic model with n-gram feature extraction,
// Porter-style morphological stemming, Laplace smoothing, and online continuous learning.

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "because", "as", "what", "which",
  "this", "that", "these", "those", "then", "just", "so", "than", "such", "both",
  "through", "about", "for", "is", "am", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "having", "do", "does", "did", "doing", "at",
  "by", "with", "from", "in", "out", "on", "off", "over", "under", "again",
  "further", "once", "here", "there", "when", "where", "why", "how", "all",
  "any", "both", "each", "few", "more", "most", "other", "some", "such", "no",
  "nor", "not", "only", "own", "same", "too", "very", "can", "will", "just",
  "don", "should", "now", "to", "of", "my", "your", "our", "their", "his", "her"
]);

// Morphological suffix stemming to conflate inflected word variants
function stemWord(word) {
  if (word.length <= 3) return word;
  if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("tion") && word.length > 6) return word.slice(0, -4);
  if (word.endsWith("ment") && word.length > 6) return word.slice(0, -4);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("ies") && word.length > 5) return word.slice(0, -3) + "y";
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

// Tokenizer producing unigrams and contiguous bigrams
function extractFeatures(text) {
  if (!text || typeof text !== "string") return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const filtered = words.filter((w) => !STOP_WORDS.has(w)).map(stemWord);
  const bigrams = [];
  for (let i = 0; i < filtered.length - 1; i++) {
    bigrams.push(`${filtered[i]}_${filtered[i + 1]}`);
  }
  return [...filtered, ...bigrams];
}

// Multinomial Naive Bayes text classifier implementation
class MultinomialNaiveBayesClassifier {
  constructor(alpha = 0.15) {
    this.alpha = alpha; // Laplace smoothing parameter
    this.classDocCounts = {};
    this.classTokenCounts = {};
    this.classTotalTokens = {};
    this.vocabulary = new Set();
    this.totalDocs = 0;
  }

  trainBatch(samples) {
    for (const sample of samples) {
      this.trainOne(sample.text, sample.label);
    }
  }

  trainOne(text, label) {
    if (!text || !label) return;
    this.totalDocs++;
    this.classDocCounts[label] = (this.classDocCounts[label] || 0) + 1;
    if (!this.classTokenCounts[label]) {
      this.classTokenCounts[label] = {};
      this.classTotalTokens[label] = 0;
    }
    const tokens = extractFeatures(text);
    for (const token of tokens) {
      this.vocabulary.add(token);
      this.classTokenCounts[label][token] =
        (this.classTokenCounts[label][token] || 0) + 1;
      this.classTotalTokens[label]++;
    }
  }

  predict(text) {
    const tokens = extractFeatures(text);
    const classes = Object.keys(this.classDocCounts);
    if (classes.length === 0) {
      return { label: "General", confidence: 50, probabilities: { General: 1 } };
    }

    const vocabSize = Math.max(this.vocabulary.size, 1);
    const logPosteriors = {};

    let recognizedTokens = 0;
    for (const t of tokens) {
      if (this.vocabulary.has(t)) recognizedTokens++;
    }

    // Out-of-vocabulary fallback to General class
    if (tokens.length === 0 || recognizedTokens === 0) {
      const defaultProbs = {};
      for (const c of classes) {
        defaultProbs[c] = c === "General" ? 0.6 : 0.4 / (classes.length - 1 || 1);
      }
      return {
        label: classes.includes("General") ? "General" : classes[0],
        confidence: 50,
        probabilities: defaultProbs,
      };
    }

    for (const c of classes) {
      const prior = Math.log(
        (this.classDocCounts[c] + this.alpha) /
          (this.totalDocs + classes.length * this.alpha)
      );
      let likelihood = 0;
      const totalTokensInC = this.classTotalTokens[c] || 0;
      const denom = totalTokensInC + this.alpha * vocabSize;

      for (const token of tokens) {
        if (this.vocabulary.has(token)) {
          const count =
            (this.classTokenCounts[c] && this.classTokenCounts[c][token]) || 0;
          likelihood += Math.log((count + this.alpha) / denom);
        }
      }
      logPosteriors[c] = prior + likelihood;
    }

    // Softmax normalization with numerical stability
    const maxLog = Math.max(...Object.values(logPosteriors));
    let expSum = 0;
    const expVals = {};
    for (const c of classes) {
      expVals[c] = Math.exp(logPosteriors[c] - maxLog);
      expSum += expVals[c];
    }

    const probabilities = {};
    let bestLabel = classes[0];
    let maxProb = -1;

    for (const c of classes) {
      const prob = expVals[c] / expSum;
      probabilities[c] = Math.round(prob * 1000) / 1000;
      if (prob > maxProb) {
        maxProb = prob;
        bestLabel = c;
      }
    }

    return {
      label: bestLabel,
      confidence: Math.round(maxProb * 100),
      probabilities,
    };
  }
}

// Extensive training corpus covering common real-world task categories
const CATEGORY_TRAINING_DATA = [
  // Work
  { text: "finish quarterly slides for executive meeting", label: "Work" },
  { text: "push git commit and open pull request on github", label: "Work" },
  { text: "fix database connection error in production server", label: "Work" },
  { text: "sync with engineering team on sprint backlog", label: "Work" },
  { text: "reply to client project emails and questions", label: "Work" },
  { text: "prepare presentation deck for quarterly review", label: "Work" },
  { text: "schedule zoom call with marketing client and stakeholders", label: "Work" },
  { text: "conduct interview for software engineer candidate", label: "Work" },
  { text: "write technical documentation for API endpoint design", label: "Work" },
  { text: "resolve customer support escalation bug report", label: "Work" },
  { text: "review pull request code comments from colleague", label: "Work" },
  { text: "attend daily agile standup meeting at 10am", label: "Work" },
  { text: "draft statement of work and vendor contract agreement", label: "Work" },
  { text: "refactor authentication token session logic", label: "Work" },
  { text: "deploy release candidate to staging environment", label: "Work" },
  { text: "discuss roadmap priorities with product manager", label: "Work" },
  { text: "send monthly newsletter analytics report to boss", label: "Work" },
  { text: "prepare sales pitch demo for corporate customer", label: "Work" },
  { text: "submit expense reimbursement for office conference", label: "Work" },
  { text: "organize team brainstorming workshop for Q4 goals", label: "Work" },
  { text: "update Jira tickets and sprint kanban board", label: "Work" },
  { text: "respond to Slack messages in dev channel", label: "Work" },
  { text: "configure CI CD github actions pipeline workflow", label: "Work" },
  { text: "debug memory leak in backend Node microservice", label: "Work" },
  { text: "coordinate with QA team on regression test plan", label: "Work" },
  { text: "client deliverable submission and milestone signoff", label: "Work" },

  // Personal
  { text: "call mom for her birthday this weekend", label: "Personal" },
  { text: "attend family dinner on Sunday evening", label: "Personal" },
  { text: "clean bedroom closet and organize clothes", label: "Personal" },
  { text: "walk dog in neighborhood park and play fetch", label: "Personal" },
  { text: "plan anniversary surprise dinner for spouse", label: "Personal" },
  { text: "call brother about weekend barbecue party", label: "Personal" },
  { text: "water indoor house plants and patio garden flowers", label: "Personal" },
  { text: "fix leaking faucet pipe in bathroom sink", label: "Personal" },
  { text: "wash car and vacuum floor mats", label: "Personal" },
  { text: "babysit nephew on Friday night", label: "Personal" },
  { text: "host board game night with close friends", label: "Personal" },
  { text: "send birthday gift and card to cousin", label: "Personal" },
  { text: "renew driver license at DMV office", label: "Personal" },
  { text: "organize garage tools and storage boxes", label: "Personal" },
  { text: "plan summer road trip itinerary and hotel bookings", label: "Personal" },
  { text: "cook homemade pasta for family gathering", label: "Personal" },
  { text: "take cat to pet groomer for haircut", label: "Personal" },
  { text: "call grandparents to check how they are doing", label: "Personal" },
  { text: "change bed sheets and do weekly laundry", label: "Personal" },
  { text: "repair broken bicycle chain and tire pump", label: "Personal" },
  { text: "paint the guest bedroom walls", label: "Personal" },
  { text: "send postcards to friends from vacation", label: "Personal" },

  // Shopping
  { text: "buy organic milk and eggs at grocery store", label: "Shopping" },
  { text: "order wireless noise cancelling headphones on Amazon", label: "Shopping" },
  { text: "purchase running shoes and workout socks", label: "Shopping" },
  { text: "buy fresh fruit, vegetables, bread and peanut butter", label: "Shopping" },
  { text: "buy groceries at supermarket for dinner party", label: "Shopping" },
  { text: "order new ergonomic office desk chair online", label: "Shopping" },
  { text: "purchase winter jacket and warm gloves", label: "Shopping" },
  { text: "pick up coffee beans and paper filters at roast shop", label: "Shopping" },
  { text: "buy birthday present for friend at mall", label: "Shopping" },
  { text: "order printer toner and A4 copy paper", label: "Shopping" },
  { text: "buy batteries, light bulbs, and cleaning supplies", label: "Shopping" },
  { text: "shop for living room curtains and rug", label: "Shopping" },
  { text: "buy ingredients for homemade pizza dinner", label: "Shopping" },
  { text: "order replacement laptop power cable charger", label: "Shopping" },
  { text: "buy sunscreen lotion and sunglasses for beach", label: "Shopping" },
  { text: "purchase tickets to weekend rock concert", label: "Shopping" },
  { text: "shop online sales for new kitchen blender", label: "Shopping" },
  { text: "order dog food and chew treats from Chewy", label: "Shopping" },
  { text: "buy apples, bananas, avocados, and spinach", label: "Shopping" },
  { text: "purchase birthday gift wrapping paper and ribbons", label: "Shopping" },

  // Health
  { text: "dentist appointment for teeth cleaning at 3pm", label: "Health" },
  { text: "annual medical checkup with primary care doctor", label: "Health" },
  { text: "morning 5km jog, run 3 miles, and do yoga stretch", label: "Health" },
  { text: "take prescribed allergy medication twice daily", label: "Health" },
  { text: "gym workout chest and triceps strength training", label: "Health" },
  { text: "schedule eye examination with optometrist", label: "Health" },
  { text: "physical therapy session for knee rehabilitation", label: "Health" },
  { text: "drink 2 liters of water and track hydration", label: "Health" },
  { text: "15-minute mindful meditation and breathing exercises", label: "Health" },
  { text: "visit dermatologist to examine skin rash", label: "Health" },
  { text: "get annual flu shot vaccine at pharmacy", label: "Health" },
  { text: "swim 30 laps at local community pool", label: "Health" },
  { text: "book massage therapy appointment for back pain", label: "Health" },
  { text: "track daily calorie intake and nutrition macro goals", label: "Health" },
  { text: "refill blood pressure medication prescription", label: "Health" },
  { text: "stretch hamstrings and foam roll back after workout", label: "Health" },
  { text: "cardio cycling workout on stationary bike", label: "Health" },
  { text: "doctor appointment blood test lab work", label: "Health" },
  { text: "take vitamins and omega 3 fish oil capsules", label: "Health" },
  { text: "sleep 8 hours tonight for recovery", label: "Health" },

  // Finance
  { text: "pay monthly electricity and water utility bill online", label: "Finance" },
  { text: "file federal and state income tax returns before April", label: "Finance" },
  { text: "transfer monthly rent payment to landlord bank account", label: "Finance" },
  { text: "review monthly credit card statement for suspicious charges", label: "Finance" },
  { text: "update personal household budget spreadsheet", label: "Finance" },
  { text: "invest 500 dollars into index funds and retirement IRA", label: "Finance" },
  { text: "pay wifi internet utility bill before due date", label: "Finance" },
  { text: "renew car auto insurance policy with Geico", label: "Finance" },
  { text: "cancel unused gym membership subscription", label: "Finance" },
  { text: "pay off credit card outstanding balance in full", label: "Finance" },
  { text: "check credit score report on Experian", label: "Finance" },
  { text: "rebalance stock and bond investment portfolio", label: "Finance" },
  { text: "deposit salary check into high-yield savings account", label: "Finance" },
  { text: "apply for refinance mortgage loan quotes", label: "Finance" },
  { text: "pay quarterly property taxes to county treasurer", label: "Finance" },
  { text: "audit monthly recurring bank subscriptions", label: "Finance" },
  { text: "pay student loan monthly installment", label: "Finance" },
  { text: "wire deposit money for apartment security fee", label: "Finance" },

  // Education
  { text: "study machine learning textbook chapter 4 neural networks", label: "Education" },
  { text: "submit python programming homework assignment before midnight", label: "Education" },
  { text: "practice LeetCode algorithms problems for technical interview", label: "Education" },
  { text: "read deep learning research paper on transformers attention", label: "Education" },
  { text: "watch online video lecture on distributed systems", label: "Education" },
  { text: "complete chapter review quiz on chemistry course", label: "Education" },
  { text: "practice Spanish vocabulary flashcards on Duolingo", label: "Education" },
  { text: "read 40 pages of World History book for seminar", label: "Education" },
  { text: "attend virtual webinar on cloud computing architecture", label: "Education" },
  { text: "solve calculus differential equations problem set", label: "Education" },
  { text: "prepare presentation for biology class group project", label: "Education" },
  { text: "write 5-page essay on English literature for college", label: "Education" },
  { text: "learn basic music theory and piano chords", label: "Education" },
  { text: "take online certification exam for AWS solutions architect", label: "Education" },
  { text: "finish reading textbook chapter on microeconomics", label: "Education" },
  { text: "practice French pronunciation and grammar drills", label: "Education" },

  // General
  { text: "quick reminder to check notes later", label: "General" },
  { text: "look into interesting ideas from yesterday", label: "General" },
  { text: "organize messy desktop icons and folder hierarchy", label: "General" },
  { text: "random tasks and errands to keep in mind", label: "General" },
  { text: "follow up on pending matters sometime", label: "General" },
  { text: "general to-do item for tomorrow morning", label: "General" },
  { text: "make a list of things to discuss later", label: "General" },
];

// Priority training dataset targeting indicators of urgency, deadlines, and stakes
const PRIORITY_TRAINING_DATA = [
  // High
  { text: "urgent fix for production crash ASAP", label: "High" },
  { text: "emergency meeting with CEO immediately today", label: "High" },
  { text: "critical bug affecting paying users right now", label: "High" },
  { text: "file taxes before midnight deadline today", label: "High" },
  { text: "submit proposal due today immediately", label: "High" },
  { text: "call doctor immediately regarding test results", label: "High" },
  { text: "urgent payment overdue wire transfer today", label: "High" },
  { text: "crucial presentation in 1 hour must prepare", label: "High" },
  { text: "emergency repair for leaking water pipe", label: "High" },
  { text: "asap client escalation high priority response", label: "High" },
  { text: "final deadline tonight do not forget", label: "High" },
  { text: "overdue bill pay immediately to avoid penalty", label: "High" },

  // Medium
  { text: "finish draft report by this Friday", label: "Medium" },
  { text: "schedule follow-up sync with team next week", label: "Medium" },
  { text: "order printer ink before running out soon", label: "Medium" },
  { text: "prepare slides for upcoming workshop next week", label: "Medium" },
  { text: "review feedback on proposal within few days", label: "Medium" },
  { text: "book hotel for upcoming trip next month", label: "Medium" },
  { text: "clean apartment before weekend guests arrive", label: "Medium" },
  { text: "follow up with candidate on second interview soon", label: "Medium" },
  { text: "buy groceries for dinner tomorrow evening", label: "Medium" },
  { text: "study chapter for quiz coming up this week", label: "Medium" },

  // Low
  { text: "read interesting article about space exploration someday", label: "Low" },
  { text: "browse new book recommendations when free", label: "Low" },
  { text: "explore new music playlists leisurely", label: "Low" },
  { text: "organize old family photos whenever possible", label: "Low" },
  { text: "leisurely stroll in neighborhood park", label: "Low" },
  { text: "casual catch-up with old college friend someday", label: "Low" },
  { text: "browse furniture design ideas for future home", label: "Low" },
  { text: "watch documentary on Netflix when time permits", label: "Low" },
  { text: "think about future hobbies and creative ideas", label: "Low" },
  { text: "clean out attic boxes when free next month", label: "Low" },
];

// Initialize and train the classifiers
const categoryClassifier = new MultinomialNaiveBayesClassifier(0.15);
categoryClassifier.trainBatch(CATEGORY_TRAINING_DATA);

const priorityClassifier = new MultinomialNaiveBayesClassifier(0.2);
priorityClassifier.trainBatch(PRIORITY_TRAINING_DATA);

// Load any continuous online feedback saved by user in browser
function loadSavedFeedback() {
  try {
    if (typeof localStorage !== "undefined") {
      const feedback = JSON.parse(
        localStorage.getItem("ai_model_user_feedback") || "[]"
      );
      for (const item of feedback) {
        if (item.text && item.category) {
          categoryClassifier.trainOne(item.text, item.category);
        }
        if (item.text && item.priority) {
          priorityClassifier.trainOne(item.text, item.priority);
        }
      }
    }
  } catch (err) {
    console.warn("Could not load AI feedback from storage:", err);
  }
}

// Initial load if browser environment
loadSavedFeedback();

/**
 * Predicts the category for a given task text.
 * Backward compatible with existing signature.
 * @param {string} text - The task description.
 * @returns {string} - The predicted category name.
 */
function predictCategory(text) {
  const result = categoryClassifier.predict(text);
  return result.label;
}

/**
 * Predicts the priority for a given task text.
 * Backward compatible with existing signature.
 * @param {string} text - The task description.
 * @returns {string} - "High", "Medium", or "Low".
 */
function predictPriority(text) {
  const result = priorityClassifier.predict(text);
  return result.label;
}

/**
 * Performs full multi-attribute ML inference for a task.
 * @param {string} text - The task description.
 * @returns {object} - Full inference results with confidence scores and class distributions.
 */
function predictTask(text) {
  const catResult = categoryClassifier.predict(text);
  const prioResult = priorityClassifier.predict(text);

  return {
    category: catResult.label,
    categoryConfidence: catResult.confidence,
    categoryProbabilities: catResult.probabilities,
    priority: prioResult.label,
    priorityConfidence: prioResult.confidence,
    priorityProbabilities: prioResult.probabilities,
  };
}

/**
 * Incorporates user correction into the model via continuous online learning.
 * @param {string} text - The task description.
 * @param {string} category - The confirmed/corrected category.
 * @param {string} priority - The confirmed/corrected priority.
 */
function trainModelFromFeedback(text, category, priority) {
  if (!text) return;
  if (category) {
    categoryClassifier.trainOne(text, category);
  }
  if (priority) {
    priorityClassifier.trainOne(text, priority);
  }

  // Persist feedback so it persists across page reloads
  try {
    if (typeof localStorage !== "undefined") {
      const feedback = JSON.parse(
        localStorage.getItem("ai_model_user_feedback") || "[]"
      );
      feedback.push({ text, category, priority, timestamp: Date.now() });
      // Keep most recent 200 feedback points
      if (feedback.length > 200) feedback.shift();
      localStorage.setItem("ai_model_user_feedback", JSON.stringify(feedback));
    }
  } catch (err) {
    console.warn("Could not save AI feedback to storage:", err);
  }
}

/**
 * Returns metadata and diagnostic stats about the active ML model.
 */
function getModelStats() {
  return {
    modelType: "Multinomial Naive Bayes with N-Gram & Morphological Stemming",
    vocabularySize: categoryClassifier.vocabulary.size,
    trainingSamplesCount:
      categoryClassifier.totalDocs + priorityClassifier.totalDocs,
    categories: Object.keys(categoryClassifier.classDocCounts),
    priorities: Object.keys(priorityClassifier.classDocCounts),
  };
}

export {
  predictCategory,
  predictPriority,
  predictTask,
  trainModelFromFeedback,
  getModelStats,
  categoryClassifier,
  priorityClassifier,
};
