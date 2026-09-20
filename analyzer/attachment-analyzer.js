/**
 * Analyse locale d'une pièce jointe
 * MailShield
 */

function analyzeAttachment(attachment) {

    const result = {
        name: attachment?.name || "",
        extension: null,
        size: attachment?.size || 0,
        score: 0,
        warnings: []
    };

    // Vérification de l'objet
    if (!attachment || typeof attachment !== "object") {
        return result;
    }

    const fileName = (attachment.name || "")
        .toLowerCase()
        .trim();

    if (!fileName) {
        return result;
    }

    // ========================================
    // 🔎 DÉTECTION DE L'EXTENSION
    // ========================================

    const lastDot = fileName.lastIndexOf(".");

    if (lastDot !== -1) {
        result.extension = fileName
            .substring(lastDot + 1);
    }

    // ========================================
    // 🚨 EXTENSIONS POTENTIELLEMENT DANGEREUSES
    // ========================================

    const dangerousExtensions = [
        "exe",
        "scr",
        "bat",
        "cmd",
        "com",
        "msi",
        "js",
        "vbs",
        "vbe",
        "ps1",
        "jar",
        "hta",
        "dll"
    ];

    // Extension finale dangereuse
    if (
        result.extension &&
        dangerousExtensions.includes(result.extension)
    ) {

        result.score += 40;

        result.warnings.push({
            category: "dangerous-extension",
            points: 40,
            message:
                `La pièce jointe utilise l'extension potentiellement dangereuse ".${result.extension}".`
        });
    }

    // ========================================
    // 🔎 EXTENSION DANGEREUSE DISSIMULÉE
    // ========================================

    const fileNameParts = fileName.split(".");

    const hiddenDangerousExtensions =
        fileNameParts
            .slice(1, -1)
            .filter(extension =>
                dangerousExtensions.includes(
                    extension.toLowerCase()
                )
            );

    if (hiddenDangerousExtensions.length > 0) {

        result.score += 50;

        result.warnings.push({
            category: "double-extension",
            points: 50,
            message:
                "Le nom de la pièce jointe contient une extension potentiellement dangereuse dissimulée parmi plusieurs extensions."
        });
    }   

    // ========================================
    // 📄 FICHIERS OFFICE AVEC MACROS
    // ========================================

    const macroExtensions = [
        "docm",
        "xlsm",
        "pptm"
    ];

    if (
        result.extension &&
        macroExtensions.includes(result.extension)
    ) {

        result.score += 25;

        result.warnings.push({
            category: "macro",
            points: 25,
            message:
                `La pièce jointe ".${result.extension}" peut contenir des macros.`
        });
    }

    // ========================================
    // 📦 ARCHIVES
    // ========================================

    const archiveExtensions = [
        "zip",
        "rar",
        "7z",
        "iso"
    ];

    if (
        result.extension &&
        archiveExtensions.includes(result.extension)
    ) {

        result.score += 15;

        result.warnings.push({
            category: "archive",
            points: 15,
            message:
                "La pièce jointe est une archive qui peut contenir d'autres fichiers."
        });
    }

    // ========================================
    // 📝 NOMS DE FICHIERS SUSPECTS
    // ========================================

    const suspiciousFileNames = [
        "invoice",
        "facture",
        "payment",
        "paiement",
        "security",
        "update",
        "verification",
        "verify",
        "password",
        "account",
        "login",
        "document",
        "urgent"
    ];

    const fileNameWithoutExtension =
        fileName.substring(
            0,
            lastDot === -1
                ? fileName.length
                : lastDot
        );

    const suspiciousName =
        suspiciousFileNames.some(term =>
            fileNameWithoutExtension.includes(term)
        );

    if (suspiciousName) {

        result.score += 5;

        result.warnings.push({
            category: "suspicious-name",
            points: 5,
            message:
                "Le nom de la pièce jointe contient un terme pouvant être associé à une tentative de phishing."
        });
    }

    // ========================================
    // 🎯 LIMITE DU SCORE
    // ========================================

    result.score =
        Math.min(result.score, 100);

    return result;
}


// ========================================
// 🌍 EXPOSITION GLOBALE
// ========================================

window.analyzeAttachment = analyzeAttachment;