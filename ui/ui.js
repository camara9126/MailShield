/*
 * ==========================================
 * MAILSHIELD - USER INTERFACE
 * ==========================================
 *
 * Affichage du résultat de l'analyse
 * directement dans Gmail.
 */


/*
 * ==========================================
 * ID DU PANNEAU
 * ==========================================
 */

const MAILSHIELD_PANEL_ID =
    "mailshield-panel";


/*
 * ==========================================
 * SUPPRESSION DE L'ANCIEN PANNEAU
 * ==========================================
 */

function removeMailShieldPanel() {

    const existingPanel =
        document.getElementById(
            MAILSHIELD_PANEL_ID
        );

    if (existingPanel) {

        existingPanel.remove();

    }

}


/*
 * ==========================================
 * CRÉATION DU PANNEAU
 * ==========================================
 */

function showMailShieldPanel(risk) {

    /*
     * Supprimer l'ancien panneau
     * avant d'en créer un nouveau.
     */

    removeMailShieldPanel();


    /*
     * ==========================================
     * CONTAINER
     * ==========================================
     */

    const panel =
        document.createElement("div");

    panel.id =
        MAILSHIELD_PANEL_ID;


    /*
     * ==========================================
     * STYLE
     * ==========================================
     */

    panel.style.position = "fixed";
    panel.style.top = "20px";
    panel.style.right = "20px";
    panel.style.width = "360px";
    panel.style.maxWidth = "calc(100vw - 40px)";
    panel.style.maxHeight = "calc(80vh - 20px)";
    panel.style.overflowY = "auto";
    panel.style.boxSizing = "border-box";
    panel.style.background = "#ffffff";
    panel.style.border = "1px solid #dadce0";
    panel.style.borderRadius = "12px";
    panel.style.padding = "18px";
    panel.style.boxShadow =
        "0 4px 20px rgba(0,0,0,0.15)";
    panel.style.zIndex = "999999";
    panel.style.fontFamily =
        "Arial, sans-serif";
    panel.style.color = "#202124";


    /*
     * ==========================================
     * COULEUR DU NIVEAU
     * ==========================================
     */

    let levelColor =
        "#34a853";

    let levelIcon =
        "🟢";

    let levelText =
        "RISQUE FAIBLE";


    if (
        risk.level === "medium"
    ) {

        levelColor =
            "#fbbc04";

        levelIcon =
            "🟠";

        levelText =
            "RISQUE MOYEN";


    } else if (
        risk.level === "high"
    ) {

        levelColor =
            "#ea4335";

        levelIcon =
            "🔴";

        levelText =
            "RISQUE ÉLEVÉ";

    }


    /*
     * ==========================================
     * HEADER
     * ==========================================
     */

    const header =
        document.createElement("div");

    header.style.display =
        "flex";

    header.style.justifyContent =
        "space-between";

    header.style.alignItems =
        "center";

    header.style.marginBottom =
        "15px";


    /*
     * Titre
     */

    const title =
        document.createElement("div");

    title.innerHTML =
        "🛡️ <strong>MailShield</strong>";

    title.style.fontSize =
        "18px";


    /*
     * Bouton fermer
     */

    const closeButton =
        document.createElement("button");

    closeButton.innerText =
        "×";

    closeButton.style.border =
        "none";

    closeButton.style.background =
        "transparent";

    closeButton.style.fontSize =
        "22px";

    closeButton.style.cursor =
        "pointer";

    closeButton.style.color =
        "#5f6368";


    closeButton.addEventListener(
        "click",
        () => {

            panel.remove();

        }
    );


    header.appendChild(title);

    header.appendChild(closeButton);


    /*
     * ==========================================
     * NIVEAU DE RISQUE
     * ==========================================
     */

    const level =
        document.createElement("div");

    level.innerHTML =
        `${levelIcon} <strong>${levelText}</strong>`;

    level.style.color =
        levelColor;

    level.style.fontSize =
        "15px";

    level.style.marginBottom =
        "10px";


    /*
     * ==========================================
     * SCORE
     * ==========================================
     */

    const score =
        document.createElement("div");

    score.innerHTML =
        `<strong>${risk.score}</strong> / 100`;

    score.style.fontSize =
        "32px";

    score.style.fontWeight =
        "bold";

    score.style.color =
        levelColor;

    score.style.marginBottom =
        "8px";


    /*
     * ==========================================
     * RÉSUMÉ
     * ==========================================
     */

    const summary =
        document.createElement("div");

    summary.innerText =
        risk.summary;

    summary.style.fontSize =
        "13px";

    summary.style.color =
        "#5f6368";

    summary.style.marginBottom =
        "15px";



    /*
    * ==========================================
    * RECOMMANDATION
    * ==========================================
    */


    const recommendation =
        document.createElement("div");

    recommendation.innerHTML =
        `💡 <strong>Recommandation</strong><br>${risk.recommendation}`;

    recommendation.style.fontSize =
        "13px";

    recommendation.style.color =
        "#3c4043";

    recommendation.style.background =
        "#f8f9fa";

    recommendation.style.border =
        "1px solid #e8eaed";

    recommendation.style.borderRadius =
        "8px";

    recommendation.style.padding =
        "10px";

    recommendation.style.marginBottom =
        "15px";

    recommendation.style.lineHeight =
        "1.4";
        


    /*
     * ==========================================
     * WARNINGS
     * ==========================================
     */

    const warningsContainer =
        document.createElement("div");


    if (
        risk.warnings &&
        risk.warnings.length > 0
    ) {

        const warningTitle =
            document.createElement("div");

        warningTitle.innerText =
            "Signaux détectés";

        warningTitle.style.fontWeight =
            "bold";

        warningTitle.style.marginBottom =
            "10px";


        warningsContainer.appendChild(
            warningTitle
        );


        /*
         * ==========================================
         * GROUPEMENT DES WARNINGS PAR LIEN
         * ==========================================
         */

        const linkWarnings = {};

        const otherWarnings = [];


        risk.warnings.forEach(
            warning => {

                if (
                    warning.category === "link" &&
                    warning.url
                ) {

                    if (
                        !linkWarnings[warning.url]
                    ) {

                        linkWarnings[warning.url] =
                            [];

                    }

                    linkWarnings[warning.url].push(
                        warning
                    );

                } else {

                    otherWarnings.push(
                        warning
                    );

                }

            }
        );


        /*
         * ==========================================
         * AFFICHAGE DES LIENS
         * ==========================================
         */

        Object.keys(linkWarnings).forEach(
            url => {

                const linkGroup =
                    document.createElement("div");

                linkGroup.style.marginBottom =
                    "12px";

                linkGroup.style.padding =
                    "10px";

                linkGroup.style.background =
                    "#f8f9fa";

                linkGroup.style.borderRadius =
                    "8px";

                linkGroup.style.border =
                    "1px solid #e8eaed";


                const linkTitle =
                    document.createElement("div");

                linkTitle.innerText =
                    `🔗 ${url}`;

                linkTitle.style.fontSize =
                    "12px";

                linkTitle.style.fontWeight =
                    "bold";

                linkTitle.style.wordBreak =
                    "break-all";

                linkTitle.style.marginBottom =
                    "7px";


                linkGroup.appendChild(
                    linkTitle
                );


                linkWarnings[url].forEach(
                    warning => {

                        const item =
                            document.createElement("div");

                        /*
                         * Retirer "Lien : "
                         * puisque l'URL est déjà affichée.
                         */

                        let message =
                            warning.message;

                        message =
                            message.replace(
                                /^Lien\s*:\s*/i,
                                ""
                            );


                        item.innerText =
                            `⚠️ ${message}`;

                        item.style.fontSize =
                            "13px";

                        item.style.marginBottom =
                            "5px";

                        item.style.lineHeight =
                            "1.4";


                        linkGroup.appendChild(
                            item
                        );

                    }
                );


                warningsContainer.appendChild(
                    linkGroup
                );

            }
        );


        /*
         * ==========================================
         * AUTRES WARNINGS
         * ==========================================
         */

        otherWarnings.forEach(
            warning => {

                const item =
                    document.createElement("div");

                item.innerText =
                    `⚠️ ${warning.message}`;

                item.style.fontSize =
                    "13px";

                item.style.marginBottom =
                    "7px";

                item.style.lineHeight =
                    "1.4";


                warningsContainer.appendChild(
                    item
                );

            }
        );


    } else {

        const safe =
            document.createElement("div");

        safe.innerText =
            "✓ Aucun signal important détecté.";

        safe.style.color =
            "#34a853";

        safe.style.fontSize =
            "13px";


        warningsContainer.appendChild(
            safe
        );

    }


    /*
     * ==========================================
     * BREAKDOWN
     * ==========================================
     */

    if (
        risk.breakdown
    ) {

        const breakdownTitle =
            document.createElement("div");

        breakdownTitle.innerText =
            "Analyse";

        breakdownTitle.style.fontWeight =
            "bold";

        breakdownTitle.style.marginTop =
            "18px";

        breakdownTitle.style.marginBottom =
            "8px";


        warningsContainer.appendChild(
            breakdownTitle
        );


        const breakdown =
            document.createElement("div");

        breakdown.style.fontSize =
            "12px";

        breakdown.style.color =
            "#5f6368";

        breakdown.innerHTML = `
            👤 Expéditeur : ${Math.round(risk.breakdown.sender)}
            <br>
            🔗 Liens : ${Math.round(risk.breakdown.links)}
            <br>
            📝 Contenu : ${Math.round(risk.breakdown.content)}
            <br>
            🌐 Contexte : ${Math.round(risk.breakdown.context)}
            <br>
            🧠 Comportement : ${Math.round(risk.breakdown.behavior)}
            <br>
            📎 Pièces jointes : ${Math.round(risk.breakdown.attachments)}
        `;


        warningsContainer.appendChild(
            breakdown
        );

    }


    /*
     * ==========================================
     * ASSEMBLAGE
     * ==========================================
     */

    panel.appendChild(header);

    panel.appendChild(level);

    panel.appendChild(score);

    panel.appendChild(summary);

    panel.appendChild(recommendation);

    panel.appendChild(
        warningsContainer
    );


    /*
     * ==========================================
     * AJOUT À GMAIL
     * ==========================================
     */

    document.body.appendChild(
        panel
    );

}


/*
 * ==========================================
 * AVERTISSEMENT AVANT OUVERTURE D'UN LIEN
 * ==========================================
 */

function showLinkWarning(analysis, url) {

    const existingWarning =
        document.getElementById(
            "mailshield-link-warning"
        );

    if (existingWarning) {
        existingWarning.remove();
    }


    const overlay =
        document.createElement("div");

    overlay.id =
        "mailshield-link-warning";

    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background =
        "rgba(0, 0, 0, 0.45)";
    overlay.style.zIndex =
        "999999";
    overlay.style.display =
        "flex";
    overlay.style.alignItems =
        "center";
    overlay.style.justifyContent =
        "center";


    const box =
        document.createElement("div");

    box.style.background =
        "#ffffff";

    box.style.width =
        "420px";

    box.style.maxWidth =
        "90%";

    box.style.padding =
        "25px";

    box.style.borderRadius =
        "12px";

    box.style.boxShadow =
        "0 10px 40px rgba(0,0,0,0.25)";

    box.style.fontFamily =
        "Arial, sans-serif";


    const title =
        document.createElement("h2");

    title.textContent =
        "⚠️ Lien potentiellement dangereux";

    title.style.marginTop =
        "0";

    title.style.color =
        "#d93025";


    const message =
        document.createElement("p");

    message.textContent =
        "MailShield a détecté plusieurs signaux de risque sur ce lien.";


    const score =
        document.createElement("p");

    score.innerHTML =
        `<strong>Score de risque : ${analysis.score} / 100</strong>`;


    const reasons =
        document.createElement("div");


    const reasonsTitle =
        document.createElement("p");

    reasonsTitle.textContent =
        "Pourquoi ce lien est suspect :";

    reasonsTitle.style.fontWeight =
        "bold";

    reasonsTitle.style.marginBottom =
        "8px";


    reasons.appendChild(
        reasonsTitle
    );


    if (
        analysis.warnings &&
        analysis.warnings.length > 0
    ) {

        analysis.warnings.forEach(
            warning => {

                const reason =
                    document.createElement("div");

                reason.textContent =
                    `⚠️ ${warning}`;

                reason.style.fontSize =
                    "14px";

                reason.style.marginBottom =
                    "6px";


                reasons.appendChild(
                    reason
                );

            }
        );

    }


    const link =
        document.createElement("p");

    link.textContent =
        url;

    link.style.fontSize =
        "13px";

    link.style.wordBreak =
        "break-all";

    link.style.background =
        "#f5f5f5";

    link.style.padding =
        "8px";

    link.style.borderRadius =
        "6px";


    box.appendChild(title);

    box.appendChild(message);

    box.appendChild(score);

    box.appendChild(reasons);

    box.appendChild(link);


    /*
     * ==========================================
     * BOUTONS
     * ==========================================
     */

    const buttons =
        document.createElement("div");

    buttons.style.display =
        "flex";

    buttons.style.justifyContent =
        "flex-end";

    buttons.style.gap =
        "10px";

    buttons.style.marginTop =
        "20px";


    const backButton =
        document.createElement("button");

    backButton.textContent =
        "← Retour";

    backButton.style.padding =
        "10px 16px";

    backButton.style.border =
        "1px solid #ccc";

    backButton.style.borderRadius =
        "6px";

    backButton.style.background =
        "#ffffff";

    backButton.style.cursor =
        "pointer";


    const continueButton =
        document.createElement("button");

    continueButton.textContent =
        "Continuer";

    continueButton.style.padding =
        "10px 16px";

    continueButton.style.border =
        "none";

    continueButton.style.borderRadius =
        "6px";

    continueButton.style.background =
        "#d93025";

    continueButton.style.color =
        "#ffffff";

    continueButton.style.cursor =
        "pointer";


    buttons.appendChild(
        backButton
    );

    buttons.appendChild(
        continueButton
    );


    box.appendChild(
        buttons
    );


    /*
     * ==========================================
     * BOUTON RETOUR
     * ==========================================
     */

    backButton.addEventListener(
        "click",
        function () {

            overlay.remove();

        }
    );


    /*
     * ==========================================
     * BOUTON CONTINUER
     * ==========================================
     */

    continueButton.addEventListener(
        "click",
        function () {

            overlay.remove();

            window.open(
                url,
                "_blank"
            );

        }
    );


    overlay.appendChild(
        box
    );

    document.body.appendChild(
        overlay
    );

}