/*
 * ==========================================
 * MAILSHIELD - API CLIENT
 * ==========================================
 */

const MAILSHIELD_API_URL =
    "http://127.0.0.1:8000/api";



/*
 * ==========================================
 * LOGIN
 * ==========================================
 */

async function loginMailShield(
    email,
    password
) {

    const response =
        await fetch(
            `${MAILSHIELD_API_URL}/login`,
            {
                method: "POST",

                headers: {
                    "Accept":
                        "application/json",

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Échec de la connexion."
        );
    }


    if (!data.token) {

        throw new Error(
            "Aucun token reçu depuis Laravel."
        );
    }


    await saveAuthToken(
        data.token
    );


    return data;
}


/*
 * ==========================================
 * TOKEN
 * ==========================================
 */

async function getAuthToken() {

    const result =
        await chrome.storage.local.get(
            ["mailshield_token"]
        );

    return result.mailshield_token || null;
}


async function saveAuthToken(token) {

    if (!token) {
        return;
    }

    await chrome.storage.local.set({
        mailshield_token: token
    });
}


async function removeAuthToken() {

    await chrome.storage.local.remove(
        "mailshield_token"
    );
}


/*
 * ==========================================
 * LOGOUT
 * ==========================================
 */

async function logoutMailShield() {

    const token =
        await getAuthToken();


    if (!token) {
        return;
    }


    try {

        await fetch(
            `${MAILSHIELD_API_URL}/logout`,
            {
                method: "POST",

                headers: {
                    "Accept":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );

    } finally {

        await removeAuthToken();
    }
}


/*
 * ==========================================
 * UTILISATEUR CONNECTÉ
 * ==========================================
 */

async function getCurrentMailShieldUser() {

    const token =
        await getAuthToken();


    if (!token) {
        return null;
    }


    const response =
        await fetch(
            `${MAILSHIELD_API_URL}/user`,
            {
                method: "GET",

                headers: {
                    "Accept":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


    if (response.status === 401) {

        await removeAuthToken();

        return null;
    }


    if (!response.ok) {

        throw new Error(
            "Impossible de récupérer l'utilisateur."
        );
    }


    return await response.json();
}



/*
 * ==========================================
 * VÉRIFIER L'ÉTAT DE CONNEXION
 * ==========================================
 */

async function isMailShieldAuthenticated() {
    try {
        const user = await getCurrentMailShieldUser();
        return user !== null;
    } catch (error) {
        console.error(
            "MailShield : vérification de connexion impossible.",
            error.message
        );

        return false;
    }
}


/*
 * ==========================================
 * ENVOYER UNE ANALYSE
 * ==========================================
 */

async function sendMailShieldAnalysis(
    analysis
) {

    const token =
        await getAuthToken();


    if (!token) {

        throw new Error(
            "Utilisateur non connecté."
        );
    }


    const response =
        await fetch(
            `${MAILSHIELD_API_URL}/analyses`,
            {
                method: "POST",

                headers: {
                    "Accept":
                        "application/json",

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`
                },

                body: JSON.stringify(
                    analysis
                )
            }
        );


    const data =
        await response.json();


    if (response.status === 401) {

        await removeAuthToken();

        throw new Error(
            "Session expirée. Veuillez vous reconnecter."
        );
    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Impossible d'enregistrer l'analyse."
        );
    }


    return data;


}
// ==========================================
// MAILSHIELD - TEST API LARAVEL
// ==========================================

// async function testMailShieldAPI() {

//     console.log("==========================================");
//     console.log("MAILSHIELD - TEST API LARAVEL");
//     console.log("==========================================");


//     // ==========================================
//     // TEST 1 - LOGIN
//     // ==========================================

//     console.log("TEST 1 - LOGIN");

//     try {

//         const loginResult = await loginMailShield(
//             "test@mailshield.local",
//             "password"
//         );

//         console.log(
//             "TEST 1 RESULT :",
//             {
//                 success: loginResult.success,
//                 message: loginResult.message,
//                 user: loginResult.user,
//                 tokenPresent: !!loginResult.token
//             }
//         );

//     } catch (error) {

//         console.error(
//             "TEST 1 ERROR :",
//             error
//         );

//         return;
//     }


//     // ==========================================
//     // TEST 2 - TOKEN
//     // ==========================================

//     console.log("TEST 2 - TOKEN");

//     try {

//         const token =
//             await getAuthToken();

//         console.log(
//             "TEST 2 RESULT :",
//             {
//                 tokenPresent: !!token,
//                 tokenLength: token
//                     ? token.length
//                     : 0
//             }
//         );

//     } catch (error) {

//         console.error(
//             "TEST 2 ERROR :",
//             error
//         );
//     }


//     // ==========================================
//     // TEST 3 - USER
//     // ==========================================

//     console.log("TEST 3 - USER");

//     try {

//         const user =
//             await getCurrentMailShieldUser();

//         console.log(
//             "TEST 3 RESULT :",
//             user
//         );

//     } catch (error) {

//         console.error(
//             "TEST 3 ERROR :",
//             error
//         );
//     }


//     // ==========================================
//     // TEST 4 - ENVOI ANALYSE
//     // ==========================================

//     console.log("TEST 4 - ANALYSE");

//     try {

//         const analysisResult =
//             await sendMailShieldAnalysis({

//                 sender:
//                     "security@paypa1.com",

//                 sender_name:
//                     "PayPal Security",

//                 subject:
//                     "Vérification urgente de votre compte",

//                 score: 90,

//                 level:
//                     "critical",

//                 signals: [

//                     {
//                         category:
//                             "sender",

//                         points:
//                             20,

//                         message:
//                             'Le domaine "paypa1.com" présente une forte similarité avec "paypal.com".'
//                     },

//                     {
//                         category:
//                             "link",

//                         points:
//                             15,

//                         message:
//                             'Le chemin de l\'URL contient le terme "login".'
//                     },

//                     {
//                         category:
//                             "content",

//                         points:
//                             15,

//                         message:
//                             "Le message semble demander des informations d'authentification."
//                     }

//                 ]
//             });


//         console.log(
//             "TEST 4 RESULT :",
//             analysisResult
//         );

//     } catch (error) {

//         console.error(
//             "TEST 4 ERROR :",
//             error
//         );
//     }


//     console.log("==========================================");
//     console.log("FIN DES TESTS API");
//     console.log("==========================================");
// }
// testMailShieldAPI();


// ==========================================
// ENVOYER LE RÉSULTAT DU RISK ENGINE À LARAVEL
// ==========================================

async function saveRiskAnalysisToLaravel(email, risk) {

    if (!email || !risk) {
        console.warn(
            "MailShield : données d'analyse absentes."
        );

        return null;
    }

    const analysis = {

        sender:
            email.sender || null,

        sender_name:
            email.senderName ||
            email.sender_name ||
            null,

        subject:
            email.subject || null,

        score:
            Number(risk.score) || 0,

        level:
            risk.level || "low",

        signals:
            Array.isArray(risk.warnings)
                ? risk.warnings.map(signal => ({
                    category:
                        signal.category || "unknown",

                    points:
                        Number(signal.points) || 0,

                    message:
                        signal.message || ""
                }))
                : []
    };


    console.log(
        "MAILSHIELD - ANALYSE À ENVOYER :",
        analysis
    );


    
    const authenticated = await isMailShieldAuthenticated();

    if (!authenticated) {
        console.info(
            "MailShield : utilisateur non connecté. Analyse conservée localement."
        );

        return null;
    }

    return await sendMailShieldAnalysis(analysis);

}



/*
 * ==========================================
 * MAILSHIELD — HISTORIQUE LARAVEL
 * ==========================================
 */

async function getMailShieldAnalyses() {
    const token = await getAuthToken();

    if (!token) {
        throw new Error("Utilisateur non connecté.");
    }

    const response = await fetch(
        `${MAILSHIELD_API_URL}/analyses`,
        {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            }
        }
    );

    if (response.status === 401) {
        await removeAuthToken();

        throw new Error(
            "Session expirée. Veuillez vous reconnecter."
        );
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(
            data.message ||
            "Impossible de récupérer l'historique."
        );
    }

    return Array.isArray(data.analyses)
        ? data.analyses
        : [];
}


async function deleteMailShieldAnalysis(analysisId) {
    const token = await getAuthToken();

    if (!token) {
        throw new Error("Utilisateur non connecté.");
    }

    const response = await fetch(
        `${MAILSHIELD_API_URL}/analyses/${analysisId}`,
        {
            method: "DELETE",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            }
        }
    );

    if (response.status === 401) {
        await removeAuthToken();
        throw new Error("Session expirée. Veuillez vous reconnecter.");
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(
            data.message || "Impossible de supprimer cette analyse."
        );
    }

    return data;
}
