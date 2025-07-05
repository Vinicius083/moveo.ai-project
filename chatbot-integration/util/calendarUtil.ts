export default function formatEventsAsMarkdown(events: any[]) {
  if (events.length === 0) {
    return "### 📅 Agenda do usuário\n\nSem eventos futuros encontrados.";
  }

  let markdown = "### 📅 Agenda do usuário\n\n";
  events.forEach((event, index) => {
    const startDateTime = new Date(event.start?.dateTime || event.start?.date);
    const endDateTime = new Date(event.end?.dateTime || event.end?.date);

    const formatDate = (date: Date) =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);

    const formatTime = (date: Date) =>
      new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);

    markdown += `**${index + 1}. ${event.summary || "Sem título"}**  
🕐 Início: ${formatDate(startDateTime)} as ${formatTime(startDateTime)}  
⏰ Fim: ${formatDate(endDateTime)} as ${formatTime(endDateTime)}  
📍 Local: ${event.location || "Não especificado"}  
📝 Descrição: ${event.description || "Sem descrição"}\n\n`;
  });

  return markdown;
}
