exports.handler = async (event) => {
  try {
    const sessionId = event.queryStringParameters?.session_id;

    if (!sessionId || !sessionId.startsWith("cs_")) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Session Stripe manquante ou invalide"
        })
      };
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
    const supabaseBucket = process.env.SUPABASE_BUCKET;

    if (
      !stripeSecretKey ||
      !supabaseUrl ||
      !supabaseSecretKey ||
      !supabaseBucket
    ) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Configuration serveur incomplète"
        })
      };
    }

    // Vérification du paiement auprès de Stripe
    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(
        sessionId
      )}`,
      {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`
        }
      }
    );

    if (!stripeResponse.ok) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Impossible de vérifier le paiement"
        })
      };
    }

    const session = await stripeResponse.json();

    if (
      session.payment_status !== "paid" ||
      session.status !== "complete"
    ) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Paiement non confirmé"
        })
      };
    }

    // Fichier privé stocké dans Supabase
    const fileName =
      "LF_Vision_Football_10_Outils_FINAL_Copyright.zip";

    // Création d'un lien temporaire valable 5 minutes
    const signedResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/${supabaseBucket}/${fileName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseSecretKey}`,
          apikey: supabaseSecretKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          expiresIn: 300
        })
      }
    );

    if (!signedResponse.ok) {
      const errorText = await signedResponse.text();

      console.error("Erreur Supabase :", errorText);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Impossible de préparer le téléchargement"
        })
      };
    }

    const signedData = await signedResponse.json();

    const signedUrl = signedData.signedURL.startsWith("http")
      ? signedData.signedURL
      : `${supabaseUrl}/storage/v1${signedData.signedURL}`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        authorized: true,
        message: "Paiement LF Vision Football confirmé",
        downloadUrl: signedUrl
      })
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur lors de la vérification du paiement"
      })
    };
  }
};
