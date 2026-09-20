/*
 * ==========================================
 * MAILSHIELD - CONTENT ANALYZER
 * ==========================================
 *
 * Analyse le contenu textuel d'un email.
 *
 * Responsabilités :
 * - détecter les formulations suspectes
 * - détecter les demandes sensibles
 * - détecter la pression / urgence
 * - retourner des signaux de risque
 *
 * Ce fichier ne calcule PAS le score final
 * de l'email.
 */


/*
 * ==========================================
 * ANALYSE DU CONTENU
 * ==========================================
 */

function analyzeContent(body) {

    const result = {

        score: 0,

        warnings: []
    };


    /*
     * ==========================================
     * VALIDATION
     * ==========================================
     */

    if (
        !body ||
        typeof body !== "string"
    ) {

        return result;
    }


    /*
     * Normalisation du texte.
     */

    const content =
        body
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();


    /*
     * ==========================================
     * RÈGLES DE DÉTECTION
     * ==========================================
     */

    const rules = [

        /*
         * ------------------------------
         * AUTHENTIFICATION
         * ------------------------------
         */

        {
            category: "authentication",

            pattern:
                /mot de passe|password|login credentials|identifiants/i,

            points: 15,

            message:
                "Le message semble demander des informations d'authentification."
        },


        /*
         * ------------------------------
         * OTP / CODE
         * ------------------------------
         */

        {
            category: "verification",

            pattern:
                /code de vérification|verification code|security code|one[- ]time password|\botp\b/i,

            points: 15,

            message:
                "Le message demande ou mentionne un code de vérification."
        },


        /*
         * ------------------------------
         * SUSPENSION DE COMPTE
         * ------------------------------
         */

        {
            category: "threat",

            pattern:
                /compte sera supprimé|compte sera suspendu|compte suspendu|account suspended|account will be closed|account will be locked/i,

            points: 15,

            message:
                "Le message utilise une menace concernant le compte."
        },


        /*
         * ------------------------------
         * URGENCE
         * ------------------------------
         */

        {
            category: "urgency",

            pattern:
                /urgent|urgence|immédiat|immédiate|immédiatement|immediately|as soon as possible|within 24 hours|within 48 hours|action required/i,
            points: 10,

            message:
                "Le message utilise un langage d'urgence ou de pression."
        },


        /*
         * ------------------------------
         * VÉRIFICATION DU COMPTE
         * ------------------------------
         */

        {
            category: "verification",

            pattern:
                /confirmez votre compte|vérifier votre compte|verify your account|verify your identity|confirm your account|confirm your identity/i,

            points: 15,

            message:
                "Le message demande de vérifier ou confirmer le compte."
        },


        /*
         * ------------------------------
         * INFORMATIONS FINANCIÈRES
         * ------------------------------
         */

        {
            category: "financial",

            pattern:
                /carte bancaire|numéro de carte|code bancaire|credit card|card number|bank account|bank details|payment information/i,

            points: 20,

            message:
                "Le message semble demander des informations financières."
        },


        /*
         * ------------------------------
         * PAIEMENT
         * ------------------------------
         */

        {
            category: "payment",

            pattern:
                /effectuer un paiement|make a payment|payment required|paiement requis|paiement en attente|pending payment/i,

            points: 10,

            message:
                "Le message demande ou réclame un paiement."
        },


        /*
         * ------------------------------
         * RÉCOMPENSE / CADEAU
         * ------------------------------
         */

        {
            category: "reward",

            pattern:
                /vous avez gagné|vous êtes gagnant|you have won|you are a winner|claim your prize|réclamer votre prix|free gift/i,

            points: 10,

            message:
                "Le message utilise une promesse de récompense ou de gain."
        },


        /*
         * ------------------------------
         * SUPPORT TECHNIQUE
         * ------------------------------
         */

        {
            category: "support",

            pattern:
                /support technique|technical support|security team|équipe de sécurité|service informatique|it support/i,

            points: 5,

            message:
                "Le message se présente comme provenant d'un service de support ou de sécurité."
        },


        /*
         * ------------------------------
         * APPEL À L'ACTION
         * ------------------------------
         */

        {
            category: "action",

            pattern:
                /cliquez ici|click here|cliquez sur le lien|click the link|connectez-vous|sign in now|login now/i,

            points: 5,

            message:
                "Le message contient un appel direct à l'action."
        }

    ];


    /*
     * ==========================================
     * APPLICATION DES RÈGLES
     * ==========================================
     */

    rules.forEach(rule => {

        if (
            rule.pattern.test(content)
        ) {

            result.score +=
                rule.points;

            result.warnings.push({

                category:
                    rule.category,

                points:
                    rule.points,

                message:
                    rule.message
            });
        }

    });


    /*
     * ==========================================
     * PLAFOND
     * ==========================================
     *
     * Le contenu ne peut pas contribuer
     * à plus de 30 points au risque global.
     */

    result.score =
        Math.min(
            result.score,
            30
        );


    return result;
}