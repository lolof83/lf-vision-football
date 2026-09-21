const crypto = require("crypto");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const signature = event.headers["stripe-signature"];

  if (!signature) {
    return {
      statusCode: 400,
      body: "Signature Stripe manquante",
    };
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return {
      statusCode: 500,
      body: "Secret webhook non configure",
    };
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  try {
    const elements = signature.split(",");
    const timestampPart = elements.find((e) => e.startsWith("t="));
    const signatureParts = elements
      .filter((e) => e.startsWith("v1="))
      .map((e) => e.substring(3));

    if (!timestampPart || signatureParts.length === 0) {
      throw new Error("Format de signature invalide");
    }

    const timestamp = timestampPart.substring(2);

    const age = Math.abs(
      Math.floor(Date.now() / 1000) - Number(timestamp)
    );

    if (!Number.isFinite(age) || age > 300) {
      throw new Error("Signature expiree");
    }

    const signedPayload = `${timestamp}.${rawBody}`;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload, "utf8")
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    const valid = signatureParts.some((sig) => {
      try {
        const receivedBuffer = Buffer.from(sig, "hex");

        return (
          receivedBuffer.length === expectedBuffer.length &&
          crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
        );
      } catch {
        return false;
      }
    });

    if (!valid) {
      throw new Error("Signature invalide");
    }

    const stripeEvent = JSON.parse(rawBody);

    if (stripeEvent.type === "checkout.session.completed") {
      console.log(
        "Paiement LF Vision Football confirme :",
        stripeEvent.id
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        received: true,
      }),
    };
  } catch (error) {
    console.error("Webhook Stripe refuse :", error.message);

    return {
      statusCode: 400,
      body: "Webhook Stripe invalide",
    };
  }
};
