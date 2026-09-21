/*
 * ==========================================
 * MailShield — Background Service Worker
 * ==========================================
 */

console.log(
    "🛡️ MailShield — Service Worker actif."
);


const HISTORY_KEY =
    "mailshield_history";

const MAX_HISTORY =
    100;


/*
 * ==========================================
 * COMMUNICATION
 * ==========================================
 */

chrome.runtime.onMessage.addListener(
    async (message, sender, sendResponse) => {

        if (!message) {
            return;
        }


        /*
         * ======================================
         * ENREGISTRER UNE ANALYSE
         * ======================================
         */

        if (
            message.type === "SAVE_ANALYSIS"
        ) {

            try {

                const data =
                    await chrome.storage.local.get(
                        HISTORY_KEY
                    );


                const history =
                    Array.isArray(
                        data[HISTORY_KEY]
                    )
                        ? data[HISTORY_KEY]
                        : [];


                history.unshift(
                    message.analysis
                );


                const limitedHistory =
                    history.slice(
                        0,
                        MAX_HISTORY
                    );


                await chrome.storage.local.set({

                    [HISTORY_KEY]:
                        limitedHistory

                });


                console.log(
                    "🛡️ MailShield — analyse enregistrée dans chrome.storage.local."
                );


                sendResponse({
                    success: true
                });


            } catch (error) {

                console.error(
                    "❌ MailShield — erreur stockage :",
                    error
                );


                sendResponse({

                    success: false,

                    error:
                        error.message

                });

            }


            return true;
        }


        /*
         * ======================================
         * RÉCUPÉRER L'HISTORIQUE
         * ======================================
         */

        if (
            message.type === "GET_HISTORY"
        ) {

            try {

                const data =
                    await chrome.storage.local.get(
                        HISTORY_KEY
                    );


                const history =
                    Array.isArray(
                        data[HISTORY_KEY]
                    )
                        ? data[HISTORY_KEY]
                        : [];


                sendResponse({

                    success:
                        true,

                    history:
                        history

                });


            } catch (error) {

                console.error(
                    "❌ MailShield — erreur récupération historique :",
                    error
                );


                sendResponse({

                    success:
                        false,

                    history:
                        []

                });

            }


            return true;
        }


        /*
         * ======================================
         * SUPPRIMER L'HISTORIQUE
         * ======================================
         */

        if (
            message.type === "CLEAR_HISTORY"
        ) {

            try {

                await chrome.storage.local.remove(
                    HISTORY_KEY
                );


                console.log(
                    "🗑️ MailShield — historique supprimé."
                );


                sendResponse({

                    success:
                        true

                });


            } catch (error) {

                console.error(
                    "❌ MailShield — erreur suppression historique :",
                    error
                );


                sendResponse({

                    success:
                        false

                });

            }


            return true;
        }


        /*
        * ======================================
        * STATISTIQUES
        * ======================================
        */

        if (
            message.type === "GET_STATISTICS"
        ) {

            try {

                const data =
                    await chrome.storage.local.get(
                        HISTORY_KEY
                    );


                const history =
                    Array.isArray(
                        data[HISTORY_KEY]
                    )
                        ? data[HISTORY_KEY]
                        : [];


                /*
                * Compteurs
                */

                let low = 0;
                let medium = 0;
                let high = 0;
                let critical = 0;

                let totalScore = 0;
                let totalWarnings = 0;


                history.forEach(analysis => {

                    /*
                    * Niveau de risque
                    */

                    if (analysis.level === "low") {
                        low++;
                    }

                    else if (analysis.level === "medium") {
                        medium++;
                    }

                    else if (analysis.level === "high") {
                        high++;
                    }

                    else if (analysis.level === "critical") {
                        critical++;
                    }


                    /*
                    * Score
                    */

                    totalScore +=
                        Number(analysis.score) || 0;


                    /*
                    * Signaux détectés
                    */

                    if (
                        Array.isArray(
                            analysis.warnings
                        )
                    ) {

                        totalWarnings +=
                            analysis.warnings.length;

                    }

                });


                /*
                * Score moyen
                */

                const averageScore =
                    history.length > 0
                        ? Number(
                            (
                                totalScore /
                                history.length
                            ).toFixed(2)
                    )
                    : 0;


                /*
                * Résultat
                */

                sendResponse({

                    success: true,

                    statistics: {

                        total:
                            history.length,

                        low:
                            low,

                        medium:
                            medium,

                        high:
                            high,

                        critical:
                            critical,

                        averageScore:
                            averageScore,

                        totalWarnings:
                            totalWarnings

                    }

                });


                } catch (error) {

                    console.error(
                        "❌ MailShield — erreur statistiques :",
                        error
                    );


                    sendResponse({

                        success: false,

                        statistics: {

                            total: 0,
                            low: 0,
                            medium: 0,
                            high: 0,
                            critical: 0,
                            averageScore: 0,
                            totalWarnings: 0

                        }

                    });

                }


            return true;
        }

    }
);

/*
 * ==========================================
 * OUVRIR LE DASHBOARD
 * ==========================================
 */

chrome.action.onClicked.addListener(() => {

    chrome.tabs.create({
        url: chrome.runtime.getURL(
            "dashboard.html"
        )
    });

});