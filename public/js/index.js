async function loginPruefen() {
    const antwort = await fetch('/api/me');

    if (!antwort.ok) {
        window.location.href = '/login.html';
        return;
    }

    const benutzer = await antwort.json();
    document.getElementById('benutzername').textContent = `${benutzer.vorname} ${benutzer.nachname}`;
}

loginPruefen();