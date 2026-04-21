# Modal & Overlay Dictionary

**Document Purpose:** A specialized mapping of all modal dialogs, confirmation prompts, and focused overlays within the application to ensure consistency in UX and logic.

## 1. Authentication & Session (`src/components/modals/AuthModal.tsx`, `AccountModal.tsx`)
These modals manage user identity and state transitions between guest and authenticated sessions.

| UI Element Name | React Component | Trigger / Purpose |
| :--- | :--- | :--- |
| **Auth Modal** | `<AuthModal />` | Triggered by "Log in" in the Header. Handles both Login and Signup via tabs. |
| **Account Settings** | `<AccountModal />` | Triggered by clicking the username in the Header. Manages profile updates and password changes. |
| **Signup Success** | `<SignupSuccessModal />` | Auto-triggered after successful account registration. |
| **Session Retention** | `<RetainGuestModal />` | Triggered during login if guest data is detected. Asks to save data to the new account. |

## 2. Workspace Management (`src/components/modals/WorkspaceModals.tsx`)
Modals responsible for managing valuation entities (JSON files or Cloud records).

| UI Element Name | React Component | Trigger / Purpose |
| :--- | :--- | :--- |
| **New Valuation** | `<NewValuationModal />` | Triggered by "✨ New valuation..." in the valuation selector. |
| **Save As Copy** | `<SaveAsModal />` | Triggered by "Save As New". Creates a full duplicate of the current valuation. |
| **Rename Valuation** | `<RenameModal />` | Triggered by "Rename" button next to the valuation selector. |
| **Delete Valuation** | `<DeleteModal />` | Triggered by "Delete" button. Permanent removal of a valuation record. |
| **Export (.json)** | `<DownloadModal />` | Triggered by "Download Valuation". Configures the filename for JSON export. |
| **Import (.json)** | `<UploadModal />` | Triggered by "Upload Valuation". Warning prompt before replacing workspace data. |

## 3. Scenario & Interaction Logic
Workflow-specific modals for data manipulation and confirmations.

| UI Element Name | React Component | Trigger / Purpose |
| :--- | :--- | :--- |
| **Copy Scenario** | `<CopyScenarioModal />` | Triggered by "Duplicate" in ScenarioMetaCard. Options for Local vs. Cross-Valuation copy. |
| **Generic Confirm** | `<GenericConfirmModal />` | Used for high-impact actions like "Reset All Scenarios" or guest data errors. |
| **Save Feedback** | `<SaveSuccessModal />` | A centered success notification triggered after successful cloud synchronization. |

## 4. Market Data & AI Search (`src/components/modals/StockSearchModal.tsx`, etc.)
Dialogs used for fetching and validating external financial data.

| UI Element Name | React Component | Trigger / Purpose |
| :--- | :--- | :--- |
| **Stock Search** | `<StockSearchModal />` | Triggered by Search Icons in input fields. Searches for tickers/company names. |
| **Market Data Preview** | `<StockDataPreviewModal />` | Triggered after selecting a stock. Displays TTM data and AI retrieval options. |

## 5. Layout-Integrated Overlays
Components that use modal-like backdrops but are rendered inline within the layout.

| UI Element Name | Location | Description |
| :--- | :--- | :--- |
| **Scenario Switcher** | `ScenarioSelector.tsx` | Reorderable overlay for switching and organizing scenario tabs. |
| **Valuation List** | `Header.tsx` | Dropdown overlay for switching between different cloud-saved valuations. |
