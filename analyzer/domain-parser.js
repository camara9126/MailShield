/*
 * ==========================================
 * MAILSHIELD - DOMAIN PARSER
 * ==========================================
 *
 * Cette fonction analyse la structure d'une URL
 * sans visiter le site.
 */

    const MULTI_PART_TLDS = [
        "co.uk",
        "org.uk",
        "ac.uk",
        "gov.uk",
        "com.au",
        "net.au",
        "org.au",
        "co.jp",
        "co.in",
        "com.br",
        "com.cn",
        "com.tr",
        "co.za"
    ];

function parseUrl(url) {

    const result = {
        originalUrl: url,
        valid: false,
        protocol: null,
        hostname: null,
        port: null,
        pathname: null,
        search: null,
        hash: null,

        username: null,
        password: null,

        subdomains: [],
        domain: null,
        rootDomain: null
    };


    // ==========================================
    // Vérification de l'URL
    // ==========================================

    if (!url || typeof url !== "string") {
        return result;
    }


    let parsedUrl;

    try {

        /*
         * URL() permet au navigateur de décomposer
         * proprement l'adresse.
         */
        parsedUrl = new URL(url);

    } catch (error) {

        return result;
    }


    result.valid = true;

    result.protocol = parsedUrl.protocol;
    result.hostname = parsedUrl.hostname.toLowerCase();
    result.username = parsedUrl.username || null;
    result.password = parsedUrl.password || null;
    result.port = parsedUrl.port || null;
    result.pathname = parsedUrl.pathname;
    result.search = parsedUrl.search;
    result.hash = parsedUrl.hash;


    // ==========================================
    // Décomposition du hostname
    // ==========================================

    const parts =
        result.hostname.split(".");


    if (parts.length >= 2) {

        /*
        * ==========================================
        * DÉTECTION DES TLD MULTIPARTIES
        * ==========================================
        *
        * Exemple :
        *
        * paypal.co.uk
        *
        * Le suffixe est :
        *
        * co.uk
        *
        * Le domaine est donc :
        *
        * paypal.co.uk
        */

        const lastTwoParts =
            parts.slice(-2).join(".");


        if (
            MULTI_PART_TLDS.includes(lastTwoParts) &&
            parts.length >= 3
        ) {

            const domainName =
                parts[parts.length - 3];

            const rootDomain =
                `${domainName}.${lastTwoParts}`;


            result.rootDomain =
                rootDomain;

            result.domain =
                domainName;

            result.subdomains =
                parts.slice(0, -3);


        } else {

            /*
            * ==========================================
            * DOMAINES CLASSIQUES
            * ==========================================
            *
            * Exemple :
            *
            * login.paypal.com
            */

            const tld =
                parts[parts.length - 1];

            const domainName =
                parts[parts.length - 2];


            result.rootDomain =
                `${domainName}.${tld}`;

            result.domain =
                domainName;

            result.subdomains =
                parts.slice(0, -2);
        }
    }


    return result;
}