/*
 * ==========================================
 * MAILSHIELD - DOMAIN ANALYZER
 * ==========================================
 *
 * Analyse le risque d'un domaine.
 *
 * Le parsing de l'URL est effectué par :
 * domain-parser.js
 *
 * Ce fichier se concentre uniquement sur
 * l'analyse et les signaux de risque.
 */


/*
 * ==========================================
 * CARACTÈRES HOMOGLYPHES
 * ==========================================
 */

const HOMOGLYPH_MAP = {
    "0": "o",
    "1": "l",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",

    "а": "a",
    "е": "e",
    "о": "o",
    "р": "p",
    "с": "c",
    "х": "x",
    "у": "y"
};


/*
 * ==========================================
 * TERMES SUSPECTS
 * ==========================================
 */

const SUSPICIOUS_DOMAIN_TERMS = [
    "login",
    "signin",
    "sign-in",
    "verify",
    "verification",
    "security",
    "secure",
    "account",
    "accounts",
    "support",
    "update",
    "confirm",
    "confirmation",
    "validate",
    "validation",
    "authentication",
    "auth",
    "password",
    "billing",
    "payment",
    "payments"
];


/*
 * ==========================================
 * NORMALISATION
 * ==========================================
 */

function normalizeDomain(domain) {

    let normalized = domain.toLowerCase();

    normalized = normalized
        .split("")
        .map(char => HOMOGLYPH_MAP[char] || char)
        .join("");

    normalized = normalized.replace(/-/g, "");

    return normalized;
}


/*
 * ==========================================
 * DISTANCE DE LEVENSHTEIN
 * ==========================================
 */

function levenshteinDistance(a, b) {

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {

        for (let j = 1; j <= a.length; j++) {

            if (b.charAt(i - 1) === a.charAt(j - 1)) {

                matrix[i][j] =
                    matrix[i - 1][j];

            } else {

                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}


/*
 * ==========================================
 * DÉTECTION D'ADRESSE IP
 * ==========================================
 */

function isIpAddress(hostname) {

    const ipPattern =
        /^(?:\d{1,3}\.){3}\d{1,3}$/;

    return ipPattern.test(hostname);
}


/*
 * ==========================================
 * DÉTECTION MARQUE + TERME SUSPECT
 * ==========================================
 *
 * Exemple :
 *
 * paypal-security.example.com
 *
 * Le domaine réel est :
 * example.com
 *
 * Mais "paypal" apparaît dans un sous-domaine.
 */

function detectSuspiciousBrandCombination(parsedUrl) {

    const result = {
        score: 0,
        warnings: []
    };

    if (!parsedUrl || !parsedUrl.hostname) {
        return result;
    }

    const hostname =
        parsedUrl.hostname.toLowerCase();

    const rootDomain =
        (parsedUrl.rootDomain || "").toLowerCase();

    const subdomain =
        parsedUrl.subdomains.join(".").toLowerCase();


    for (const trustedDomain of TRUSTED_DOMAINS) {

        const brand =
            trustedDomain
                .split(".")[0]
                .toLowerCase();


        /*
         * ==========================================
         * CAS 1
         * ==========================================
         *
         * Le domaine racine est officiellement
         * celui de la marque.
         *
         * Exemple :
         *
         * paypal.com
         * login.paypal.com
         *
         * On ne déclenche aucun signal ici.
         */

        if (rootDomain === trustedDomain) {
            continue;
        }


        /*
         * ==========================================
         * CAS 2
         * ==========================================
         *
         * La marque apparaît dans un sous-domaine
         * d'un autre domaine.
         *
         * Exemple :
         *
         * paypal.com.evil-site.com
         * secure-paypal.example.com
         */

        if (subdomain.includes(brand)) {

            result.score += 25;

            result.warnings.push({
            category: "brand",
            points: 25,
            message: `La marque "${brand}" apparaît dans un sous-domaine d'un autre domaine.`
            });

            return result;
        }


        /*
         * ==========================================
         * CAS 3
         * ==========================================
         *
         * La marque apparaît dans le domaine racine
         * avec un terme sensible.
         *
         * Exemple :
         *
         * paypal-login.com
         * paypal-security.net
         * paypal-verify.com
         */

        if (rootDomain.includes(brand)) {

            for (const term of SUSPICIOUS_DOMAIN_TERMS) {

                if (rootDomain.includes(term)) {

                    result.score += 25;

                    result.warnings.push({
                        category: "brand",
                        points: 25,
                        message: `Le domaine contient la marque "${brand}" associée au terme "${term}".`
                    });

                    return result;
                }
            }
        }
    }

    return result;
}


/*
 * ==========================================
 * détection de typosquatting
 * ==========================================
 */
function detectTyposquatting(rootDomain) {

    const result = {
        score: 0,
        warnings: []
    };

    if (!rootDomain) {
        return result;
    }

    const domain =
        rootDomain.toLowerCase().trim();


    /*
     * ==========================================
     * DOMAINE OFFICIEL
     * ==========================================
     */

    if (
        TRUSTED_DOMAINS.includes(domain)
    ) {
        return result;
    }


    /*
     * ==========================================
     * COMPARAISON AVEC LES DOMAINES DE CONFIANCE
     * ==========================================
     */

    for (const trustedDomain of TRUSTED_DOMAINS) {

        const trusted =
            trustedDomain.toLowerCase().trim();


        /*
         * ==========================================
         * 1. DOMAINE TRÈS PROCHE
         * ==========================================
         */

        const distance =
            levenshteinDistance(
                domain,
                trusted
            );


        /*
         * Une seule modification
         *
         * Exemple :
         *
         * paypa1.com
         * paypal.com
         */

        if (
            distance === 1 &&
            trusted.length >= 7
        ) {

            result.score = 35;

            result.warnings.push({

                category: "typosquatting",

                points: 35,

                message:
                    `Le domaine "${rootDomain}" présente une forte similarité avec "${trustedDomain}".`
            });

            return result;
        }


        /*
         * ==========================================
         * 2. DEUX MODIFICATIONS
         * ==========================================
         */

        if (
            distance === 2 &&
            trusted.length >= 8
        ) {

            result.score = 20;

            result.warnings.push({

                category: "typosquatting",

                points: 35,

                message:
                    `Le domaine "${rootDomain}" présente une similarité avec "${trustedDomain}".`
            });

            return result;
        }


        /*
         * ==========================================
         * 3. HOMOGLYPHES / CARACTÈRES RESSEMBLANTS
         * ==========================================
         */

        const normalizedDomain =
            normalizeDomain(domain);

        const normalizedTrusted =
            normalizeDomain(trusted);


        if (
            normalizedDomain === normalizedTrusted &&
            domain !== trusted
        ) {

            result.score = 40;

            result.warnings.push({

                category: "homoglyph",

                points: 40,

                message:
                    `Le domaine "${rootDomain}" utilise des caractères pouvant imiter le domaine officiel "${trustedDomain}".`
            });

            return result;
        }
    }


    return result;
}


/*
 * ==========================================
 * ANALYSE DU DOMAINE
 * ==========================================
 */

function analyzeDomain(domain) {

    const result = {
        domain: domain,
        normalizedDomain: null,
        rootDomain: null,
        subdomains: [],
        isIp: false,

        score: 0,
        warnings: []
    };


    /*
     * ==========================================
     * PARSING
     * ==========================================
     *
     * On utilise maintenant domain-parser.js
     */

    const parsedUrl =
        parseUrl(`https://${domain}`);


    /*
     * Domaine invalide
     */

    if (!parsedUrl.valid) {

        result.score += 30;

        result.warnings.push({
            category: "invalid-domain",
            points: 30,
            message: "Le domaine est invalide ou malformé."
        });

        return result;
    }


    result.rootDomain =
        parsedUrl.rootDomain;

    result.subdomains =
        parsedUrl.subdomains;

    result.isIp =
        isIpAddress(parsedUrl.hostname);


    /*
     * ==========================================
     * NORMALISATION
     * ==========================================
     */

    if (result.isIp) {
    result.normalizedDomain = parsedUrl.hostname;
    } else {
        result.normalizedDomain =
            normalizeDomain(parsedUrl.hostname);
    }


    /*
     * ==========================================
     * ADRESSE IP
     * ==========================================
     */

    if (result.isIp) {

        result.score += 30;

        result.warnings.push({
            category: "ip",
            points: 30,
            message: "Le domaine utilise directement une adresse IP."
        });
    }


    /*
     * ==========================================
     * DOMAINE OFFICIEL
     * ==========================================
     */

    if (
        TRUSTED_DOMAINS.includes(
            parsedUrl.rootDomain
        )
    ) {

        /*
         * Exemple :
         *
         * paypal.com
         * login.paypal.com
         *
         * Le domaine racine est officiel.
         */

        return result;
    }


    /*
     * ==========================================
     * DOMAINE LONG
     * ==========================================
     */

    if (
        parsedUrl.rootDomain &&
        parsedUrl.rootDomain.length > 40
    ) {

        result.score += 10;

        result.warnings.push({
            category: "long-domain",
            points: 10,
            message: "Le domaine racine est particulièrement long."   
        });
    }


    /*
     * ==========================================
     * NOMBRE DE SOUS-DOMAINES
     * ==========================================
     */

    if (
        parsedUrl.subdomains.length > 2
    ) {

        result.score += 10;

        result.warnings.push({
            category: "multiple-subdomains",
            points: 10,
            message: "Le domaine contient plusieurs sous-domaines." 
        });
    }


    /*
     * ==========================================
     * STRUCTURE INHABITUELLE
     * ==========================================
     */

    if (
        parsedUrl.hostname.includes("_") ||
        parsedUrl.hostname.includes("..")
    ) {

        result.score += 10;

        result.warnings.push({
            category: "unusual-domain",
            points: 10,
            message: "Le domaine possède une structure inhabituelle."
        });
    }



    /*
     * ==========================================
     * MARQUE DANS UN SOUS-DOMAINE
     * ==========================================
     */

    const brandCombination =
        detectSuspiciousBrandCombination(
            parsedUrl
        );

    result.score +=
        brandCombination.score;

    result.warnings.push(
        ...brandCombination.warnings
    );


    /*
    * ==========================================
    * DÉTECTION DE TYPOSQUATTING
    * ==========================================
    */

    const typosquatting =
        detectTyposquatting(
            parsedUrl.rootDomain
        );

    result.score +=
        typosquatting.score;

    result.warnings.push(
        ...typosquatting.warnings
    );

    /*
     * ==========================================
     * SCORE MAXIMUM
     * ==========================================
     */

    result.score =
        Math.min(result.score, 100);


    return result;
}