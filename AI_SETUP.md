# AI API Configuration

You need one of these API keys for Phase 1 (Inventory Analysis):

## Option 1: OpenAI (ChatGPT)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to your `.env.local`:
```
VITE_OPENAI_API_KEY=sk-...your-key-here...
```

## Option 2: Google Gemini (Free)
1. Go to https://aistudio.google.com/app/apikeys
2. Create a new API key
3. Add to your `.env.local`:
```
VITE_GEMINI_API_KEY=AIza...your-key-here...
```

## Testing Phase 1
Click any of these buttons on Analytics page:
- 💧 Analyze Waste
- 📊 Inventory Summary
- 📈 Reorder Plan
- ⏰ Expiry Analysis

The AI will analyze your inventory data and provide insights.

---

## Phase 2: Trending Items Chat (Coming Soon)
This will require sentiment analysis & social media trend integration.
