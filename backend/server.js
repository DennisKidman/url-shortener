import express from 'express';
import { customAlphabet } from 'nanoid';
import { Sequelize, DataTypes } from 'sequelize';
import cors from 'cors';

const app = express();
const port = 4000;

// Enable CORS
app.use(cors());

// Create Sequelize instance and connect to SQLite database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
});

// Define Link model
const Link = sequelize.define('Link', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    originalUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

// Create table if it doesn't exist
(async () => {
    await Link.sync();
})();

// Middleware to parse JSON body
app.use(express.json());

// Generate a custom nanoid with 4-5 characters
const generateShortId = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 4);

// Endpoint to receive URL and shorten it
app.post('/shorten', async (req, res) => {
    const { url } = req.body;

    // Generate a unique ID for the shortened URL
    const id = generateShortId();

    try {
        // Create a new link record in the database
        const link = await Link.create({
            id,
            originalUrl: url,
        });

        // Return the shortened URL to the user
        res.json({ shortenedUrl: `http://localhost:${port}/${link.id}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to redirect to the original URL
app.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Find the link record in the database
        const link = await Link.findByPk(id);

        if (link) {
            // Redirect to the original URL
            res.redirect(link.originalUrl);
        } else {
            res.status(404).json({ error: 'Link not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
