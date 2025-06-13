const { SESClient } = require('@aws-sdk/client-ses');
const nodemailer = require('nodemailer');

// Configure AWS SES with SDK v3
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Create transporter
const transporter = nodemailer.createTransport({
  SES: { ses: sesClient, aws: require('@aws-sdk/client-ses') },
});

// Send email with passcode
const sendPasscodeEmail = async (recipientEmail, passcode, qrBundle) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: `Access Code for QR Bundle: ${qrBundle.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0F52BA; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">QRLocker</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>QR Bundle Access Code</h2>
            <p>You have been granted access to the following QR bundle:</p>
            <p><strong>${qrBundle.title}</strong></p>
            <p>${qrBundle.description || ''}</p>
            <p>To access this QR bundle, use the following passcode:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 2px; margin: 20px 0; font-weight: bold;">
              ${passcode}
            </div>
            <p style="color: #666; font-size: 12px;">This passcode will expire if the QR bundle has an expiry date set.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send email notification for document request
const sendDocumentRequestNotification = async (adminEmail, request) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: `New Document Request: ${request.requestTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0F52BA; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">QRLocker</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>New Document Request</h2>
            <p>A new document request has been submitted:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Request Title:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${request.requestTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Requester:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${request.requesterName} (${request.requesterEmail})</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Description:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${request.requestDescription}</td>
              </tr>
            </table>
            <p>Please log in to the admin dashboard to review and respond to this request.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">This is an automated message from QRLocker 2.0.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
};

// Send document request response to requester
const sendRequestResponseEmail = async (request, isApproved, qrUrl) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: request.requesterEmail,
      subject: `Document Request Update: ${request.requestTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0F52BA; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">QRLocker</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>Document Request ${isApproved ? 'Approved' : 'Rejected'}</h2>
            <p>Your document request "${request.requestTitle}" has been ${isApproved ? 'approved' : 'rejected'}.</p>
            ${request.responseMessage ? `<p><strong>Message:</strong> ${request.responseMessage}</p>` : ''}
            ${isApproved && qrUrl ? `
              <div style="margin: 20px 0; text-align: center;">
                <p><strong>Your requested documents are available via the QR code below:</strong></p>
                <img src="${qrUrl}" alt="QR Code" style="max-width: 200px; border: 1px solid #ddd; padding: 10px;">
                ${request.sharedQrBundle?.accessControl?.hasPasscode ? 
                  `<p><strong>Access Code:</strong> ${request.sharedQrBundle.accessControl.passcode}</p>` : ''}
              </div>
            ` : ''}
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">This is an automated message from QRLocker 2.0.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending response email:', error);
    throw error;
  }
};

// Send email notification for internal user-to-user request
const sendInternalRequestNotification = async (recipient, request, requester) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: recipient.email,
      subject: `New Request from ${requester.name}: ${request.requestTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0F52BA; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">QRLocker</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>New Internal Request</h2>
            <p>Hi ${recipient.name},</p>
            <p>${requester.name} has sent you a document request:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0F52BA; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0F52BA;">${request.requestTitle}</h3>
              <p style="margin-bottom: 0;">${request.requestDescription}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">From:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${requester.name} (${requester.email})</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Priority:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Category:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${request.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
              </tr>
              ${request.dueDate ? `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Due Date:</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(request.dueDate).toLocaleDateString()}</td>
              </tr>` : ''}
            </table>

            <div style="text-align: center; margin: 30px 0;">
              <p>Please log in to QRLocker to respond to this request.</p>
              <a href="${process.env.FRONTEND_URL}/requests" style="display: inline-block; background-color: #0F52BA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Request</a>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">This is an automated message from QRLocker 2.0.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending internal request notification:', error);
    throw error;
  }
};

// Send internal request response notification to requester
const sendInternalRequestResponseEmail = async (requester, request, response, responder) => {
  try {
    const isAccepted = response.status === 'accepted';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: requester.email,
      subject: `Request Response from ${responder.name}: ${request.requestTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0F52BA; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">QRLocker</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>Request Response Received</h2>
            <p>Hi ${requester.name},</p>
            <p>${responder.name} has ${isAccepted ? 'accepted' : 'declined'} your request:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid ${isAccepted ? '#28a745' : '#dc3545'}; margin: 20px 0;">
              <h3 style="margin-top: 0; color: ${isAccepted ? '#28a745' : '#dc3545'};">${request.requestTitle}</h3>
              <p style="margin-bottom: 0;"><strong>Status:</strong> ${isAccepted ? 'Accepted' : 'Declined'}</p>
            </div>

            ${response.responseMessage ? `
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <h4 style="margin-top: 0;">Message from ${responder.name}:</h4>
              <p style="margin-bottom: 0;">${response.responseMessage}</p>
            </div>` : ''}

            ${isAccepted && response.sharedQrBundle ? `
            <div style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #0dcaf0; margin: 20px 0;">
              <h4 style="margin-top: 0;">Shared Documents:</h4>
              <p>${responder.name} has shared a QR bundle: <strong>${response.sharedQrBundle.title}</strong></p>
              <div style="text-align: center; margin: 15px 0;">
                <img src="${response.sharedQrBundle.qrCodeUrl}" alt="QR Code" style="max-width: 150px; border: 1px solid #ddd; padding: 5px;">
              </div>
            </div>` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <p>View the full request details in QRLocker.</p>
              <a href="${process.env.FRONTEND_URL}/requests" style="display: inline-block; background-color: #0F52BA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Request</a>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">This is an automated message from QRLocker 2.0.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending internal request response email:', error);
    throw error;
  }
};

module.exports = {
  sendPasscodeEmail,
  sendDocumentRequestNotification,
  sendRequestResponseEmail,
  sendInternalRequestNotification,
  sendInternalRequestResponseEmail,
};