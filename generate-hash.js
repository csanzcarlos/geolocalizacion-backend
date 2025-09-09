const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPassword = '12345'; // ✅ Usa la contraseña que quieras

bcrypt.hash(myPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error(err);
    } else {
        console.log('Password:', myPassword);
        console.log('Hash:', hash);
    }
});