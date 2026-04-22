# FairValue Studio Data Model Documentation

This document maps the user interface (UI) labels to their corresponding JSON identifiers within the `Scenario` state. It also outlines the synchronization and isolation rules for each metric.

## 1. Global Shared Metrics
These metrics represent common company data and are shared across **all** DCF modes and metric types.

| UI Label | JSON Identifier | Sync Behavior |
| :--- | :--- | :--- |
| **Current Revenue** | `currentRevenue` | Global |
| **EBITDA** | `ebitda` | Global |
| **Operating Cash Flow** | `operatingCashflow` | Global |
| **EBITDA Per Share** | `ebitdaPerShare` | Global |
| **OCF Per Share** | `ocfPerShare` | Global |
| **Book Value** | `bookValue` | Global |
| **Shares** | `currentShares` | Global |
| **Values in Millions** | `inMillions` | Global |
| **Shares Growth (%)** | `simpleSharesGrowthRate` | Synced with Advanced Phase 1 (`sharesGrowthRates[0]`) |

---

## 2. Free Cash Flow (FCF) & Advanced DCF
These fields represent the core FCF model. The Basic FCF mode and Advanced DCF Phase 1 stay in lock-step.

| UI Label | JSON Identifier | Advanced Counterpart (Phase 1) |
| :--- | :--- | :--- |
| **Current Free Cash Flow Per Share** | `currentMetricPerShare` | Same identifier |
| **Current FCF (Total)** | `currentMetricTotal` | Same identifier |
| **FCF Growth (%)** *(Per Share)* | `simpleMetricGrowthRate` | `metricGrowthRates[0]` |
| **FCF Growth (%)** *(Total)* | `simpleMetricGrowthRateTotal` | `metricGrowthRatesTotal[0]` |
| **Revenue Growth (%)** | `simpleRevenueGrowthRate` | `revenueGrowthRates[0]` |
| **FCF Margin (%)** | `simpleFinalMargin` | `finalMargins[0]` |

---

## 3. Isolated Metrics (Basic DCF Mode Only)
These fields are used for alternative metric testing in Basic mode. Changes here **do not** affect the FCF or Advanced models.

### Net Income (Earnings) Selection
| UI Label | JSON Identifier |
| :--- | :--- |
| **Current NI Per Share**| `niCurrentMetricPerShare` |
| **Current Net Income (Total)** | `niCurrentMetricTotal` |
| **Net Income Margin (%)** | `niFinalMargin` |

### Operating Cash Flow Selection
| UI Label | JSON Identifier |
| :--- | :--- |
| **OCF Margin (%)** | `ocfFinalMargin` |
*(Current per share and total OCF values use the global shared metrics `ocfPerShare` and `operatingCashflow`)*

### EBITDA Selection
| UI Label | JSON Identifier |
| :--- | :--- |
| **EBITDA Margin (%)** | `ebitdaFinalMargin` |
*(Current per share and total EBITDA values use the global shared metrics `ebitdaPerShare` and `ebitda`)*

---

## 4. Logical Rules
- **Bidirectional Sync**: If an input is "Synced," updating it in Basic mode updates Advanced Phase 1, and vice-versa.
- **Conditional Sync**: Growth and Margin assumptions only sync from Basic to Advanced if the metric type is set to **"Free Cash Flow"**. Changes made in "Net Income" mode stay local to the Simple UI.
- **Company Data**: `currentRevenue` and `currentShares` are sources of truth shared globally. Changing them anywhere updates them everywhere.

## 5. File References
- **State Definition**: `src/types.ts`
- **Default State**: `src/utils/scenario.ts`
- **Sync Logic**: `src/components/scenario/GrowthCard.tsx`
- **Calculation Logic**: `src/utils/computeSimple.ts`