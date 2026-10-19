-- ========================================================
-- ICT251 Activity 4 - Question 2: Personal Recipe Card
-- Resource: recipes | Database Table: recipes
-- ========================================================

-- Create database if not exists (for MySQL/MariaDB)
CREATE DATABASE IF NOT EXISTS campus_crud;
USE campus_crud;

-- Drop table if exists to start fresh during setup
DROP TABLE IF EXISTS recipes;

-- Create recipes table
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

-- ========================================================
-- Populate at least 10 sample records
-- ========================================================

INSERT INTO recipes (title, cuisine, category, prep_time_minutes, cook_time_minutes, servings, ingredients, instructions, difficulty) VALUES
(
    'Zambian Nshima with Village Chicken & Rape',
    'Zambian',
    'Main Course',
    20,
    60,
    4,
    '4 cups cornmeal (roller or breakfast meal), 6 cups water, 1 whole free-range chicken cut into pieces, 2 bunches rape greens, 2 diced tomatoes, 1 diced onion, 2 tbsp cooking oil, salt to taste',
    '1. Bring water to boil and gradually whisk in cornmeal until thick; stir vigorously (ukuteya) and let simmer covered for 15 minutes before final paddling (ukukosa).\n2. Brown chicken in oil with onions and tomatoes; add water and simmer until tender.\n3. Fry chopped rape greens with sliced tomatoes and onions until wilted.\n4. Serve piping hot nshima alongside savory chicken and seasoned greens.',
    'Medium'
),
(
    'Authentic Spaghetti Carbonara',
    'Italian',
    'Dinner',
    15,
    15,
    2,
    '200g spaghetti, 100g guanciale or pancetta cubed, 2 large egg yolks + 1 whole egg, 50g freshly grated Pecorino Romano cheese, freshly cracked black pepper, pinch of salt',
    '1. Cook spaghetti in salted boiling water until al dente.\n2. In a skillet, fry guanciale until golden and crispy; reserve fat.\n3. In a bowl, whisk eggs with pecorino and plenty of black pepper.\n4. Transfer hot pasta to skillet off the heat, mix in egg mixture with a splash of pasta cooking water until silky and creamy. Serve immediately.',
    'Medium'
),
(
    'Classic Chicken Tikka Masala',
    'Indian',
    'Dinner',
    30,
    35,
    4,
    '600g boneless chicken thigh chunks, 1 cup Greek yogurt, 2 tbsp garam masala, 1 tbsp ginger-garlic paste, 1 can crushed tomatoes, 1 cup heavy cream, 1 sliced onion, 2 tbsp butter, fresh cilantro',
    '1. Marinate chicken in yogurt and spices for 20 minutes; sear in skillet until charred.\n2. In a saucepan, sauté onions and ginger-garlic paste in butter.\n3. Add crushed tomatoes and spices; simmer 15 minutes.\n4. Stir in cream and seared chicken; simmer for 10 minutes. Garnish with fresh cilantro and serve with warm naan.',
    'Hard'
),
(
    'Fluffy Buttermilk Pancakes',
    'American',
    'Breakfast',
    10,
    15,
    4,
    '2 cups all-purpose flour, 2 tbsp sugar, 2 tsp baking powder, 1/2 tsp salt, 2 large eggs, 1 3/4 cups buttermilk, 1/4 cup melted butter, maple syrup and fresh berries for serving',
    '1. Whisk dry ingredients in a large bowl.\n2. In another bowl, combine eggs, buttermilk, and melted butter.\n3. Fold wet ingredients into dry until just combined (leave small lumps).\n4. Pour 1/4 cup batter per pancake onto a hot greased griddle. Flip when bubbles burst. Serve with butter and maple syrup.',
    'Easy'
),
(
    'Crispy Street-Style Beef Tacos',
    'Mexican',
    'Lunch',
    15,
    20,
    4,
    '500g ground beef, 8 small corn tortillas, 1 diced red onion, 1/2 cup fresh cilantro, 1 tbsp ground cumin, 1 tbsp chili powder, 2 limes cut into wedges, salsa verde',
    '1. Brown beef in a skillet over medium-high heat, draining excess grease.\n2. Add cumin, chili powder, salt, and 1/4 cup water; simmer for 5 minutes.\n3. Warm corn tortillas on a dry skillet until pliable.\n4. Double up tortillas, spoon in seasoned beef, top with chopped onion, cilantro, and squeeze fresh lime juice.',
    'Easy'
),
(
    'Traditional Japanese Chicken Teriyaki',
    'Japanese',
    'Main Course',
    15,
    20,
    3,
    '500g chicken thighs skin-on, 3 tbsp soy sauce, 3 tbsp mirin, 2 tbsp sake or dry white wine, 1 tbsp sugar, 1 tsp grated ginger, steamed white rice, toasted sesame seeds, sliced green onions',
    '1. Prick chicken skin with fork; pan-fry skin-side down until crispy and golden, then flip.\n2. Mix soy sauce, mirin, sake, and sugar in a small bowl.\n3. Pour sauce over chicken; simmer and baste until sauce thickens to a glossy glaze.\n4. Slice chicken, serve over rice, drizzle remaining glaze, and garnish with sesame seeds and scallions.',
    'Medium'
),
(
    'Artisanal Margherita Pizza',
    'Italian',
    'Dinner',
    40,
    12,
    3,
    '1 homemade pizza dough ball, 1/2 cup crushed San Marzano tomato puree, 150g fresh mozzarella drained and sliced, fresh basil leaves, 2 tbsp extra virgin olive oil, sea salt',
    '1. Preheat oven with pizza stone at maximum temperature (250°C / 480°F).\n2. Stretch dough by hand into a 12-inch circle on parchment paper.\n3. Spread tomato puree lightly over dough, leaving 1-inch crust border.\n4. Distribute mozzarella slices and drizzle olive oil.\n5. Bake 8-10 minutes until crust is blistered; scatter fresh basil leaves right after removing from oven.',
    'Medium'
),
(
    'Mediterranean Greek Salad with Feta',
    'Greek',
    'Salad / Appetizer',
    15,
    0,
    4,
    '4 ripe vine tomatoes cut in wedges, 1 English cucumber sliced, 1/2 red onion thinly sliced, 1 green bell pepper sliced, 150g block Greek feta cheese, 1/2 cup Kalamata olives, 3 tbsp extra virgin olive oil, 1 tbsp red wine vinegar, 1 tsp dried oregano',
    '1. In a large serving bowl, combine tomatoes, cucumber, bell pepper, red onion, and Kalamata olives.\n2. In a small bowl, whisk olive oil, red wine vinegar, and a pinch of salt.\n3. Drizzle vinaigrette over vegetables and toss gently.\n4. Place block of feta on top, sprinkle with dried oregano and fresh cracked pepper. Serve chilled.',
    'Easy'
),
(
    'Thai Fragrant Green Chicken Curry',
    'Thai',
    'Dinner',
    20,
    25,
    4,
    '500g sliced chicken breast, 3 tbsp Thai green curry paste, 400ml coconut milk, 1 cup chicken broth, 1 cup sliced bamboo shoots, 1/2 cup Thai basil leaves, 2 kaffir lime leaves torn, 1 tbsp fish sauce, 1 tsp palm sugar',
    '1. Heat 3 tbsp of coconut cream in a wok until oil separates; stir in green curry paste and fry until aromatic.\n2. Add sliced chicken breast and cook for 3 minutes.\n3. Pour in remaining coconut milk and broth; bring to a simmer.\n4. Add bamboo shoots, lime leaves, fish sauce, and sugar; simmer for 10 minutes.\n5. Stir in Thai basil leaves off the heat and serve immediately with jasmine rice.',
    'Medium'
),
(
    'Warm Belgian Chocolate Lava Cake',
    'French',
    'Dessert',
    15,
    12,
    2,
    '100g dark chocolate (70%), 100g unsalted butter, 2 eggs + 2 egg yolks, 50g granulated sugar, 25g all-purpose flour, cocoa powder for dusting, vanilla ice cream',
    '1. Melt dark chocolate and butter together in a heatproof bowl over simmering water; cool slightly.\n2. Whisk eggs, yolks, and sugar until pale and frothy.\n3. Fold melted chocolate mixture and flour into eggs until smooth.\n4. Pour into 2 buttered, cocoa-dusted ramekins.\n5. Bake at 200°C (400°F) for exactly 11-12 minutes until edges are firm but center is soft. Invert onto plate and serve with vanilla ice cream.',
    'Hard'
);
