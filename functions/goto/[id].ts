import { writeUrl } from '../../src/lib/schedule/url';

interface Env {
	URNIK_LINKS: { get(key: string): Promise<string | null> };
}

interface Context {
	params: { id: string | string[] };
	request: Request;
	env: Env;
}

export async function onRequestGet({ params, request, env }: Context): Promise<Response> {
	const id = Array.isArray(params.id) ? params.id[0] : params.id;
	const text = await env.URNIK_LINKS.get(id);
	if (text === null || text.trim() === '') {
		return new Response('Ni take povezave.', { status: 404 });
	}

	const target = new URL(`/${writeUrl(text)}`, request.url);
	return Response.redirect(target.toString(), 302);
}
