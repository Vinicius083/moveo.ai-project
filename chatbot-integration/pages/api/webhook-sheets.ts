import type { NextApiRequest, NextApiResponse } from "next";
import { sheets } from "@/lib/google";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const verificationToken = req.headers["x-verification-token"];

  if (verificationToken !== process.env.MOVEO_WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { phone } = req.body.context.user;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const parsePhone = String(phone).trim();

    const formatPhoneNumber = (phone: string): string => {
      return phone.replace(/\D/g, "").replace(/^55/, "");
    };

    const formattedPhone = formatPhoneNumber(parsePhone);

    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      return res
        .status(500)
        .json({ error: "Spreadsheet ID is not configured" });
    }

    const range = "Página1!A:E";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    const matchedRow = rows.find((row) => row[0] === formattedPhone);

    if (!matchedRow) {
      return res.status(404).json({ error: "No matching phone number found" });
    }

    const data = {
      telefone: matchedRow[0],
      nome: matchedRow[1],
      email: matchedRow[2],
      cargo: matchedRow[3],
      setor: matchedRow[4],
    };

    const live_instructions = `nome: ${data.nome}\nemail: ${data.email}\ncargo: ${data.cargo}\nsetor: ${data.setor}\ntelefone: ${data.telefone}`;

    return res.status(200).json({
      context: {
        live_instructions,
      },
    });
  } catch (error) {
    console.error("Erro interno:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
