exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  const stripeSignature =
    event.headers["stripe-signature"] ||
    event.headers["Stripe-Signature"];

  if (!stripeSignature) {
    return {
      statusCode: 400,
      body: "Signature Stripe manquante"
    };
  }

  // Pour l'instant, on vérifie simplement que Stripe
  // appelle correctement notre fonction.
  // La vérification sécurisée du webhook sera ajoutée
  // avec le secret Stripe à l'étape suivante.

  return {
    statusCode: 200,
    body: JSON.stringify({
      received: true,
      message: "Webhook LF Vision Football reçu"
    })
  };
};
