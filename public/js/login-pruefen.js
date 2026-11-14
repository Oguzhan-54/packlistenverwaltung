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

async function logout() {
    const antwort = await fetch('/api/logout', {
        method: 'POST',
    });

    if (antwort.ok) {
            window.location.href = '/';
    }
}

const logoutBtn = document.getElementById('logout');
logoutBtn.addEventListener('click', logout);