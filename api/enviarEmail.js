import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { to, assunto, corpo } = req.body;

  if (!to || !assunto || !corpo) {
    return res.status(400).json({ erro: "Campos obrigatórios ausentes." });
  }

  try {
    const envio = await resend.emails.send({
      from: 'Monevo <onboarding@resend.dev>',
      to: [to],
      subject: assunto,
      html: corpo
    });

    return res.status(200).json({ sucesso: true, envio });
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    return res.status(500).json({ erro: "Falha no envio", detalhe: err });
  }
}
