const form = document.getElementById('login-form');

//Eingaben holen und anmelden
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const passwort = document.getElementById('passwort').value;

    const antwort = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passwort })
    });

    //Prüfen ob erfolgreich, wenn ja dann weiterleiten
    if (antwort.ok) {
        window.location.href = '/';
    }
    else { //Fehlermeldung anzeigen wenn Anmeldung fehlgeschlagen ist
        document.getElementById('fehlermeldung').hidden = false;
    }
});