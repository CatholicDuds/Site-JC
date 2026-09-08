require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'", "https://www.google.com", "https://maps.google.com"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    }
  }
}));
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }
});

const projects = [
  // Os arquivos fornecidos informam os setores, mas não informam os nomes
  // das empresas atendidas. Cadastre aqui os projetos reais da RBN.
  // Exemplo:
  // { sector: "Cimento", company: "Nome da empresa", description: "Descrição do projeto", scope: "CLP, supervisão..." }
  { 
    sector: "Cimento",
    company: "ITAMBÉ",
    description: "Descrição do serviço realizado",
    scope: "CLP, supervisão, redes..."
  },
  { 
    sector: "Química",
    company: "POTENCIAL",
    description: "Descrição do serviço realizado",
    scope: "CLP, supervisão, redes..."
  }
];

const allowedSectors = [
  "Cimento","Automobilística","Alimentícia","Biotecnologia","Argamassa","Química",
  "Transporte Ferroviário","Transporte Rodoviário","Transporte Portuário",
  "Fabricação de Artefatos de Fibrocimento","Tratamento de Água e Esgoto","Cal"
];

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "RBN Automação Industrial backend" });
});

app.get("/api/projects", (_req, res) => {
  res.json({ sectors: allowedSectors, projects });
});

function clean(value, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
}

function validateContact(body) {
  const name = clean(body.name, 120);
  const email = clean(body.email, 160);
  const phone = clean(body.phone, 60);
  const subject = clean(body.subject, 120);
  const message = clean(body.message, 4000);

  if (!name || !message) return { error: "Nome e mensagem são obrigatórios." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Informe um e-mail válido." };

  return { value: { name, email, phone, subject, message } };
}

function createTransporter() {
  const required = ["SMTP_HOST","SMTP_PORT","SMTP_USER","SMTP_PASS","CONTACT_TO"];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error(`SMTP não configurado. Variáveis ausentes: ${missing.join(", ")}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

app.post("/api/contact", contactLimiter, async (req, res) => {
  const result = validateContact(req.body);
  if (result.error) return res.status(400).json({ message: result.error });

  try {
    const transporter = createTransporter();
    const { name, email, phone, subject, message } = result.value;

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_TO,
      replyTo: email,
      subject: `[Site RBN] ${subject || "Novo contato"} — ${name}`,
      text:
`Novo contato pelo site RBN Automação Industrial

Nome: ${name}
E-mail: ${email}
Telefone: ${phone || "Não informado"}
Assunto: ${subject || "Não informado"}

Mensagem:
${message}
`,
      html: `
        <h2>Novo contato pelo site RBN Automação Industrial</h2>
        <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
        <p><strong>Telefone:</strong> ${escapeHtml(phone || "Não informado")}</p>
        <p><strong>Assunto:</strong> ${escapeHtml(subject || "Não informado")}</p>
        <hr>
        <p><strong>Mensagem:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `
    });

    res.json({ ok: true, message: "Mensagem enviada com sucesso." });
  } catch (error) {
    console.error("[contact]", error.message);
    res.status(503).json({ message: "O serviço de e-mail não está configurado ou está temporariamente indisponível." });
  }
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

app.use(express.static(PUBLIC_DIR, {
  extensions: ["html"],
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));

// Fallback para rotas do frontend.
// Express 5 não aceita mais app.get("*", ...); usamos middleware sem
// padrão de rota para evitar o erro "Missing parameter name at index 1: *".
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "Rota não encontrada." });
  }
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`RBN site rodando em http://localhost:${PORT}`);
});
