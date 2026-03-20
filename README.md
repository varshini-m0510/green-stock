Presentation: https://drive.google.com/file/d/1zei3F99Mi1zB1rAhAmiKAgI3HFQWr8so/view?usp=drive_link

# 🌱 Green-Tech Inventory Assistant

**Candidate:** Varshini M
**Scenario:** Sustainability-focused inventory system for small teams
**Estimated Time Spent:** ~5 hours

---

## 📌 Overview

Green-Tech Inventory Assistant is a lightweight, client-side web application designed to help small teams manage perishable inventory efficiently. It tracks expiry dates, monitors consumption patterns, and provides both manual and AI-assisted reorder suggestions.

The application prioritizes **simplicity, speed, and offline usability**, making it ideal for small-scale environments such as shared kitchens, labs, or sustainability-focused teams.

---

## 🚀 Features

* 📦 **Inventory Tracking** – Add, update, and remove items easily
* ⏳ **Expiry Monitoring** – Automatic detection of expiring and expired items
* 📊 **Consumption Insights** – Daily usage calculations based on historical data
* 🤖 **AI-Powered Suggestions** – Smart reorder recommendations using lightweight forecasting
* 🔔 **Manual Alerts** – Custom thresholds for low-stock notifications
* 🌐 **Offline Support** – Fully functional using local storage (no backend required)

---

## ⚙️ Quick Start

### Prerequisites

* **Node.js** ≥ 18.0 (LTS recommended)
* **npm** ≥ 9.0 
* **Git** ≥ v2.0
* Modern browser (Chrome, Firefox, Safari, Edge – 2020+)
* *(Optional)* OpenAI or Google Gemini API key for enhanced AI features

### Verify Installation

```bash
node --version
npm --version
git --version
```

---

## 🛠️ Run the Application

### Development

```bash
npm run dev
```
---
### Production Build

```bash
npm run build
# or
bun run build
```
Preview production build:

```bash
npm run preview
```
---

### Code Quality

```bash
npm run lint
npm run build:dev
```
---

## 🧪 Testing

### Run Tests

```bash
npm run test
```
### Watch Mode

```bash
npm run test:watch
```
---

### ✅ Test Coverage Summary

| Component               | Tests  | Status        |
| ----------------------- | ------ | ------------- |
| Expiry Status           | 4      | ✅ Passed      |
| Daily Usage Calculation | 2      | ✅ Passed      |
| AI Suggestions          | 2      | ✅ Passed      |
| Manual Alerts           | 2      | ✅ Passed      |
| **Total**               | **10** | ✅ All Passing |

---

### 🔍 Key Test Scenarios

* Items expiring in 2, 5, 15 days and already expired
* Consumption calculations across different usage patterns
* AI forecasting for low-stock vs well-stocked items
* Manual alert triggers based on thresholds
---

## 🤖 AI Usage Disclosure

* **AI Tools Used:** Yes (GitHub Copilot, DeepSeek, Lovable)
* **Usage Approach:**
  * AI assisted in scaffolding the project and suggesting implementations
  * Each suggestion was manually reviewed and validated before integration

### Example of a Rejected Suggestion

* ❌ Rejected: Full production-grade architecture with PostgreSQL and complex UI
* ✅ Chosen: Lightweight prototype with local storage and minimal UI

**Reason:** Time constraints and focus on performance, simplicity, and offline usability

---

## ⚖️ Tradeoffs & Prioritization

### What Was Simplified

* Limited dataset size for faster prototyping
* Replaced ML models with manual calculation for reorder suggestions and Gemini LLM for summarize, analyze waste, expiry analysis
* Avoided backend setup entirely

---

### Design Decisions

| Area         | Choice         | Rationale                                             |
| ------------ | -------------- | ----------------------------------------------------- |
| Storage      | localStorage   | Zero setup, offline-first, sufficient for <1000 items |
| AI Logic     | Moving average | Simple, interpretable, works with sparse data         |
| Architecture | Client-only    | Faster development, no deployment complexity          |

---

## 🔮 Future Improvements

Given more time, the following enhancements would be prioritized:

* 🎤 **Voice-based inventory updates**
  * Example: “2 bags of flour used”
* 📷 **Barcode scanning integration** for faster item entry
* ☁️ Backend for multi-user collaboration and for role based access.
* 📈 Advanced analytics & visualization dashboard
* 📈 Personalized ML model trained on historical data
* 🎨 Improved UI/UX for production readiness
---

## 🚧 Known Limitations

* Designed for **small teams only** (not scalable for large datasets)
* Assumes **relatively stable consumption patterns**
* No real barcode scanning (simulated only)
* Single-user / single-tenant system
* Limited UI polish due to time constraints

---

## 📄 License

This project is created for assessment/demo purposes.
