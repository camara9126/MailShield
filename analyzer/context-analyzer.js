/*
 * ==========================================
 * MAILSHIELD - CONTEXT ANALYZER
 * ==========================================
 *
 * Analyse la cohérence entre :
 * - le nom de l'expéditeur
 * - le domaine de l'expéditeur
 * - les domaines des liens
 *
 * Ce fichier ne calcule PAS le score final.
 */

function analyzeContext(email) {

    const result = {
        score: 0,
        warnings: []
    };

    if (!email || typeof email !== "object") {
        return result;
    }

    /*
     * ==========================================
     * 1. NOM DE L'EXPÉDITEUR
     * ==========================================
     */

    const senderName =
        (email.senderName || "")
            .toLowerCase()
            .trim();

    const senderDomain =
        (email.senderDomain || "")
            .toLowerCase()
            .trim();

    /*
     * ==========================================
     * 2. RÉCUPÉRATION DES LIENS
     * ==========================================
     */

    const links = Array.isArray(email.links)
        ? email.links
        : [];

    /*
     * ==========================================
     * 3. DÉTECTION DES DOMAINES DES LIENS
     * ==========================================
     */

    const linkDomains = [];

    links.forEach(link => {

        if (
            !link ||
            !link.analysis ||
            !link.analysis.domain
        ) {
            return;
        }

        const domain =
            link.analysis.domain
                .toLowerCase()
                .trim();

        if (
            domain &&
            !linkDomains.includes(domain)
        ) {
            linkDomains.push(domain);
        }
    });


    /*
     * ==========================================
     * 4. NOM DE MARQUE ET DOMAINE
     * ==========================================
     *
     * Exemple :
     *
     * Nom :
     * PayPal Security
     *
     * Domaine :
     * evil-site.com
     *
     * → incohérence possible.
     */

    const knownBrands = [
        "paypal",
        "microsoft",
        "google",
        "amazon",
        "apple",
        "facebook",
        "instagram",
        "linkedin"
    ];

    knownBrands.forEach(brand => {

        const nameContainsBrand =
            senderName.includes(brand);

        const domainContainsBrand =
            senderDomain.includes(brand);

        if (
            nameContainsBrand &&
            !domainContainsBrand
        ) {

            result.score += 5;

            result.warnings.push({
                category: "brand-mismatch",
                points: 5,
                message:
                    `Le nom de l'expéditeur mentionne "${brand}" mais son domaine ne semble pas correspondre.`
            });
            
        }
    });

    /*
     * ==========================================
     * 5. MARQUE DU NOM ≠ DOMAINE DES LIENS
     * ==========================================
     *
     * Exemple :
     *
     * Nom :
     * PayPal Security
     *
     * Expéditeur :
     * paypa1.com
     *
     * Lien :
     * evil-site.com
     *
     * → incohérence possible.
     */

    if (
        senderName &&
        linkDomains.length > 0
    ) {

        knownBrands.forEach(brand => {

            const nameContainsBrand =
                senderName.includes(brand);

            if (!nameContainsBrand) {
                return;
            }

            const linkMatchesBrand =
                linkDomains.some(
                    domain =>
                        domain.includes(brand)
                );

            if (!linkMatchesBrand) {

                result.score += 5;

                result.warnings.push({
                    category: "brand-link-mismatch",
                    points: 5,
                    message:
                        `Le nom de l'expéditeur mentionne "${brand}" mais aucun domaine des liens ne semble correspondre à cette marque.`
                });
            }

        });
    }

    /*
    * ==========================================
    * 6. MARQUE REVENDIQUÉE DANS LE MESSAGE
    * ==========================================
    *
    * Détecte lorsqu'une marque connue est
    * mentionnée dans le contenu du message.
    *
    * Exemple :
    *
    * Expéditeur :
    * ahmadcamara01@gmail.com
    *
    * Contenu :
    * "PayPal Security vous informe..."
    *
    * → La marque PayPal est revendiquée
    *   par un expéditeur qui n'utilise pas
    *   un domaine PayPal.
    */

    const body =
        (email.body || "")
            .toLowerCase()
            .trim();

    const subject =
        (email.subject || "")
            .toLowerCase()
            .trim();

    const messageContent =
        `${subject} ${body}`;

    if (messageContent) {

        knownBrands.forEach(brand => {

            const brandMentioned =
                messageContent.includes(brand);

            if (!brandMentioned) {
                return;
            }

            const senderUsesBrandDomain =
                senderDomain.includes(brand);

            const linkUsesBrandDomain =
                linkDomains.some(
                    domain =>
                        domain.includes(brand)
                );

            /*
            * La marque est mentionnée mais
            * ni l'expéditeur ni les liens
            * ne semblent correspondre à cette marque.
            */

            if (
                !senderUsesBrandDomain &&
                !linkUsesBrandDomain
            ) {

                result.score += 5;

                result.warnings.push({
                    category:
                        "brand-claim-mismatch",

                    points: 5,

                    message:
                        `Le message mentionne "${brand}" mais l'expéditeur et les liens ne semblent pas correspondre à cette marque.`
                });
            }

        });
    }


    result.score =
        Math.min(
            result.score,
            10
        );

    return result;
}