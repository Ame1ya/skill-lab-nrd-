
const STORAGE_KEY = "pennywise-transactions-v1";

const form = document.getElementById("transactionForm");
const list = document.getElementById("transactionList");
const filter = document.getElementById("filter");
const dateInput = document.getElementById("date");

// Display today's date
const today = new Date();

const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().slice(0, 10);

dateInput.value = localDate;

document.getElementById("today").textContent =
    today.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

// Icons for expense categories
const categoryIcons = {
    Food: "🍽️",
    Travel: "🚌",
    Shopping: "🛍️",
    Education: "📚",
    Entertainment: "🎬",
    Bills: "🧾",
    Health: "💊",
    Salary: "💼",
    Other: "💳"
};

// Load saved transactions
function loadTransactions() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(saved)
            ? saved.filter(item =>
                item &&
                typeof item.description === "string" &&
                Number.isFinite(Number(item.amount)) &&
                ["income", "expense"].includes(item.type)
            )
            : [];
    } catch {
        return [];
    }
}

let transactions = loadTransactions();

// Save transactions in browser storage
function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );
    } catch {
        alert("Unable to save transactions in this browser.");
    }
}

// Convert amounts into Indian rupees
function money(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

// Safely display user-entered text
function safeText(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Calculate income, expenses and balance
function renderSummary() {
    const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

    document.getElementById("totalIncome").textContent =
        money(income);

    document.getElementById("totalExpenses").textContent =
        money(expenses);

    document.getElementById("balance").textContent =
        money(income - expenses);
}

// Display all transactions
function renderTransactions() {
    const selectedType = filter.value;

    const visible = transactions
        .filter(t =>
            selectedType === "all" ||
            selectedType === t.type
        )
        .slice()
        .sort((a, b) =>
            b.date.localeCompare(a.date) ||
            b.createdAt - a.createdAt
        );

    if (visible.length === 0) {
        list.innerHTML = `
            <div class="empty">
                <div class="empty-icon">🪙</div>
                <strong>No transactions yet</strong>
                <br><br>
                Add your first transaction using the form.
            </div>
        `;
        return;
    }

    list.innerHTML = visible.map(t => `
        <article class="transaction">

            <div class="transaction-icon">
                ${categoryIcons[t.category] || "💳"}
            </div>

            <div class="transaction-info">
                <p class="transaction-title">
                    ${safeText(t.description)}
                </p>

                <span class="transaction-meta">
                    ${safeText(t.category)} · ${safeText(t.date)}
                </span>
            </div>

            <div class="transaction-right">
                <div class="amount ${t.type}">
                    ${t.type === "income" ? "+" : "−"}${money(Number(t.amount))}
                </div>

                <button
                    class="delete"
                    type="button"
                    data-delete="${safeText(t.id)}"
                >
                    Delete
                </button>
            </div>

        </article>
    `).join("");
}

// Update the complete dashboard
function render() {
    renderSummary();
    renderTransactions();
}

// Add a new transaction
form.addEventListener("submit", function(event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const description =
        document.getElementById("description").value.trim();

    const amount =
        Number(document.getElementById("amount").value);

    const date = dateInput.value;

    if (
        !description ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !date
    ) {
        alert("Please enter valid transaction details.");
        return;
    }

    const transaction = {
        id: (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : String(Date.now()) + Math.random().toString(16).slice(2),

        description: description,
        amount: Math.round(amount * 100) / 100,
        type: document.getElementById("type").value,
        category: document.getElementById("category").value,
        date: date,
        createdAt: Date.now()
    };

    transactions.push(transaction);

    saveTransactions();

    form.reset();
    dateInput.value = localDate;
    document.getElementById("type").value = "expense";
    filter.value = "all";

    render();

    document.getElementById("description").focus();
});

// Delete a transaction
list.addEventListener("click", function(event) {
    const button = event.target.closest("[data-delete]");

    if (!button) return;

    const id = button.dataset.delete;

    transactions = transactions.filter(t => t.id !== id);

    saveTransactions();
    render();
});

// Filter income and expenses
filter.addEventListener("change", renderTransactions);

// Display saved transactions when the page opens
render();
