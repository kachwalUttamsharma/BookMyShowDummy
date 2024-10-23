const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env; // Ensure these are added in .env

// Function to replace placeholders in the email template
function replaceContent(content, creds) {
  return Object.keys(creds).reduce((updatedContent, key) => {
    return updatedContent.replace(new RegExp(`#{${key}}`, "g"), creds[key]);
  }, content);
}

async function EmailHelper(templateName, receiverEmail, creds) {
  try {
    const templatePath = path.join(__dirname, "email_templates", templateName);
    let content = await fs.promises.readFile(templatePath, "utf-8");
    content = replaceContent(content, creds);
    const emailDetails = {
      to: receiverEmail,
      from: GMAIL_USER,
      subject: "Mail from Scaler Book My Show",
      html: content,
    };

    // Define Gmail SMTP transport configuration
    const transportDetails = {
      service: "gmail", // Using Gmail's SMTP service
      auth: {
        user: GMAIL_USER, // Gmail address from .env
        pass: GMAIL_APP_PASSWORD, // App password from .env (not your actual Gmail password)
      },
    };

    // Create a transporter instance with the defined transport details
    const transporter = nodemailer.createTransport(transportDetails);

    // Send the email using the transporter
    await transporter.sendMail(emailDetails);
    console.log("Email sent successfully!");
  } catch (err) {
    // Enhanced error handling
    if (err.code === "ENOENT") {
      console.error("Template file not found:", err.message);
    } else if (err.response && err.response.body) {
      console.error("Error sending email:", err.response.body);
    } else {
      console.error("Error occurred:", err.message);
    }
  }
}

module.exports = EmailHelper;
