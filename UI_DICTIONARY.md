# UI Architecture & Component Dictionary

**Document Purpose:** A formal mapping of the visual user interface (UI) to their corresponding React components and file structures to facilitate accurate AI context and feature implementation.

## 1. Global Workspace (`src/App.tsx`)
The overarching application shell that manages authentication, layout structure, and scenario state.

| UI Element Name | React Component | Description |
| :--- | :--- | :--- |
| **Header Bar** | `<Header />` | Top navigation containing user authentication, cloud valuation management, manual download/upload, and the "How to Use" expandable guide. |
| **Theme Toggle** | `<ThemeToggle />` | Component in the Header allowing users to switch between Light, Dark, and System display modes. |
| **Scenario Tabs** | `<ScenarioSelector />` | The horizontal row of scenario toggle buttons (e.g., "Pessimistic", "Base", "+") located above the main panel. |
| **Comparison Table** | `<ScenarioComparisonTable />` | The wide tabular component at the bottom comparing all created scenarios side-by-side. |
| **Text Summary Card** | Card in `App.tsx` | The block at the very bottom containing the detailed textual output and a "Copy All" button for LLM analysis. |

## 2. Main Layout (`src/components/ScenarioPanel.tsx`)
The primary wrapper component responsible for rendering a single scenario's inputs and outputs.

| UI Element Name | CSS/Structure | Description |
| :--- | :--- | :--- |
| **Scenario Panel** | `<ScenarioPanel />` | The grid container managing the layout for the active scenario. |
| **Inputs Track (Left)** | `lg:col-span-4` | The left-hand column containing all user-editable assumption cards. |
| **Sticky Track (Right)** | `lg:col-span-8` | The right-hand column utilizing a scrolling sticky wrapper to display results and charts alongside the inputs track. |

## 3. Left Column: Input Elements
These components reside within the "Inputs Track" and handle user data entry.

| UI Element Name | React Component | Description |
| :--- | :--- | :--- |
| **Assumptions Card** | `<AssumptionsCard />` | A single unified component managing all core scenario inputs. It consolidates scenario metadata (name, DCF method, copy/reset/delete actions), single-value inputs (buy price, forecast duration, discount rate, terminal value), and all multi-stage growth phase inputs (including the interactive timeline track for Advanced DCF). |

## 4. Right Column: Output Elements
These components reside within the "Sticky Track" and display calculated outputs and visualizations.

| UI Element Name | React Component | Description |
| :--- | :--- | :--- |
| **Results Card** | `<ResultsCard />` | The top summary panel displaying the primary "Intrinsic Value", Margin of Safety, Upside percentage, and IRR. |
| **Simple Chart** | `<GrowthProjectionChart />` | The basic visualization component rendered exclusively when the "Basic DCF" method is selected. |
| **Advanced Chart** | `<FreeCashflowChart />` | The complex chart rendered for "Advanced DCF". Its header contains the integrated **Valuation Breakdown** summary and year-by-year detailed list. |

## 5. Overlays & Modals
Floating components used for specific workflows or secondary configurations.

| UI Element Name | React Component | Description |
| :--- | :--- | :--- |
| **Stock Search** | `<StockSearchModal />` | Modal triggered via the search icon in input cards for finding and selecting public tickers. |
| **Data Preview** | `<StockDataPreviewModal />` | Displays live price (Finnhub) and TTM financial data (Yahoo Finance) for review before applying metrics to the scenario. |
| **Auth / Account** | `<AuthModal />` / `<AccountModal />` | Modals for login, signup, and user profile management. |
| **Copy Scenario** | `<CopyScenarioModal />` | Advanced duplication modal allowing users to copy a scenario to a different valuation workspace. |
| **Workspace Modals**| `WorkspaceModals.tsx` | A collection of utility modals for managing valuations (save, delete, rename), file upload/download, and guest session retention. |

## AI Context Protocol
When requesting modifications, utilize the exact **UI Element Name** or **React Component** listed above to ensure precise targeting (e.g., *"Target the Assumptions Card to add a tooltip to the Discount Rate input"*).
