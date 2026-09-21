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
     * TOTAL = 100
     */

    const MAX_SENDER_SCORE = 20;
    const MAX_LINK_SCORE = 30;
    const MAX_CONTENT_SCORE = 20;
    const MAX_CONTEXT_SCORE = 10;
    const MAX_BEHAVIOR_SCORE = 15;
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
                     * Premier lien :
                     * poids principal.
                     */

                    if (index === 0) {

                        points =
                            Math.min(
                                points,
                                MAX_LINK_SCORE
                            );

                    } else {

                        /*
                         * Les liens supplémentaires
                         * contribuent moins.
                         */

                        points =
                            Math.min(
                                points * 0.25,
                                8
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
    email.attachments || [];

// console.log(
//     "📎 ATTACHMENTS DANS RISK ENGINE :",
//     email.attachments
// );

// console.log(
//     "📎 NOMBRE DE PIÈCES JOINTES :",
//     attachments.length
// );
attachments.forEach(
    attachment => {

        if (
            !attachment ||
            !attachment.analysis
        ) {
            return;
        }


        /*
         * Score individuel de la pièce jointe
         */

        const rawScore =
            Number(
                attachment.analysis.score
            ) || 0;


        if (rawScore <= 0) {
            return;
        }


        /*
         * ==========================================
         * NORMALISATION DU SCORE
         * ==========================================
         *
         * Attachment Analyzer :
         *
         * 0   → 0
         * 20  → 2
         * 35  → 3.5
         * 50  → 5
         * 75  → 7.5
         * 100 → 10
         *
         * Le module Pièces jointes possède
         * au maximum 10 points dans le score final.
         */

        const normalizedScore =
            Math.min(
                (rawScore / 100) *
                MAX_ATTACHMENT_SCORE,

                MAX_ATTACHMENT_SCORE
            );


        /*
         * ==========================================
         * SCORE RESTANT DISPONIBLE
         * ==========================================
         */

        const remaining =
            MAX_ATTACHMENT_SCORE -
            attachmentScore;


        if (remaining <= 0) {
            return;
        }


        /*
         * ==========================================
         * POINTS APPLIQUÉS
         * ==========================================
         */

        const appliedPoints =
            Math.min(
                normalizedScore,
                remaining
            );


        attachmentScore +=
            appliedPoints;
    }
);


    /*
     * ==========================================
     * 7. DÉTECTION DES SIGNAUX CRITIQUES
     * ==========================================
     */

    let hasCriticalSignal = false;


    warnings.forEach(
        warning => {

            const message =
                (warning.message || "")
                    .toLowerCase();


            /*
             * Typosquatting
             */

            if (
                message.includes(
                    "ressemble au domaine officiel"
                ) ||
                message.includes(
                    "forte similarité avec"
                )
            ) {

                hasCriticalSignal = true;
            }


            /*
             * Marque dans un sous-domaine
             */

            if (
                message.includes(
                    "apparaît dans un sous-domaine"
                )
            ) {

                hasCriticalSignal = true;
            }


            /*
             * Caractère @
             */

            if (
                message.includes(
                    "caractère @"
                )
            ) {

                hasCriticalSignal = true;
            }


            /*
             * Authentification
             */

            if (
                message.includes(
                    "informations d'authentification"
                ) ||
                message.includes(
                    "mot de passe"
                )
            ) {

                hasCriticalSignal = true;
            }


            /*
             * Informations financières
             */

            if (
                message.includes(
                    "informations financières"
                )
            ) {

                hasCriticalSignal = true;
            }


            /*
             * Extension dangereuse
             */

            if (
                message.includes(
                    "extension potentiellement dangereuse"
                )
            ) {

                hasCriticalSignal = true;
            }


            /*
             * Double extension
             */

            if (
                message.includes(
                    "double extension"
                )
            ) {

                hasCriticalSignal = true;
            }
        }
    );


    /*
     * ==========================================
     * 8. SCORE GLOBAL
     * ==========================================
     *
     * Les plafonds totalisent exactement 100.
     */

    const finalScore =
        Math.min(

            senderScore +
            linkScore +
            contentScore +
            contextScore +
            behaviorScore +
            attachmentScore,

            100
        );


    /*
     * ==========================================
     * 9. NIVEAU DE RISQUE
     * ==========================================
     */

    let level = "low";

    if (finalScore >= 75) {

        level = "critical";

    } else if (finalScore >= 50) {

        level = "high";

    } else if (finalScore >= 25) {

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