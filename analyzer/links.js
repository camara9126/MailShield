/**
 * Analyse locale des liens
 * MailShield
 */


/*
 * Services de raccourcissement d'URL connus
 */

const URL_SHORTENERS = [
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "is.gd",
    "cutt.ly",
    "shorturl.at"
];


/*
 * Termes suspects dans le chemin d'une URL
 */

const SUSPICIOUS_PATH_TERMS = [
    "login",
    "signin",
    "verify",
    "verification",
    "account",
    "password",
    "secure",
    "security",
    "payment",
    "billing",
    "confirm"
];


/*
 * Paramètres pouvant être utilisés pour
 * effectuer des redirections
 */

const REDIRECT_PARAMETERS = [
    "redirect",
    "redirect_url",
    "redirecturl",
    "return",
    "returnurl",
    "return_url",
    "url",
    "target",
    "destination"
];


/*
 * Paramètres de tracking courants.
 *
 * Ils ne constituent PAS un signal de risque
 * à eux seuls.
 */

const TRACKING_PARAMETERS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",

    "trk",
    "trackingid",
    "trackid",

    "lipi",
    "midtoken",
    "midsig",
    "trkemail",
    "eid",

    "ref",
    "refid",

    "mc_cid",
    "mc_eid",

    "fbclid",
    "gclid"
];


/*
 * Analyse d'un lien
 */

function analyzeLink(url) {

    const result = {
        url: url || "",
        domain: null,
        score: 0,
        warnings: [],
        trackingParameters: []
    };


    /*
     * Vérification de l'URL
     */

    if (
        !url ||
        typeof url !== "string"
    ) {

        const httpPoints =
            isTrustedDomain
                ? 2
                : 15;



        result.score = 40;

        result.warnings.push({
            category: "https",
            points: httpPoints,
            message: "URL invalide ou absente."
        });

        return result;
    }


    /*
     * Analyse de l'URL
     */

    const parsedUrl =
        parseUrl(url);


    if (!parsedUrl.valid) {


         const httpPoints =
            isTrustedDomain
                ? 2
                : 15;

                
        result.score = 40;

        result.warnings.push({
            category: "https",
            points: httpPoints,
            message: "L'URL n'a pas pu être analysée."
        });

        return result;
    }


    if (
        parsedUrl.username ||
        parsedUrl.password
    ) {

        result.score += 30;

        result.warnings.push({
            category: "url-credentials",
            points: 30,
            message:
                "Le lien contient des informations d'identification pouvant masquer le véritable domaine."
        });
    }

    
    /*
     * Domaine
     */

    result.domain =
        parsedUrl.rootDomain;


    /*
     * Analyse du domaine
     */

    const domainAnalysis =
        analyzeDomain(
            parsedUrl.hostname
        );


    /*
     * Score du domaine
     *
     * Maximum : 50 points.
     */

    const domainScore =
        Math.min(
            domainAnalysis.score,
            50
        );


    result.score +=
        domainScore;


    /*
     * Ajout des avertissements du domaine
     *
     * On évite les doublons.
     */

    if (
        domainAnalysis.warnings &&
        domainAnalysis.warnings.length > 0
    ) {

        domainAnalysis.warnings.forEach(
            warning => {

                if (
                    !result.warnings.includes(warning)
                ) {

                    result.warnings.push(
                        warning
                    );

                }

            }
        );
    }


    /*
     * Analyse des paramètres
     */

    let searchParams = null;

    try {

        searchParams =
            new URL(
                parsedUrl.originalUrl
            ).searchParams;

    } catch (error) {

        searchParams = null;
    }


    /*
     * Identification des paramètres de tracking
     */

    if (searchParams) {

        for (
            const parameter
            of searchParams.keys()
        ) {

            const normalizedParameter =
                parameter
                    .toLowerCase()
                    .trim();


            if (
                TRACKING_PARAMETERS.includes(
                    normalizedParameter
                )
            ) {

                result.trackingParameters.push(
                    normalizedParameter
                );
            }
        }
    }


    /*
     * Vérification du domaine de confiance
     */

    const isTrustedDomain =
        TRUSTED_DOMAINS.includes(
            parsedUrl.rootDomain
        );


    /*
     * HTTPS / HTTP
     *
     * Pour un domaine connu et fiable :
     *
     * HTTP = signal très léger.
     *
     * Pour un domaine inconnu :
     *
     * HTTP = signal plus important.
     */

    if (
        parsedUrl.protocol !== "https:"
    ) {

        const httpPoints =
            isTrustedDomain
                ? 2
                : 15;


        result.score +=
            httpPoints;


        result.warnings.push({
            category: "https",
            points: httpPoints,
            message: "Le lien n'utilise pas HTTPS."
        });
    }


    /*
     * Caractère @
     *
     * Exemple :
     *
     * https://paypal.com@evil.com
     */

    if (
        parsedUrl.originalUrl.includes("@")
    ) {

        result.score += 30;

        result.warnings.push({
            category: "url-obfuscation",
            points: 30,
            message: "Le lien contient le caractère @, pouvant masquer le véritable domaine."
        });
    }


    /*
     * Port inhabituel
     */

    if (
        parsedUrl.port &&
        parsedUrl.port !== "80" &&
        parsedUrl.port !== "443"
    ) {

         const httpPoints =
            isTrustedDomain
                ? 2
                : 15;


        result.score += 10;

        result.warnings.push({
            category: "https",
            points: httpPoints,
            message: `Le lien utilise un port inhabituel : ${parsedUrl.port}.`
        });
    }


    /*
     * URL raccourcie
     */

    if (
        URL_SHORTENERS.includes(
            parsedUrl.rootDomain
        )
    ) {

         const httpPoints =
            isTrustedDomain
                ? 2
                : 15;


        result.score += 20;

        result.warnings.push({
            category: "https",
            points: httpPoints,
            message: "Une URL raccourcie a été détectée."
        });
    }


    /*
     * Analyse du chemin
     */

    const pathname =
        (
            parsedUrl.pathname ||
            ""
        ).toLowerCase();


    const suspiciousPath =
        SUSPICIOUS_PATH_TERMS.find(
            term =>
                pathname.includes(term)
        );


    if (
        suspiciousPath
    ) {

        /*
         * Sur un domaine fiable,
         * un chemin comme /login ou /account
         * est parfaitement normal.
         */

        if (!isTrustedDomain) {


             const httpPoints =
            isTrustedDomain
                ? 2
                : 15;


            result.score += 5;

            result.warnings.push({
                category: "https",
                points: httpPoints,
                message: `Le chemin de l'URL contient le terme "${suspiciousPath}".`
            });
        }
    }


    /*
     * Détection des redirections
     */

    if (searchParams) {

        let hasRedirect =
            false;


        for (
            const parameter
            of searchParams.keys()
        ) {

            const normalizedParameter =
                parameter
                    .toLowerCase()
                    .trim();


            if (
                REDIRECT_PARAMETERS.includes(
                    normalizedParameter
                )
            ) {

                hasRedirect =
                    true;

                break;
            }
        }


        if (
            hasRedirect
        ) {

            /*
             * Une redirection sur un domaine
             * fiable n'est pas automatiquement
             * malveillante.
             *
             * On conserve néanmoins un petit signal.
             */

            const redirectPoints =
                isTrustedDomain
                    ? 3
                    : 15;


            result.score +=
                redirectPoints;


            result.warnings.push({
                category: "https",
                points: redirectPoints,
                message: "L'URL contient un paramètre pouvant être utilisé pour une redirection."
            });
        }
    }


    /*
     * URL très longue
     *
     * Une URL longue seule ne constitue
     * PAS un signal de phishing.
     *
     * On ne lui ajoute donc aucun point.
     *
     * Exemple :
     * LinkedIn / Amazon / Google peuvent
     * générer des URL très longues.
     */


    /*
     * Limite maximale du score
     */

    result.score =
        Math.min(
            result.score,
            100
        );


    return result;
}

