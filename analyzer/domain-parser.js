/*
 * ==========================================
 * MAILSHIELD - DOMAIN PARSER
 * ==========================================
 *
 * Cette fonction analyse la structure d'une URL
 * sans visiter le site.
 */

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
    result.port = parsedUrl.port || null;
    result.pathname = parsedUrl.pathname;
    result.search = parsedUrl.search;
    result.hash = parsedUrl.hash;


    // ==========================================
    // Décomposition du hostname
    // ==========================================

    const parts = result.hostname.split(".");


    /*
     * Exemple :
     *
     * login.paypal.com
     *
     * parts =
     * ["login", "paypal", "com"]
     */


    if (parts.length >= 2) {

        /*
         * Dernière partie :
         *
         * com
         */
        const tld = parts[parts.length - 1];


        /*
         * Partie juste avant le TLD :
         *
         * paypal
         */
        const domainName = parts[parts.length - 2];


        /*
         * Domaine racine :
         *
         * paypal.com
         */
        result.rootDomain =
            `${domainName}.${tld}`;


        result.domain = domainName;


        /*
         * Tout ce qui précède le domaine racine
         * est considéré comme sous-domaine.
         */
        result.subdomains =
            parts.slice(0, -2);
    }


    return result;
}