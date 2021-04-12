const mongoose = require('mongoose');
/* Import enviroment variables */
require('dotenv').config({ path: 'variables.env' });

/* DB Connection */
const conectarDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log('DB Conectada');
    } catch (error) {
        console.log(error);
        process.exit(1); // Stop the App
    }
}

module.exports = conectarDB;