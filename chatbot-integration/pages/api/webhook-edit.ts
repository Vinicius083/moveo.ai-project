import { NextApiRequest, NextApiResponse } from "next";
import {
  fetchConversation,
  updateGoogleCalendar,
  updateGoogleSheet,
  interpretIntentWithOpenAI,
} from "@/util/editUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers["x-verification-token"];

  if (token !== process.env.MOVEO_WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  try {
    // const { session_id } = req.body;
    // if (!session_id)
    //   return res.status(400).json({ error: "session_id is required" });

    // const conversation = await fetchConversation(session_id);
    // if (!conversation)
    //   return res.status(400).json({ error: "No conversation found" });

    const conversation =
      "Usuário: Quero atualizar a primeira célula da tabela para o valor 'Atualizado'. Bot: Entendido. Bot: Ok. Qual campo você deseja atualizar? Usuário: O campo 'nome'. Bot: Entendido. Atualizando o campo 'nome' da tabela.";

    const { tipo, identificador, campo, valor, eventId } =
      await interpretIntentWithOpenAI(conversation);

    if (!tipo || !identificador || !campo || !valor) {
      return res.status(400).json({
        error: "Tipo, identificador, campo e valor são obrigatórios",
      });
    }

    if (tipo === "sheet") {
      await updateGoogleSheet(identificador, campo, valor);
    } else if (tipo === "calendar") {
      if (!eventId)
        return res
          .status(400)
          .json({ error: "eventId is required for calendar update" });
      await updateGoogleCalendar(identificador, eventId, campo, valor);
    } else {
      return res.status(400).json({ error: "Tipo inválido" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
