/** Osnovni tipi urnika. Dan je 0–4 (ponedeljek–petek), ura pa niz "HH:MM". */

export interface Kid {
	id: string;
	name: string;
	note?: string;
	color: string;
}

export interface Activity {
	/** Id-ji otrok; več kot eden pomeni skupno dejavnost z deljenim barvnim robom. */
	kids: string[];
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
	kids: Kid[];
	activities: Activity[];
}
