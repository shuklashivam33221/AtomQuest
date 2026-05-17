export async function sendTeamsNotification({
  managerEmail,
  employeeName,
  actionType,
  cycleName,
  goalsCount,
  deepLinkUrl
}: {
  managerEmail: string;
  employeeName: string;
  actionType: "SUBMITTED" | "UPDATED" | "APPROVED" | "RETURNED";
  cycleName: string;
  goalsCount: number;
  deepLinkUrl: string;
}) {
  const isProductionWebhook = !!process.env.TEAMS_WEBHOOK_URL;

  // Render a beautiful MS Teams Adaptive Card payload
  const cardPayload = {
    "type": "message",
    "attachments": [
      {
        "contentType": "application/vnd.microsoft.card.adaptive",
        "content": {
          "type": "AdaptiveCard",
          "body": [
            {
              "type": "Container",
              "style": "emphasis",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "🎯 AtomQuest Goals Alert",
                  "weight": "Bolder",
                  "size": "Medium",
                  "color": "Accent"
                }
              ]
            },
            {
              "type": "TextBlock",
              "text": `Hello Manager, your subordinate **${employeeName}** has **${actionType}** their goals sheet.`,
              "wrap": true,
              "size": "Default"
            },
            {
              "type": "FactSet",
              "facts": [
                { "title": "Employee:", "value": employeeName },
                { "title": "Goal Cycle:", "value": cycleName },
                { "title": "Number of Goals:", "value": `${goalsCount}` },
                { "title": "Action Mapped:", "value": actionType }
              ]
            }
          ],
          "actions": [
            {
              "type": "Action.OpenUrl",
              "title": "👁️ View Subordinate Goal Sheet",
              "url": deepLinkUrl
            }
          ],
          "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
          "version": "1.4"
        }
      }
    ]
  };

  try {
    if (isProductionWebhook) {
      const response = await fetch(process.env.TEAMS_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardPayload)
      });
      console.log(`🤖 [TEAMS WEBHOOK SENT] Status: ${response.status} To Manager: ${managerEmail}`);
      return true;
    } else {
      // Graceful sandbox logging
      const border = "=".repeat(65);
      console.log(`\n${border}`);
      console.log(`🤖  [TEAMS ADAPTIVE CARD SIMULATED DISPATCH]`);
      console.log(`To Manager:     ${managerEmail}`);
      console.log(`Employee:       ${employeeName}`);
      console.log(`Action Mapped:  ${actionType}`);
      console.log(`Goal Cycle:     ${cycleName}`);
      console.log(`Goals Count:    ${goalsCount}`);
      console.log(`👉 DEEP LINK:    ${deepLinkUrl}`);
      console.log(`-----------------------------------------------------------------`);
      console.log(JSON.stringify(cardPayload, null, 2));
      console.log(`${border}\n`);
      return true;
    }
  } catch (error) {
    console.error("❌ Failed to dispatch Teams notification:", error);
    return false;
  }
}
