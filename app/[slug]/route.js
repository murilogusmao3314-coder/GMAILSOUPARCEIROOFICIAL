import { htmlResponse, PAGES } from "../../lib-page";
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() { return PAGES.map((slug) => ({ slug })); }
export function GET(_req, { params }) { return htmlResponse(params.slug); }
