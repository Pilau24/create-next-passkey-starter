import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ loggedOut: true });
  response.cookies.delete("passkey_session");
  return response;
}
