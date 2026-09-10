/** Osnovni tipi urnika. Dan je 0–4 (ponedeljek–petek), ura pa niz "HH:MM". */

export interface Person {
	id: string;
	name: string;
	note?: string;
	color: string;
	/**
	 * Odrasli, ki so na listu samo za vednost: brez svojega pasu, čez vso širino
	 * in pod ostalimi. Organizacija teče po otrocih, zato jim ozadje ne sme konkurirati.
	 */
	background?: boolean;
}

export interface Activity {
	/** Id-ji oseb; več kot eden pomeni skupno dejavnost z deljenim barvnim robom. */
	people: string[];
	name: string;
	day: number;
	start: string;
	end: string;
	where?: string;
	driver?: string;
	/** Minute poti tja, pred začetkom; črtkan blok "kdaj oditi". */
	lead?: number;
	/** Minute poti nazaj, po koncu; črtkan blok "kdaj doma". */
	back?: number;
}

export interface Schedule {
	people: Person[];
	activities: Activity[];
}
