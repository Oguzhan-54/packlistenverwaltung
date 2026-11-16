//Archivierte Packlisten laden
async function archivLaden() {
    //Anfrage an den Server
    const antwort = await fetch('/api/packlisten/archiv');
    const packlisten = await antwort.json(); //Antwort auspacken und in eine Liste schreiben

    const container = document.getElementById('container-packlisten');
    container.innerHTML = '';

    for (const packliste of packlisten) {
        const eintrag = document.createElement('div');

        const link = document.createElement('a');
        link.href = 'packliste.html?id=' + packliste.packlisteId; //Link führt zur Detailseite mit der Nummer der Packliste
        link.textContent = packliste.name + ', ' + packliste.jobnummer + ', ' + packliste.startDatum + ', ' + packliste.endDatum + ', ' + packliste.status;

        eintrag.appendChild(link); //Link in das div packen
        container.appendChild(eintrag); //div auf die Seite packen damit es sichtbar wird
    }
}
archivLaden();