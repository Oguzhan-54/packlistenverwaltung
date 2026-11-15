async function packlistenLaden() {
    const antwort = await fetch('/api/packlisten');
    const packlisten = await antwort.json(); //Antwort in ein Array mit einem Objekt pro Packliste

    const container = document.getElementById('container-packlisten');
    container.innerHTML = '';

    //Jede Packliste durchgehen und auf der Seite anzeigen
    for (const packliste of packlisten) {
        const eintrag = document.createElement('div');
        const link = document.createElement('a');

        link.href = 'packliste.html?id=' + packliste.packlisteId;
        link.textContent = packliste.name + ', ' + packliste.jobnummer + ', ' + packliste.startDatum + ', ' + packliste.endDatum + ', ' + packliste.status;

        eintrag.appendChild(link); 
        container.appendChild(eintrag);
    }
}
packlistenLaden();