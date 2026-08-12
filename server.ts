import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createPaymentOrder, processRazorpayWebhook, verifyRazorpaySignature } from "./api/_lib/payments";
import { getWhatsAppConnection, isValidAutomationSecret, runNewLeadFollowUps, sendLeadFollowUp } from "./api/_lib/whatsapp";
import { sendEmail } from "./api/_lib/email";
import { classifyPromptToDNA, applyDNAToBlocks } from "./components/site-dna";

dotenv.config();

const app = express();
app.use(express.json({ verify: (req, _res, buffer) => { (req as any).rawBody = buffer.toString('utf8'); } }));

const PORT = parseInt(process.env.PORT || "3000", 10);

// Initialize Gemini Client safely with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// ==========================================
// AI TRANSFORMATIONS API ENDPOINT
// ==========================================
app.post("/api/ai/edit", async (req, res) => {
  const { prompt, blocks } = req.body;

  if (!prompt || !blocks) {
    return res.status(400).json({ error: "Missing prompt or blocks data." });
  }

  // Handle case when API Key is missing by driving a coherent Style DNA change.
  // This is the "change the whole brand of your site in one sentence" feature:
  // the prompt is classified to a design SYSTEM (fonts, palette, radius, shadow,
  // texture, motion) and every block is re-rendered through it — coherently,
  // with page rhythm — instead of patching one property per block.
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set — applying local Style DNA transform.");
    try {
      const dna = classifyPromptToDNA(prompt);
      const simulated = applyDNAToBlocks(blocks, dna);
      return res.json({
        blocks: simulated,
        dna: { id: dna.id, name: dna.name, fonts: dna.fonts, palette: dna.palette },
        message: `Applied the “${dna.name}” design system across every section.`,
      });
    } catch (e: any) {
      console.error("Local DNA transform failed", e);
      return res.status(500).json({ error: "Could not apply the design system." });
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `You are an expert design and copywriter agent for the OnlyPage builder. 
Transform the styles and/or content properties of the following JSON array of sections to fit the user's request.
User request: "${prompt}"

Current blocks configuration:
${JSON.stringify(blocks, null, 2)}

If the user request is about design or styling, modify the styling-related properties (backgroundColor, textColor, fontFamily, gradients, colors, padding, alignment).
If the user request asks to change copy, rewrite headings, shorten/extend description, or adjust the tone (e.g. professional, casual, playful, persuasive), modify the copy properties (badge, title, subtitle, btnText, and list item text fields) accordingly.
Always keep structural properties like block ids and block types intact. Return the complete array of updated blocks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  badge: { type: Type.STRING },
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  imageUrl: { type: Type.STRING },
                  btnText: { type: Type.STRING },
                  variant: { type: Type.STRING },
                  mapAddress: { type: Type.STRING },
                  contactEmail: { type: Type.STRING },
                  contactPhone: { type: Type.STRING },
                  contactAddress: { type: Type.STRING },
                  copyright: { type: Type.STRING },
                  features: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        desc: { type: Type.STRING },
                        icon: { type: Type.STRING }
                      }
                    }
                  },
                  pricing: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        tier: { type: Type.STRING },
                        price: { type: Type.STRING },
                        features: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        },
                        btnText: { type: Type.STRING },
                        popular: { type: Type.BOOLEAN }
                      }
                    }
                  },
                  testimonials: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        role: { type: Type.STRING },
                        content: { type: Type.STRING },
                        avatar: { type: Type.STRING },
                        rating: { type: Type.INTEGER }
                      }
                    }
                  },
                  faqs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        q: { type: Type.STRING },
                        a: { type: Type.STRING }
                      }
                    }
                  },
                  stats: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING },
                        val: { type: Type.INTEGER },
                        suffix: { type: Type.STRING }
                      }
                    }
                  },
                  steps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        step: { type: Type.STRING },
                        title: { type: Type.STRING },
                        desc: { type: Type.STRING }
                      }
                    }
                  },
                  styles: {
                    type: Type.OBJECT,
                    properties: {
                      paddingTop: { type: Type.INTEGER },
                      paddingBottom: { type: Type.INTEGER },
                      paddingLeft: { type: Type.INTEGER },
                      paddingRight: { type: Type.INTEGER },
                      gapSize: { type: Type.INTEGER },
                      maxWidth: { type: Type.INTEGER },
                      textAlign: { type: Type.STRING },
                      backgroundColor: { type: Type.STRING },
                      backgroundGradient: { type: Type.STRING },
                      useGradient: { type: Type.BOOLEAN },
                      textColor: { type: Type.STRING },
                      subtitleColor: { type: Type.STRING },
                      accentColor: { type: Type.STRING },
                      badgeBgColor: { type: Type.STRING },
                      badgeTextColor: { type: Type.STRING },
                      fontFamily: { type: Type.STRING },
                      titleSize: { type: Type.INTEGER },
                      titleWeight: { type: Type.STRING },
                      subtitleSize: { type: Type.INTEGER },
                      bodySize: { type: Type.INTEGER },
                      lineHeight: { type: Type.NUMBER },
                      cardBgColor: { type: Type.STRING },
                      cardTextColor: { type: Type.STRING },
                      cardBorderRadius: { type: Type.INTEGER },
                      cardShadow: { type: Type.STRING },
                      cardBorderWidth: { type: Type.INTEGER },
                      cardBorderColor: { type: Type.STRING },
                      borderRadius: { type: Type.INTEGER },
                      borderWidth: { type: Type.INTEGER },
                      borderColor: { type: Type.STRING },
                      borderStyle: { type: Type.STRING },
                      boxShadow: { type: Type.STRING },
                      buttonBgColor: { type: Type.STRING },
                      buttonTextColor: { type: Type.STRING },
                      buttonBorderRadius: { type: Type.INTEGER },
                      buttonHoverScale: { type: Type.BOOLEAN },
                    }
                  }
                }
              }
            }
          },
          required: ["blocks"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    if (parsed.blocks && Array.isArray(parsed.blocks)) {
      return res.json({ blocks: parsed.blocks, message: "Aesthetic styling updated by OnlyPage AI!" });
    }
    return res.status(500).json({ error: "Invalid blocks structure returned from AI model." });
  } catch (err: any) {
    console.error("Gemini API call failed:", err);
    return res.status(500).json({ error: err.message || "Failed to compile styling changes." });
  }
});

// ==========================================
// E-COMMERCE PAYMENT ROUTING & LEADS API
// ==========================================

// 1. Create Payment Order (server-calculated totals; no browser payment secrets)
app.post("/api/ecom/create-payment-order", async (req, res) => {
  try {
    const result = await createPaymentOrder(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Payment order creation failed', error);
    return res.status(500).json({ error: 'Could not prepare checkout. Please try again.' });
  }
});

// 2. Razorpay webhook (HMAC verified and idempotent)
app.post("/api/ecom/webhook", async (req, res) => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const signature = req.header('x-razorpay-signature');
    if (!verifyRazorpaySignature(rawBody, signature)) return res.status(401).json({ error: 'Invalid webhook signature.' });
    const result = await processRazorpayWebhook(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Razorpay webhook failed', error);
    return res.status(400).json({ error: 'Invalid webhook payload.' });
  }
});

// WhatsApp follow-ups use Evolution API from the server only. The browser never
// sees the instance token or provider API key.
app.post('/api/whatsapp/send-follow-up', async (req, res) => {
  try {
    const result = await sendLeadFollowUp(req.body, req.header('authorization'));
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('WhatsApp follow-up failed', error);
    return res.status(500).json({ error: 'Could not prepare the WhatsApp follow-up.' });
  }
});

app.get('/api/whatsapp/status', async (req, res) => {
  try {
    const siteId = typeof req.query.site_id === 'string' ? req.query.site_id : '';
    const result = await getWhatsAppConnection(siteId, req.header('authorization'));
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('WhatsApp connection status failed', error);
    return res.status(500).json({ error: 'Could not check the WhatsApp connection.' });
  }
});

app.post('/api/whatsapp/run-automation', async (req, res) => {
  if (!isValidAutomationSecret(req.header('x-automation-secret'))) {
    return res.status(401).json({ error: 'Invalid automation secret.' });
  }
  try {
    const result = await runNewLeadFollowUps();
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Automatic WhatsApp follow-ups failed', error);
    return res.status(500).json({ error: 'Automatic WhatsApp follow-ups failed.' });
  }
});

// 3. E-Commerce Notifications (Order confirmation email + Store owner alert)
app.post("/api/ecom/notify", async (req, res) => {
  const { store_name, customer_email, store_owner_email, order_number, total_amount, items } = req.body;

  const orderNo = order_number || 1001;
  const resolvedStore = store_name || "your store";
  const itemLines = Array.isArray(items)
    ? items.map((it: any) => `- ${it.name || "Item"} x${it.quantity || 1}`).join("\n")
    : "";

  const customer = await sendEmail({
    to: customer_email,
    subject: `Order #${orderNo} confirmed - ${resolvedStore}`,
    text: `Thank you for your order from ${resolvedStore}!\n\nOrder #${orderNo}\nTotal: ${total_amount ?? ""}\n\n${itemLines}\n\nWe'll let you know when it ships.`,
  });

  const owner = store_owner_email
    ? await sendEmail({
        to: store_owner_email,
        subject: `New sale - Order #${orderNo}`,
        text: `You made a sale on ${resolvedStore}.\n\nOrder #${orderNo}\nCustomer: ${customer_email || "unknown"}\nTotal: ${total_amount ?? ""}\n\n${itemLines}`,
        replyTo: customer_email,
      })
    : ({ dispatched: false, reason: "No store owner email provided." } as const);

  return res.json({
    success: customer.dispatched || owner.dispatched,
    customer_notified: customer.dispatched,
    owner_notified: owner.dispatched,
    order_number: orderNo,
    customer_error: customer.dispatched ? undefined : customer.reason,
    owner_error: owner.dispatched ? undefined : owner.reason,
    message: `Notifications processed for Order #${orderNo}`
  });
});

// 4. Storefront Customer Signup & Branded Welcome Email + WhatsApp Automation
app.post("/api/ecom/signup-customer", async (req, res) => {
  const { site_id, store_name, name, email, phone, custom_welcome_subject, custom_welcome_body } = req.body;

  if (!site_id || !email) {
    return res.status(400).json({ error: "Missing site_id or customer email." });
  }

  const resolvedStoreName = store_name || 'Store';
  const customerName = name || email.split('@')[0];
  const subject = (custom_welcome_subject || 'Welcome to {{store_name}}! 🎉 Here is your 10% discount code')
    .replace(/\{\{store_name\}\}/g, resolvedStoreName)
    .replace(/\{\{customer_name\}\}/g, customerName);

  const body = (custom_welcome_body || 'Hi {{customer_name}},\n\nThank you for signing up with {{store_name}}!')
    .replace(/\{\{store_name\}\}/g, resolvedStoreName)
    .replace(/\{\{customer_name\}\}/g, customerName);

  const welcome = await sendEmail({ to: email, subject, text: body });

  return res.json({
    success: welcome.dispatched,
    customer: { name: customerName, email, phone: phone || '' },
    email_dispatched: welcome.dispatched,
    // WhatsApp welcome for storefront customers is not wired to a provider yet;
    // report honestly rather than claiming a send that never happened.
    whatsapp_dispatched: false,
    email_error: welcome.dispatched ? undefined : welcome.reason,
    subject,
    body
  });
});

// 5. Products Filter API (Query by category or tag)
app.post("/api/ecom/products-by-filter", async (req, res) => {
  const { category, tag, products } = req.body;

  const list = Array.isArray(products) ? products : [];
  let filtered = list;

  if (category && category !== 'All') {
    filtered = filtered.filter(p => p.category?.toLowerCase() === category.toLowerCase());
  }

  if (tag && tag !== 'All') {
    filtered = filtered.filter(p => 
      Array.isArray(p.tags) ? p.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase()) : p.offer_badge === tag
    );
  }

  return res.json({
    success: true,
    total: filtered.length,
    category: category || 'All',
    tag: tag || 'All',
    products: filtered
  });
});

// ==========================================
// VITE DEV MIDDLEWARE / STATIC ASSETS
// ==========================================
async function startServer() {
  const apiOnly = process.env.API_ONLY === "true";
  if (apiOnly) {
    app.get("/api/health", (_req, res) => res.json({ ok: true }));
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`API-only server running on http://localhost:${PORT}`);
    });
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

