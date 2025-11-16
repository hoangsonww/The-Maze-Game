const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use real SMTP
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Development: Use Ethereal (test account)
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.password',
      },
    });
  }
};

const transporter = createTransporter();

// Email templates
const templates = {
  welcome: (username) => ({
    subject: 'Welcome to Maze Game!',
    html: `
      <h1>Welcome, ${username}!</h1>
      <p>Thank you for joining Maze Game. Get ready to test your problem-solving skills!</p>
      <p>Start playing now and climb the leaderboards!</p>
      <a href="${process.env.FRONTEND_URL}" style="background: #7378c5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Playing</a>
    `,
  }),

  achievementUnlocked: (username, achievement) => ({
    subject: `Achievement Unlocked: ${achievement.name}!`,
    html: `
      <h1>Congratulations, ${username}!</h1>
      <div style="text-align: center; padding: 20px; background: #f0f0f0;">
        <span style="font-size: 64px;">${achievement.icon}</span>
        <h2>${achievement.name}</h2>
        <p>${achievement.description}</p>
        <p style="color: #7378c5; font-weight: bold;">+${achievement.points} points</p>
      </div>
    `,
  }),

  leaderboardRank: (username, rank, score) => ({
    subject: `You're Ranked #${rank} on the Leaderboard!`,
    html: `
      <h1>Amazing, ${username}!</h1>
      <p>You've reached rank #${rank} on the global leaderboard with a score of ${score}!</p>
      <p>Keep playing to maintain your position!</p>
      <a href="${process.env.FRONTEND_URL}/leaderboard">View Leaderboard</a>
    `,
  }),

  dailyChallenge: (username) => ({
    subject: 'New Daily Challenge Available!',
    html: `
      <h1>Hey ${username}!</h1>
      <p>Today's daily challenge is ready. Complete it to earn bonus points!</p>
      <a href="${process.env.FRONTEND_URL}/challenges" style="background: #7378c5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Take Challenge</a>
    `,
  }),

  friendRequest: (username, friendName) => ({
    subject: `${friendName} sent you a friend request`,
    html: `
      <h1>Hi ${username}!</h1>
      <p>${friendName} wants to be your friend on Maze Game.</p>
      <a href="${process.env.FRONTEND_URL}/friends">View Request</a>
    `,
  }),

  tournamentReminder: (username, tournament) => ({
    subject: `Tournament "${tournament.name}" starts soon!`,
    html: `
      <h1>Get Ready, ${username}!</h1>
      <p>The tournament "${tournament.name}" starts in 24 hours.</p>
      <p>Make sure you're prepared to compete!</p>
      <a href="${process.env.FRONTEND_URL}/tournaments/${tournament.id}">View Tournament</a>
    `,
  }),
};

// Send email function
const sendEmail = async ({ to, subject, text, html, template, data }) => {
  try {
    let mailOptions = {
      from: process.env.EMAIL_FROM || '"Maze Game" <noreply@mazegame.com>',
      to,
      subject,
      text,
      html,
    };

    // Use template if provided
    if (template && templates[template]) {
      const templateContent = templates[template](...(data || []));
      mailOptions.subject = templateContent.subject;
      mailOptions.html = templateContent.html;
    }

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent: ${info.messageId}`);

    // Log preview URL in development
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
};

// Bulk email function
const sendBulkEmail = async (recipients, emailOptions) => {
  const promises = recipients.map(recipient =>
    sendEmail({ ...emailOptions, to: recipient })
  );

  try {
    await Promise.allSettled(promises);
    logger.info(`Bulk email sent to ${recipients.length} recipients`);
  } catch (error) {
    logger.error('Bulk email failed:', error);
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  templates,
};
