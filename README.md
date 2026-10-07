# ToDo List Application — Smart AI Task Manager

A feature-rich, user-friendly ToDo List web application powered by **on-device Machine Learning NLP categorization**. Built with **HTML5, CSS3, modern JavaScript (ES Modules)**, and an optional **Node.js/Express + MongoDB backend**.

---

## 📌 Features

### 1. 🤖 On-Device Machine Learning Categorization & Priority Prediction
- Replaced basic keyword matching with an actual **Multinomial Naive Bayes Machine Learning NLP Model**.
- **N-gram feature extraction** (unigrams + bigrams) and **morphological suffix stemming**.
- Trained across 7 categories: **Work, Personal, Shopping, Health, Finance, Education, and General**.
- Real-time classification confidence percentages (e.g. `🏷️ Work 98%`) and priority predictions (`High`, `Medium`, `Low`).
- **Live AI Prediction Preview** that predicts task category and priority in real-time as you type.
- **Active Human-in-the-Loop Learning**: If you manually edit a task's category, the model incorporates your correction into its weights in real time.

### 2. ✏️ Inline Task Editing
- Edit any existing task without leaving the view.
- Update task title, due date, category, and priority in a streamlined inline editor.
- Keyboard shortcuts: press `Enter` to save, `Escape` to cancel.

### 3. 📅 Due Dates & Overdue Alerts
- Optional due date picker for any task.
- Smart visual badges:
  - **Overdue**: Highlighted with warning indicator for past due dates.
  - **Due Today**: Distinct alert for tasks due the current day.
  - **Upcoming**: Clean calendar countdown badges.

### 4. 🔍 Instant Search & Multi-Criteria Filtering
- **Real-Time Search Bar**: Filter tasks instantly by title, keyword, or category.
- **Status Filter**: Toggle between `All`, `Active Only`, and `Completed`.
- **Category Filter**: Filter specifically by `Work`, `Personal`, `Shopping`, `Health`, `Finance`, `Education`, or `General`.
- **Priority Filter**: View tasks by `High`, `Medium`, or `Low` priority.
- **Dynamic Sorting**: Sort by Priority (High → Low), Due Date (Earliest first), Title (A → Z), or Newest First.
- **Active Filter Counter & Reset**: Summary stats bar showing active/completed/overdue counts with a one-click "Reset Filters" action.

### 5. 🔐 Multi-User Authentication
- Client-side registration and login with user-isolated task storage.

---

## 🛠️ Technologies Used

- **Frontend**: HTML5, Modern CSS3 (Grid & Flexbox), Vanilla JavaScript (ES6+ Modules)
- **Machine Learning Engine**: Custom Multinomial Naive Bayes Text Classifier with TF Laplace smoothing, n-gram tokenization, and morphological stemming (0 external dependencies, 0ms network latency)
- **Backend (Optional)**: Node.js, Express, MongoDB / Mongoose, CORS

---

## 🚀 How to Run

### Method 1: Using the Express Backend (Recommended)
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   npm start
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

### Method 2: Using Any Static HTTP Server or VS Code Live Server
Because modern browsers restrict ES Modules on raw `file://` URLs, serve the root directory using any local HTTP server:
```bash
# Using npx serve:
npx serve .

# Or using Python:
python -m http.server 8000
```
Open `http://localhost:8000` or the displayed local port.
