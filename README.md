# FairValue Studio

FairValue Studio is a powerful, yet intuitive multi-scenario valuation tool designed to help you quickly perform Discounted Cash Flow (DCF) analyses. Whether you need a quick sanity check on a stock or a robust, multi-phase financial model, FairValue Studio streamlines the workflow.

**Try the app live:** [https://fairvaluestudio.vercel.app/](https://fairvaluestudio.vercel.app/)

---

## 🚀 Quick Start

1. **Open the app** at the link above.
2. **Choose a valuation method** (Basic DCF for quick estimates, Advanced DCF for detailed multi-phase projections).
3. **Search for a stock** using the search icon (magnifying glass) to fetch live price data (or full TTM financials with an account).
4. **Adjust assumptions** like growth rates, margins, and discount rates.
5. **Add scenarios** using the **Scenario Selector** to compare different assumptions (Base, Bear, Bull cases).
6. **Review results** including intrinsic value, margin of safety, and yearly breakdown.
7. **Save your work** by creating an account (auto-sync) or downloading a JSON file.

---

## 📖 Step-by-Step Tutorial

### 1. Choose a Valuation Method
FairValue Studio offers two distinct approaches:

- **Basic DCF (Quick Estimate)** – Perfect for back‑of‑the‑napkin math. It applies a constant growth rate over your forecast period and discounts the final value back to today. Use this when you want a fast intrinsic value check or to find the implied growth rate priced into the current stock price.

- **Advanced DCF (Detailed Forecasting)** – Ideal for detailed multi‑phase forecasting where growth rates change over time. It discounts every yearly cash flow and the terminal value separately. When you set the forecast years to 3 or more, a draggable **Growth Phases** track appears, letting you define up to 10 distinct growth stages.

### 2. Load Stock Data
Instead of manually typing numbers, you can pull live market data directly into your model:

- Click the **search icon** (magnifying glass) in the “Assumptions” card.
- Type a ticker (e.g., `MSFT`) or company name.
- Select the stock from the results.
- A preview modal will appear displaying the live price (via Finnhub) and Trailing Twelve Month (TTM) financials (via Yahoo Finance).
- Toggle the data points you want to use and click **“Apply Data”** to instantly populate your scenario inputs.

### 3. Set Your Assumptions
The “Assumptions” card lets you control the core inputs of your model:

- **Buy Price** – The current stock price (can be auto‑filled from the stock search).
- **Years to Forecast** – How far out you project cash flows.
- **Discount Rate** – Your required rate of return.
- **Exit Assumption** – Choose between an exit multiple or a perpetuity growth rate to calculate the terminal value.

### 4. Project Cash Flows (Three Approaches)
You aren’t limited to just plugging in a single cash‑flow number. FairValue Studio gives you three bottom‑up projection strategies:

1. **Per Share Method** – The simplest. Project growth directly on a per‑share basis (e.g., Free Cash Flow Per Share).
2. **Total FCF & Share Count** – Input total company cash flows (in millions/billions) and combine it with a projected share‑change percentage. This lets you model the effects of share buybacks or dilution over time.
3. **Revenue & Margin Build** – The most detailed approach. Project total revenue growth, apply a targeted final FCF margin, and factor in share‑count changes. Perfect for currently unprofitable companies that you expect to scale into profitability.

### 5. Use Growth Phases (Advanced DCF Only)
If you selected Advanced DCF and set “Years to Forecast” to 3 or more, a purple **Growth Phases** track appears below the projection method.

- **Add a phase** – Click anywhere on the track to drop a split marker.
- **Adjust timing** – Drag the circular markers left/right to change how long each growth phase lasts.
- **Remove a phase** – Double‑click (or double‑tap) a marker to delete it.

Each phase can have its own growth rate and margin inputs, letting you model complex growth trajectories (e.g., rapid growth for 3 years, moderate for 5 years, then stable maturity).

### 6. Compare Multiple Scenarios
A single valuation can hold up to **10 different scenarios** (e.g., Base Case, Bear Case, Bull Case). 

- **Add a scenario** – Click the **“＋”** icon next to the Scenarios selector.
- **Switch between scenarios** – Open the **Scenarios dropdown** and click the name of the scenario you want to view.
- **Reorder scenarios** – Open the dropdown and use the **vertical grip handle (⋮⋮)** on the left to drag scenarios into your preferred order.
- **Duplicate a scenario** – Click the duplicate icon (two overlapping squares) inside a scenario’s meta card to create a copy, then tweak a few assumptions for sensitivity analysis.
- **Delete a scenario** – Click the trash icon (only allowed when more than one scenario exists).

The **Scenario Comparison Table** (visible when you have at least two scenarios) shows a side‑by‑side summary of key outputs, making it easy to see how different assumptions affect intrinsic value, margin of safety, and IRR.

### 7. Save, Load, and Share Your Work
#### Guest Mode
- Your valuation is stored **locally in your browser**. You can download it as a `.json` file at any time (click the download icon in the header).
- Upload a previously saved `.json` file (upload icon) to restore your work.

#### Account Mode (Recommended)
- **Create a free account** to unlock AI-powered financial data (TTM), automatic cloud saves, real‑time cross‑device syncing, and the ability to store multiple valuations.
- After signing up, your guest valuation can be migrated to your new account with one click.
- Use the **Valuations dropdown** in the header to create, rename, delete, or switch between different valuation projects.
- All changes are auto‑saved as you type.

### 8. Validate Your Assumptions with AI
At the bottom of the app you’ll find a **Text Summary** block that condenses your entire valuation (including all scenarios) into a clean, formatted text.

- Click **“Copy Text”** to copy the summary to your clipboard.
- Paste it into ChatGPT, Claude, or Gemini alongside a prompt like:

  > “Here is my DCF model for [Ticker]. Please analyze my assumptions for Revenue Growth and Terminal Multiple. Are they realistic given the company’s historical performance and current macroeconomic environment?”

This “pro tip” lets you get a qualitative sanity check from any AI assistant in seconds.

---

## ✨ Key Features at a Glance

- **Multi‑Scenario Modeling** – Compare up to 10 different assumption sets side‑by‑side.
- **Live Market Data** – Fetch real‑time stock prices via Finnhub and Trailing Twelve Month (TTM) financials directly from Yahoo Finance.
- **Two Valuation Methods** – Basic DCF for quick estimates, Advanced DCF with draggable growth phases.
- **Three Projection Strategies** – Per‑share, total FCF with share count, and revenue‑margin build.
- **Cloud Sync & Auto‑Save** – Seamless saving across devices when logged in.
- **Export/Import** – Download valuations as JSON for backup or sharing.
- **Sample Valuation** – Load a pre‑built example to see the tool in action.
- **Dark/Light Theme** – Toggle between themes for comfortable viewing.
- **Mobile‑Friendly Design** – Fully responsive interface that works on phones, tablets, and desktops.

---

## ❓ Frequently Asked Questions

### Can I use FairValue Studio for free?
Yes. The app is completely free to use. You can create an unlimited number of valuations and scenarios without any subscription.

### What happens if I close the browser?
If you are using **guest mode**, your data is stored locally in your browser’s localStorage. It will persist until you clear site data. We recommend downloading your valuation as a JSON file for backup.

If you are **logged in**, your work is automatically synced to the cloud. You can reopen it on any device by signing into your account.

### Which stock exchanges are supported?
The stock search works for equities listed on major exchanges worldwide (NASDAQ, NYSE, TSX, TSXV, LSE, ASX, etc.). Financial data retrieval is most reliable for US-listed stocks.

### Why is some financial data missing for certain stocks?
The application retrieves Trailing Twelve Month (TTM) data from Yahoo Finance. This data may be missing or incomplete for ETFs, mutual funds, newly listed IPOs, or minor international exchanges where full fundamental reporting is not readily available.

### How many scenarios can I have?
Each valuation supports up to 10 scenarios. You can create, duplicate, and delete scenarios as needed. To reorder them, use the **vertical grip handle** inside the Scenarios dropdown.

### Can I share my valuation with someone else?
Yes. Download your valuation as a JSON file and send it to another person. They can upload it into their own FairValue Studio session (guest or logged‑in) and see exactly the same scenarios and results.

### Is my data private?
All valuations are stored privately under your account ID. We do not share, sell, or expose your financial models to third parties. For more details, please refer to our Privacy Policy (linked in the app footer).

---

## 🛠 Need Help?

- **In‑app guide** – Click the “How to Use” expandable panel in the header for a concise overview.
- **Sample valuation** – Click “Load Sample Valuation” inside the “How to Use” panel to see a pre‑configured example.
- **Report issues** – If you encounter a bug or have a feature request, please open an issue on the project’s GitHub repository (coming soon).

---

Happy valuing! 🚀
