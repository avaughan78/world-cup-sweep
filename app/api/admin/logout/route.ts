export async function GET() {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': 'admin_pw=; max-age=0; path=/; SameSite=Strict',
    },
  });
}
