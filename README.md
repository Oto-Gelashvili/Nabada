# 🎮 Nabda

**Nabda** is a specialized management platform designed for playroom owners (gaming lounges, internet cafes, etc.). It provides real-time tracking of gaming stations, automated cost calculation, and deep financial analytics to help owners optimize their business operations.

---

## ✨ Key Features

### 🖥️ Station & Session Management

- **Dynamic Stations:** Monitor all hardware (PS5, PC, VR) from a centralized dashboard.
- **Smart Session Logic:**
  - **Fixed or Ongoing:** Start sessions with a set duration or let them run indefinitely until manually stopped.
  - **Real-time State Tracking:** Visual indicators for session statuses:
    - 🟢 **Ongoing:** Active sessions currently running.
    - 🔵 **Future:** Scheduled bookings.
    - ⚪ **Completed:** Past sessions stored for records.
- **Manual Overrides:** Click any active session to stop it instantly or edit details on the fly.

### 💰 Financials & Products

- **Integrated POS:** Add snacks, drinks, or extra services to any session.
- **Automatic Billing:** Costs are calculated based on your custom hourly rate plus any products consumed.
- **Daily Totals:** Quick-glance views of the current day's revenue directly on the sessions page.

### 📊 Advanced Analytics

- **Date Filtering:** View financial performance over specific time ranges.
- **Granular Insights:**
  - **Revenue per Station:** Identify which hardware is your "money maker."
  - **Product Performance:** Track which snacks/services are selling best.
  - **Revenue Trends:** Visual breakdown of money made per selected date.

### 👤 Personalization & Settings

- **Flexible Pricing:** Set your default hourly rate (default is **8 Lari/hr**) in your profile.
- **Account Management:** Update your username, email, and security credentials.
- **UI/UX:** Fully responsive design with **Multi-language (Locale)** support and **Dark/Light mode** toggling in the header.

---

## 🗄️ Database Schema

The core logic of Nabda relies on the relationship between owners, inventory, and time-sensitive session data.

### Data Tables

| Table        | Description                                                              |
| :----------- | :----------------------------------------------------------------------- |
| **Stations** | Tracks hardware (PS5, PC) and their current availability.                |
| **Sessions** | Stores start/end times, snapshots of hourly rates, and session states.   |
| **Products** | Inventory management for snacks/drinks with pricing and stock.           |
| **Users**    | Owner profiles including custom rates and UI preferences (Theme/Locale). |

---

## 🚀 Getting Started

1. **Register:** Create your owner account.
2. **Configure:** Head to the **Profile** page to set your currency and hourly service rate.
3. **Stock Up:** Add your inventory in the **Products** page.
4. **Play:** Go to the **Sessions** page to start assigning customers to stations.

> [!TIP]
> Use the **Analytics** page at the end of every week to see which stations have the highest uptime and which products need restocking!
