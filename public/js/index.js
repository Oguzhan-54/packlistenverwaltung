async function loginPruefen() {
    const antwort = await fetch('/api/me');

    //Weiterleiten zur Login Seite wenn Prüfung fehlgeschlagen ist
    if (!antwort.ok) {
        window.location.href = '/login.html';
        return;
    }

    const benutzer = await antwort.json();
    document.getElementById('benutzername').textContent = `${benutzer.vorname} ${benutzer.nachname}`;
}
loginPruefen();

async function packlistenLaden() {
    const antwort = await fetch('/api/packlisten');
    const packlisten = await antwort.json();

    const container = document.getElementById('container-packlisten');
    container.innerHTML = '';

    for (const packliste of packlisten) {
        const eintrag = document.createElement('div');
        eintrag.textContent = packliste.name + ', ' + packliste.jobnummer + ', ' + packliste.startDatum + ', ' + packliste.endDatum + ', ' + packliste.status;
        container.appendChild(eintrag);
    }
}
packlistenLaden();