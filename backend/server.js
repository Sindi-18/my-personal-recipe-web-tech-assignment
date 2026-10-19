// ========================================================
// ICT251 Activity 4 - Question 2: Personal Recipe Card
// Express.js REST API Server
// Endpoints:
//   GET    /api/recipes       -> List all recipes
//   GET    /api/recipes/:id   -> Get one recipe by ID
//   POST   /api/recipes       -> Create a new recipe
//   PUT    /api/recipes/:id   -> Update an existing recipe
//   DELETE /api/recipes/:id   -> Delete a recipe by ID
// ========================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend
app.use(express.json()); // Parse incoming JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static frontend files directly from ../frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        resource: 'recipes',
        driver: db.getActiveDriver(),
        timestamp: new Date().toISOString()
    });
});

// ========================================================
// REST API Endpoints for Resource: recipes
// ========================================================

// 1. GET /api/recipes -> List all records
app.get('/api/recipes', async (req, res) => {
    try {
        const { search, cuisine, difficulty, sort } = req.query;
        let sql = 'SELECT * FROM recipes';
        const params = [];
        const conditions = [];

        if (search) {
            conditions.push('(title LIKE ? OR ingredients LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        if (cuisine) {
            conditions.push('cuisine = ?');
            params.push(cuisine);
        }
        if (difficulty) {
            conditions.push('difficulty = ?');
            params.push(difficulty);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        if (sort === 'oldest') {
            sql += ' ORDER BY id ASC';
        } else {
            sql += ' ORDER BY id DESC'; // Default newest first
        }

        const result = await db.query(sql, params);
        return res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching recipes:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve recipes from database',
            error: err.message
        });
    }
});

// 2. GET /api/recipes/:id -> Get one record
app.get('/api/recipes/:id', async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id, 10);
        if (isNaN(recipeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid recipe ID. ID must be an integer.'
            });
        }

        const result = await db.query('SELECT * FROM recipes WHERE id = ?', [recipeId]);
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Recipe with ID ${recipeId} not found.`
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error fetching recipe by ID:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve recipe details',
            error: err.message
        });
    }
});

// 3. POST /api/recipes -> Create a record
app.post('/api/recipes', async (req, res) => {
    try {
        const {
            title,
            cuisine,
            category,
            prep_time_minutes,
            cook_time_minutes,
            servings,
            ingredients,
            instructions,
            difficulty
        } = req.body;

        // Validation: Required fields
        if (!title || !cuisine || !ingredients || !instructions) {
            return res.status(400).json({
                success: false,
                message: 'Validation error: title, cuisine, ingredients, and instructions are required.'
            });
        }

        const parsedPrep = parseInt(prep_time_minutes, 10) || 0;
        const parsedCook = parseInt(cook_time_minutes, 10) || 0;
        const parsedServings = parseInt(servings, 10) || 1;
        const recipeCategory = category ? category.trim() : 'General';
        const recipeDifficulty = difficulty ? difficulty.trim() : 'Medium';

        const sql = `
            INSERT INTO recipes (title, cuisine, category, prep_time_minutes, cook_time_minutes, servings, ingredients, instructions, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            title.trim(),
            cuisine.trim(),
            recipeCategory,
            parsedPrep,
            parsedCook,
            parsedServings,
            ingredients.trim(),
            instructions.trim(),
            recipeDifficulty
        ];

        const result = await db.query(sql, params);
        const newId = result.insertId;

        // Retrieve newly created record
        const fetchNew = await db.query('SELECT * FROM recipes WHERE id = ?', [newId]);
        const createdRecord = (fetchNew.rows && fetchNew.rows.length > 0) ? fetchNew.rows[0] : { id: newId };

        return res.status(201).json({
            success: true,
            message: 'Recipe created successfully',
            data: createdRecord
        });
    } catch (err) {
        console.error('Error creating recipe:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to create recipe record',
            error: err.message
        });
    }
});

// 4. PUT /api/recipes/:id -> Update a record
app.put('/api/recipes/:id', async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id, 10);
        if (isNaN(recipeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid recipe ID. ID must be an integer.'
            });
        }

        // Verify record exists first
        const check = await db.query('SELECT * FROM recipes WHERE id = ?', [recipeId]);
        if (!check.rows || check.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Cannot update: Recipe with ID ${recipeId} does not exist.`
            });
        }

        const existing = check.rows[0];
        const {
            title,
            cuisine,
            category,
            prep_time_minutes,
            cook_time_minutes,
            servings,
            ingredients,
            instructions,
            difficulty
        } = req.body;

        const updatedTitle = title !== undefined ? title.trim() : existing.title;
        const updatedCuisine = cuisine !== undefined ? cuisine.trim() : existing.cuisine;
        const updatedCategory = category !== undefined ? category.trim() : existing.category;
        const updatedPrep = prep_time_minutes !== undefined ? parseInt(prep_time_minutes, 10) : existing.prep_time_minutes;
        const updatedCook = cook_time_minutes !== undefined ? parseInt(cook_time_minutes, 10) : existing.cook_time_minutes;
        const updatedServings = servings !== undefined ? parseInt(servings, 10) : existing.servings;
        const updatedIngredients = ingredients !== undefined ? ingredients.trim() : existing.ingredients;
        const updatedInstructions = instructions !== undefined ? instructions.trim() : existing.instructions;
        const updatedDifficulty = difficulty !== undefined ? difficulty.trim() : existing.difficulty;

        const sql = `
            UPDATE recipes
            SET title = ?, cuisine = ?, category = ?, prep_time_minutes = ?, cook_time_minutes = ?, servings = ?, ingredients = ?, instructions = ?, difficulty = ?
            WHERE id = ?
        `;
        const params = [
            updatedTitle,
            updatedCuisine,
            updatedCategory,
            updatedPrep,
            updatedCook,
            updatedServings,
            updatedIngredients,
            updatedInstructions,
            updatedDifficulty,
            recipeId
        ];

        await db.query(sql, params);

        // Fetch updated record
        const fetchUpdated = await db.query('SELECT * FROM recipes WHERE id = ?', [recipeId]);

        return res.status(200).json({
            success: true,
            message: `Recipe #${recipeId} updated successfully`,
            data: fetchUpdated.rows[0]
        });
    } catch (err) {
        console.error('Error updating recipe:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to update recipe record',
            error: err.message
        });
    }
});

// 5. DELETE /api/recipes/:id -> Delete a record
app.delete('/api/recipes/:id', async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id, 10);
        if (isNaN(recipeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid recipe ID. ID must be an integer.'
            });
        }

        const check = await db.query('SELECT * FROM recipes WHERE id = ?', [recipeId]);
        if (!check.rows || check.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Cannot delete: Recipe with ID ${recipeId} does not exist.`
            });
        }

        const deletedRecipe = check.rows[0];
        await db.query('DELETE FROM recipes WHERE id = ?', [recipeId]);

        return res.status(200).json({
            success: true,
            message: `Recipe "${deletedRecipe.title}" (ID: ${recipeId}) deleted successfully.`,
            deletedId: recipeId
        });
    } catch (err) {
        console.error('Error deleting recipe:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete recipe record',
            error: err.message
        });
    }
});

// Fallback route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server after database initialization
async function startServer() {
    try {
        await db.initDatabase();
        app.listen(PORT, () => {
            console.log(`====================================================`);
            console.log(`  Personal Recipe Card REST API Server Running`);
            console.log(`  URL: http://localhost:${PORT}`);
            console.log(`  API Base: http://localhost:${PORT}/api/recipes`);
            console.log(`  Active Database Driver: ${db.getActiveDriver().toUpperCase()}`);
            console.log(`====================================================`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
