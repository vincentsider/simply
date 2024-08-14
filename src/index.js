import Vapi from "@vapi-ai/web";

const statusDisplay = document.getElementById("status");
const speakerDisplay = document.getElementById("speaker");
const volumeDisplay = document.getElementById("volume");
const vapiTyping = document.getElementById("vapiTyping");
const vapiStatusMessage = document.getElementById("vapiStatusMessage");
const chatWindow = document.getElementById("chat");

const vapi = new Vapi("d5b4e7ac-a602-4509-b313-b250daa8d854");

let connected = false;
let assistantIsSpeaking = false;
let volumeLevel = 0;
let callActive = false;
const maxSpread = 30; // Maximum spread of the shadow in pixels

// Vapi Event Listeners
vapi.on("call-start", function () {
  connected = true;
  updateUI();
});

vapi.on("call-end", function () {
  connected = false;
  updateUI();

  callWithVapi.style.boxShadow = `0 0 0px 0px rgba(58,25,250,0.7)`;
});

vapi.on("speech-start", function () {
  assistantIsSpeaking = true;
  updateUI();
});

vapi.on("speech-end", function () {
  assistantIsSpeaking = false;
  updateUI();
});

vapi.on("message", (message) => {
  if (message.type === "function-call") {
    // If the ChangeColor function was called
    if (message.functionCall && message.functionCall.name === "ChangeColor") {
      // Don't forget to sanitzie the values when building this in a real application
      callWithVapi.style.backgroundColor =
        message.functionCall.parameters.ColorCode;
    }

    // If the change text function was called
    if (message.functionCall && message.functionCall.name === "WriteText") {
      // Don't forget to sanitzie the values when building this in a real application
      vapiTyping.textContent = message.functionCall.parameters.Text;
    }
  }

  // Adds a message to the background chat
  if (message.type === "conversation-update") {
    updateChat(message);
  }
});

vapi.on("volume-level", function (level) {
  volumeLevel = level; // Level is from 0.0 to 1.0

  // Calculate the spread directly based on the volume level
  const spread = volumeLevel * maxSpread;

  volumeDisplay.textContent = `Volume: ${volumeLevel.toFixed(3)}`; // Display up to 3 decimal places for simplicity

  // Update the box shadow
  const callWithVapi = document.getElementById("callWithVapi");
  callWithVapi.style.boxShadow = `0 0 ${spread}px ${spread / 2}px rgba(58,25,250,0.7)`;
});

vapi.on("error", function (error) {
  connected = false;

  if (error.error.message) {
    vapiStatusMessage.textContent = error.error.message;
  }

  updateUI();
});

callWithVapi.addEventListener("click", function () {
  if (!callActive) {
    callActive = true;
    callWithVapi.style.backgroundColor = "#007aff";
    vapi.start(assistantOptions);
  } else {
    callActive = false;
    callWithVapi.style.backgroundColor = "#858585";
    vapi.stop();
  }
});

// Initialize background with the correct color
callWithVapi.style.backgroundColor = "#858585";

function updateChat(conversationUpdate) {
  chatWindow.innerHTML = ""; // Clear the chat window before adding new messages

  conversationUpdate.conversation.forEach((message) => {
    var messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    // Add specific class based on the role
    switch (message.role) {
      case "assistant":
        messageDiv.classList.add("assistant");
        break;
      case "user":
        messageDiv.classList.add("user");
        break;
      case "tool": // You might want a different style for tool responses
        messageDiv.classList.add("tool");
        break;
    }

    // Set text content and handle tool calls if they exist
    if (message.content) {
      messageDiv.textContent = message.content;
    } else if (message.tool_calls && message.tool_calls.length > 0) {
      // Example: Append a generic message or handle differently
      messageDiv.textContent = "Processing request...";
    }

    chatWindow.appendChild(messageDiv);
  });

  // Scroll to the bottom of the chat window
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function updateUI() {
  // Update the status
  statusDisplay.textContent = `Status: ${connected ? "Connected" : "Disconnected"}`;

  // Update the speaker
  speakerDisplay.textContent = `Speaker: ${assistantIsSpeaking ? "Assistant" : "User"}`;
}

const assistantOptions = {
  name: "Yoyu",
  voice: {
    voiceId: "sarah",
    provider: "11labs",
    stability: 0.5,
    similarityBoost: 0.75,
  },
  model: {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "Yoyu is a sophisticated AI web assistant. Crafted with the persona of an experienced content producer in her early 30s, Lisa combines in-depth knowledge of the luxury hospitality sector with a keen sense of emotional intelligence. Yoyu primary role is to understand and engage in conversations with a focus on luxury hospitality, current trends, and events. Yoyu tone should be warm, personable, and slightly formal, reflecting the high standards of the luxury sector.\n\n Yoyu must use these insights to help create and publish high-quality content on social media.\nYoyu's primary objective is to make clients feel valued and listened to while also collecting useful data that can drive engaging social media content.\n\n**Major Mode of Interaction:** Yoyu interacts primarily through voice, adeptly processing oral queries and responding promptly. Additionally, Yoyu can utilize custom functions like \"WriteText\" and \"ChangeColor\" to interact with website elements directly, enhancing user interaction and providing a dynamic browsing experience.\n\n**Interaction Instructions:**\n\n- Yoyu encourages users to share about their events, local activities etc to get inspiration about social media content. She explore the user's mind in search of insights that can help her in her mission, acknowledging each query with confirmation of her engagement, e.g., \"Yes, I'm here. How can I assist you today?\"\n-   She emphasizes the importance of clear, sharing communication, tailored to the context of each interaction.",
      },
    ],
    provider: "openai",
    functions: [
      {
        name: "ChangeColor",
        async: false,
        parameters: {
          type: "object",
          properties: {
            ColorCode: {
              type: "string",
              description: "The HEX color code including the #",
            },
          },
        },
        description: "Changes the color of a HTML element",
      },
      {
        name: "WriteText",
        async: false,
        parameters: {
          type: "object",
          properties: {
            Text: {
              type: "string",
              description: "The text to write",
            },
          },
        },
        description: "Writes text on a website on user request",
      },
    ],
    maxTokens: 250,
    temperature: 0.7,
    emotionRecognitionEnabled: true,
  },
  recordingEnabled: true,
  firstMessage: "Hello, this is YoYu! How may I assist you today with your content?",
  voicemailMessage:
    "You've reached our voicemail. Please leave a message after the beep, and we'll get back to you as soon as possible.",
  endCallFunctionEnabled: false,
  endCallMessage: "Thank you for contacting us. Have a great day!",
  transcriber: {
    model: "nova-2",
    keywords: [],
    language: "en",
    provider: "deepgram",
  },
  clientMessages: [
    "transcript",
    "hang",
    "function-call",
    "speech-update",
    "metadata",
    "conversation-update",
  ],
  serverMessages: [
    "end-of-call-report",
    "status-update",
    "hang",
    "function-call",
  ],
  dialKeypadFunctionEnabled: false,
  endCallPhrases: ["goodbye"],
  hipaaEnabled: false,
  voicemailDetectionEnabled: false,
};
