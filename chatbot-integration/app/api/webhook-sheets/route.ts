import { NextResponse, NextRequest } from "next/server";
import { sheets } from "@/app/lib/google";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone)
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );

    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (!spreadsheetId)
      return NextResponse.json(
        { error: "Spreadsheet ID is not configured" },
        { status: 500 }
      );

    const range = "Página1!A:E";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values || [];

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "No data found in the spreadsheet" },
        { status: 404 }
      );
    }

    const matchedRow = rows.find((row) => row[0] === phone);

    if (!matchedRow) {
      return NextResponse.json(
        { error: "No matching phone number found" },
        { status: 404 }
      );
    }

    const data = {
      telefone: matchedRow[0],
      nome: matchedRow[1],
      email: matchedRow[2],
      cargo: matchedRow[3],
      setor: matchedRow[4],
    };

    console.log("Data found:", data);

    return NextResponse.json({
      output: {
        live_instructions: {
          conteudo: `Nome: ${data.nome}, Email: ${data.email}, Cargo: ${data.cargo}, Setor: ${data.setor}`,
        },
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "unknown internal Server Error" },
      { status: 500 }
    );
  }
}
