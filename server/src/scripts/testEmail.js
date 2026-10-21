import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifySmtpConnection, sendTestEmail, isEmailConfigured } from '../services/emailService.js';

// Load environment variables from server root .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  console.log('====================================================');
  console.log('Santosh Hair Art — Gmail Email Configuration Verifier');
  console.log('====================================================\n');

  console.log('Checking environment configuration...');
  console.log(`GMAIL_USER: ${process.env.GMAIL_USER ? process.env.GMAIL_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '[NOT SET]'}`);
  console.log(`GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '******** (configured)' : '[NOT SET]'}`);
  console.log(`BARBER_OWNER_EMAIL: ${process.env.BARBER_OWNER_EMAIL || '[NOT SET]'}\n`);

  if (!isEmailConfigured()) {
    console.warn('⚠️  Gmail SMTP is NOT fully configured or using default placeholders.');
    console.warn('Please generate a 16-character Google App Password and update server/.env:');
    console.warn('  GMAIL_USER=yourbusiness@gmail.com');
    console.warn('  GMAIL_APP_PASSWORD=your_16_character_app_password\n');
    process.exit(1);
  }

  console.log('Connecting to Gmail SMTP server (smtp.gmail.com:465/587)...');
  const verifyResult = await verifySmtpConnection();

  if (!verifyResult.success) {
    console.error('❌ SMTP Connection Failed!');
    console.error('Error Details:', verifyResult.error);
    console.error('\nTroubleshooting Tips:');
    console.error('1. Ensure 2-Step Verification is enabled on your Google Account.');
    console.error('2. Generate a dedicated App Password from: https://myaccount.google.com/apppasswords');
    console.error('3. Make sure GMAIL_APP_PASSWORD is the 16-character code without spaces.');
    process.exit(1);
  }

  console.log('✅ SMTP Connection & Authentication Successful!\n');

  // Check if --send flag was provided
  const args = process.argv.slice(2);
  const sendIdx = args.indexOf('--send');

  if (sendIdx !== -1) {
    const targetRecipient = args[sendIdx + 1] && !args[sendIdx + 1].startsWith('--')
      ? args[sendIdx + 1]
      : process.env.BARBER_OWNER_EMAIL || process.env.GMAIL_USER;

    console.log(`Sending sample test booking email to: ${targetRecipient}...`);
    const sendResult = await sendTestEmail(targetRecipient);

    if (sendResult.success) {
      console.log(`✅ Test email sent successfully! (Message ID: ${sendResult.messageId || 'OK'})`);
      console.log(`Please check the inbox of: ${targetRecipient}`);
    } else {
      console.error('❌ Failed to dispatch test email:', sendResult.error);
      process.exit(1);
    }
  } else {
    console.log('💡 Tip: To send a real test email to verify inbox delivery, run:');
    console.log('   npm run test:email -- --send your_email@gmail.com\n');
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
