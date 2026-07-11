import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const initNextAuth = typeof NextAuth === 'function' ? NextAuth : NextAuth.default;
const handler = initNextAuth(authOptions);

export { handler as GET, handler as POST };
