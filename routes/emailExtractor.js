const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const excel = require('exceljs');

const SCOPES = ['https://mail.google.com/'];
const TOKEN_PATH = 'token.json';

router.post('/extract-emails', (req, res) => {
  const { clientId, clientSecret, userName, port, useSSL, subject } = req.body;
  authorize(clientId, clientSecret, (auth) => {
    extractEmails(auth, subject, (data) => {
      generateExcelFile(data, (filePath) => {
        console.log(`Generated Excel file at: ${filePath}`); // Log the file path
        res.json({ filePath: `/api/download/${path.basename(filePath)}` });
      });
    });
  });
});

router.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, '..', 'extracted_emails.xlsx');
  console.log(`Downloading file from: ${filePath}`); // Log the file path
  res.download(filePath, 'extracted_emails.xlsx', (err) => {
    if (err) {
      console.error('Error downloading the file:', err);
      res.status(500).send('Error downloading the file.');
    }
  });
});

function authorize(clientId, clientSecret, callback) {
  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    oAuth2Client.getAccessToken((err, token) => {
      if (err) return getNewToken(oAuth2Client, callback);
      callback(oAuth2Client);
    });
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function extractEmails(auth, subject, callback) {
  const gmail = google.gmail({ version: 'v1', auth });

  gmail.users.messages.list({
    userId: 'me',
    q: `subject:${subject}`
  }, (err, res) => {
    if (err) return console.error('The API returned an error:', err);

    const messages = res.data.messages;
    if (messages && messages.length) {
      const emails = [];
      messages.forEach((message, index) => {
        const messageId = message.id;
        gmail.users.messages.get({
          userId: 'me',
          id: messageId
        }, (err, res) => {
          if (err) return console.error('The API returned an error:', err);
          const email = res.data;
          const from = email.payload.headers.find(header => header.name === 'From').value;
          const date = new Date(parseInt(email.internalDate)).toISOString().slice(0, 10);
          const subject = email.payload.headers.find(header => header.name === 'Subject').value;
          emails.push({ from, date, subject });
          if (index === messages.length - 1) {
            callback(emails);
          }
        });
      });
    } else {
      console.log('No messages found.');
      callback([]);
    }
  });
}

function generateExcelFile(data, callback) {
  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet('Emails');

  worksheet.columns = [
    { header: 'From', key: 'from', width: 30 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Subject', key: 'subject', width: 50 },
  ];

  data.forEach((email) => {
    worksheet.addRow(email);
  });

  const filePath = path.join(__dirname, '..', 'extracted_emails.xlsx');
  workbook.xlsx.writeFile(filePath).then(() => {
    callback(filePath);
  });
}

module.exports = router;
