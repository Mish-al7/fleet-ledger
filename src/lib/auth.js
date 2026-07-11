import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Company from "@/models/Company";
import bcrypt from "bcryptjs";

const Credentials = typeof CredentialsProvider === 'function' 
    ? CredentialsProvider 
    : CredentialsProvider.default;

export const authOptions = {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                await dbConnect();

                const user = await User.findOne({ email: credentials.email }).populate('company_id');

                if (!user) {
                    throw new Error("No user found with the email");
                }

                if (user.isActive === false) {
                    throw new Error("Account deactivated. Contact an administrator.");
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) {
                    throw new Error("Invalid password");
                }

                // Check company status for non-super admins
                if (user.role !== 'super_admin' && user.company_id) {
                    if (user.company_id.status === 'suspended') {
                        throw new Error("ACCOUNT_SUSPENDED");
                    }
                    if (user.company_id.status === 'pending_approval') {
                        throw new Error("PENDING_APPROVAL");
                    }
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    company_id: user.company_id ? user.company_id._id.toString() : null,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.company_id = user.company_id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.company_id = token.company_id;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: '/auth/signin',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
