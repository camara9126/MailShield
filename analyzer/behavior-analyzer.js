/**
 * ==========================================
 * ANALYSE COMPORTEMENTALE LOCALE
 * MailShield
 * ==========================================
 *
 * Analyse les combinaisons entre :
 * - expéditeur
 * - liens
 * - contenu
 * - pièces jointes
 *
 * Le Behavior Analyzer mesure principalement
 * les corrélations entre plusieurs signaux.
 */

function analyzeBehavior(email) {

    // ========================================
    // 🧱 INITIALISATION
    // ========================================

    const result = {
        score: 0,
        warnings: []
    };


    if (!email || typeof email !== "object") {
        return result;
    }


    // ========================================
    // 📝 CONTENU
    // ========================================

    const body =
        typeof email.body === "string"
            ? email.body.toLowerCase()
            : "";


    // ========================================
    // 👤 EXPÉDITEUR
    // ========================================

    const senderAnalysis =
        email.senderAnalysis || {};


    // ========================================
    // 🔗 LIENS
    // ========================================

    const links =
        Array.isArray(email.links)
            ? email.links
            : [];


    // ========================================
    // 📎 PIÈCES JOINTES
    // ========================================

    const attachments =
        Array.isArray(email.attachments)
            ? email.attachments
            : [];


    // ========================================
    // 🔗 ANALYSE DES LIENS
    // ========================================

    const linkScores = links
        .map(link => {

            const analysis =
                link?.analysis || {};

            return {
                url:
                    link?.url || "",

                score:
                    Number(analysis.score) || 0,

                warnings:
                    Array.isArray(analysis.warnings)
                        ? analysis.warnings
                        : []
            };
        });


    /*
     * Un lien est considéré comme suspect
     * à partir de 20 points.
     */

    const suspiciousLinks =
        linkScores.filter(link =>
            link.score >= 20
        );


    const hasSuspiciousLink =
        suspiciousLinks.length > 0;


    // ========================================
    // 📎 ANALYSE DES PIÈCES JOINTES
    // ========================================

    const attachmentAnalyses =
        attachments
            .map(attachment => {

                /*
                 * L'analyse existe déjà
                 */
                if (
                    attachment &&
                    attachment.analysis
                ) {
                    return attachment.analysis;
                }


                /*
                 * Sinon on analyse localement
                 */
                if (
                    typeof window.analyzeAttachment ===
                    "function"
                ) {

                    return window.analyzeAttachment(
                        attachment
                    );
                }


                return null;
            })
            .filter(Boolean);


    /*
     * Une pièce jointe devient suspecte
     * à partir de 20 points.
     */

    const suspiciousAttachments =
        attachmentAnalyses.filter(attachment =>
            Number(attachment.score) >= 20
        );


    const hasSuspiciousAttachment =
        suspiciousAttachments.length > 0;


    // ========================================
    // 🧠 DÉTECTION DU LANGAGE URGENT
    // ========================================

    const urgencyTerms = [

        "urgent",
        "urgence",
        "immédiatement",
        "immediatement",
        "immédiate",
        "immediate",
        "rapidement",
        "sans délai",
        "sans delai",
        "dernière chance",
        "derniere chance",
        "action requise",
        "important",
        "important !",
        "votre compte sera suspendu",
        "compte suspendu"
    ];


    const hasUrgency =
        urgencyTerms.some(term =>
            body.includes(term)
        );


    // ========================================
    // 🔐 DEMANDE D'AUTHENTIFICATION
    // ========================================

    const credentialTerms = [

        "mot de passe",
        "password",
        "identifiant",
        "username",
        "login",
        "connexion",
        "connectez-vous",
        "connectez vous",
        "confirmer vos informations",
        "informations de connexion",
        "informations d'authentification",
        "authentification",
        "vérifier votre compte",
        "verifier votre compte",
        "confirmer votre compte",
        "vérifiez votre identité",
        "verifiez votre identite",
        "confirmer votre identité",
        "confirmer votre identite"
    ];


    const requestsCredentials =
        credentialTerms.some(term =>
            body.includes(term)
        );


    // ========================================
    // 💳 DEMANDE FINANCIÈRE
    // ========================================

    const financialTerms = [

        "paiement",
        "payment",
        "facture",
        "invoice",
        "carte bancaire",
        "numéro de carte",
        "numero de carte",
        "coordonnées bancaires",
        "coordonnees bancaires",
        "virement",
        "transfert",
        "iban",
        "bic",
        "paypal"
    ];


    const requestsFinancialInfo =
        financialTerms.some(term =>
            body.includes(term)
        );


    // ========================================
    // 📊 AJOUT D'UN SIGNAL
    // ========================================

    function addBehaviorWarning(
        category,
        points,
        message
    ) {

        result.warnings.push({

            category:

                category,

            points:

                points,

            message:

                message
        });


        result.score += points;
    }


    // ========================================
    // 🔗 EXPÉDITEUR + LIENS
    // ========================================

    const senderScore =
        Number(senderAnalysis.score) || 0;


    if (
        senderScore >= 20 &&
        hasSuspiciousLink
    ) {

        addBehaviorWarning(

            "sender-link-combination",

            2,

            "L'expéditeur et un ou plusieurs liens présentent simultanément des signaux de risque."
        );
    }


    // ========================================
    // ⚠️ URGENCE + LIEN
    // ========================================

    if (
        hasUrgency &&
        hasSuspiciousLink
    ) {

        addBehaviorWarning(

            "urgency-link-combination",

            2,

            "Le message utilise un langage urgent tout en contenant un lien présentant des signaux de risque."
        );
    }


    // ========================================
    // 🔐 IDENTIFIANTS + LIEN
    // ========================================

    if (
        requestsCredentials &&
        hasSuspiciousLink
    ) {

        addBehaviorWarning(

            "credential-link-combination",

            3,

            "Le message semble demander des informations d'authentification et contient un lien suspect."
        );
    }


    // ========================================
    // ⚠️ URGENCE + IDENTIFIANTS
    // ========================================

    if (
        hasUrgency &&
        requestsCredentials
    ) {

        addBehaviorWarning(

            "urgency-credential-combination",

            3,

            "Le message combine une situation urgente avec une demande d'informations d'authentification."
        );
    }


    // ========================================
    // 📎 URGENCE + PIÈCE JOINTE
    // ========================================

    if (
        hasUrgency &&
        hasSuspiciousAttachment
    ) {

        addBehaviorWarning(

            "urgency-attachment-combination",

            2,

            "Le message utilise un langage urgent et contient une pièce jointe présentant des signaux de risque."
        );
    }


    // ========================================
    // 📎 IDENTIFIANTS + PIÈCE JOINTE
    // ========================================

    if (
        requestsCredentials &&
        hasSuspiciousAttachment
    ) {

        addBehaviorWarning(

            "credential-attachment-combination",

            3,

            "Le message semble demander des informations d'authentification et contient une pièce jointe suspecte."
        );
    }


    // ========================================
    // 💳 FINANCE + PIÈCE JOINTE
    // ========================================

    if (
        requestsFinancialInfo &&
        hasSuspiciousAttachment
    ) {

        addBehaviorWarning(

            "financial-attachment-combination",

            2,

            "Le message semble contenir une demande financière et une pièce jointe présentant des signaux de risque."
        );
    }


    // ========================================
    // ⚠️ URGENCE + FINANCE
    // ========================================

    if (
        hasUrgency &&
        requestsFinancialInfo
    ) {

        addBehaviorWarning(

            "urgency-financial-combination",

            2,

            "Le message combine un langage urgent avec une demande financière."
        );
    }


    // ========================================
    // 🔥 COMBINAISON CRITIQUE
    // ========================================
    //
    // Cette règle représente une combinaison
    // de plusieurs signaux déjà détectés.
    //
    // Elle ajoute seulement un petit bonus
    // afin d'éviter le double comptage.

    if (
        hasUrgency &&
        requestsCredentials &&
        hasSuspiciousLink
    ) {

        addBehaviorWarning(

            "high-risk-combination",

            3,

            "Le message combine urgence, demande d'informations d'authentification et lien suspect."
        );
    }


    // ========================================
    // 📎 PIÈCE JOINTE + LIEN SUSPECT
    // ========================================

    if (
        hasSuspiciousAttachment &&
        hasSuspiciousLink
    ) {

        addBehaviorWarning(

            "attachment-link-combination",

            2,

            "Le message contient simultanément une pièce jointe suspecte et un lien présentant des signaux de risque."
        );
    }


    // ========================================
    // 🎯 LIMITE DU SCORE BEHAVIOR
    // ========================================
    //
    // Behavior représente maintenant
    // maximum 15 points du score global.

    result.score =
        Math.min(
            result.score,
            15
        );


    // ========================================
    // 🧪 DEBUG
    // ========================================

    // console.log(
    //     "🧠 MailShield — Behavior réel :",
    //     result
    // );


    return result;
}


// ========================================
// 🌍 EXPOSITION GLOBALE
// ========================================

window.analyzeBehavior =
    analyzeBehavior;