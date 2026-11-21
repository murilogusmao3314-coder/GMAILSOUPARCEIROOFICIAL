import { htmlResponse } from "../lib-page";
export const dynamic = "force-static";
export function GET() { return htmlResponse("index"); }
