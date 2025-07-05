import OpenAI from "openai";
import axios from "axios";
import { sheets, calendar } from "@/lib/google";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function fetchConversation(sessionId: string) {
  console.log("Fetching conversation for session:", sessionId);
  const response = await axios.get(
    `https://api.moveo.ai/logs/sessions/${sessionId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.MOVEO_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response) throw new Error("Failed to fetch Moveo logs");

  const data = response.data;
  return data.logs.map((log: any) => `${log.role}: ${log.text}`).join("\n");
}

export async function interpretIntentWithOpenAI(conversation: string) {
  const chat = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Você é um assistente que interpreta a conversa e extrai a intenção do usuário para atualizar uma planilha ou calendário. Retorne um JSON no formato: { tipo: 'sheet' | 'calendar', identificador: string, campo: string, valor: string }",
      },
      {
        role: "user",
        content: conversation,
      },
    ],
    temperature: 0.2,
  });

  const content = chat.choices[0].message.content;
  return JSON.parse(content || "{}");
}

export async function updateGoogleSheet(
  identificador: string,
  campo: string,
  valor: string
) {
  const spreadsheetId = process.env.SPREADSHEET_ID!;
  const range = "Página1!A:E";
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values || [];
  const headers = rows[0];
  const rowIndex = rows.findIndex((row) => row[0] === identificador);
  const colIndex = headers.indexOf(campo);

  if (rowIndex === -1 || colIndex === -1) {
    throw new Error("Campo ou identificador não encontrado");
  }

  const targetCell = `Página1!${String.fromCharCode(65 + colIndex)}${
    rowIndex + 1
  }`;

  const update = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: targetCell,
    valueInputOption: "RAW",
    requestBody: {
      values: [[valor]],
    },
  });

  return update.data;
}

export async function updateGoogleCalendar(
  email: string,
  eventId: string,
  campo: string,
  valor: string
) {
  const event = await calendar.events.get({
    calendarId: email,
    eventId,
  });

  if (!event.data) throw new Error("Evento não encontrado");

  const updatedEvent = {
    ...event.data,
    [campo]: valor,
  };

  const update = await calendar.events.update({
    calendarId: email,
    eventId,
    requestBody: updatedEvent,
  });

  return update.data;
}
