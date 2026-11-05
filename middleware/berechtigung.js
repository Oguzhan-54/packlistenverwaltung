function eingeloggt(req, res, next) {
    if (!req.session.benutzer) {
        return res.status(401).json({ fehler: 'Nicht eingeloggt' });
    }
    next();
}

function admin(req, res, next) {
    if (req.session.benutzer.rolle !== 'Admin') {
        return res.status(403).json({ fehler: 'Keine Berechtigung' });
    }
    next();
}

module.exports = { eingeloggt, admin };