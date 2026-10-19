// ========================================================
// ICT251 Activity 4 - Database Connection Module
// Supports MySQL (mysql2/promise) as requested in assignment,
// with built-in auto-fallback to SQLite (node:sqlite) so the app
// runs instantly even if local MySQL/XAMPP service is not started.
// ========================================================

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DB_DRIVER = (process.env.DB_DRIVER || 'auto').toLowerCase();
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'campus_crud';

let activeDriver = 'mysql';
let mysqlPool = null;
let sqliteDb = null;

// Initialize Database Connection
async function initDatabase() {
    // If explicitly configured for SQLite
    if (DB_DRIVER === 'sqlite') {
        initSqlite();
        return;
    }

    // Try MySQL first
    try {
        const mysql = require('mysql2/promise');

        // First test connection without database to auto-create database if needed
        const connection = await mysql.createConnection({
            host: DB_HOST,
            port: DB_PORT,
            user: DB_USER,
            password: DB_PASSWORD
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
        await connection.end();

        // Create connection pool pointing to target database
        mysqlPool = mysql.createPool({
            host: DB_HOST,
            port: DB_PORT,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            dateStrings: true
        });

        // Test connection
        const testConn = await mysqlPool.getConnection();
        testConn.release();

        activeDriver = 'mysql';
        console.log(`[Database] Connected to MySQL database "${DB_NAME}" at ${DB_HOST}:${DB_PORT}`);

        // Ensure recipes table exists in MySQL
        await ensureMysqlTable();

    } catch (err) {
        if (DB_DRIVER === 'mysql') {
            console.error('[Database] Failed to connect to MySQL:', err.message);
            throw err;
        }

        console.warn(`[Database] MySQL not reachable on ${DB_HOST}:${DB_PORT} (${err.code || err.message}).`);
        console.log('[Database] Automatically falling back to built-in SQLite engine so you can test immediately...');
        initSqlite();
    }
}

// Ensure table exists in MySQL
async function ensureMysqlTable() {
    try {
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS recipes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                cuisine VARCHAR(100) NOT NULL,
                category VARCHAR(60) NOT NULL,
                prep_time_minutes INT NOT NULL,
                cook_time_minutes INT NOT NULL,
                servings INT NOT NULL,
                ingredients TEXT NOT NULL,
                instructions TEXT NOT NULL,
                difficulty VARCHAR(20) NOT NULL DEFAULT 'Medium',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `;
        await mysqlPool.query(createTableSql);

        // Check if sample records exist
        const [rows] = await mysqlPool.query('SELECT COUNT(*) as count FROM recipes');
        if (rows[0].count === 0) {
            console.log('[Database] Seeding 10 sample recipe records into MySQL...');
            await seedDatabaseMysql();
        }
    } catch (err) {
        console.error('[Database] Error checking MySQL tables:', err.message);
    }
}

// Initialize SQLite fallback using Node.js 22+ built-in node:sqlite
function initSqlite() {
    activeDriver = 'sqlite';
    const { DatabaseSync } = require('node:sqlite');
    const dbPath = path.join(__dirname, `${DB_NAME}.sqlite`);
    sqliteDb = new DatabaseSync(dbPath);

    // Create table for SQLite
    sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            cuisine TEXT NOT NULL,
            category TEXT NOT NULL,
            prep_time_minutes INTEGER NOT NULL,
            cook_time_minutes INTEGER NOT NULL,
            servings INTEGER NOT NULL,
            ingredients TEXT NOT NULL,
            instructions TEXT NOT NULL,
            difficulty TEXT NOT NULL DEFAULT 'Medium',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Check count and seed if empty
    const countStmt = sqliteDb.prepare('SELECT COUNT(*) as count FROM recipes');
    const countRow = countStmt.get();
    if (countRow.count === 0) {
        console.log('[Database] Seeding 10 sample recipe records into SQLite...');
        seedDatabaseSqlite();
    }

    console.log(`[Database] Active database: SQLite (${dbPath})`);
}

// Seed 10 sample records for MySQL
async function seedDatabaseMysql() {
    const samples = getSampleRecipes();
    for (const r of samples) {
        await mysqlPool.query(
            `INSERT INTO recipes (title, cuisine, category, prep_time_minutes, cook_time_minutes, servings, ingredients, instructions, difficulty)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [r.title, r.cuisine, r.category, r.prep_time_minutes, r.cook_time_minutes, r.servings, r.ingredients, r.instructions, r.difficulty]
        );
    }
}

// Seed 10 sample records for SQLite
function seedDatabaseSqlite() {
    const samples = getSampleRecipes();
    const insertStmt = sqliteDb.prepare(`
        INSERT INTO recipes (title, cuisine, category, prep_time_minutes, cook_time_minutes, servings, ingredients, instructions, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of samples) {
        insertStmt.run(r.title, r.cuisine, r.category, r.prep_time_minutes, r.cook_time_minutes, r.servings, r.ingredients, r.instructions, r.difficulty);
    }
}

// Unified Query Function
async function query(sql, params = []) {
    if (activeDriver === 'mysql' && mysqlPool) {
        const [result] = await mysqlPool.query(sql, params);
        if (Array.isArray(result)) {
            return { rows: result };
        }
        return {
            rows: [],
            insertId: result.insertId,
            affectedRows: result.affectedRows
        };
    } else if (activeDriver === 'sqlite' && sqliteDb) {
        const trimmedSql = sql.trim();
        const isSelect = /^SELECT/i.test(trimmedSql);

        if (isSelect) {
            const stmt = sqliteDb.prepare(sql);
            const rows = stmt.all(...params);
            return { rows };
        } else {
            // For updates, ensure updated_at is refreshed if modifying
            let executeSql = sql;
            if (/^UPDATE\s+recipes/i.test(executeSql) && !executeSql.includes('updated_at =')) {
                executeSql = executeSql.replace(/SET\s+/i, 'SET updated_at = CURRENT_TIMESTAMP, ');
            }
            const stmt = sqliteDb.prepare(executeSql);
            const info = stmt.run(...params);
            return {
                rows: [],
                insertId: Number(info.lastInsertRowid),
                affectedRows: info.changes
            };
        }
    } else {
        throw new Error('Database is not initialized.');
    }
}

// 10 Sample Recipes Dataset
function getSampleRecipes() {
    return [
        {
            title: 'Zambian Nshima with Village Chicken & Rape',
            cuisine: 'Zambian',
            category: 'Main Course',
            prep_time_minutes: 20,
            cook_time_minutes: 60,
            servings: 4,
            ingredients: '4 cups cornmeal (roller or breakfast meal), 6 cups water, 1 whole free-range chicken cut into pieces, 2 bunches rape greens, 2 diced tomatoes, 1 diced onion, 2 tbsp cooking oil, salt to taste',
            instructions: '1. Bring water to boil and gradually whisk in cornmeal until thick; stir vigorously (ukuteya) and let simmer covered for 15 minutes before final paddling (ukukosa).\n2. Brown chicken in oil with onions and tomatoes; add water and simmer until tender.\n3. Fry chopped rape greens with sliced tomatoes and onions until wilted.\n4. Serve piping hot nshima alongside savory chicken and seasoned greens.',
            difficulty: 'Medium'
        },
        {
            title: 'Authentic Spaghetti Carbonara',
            cuisine: 'Italian',
            category: 'Dinner',
            prep_time_minutes: 15,
            cook_time_minutes: 15,
            servings: 2,
            ingredients: '200g spaghetti, 100g guanciale or pancetta cubed, 2 large egg yolks + 1 whole egg, 50g freshly grated Pecorino Romano cheese, freshly cracked black pepper, pinch of salt',
            instructions: '1. Cook spaghetti in salted boiling water until al dente.\n2. In a skillet, fry guanciale until golden and crispy; reserve fat.\n3. In a bowl, whisk eggs with pecorino and plenty of black pepper.\n4. Transfer hot pasta to skillet off the heat, mix in egg mixture with a splash of pasta cooking water until silky and creamy. Serve immediately.',
            difficulty: 'Medium'
        },
        {
            title: 'Classic Chicken Tikka Masala',
            cuisine: 'Indian',
            category: 'Dinner',
            prep_time_minutes: 30,
            cook_time_minutes: 35,
            servings: 4,
            ingredients: '600g boneless chicken thigh chunks, 1 cup Greek yogurt, 2 tbsp garam masala, 1 tbsp ginger-garlic paste, 1 can crushed tomatoes, 1 cup heavy cream, 1 sliced onion, 2 tbsp butter, fresh cilantro',
            instructions: '1. Marinate chicken in yogurt and spices for 20 minutes; sear in skillet until charred.\n2. In a saucepan, sauté onions and ginger-garlic paste in butter.\n3. Add crushed tomatoes and spices; simmer 15 minutes.\n4. Stir in cream and seared chicken; simmer for 10 minutes. Garnish with fresh cilantro and serve with warm naan.',
            difficulty: 'Hard'
        },
        {
            title: 'Fluffy Buttermilk Pancakes',
            cuisine: 'American',
            category: 'Breakfast',
            prep_time_minutes: 10,
            cook_time_minutes: 15,
            servings: 4,
            ingredients: '2 cups all-purpose flour, 2 tbsp sugar, 2 tsp baking powder, 1/2 tsp salt, 2 large eggs, 1 3/4 cups buttermilk, 1/4 cup melted butter, maple syrup and fresh berries for serving',
            instructions: '1. Whisk dry ingredients in a large bowl.\n2. In another bowl, combine eggs, buttermilk, and melted butter.\n3. Fold wet ingredients into dry until just combined (leave small lumps).\n4. Pour 1/4 cup batter per pancake onto a hot greased griddle. Flip when bubbles burst. Serve with butter and maple syrup.',
            difficulty: 'Easy'
        },
        {
            title: 'Crispy Street-Style Beef Tacos',
            cuisine: 'Mexican',
            category: 'Lunch',
            prep_time_minutes: 15,
            cook_time_minutes: 20,
            servings: 4,
            ingredients: '500g ground beef, 8 small corn tortillas, 1 diced red onion, 1/2 cup fresh cilantro, 1 tbsp ground cumin, 1 tbsp chili powder, 2 limes cut into wedges, salsa verde',
            instructions: '1. Brown beef in a skillet over medium-high heat, draining excess grease.\n2. Add cumin, chili powder, salt, and 1/4 cup water; simmer for 5 minutes.\n3. Warm corn tortillas on a dry skillet until pliable.\n4. Double up tortillas, spoon in seasoned beef, top with chopped onion, cilantro, and squeeze fresh lime juice.',
            difficulty: 'Easy'
        },
        {
            title: 'Traditional Japanese Chicken Teriyaki',
            cuisine: 'Japanese',
            category: 'Main Course',
            prep_time_minutes: 15,
            cook_time_minutes: 20,
            servings: 3,
            ingredients: '500g chicken thighs skin-on, 3 tbsp soy sauce, 3 tbsp mirin, 2 tbsp sake or dry white wine, 1 tbsp sugar, 1 tsp grated ginger, steamed white rice, toasted sesame seeds, sliced green onions',
            instructions: '1. Prick chicken skin with fork; pan-fry skin-side down until crispy and golden, then flip.\n2. Mix soy sauce, mirin, sake, and sugar in a small bowl.\n3. Pour sauce over chicken; simmer and baste until sauce thickens to a glossy glaze.\n4. Slice chicken, serve over rice, drizzle remaining glaze, and garnish with sesame seeds and scallions.',
            difficulty: 'Medium'
        },
        {
            title: 'Artisanal Margherita Pizza',
            cuisine: 'Italian',
            category: 'Dinner',
            prep_time_minutes: 40,
            cook_time_minutes: 12,
            servings: 3,
            ingredients: '1 homemade pizza dough ball, 1/2 cup crushed San Marzano tomato puree, 150g fresh mozzarella drained and sliced, fresh basil leaves, 2 tbsp extra virgin olive oil, sea salt',
            instructions: '1. Preheat oven with pizza stone at maximum temperature (250°C / 480°F).\n2. Stretch dough by hand into a 12-inch circle on parchment paper.\n3. Spread tomato puree lightly over dough, leaving 1-inch crust border.\n4. Distribute mozzarella slices and drizzle olive oil.\n5. Bake 8-10 minutes until crust is blistered; scatter fresh basil leaves right after removing from oven.',
            difficulty: 'Medium'
        },
        {
            title: 'Mediterranean Greek Salad with Feta',
            cuisine: 'Greek',
            category: 'Salad',
            prep_time_minutes: 15,
            cook_time_minutes: 0,
            servings: 4,
            ingredients: '4 ripe vine tomatoes cut in wedges, 1 English cucumber sliced, 1/2 red onion thinly sliced, 1 green bell pepper sliced, 150g block Greek feta cheese, 1/2 cup Kalamata olives, 3 tbsp extra virgin olive oil, 1 tbsp red wine vinegar, 1 tsp dried oregano',
            instructions: '1. In a large serving bowl, combine tomatoes, cucumber, bell pepper, red onion, and Kalamata olives.\n2. In a small bowl, whisk olive oil, red wine vinegar, and a pinch of salt.\n3. Drizzle vinaigrette over vegetables and toss gently.\n4. Place block of feta on top, sprinkle with dried oregano and fresh cracked pepper. Serve chilled.',
            difficulty: 'Easy'
        },
        {
            title: 'Thai Fragrant Green Chicken Curry',
            cuisine: 'Thai',
            category: 'Dinner',
            prep_time_minutes: 20,
            cook_time_minutes: 25,
            servings: 4,
            ingredients: '500g sliced chicken breast, 3 tbsp Thai green curry paste, 400ml coconut milk, 1 cup chicken broth, 1 cup sliced bamboo shoots, 1/2 cup Thai basil leaves, 2 kaffir lime leaves torn, 1 tbsp fish sauce, 1 tsp palm sugar',
            instructions: '1. Heat 3 tbsp of coconut cream in a wok until oil separates; stir in green curry paste and fry until aromatic.\n2. Add sliced chicken breast and cook for 3 minutes.\n3. Pour in remaining coconut milk and broth; bring to a simmer.\n4. Add bamboo shoots, lime leaves, fish sauce, and sugar; simmer for 10 minutes.\n5. Stir in Thai basil leaves off the heat and serve immediately with jasmine rice.',
            difficulty: 'Medium'
        },
        {
            title: 'Warm Belgian Chocolate Lava Cake',
            cuisine: 'French',
            category: 'Dessert',
            prep_time_minutes: 15,
            cook_time_minutes: 12,
            servings: 2,
            ingredients: '100g dark chocolate (70%), 100g unsalted butter, 2 eggs + 2 egg yolks, 50g granulated sugar, 25g all-purpose flour, cocoa powder for dusting, vanilla ice cream',
            instructions: '1. Melt dark chocolate and butter together in a heatproof bowl over simmering water; cool slightly.\n2. Whisk eggs, yolks, and sugar until pale and frothy.\n3. Fold melted chocolate mixture and flour into eggs until smooth.\n4. Pour into 2 buttered, cocoa-dusted ramekins.\n5. Bake at 200°C (400°F) for exactly 11-12 minutes until edges are firm but center is soft. Invert onto plate and serve with vanilla ice cream.',
            difficulty: 'Hard'
        }
    ];
}

module.exports = {
    initDatabase,
    query,
    getActiveDriver: () => activeDriver
};
