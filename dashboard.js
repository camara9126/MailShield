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
 * RÉCUPÉRER LES STATISTIQUES
 * ==========================================
 */

chrome.runtime.sendMessage({

    type:
        "GET_STATISTICS"

}, response => {

    if (
        chrome.runtime.lastError
    ) {

        console.error(
            "❌ MailShield — erreur dashboard :",
            chrome.runtime.lastError.message
        );

        document.getElementById("status")
            .textContent =
                "Impossible de charger les statistiques.";

        return;
    }


    if (
        !response ||
        !response.success
    ) {

        document.getElementById("status")
            .textContent =
                "Aucune statistique disponible.";

        return;
    }


    const statistics =
        response.statistics;


    /*
     * ======================================
     * AFFICHAGE
     * ======================================
     */

    document.getElementById("total")
        .textContent =
            statistics.total;


    document.getElementById("averageScore")
        .textContent =
            statistics.averageScore;


    document.getElementById("low")
        .textContent =
            statistics.low;


    document.getElementById("medium")
        .textContent =
            statistics.medium;


    document.getElementById("high")
        .textContent =
            statistics.high;


    document.getElementById("critical")
        .textContent =
            statistics.critical;


    document.getElementById("totalWarnings")
        .textContent =
            statistics.totalWarnings;


    document.getElementById("status")
        .textContent =
            "Statistiques mises à jour.";
});


/*
 * ==========================================
 * CHARGER L'HISTORIQUE
 * ==========================================
 */

chrome.runtime.sendMessage({

    type:
        "GET_HISTORY"

}, response => {

    if (
        chrome.runtime.lastError
    ) {

        console.error(
            "❌ MailShield — erreur historique :",
            chrome.runtime.lastError.message
        );

        return;
    }


    if (
        !response ||
        !response.success
    ) {

        return;
    }


    const history =
        Array.isArray(response.history)
            ? response.history
            : [];


            
    const historyList =
        document.getElementById(
            "historyList"
        );
        

        
    const riskFilter =
        document.getElementById(
            "riskFilter"
        );

    console.log(
        "🛡️ MailShield — riskFilter :",
        riskFilter
    );

    /*
     * Aucun historique
     */

    if (
        history.length === 0
    ) {

        historyList.innerHTML = `

            <p class="empty-history">

                Aucune analyse enregistrée.

            </p>

        `;

        return;
    }


    /*
     * Conteneur
     */

    historyList.innerHTML = "";

    historyList.className =
        "history-list";


    /*
     * Afficher les analyses
     */

    const selectedLevel =
    riskFilter
        ? riskFilter.value
        : "all";


    function renderHistory(historyToDisplay) {

        historyList.innerHTML = "";

        historyToDisplay.forEach(analysis => {

            const item =
                document.createElement("div");


            item.className =
                "history-item";


            item.style.cursor = "pointer";

            item.addEventListener(
                "click",
                () => {

                    console.log(
                        "🛡️ MailShield — analyse sélectionnée :",
                        analysis
                    );


                    const detail =
                        document.getElementById(
                            "analysisDetail"
                        );


                    const detailContent =
                        document.getElementById(
                            "detailContent"
                        );


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

                            <strong>💡 Recommandation</strong>

                            <p>
                                ${escapeHtml(
                                    analysis.recommendation ||
                                    "Aucune recommandation disponible."
                                )}
                            </p>

                        </div>


                        <div class="detail-section">

                            <h3>⚠️ Signaux détectés</h3>

                            <div id="detailWarnings">

                                ${
                                    Array.isArray(
                                        analysis.warnings
                                    ) && analysis.warnings.length > 0

                                    ?

                                    analysis.warnings
                                        .map(warning => `

                                            <div class="warning-item">

                                                ⚠️

                                                ${escapeHtml(
                                                    warning.message ||
                                                    warning
                                                )}

                                            </div>

                                        `)
                                        .join("")

                                    :

                                    `<p>
                                        Aucun signal détecté.
                                    </p>`
                                }

                            </div>

                        </div>


                        <div class="detail-section">

                            <h3>📊 Analyse</h3>

                            <div class="detail-breakdown">

                                <div>
                                    👤 Expéditeur :
                                    <strong>
                                        ${analysis.breakdown?.sender ?? 0}
                                    </strong>
                                </div>

                                <div>
                                    🔗 Liens :
                                    <strong>
                                        ${analysis.breakdown?.links ?? 0}
                                    </strong>
                                </div>

                                <div>
                                    📝 Contenu :
                                    <strong>
                                        ${analysis.breakdown?.content ?? 0}
                                    </strong>
                                </div>

                                <div>
                                    🌐 Contexte :
                                    <strong>
                                        ${analysis.breakdown?.context ?? 0}
                                    </strong>
                                </div>

                                <div>
                                    🧠 Comportement :
                                    <strong>
                                        ${analysis.breakdown?.behavior ?? 0}
                                    </strong>
                                </div>

                                <div>
                                    📎 Pièces jointes :
                                    <strong>
                                        ${analysis.breakdown?.attachments ?? 0}
                                    </strong>
                                </div>

                            </div>

                        </div>

                    `;


                    detail.style.display =
                        "block";


                    detail.scrollIntoView({
                        behavior: "smooth"
                    });

                }
            );


            /*
            * Niveau
            */

            let levelText =
                "Faible";


            if (
                analysis.level === "medium"
            ) {

                levelText =
                    "Moyen";

            }

            else if (
                analysis.level === "high"
            ) {

                levelText =
                    "Élevé";

            }

            else if (
                analysis.level === "critical"
            ) {

                levelText =
                    "Critique";

            }


            const levelClass =
                `level-${analysis.level}`;


            /*
            * Date
            */

            const date =
                analysis.date
                    ? new Date(
                        analysis.date
                    ).toLocaleString("fr-FR")
                    : "";


            /*
            * HTML
            */

            item.innerHTML = `

                <div class="history-info">

                    <div class="history-sender">

                        ${escapeHtml(
                            analysis.senderName ||
                            analysis.sender ||
                            "Expéditeur inconnu"
                        )}

                    </div>

                    <div class="history-subject">

                        ${escapeHtml(
                            analysis.subject ||
                            "Sans sujet"
                        )}

                    </div>

                    <div class="history-subject">

                        ${date}

                    </div>

                </div>


                <div class="history-score">

                    ${analysis.score} / 100

                </div>


                <div class="history-level ${levelClass}">

                    ${levelText}

                </div>

            `;


            historyList.appendChild(
                item
            );

        });


    };

        renderHistory(history);

        console.log(
            "🛡️ TEST — arrivée avant le filtre"
        );

        if (riskFilter) {

            riskFilter.addEventListener(
                "change",
                () => {

                    const selectedLevel =
                        riskFilter.value;

                    console.log(
                        "🛡️ Filtre sélectionné :",
                        selectedLevel
                    );

                    const filteredHistory =
                        selectedLevel === "all"

                            ? history

                            : history.filter(
                                analysis =>
                                    analysis.level === selectedLevel
                            );

                    console.log(
                        "🛡️ Analyses après filtrage :",
                        filteredHistory.length
                    );

                    renderHistory(
                        filteredHistory
                    );

                }
            );

        }

        console.log(
            "🛡️ TEST — après le filtre"
        );
    
});


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