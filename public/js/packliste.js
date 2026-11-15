const parameter = new URLSearchParams(window.location.search); //URL durchsuchen
const packlisteId = parameter.get('id'); //id aus der URL in eine const packen

async function materialLaden() {
    const antwort = await fetch('/api/packlisten/' +packlisteId + '/material');
    const materialien = await antwort.json(); //JSON Text auspacken und in eine Liste ablegen

    const container = document.getElementById('container-material');
    container.innerHTML = '';

    //Jedes Material durchgehen und auf der Seite anzeigen
    for (const material of materialien) {
        const eintrag = document.createElement('div');
        eintrag.textContent = material.bezeichnung + ' Gepackt: ' + material.mengeGepackt + ' Soll: ' + material.mengeSoll;
        container.appendChild(eintrag);
    }
}
materialLaden();

async function boxenLaden() {
    const antwort = await fetch('/api/packlisten/' + packlisteId + '/box'); //Server nach den Boxen abfragen
    const boxen = await antwort.json();

    const container = document.getElementById('container-boxen');
    container.innerHTML = '';

    //Jede Box durchgehen
    for (const box of boxen) {
        const boxEintrag = document.createElement('div');
        boxEintrag.textContent = box.name; //Box Name in das leere Div schreiben

        //Jedes Material in dieser Box durchgehen
        for (const inhalt of box.inhalt) {
            const zeile = document.createElement('div');
            zeile.textContent = inhalt.bezeichnung + ': ' + inhalt.mengeGepackt;
            boxEintrag.appendChild(zeile);
        }

        //Fertige Box zusammenfügen und anzeigen
        container.appendChild(boxEintrag);
    }
}
boxenLaden();