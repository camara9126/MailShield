/*
 * ==========================================
 * MAILSHIELD - RISK ENGINE
 * ==========================================
 *
 * Agrège les différents signaux de sécurité
 * afin de produire un score global de 0 à 100.
 *
 * Responsabilités :
 * - récupérer les analyses existantes
 * - éviter le double comptage
 * - appliquer des plafonds par catégorie
 * - analyser les comportements combinés
 * - analyser les pièces jointes
 * - déterminer le niveau de risque
 */

function calculateRisk(email) {

    /*
     * ==========================================
     * CONFIGURATION DES PLAFONDS
     * ==========================================
     *
     * Plafonds par catégorie. Le score final est limité à 100.
     */

    const MAX_SENDER_SCORE = 20;
    const MAX_LINK_SCORE = 30;
    const MAX_CONTENT_SCORE = 20;
    const MAX_CONTEXT_SCORE = 10;
    const MAX_BEHAVIOR_SCORE = 10;
    const MAX_ATTACHMENT_SCORE = 10;


    /*
     * ==========================================
     * SCORES PAR CATÉGORIE
     * ==========================================
     */

    let senderScore = 0;
    let linkScore = 0;
    let contentScore = 0;
    let contextScore = 0;
    let behaviorScore = 0;
    let attachmentScore = 0;


    /*
     * ==========================================
     * LISTE GLOBALE DES AVERTISSEMENTS
     * ==========================================
     */

    const warnings = [];


    /*
     * ==========================================
     * AJOUT D'UN SIGNAL
     * ==========================================
     */

    function addSignal(category, points, message) {

        if (points <= 0) {
            return;
        }

        let maxScore = 0;
        let currentScore = 0;


        /*
         * Déterminer le plafond
         */

        if (category === "sender") {

            maxScore = MAX_SENDER_SCORE;
            currentScore = senderScore;

        } else if (category === "link") {

            maxScore = MAX_LINK_SCORE;
            currentScore = linkScore;

        } else if (category === "content") {

            maxScore = MAX_CONTENT_SCORE;
            currentScore = contentScore;

        } else if (category === "context") {

            maxScore = MAX_CONTEXT_SCORE;
            currentScore = contextScore;

        } else if (category === "behavior") {

            maxScore = MAX_BEHAVIOR_SCORE;
            currentScore = behaviorScore;

        } else if (category === "attachment") {

            maxScore = MAX_ATTACHMENT_SCORE;
            currentScore = attachmentScore;

        } else {

            return;
        }


        /*
         * Points disponibles
         */

        const remaining =
            maxScore - currentScore;


        if (remaining <= 0) {
            return;
        }


        /*
         * Points réellement appliqués
         */

        const appliedPoints =
            Math.min(
                points,
                remaining
            );


        /*
         * Mise à jour
         */

        if (category === "sender") {

            senderScore += appliedPoints;

        } else if (category === "link") {

            linkScore += appliedPoints;

        } else if (category === "content") {

            contentScore += appliedPoints;

        } else if (category === "context") {

            contextScore += appliedPoints;

        } else if (category === "behavior") {

            behaviorScore += appliedPoints;

        } else if (category === "attachment") {

            attachmentScore += appliedPoints;
        }


        /*
         * Ajouter le warning
         */

        warnings.push({

            category: category,

            points: appliedPoints,

            message: message
        });
    }


    /*
     * ==========================================
     * 1. ANALYSE DE L'EXPÉDITEUR
     * ==========================================
     */

    if (email.senderAnalysis) {

        const analysis =
            email.senderAnalysis;


        const score =
            Math.min(
                Number(analysis.score) || 0,
                MAX_SENDER_SCORE
            );


        if (
            score > 0 &&
            analysis.warnings &&
            analysis.warnings.length > 0
        ) {

            const pointsPerWarning =
                score /
                analysis.warnings.length;


            analysis.warnings.forEach(
                warning => {

                    const message =
                        typeof warning === "string"
                            ? warning
                            : warning.message || String(warning);


                    addSignal(
                        "sender",
                        pointsPerWarning,
                        `Expéditeur : ${message}`
                    );
                }
            );
        }
    }


    /*
     * ==========================================
     * 2. ANALYSE DES LIENS
     * ==========================================
     */

    if (
        email.links &&
        email.links.length > 0
    ) {

        /*
         * On récupère uniquement
         * les liens présentant un risque.
         */

        const analyzedLinks =
            email.links
                .filter(
                    link =>
                        link.analysis &&
                        Number(link.analysis.score) > 0
                )
                .sort(
                    (a, b) =>
                        Number(b.analysis.score) -
                        Number(a.analysis.score)
                );


        if (analyzedLinks.length > 0) {

            analyzedLinks.forEach(
                (link, index) => {

                    const analysis =
                        link.analysis;


                    let points =
                        Number(analysis.score) || 0;


                 /*
                    * ==========================================
                    * PONDÉRATION DES LIENS
                    * ==========================================
                    *
                    * Le premier lien suspect conserve son poids
                    * principal.
                    *
                    * Les liens suivants contribuent également,
                    * mais avec un poids réduit.
                    */

                    if (index === 0) {

                        points =
                            Math.min(
                                points,
                                MAX_LINK_SCORE
                            );

                    } else if (index === 1) {

                        points =
                            Math.min(
                                points * 0.50,
                                10
                            );

                    } else {

                        points =
                            Math.min(
                                points * 0.35,
                                7
                            );
                    }


                    /*
                     * Avertissements du lien
                     */

                    if (
                        analysis.warnings &&
                        analysis.warnings.length > 0
                    ) {

                        const pointsPerWarning =
                            points /
                            analysis.warnings.length;


                        analysis.warnings.forEach(
                            warning => {

                                const message =
                                    typeof warning === "string"
                                        ? warning
                                        : warning.message ||
                                          String(warning);


                                addSignal(
                                    "link",
                                    pointsPerWarning,
                                    `Lien : ${message}`
                                );
                            }
                        );

                    } else {

                        addSignal(
                            "link",
                            points,
                            "Lien : Le lien présente des signaux de risque."
                        );
                    }
                }
            );
        }
    }


    /*
     * ==========================================
     * 3. ANALYSE DU CONTENU
     * ==========================================
     */

    const contentAnalysis =
        analyzeContent(
            email.body || ""
        );


    if (
        contentAnalysis &&
        contentAnalysis.warnings &&
        contentAnalysis.warnings.length > 0
    ) {

        contentAnalysis.warnings.forEach(
            warning => {

                const message =
                    typeof warning === "string"
                        ? warning
                        : warning.message ||
                          String(warning);


                addSignal(
                    "content",
                    Number(warning.points) || 0,
                    message
                );
            }
        );
    }


    /*
     * ==========================================
     * 4. ANALYSE DU CONTEXTE
     * ==========================================
     */

    const contextAnalysis =
        analyzeContext({

            senderName:
                email.senderName || "",

            senderDomain:
                email.senderAnalysis?.domain || "",

            links:
                email.links || [],

            subject:
                email.subject || "",

            body:
                email.body || ""
        });


    if (
        contextAnalysis &&
        contextAnalysis.warnings &&
        contextAnalysis.warnings.length > 0
    ) {

        contextAnalysis.warnings.forEach(
            warning => {

                const message =
                    typeof warning === "string"
                        ? warning
                        : warning.message ||
                          String(warning);


                addSignal(
                    "context",
                    Number(warning.points) || 0,
                    message
                );
            }
        );
    }


    /*
     * ==========================================
     * 5. ANALYSE DU COMPORTEMENT
     * ==========================================
     */

    const behaviorAnalysis =
        analyzeBehavior({

            senderAnalysis:
                email.senderAnalysis || {},

            links:
                email.links || [],

            body:
                email.body || "",

            attachments:
                email.attachments || []
        });


    if (
        behaviorAnalysis &&
        behaviorAnalysis.warnings &&
        behaviorAnalysis.warnings.length > 0
    ) {

        behaviorAnalysis.warnings.forEach(
            warning => {

                addSignal(
                    "behavior",
                    Number(warning.points) || 0,
                    warning.message || ""
                );
            }
        );
    }


    /*
    * ==========================================
    * 6. ANALYSE DES PIÈCES JOINTES
    * ==========================================
    */

    const attachments =
        Array.isArray(email.attachments)
            ? email.attachments
            : [];


    attachments.forEach(attachment => {

        if (
            !attachment ||
            !attachment.analysis
        ) {
            return;
        }


        const rawScore =
            Number(
                attachment.analysis.score
            ) || 0;


        if (rawScore <= 0) {
            return;
        }


        /*
        * ==========================================
        * DÉTECTION DES SIGNAUX CRITIQUES
        * ==========================================
        */

        const attachmentWarnings =
            Array.isArray(
                attachment.analysis.warnings
            )
                ? attachment.analysis.warnings
                : [];


        const hasCriticalAttachmentSignal =
            attachmentWarnings.some(warning => {

                const category =
                    typeof warning === "string"
                        ? ""
                        : warning.category || "";

                const message =
                    typeof warning === "string"
                        ? warning.toLowerCase()
                        : (warning.message || "").toLowerCase();


                return (

                    category === "dangerous-extension" ||

                    category === "double-extension" ||

                    message.includes(
                        "extension potentiellement dangereuse"
                    ) ||

                    message.includes(
                        "extension potentiellement dangereuse dissimulée"
                    )

                );

            });


        /*
        * ==========================================
        * NORMALISATION
        * ==========================================
        *
        * Les pièces jointes peuvent contribuer
        * jusqu'à 10 points au score global.
        *
        * Un signal critique utilise directement
        * le plafond de 10 points.
        */

        let normalizedScore;


        if (
            hasCriticalAttachmentSignal
        ) {

            normalizedScore =
                MAX_ATTACHMENT_SCORE;

        } else {

            normalizedScore =
                Math.min(
                    (rawScore / 100) *
                    MAX_ATTACHMENT_SCORE,
                    MAX_ATTACHMENT_SCORE
                );
        }


        /*
        * ==========================================
        * AVERTISSEMENTS
        * ==========================================
        */

        if (
            attachmentWarnings.length > 0
        ) {

            /*
            * Pour un signal critique, on ne divise
            * pas les 10 points entre tous les warnings.
            *
            * Cela évite par exemple :
            *
            * double-extension = 5
            * nom suspect = 5
            *
            * alors que le double-extension est
            * beaucoup plus important.
            */

            attachmentWarnings.forEach(
                warning => {

                    const message =
                        typeof warning === "string"
                            ? warning
                            : warning.message ||
                            String(warning);


                    const category =
                        typeof warning === "string"
                            ? ""
                            : warning.category || "";


                    let points;


                    /*
                    * Signal critique
                    */

                    if (
                        category === "double-extension" ||
                        category === "dangerous-extension"
                    ) {

                        points =
                            MAX_ATTACHMENT_SCORE;

                    } else {

                        /*
                        * Pour les autres warnings,
                        * contribution proportionnelle.
                        */

                        points =
                            normalizedScore /
                            attachmentWarnings.length;
                    }


                    addSignal(
                        "attachment",
                        points,
                        `Pièce jointe "${attachment.name}" : ${message}`
                    );

                }
            );

        } else {

            addSignal(
                "attachment",
                normalizedScore,
                `Pièce jointe "${attachment.name}" présentant des signaux de risque.`
            );

        }

    });


    /*
    * ==========================================
    * 7. DÉTECTION DES SIGNAUX CRITIQUES
    * ==========================================
    */

    let hasCriticalSignal = false;


    /*
    * Liste des signaux détectés
    */

    const criticalSignals = {

        typosquatting: false,

        suspiciousBrand: false,

        credentialRequest: false,

        financialRequest: false,

        dangerousAttachment: false,

        suspiciousLink: false,

        urgency: false
    };


    /*
    * ==========================================
    * ANALYSE DES WARNINGS
    * ==========================================
    */

    warnings.forEach(warning => {

        const message =
            (warning.message || "").toLowerCase();



        /*
        * Informations d'identification / caractère @
        */

        if (
            message.includes("informations d'identification") ||
            message.includes("caractère @")
        ) {

            hasCriticalSignal = true;
        }

        /*
        * Marque dans un domaine suspect
        */

        if (
            message.includes(
                "apparaît dans un sous-domaine"
            ) ||
            message.includes(
                "contient la marque"
            )
        ) {

            criticalSignals.suspiciousBrand = true;

            hasCriticalSignal = true;
        }


        /*
        * Demande d'authentification
        */

        if (
            message.includes(
                "informations d'authentification"
            ) ||
            message.includes(
                "mot de passe"
            ) ||
            message.includes(
                "code de vérification"
            )
        ) {

            criticalSignals.credentialRequest = true;

            hasCriticalSignal = true;
        }


        /*
        * Demande financière
        */

        if (
            message.includes(
                "informations financières"
            ) ||
            message.includes(
                "demande ou réclame un paiement"
            )
        ) {

            criticalSignals.financialRequest = true;

            hasCriticalSignal = true;
        }


        /*
        * Pièce jointe dangereuse
        */

        if (
            message.includes(
                "extension potentiellement dangereuse"
            ) ||
            message.includes(
                "extension dangereuse"
            ) ||
            message.includes(
                "extension potentiellement dangereuse dissimulée"
            )
        ) {

            criticalSignals.dangerousAttachment = true;

            hasCriticalSignal = true;
        }


        /*
        * Lien suspect
        */

        if (
            warning.category === "link"
        ) {

            criticalSignals.suspiciousLink = true;
        }


        /*
        * Urgence
        */

        if (
            message.includes(
                "langage d'urgence"
            ) ||
            message.includes(
                "langage urgent"
            )
        ) {

            criticalSignals.urgency = true;
        }

    });


    /*
    * ==========================================
    * BONUS DE COMBINAISON
    * ==========================================
    *
    * Les bonus récompensent la présence
    * simultanée de plusieurs signaux.
    *
    * Maximum : 30 points.
    */

    let combinationBonus = 0;


    /*
    * Urgence + lien suspect
    */

    if (
        criticalSignals.urgency &&
        criticalSignals.suspiciousLink
    ) {

        combinationBonus += 5;
    }


    /*
    * Urgence + authentification
    */

    if (
        criticalSignals.urgency &&
        criticalSignals.credentialRequest
    ) {

        combinationBonus += 5;
    }


    /*
    * Authentification + lien suspect
    */

    if (
        criticalSignals.credentialRequest &&
        criticalSignals.suspiciousLink
    ) {

        combinationBonus += 5;
    }


    /*
    * Typosquatting + authentification
    */

    if (
        criticalSignals.typosquatting &&
        criticalSignals.credentialRequest
    ) {

        combinationBonus += 5;
    }


    /*
    * Marque suspecte + lien suspect
    */

    if (
        criticalSignals.suspiciousBrand &&
        criticalSignals.suspiciousLink
    ) {

        combinationBonus += 5;
    }


    /*
    * Urgence + demande financière
    */

    if (
        criticalSignals.urgency &&
        criticalSignals.financialRequest
    ) {

        combinationBonus += 5;
    }


    /*
    * Maximum du bonus
    */

    combinationBonus =
        Math.min(
            combinationBonus,
            30
        );

    /*
     * ==========================================
     * 8. SCORE GLOBAL
     * ==========================================
     *
     * Les plafonds totalisent exactement 100.
     */

    let finalScore =
    Math.min(

        Math.round(senderScore) +
        Math.round(linkScore) +
        Math.round(contentScore) +
        Math.round(contextScore) +
        Math.round(behaviorScore) +
        Math.round(attachmentScore)+
        combinationBonus,

        100
    );


    /*
    * ==========================================
    * GARANTIE POUR LES SIGNAUX CRITIQUES
    * ==========================================
    *
    * Un signal critique ne doit pas produire
    * un score global artificiellement faible.
    */

    if (hasCriticalSignal) {

        finalScore =
            Math.max(
                finalScore,
                75
            );
    }


    /*
    * Sécurité finale :
    * le score doit toujours rester entre 0 et 100.
    */

    finalScore =
        Math.min(
            Math.max(finalScore, 0),
            100
        );


    /*
     * ==========================================
     * 9. NIVEAU DE RISQUE
     * ==========================================
     */

    let level = "low";

    if (
        hasCriticalSignal ||
        finalScore >= 75
    ) {

        level = "critical";

    } else if (
        finalScore >= 50
    ) {

        level = "high";

    } else if (
        finalScore >= 25
    ) {

        level = "medium";
}


    /*
     * ==========================================
     * 10. RÉSUMÉ
     * ==========================================
     */

    let summary =
        "Aucun signal important détecté.";


    let recommendation =
        "L'email semble présenter un faible niveau de risque, mais restez vigilant.";

    if (
        level === "medium"
    ) {

        summary =
            "Quelques signaux de risque ont été détectés.";

        recommendation =
            "Vérifiez l'identité de l'expéditeur avant de cliquer sur un lien ou d'ouvrir une pièce jointe.";

    } else if (
        level === "high"
    ) {

        summary =
            "Plusieurs signaux de risque importants ont été détectés.";

        recommendation =
            "Évitez les liens et les pièces jointes et vérifiez l'identité de l'expéditeur.";

    } else if (
        level === "critical"
    ) {

        summary =
            "De nombreux signaux indiquent que cet email pourrait être malveillant.";

        recommendation =
            "Ne cliquez sur aucun lien, n'ouvrez aucune pièce jointe et ne communiquez aucune information personnelle.";
    }

   

    /*
     * ==========================================
     * 11. RÉSULTAT FINAL
     * ==========================================
     */

    return {

        score:
            finalScore,

        level:

            level,

        summary:

            summary,

        warnings:

            warnings,

        recommendation:

            recommendation,

        breakdown: {

            sender:
                Math.round(senderScore),

            links:
                Math.round(linkScore),

            content:
                Math.round(contentScore),

            context:
                Math.round(contextScore),

            behavior:
                Math.round(behaviorScore),

            attachments:
                Math.round(attachmentScore)
        }
    };
}