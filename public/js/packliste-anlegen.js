async function packlisteAnlegen() {
    const name = document.getElementById('name').value;
    const jobnummer = document.getElementById('jobnummer').value;
    const startDatum = document.getElementById('startDatum').value;
    const endDatum = document.getElementById('endDatum').value;

    if (!name || !jobnummer || !startDatum || !endDatum) {
        document.getElementById('fehlermeldung').hidden = false;
    }
    else {
        const antwort = await fetch('/api/packlisten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, jobnummer, startDatum, endDatum })
        });
        
        if (antwort.ok) {
            window.location.href = '/';
        }
        else {
            document.getElementById('fehlermeldung').hidden = false;
        }
    }

}

const button = document.getElementById('packliste-anlegen');
button.addEventListener('click', packlisteAnlegen);
