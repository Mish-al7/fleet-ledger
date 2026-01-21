import middleware from "next-auth/middleware";

export default middleware;
export const proxy = middleware;

export const config = {
    matcher: [
        '/admin/:path*',
        '/dashboard/:path*',
    ]
};
