/*
 * ==========================================
 * MailShield — Dashboard
 * ==========================================
 */

console.log(
    "🛡️ MailShield — Dashboard chargé."
);



/*
 * ==========================================
 * CHARGER L'HISTORIQUE DEPUIS LARAVEL
 * ==========================================
 */

async function loadLaravelHistory() {
    const historyList = document.getElementById("historyList");
    const riskFilter = document.getElementById("riskFilter");

    historyList.innerHTML = "<p>Chargement de l'historique...</p>";

    try {
        const analyses = await getMailShieldAnalyses();

        const history = analyses.map(analysis => ({
            id: analysis.id,
            sender: analysis.sender,
            senderName: analysis.sender_name,
            subject: analysis.subject,
            score: Number(analysis.risk_score) || 0,
            level: analysis.risk_level || "low",
            date: analysis.analyzed_at || analysis.created_at,
            recommendation: analysis.summary || "Aucune recommandation disponible.",
            warnings: Array.isArray(analysis.signals)
                ? analysis.signals.map(signal => ({
                    category: signal.category,
                    points: signal.points,
                    message: signal.message
                }))
                : [],
            breakdown: {}
        }));

        /*
         * Statistiques calculées à partir des analyses Laravel
         */
        const total = history.length;
        const sumScores = history.reduce(
            (sum, item) => sum + item.score,
            0
        );

        const statistics = {
            total,
            averageScore: total
                ? Number((sumScores / total).toFixed(2))
                : 0,
            low: history.filter(item => item.level === "low").length,
            medium: history.filter(item => item.level === "medium").length,
            high: history.filter(item => item.level === "high").length,
            critical: history.filter(item => item.level === "critical").length,
            totalWarnings: history.reduce(
                (sum, item) => sum + item.warnings.length,
                0
            )
        };


        function renderRiskChart(statistics) {
            const chart = document.getElementById("riskChart");

            if (!chart) return;

            const levels = [
                { key: "low", label: "Risque faible", className: "low" },
                { key: "medium", label: "Risque moyen", className: "medium" },
                { key: "high", label: "Risque élevé", className: "high" },
                { key: "critical", label: "Risque critique", className: "critical" }
            ];

            if (statistics.total === 0) {
                chart.innerHTML =
                    '<p class="risk-chart-empty">Aucune analyse disponible.</p>';
                return;
            }

            chart.innerHTML = levels.map(level => {
                const count = statistics[level.key] || 0;
                const percentage = (count / statistics.total) * 100;

                return `
                    <div class="risk-chart-row">
                        <div class="risk-chart-label">
                            <span>${level.label}</span>
                            <strong>${count} (${percentage.toFixed(1)} %)</strong>
                        </div>

                        <div
                            class="risk-chart-track"
                            role="progressbar"
                            aria-label="${level.label}"
                            aria-valuemin="0"
                            aria-valuemax="${statistics.total}"
                            aria-valuenow="${count}"
                        >
                            <div
                                class="risk-chart-bar ${level.className}"
                                style="width: ${percentage}%"
                            ></div>
                        </div>
                    </div>
                `;
            }).join("");
        }

        renderRiskChart(statistics);


        
        function renderDailyAnalysisChart(history) {
            const chart = document.getElementById("dailyAnalysisChart");

            if (!chart) return;

            if (history.length === 0) {
                chart.innerHTML =
                    '<p class="daily-chart-empty">Aucune analyse disponible.</p>';
                return;
            }

            // Regrouper les analyses par date locale
            const dailyCounts = {};

            history.forEach(analysis => {
                if (!analysis.date) return;

                const date = new Date(analysis.date);

                if (Number.isNaN(date.getTime())) return;

                const key = [
                    date.getFullYear(),
                    String(date.getMonth() + 1).padStart(2, "0"),
                    String(date.getDate()).padStart(2, "0")
                ].join("-");

                dailyCounts[key] = (dailyCounts[key] || 0) + 1;
            });

            const days = Object.entries(dailyCounts)
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB));

            if (days.length === 0) {
                chart.innerHTML =
                    '<p class="daily-chart-empty">Aucune date d’analyse disponible.</p>';
                return;
            }

            const maxCount = Math.max(...days.map(([, count]) => count));

            chart.innerHTML = days.map(([key, count]) => {
                const [year, month, day] = key.split("-").map(Number);
                const dateLabel = new Date(year, month - 1, day)
                    .toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short"
                    });

                const percentage = (count / maxCount) * 100;

                return `
                    <div class="daily-chart-row">
                        <span class="daily-chart-date">${dateLabel}</span>

                        <div
                            class="daily-chart-track"
                            role="progressbar"
                            aria-label="${dateLabel}"
                            aria-valuemin="0"
                            aria-valuemax="${maxCount}"
                            aria-valuenow="${count}"
                        >
                            <div
                                class="daily-chart-bar"
                                style="width: ${percentage}%"
                            ></div>
                        </div>

                        <span class="daily-chart-count">${count}</span>
                    </div>
                `;
            }).join("");
        }

        renderDailyAnalysisChart(history);


        document.getElementById("total").textContent = statistics.total;
        document.getElementById("averageScore").textContent = statistics.averageScore;
        document.getElementById("low").textContent = statistics.low;
        document.getElementById("medium").textContent = statistics.medium;
        document.getElementById("high").textContent = statistics.high;
        document.getElementById("critical").textContent = statistics.critical;
        document.getElementById("totalWarnings").textContent = statistics.totalWarnings;
        document.getElementById("status").textContent =
            "Historique et statistiques Laravel mis à jour.";


        


        function renderHistory(historyToDisplay) {
            historyList.innerHTML = "";
            historyList.className = "history-list";

            if (historyToDisplay.length === 0) {
                historyList.innerHTML =
                    '<p class="empty-history">Aucune analyse pour ce filtre.</p>';
                return;
            }

            historyToDisplay.forEach(analysis => {
                const item = document.createElement("div");
                item.className = "history-item";
                item.style.cursor = "pointer";

                item.addEventListener("click", () => {
                    const detail = document.getElementById("analysisDetail");
                    const detailContent = document.getElementById("detailContent");

                    const warningsHtml = analysis.warnings.length
                        ? analysis.warnings.map(warning => `
                            <div class="warning-item">
                                ⚠️ ${escapeHtml(warning.message || "")}
                            </div>
                        `).join("")
                        : "<p>Aucun signal détecté.</p>";

                    detailContent.innerHTML = `
                        <div class="detail-score">
                            <strong>
                                ${getRiskIcon(analysis.level)}
                                ${analysis.score} / 100
                            </strong>
                            <span class="detail-level ${getRiskClass(analysis.level)}">
                                ${getRiskText(analysis.level)}
                            </span>
                        </div>

                        <div class="detail-recommendation">
                            <strong>💡 Résumé / recommandation</strong>
                            <p>${escapeHtml(analysis.recommendation || "")}</p>
                        </div>

                        <div class="detail-section">
                            <h3>⚠️ Signaux détectés</h3>
                            ${warningsHtml}
                        </div>

                        <div class="detail-section">
                            <h3>📅 Date d'analyse</h3>
                            <p>${analysis.date
                                ? escapeHtml(new Date(analysis.date).toLocaleString("fr-FR"))
                                : "Date inconnue"}
                            </p>
                        </div>

                        <div class="detail-actions">
                            <button type="button" id="deleteAnalysisButton" class="delete-analysis-button">
                                🗑️ Supprimer cette analyse
                            </button>
                        </div>
                    `;

                    const deleteButton = document.getElementById("deleteAnalysisButton");

                    deleteButton.addEventListener("click", async (event) => {
                        event.stopPropagation();

                        const confirmed = confirm(
                            "Voulez-vous vraiment supprimer cette analyse ? Cette action est irréversible."
                        );

                        if (!confirmed) {
                            return;
                        }

                        deleteButton.disabled = true;
                        deleteButton.textContent = "Suppression en cours...";

                        try {
                            await deleteMailShieldAnalysis(analysis.id);

                            alert("Analyse supprimée avec succès.");

                            // Fermer les détails
                            detail.style.display = "none";

                            // Recharger l'historique depuis Laravel
                            await loadLaravelHistory();

                        } catch (error) {
                            console.error("Erreur lors de la suppression :", error);

                            alert(error.message || "Impossible de supprimer cette analyse.");

                            deleteButton.disabled = false;
                            deleteButton.textContent = "🗑️ Supprimer cette analyse";
                        }
                    });

                    detail.style.display = "block";
                    detail.scrollIntoView({ behavior: "smooth" });
                });

                const date = analysis.date
                    ? new Date(analysis.date).toLocaleString("fr-FR")
                    : "";

                const levelText = getRiskText(analysis.level)
                    .replace("RISQUE ", "");

                item.innerHTML = `
                    <div class="history-info">
                        <div class="history-sender">
                            ${escapeHtml(analysis.senderName || analysis.sender || "Expéditeur inconnu")}
                        </div>
                        <div class="history-subject">
                            ${escapeHtml(analysis.subject || "Sans sujet")}
                        </div>
                        <div class="history-subject">
                            ${escapeHtml(date)}
                        </div>
                    </div>

                    <div class="history-score">
                        ${analysis.score} / 100
                    </div>

                    <div class="history-level level-${analysis.level}">
                        ${escapeHtml(levelText)}
                    </div>
                `;

                historyList.appendChild(item);
            });
        }

        renderHistory(history);

        if (riskFilter) {
            riskFilter.onchange = () => {
                const selectedLevel = riskFilter.value;

                const filteredHistory = selectedLevel === "all"
                    ? history
                    : history.filter(item => item.level === selectedLevel);

                renderHistory(filteredHistory);
            };
        }

    } catch (error) {
        console.error("MailShield — chargement de l'historique Laravel :", error);

        historyList.innerHTML = `
            <p class="empty-history">
                Impossible de charger l'historique depuis Laravel.
                Vérifiez votre connexion et votre session.
            </p>
        `;

        document.getElementById("status").textContent =
            error.message || "Erreur lors du chargement de l'historique.";
    }
}

loadLaravelHistory();



    /*
    * ==========================================
    * PROTECTION HTML
    * ==========================================
    */

    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value;

        return div.innerHTML;
    }


    /*
    * ==========================================
    * NIVEAU DE RISQUE
    * ==========================================
    */

    function getRiskText(level) {

        switch (level) {

            case "medium":
                return "RISQUE MOYEN";

            case "high":
                return "RISQUE ÉLEVÉ";

            case "critical":
                return "RISQUE CRITIQUE";

            case "low":
            default:
                return "RISQUE FAIBLE";
        }
    }


    function getRiskIcon(level) {

        switch (level) {

            case "medium":
                return "🟠";

            case "high":
                return "🔴";

            case "critical":
                return "🚨";

            case "low":
            default:
                return "🟢";
        }
    }


    function getRiskClass(level) {

        switch (level) {

            case "medium":
                return "risk-medium";

            case "high":
                return "risk-high";

            case "critical":
                return "risk-critical";

            case "low":
            default:
                return "risk-low";
        }
    }

    document
        .getElementById("closeDetail")
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "analysisDetail"
                    )
                    .style.display = "none";

            }
        );



    /*
    * ==========================================
    * MAILSHIELD — AUTHENTIFICATION DU DASHBOARD
    * ==========================================
    */

    document.addEventListener("DOMContentLoaded", async () => {
        const loginSection = document.getElementById("loginSection");
        const dashboardContent = document.getElementById("dashboardContent");
        const loginForm = document.getElementById("loginForm");
        const loginEmail = document.getElementById("loginEmail");
        const loginPassword = document.getElementById("loginPassword");
        const loginButton = document.getElementById("loginButton");
        const loginMessage = document.getElementById("loginMessage");
        const userInfo = document.getElementById("userInfo");

        function showLogin(message = "") {
            loginSection.style.display = "block";
            dashboardContent.style.display = "none";
            userInfo.textContent = "";
            loginMessage.textContent = message;
        }

        function showDashboard(user) {
            loginSection.style.display = "none";
            dashboardContent.style.display = "block";

            userInfo.textContent = user?.email
                ? `Connecté : ${user.email}`
                : "Connecté à MailShield";
        }

        /*
        * Vérifier la session au chargement
        */
        try {
            const user = await getCurrentMailShieldUser();

            if (user) {
                showDashboard(user);
            } else {
                showLogin(
                    "Votre session est absente ou expirée. Veuillez vous connecter."
                );
            }
        } catch (error) {
            console.error(
                "MailShield — vérification de session :",
                error
            );

            showLogin(
                "Impossible de vérifier votre session. Vérifiez votre connexion au serveur puis réessayez."
            );
        }

        /*
        * Gérer la connexion
        */
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const email = loginEmail.value.trim();
            const password = loginPassword.value;

            loginButton.disabled = true;
            loginButton.textContent = "Connexion en cours...";
            loginMessage.textContent = "";

            try {
                await loginMailShield(email, password);

                // Confirmer la validité du jeton et récupérer le compte.
                const user = await getCurrentMailShieldUser();

                if (!user) {
                    showLogin(
                        "Connexion non confirmée. Veuillez réessayer."
                    );
                    return;
                }

                loginPassword.value = "";
                showDashboard(user);

            } catch (error) {
                console.error(
                    "MailShield — erreur de connexion :",
                    error
                );

                showLogin(
                    error.message || "La connexion a échoué."
                );
            } finally {
                loginButton.disabled = false;
                loginButton.textContent = "Se connecter";
            }
        });
    });



    
/*
 * ==========================================
 * MAILSHIELD — DÉCONNEXION
 * ==========================================
 */

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        logoutButton.textContent = "Déconnexion...";

        try {
            await logoutMailShield();

            document.getElementById("loginForm").reset();
            document.getElementById("loginSection").style.display = "block";
            document.getElementById("dashboardContent").style.display = "none";
            document.getElementById("loginMessage").textContent =
                "Vous êtes déconnecté.";

            document.getElementById("userInfo").textContent = "";
        } catch (error) {
            console.error("MailShield — erreur de déconnexion :", error);

            document.getElementById("loginMessage").textContent =
                "La déconnexion a rencontré un problème.";
        } finally {
            logoutButton.disabled = false;
            logoutButton.textContent = "Déconnexion";
        }
    });
});
