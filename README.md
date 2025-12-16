# Swix Cortex (formerly SwixReport)

**The AI-Native Data Intelligence Platform**

Swix Cortex is a next-generation analytics engine that transforms raw data into actionable insights using advanced Large Language Models (LLMs). It connects to your data sources (PostgreSQL, CSV, etc.), understands your schema automatically, and allows you to ask questions in plain English—visualizing the answers instantly.

![Swix Cortex Dashboard](https://via.placeholder.com/1200x600?text=Swix+Cortex+Dashboard)

## 🚀 Key Features

### 🧠 AI Data Analyst
- **Natural Language Querying**: Ask "What is the average salary by department?" and get SQL + Charts.
- **Auto-Schema Discovery**: Connect any database or upload any CSV; Cortex automatically learns the structure.
- **Smart Suggestions**: Don't know what to ask? Cortex suggests relevant analytical questions based on your data.

### 📊 Dynamic Visualization
- **Auto-Chart Selection**: The system intelligently picks the best visualization (Bar, Line, Pie, Area) for your data.
- **Interactive Dashboards**: Toggle between rich charts and raw data tables instantly.
- **Real-Time Analysis**: Queries run directly against your live database or ingested CSVs.

### 🔌 Universal Data Engine
- **PostgreSQL**: First-class support for direct DB connections.
- **CSV Ingestion**: Drag-and-drop CSV files to instantly create queryable SQL tables.
- **Secure**: Enterprise-grade encryption for connection details.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **AI Engine**: OpenAI GPT-4o
- **Visualization**: Recharts
- **Styling**: Tailwind CSS + Shadcn UI
- **Auth**: Custom JWT Authentication

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL Database
- OpenAI API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/swix-cortex.git
    cd swix-cortex
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file:
    ```env
    DATABASE_URL="postgresql://user:pass@localhost:5432/swixreport"
    OPENAI_API_KEY="sk-..."
    JWT_SECRET="your-secret-key"
    ```

4.  **Initialize Database**
    ```bash
    npx prisma generate
    npx prisma db push
    npx prisma db seed  # Optional: Seeds test data
    ```

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🔮 Roadmap

- [ ] **Multi-Source Joins**: Query across different databases in a single question.
- [ ] **Scheduled Reports**: Email PDF reports automatically.
- [ ] **Team Collaboration**: Share dashboards and insights with teammates.
- [ ] **Advanced forecasting**: Use AI to predict future trends.

---

**Swix Cortex** — *Data at the speed of thought.*
