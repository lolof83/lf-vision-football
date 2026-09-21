exports.handler = async (event) => {
  try {
    const sessionId = event.queryStringParameters?.session_id;

    if (!sessionId || !sessionId.startsWith("cs_")) {
      return {
        statusCode: 400,
        body: "Session Stripe manquante ou invalide",
      };
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return {
        statusCode: 500,
        body: "Configuration Stripe manquante",
      };
    }

    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(
        sessionId
      )}`,
      {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },
      }
    );

    if (!response.ok) {
      return {
        statusCode: 403,
        body: "Impossible de vérifier le paiement",
      };
    }

    const session = await response.json();

    if (
      session.payment_status !== "paid" ||
      session.status !== "complete"
    ) {
      return {
        statusCode: 403,
        body: "Paiement non confirmé",
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({
        authorized: true,
        message: "Paiement LF Vision Football confirmé",
      }),
    };
  } catch (error) {
    console.error("Secure download error:", error);

    return {
      statusCode: 500,
      body: "Erreur lors de la vérification du paiement",
    };
  }
};
