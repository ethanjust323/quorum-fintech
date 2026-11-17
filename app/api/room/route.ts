import { env } from 'cloudflare:workers';
import { handle } from '../../../lib/quorum-service';
export const dynamic='force-dynamic';
export function GET(request:Request){return handle(request,env.DB!)}
export function POST(request:Request){return handle(request,env.DB!)}
