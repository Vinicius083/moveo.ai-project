export default function formatEventsAsMarkdown(events: any[]) {
  if (events.length === 0) {
    return "### 📅 Agenda do usuário\n\nSem eventos futuros encontrados.";
  }

  let markdown = "### 📅 Agenda do usuário\n\n";
  events.forEach((event, index) => {
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date;
    markdown += `**${index + 1}. ${event.summary || "Sem título"}**  
🕐 Início: ${start}  
⏰ Fim: ${end}  
📍 Local: ${event.location || "Não especificado"}  
📝 Descrição: ${event.description || "Sem descrição"}\n\n`;
  });

  return markdown;
}
