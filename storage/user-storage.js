/*
 * ==========================================
 * MailShield — User Storage
 * ==========================================
 *
 * Gestion locale de l'utilisateur,
 * de l'abonnement et de l'utilisation.
 */


/*
 * ==========================================
 * CLÉ DE STOCKAGE
 * ==========================================
 */

const MAILSHIELD_STORAGE_KEY =
    "mailshieldUserData";


/*
 * ==========================================
 * STRUCTURE PAR DÉFAUT
 * ==========================================
 */

const DEFAULT_USER_DATA = {

    user: {

        id: null,

        email: "",

        name: "",

        createdAt: null

    },


    subscription: {

        plan: "free",

        status: "active",

        startDate: null,

        endDate: null

    },


    usage: {

        analyses: 0,

        analysesToday: 0,

        lastAnalysisDate: null

    }

};


/*
 * ==========================================
 * RÉCUPÉRER LES DONNÉES
 * ==========================================
 */

function getUserData() {

    return new Promise((resolve, reject) => {

        chrome.storage.local.get(
            [MAILSHIELD_STORAGE_KEY],
            result => {

                if (chrome.runtime.lastError) {

                    reject(
                        chrome.runtime.lastError
                    );

                    return;
                }


                const data =
                    result[
                        MAILSHIELD_STORAGE_KEY
                    ];


                if (!data) {

                    resolve(
                        structuredClone(
                            DEFAULT_USER_DATA
                        )
                    );

                    return;
                }


                resolve(data);

            }
        );

    });

}


/*
 * ==========================================
 * créer l'utilisateur
 * ==========================================
 */

function getUser() {

    return getUserData().then(data => {

        return data.user;

    });

}


/*
 * ==========================================
 * récupérer l'abonnement
 * ==========================================
 */

function getSubscription() {

    return getUserData().then(data => {

        return data.subscription;

    });

}


/*
 * ==========================================
 * récupérer l'utilisation
 * ==========================================
 */

function getUsage() {

    return getUserData().then(data => {

        return data.usage;

    });

}


/*
 * ==========================================
 * compter les analyses
 * ==========================================
 */

function incrementAnalysis() {

    return getUserData().then(data => {

        const today =
            new Date().toISOString().split("T")[0];


        /*
         * Nouveau jour
         */

        if (
            data.usage.lastAnalysisDate !== today
        ) {

            data.usage.analysesToday = 0;

            data.usage.lastAnalysisDate =
                today;
        }


        /*
         * Compteur global
         */

        data.usage.analyses =
            Number(data.usage.analyses || 0) + 1;


        /*
         * Compteur journalier
         */

        data.usage.analysesToday =
            Number(data.usage.analysesToday || 0) + 1;


        return saveUserData(data);

    });

}


/*
 * ==========================================
 * vérifier les droits d'analyse
 * ==========================================
 */

function canAnalyze() {

    return getUserData().then(data => {

        const subscription =
            data.subscription;

        const usage =
            data.usage;


        /*
         * ==============================
         * ABONNEMENT PREMIUM
         * ==============================
         */

        if (
            subscription.plan === "premium" &&
            subscription.status === "active"
        ) {

            return {
                allowed: true,
                reason: null
            };

        }


        /*
         * ==============================
         * ABONNEMENT INACTIF
         * ==============================
         */

        if (
            subscription.status !== "active"
        ) {

            return {
                allowed: false,
                reason:
                    "Votre abonnement n'est pas actif."
            };

        }


        /*
         * ==============================
         * LIMITE FREE
         * ==============================
         */

        const dailyLimit = 10;


        if (
            usage.analysesToday >= dailyLimit
        ) {

            return {
                allowed: false,
                reason:
                    "Vous avez atteint la limite quotidienne du plan Free."
            };

        }


        /*
         * ==============================
         * AUTORISÉ
         * ==============================
         */

        return {
            allowed: true,
            reason: null
        };

    });

}


/*
 * ==========================================
 * ENREGISTRER LES DONNÉES
 * ==========================================
 */

function saveUserData(data) {

    return new Promise((resolve, reject) => {

        chrome.storage.local.set(

            {
                [MAILSHIELD_STORAGE_KEY]:
                    data
            },

            () => {

                if (chrome.runtime.lastError) {

                    reject(
                        chrome.runtime.lastError
                    );

                    return;
                }


                resolve(data);

            }

        );

    });

}

getUserData().then(data => {

    data.subscription.plan = "free";
    data.subscription.status = "active";

    data.usage.analysesToday = 0;
    data.usage.lastAnalysisDate =
        new Date().toISOString().split("T")[0];

    return saveUserData(data);

}).then(() => {

    console.log(
        "🛡️ MailShield — environnement de test remis en Free"
    );

});