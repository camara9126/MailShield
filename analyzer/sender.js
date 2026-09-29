// ==========================================
// ANALYSE DE L'ADRESSE DE L'EXPÉDITEUR
// ==========================================

function analyzeSender(sender, senderName) {

    const result = {
        email: sender || "",
        name: senderName || "",
        username: null,
        domain: null,
        score: 0,
        warnings: []
    };


    // ==========================================
    // VÉRIFICATION DE L'ADRESSE
    // ==========================================

    if (
        !sender ||
        typeof sender !== "string"
    ) {

        result.score = 30;

        result.warnings.push({
            category: "sender",
            points: 30,
            message:
                "Adresse de l'expéditeur absente ou invalide."
        });

        return result;
    }


    // ==========================================
    // NETTOYAGE
    // ==========================================

    const normalizedSender =
        sender
            .trim()
            .toLowerCase();


    // ==========================================
    // VÉRIFICATION DU NOMBRE DE @
    // ==========================================

    const atCount =
        (
            normalizedSender.match(/@/g) || []
        ).length;


    if (atCount !== 1) {

        result.score = 30;

        result.warnings.push({
            category: "sender",
            points: 30,
            message:
                "L'adresse de l'expéditeur possède une structure inhabituelle."
        });

        return result;
    }


    // ==========================================
    // EXTRACTION DU NOM D'UTILISATEUR ET DOMAINE
    // ==========================================

    const parts =
        normalizedSender.split("@");


    const username =
        parts[0].trim();


    const domain =
        parts[1].trim();


    result.username =
        username;


    result.domain =
        domain;

console.log(
    "MAILSHIELD - Sender:",
    {
        sender: sender,
        senderName: senderName,
        username: username,
        domain: domain
    }
);
    // ==========================================
    // VÉRIFICATION DU NOM D'UTILISATEUR
    // ==========================================

    if (!username) {

        result.score += 10;

        result.warnings.push({
            category: "sender",
            points: 10,
            message:
                "L'adresse de l'expéditeur ne contient pas de nom d'utilisateur valide."
        });
    }


    // ==========================================
    // VÉRIFICATION DU DOMAINE
    // ==========================================

    if (!domain) {

        result.score += 20;

        result.warnings.push({
            category: "sender",
            points: 20,
            message:
                "L'adresse de l'expéditeur ne contient pas de domaine valide."
        });

        return result;
    }


    // ==========================================
    // ANALYSE DU DOMAINE
    // ==========================================

    const domainAnalysis =
        analyzeDomain(domain);


    const brandImpersonation =
    detectSenderBrandImpersonation(
        senderName,
        domain
    );

    result.score +=
    brandImpersonation.score;

    result.warnings.push(
        ...brandImpersonation.warnings
    );


    // ==========================================
    // SCORE DU DOMAINE
    // ==========================================

    result.score +=
        Math.min(
            Number(domainAnalysis.score) || 0,
            20
        );


    // ==========================================
    // WARNINGS DU DOMAINE
    // ==========================================

    if (
        domainAnalysis.warnings &&
        domainAnalysis.warnings.length > 0
    ) {

        domainAnalysis.warnings.forEach(
            warning => {

                const message =
                    typeof warning === "string"
                        ? warning
                        : warning.message ||
                          String(warning);


                const points =
                    typeof warning === "object"
                        ? Number(warning.points) || 0
                        : 0;


                result.warnings.push({

                    category: "sender",

                    points: points,

                    message:
                        `Expéditeur : ${message}`
                });
            }
        );
    }


    // ==========================================
    // LIMITE DU SCORE
    // ==========================================

    result.score =
        Math.min(
            result.score,
            20
        );


    return result;
}


function detectSenderBrandImpersonation(senderName, domain) {

    const result = {
        score: 0,
        warnings: []
    };


    /*
     * ==========================================
     * VÉRIFICATION
     * ==========================================
     */

    if (
        !senderName ||
        !domain
    ) {
        return result;
    }


    /*
     * ==========================================
     * NORMALISATION
     * ==========================================
     */

    const normalizedName =
        senderName
            .toLowerCase()
            .trim();


    const normalizedDomain =
        normalizeDomain(domain);


    /*
     * ==========================================
     * PARCOURS DES DOMAINES DE CONFIANCE
     * ==========================================
     */

    for (
        const trustedDomain
        of TRUSTED_DOMAINS
    ) {

        const brand =
            trustedDomain
                .split(".")[0]
                .toLowerCase();


        const normalizedTrustedDomain =
            normalizeDomain(
                trustedDomain
            );


        /*
         * ==========================================
         * LA MARQUE N'EST PAS MENTIONNÉE
         * ==========================================
         */

        if (
            !normalizedName.includes(brand)
        ) {
            continue;
        }


        /*
         * ==========================================
         * DOMAINE OFFICIEL
         * ==========================================
         *
         * Exemple :
         *
         * PayPal Support
         * security@paypal.com
         */

        if (
            normalizedDomain ===
            normalizedTrustedDomain
        ) {

            continue;
        }


        /*
         * ==========================================
         * SOUS-DOMAINE OFFICIEL
         * ==========================================
         *
         * Exemple :
         *
         * PayPal Support
         * security@support.paypal.com
         */

        if (
            normalizedDomain.endsWith(
                normalizedTrustedDomain
            )
        ) {

            continue;
        }


        /*
         * ==========================================
         * DOMAINE LIÉ À LA MARQUE
         * ==========================================
         *
         * Exemple :
         *
         * paypal-security.com
         *
         * On ne considère pas automatiquement
         * ce domaine comme une usurpation.
         *
         * Le domaine sera déjà analysé
         * par analyzeDomain().
         */

        if (
            normalizedDomain.includes(brand)
        ) {

            result.score = 5;

            result.warnings.push({

                category: "sender",

                points: 5,

                message:
                    `Le nom de l'expéditeur mentionne "${brand}" et le domaine "${domain}" contient également cette marque mais n'est pas son domaine officiel.`

            });

            continue;
        }


        /*
         * ==========================================
         * USURPATION PROBABLE
         * ==========================================
         *
         * La marque apparaît dans le nom
         * mais le domaine n'a aucun lien évident
         * avec celle-ci.
         */

        result.score = 15;

        result.warnings.push({

            category: "sender",

            points: 15,

            message:
                `Le nom de l'expéditeur mentionne "${brand}" mais le domaine "${domain}" ne correspond pas au domaine officiel.`

        });


        return result;
    }


    return result;
}