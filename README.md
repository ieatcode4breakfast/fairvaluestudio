# FairValue Studio

FairValue Studio is a powerful, yet intuitive multi-scenario valuation tool designed to help you quickly perform Discounted Cash Flow (DCF) analyses. Whether you need a quick sanity check on a stock or a robust, multi-phase financial model, FairValue Studio streamlines the workflow.

**Try the app live:** [https://fairvaluestudio.vercel.app/](https://fairvaluestudio.vercel.app/)

This guide will walk you through how to use the app effectively.

---

## 🚀 Getting Started

You can start using FairValue Studio immediately at [https://fairvaluestudio.vercel.app/](https://fairvaluestudio.vercel.app/)

When you open the app, you are immediately dropped into a new **Valuation**.

A single "Valuation" can hold up to **10 different Scenarios** (e.g., Base Case, Bear Case, Bull Case). You can add new scenarios using the tabs near the top of the interface. This makes it effortless to compare how sensitive a stock's intrinsic value is to your different growth assumptions. 

If you are logged into your account, your valuations are continuously **auto-saved** to the cloud. If you are using the app as a guest, creating an account will automatically migrate your guest valuation to your new account.

---

## 🛠 Which Method Should I Choose?

FairValue Studio offers two distinct valuation methods to fit your needs, selectable via the top side-panel dropdown.

### 1. Basic DCF (Quick Estimate)
The **Basic DCF** method is designed for speed. Rather than projecting year-by-year cash flows, this method applies a constant growth rate to reach a projected final value at the end of your forecast period. 

*   **Best for**: "Back-of-the-napkin" math, quick intrinsic value checks, or finding the "Implied Growth Rate" (what the market is pricing in at the current buy price).
*   **How it works**: It treats the exit price at your final year as the sole cash flow, discounting it back to the present value. This approach places greater emphasis on long-term price appreciation rather than interim yearly income.

### 2. Advanced DCF (Detailed Forecasting)
The **Advanced DCF** method is a robust setup for multi-phase growth companies where growth rates are expected to change significantly over time.

*   **Best for**: High-growth tech stocks, turnaround situations, or any company whose growth will decelerate/accelerate in distinct stages before reaching maturity.
*   **How it works**: It discounts every single yearly cash flow back to its present value, and adds that to the present value of the terminal value.

#### Using the Growth Phases Slider
In the Advanced DCF, if you set your "Years to Forecast" to 3 or more, a draggable **Growth Phases** track will appear:
*   **Add a Phase**: Click anywhere on the purple track to drop a split marker. 
*   **Adjust Timing**: Drag the circular markers left and right to adjust how long each growth phase lasts. 
*   **Remove a Phase**: Double-click or double-tap a marker to remove it.

You can create up to 10 distinct phases, each with its own tunable growth rate and margin inputs.

---

## 📊 Projection Strategies

For both Basic and Advanced DCFs, you aren't limited to just plugging in "Cash Flow." The app allows you to project the financials using three distinct bottom-up approaches:

1.  **Per Share Method**: The simplest mode. Project growth directly on a per-share basis (e.g., FCF Per Share).
2.  **Total FCF & Share Count**: Input the total company cash flows (in Millions or Billions) and combine it with a projected Share Change percentage. This allows you to accurately model the effects of aggressive share buybacks or shareholder dilution over time.
3.  **Revenue & Margin Build**: The most robust approach. Project Total Revenue growth, apply a targeted Final FCF Margin percentage, and factor in share-count changes. Perfect for currently unprofitable companies that you expect to scale into profitability.

---

## 🤖 The "Pro Tip": Validating with AI

Valuations are only as good as the assumptions behind them. At the very bottom of the app, you will find a **Text Summary** block.

Once you have finished tweaking your inputs, click the **Copy Text** button. You can then paste this dense, formatted summary into ChatGPT, Claude, or Gemini alongside a prompt like:
> *"Here is my DCF model for [Ticker]. Please analyze my assumptions for Revenue Growth and Terminal Multiple. Are they realistic given the company's historical performance and current macroeconomic environment?"*

---

## 💾 Exporting and Backups

Even with cloud auto-save, you remain in full control of your data.
*   **Download Valuation**: You can export your entire valuation (with all 10 scenarios) as a `.json` file to back it up locally.
*   **Upload Valuation**: Easily restore or share a valuation by uploading a previously downloaded `.json` file.
