import { NextApiRequest, NextApiResponse } from "next";
import { calendar } from "@/lib/google";
import formatEventsAsMarkdown from "@/util/calendarUtil";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers["x-verification-token"];

  if (token !== process.env.MOVEO_WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body.context.user;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const now = new Date();
    const response = await calendar.events.list({
      calendarId: email,
      timeMin: now.toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    if (events.length === 0) {
      return res.status(404).json({ message: "No upcoming events found" });
    }

    const live_instructions = formatEventsAsMarkdown(events);

    return res.status(200).json({
      output: {
        live_instructions,
      },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res
      .status(500)
      .json({ error: "Internal server error, verify your email" });
  }
}
