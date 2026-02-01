// Simple AI-based categorization and priority prediction
// For demo, uses keyword-based logic. Replace with real AI API for production.

const categories = [
  { name: "Work", keywords: ["meeting", "email", "project", "report"] },
  { name: "Personal", keywords: ["call", "family", "friend", "birthday"] },
  { name: "Shopping", keywords: ["buy", "order", "shop", "purchase"] },
  { name: "Health", keywords: ["doctor", "exercise", "medication", "gym"] },
];

function predictCategory(text) {
  for (const cat of categories) {
    for (const kw of cat.keywords) {
      if (text.toLowerCase().includes(kw)) {
        return cat.name;
      }
    }
  }
  return "General";
}

function predictPriority(text) {
  const urgentWords = ["urgent", "asap", "immediately", "today", "important"];
  for (const word of urgentWords) {
    if (text.toLowerCase().includes(word)) {
      return "High";
    }
  }
  if (text.toLowerCase().includes("soon")) return "Medium";
  return "Low";
}

export { predictCategory, predictPriority };
