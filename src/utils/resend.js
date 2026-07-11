import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a welcome email to a new user.
 * @param {string} to - The recipient's email address.
 * @param {string} name - The recipient's name.
 * @returns {Promise} - Resolves when the email is sent.
 */
export const sendWelcomeEmail = async (to, name) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Active Fleet <onboarding@resend.dev>', // Update to your domain in production
      to: [to],
      subject: 'Welcome to Active Fleet',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1a202c; border-radius: 12px; background-color: #ffffff; border: 1px solid #e2e8f0;">
          <h1 style="color: #2d3748; font-size: 28px; margin-bottom: 24px; font-weight: 700; text-align: center;">Welcome to Active Fleet, ${name}!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 24px;">
            We're thrilled to have you on board! Your account has been successfully created and is currently <strong>pending approval</strong> from our administration team.
          </p>
          <div style="background-color: #f7fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #edf2f7;">
            <p style="margin: 0; font-size: 14px; color: #718096; font-style: italic;">
              Once approved, you'll be able to manage your fleet, track services, and streamline your operations with ease.
            </p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 32px;">
            If you have any questions, feel free to reply to this email. We're here to help!
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 32px;">
          <p style="font-size: 14px; color: #a0aec0; text-align: center; margin-bottom: 0;">
            &copy; ${new Date().getFullYear()} Active Fleet. All rights reserved.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Resend Exception:', err);
    return { success: false, error: err.message };
  }
};

export default resend;
