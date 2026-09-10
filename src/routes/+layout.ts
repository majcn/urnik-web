/**
 * Stanje je v naslovu, strežnika ni: stran je čista SPA, ki se prerendera v
 * statične datoteke. Brez SSR ni neujemanja ob hidraciji — strežnik naslova s
 * parametrom ne vidi in bi vedno izrisal vzorec, ki bi ga odjemalec takoj zamenjal.
 */
export const prerender = true;
export const ssr = false;
