// Analyse de l'adresse de l'expéditeur

function analyzeSender(sender, senderName) {

    const result = {
        email: sender,
        name: senderName,
        domain: null,
        score: 0,
        warnings: []
    };


    // ==========================================
    // Vérification de l'adresse
    // ==========================================

    if (!sender || !sender.includes("@")) {

        result.score = 30;

        result.warnings.push(
            "Adresse de l'expéditeur inhabituelle ou invalide."
        );

        return result;
    }


    // ==========================================
    // Extraction du domaine
    // ==========================================

    const parts = sender.split("@");

    const domain = parts[parts.length - 1]
        .toLowerCase()
        .trim();

    result.domain = domain;


    // ==========================================
    // Analyse du domaine
    // ==========================================

    const domainAnalysis =
        analyzeDomain(domain);


    result.score = domainAnalysis.score;

    result.warnings =
        domainAnalysis.warnings;


    return result;
}