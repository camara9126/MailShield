/*
 * ==========================================
 * MailShield — History Manager
 * ==========================================
 *
 * Le stockage est effectué par le Service Worker.
 */


/*
 * ==========================================
 * ENREGISTRER UNE ANALYSE
 * ==========================================
 */

function saveAnalysisHistory(email, risk) {

    if (!email || !risk) {
        return;
    }


    const analysis = {

        id:
            Date.now(),

        sender:
            email.sender || "",

        senderName:
            email.senderName || "",

        subject:
            email.subject || "",

        score:
            Number(risk.score) || 0,

        level:
            risk.level || "low",

        summary:
            risk.summary || "",

        warnings:
            Array.isArray(risk.warnings)
                ? risk.warnings
                : [],

        recommendation:
            risk.recommendation || "",

        breakdown:
            risk.breakdown || {},


        date:
            Date.now()
    };


    /*
     * Envoyer l'analyse au Service Worker
     */

    chrome.runtime.sendMessage({

        type:
            "SAVE_ANALYSIS",

        analysis:
            analysis

    }, response => {

        if (
            chrome.runtime.lastError
        ) {

            console.error(
                "❌ MailShield — erreur de communication avec le Service Worker :",
                chrome.runtime.lastError.message
            );

            return;
        }


        if (
            response &&
            response.success
        ) {

            console.log(
                "🛡️ MailShield — analyse enregistrée dans l'historique."
            );

        } else {

            console.error(
                "❌ MailShield — impossible d'enregistrer l'analyse."
            );
        }

    });
}


/*
 * ==========================================
 * RÉCUPÉRER L'HISTORIQUE
 * ==========================================
 */

function getAnalysisHistory(callback) {

    chrome.runtime.sendMessage({

        type:
            "GET_HISTORY"

    }, response => {

        if (
            chrome.runtime.lastError
        ) {

            console.error(
                "❌ MailShield — erreur récupération historique :",
                chrome.runtime.lastError.message
            );

            callback([]);

            return;
        }


        callback(
            response &&
            Array.isArray(response.history)
                ? response.history
                : []
        );

    });
}


/*
 * ==========================================
 * SUPPRIMER L'HISTORIQUE
 * ==========================================
 */

function clearAnalysisHistory(callback) {

    chrome.runtime.sendMessage({

        type:
            "CLEAR_HISTORY"

    }, response => {

        if (
            chrome.runtime.lastError
        ) {

            console.error(
                "❌ MailShield — erreur suppression historique :",
                chrome.runtime.lastError.message
            );

            return;
        }


        if (
            callback
        ) {

            callback(
                response &&
                response.success === true
            );

        }

    });
}


/*
 * ==========================================
 * RÉCUPÉRER LES STATISTIQUES
 * ==========================================
 */

function getAnalysisStatistics(callback) {

    chrome.runtime.sendMessage({

        type:
            "GET_STATISTICS"

    }, response => {

        if (
            chrome.runtime.lastError
        ) {

            console.error(
                "❌ MailShield — erreur récupération statistiques :",
                chrome.runtime.lastError.message
            );

            callback(null);

            return;
        }


        if (
            response &&
            response.success
        ) {

            callback(
                response.statistics
            );

        } else {

            callback(null);

        }

    });
}