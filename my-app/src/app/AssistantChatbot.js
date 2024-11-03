import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import Fuse from "fuse.js";

const AssistantChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! To help you find resources, please tell me your location, the type of service you need, and your preferred language (e.g., 'I'm in Boston, looking for food services, and prefer English.')." }
  ]);
  const [input, setInput] = useState("");
  const [resources, setResources] = useState([]);
  const [fuse, setFuse] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef(null);

  const toggleChatbox = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch("/resources.csv");
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const parsedData = result.data.map((item) => ({
              ...item,
              "Service Type": item["Service Type"]?.split(",").map((service) => service.trim()) || [],
              "Languages": item["Languages"]?.split("-").map((lang) => lang.trim()) || [],
            }));
            setResources(parsedData);

            const fuseInstance = new Fuse(parsedData, {
              keys: [
                { name: "City/State/ZIP", weight: 0.4 },
                { name: "Service Type", weight: 0.5 },
                { name: "Languages", weight: 0.3 },
              ],
              threshold: 0.6,
              distance: 200,
              ignoreLocation: true,
            });
            setFuse(fuseInstance);
          },
        });
      } catch (error) {
        console.error("Error loading CSV:", error);
      }
    };

    fetchResources();
  }, []);

  const extractEntities = async (userInput) => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("API key is missing. Make sure it is set in .env.local");
      return {};
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Please respond only in JSON format. Extract location, service type, and language from this message: "${userInput}". Use only the following exact terms if found: Service types = ["Food", "Housing", "Legal", "Education", "Healthcare", "Employment", "Cash Assistance", "Mental Health"], Languages = ["English", "Spanish", "French", "Portuguese", "Haitian Creole", "Arabic", "Mandarin", "Cantonese", "Somali", "Swahili", "Dari", "Pashto", "Maay Maay", "Darija"]. For example: {"location": "city", "service": "food", "language": "English"}`,
            }
          ],
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content.trim();
      const extractedData = JSON.parse(content);
      return extractedData;
    } catch (error) {
      console.error("Error extracting entities:", error);
      return {};
    }
  };

  const displayTypingEffect = (text) => {
    setIsTyping(true);
    let index = 0;
    const interval = setInterval(() => {
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        const updatedContent = lastMessage.content + (text[index] || "");
        return [...prevMessages.slice(0, -1), { ...lastMessage, content: updatedContent }];
      });
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);
  };

  const performSearch = (criteria) => {
    const { location, service, language } = criteria;
    const results = fuse.search(`${service} ${language} ${location}`);

    const fullMatches = results
      .map(result => result.item)
      .filter(item => 
        item["Service Type"].includes(service) &&
        item.Languages.includes(language) &&
        item["City/State/ZIP"].toLowerCase().includes(location.toLowerCase())
      );

    const partialMatches = results
      .map(result => result.item)
      .filter(item =>
        item["Service Type"].includes(service) || 
        item.Languages.includes(language) ||
        item["City/State/ZIP"].toLowerCase().includes(location.toLowerCase())
      );

    const matchesToShow = fullMatches.length > 0 ? fullMatches : partialMatches;

    const response = matchesToShow.length > 0
      ? matchesToShow.map(formatRecommendation).join("<br><br>")
      : "I'm sorry, but I couldn't find any resources that match all your criteria. Please try rephrasing or providing more details.";

    setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: "" }]);
    displayTypingEffect(response);
  };

  const formatRecommendation = (resource) => (
` <strong>${resource["Name of Organization"]}</strong><br>
<strong>Summary:</strong> ${resource["Summary of Services"]}<br>
<strong>Location:</strong> ${resource["City/State/ZIP"]}<br>
<strong>Website:</strong> <a href="${resource["Website"] || "#"}" target="_blank">${resource["Website"] || "N/A"}</a><br>
<strong>Contact:</strong> ${resource["Phone Number"] || "N/A"}`
  );

  const sendMessage = async () => {
    if (!input.trim() || input.length > 500 || isProcessing) return;

    const userMessage = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsProcessing(true);

    const { location, service, language } = await extractEntities(input);

    if (location && service && language) {
      performSearch({ location, service, language });
    } else {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: ""
        },
      ]);
      displayTypingEffect("To provide accurate recommendations, please include your location, service type, and preferred language in one message.");
    }

    setInput("");
    setIsProcessing(false);
  };

  return (
    <div>
      <button onClick={toggleChatbox} style={chatButtonStyle}>
        {isOpen ? <span style={closeButtonStyle}>✖</span> : "Chat with Assistant"}
      </button>
      {isOpen && (
        <div style={chatboxStyle}>
          <div style={messagesStyle}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={msg.role === "user" ? userMessageStyle : assistantMessageStyle}
                dangerouslySetInnerHTML={{ __html: msg.content }} // Render HTML directly
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <textarea
            style={inputStyle}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            placeholder="Type your message..."
            disabled={isTyping || isProcessing}
          />
          <button onClick={sendMessage} style={sendButtonStyle} disabled={isTyping || isProcessing}>
            Send
          </button>
        </div>
      )}
    </div>
  );
};
// Styling
const chatButtonStyle = {
  position: "fixed",
  bottom: "30px",
  right: "30px",
  backgroundColor: "#1f7ecb ",
  color: "white",
  padding: "15px 20px",
  borderRadius: "25px",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
};

const closeButtonStyle = {
  color: "#f1f1f1",
  fontSize: "20px",
};

const chatboxStyle = {
  position: "fixed",
  bottom: "80px",
  right: "20px",
  width: "300px",
  maxHeight: "400px",
  backgroundColor: "#f1f1f1",
  borderRadius: "10px",
  padding: "10px",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
};

const messagesStyle = {
  flex: 1,
  overflowY: "auto",
  marginBottom: "10px",
  maxHeight: "300px",
  paddingRight: "5px",
  whiteSpace: "pre-wrap",
};

const userMessageStyle = {
  backgroundColor: "#007bff",
  color: "white",
  padding: "8px",
  borderRadius: "8px",
  marginBottom: "5px",
  alignSelf: "flex-end",
  maxWidth: "80%",
};

const assistantMessageStyle = {
  backgroundColor: "#e0e0e0",
  color: "black",
  padding: "8px",
  borderRadius: "8px",
  marginBottom: "5px",
  alignSelf: "flex-start",
  maxWidth: "80%",
};

const inputStyle = {
  padding: "8px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  resize: "none",
  outline: "none",
};

const sendButtonStyle = {
  backgroundColor: "#1f7ecb",
  color: "white",
  border: "none",
  padding: "8px",
  borderRadius: "8px",
  cursor: "pointer",
  marginTop: "10px",
};

export default AssistantChatbot;
