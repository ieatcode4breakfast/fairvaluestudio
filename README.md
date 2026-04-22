# FairValue Studio

FairValue Studio is a powerful, yet intuitive multi-scenario valuation tool designed to help you quickly perform Discounted Cash Flow (DCF) analyses. Whether you need a quick sanity check on a stock or a robust, multi-phase financial model, FairValue Studio streamlines the workflow.

**Try the app live:** [https://fairvaluestudio.vercel.app/](https://fairvaluestudio.vercel.app/)

---

## 🚀 Quick Start

1. **Open the app** at the link above.
2. **Choose a valuation method** (Basic DCF for quick estimates, Advanced DCF for detailed multi-phase projections).
3. **Search for a stock** using the search icon (magnifying glass) to fetch live price data and Trailing Twelve Month (TTM) financials.
4. **Select your metric** — Model using Free Cash Flow, Net Income (Earnings), EBITDA, or Operating Cash Flow.
5. **Adjust assumptions** like growth rates, margins, and discount rates.
6. **Add scenarios** to compare different assumptions (Base, Bear, Bull cases) side-by-side.
7. **Save your work** by creating an account (auto-sync) or downloading a JSON file.

---

## 📖 Step-by-Step Tutorial

### 1. Choose a Valuation Method
FairValue Studio offers two distinct approaches:

- **Basic DCF (Quick Estimate)** – Perfect for back‑of‑the‑napkin math. It applies a constant growth rate over your forecast period and discounts the final value back to today. Use this for fast intrinsic value checks.
- **Advanced DCF (Detailed Forecasting)** – Ideal for detailed multi‑phase forecasting where growth rates change over time. When you set the forecast years to 3 or more, a draggable **Growth Phases** track appears, letting you define up to 10 distinct growth stages.

### 2. Load Stock Data
Instead of manually typing numbers, you can pull live market data directly into your model:

- Click the **search icon** (magnifying glass) in the “Assumptions” card.
- Type a ticker (e.g., `MSFT`) or company name.
- Select the stock from the results.
- A preview modal will appear displaying the live price (via Finnhub) and Trailing Twelve Month (TTM) financials (via Yahoo Finance).
- Toggle the data points you want to use and click **“Apply Data”** to instantly populate your scenario inputs.

### 3. Choose Your Primary Metric
You can value a company based on various fundamental drivers:
- **Free Cash Flow** (The gold standard for DCF)
- **Net Income (Earnings)**
- **EBITDA**
- **Operating Cash Flow**
- **Book Value** (Available in Basic DCF)

### 4. Project Financials (Three Strategies)
FairValue Studio gives you three bottom‑up projection strategies regardless of which metric you choose:

1. **Per Share Method** – The simplest. Project growth directly on a per‑share basis (e.g., EPS growth).
2. **Total Metric & Share Count** – Input total company financials (in millions/billions) and combine it with a projected share‑change percentage. This models the effects of share buybacks or dilution over time.
3. **Revenue & Margin Build** – The most detailed approach. Project total revenue growth, apply a targeted final margin (e.g., EBITDA Margin), and factor in share‑count changes. Perfect for companies scaling into profitability.

### 5. Use Growth Phases (Advanced DCF Only)
If you selected Advanced DCF and set “Years to Forecast” to 3 or more, a purple **Growth Phases** track appears below the projection method.

- **Add a phase** – Click anywhere on the track to drop a split marker.
- **Adjust timing** – Drag the circular markers left/right to change timing.
- **Remove a phase** – Double‑click (or double‑tap) a marker to delete it.

Each phase can have its own growth rate and margin inputs, letting you model complex growth trajectories.

### 6. Compare Multiple Scenarios
A single valuation can hold up to **10 different scenarios**. 

- **Add a scenario** – Click the **“＋”** icon next to the Scenarios selector.
- **Reorder scenarios** – Open the dropdown and use the **vertical grip handle (⋮⋮)** to drag scenarios.
- **Duplicate a scenario** – Create a copy to tweak assumptions for sensitivity analysis.

The **Scenario Comparison Table** shows a side‑by‑side summary, making it easy to see how assumptions affect intrinsic value and IRR.

### 7. Save, Load, and Share Your Work
#### Guest Mode
- Your valuation is stored **locally in your browser**. You can download it as a `.json` file at any time.

#### Account Mode (Recommended)
- **Create a free account** to unlock automatic cloud saves, real‑time cross‑device syncing, and the ability to store multiple valuations in your workspace.
- Use the **Valuations dropdown** in the header to manage different projects.

---

## ✨ Key Features at a Glance

- **Multi-Metric Modeling** – DCF using FCF, Earnings, EBITDA, or OCF.
- **Live Market Data** – Real-time stock prices and TTM financials for thousands of US-listed companies.
- **Advanced Growth Phases** – Draggable UI for multi-stage growth modeling.
- **Three Projection Strategies** – Per-share, total metric, or revenue-margin build.
- **Cloud Sync & Auto‑Save** – Seamless saving across devices when logged in.
- **Export/Import** – Download valuations as JSON for backup or sharing.
- **Premium Dark/Light UI** – Modern, high-contrast interface designed for clarity.

---

## ❓ Frequently Asked Questions

### Can I use FairValue Studio for free?
Yes. The app is completely free. You can create an unlimited number of valuations and scenarios without any subscription.

### What happens if I close the browser?
If you are using **guest mode**, your data is stored locally in your browser. If you are **logged in**, your work is automatically synced to the cloud.

### Which stock exchanges are supported?
The application currently supports equities listed on major US exchanges (**NASDAQ** and **NYSE**). Financial data retrieval and TTM financials are specifically optimized for the US market.

### How many scenarios can I have?
Each valuation supports up to 10 scenarios. Use them to model Bull, Base, and Bear cases.

---

## 🛠 Need Help?

- **In‑app guide** – Click the “How to Use” panel in the header for a concise overview.
- **Sample valuation** – Click “Load Sample Valuation” inside the guide to see a pre‑configured example.
- **Report issues** – If you encounter a bug, please open an issue on the project’s GitHub repository.

Happy valuing! 🚀
