const parameter = new URLSearchParams(window.location.search);
const packlisteId = parameter.get('id');
console.log(packlisteId);