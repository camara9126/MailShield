// Communication avec Gmail

console.log("🛡️ MailShield est actif sur Gmail.");

let lastEmailKey = null;
let detectionTimeout = null;


/*
 * Récupère l'URL réelle lorsqu'une URL de
 * redirection Gmail est utilisée.
 */
function getRealLinkUrl(url) {

    if (!url || typeof url !== "string") {
        return "";
    }

    try {

        const parsedUrl =
            new URL(url);


        /*
         * Redirection Google
         *
         * Exemple :
         * https://www.google.com/url?q=https://example.com
         */

        if (
            parsedUrl.hostname === "www.google.com" &&
            parsedUrl.pathname === "/url"
        ) {

            const realUrl =
                parsedUrl.searchParams.get("q");

            if (realUrl) {
                return realUrl;
            }
        }


        /*
         * URL normale
         */

        return url;

    } catch (error) {

        return url;
    }
}


/*
 * Analyse de l'email actuellement ouvert
 */

async function detectEmail() {

    const subjectElement =
        document.querySelector('h2.hP');

    const senderElement =
        document.querySelector('.gD');

    const bodyElement =
        document.querySelector('.a3s');


    // L'email n'est pas encore complètement chargé

    if (
        !subjectElement ||
        !senderElement ||
        !bodyElement
    ) {

        return;
    }


    /*
    * ==========================================
    * Vérification du droit d'analyse
    * ==========================================
    */

    const analysisPermission =
        await canAnalyze();


    if (!analysisPermission.allowed) {

        console.log(
            "🛡️ MailShield — analyse bloquée :",
            analysisPermission.reason
        );

        return;
    }


    /*
     * Expéditeur
     */

    const sender =
        senderElement.getAttribute('email') ||
        senderElement.textContent.trim();


    const senderName =
        senderElement.getAttribute('name') ||
        senderElement.textContent.trim();


    /*
     * Sujet
     */

    const subject =
        subjectElement.textContent.trim();


    /*
     * Corps du message
     */

    const body =
        bodyElement.innerText.trim();


    /*
     * Identification de l'email actuellement ouvert
     */

    const emailKey =
        `${sender}|${subject}|${body}`;


    if (
        emailKey === lastEmailKey
    ) {

        return;
    }


    lastEmailKey =
        emailKey;


    /*
     * Récupération des liens
     */
    const links = Array.from(
        bodyElement.querySelectorAll('a')
    )
    .map(link => {

        const originalUrl =
            link.href || "";

        const realUrl =
            getRealLinkUrl(originalUrl);

        return {
            text:
                link.innerText.trim(),

            url:
                realUrl,

            originalUrl:
                originalUrl
        };

    })
    .filter(link => {

        return (
            link.url.startsWith("http://") ||
            link.url.startsWith("https://")
        );

    });


    // ========================================
    // 📎 DÉTECTION DES PIÈCES JOINTES
    // ========================================

    const attachments = Array.from(
        document.querySelectorAll('.aQH')
    )
    .map(element => {
        const text = element.innerText || "";

        const lines = text
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);

       let fileName = lines.find(line =>
            /\.[a-z0-9]{1,10}$/i.test(line)
        ) || "";

        // Nettoyer le texte ajouté par Gmail
        fileName = fileName
            .replace(/^Prévisualiser la pièce jointe\s*/i, "")
            .replace(/^Preview attachment\s*/i, "")
            .trim();
            
        return {
            name: fileName,
            size: 0
        };
    })
    .filter(attachment => attachment.name);

    // Éviter les doublons
    const uniqueAttachments = [];
    const seenAttachmentNames = new Set();

    attachments.forEach(attachment => {
        if (seenAttachmentNames.has(attachment.name)) {
            return;
        }

        seenAttachmentNames.add(attachment.name);
        uniqueAttachments.push(attachment);
    });


    // Analyse des pièces jointes
    const analyzedAttachments =
        uniqueAttachments.map(attachment => ({
            ...attachment,
            analysis: analyzeAttachment(attachment)
        }));


    /*
    * Suppression des liens identiques
    *
    * Gmail peut afficher plusieurs boutons
    * ou liens pointant exactement vers la
    * même URL.
    */

    const uniqueLinks = [];
    const seenUrls = new Set();

    links.forEach(link => {

        if (seenUrls.has(link.url)) {
            return;
        }

        seenUrls.add(link.url);

        uniqueLinks.push(link);

    });


    /*
     * Analyse locale des liens
     */

    const analyzedLinks =
        uniqueLinks.map(link => ({

            ...link,

            analysis:
                analyzeLink(
                    link.url
                )

        }));


    /*
     * Analyse de l'expéditeur
     */

    const senderAnalysis =
        analyzeSender(
            sender,
            senderName
        );


    /*
     * Création de l'objet email
     */

    const email = {

        sender:
            sender,

        senderName:
            senderName,

        subject:
            subject,

        body:
            body,

        links:
            analyzedLinks,

        senderAnalysis:
            senderAnalysis,

        attachments:
             analyzedAttachments

    };


    /*
     * Calcul du risque global
     */

    const risk =
        calculateRisk(
            email
        );


    email.risk =
        risk;


        
    /*
    * Compter l'analyse
    */

    await incrementAnalysis();


    saveAnalysisHistory(
        email,
        risk
    );


    /*
     * Affichage du panneau
     */

    showMailShieldPanel(
        risk
    );
}


/*
 * Surveillance des changements de Gmail
 */

const observer =
    new MutationObserver(() => {

        clearTimeout(
            detectionTimeout
        );


        detectionTimeout =
            setTimeout(() => {

                detectEmail();

            }, 300);

    });


observer.observe(
    document.body,
    {
        childList: true,
        subtree: true
    }
);


/*
 * Première vérification
 */

detectEmail();


/*
 * Interception des clics sur les liens
 */

document.addEventListener(
    "click",
    function (event) {

        const link =
            event.target.closest("a");


        if (!link) {
            return;
        }


        const originalUrl =
            link.href || "";


        if (
            !originalUrl.startsWith("http://") &&
            !originalUrl.startsWith("https://")
        ) {

            return;
        }


        /*
         * Récupération de la destination réelle
         */

        const realUrl =
            getRealLinkUrl(
                originalUrl
            );


        /*
         * Analyse du lien réel
         */

        const analysis =
            analyzeLink(
                realUrl
            );


        /*
         * Bloquer les liens présentant
         * un risque important
         */

        if (
            analysis.score >= 30
        ) {

            event.preventDefault();

            event.stopPropagation();


            console.log(
                "🚨 MailShield — navigation bloquée."
            );


            showLinkWarning(
                analysis,
                realUrl
            );


            return;
        }

    }
);

